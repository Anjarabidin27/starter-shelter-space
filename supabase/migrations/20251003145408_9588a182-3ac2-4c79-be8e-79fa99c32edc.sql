-- First, drop the policies that reference the columns
DROP POLICY IF EXISTS "Users can create receipt items" ON public.receipt_items;
DROP POLICY IF EXISTS "Users can view receipt items for their receipts" ON public.receipt_items;

-- Drop the existing foreign key constraint
ALTER TABLE public.receipt_items
DROP CONSTRAINT IF EXISTS receipt_items_receipt_id_fkey;

-- Change receipt_items.receipt_id to TEXT first
ALTER TABLE public.receipt_items
ALTER COLUMN receipt_id TYPE TEXT;

-- Change receipts id column from UUID to TEXT
ALTER TABLE public.receipts 
ALTER COLUMN id TYPE TEXT;

-- Drop the default value for id (no more auto UUID)
ALTER TABLE public.receipts
ALTER COLUMN id DROP DEFAULT;

-- Recreate foreign key constraint with both columns as TEXT
ALTER TABLE public.receipt_items
ADD CONSTRAINT receipt_items_receipt_id_fkey 
FOREIGN KEY (receipt_id) 
REFERENCES public.receipts(id) 
ON DELETE CASCADE;

-- Recreate the RLS policies
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

CREATE POLICY "Users can view receipt items for their receipts" 
ON public.receipt_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.receipts 
    WHERE receipts.id = receipt_items.receipt_id 
    AND receipts.user_id = auth.uid()
  )
);