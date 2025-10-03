-- Add missing columns to receipts table
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Add missing columns to receipt_items table
ALTER TABLE public.receipt_items
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC,
ADD COLUMN IF NOT EXISTS total_price NUMERIC,
ADD COLUMN IF NOT EXISTS profit NUMERIC;

-- Make product_id nullable in receipt_items (for photocopy and manual entries)
ALTER TABLE public.receipt_items
ALTER COLUMN product_id DROP NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_number ON public.receipts(invoice_number);
CREATE INDEX IF NOT EXISTS idx_receipts_user_created ON public.receipts(user_id, created_at DESC);

-- Update RLS policy for receipt_items to allow null product_id
DROP POLICY IF EXISTS "Users can create receipt items" ON public.receipt_items;

CREATE POLICY "Users can create receipt items" 
ON public.receipt_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.receipts 
    WHERE receipts.id = receipt_items.receipt_id 
    AND receipts.user_id = auth.uid()
  )
);