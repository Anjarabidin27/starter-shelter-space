import { useEffect, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import QRCode from 'qrcode';
import { CreditCard, Smartphone, Banknote } from 'lucide-react';

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { currentStore } = useStore();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (value === 'qris' && currentStore?.ewallet_number) {
      // Generate QRIS code from e-wallet number
      const qrisData = `00020101021126${currentStore.ewallet_number.length.toString().padStart(2, '0')}${currentStore.ewallet_number}5303360`;
      
      QRCode.toDataURL(qrisData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [value, currentStore?.ewallet_number]);

  const hasBankTransfer = currentStore?.bank_account_number && currentStore?.bank_name;
  const hasQRIS = currentStore?.ewallet_number;

  return (
    <div className="space-y-3">
      <div className="space-y-1 sm:space-y-2">
        <Label className="text-xs sm:text-sm font-medium">Metode Pembayaran</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                <span>Tunai</span>
              </div>
            </SelectItem>
            {hasBankTransfer && (
              <SelectItem value="transfer">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Transfer Bank</span>
                </div>
              </SelectItem>
            )}
            {hasQRIS && (
              <SelectItem value="qris">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>QRIS</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Bank Transfer Details */}
      {value === 'transfer' && hasBankTransfer && (
        <Card className="p-3 bg-muted/50 border-primary/20">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Transfer ke:</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-medium">{currentStore.bank_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">No. Rekening:</span>
                <span className="font-mono font-medium">{currentStore.bank_account_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Atas Nama:</span>
                <span className="font-medium">{currentStore.bank_account_holder}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* QRIS Code */}
      {value === 'qris' && hasQRIS && qrCodeUrl && (
        <Card className="p-3 bg-muted/50 border-primary/20">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground text-center">
              Scan QRIS untuk Pembayaran
            </div>
            <div className="flex justify-center">
              <img 
                src={qrCodeUrl} 
                alt="QRIS Code" 
                className="w-40 h-40 sm:w-48 sm:h-48 border-2 border-border rounded"
              />
            </div>
            <div className="text-xs text-center text-muted-foreground">
              E-Wallet: {currentStore.ewallet_number}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
