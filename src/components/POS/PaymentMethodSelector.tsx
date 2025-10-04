import { useEffect, useState } from 'react';
import { useQrisImage } from '@/hooks/useQrisImage';
import { useStore } from '@/contexts/StoreContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';
import { CreditCard, Smartphone, Banknote, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type EWalletProvider = 'gopay' | 'ovo' | 'dana' | 'shopeepay';

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { currentStore } = useStore();
  const { qrisUrl } = useQrisImage();
  const { toast } = useToast();
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<EWalletProvider, string>>({
    gopay: '',
    ovo: '',
    dana: '',
    shopeepay: ''
  });
  const [bankQrCode, setBankQrCode] = useState<string>('');
  const [selectedEWallet, setSelectedEWallet] = useState<EWalletProvider>('gopay');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Generate deep link for each e-wallet provider
  const generateDeepLink = (provider: EWalletProvider, phoneNumber: string): string => {
    // Remove any non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    switch (provider) {
      case 'gopay':
        // GoPay deep link format
        return `gojek://gopay/transfer?phone=${cleanPhone}`;
      case 'ovo':
        // OVO deep link format
        return `ovoid://pay?phone=${cleanPhone}`;
      case 'dana':
        // DANA deep link format
        return `dana://qr?phone=${cleanPhone}`;
      case 'shopeepay':
        // ShopeePay deep link format
        return `shopeepay://transfer?phone=${cleanPhone}`;
      default:
        return '';
    }
  };

  // Generate Bank Transfer QR Code
  useEffect(() => {
    if (value === 'transfer' && currentStore?.bank_account_number && currentStore?.bank_name) {
      const bankInfo = `Bank: ${currentStore.bank_name}\nNo. Rekening: ${currentStore.bank_account_number}\nAtas Nama: ${currentStore.bank_account_holder || '-'}`;
      
      QRCode.toDataURL(bankInfo, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(url => setBankQrCode(url))
        .catch(err => console.error('Error generating bank QR code:', err));
    }
  }, [value, currentStore?.bank_account_number, currentStore?.bank_name, currentStore?.bank_account_holder]);


  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      toast({
        title: "Berhasil disalin",
        description: `${fieldName} telah disalin ke clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const hasBankTransfer = currentStore?.bank_account_number && currentStore?.bank_name;
  const hasQris = !!qrisUrl;

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
            {hasQris && (
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
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground text-center">
              Informasi Transfer Bank
            </div>
            
            {bankQrCode && (
              <div className="flex justify-center">
                <img 
                  src={bankQrCode} 
                  alt="QR Code Informasi Rekening"
                  className="w-40 h-40 sm:w-48 sm:h-48 border-2 border-border rounded"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-medium">{currentStore.bank_name}</span>
              </div>
              <div className="flex justify-between items-center gap-2 text-sm">
                <span className="text-muted-foreground">No. Rekening:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{currentStore.bank_account_number}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(currentStore.bank_account_number!, 'Nomor Rekening')}
                  >
                    {copiedField === 'Nomor Rekening' ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Atas Nama:</span>
                <span className="font-medium">{currentStore.bank_account_holder}</span>
              </div>
            </div>
            
            <div className="text-xs text-center text-muted-foreground italic">
              Scan QR atau salin nomor rekening untuk transfer
            </div>
          </div>
        </Card>
      )}

      {/* QRIS Payment */}
      {value === 'qris' && hasQris && (
        <Card className="p-3 bg-muted/50 border-primary/20">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground text-center">
              Kode QRIS untuk Pembayaran
            </div>
            
            <div className="flex justify-center">
              <img 
                src={qrisUrl || ''} 
                alt="QRIS Code"
                className="max-w-[280px] w-full h-auto object-contain border-2 border-border rounded p-2 bg-white"
              />
            </div>
            
            <div className="text-xs text-center text-muted-foreground italic">
              Scan kode QRIS di atas dengan aplikasi pembayaran apapun
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
