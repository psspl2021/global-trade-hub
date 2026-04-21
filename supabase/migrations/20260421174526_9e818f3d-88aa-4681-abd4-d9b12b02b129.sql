DELETE FROM public.export_documents
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY purchase_order_id, document_type ORDER BY generated_at DESC) AS rn
    FROM public.export_documents
  ) r WHERE rn > 1
);