-- Add WhatsApp and admin/settings codes to stores
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS whatsapp_number text;

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS admin_password text DEFAULT '122344566';

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS settings_password text DEFAULT '12234566';