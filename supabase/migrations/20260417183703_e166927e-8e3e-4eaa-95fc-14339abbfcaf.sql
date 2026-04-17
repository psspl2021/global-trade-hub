DELETE FROM public.purchase_orders
WHERE buyer_company_id = '1f946c16-1d93-4046-94ba-904f42ec5e75'
  AND po_number IN ('PO-DEMO-001','PO-DEMO-002','PO-DEMO-003','PO-DEMO-004');

UPDATE public.purchase_orders
SET created_by = 'd17e41b8-c1b6-4419-a0c2-34f594bad8b2'
WHERE buyer_company_id = '1f946c16-1d93-4046-94ba-904f42ec5e75'
  AND po_number = 'PO-PSSPL40-2025-26'
  AND created_by IS NULL;