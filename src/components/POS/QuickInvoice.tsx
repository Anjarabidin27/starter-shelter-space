import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Receipt as ReceiptIcon, Search, Scan } from 'lucide-react';
import { Product } from '@/types/pos';
import { useState, useRef, useEffect } from 'react';
import { ShoppingCart } from './ShoppingCart';
import { CartItem, Receipt } from '@/types/pos';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface QuickInvoiceProps {
  onCreateInvoice: (receipt: Receipt) => void;
  formatPrice: (price: number) => string;
  receipts: Receipt[];
  onPrintReceipt?: (receipt: Receipt) => void;
  products: Product[];
  cart: CartItem[];
  updateCartQuantity: (productId: string, quantity: number, finalPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  processTransaction: (paymentMethod?: string, discount?: number) => Promise<Receipt | null>;
  addToCart: (product: Product, quantity?: number, customPrice?: number) => void;
  onViewReceipt: (receipt: Receipt) => void;
}

export const QuickInvoice = ({ 
  formatPrice,
  products,
  cart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  processTransaction,
  addToCart,
  receipts,
  onPrintReceipt,
  onViewReceipt
}: QuickInvoiceProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(search) || 
           p.code?.toLowerCase().includes(search) ||
           p.barcode?.toLowerCase().includes(search);
  });

  useEffect(() => {
    // Auto-focus search input with safety check
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleProductSelect = (product: Product) => {
    // Check if product has stock (except for photocopy services)
    if (!product.isPhotocopy && product.stock <= 0) {
      toast.error(`Produk "${product.name}" tidak tersedia (stok habis)`);
      return;
    }
    
    setSelectedProduct(product);
    setQuantityInput('');
    setShowQuantityDialog(true);
  };

  const handleQuantityConfirm = () => {
    if (selectedProduct) {
      const qty = parseInt(quantityInput) || 1;
      
      // Validate stock (except for photocopy services)
      if (!selectedProduct.isPhotocopy && qty > selectedProduct.stock) {
        toast.error(`Stok tidak mencukupi! Tersedia: ${selectedProduct.stock}, Diminta: ${qty}`);
        return;
      }
      
      if (qty <= 0) {
        toast.error('Jumlah harus lebih dari 0');
        return;
      }
      
      addToCart(selectedProduct, qty);
      setShowQuantityDialog(false);
      setSelectedProduct(null);
      setQuantityInput('');
      setSearchTerm('');
      searchInputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (showQuantityDialog && quantityInputRef.current) {
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 100);
    }
  }, [showQuantityDialog]);

  const handleBarcodeScanner = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.error('Scan barcode hanya tersedia di aplikasi mobile');
      return;
    }

    try {
      setIsScanning(true);
      
      // Check permission
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (!status.granted) {
        toast.error('Izin kamera tidak diberikan');
        setIsScanning(false);
        return;
      }

      // Make background transparent
      document.body.classList.add('scanner-active');
      
      // Start scanning
      const result = await BarcodeScanner.startScan();
      
      // Remove transparency
      document.body.classList.remove('scanner-active');
      setIsScanning(false);

      if (result.hasContent) {
        // Search for product by barcode or code
        const foundProduct = products.find(p => 
          p.barcode?.toLowerCase() === result.content?.toLowerCase() ||
          p.code?.toLowerCase() === result.content?.toLowerCase() ||
          p.name.toLowerCase().includes(result.content?.toLowerCase() || '')
        );

        if (foundProduct) {
          addToCart(foundProduct, 1);
          toast.success(`Produk "${foundProduct.name}" ditambahkan ke keranjang`);
        } else {
          toast.error(`Produk dengan kode "${result.content}" tidak ditemukan`);
        }
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      document.body.classList.remove('scanner-active');
      setIsScanning(false);
      toast.error('Terjadi kesalahan saat scanning');
    }
  };

  return (
    <>
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masukkan Jumlah</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Produk</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedProduct?.name}</p>
            </div>
            <div>
              <Label htmlFor="quantity-input" className="text-sm font-medium">
                Jumlah
              </Label>
              <Input
                ref={quantityInputRef}
                id="quantity-input"
                type="number"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuantityConfirm();
                  }
                }}
                placeholder="0"
                className="mt-1"
                min="1"
                inputMode="numeric"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuantityDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleQuantityConfirm}>
              Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search - Simplified for quick entry */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ReceiptIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Nota Cepat - Cari Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search" className="text-xs sm:text-sm">Cari Produk (Nama/Kode/Barcode)</Label>
                <Button
                  variant="outline"
                  onClick={handleBarcodeScanner}
                  disabled={isScanning}
                  className="w-full h-10 mb-2"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  {isScanning ? 'Sedang Scanning...' : 'Scan Barcode'}
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ketik nama, kode, atau barcode produk..."
                    className="pl-9 h-10 text-sm"
                  />
                </div>
              </div>

              {/* Live Search Results */}
              {searchTerm && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.slice(0, 10).map(product => (
                    <div
                      key={product.id}
                      className="p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {product.code && `Kode: ${product.code} | `}
                            Harga: {formatPrice(product.sellPrice)} | Stok: {product.stock}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Produk tidak ditemukan
                    </div>
                  )}
                </div>
              )}

              {!searchTerm && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p>Ketik untuk mencari produk dan mulai membuat nota cepat</p>
                  <p className="text-xs mt-2">Sistem sama dengan Kasir, tapi tanpa tampilan produk</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart - Reuse the same cart component */}
      <div>
        <ShoppingCart
          cart={cart}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          processTransaction={processTransaction}
          formatPrice={formatPrice}
          onPrintThermal={onPrintReceipt}
          onViewReceipt={onViewReceipt}
          receipts={receipts}
          products={products}
          onAddToCart={addToCart}
        />
      </div>
    </div>
    </>
  );
};
