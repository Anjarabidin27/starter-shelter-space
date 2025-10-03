import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StoreCategory, STORE_CATEGORIES } from '@/types/store';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Store as StoreIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminProtection } from '@/components/Auth/AdminProtection';

export const StoreSettings = () => {
  const { currentStore, updateStore } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'sembako' as StoreCategory,
    phone: '',
    address: '',
    cashier_name: '',
    opening_hours: '',
    closing_hours: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    ewallet_number: '',
    gopay_number: '',
    ovo_number: '',
    dana_number: '',
    shopeepay_number: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showAdminProtection, setShowAdminProtection] = useState(true);

  useEffect(() => {
    if (currentStore) {
      setFormData({
        name: currentStore.name || '',
        category: currentStore.category || 'sembako',
        phone: currentStore.phone || '',
        address: currentStore.address || '',
        cashier_name: currentStore.cashier_name || '',
        opening_hours: (currentStore as any).opening_hours || '',
        closing_hours: (currentStore as any).closing_hours || '',
        bank_name: (currentStore as any).bank_name || '',
        bank_account_number: (currentStore as any).bank_account_number || '',
        bank_account_holder: (currentStore as any).bank_account_holder || '',
        ewallet_number: (currentStore as any).ewallet_number || '',
        gopay_number: (currentStore as any).gopay_number || '',
        ovo_number: (currentStore as any).ovo_number || '',
        dana_number: (currentStore as any).dana_number || '',
        shopeepay_number: (currentStore as any).shopeepay_number || '',
      });
    }
  }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore) return;

    setIsSaving(true);
    const success = await updateStore(currentStore.id, formData);
    if (success) {
      toast({
        title: 'Sukses',
        description: 'Pengaturan toko berhasil disimpan',
      });
    }
    setIsSaving(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!currentStore) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Tidak ada toko yang dipilih</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Kembali ke Login
          </Button>
        </div>
      </div>
    );
  }

  if (showAdminProtection) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <AdminProtection
          isOpen={showAdminProtection}
          onClose={() => navigate('/')}
          onSuccess={() => setShowAdminProtection(false)}
          title="Masuk ke Pengaturan Toko"
          description="Masukkan kode admin untuk mengakses pengaturan toko"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-4xl">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-lg sm:text-2xl font-bold">Pengaturan Toko</h1>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6">
            <Card className="border-border">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Informasi Toko</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Kelola informasi dasar toko Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="name" className="text-xs sm:text-sm">Nama Toko</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nama toko"
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-xs sm:text-sm">Kategori Toko</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value: StoreCategory) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STORE_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value} className="text-sm">
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs sm:text-sm">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Nomor telepon toko"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-xs sm:text-sm">Alamat</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Alamat lengkap toko"
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Informasi Kasir</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Pengaturan informasi kasir untuk nota
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="cashier_name" className="text-xs sm:text-sm">Nama Kasir</Label>
                  <Input
                    id="cashier_name"
                    value={formData.cashier_name}
                    onChange={(e) => handleInputChange('cashier_name', e.target.value)}
                    placeholder="Nama kasir"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="opening_hours" className="text-xs sm:text-sm">Jam Buka</Label>
                    <Input
                      id="opening_hours"
                      type="time"
                      value={formData.opening_hours}
                      onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                      placeholder="08:00"
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="closing_hours" className="text-xs sm:text-sm">Jam Tutup</Label>
                    <Input
                      id="closing_hours"
                      type="time"
                      value={formData.closing_hours}
                      onChange={(e) => handleInputChange('closing_hours', e.target.value)}
                      placeholder="21:00"
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Informasi Pembayaran</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Pengaturan metode pembayaran untuk transaksi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="bank_name" className="text-xs sm:text-sm">Nama Bank</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    placeholder="Contoh: BRI, BCA, Mandiri"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account_number" className="text-xs sm:text-sm">Nomor Rekening</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                    placeholder="Nomor rekening bank"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_account_holder" className="text-xs sm:text-sm">Nama Pemilik Rekening</Label>
                  <Input
                    id="bank_account_holder"
                    value={formData.bank_account_holder}
                    onChange={(e) => handleInputChange('bank_account_holder', e.target.value)}
                    placeholder="Nama pemilik rekening"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Nomor E-Wallet</div>
                  <p className="text-xs text-muted-foreground">
                    Isi nomor telepon e-wallet yang terdaftar. QR code akan otomatis dibuat untuk pembayaran.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="gopay_number" className="text-xs sm:text-sm">GoPay</Label>
                      <Input
                        id="gopay_number"
                        value={formData.gopay_number}
                        onChange={(e) => handleInputChange('gopay_number', e.target.value)}
                        placeholder="08xx xxxx xxxx"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ovo_number" className="text-xs sm:text-sm">OVO</Label>
                      <Input
                        id="ovo_number"
                        value={formData.ovo_number}
                        onChange={(e) => handleInputChange('ovo_number', e.target.value)}
                        placeholder="08xx xxxx xxxx"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dana_number" className="text-xs sm:text-sm">DANA</Label>
                      <Input
                        id="dana_number"
                        value={formData.dana_number}
                        onChange={(e) => handleInputChange('dana_number', e.target.value)}
                        placeholder="08xx xxxx xxxx"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="shopeepay_number" className="text-xs sm:text-sm">ShopeePay</Label>
                      <Input
                        id="shopeepay_number"
                        value={formData.shopeepay_number}
                        onChange={(e) => handleInputChange('shopeepay_number', e.target.value)}
                        placeholder="08xx xxxx xxxx"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto sm:min-w-32 h-9 sm:h-10">
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="text-xs sm:text-sm">{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};