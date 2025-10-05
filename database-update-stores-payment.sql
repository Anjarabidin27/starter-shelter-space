-- ========================================
-- SQL Query untuk Update Stores Table
-- Jalankan query ini di Supabase SQL Editor
-- ========================================

-- Tambahkan field pembayaran dan operasional ke tabel stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS opening_hours TEXT,
ADD COLUMN IF NOT EXISTS closing_hours TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
ADD COLUMN IF NOT EXISTS qris_image_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT '122344566',
ADD COLUMN IF NOT EXISTS settings_password TEXT DEFAULT '12234566';

-- Catatan penting:
-- - Gambar QRIS disimpan di Supabase Storage (bucket: store-assets, folder: qris/)
-- - URL QRIS disimpan di localStorage browser dengan key: qrisUrl:{store_id}
-- - Sistem ini menghindari penyimpanan data base64 yang besar di database
-- - Upload QRIS dilakukan melalui halaman Pengaturan Toko

-- Setelah menjalankan query ini, Anda bisa:
-- 1. Buka Pengaturan Toko
-- 2. Isi informasi bank (Nama Bank, Nomor Rekening, Atas Nama)
-- 3. Upload gambar QRIS (akan otomatis di-crop untuk menampilkan kode QR saja)
-- 4. Simpan perubahan
