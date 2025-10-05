-- ========================================
-- Storage Setup (Client Upload): store-assets bucket + RLS for INSERT/UPDATE
-- Jalankan script ini SEKALI di SQL Editor agar upload QRIS langsung dari client bisa berjalan
-- ========================================

-- 1) Buat bucket jika belum ada dan pastikan public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'store-assets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('store-assets', 'store-assets', true);
  END IF;
END $$;

UPDATE storage.buckets SET public = true WHERE id = 'store-assets' AND public IS DISTINCT FROM true;

-- 2) Policies pada storage.objects
-- Hapus policy lama (idempotent)
DROP POLICY IF EXISTS "Authenticated can list store-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert QRIS to store-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update QRIS to store-assets" ON storage.objects;

-- Izinkan user terautentikasi untuk LIST
CREATE POLICY "Authenticated can list store-assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'store-assets');

-- Izinkan INSERT ke folder qris/ untuk user terautentikasi
CREATE POLICY "Authenticated can insert QRIS to store-assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (name LIKE 'qris/%')
  );

-- Izinkan UPDATE pada objek di folder qris/ (untuk upsert)
CREATE POLICY "Authenticated can update QRIS to store-assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (name LIKE 'qris/%')
  );
