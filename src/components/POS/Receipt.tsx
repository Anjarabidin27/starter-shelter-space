import React, { useEffect, useCallback, useState } from 'react';
import { Receipt as ReceiptType } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer } from 'lucide-react';
import { thermalPrinter } from '@/lib/thermal-printer';
import { formatThermalReceipt, formatPrintReceipt } from '@/lib/receipt-formatter';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';
import { useQrisImage } from '@/hooks/useQrisImage';
import QRCode from 'qrcode';

const QrisBlock = () => {
  const { currentStore } = useStore();
  const { qrisUrl } = useQrisImage();
  if (!qrisUrl) return null;
  return (
    <div className="mt-4 pt-3 border-t">
      <div className="text-xs font-medium text-center mb-2 text-muted-foreground">
        QRIS Pembayaran
      </div>
      <div className="flex justify-center">
        <img 
          src={qrisUrl}
          alt="QRIS"
          className="w-48 h-48 object-contain border-2 border-border rounded bg-white"
        />
      </div>
    </div>
  );
};

interface ReceiptProps {
  receipt: ReceiptType;
  formatPrice: (price: number) => string;
  onBack?: () => void;
}

export const Receipt = ({ receipt, formatPrice, onBack }: ReceiptProps) => {
  const { currentStore } = useStore();
  const [bankQrCode, setBankQrCode] = useState<string>('');
  
  const handleThermalPrint = useCallback(async () => {
    try {
      // Try thermal printing first
      if (thermalPrinter.isConnected()) {
        const receiptText = formatThermalReceipt(receipt, formatPrice, currentStore);
        const printed = await thermalPrinter.print(receiptText);
        
        if (printed) {
          toast.success('Struk berhasil dicetak ke thermal printer!');
          return;
        }
      }
      
      // Fallback to thermal printer connection attempt
      const connected = await thermalPrinter.connect();
      if (connected) {
        const receiptText = formatThermalReceipt(receipt, formatPrice, currentStore);
        const printed = await thermalPrinter.print(receiptText);
        
        if (printed) {
          toast.success('Thermal printer terhubung dan struk berhasil dicetak!');
          return;
        }
      }
      
      // Ultimate fallback to browser printing if thermal printing fails
      toast.info('Thermal printer tidak tersedia, menggunakan printer browser...');
      handlePrint();
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Terjadi kesalahan saat mencetak.');
      toast.error('Thermal printer gagal, menggunakan printer browser...');
      handlePrint();
    }
  }, [receipt, formatPrice, currentStore]);

  const handlePrint = useCallback(() => {
    const printContent = formatPrintReceipt(receipt, formatPrice, currentStore);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }, [receipt, formatPrice, currentStore]);


  // Generate QR Code for bank transfer
  useEffect(() => {
    const generateBankQR = async () => {
      const paymentMethod = receipt.paymentMethod?.toLowerCase() || 'cash';
      
      if (paymentMethod === 'transfer' && currentStore?.bank_account_number && currentStore?.bank_name) {
        const bankInfo = `Bank: ${currentStore.bank_name}\nNo. Rekening: ${currentStore.bank_account_number}\nAtas Nama: ${currentStore.bank_account_holder || '-'}`;
        try {
          const url = await QRCode.toDataURL(bankInfo, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          setBankQrCode(url);
        } catch (err) {
          console.error('Error generating bank QR code:', err);
        }
      } else {
        setBankQrCode('');
      }
    };

    generateBankQR();
  }, [receipt.paymentMethod, currentStore]);

  // Add Enter key support for thermal printing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleThermalPrint();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleThermalPrint]);

  return (
    <div className="space-y-4">
      {/* Header dengan tombol kembali */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-xl font-semibold">Detail Struk</h2>
        </div>
        <Button onClick={handleThermalPrint} size="sm">
          <Printer className="h-4 w-4 mr-1" />
          Print Thermal
        </Button>
      </div>

      {/* Konten struk */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Struk {receipt.id}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat('id-ID', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }).format(receipt.timestamp)}
              </p>
            </div>
            <Badge variant={receipt.paymentMethod === 'tunai' ? 'default' : 'secondary'}>
              {receipt.paymentMethod || 'tunai'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toko Info */}
          <div className="text-center mb-4 pb-3 border-b">
            <h3 className="font-bold text-lg">{currentStore?.name || 'Toko'}</h3>
            {currentStore?.address && (
              <p className="text-sm text-muted-foreground">
                {currentStore.address}
              </p>
            )}
            {currentStore?.phone && (
              <p className="text-sm text-muted-foreground">
                HP: {currentStore.phone}
              </p>
            )}
            {(currentStore?.opening_hours || currentStore?.closing_hours) && (
              <p className="text-sm text-muted-foreground">
                Buka: {currentStore?.opening_hours?.slice(0, 5) || '-'} - {currentStore?.closing_hours?.slice(0, 5) || '-'}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {receipt.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex-1">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-muted-foreground">
                    {item.quantity} x {formatPrice(item.finalPrice || item.product.sellPrice)}
                  </div>
                </div>
                <div className="font-medium">
                  {formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrice(receipt.subtotal)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon:</span>
                <span>-{formatPrice(receipt.discount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatPrice(receipt.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Keuntungan:</span>
              <span>{formatPrice(receipt.profit)}</span>
            </div>
          </div>

          {/* Payment QR Code */}
          {bankQrCode && receipt.paymentMethod?.toLowerCase() === 'transfer' && (
            <div className="mt-4 pt-3 border-t">
              <div className="text-xs font-medium text-center mb-2 text-muted-foreground">
                QR Code Informasi Rekening
              </div>
              <div className="flex justify-center">
                <img 
                  src={bankQrCode} 
                  alt="QR Code Bank Transfer"
                  className="w-40 h-40 border-2 border-border rounded"
                />
              </div>
              <div className="text-xs text-center text-muted-foreground italic mt-2">
                Scan untuk info rekening transfer
              </div>
            </div>
          )}
          
          {receipt.paymentMethod?.toLowerCase() === 'qris' && currentStore?.qris_image_url && (
            <div className="mt-4 pt-3 border-t">
              <div className="text-xs font-medium text-center mb-2 text-muted-foreground">
                QRIS Pembayaran
              </div>
              <div className="flex justify-center">
                <img 
                  src={currentStore.qris_image_url} 
                  alt="QRIS"
                  className="w-48 h-48 object-contain border-2 border-border rounded"
                />
              </div>
              <div className="text-xs text-center text-muted-foreground italic mt-2">
                Scan untuk melakukan pembayaran
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t text-xs text-muted-foreground">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
          </div>
        </CardContent>
      </Card>

      {/* Instruksi */}
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Instruksi:</p>
            <ul className="space-y-1">
              <li>• Tekan <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> untuk print thermal otomatis</li>
              <li>• Klik tombol "Print Thermal" untuk print manual</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};