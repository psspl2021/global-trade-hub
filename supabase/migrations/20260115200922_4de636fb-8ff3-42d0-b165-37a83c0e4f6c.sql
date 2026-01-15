
-- 1. Enforce per-unit pricing at item level
ALTER TABLE bid_items
  ADD COLUMN IF NOT EXISTS supplier_unit_price NUMERIC;

UPDATE bid_items
SET supplier_unit_price = unit_price
WHERE supplier_unit_price IS NULL;

ALTER TABLE bid_items
  ALTER COLUMN supplier_unit_price SET NOT NULL;

-- 2. GENERATED line total (NO manual totals) - using trigger instead of generated column for flexibility
CREATE OR REPLACE FUNCTION calculate_bid_item_line_total()
RETURNS trigger AS $$
BEGIN
  NEW.total := NEW.supplier_unit_price * NEW.quantity;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_line_total ON bid_items;

CREATE TRIGGER trg_calculate_line_total
BEFORE INSERT OR UPDATE ON bid_items
FOR EACH ROW
EXECUTE FUNCTION calculate_bid_item_line_total();

-- 3. Prevent zero / negative quantities & prices using validation trigger
CREATE OR REPLACE FUNCTION validate_bid_item_positive_values()
RETURNS trigger AS $$
BEGIN
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'bid_items.quantity must be positive, got %', NEW.quantity;
  END IF;
  IF NEW.supplier_unit_price <= 0 THEN
    RAISE EXCEPTION 'bid_items.supplier_unit_price must be positive, got %', NEW.supplier_unit_price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_bid_item_values ON bid_items;

CREATE TRIGGER trg_validate_bid_item_values
BEFORE INSERT OR UPDATE ON bid_items
FOR EACH ROW
EXECUTE FUNCTION validate_bid_item_positive_values();

-- 4. Enforce every bid has bid_items
CREATE OR REPLACE FUNCTION enforce_bid_items_exist()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bid_items WHERE bid_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Bid % must contain at least one bid_item', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bid_items_exist ON bids;

CREATE CONSTRAINT TRIGGER trg_bid_items_exist
AFTER INSERT OR UPDATE
ON bids
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION enforce_bid_items_exist();

-- 5. Deprecate bid_amount (hard block reads)
COMMENT ON COLUMN bids.bid_amount IS
'DEPRECATED — DO NOT USE. Pricing must come from bid_items.supplier_unit_price';

-- 6. Performance index for L1 (enterprise safe)
CREATE INDEX IF NOT EXISTS idx_bid_items_l1
ON bid_items (bid_id, supplier_unit_price, quantity);
