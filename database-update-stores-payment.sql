-- ========================================
-- SQL Query untuk Update Stores Table
-- Jalankan query ini di Supabase SQL Editor
-- ========================================

-- Tambahkan field pembayaran ke tabel stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

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
