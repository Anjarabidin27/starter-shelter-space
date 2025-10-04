-- ========================================
-- SQL untuk Menambahkan Kolom QRIS Tanpa Hapus Data
-- Script ini AMAN - tidak akan menghapus data yang sudah ada
-- ========================================

-- Cek apakah tabel stores sudah ada
DO $$ 
BEGIN
  -- Jika tabel stores belum ada, buat tabel baru
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stores') THEN
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

    -- Buat index
    CREATE INDEX idx_stores_owner_id ON public.stores(owner_id);

    -- Enable RLS
    ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

    -- Buat policies
    CREATE POLICY "Users can view own stores"
      ON public.stores FOR SELECT
      USING (auth.uid() = owner_id);

    CREATE POLICY "Users can insert own stores"
      ON public.stores FOR INSERT
      WITH CHECK (auth.uid() = owner_id);

    CREATE POLICY "Users can update own stores"
      ON public.stores FOR UPDATE
      USING (auth.uid() = owner_id)
      WITH CHECK (auth.uid() = owner_id);

    CREATE POLICY "Users can delete own stores"
      ON public.stores FOR DELETE
      USING (auth.uid() = owner_id);

    -- Buat trigger untuk updated_at
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.stores
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();

  ELSE
    -- Jika tabel sudah ada, tambahkan kolom qris_image_url jika belum ada
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stores' 
      AND column_name = 'qris_image_url'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN qris_image_url TEXT;
    END IF;

    -- Pastikan kolom lain yang mungkin belum ada juga ditambahkan
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stores' 
      AND column_name = 'bank_name'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN bank_name TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stores' 
      AND column_name = 'bank_account_number'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN bank_account_number TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stores' 
      AND column_name = 'bank_account_holder'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN bank_account_holder TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stores' 
      AND column_name = 'whatsapp_number'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN whatsapp_number TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stores' 
      AND column_name = 'admin_password'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN admin_password TEXT DEFAULT '122344566';
    END IF;

    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stores' 
      AND column_name = 'settings_password'
    ) THEN
      ALTER TABLE public.stores ADD COLUMN settings_password TEXT DEFAULT '12234566';
    END IF;
  END IF;
END $$;

-- Selesai! Script ini sudah menambahkan kolom yang dibutuhkan tanpa menghapus data
