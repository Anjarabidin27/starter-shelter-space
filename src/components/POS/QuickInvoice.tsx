import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt as ReceiptIcon, Trash2, Plus, Scan } from 'lucide-react';
import { Product, Receipt as ReceiptType, CartItem } from '@/types/pos';
import { toast } from 'sonner';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface QuickItem extends CartItem {
  id: string;
}

interface QuickInvoiceProps {
  onCreateInvoice: (receipt: ReceiptType) => void;
  formatPrice: (price: number) => string;
  receipts: ReceiptType[];
  onPrintReceipt?: (receipt: ReceiptType) => void;
  products: Product[];
}

export const QuickInvoice = ({ onCreateInvoice, formatPrice, receipts, onPrintReceipt, products }: QuickInvoiceProps) => {
  const [items, setItems] = useState<QuickItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isScanning, setIsScanning] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search (by name, code, or barcode)
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(search) || 
           p.code?.toLowerCase().includes(search) ||
           p.barcode?.toLowerCase().includes(search);
  });

  useEffect(() => {
    // Auto-focus search input
    searchInputRef.current?.focus();
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
  };

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    const existingItemIndex = items.findIndex(item => item.product.id === selectedProduct.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already in cart
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: QuickItem = {
        id: Date.now().toString(),
        product: selectedProduct,
        quantity: quantity,
        finalPrice: selectedProduct.sellPrice
      };
      setItems([...items, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(0);
    searchInputRef.current?.focus();
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.finalPrice || item.product.sellPrice) * item.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  const handleCreateInvoice = () => {
    if (items.length === 0) {
      toast.error('Tambahkan minimal 1 produk!');
      return;
    }

    const now = new Date();
    const counter = receipts.filter(r => r.id.startsWith('QCK-')).length + 1;
    const dateStr = now.toLocaleDateString('id-ID').split('/').reverse().map(s => s.padStart(2, '0')).join('').slice(2);
    const invoiceId = `QCK-${counter}${dateStr}`;

    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    const profit = items.reduce((sum, item) => {
      const itemProfit = (item.product.sellPrice - item.product.costPrice) * item.quantity;
      return sum + itemProfit;
    }, 0);

    const receipt: ReceiptType = {
      id: invoiceId,
      items: items.map(({ id, ...rest }) => rest),
      subtotal,
      discount,
      total,
      profit,
      timestamp: now,
      paymentMethod,
      isManual: true
    };

    onCreateInvoice(receipt);
    
    // Reset form
    setItems([]);
    setDiscount(0);
    setPaymentMethod('cash');
    
    toast.success(`Nota cepat ${invoiceId} berhasil dibuat!`);
  };

  const handleScanBarcode = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        toast.error('Barcode scanner hanya tersedia di aplikasi mobile');
        return;
      }

      // Check permission
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (!status.granted) {
        toast.error('Izin kamera diperlukan untuk scan barcode');
        return;
      }

      setIsScanning(true);
      
      // Hide background
      document.body.classList.add('scanner-active');
      await BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan();

      // Show background
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      setIsScanning(false);

      if (result.hasContent) {
        const scannedCode = result.content;
        const foundProduct = products.find(p => 
          p.barcode === scannedCode || p.code === scannedCode
        );

        if (foundProduct) {
          handleProductSelect(foundProduct);
          toast.success(`Produk ditemukan: ${foundProduct.name}`);
        } else {
          toast.error('Produk tidak ditemukan. Silakan tambahkan produk terlebih dahulu.');
        }
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      setIsScanning(false);
      toast.error('Gagal scan barcode');
    }
  };

  const stopScanning = async () => {
    await BarcodeScanner.stopScan();
    document.body.classList.remove('scanner-active');
    await BarcodeScanner.showBackground();
    setIsScanning(false);
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ReceiptIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Nota Cepat - Input Barang
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Product */}
          <div>
            <Label htmlFor="search" className="text-xs sm:text-sm">Cari Produk (Nama/Kode/Barcode)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ketik nama, kode, atau barcode produk"
                  className="h-9 sm:h-10 text-sm"
                />
                {searchTerm && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                    {filteredProducts.slice(0, 5).map(product => (
                      <div
                        key={product.id}
                        className="px-3 py-2 cursor-pointer hover:bg-muted"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.code && `Kode: ${product.code} | `}
                          Harga: {formatPrice(product.sellPrice)} | Stok: {product.stock}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleScanBarcode}
                disabled={isScanning}
                className="h-9 sm:h-10"
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Product & Quantity */}
          {selectedProduct && (
            <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg space-y-3">
              <div>
                <div className="font-semibold text-base">{selectedProduct.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatPrice(selectedProduct.sellPrice)} | Stok: {selectedProduct.stock}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Label htmlFor="quantity" className="text-sm font-medium">Jumlah</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(0, quantity - 1))}
                      className="h-10 w-10 p-0"
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(0, Number(e.target.value) || 0))}
                      className="h-10 text-center text-base font-semibold"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Button onClick={handleAddItem} size="lg" className="h-10 mt-6">
                  <Plus className="h-5 w-5 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>
          )}

          {/* Cart Items */}
          {items.length > 0 && (
            <div className="space-y-3 pt-3 border-t-2">
              <Label className="text-sm font-semibold">Keranjang Belanja</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-muted/30 rounded-md">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 bg-background border rounded-md shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatPrice(item.product.sellPrice)} × {item.quantity} = {formatPrice(item.product.sellPrice * item.quantity)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.id, Number(e.target.value) || 0)}
                        className="h-9 w-16 text-sm text-center font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discount & Payment */}
          {items.length > 0 && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label htmlFor="discount" className="text-xs sm:text-sm">Diskon (Rp)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              
              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

              {/* Total */}
              <div className="space-y-2 p-3 bg-primary/5 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Diskon:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
                  <span>TOTAL:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              <Button onClick={handleCreateInvoice} className="w-full" size="lg">
                Buat Nota Cepat
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Nota cepat akan tercatat di laporan penjualan hari ini
          </div>
        </CardContent>
      </Card>

      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <div className="text-white text-center mb-8">
            <p className="text-xl mb-2">Arahkan kamera ke barcode</p>
            <p className="text-sm text-gray-400">Barcode akan otomatis terdeteksi</p>
          </div>
          <div className="absolute bottom-8">
            <Button onClick={stopScanning} variant="outline" size="lg">
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
