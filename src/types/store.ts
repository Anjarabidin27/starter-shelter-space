export type StoreCategory = 
  | 'sembako'
  | 'bangunan' 
  | 'agen_sosis'
  | 'atk'
  | 'elektronik'
  | 'pakaian'
  | 'farmasi'
  | 'lainnya';

export interface Store {
  id: string;
  name: string;
  category: string;
  phone?: string;
  address?: string;
  cashier_name?: string;
  opening_hours?: string;
  closing_hours?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  qris_image_url?: string;
  whatsapp_number?: string;
  admin_password?: string;
  settings_password?: string;
  dana_number?: string;
  gopay_number?: string;
  ovo_number?: string;
  shopeepay_number?: string;
  ewallet_number?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export const STORE_CATEGORIES: { value: StoreCategory; label: string }[] = [
  { value: 'sembako', label: 'Toko Sembako' },
  { value: 'bangunan', label: 'Toko Bangunan' },
  { value: 'agen_sosis', label: 'Agen Sosis' },
  { value: 'atk', label: 'Toko ATK' },
  { value: 'elektronik', label: 'Toko Elektronik' },
  { value: 'pakaian', label: 'Toko Pakaian' },
  { value: 'farmasi', label: 'Apotek/Farmasi' },
  { value: 'lainnya', label: 'Lainnya' },
];