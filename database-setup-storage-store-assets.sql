-- ========================================
-- Storage Setup: store-assets bucket + policies (AMAN)
-- Jalankan ini untuk memastikan upload & list QRIS bekerja
-- ========================================

-- 1) Buat bucket jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'store-assets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('store-assets', 'store-assets', true);
  END IF;
END $$;

-- Pastikan bucket bersifat public agar file bisa diakses via public URL
UPDATE storage.buckets SET public = true WHERE id = 'store-assets' AND public IS DISTINCT FROM true;

-- 2) RLS Policies pada storage.objects
-- Hapus policy lama jika ada (idempotent)
DROP POLICY IF EXISTS "Authenticated can list store-assets" ON storage.objects;

-- Izinkan user terautentikasi untuk LIST/SELECT object di bucket store-assets
CREATE POLICY "Authenticated can list store-assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'store-assets');

-- Catatan:
-- - Upload dilakukan lewat Edge Function dengan Service Role, jadi tidak butuh policy INSERT/UPDATE/DELETE di client.
-- - Public URL akan tetap bisa diakses siapapun jika tahu link-nya (karena bucket public = true).
-- - Listing dari client membutuhkan SELECT policy (sudah dibuat di atas).

-- Selesai.