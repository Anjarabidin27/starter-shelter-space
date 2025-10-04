import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem, Receipt as ReceiptType } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart as CartIcon, Trash2, CreditCard, Percent, Printer, Edit, ExternalLink, Bluetooth, Plus } from 'lucide-react';
import { thermalPrinter } from '@/lib/thermal-printer';
import { formatThermalReceipt } from '@/lib/receipt-formatter';
import { toast } from 'sonner';
import { QuantitySelector } from './QuantitySelector';
import { QuickProductSearch } from './QuickProductSearch';
import { Product } from '@/types/pos';
import { useBluetoothContext } from '@/contexts/BluetoothContext';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface ShoppingCartProps {
  cart: CartItem[];
  updateCartQuantity: (productId: string, quantity: number, finalPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  processTransaction: (paymentMethod?: string, discount?: number) => ReceiptType | null | Promise<ReceiptType | null>;
  formatPrice: (price: number) => string;
  onPrintThermal: (receipt: ReceiptType) => void;
  onViewReceipt?: (receipt: ReceiptType) => void;
  receipts?: ReceiptType[];
  products?: Product[];
  onAddToCart?: (product: Product, quantity?: number) => void;
}

export const ShoppingCart = ({
  cart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  processTransaction,
  formatPrice,
  onPrintThermal,
  onViewReceipt,
  receipts = [],
  products = [],
  onAddToCart
}: ShoppingCartProps) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { isConnected, isConnecting, connect } = useBluetoothContext();

  const handlePriceChange = (productId: string, newPrice: number) => {
    const item = cart.find(item => item.product.id === productId);
    if (item && item.quantity >= 12) {
      // For bulk pricing (≥12), the newPrice is the total price per dozen
      // So we need to calculate the per-unit price
      const pricePerUnit = newPrice / 12; // Convert bulk price to per-unit price
      updateCartQuantity(productId, item.quantity, pricePerUnit);
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = item.finalPrice || item.product.sellPrice;
    return sum + (price * item.quantity);
  }, 0);

  const discountAmount = discountType === 'percent' 
    ? Math.round(subtotal * (discount / 100))
    : discount;
    
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const receipt = await processTransaction(paymentMethod, discountAmount);
      if (receipt) {
        setPaymentMethod('cash');
        setDiscount(0);
        setDiscountType('amount');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintToReceipt = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const receipt = await processTransaction(paymentMethod, discountAmount);
      if (receipt) {
        onViewReceipt?.(receipt);
        setPaymentMethod('cash');
        setDiscount(0);
        setDiscountType('amount');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThermalPrint = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      // Check if already connected
      if (!isConnected) {
        toast.info('Menghubungkan ke printer...');
        const connected = await connect();
        if (!connected) {
          toast.error('Gagal terhubung ke printer thermal. Pastikan printer menyala dan dalam jangkauan.');
          setIsProcessing(false);
          return;
        }
      }

      // Process transaction
      const receipt = await processTransaction(paymentMethod, discountAmount);
      if (receipt) {
        // Print directly since we're already connected
        try {
          const thermalContent = formatThermalReceipt(receipt, formatPrice);
          const success = await thermalPrinter.print(thermalContent);
          
          if (success) {
            toast.success('Nota berhasil dicetak!');
            setPaymentMethod('cash');
            setDiscount(0);
            setDiscountType('amount');
          } else {
            toast.error('Gagal mencetak nota. Printer mungkin terputus.');
          }
        } catch (error) {
          console.error('Print error:', error);
          toast.error('Terjadi kesalahan saat mencetak.');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Card className="pos-card h-fit">
        <CardHeader className="text-center py-4 sm:py-8 p-3 sm:p-6">
          <CartIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-2 sm:mb-4" />
          <CardTitle className="text-muted-foreground text-sm sm:text-base">Keranjang Kosong</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pilih produk untuk memulai transaksi
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="pos-card h-fit">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <div 
            className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate('/cart')}
          >
            <CartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Keranjang
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Badge variant="secondary" className="text-xs">{cart.length} item</Badge>
            
            {/* Enhanced Thermal Print Button with connection status */}
            <Button
              size="sm"
              variant={isConnected ? "default" : "outline"}
              onClick={handleThermalPrint}
              disabled={isProcessing || isConnecting}
              className={`h-6 w-auto px-2 sm:h-7 sm:px-3 flex items-center gap-1 ${
                isConnected ? 'bg-success hover:bg-success/90 text-success-foreground' : 
                isConnecting ? 'animate-pulse' : ''
              }`}
              title={isConnected ? 'Print Thermal (Terhubung)' : isConnecting ? 'Menghubungkan...' : 'Print Thermal (Belum Terhubung)'}
            >
              {isConnecting ? (
                <Bluetooth className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Printer className="h-3 w-3" />
                  {isConnected && <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>}
                </>
              )}
              <span className="hidden sm:inline text-xs">
                {isConnecting ? 'Connecting' : isConnected ? 'Print' : 'Print'}
              </span>
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/cart')}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0"
            >
              <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        {/* Quick Product Search */}
        {products.length > 0 && onAddToCart && (
          <div className="mb-3">
            <QuickProductSearch 
              products={products}
              onAddToCart={onAddToCart}
              formatPrice={formatPrice}
            />
          </div>
        )}

        <div className="max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto space-y-3 border rounded-lg p-2 bg-secondary/20">
          {cart.map((item, index) => (
            <div key={`${item.product.id}-${item.finalPrice || 'default'}-${index}`} className="pos-cart-item min-h-[80px] sm:min-h-[100px]">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h4 
                    className="font-medium text-xs sm:text-sm cursor-pointer hover:text-primary transition-colors leading-tight"
                  >
                    {item.product.name}
                  </h4>
                  {item.quantity >= 12 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                      onClick={() => setEditingPrice(editingPrice === item.product.id ? null : item.product.id)}
                    >
                      <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mb-2 sm:mb-3">
                  {formatPrice(item.finalPrice || item.product.sellPrice)} × {item.quantity}
                </div>
                
                {/* Bulk Pricing Display */}
                {item.quantity >= 12 && (
                  <div className="mb-2 p-2 bg-primary/5 rounded border">
                    <div className="text-xs font-medium text-primary mb-1">Harga Khusus:</div>
                    <div className="space-y-1 text-xs">
                      {/* Per Lusin (12 pcs) */}
                      {item.quantity >= 12 && (
                        <div className="flex justify-between">
                          <span>Per Lusin ({Math.floor(item.quantity / 12)} lusin):</span>
                          <span className="font-medium">
                            {formatPrice((item.finalPrice || item.product.sellPrice) * 12)}
                          </span>
                        </div>
                      )}
                      
                      {/* Per Kodi (20 pcs) */}
                      {item.quantity >= 20 && (
                        <div className="flex justify-between">
                          <span>Per Kodi ({Math.floor(item.quantity / 20)} kodi):</span>
                          <span className="font-medium">
                            {formatPrice((item.finalPrice || item.product.sellPrice) * 20)}
                          </span>
                        </div>
                      )}
                      
                      {/* Per Gros (144 pcs) */}
                      {item.quantity >= 144 && (
                        <div className="flex justify-between">
                          <span>Per Gros ({Math.floor(item.quantity / 144)} gros):</span>
                          <span className="font-medium">
                            {formatPrice((item.finalPrice || item.product.sellPrice) * 144)}
                          </span>
                        </div>
                      )}
                      
                      {/* Per Rim (500 sheets for paper) */}
                      {item.product.category === 'Kertas' && item.quantity >= 500 && (
                        <div className="flex justify-between">
                          <span>Per Rim ({Math.floor(item.quantity / 500)} rim):</span>
                          <span className="font-medium">
                            {formatPrice((item.finalPrice || item.product.sellPrice) * 500)}
                          </span>
                        </div>
                      )}
                      
                      {/* Total for current quantity */}
                      <div className="flex justify-between pt-1 border-t border-primary/20">
                        <span className="font-medium">Total ({item.quantity} pcs):</span>
                        <span className="font-bold text-primary">
                          {formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <QuantitySelector
                  quantity={item.quantity}
                  productName={item.product.name}
                  category={item.product.category}
                  onQuantityChange={(quantity) => {
                    if (quantity === 0) {
                      removeFromCart(item.product.id);
                    } else {
                      updateCartQuantity(item.product.id, quantity, item.finalPrice);
                    }
                  }}
                  onRemove={() => removeFromCart(item.product.id)}
                  allowBulkPricing={true}
                  currentPrice={item.quantity >= 12 ? (item.finalPrice || item.product.sellPrice) * 12 : item.finalPrice || item.product.sellPrice}
                  onPriceChange={(price) => handlePriceChange(item.product.id, price)}
                  showUnitSelector={true}
                />
              </div>
              
              <div className="text-right ml-2">
                <div className="font-semibold text-sm sm:text-lg">
                  {formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />
        
        <div className="space-y-3 sm:space-y-4">
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
              Diskon
            </Label>
            <div className="flex gap-2">
              <Select value={discountType} onValueChange={(value: 'amount' | 'percent') => setDiscountType(value)}>
                <SelectTrigger className="w-16 sm:w-24 h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Rp</SelectItem>
                  <SelectItem value="percent">%</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                min="0"
                max={discountType === 'percent' ? 100 : subtotal}
                className="h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t">
          <div className="flex justify-between text-sm sm:text-lg">
            <span>Subtotal:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm sm:text-lg text-destructive">
              <span>Diskon:</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg sm:text-xl font-bold">
            <span>Total:</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </div>
        
        <div className="space-y-1.5 sm:space-y-2 pt-2">
          <Button 
            className="w-full h-8 sm:h-10 text-xs sm:text-sm"
            variant="success"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {isProcessing ? 'Memproses...' : 'Checkout'}
          </Button>
          
          <Button 
            className="w-full h-8 sm:h-10 text-xs sm:text-sm"
            variant="default"
            onClick={handlePrintToReceipt}
            disabled={isProcessing}
          >
            <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {isProcessing ? 'Memproses...' : 'Buat Nota'}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-8 sm:h-10 text-xs sm:text-sm"
            onClick={clearCart}
            disabled={isProcessing}
          >
            Kosongkan Keranjang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
