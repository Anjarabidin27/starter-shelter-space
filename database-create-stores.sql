-- ========================================
-- SQL untuk Membuat Tabel Stores
-- Jalankan di Supabase SQL Editor (Cloud > Database > SQL Editor)
-- ========================================

-- Hapus tabel lama jika ada (WARNING: ini akan menghapus semua data!)
DROP TABLE IF EXISTS public.stores CASCADE;

-- Buat tabel stores dengan struktur lengkap
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
  qris_image_url TEXT,
  whatsapp_number TEXT,
  admin_password TEXT DEFAULT '122344566',
  settings_password TEXT DEFAULT '12234566',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat index untuk performa query
CREATE INDEX idx_stores_owner_id ON public.stores(owner_id);

-- Aktifkan Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Users can view own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can update own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON public.stores;

-- Buat RLS Policies
CREATE POLICY "Users can view own stores"
  ON public.stores
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own stores"
  ON public.stores
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own stores"
  ON public.stores
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own stores"
  ON public.stores
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Buat function untuk auto-update timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger untuk updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.stores;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Selesai! Sekarang tabel stores sudah siap digunakan
-- Silakan coba upload QRIS lagi dari halaman Pengaturan Toko
