-- ========================================
-- REBUILD COMPLETE DATABASE STRUCTURE
-- Jalankan di Supabase SQL Editor
-- ========================================

-- 1. STORES TABLE
DROP TABLE IF EXISTS public.stores CASCADE;

CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  cashier_name TEXT,
  opening_hours TEXT,
  closing_hours TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  whatsapp_number TEXT,
  admin_password TEXT DEFAULT '122344566',
  settings_password TEXT DEFAULT '12234566',
  dana_number TEXT,
  gopay_number TEXT,
  ovo_number TEXT,
  shopeepay_number TEXT,
  ewallet_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stores_owner_id ON public.stores(owner_id);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stores" ON public.stores FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own stores" ON public.stores FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete own stores" ON public.stores FOR DELETE USING (auth.uid() = owner_id);


-- 2. PRODUCTS TABLE
DROP TABLE IF EXISTS public.products CASCADE;

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL,
  sell_price NUMERIC(12, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  code TEXT,
  barcode TEXT,
  category TEXT,
  is_photocopy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_code ON public.products(code);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products can be viewed by anyone (for POS scanning)
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Users can insert products" ON public.products FOR INSERT WITH CHECK (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
);


-- 3. RECEIPTS TABLE
DROP TABLE IF EXISTS public.receipts CASCADE;

CREATE TABLE public.receipts (
  id TEXT PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  profit NUMERIC(12, 2) NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX idx_receipts_store_id ON public.receipts(store_id);
CREATE INDEX idx_receipts_created_at ON public.receipts(created_at DESC);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own receipts" ON public.receipts FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. RECEIPT ITEMS TABLE
DROP TABLE IF EXISTS public.receipt_items CASCADE;

CREATE TABLE public.receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id TEXT NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2),
  total_price NUMERIC(12, 2),
  final_price NUMERIC(12, 2),
  profit NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receipt_items_receipt_id ON public.receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_product_id ON public.receipt_items(product_id);

ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipt items" ON public.receipt_items FOR SELECT USING (
  receipt_id IN (SELECT id FROM public.receipts WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own receipt items" ON public.receipt_items FOR INSERT WITH CHECK (
  receipt_id IN (SELECT id FROM public.receipts WHERE user_id = auth.uid())
);


-- 5. SHOPPING ITEMS TABLE (Shopping List)
DROP TABLE IF EXISTS public.shopping_items CASCADE;

CREATE TABLE public.shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER,
  unit TEXT,
  current_stock INTEGER,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_items_user_id ON public.shopping_items(user_id);
CREATE INDEX idx_shopping_items_store_id ON public.shopping_items(store_id);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shopping items" ON public.shopping_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shopping items" ON public.shopping_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping items" ON public.shopping_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping items" ON public.shopping_items FOR DELETE USING (auth.uid() = user_id);


-- 6. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_stores ON public.stores;
CREATE TRIGGER set_updated_at_stores
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_products ON public.products;
CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_shopping ON public.shopping_items;
CREATE TRIGGER set_updated_at_shopping
  BEFORE UPDATE ON public.shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- 7. INITIAL PRODUCT DATA
-- Note: You'll need to insert your store_id after creating a store
-- For now, we'll insert products without store_id (they'll be linked later)
INSERT INTO public.products (name, cost_price, sell_price, stock, category, is_photocopy) VALUES
  -- Fotocopy Services
  ('Fotocopy A4', 200, 300, 0, 'Fotocopy', true),
  ('Fotocopy A4 Bolak-Balik', 350, 500, 0, 'Fotocopy', true),
  ('Fotocopy A3', 400, 600, 0, 'Fotocopy', true),
  ('Fotocopy Bufalo', 300, 450, 0, 'Fotocopy', true),
  
  -- Alat Tulis
  ('Pulpen Standar', 2000, 3000, 50, 'Alat Tulis', false),
  ('Pensil 2B', 1500, 2500, 100, 'Alat Tulis', false),
  ('Penggaris 30cm', 3000, 5000, 30, 'Alat Tulis', false),
  ('Spidol Boardmarker', 8000, 12000, 25, 'Alat Tulis', false),
  ('Correction Pen/Tip-Ex', 4000, 7000, 15, 'Alat Tulis', false),
  ('Lem Kertas', 3000, 5000, 20, 'Alat Tulis', false),
  ('Gunting', 5000, 8000, 15, 'Alat Tulis', false),
  ('Stapler', 15000, 22000, 10, 'Alat Tulis', false),
  ('Isi Stapler', 2000, 3500, 30, 'Alat Tulis', false),
  ('Perforator', 20000, 30000, 8, 'Alat Tulis', false),
  ('Binder Clip', 2000, 3500, 25, 'Alat Tulis', false),
  ('Paper Clip', 3000, 5000, 20, 'Alat Tulis', false),
  
  -- Kertas
  ('Kertas A4 (Rim)', 45000, 55000, 20, 'Kertas', false),
  ('Kertas HVS A4 (Pack)', 8000, 12000, 40, 'Kertas', false),
  ('Kertas F4', 50000, 60000, 15, 'Kertas', false),
  ('Kertas Bufalo', 60000, 75000, 10, 'Kertas', false),
  ('Kertas Warna (Pack)', 10000, 15000, 20, 'Kertas', false),
  ('Amplop Coklat', 500, 1000, 50, 'Kertas', false),
  ('Amplop Putih', 400, 800, 50, 'Kertas', false),
  
  -- Buku & Note
  ('Buku Tulis 58 Lembar', 5000, 7500, 50, 'Buku', false),
  ('Buku Tulis 38 Lembar', 3000, 5000, 60, 'Buku', false),
  ('Notes Kecil', 2000, 3500, 40, 'Buku', false),
  ('Sticky Notes', 5000, 8000, 25, 'Buku', false),
  ('Buku Gambar A4', 8000, 12000, 20, 'Buku', false),
  
  -- Map & Folder
  ('Map Plastik', 2000, 3500, 30, 'Map & Folder', false),
  ('Stopmap', 1500, 2500, 40, 'Map & Folder', false),
  ('Clear Holder', 3000, 5000, 25, 'Map & Folder', false),
  ('Ordner', 20000, 28000, 15, 'Map & Folder', false)
ON CONFLICT DO NOTHING;


-- ========================================
-- SELESAI!
-- ========================================
-- Database sudah siap digunakan
-- Langkah selanjutnya:
-- 1. Buat toko baru di halaman Pengaturan Toko
-- 2. Produk akan otomatis tersedia untuk toko Anda
-- 3. Mulai gunakan sistem kasir!
