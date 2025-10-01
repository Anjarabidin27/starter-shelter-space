export interface Product {
  id: string;
  name: string;
  costPrice: number; // Harga kulakan
  sellPrice: number; // Harga jual
  stock: number;
  barcode?: string; // Barcode atau kode produk untuk scanner
  code?: string; // Kode alternatif untuk input cepat
  category?: string;
  isPhotocopy?: boolean; // Special handling untuk fotocopy
}

export interface CartItem {
  product: Product;
  quantity: number;
  finalPrice?: number; // For photocopy tiered pricing
}

export interface Receipt {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number; // Discount amount
  total: number; // After discount, no tax
  profit: number; // Total profit from this transaction
  timestamp: Date;
  paymentMethod?: string;
  isManual?: boolean; // Mark manual receipts to track separately
}

export interface POSState {
  products: Product[];
  cart: CartItem[];
  receipts: Receipt[];
}