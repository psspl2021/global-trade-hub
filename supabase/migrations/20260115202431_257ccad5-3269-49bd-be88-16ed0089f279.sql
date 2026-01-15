-- 1. Ensure total column EXISTS (mandatory)
ALTER TABLE bid_items
  ADD COLUMN IF NOT EXISTS total NUMERIC;

-- 2. Merged validation + calculation trigger (atomic & deterministic)
CREATE OR REPLACE FUNCTION validate_and_calculate_bid_item()
RETURNS trigger AS $$
BEGIN
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'bid_items.quantity must be positive, got %', NEW.quantity;
  END IF;

  IF NEW.supplier_unit_price <= 0 THEN
    RAISE EXCEPTION 'bid_items.supplier_unit_price must be positive, got %', NEW.supplier_unit_price;
  END IF;

  NEW.total := NEW.supplier_unit_price * NEW.quantity;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_bid_item_values ON bid_items;
DROP TRIGGER IF EXISTS trg_calculate_line_total ON bid_items;

CREATE TRIGGER trg_validate_and_calculate
BEFORE INSERT OR UPDATE ON bid_items
FOR EACH ROW
EXECUTE FUNCTION validate_and_calculate_bid_item();

-- 3. Optimal L1 index (correct & minimal)
DROP INDEX IF EXISTS idx_bid_items_l1;

CREATE INDEX IF NOT EXISTS idx_bid_items_l1
ON bid_items (bid_id, supplier_unit_price)
WHERE quantity > 0;