-- Add debit_note and credit_note to document_type enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'debit_note';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'credit_note';

-- Add reference_invoice_id column to invoices table for linking credit/debit notes to original invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reference_invoice_id uuid REFERENCES public.invoices(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reference_invoice_number text;