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
import { ArrowLeft, Save, Store as StoreIcon, Eye, EyeOff, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminProtection } from '@/components/Auth/AdminProtection';
import { supabase } from '@/integrations/supabase/client';

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
    qris_image_url: '',
    whatsapp_number: '',
    admin_password: '',
    settings_password: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showAdminProtection, setShowAdminProtection] = useState(true);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [uploadingQris, setUploadingQris] = useState(false);
  const [qrisFullPreview, setQrisFullPreview] = useState<string>('');
  const [qrisCroppedPreview, setQrisCroppedPreview] = useState<string>('');

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
        qris_image_url: (currentStore as any).qris_image_url || '',
        whatsapp_number: (currentStore as any).whatsapp_number || '',
        admin_password: (currentStore as any).admin_password || '122344566',
        settings_password: (currentStore as any).settings_password || '12234566',
      });
    }
  }, [currentStore]);

  const handleSave = async () => {
    if (!currentStore) return;

    setIsSaving(true);

    // Only send fields that exist in formData
    const payload: Record<string, any> = {
      name: formData.name,
      category: formData.category,
      phone: formData.phone,
      address: formData.address,
      cashier_name: formData.cashier_name,
      opening_hours: formData.opening_hours,
      closing_hours: formData.closing_hours,
      bank_name: formData.bank_name,
      bank_account_number: formData.bank_account_number,
      bank_account_holder: formData.bank_account_holder,
      qris_image_url: formData.qris_image_url,
      whatsapp_number: formData.whatsapp_number,
      admin_password: formData.admin_password,
      settings_password: formData.settings_password,
    };

    const success = await updateStore(currentStore.id, payload);
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

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStore) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'File harus berupa gambar', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Ukuran file maksimal 5MB', variant: 'destructive' });
      return;
    }

    setUploadingQris(true);
    try {
      const { extractQrRegionAndEnhance } = await import('@/lib/image-utils');

      // Preview full image locally
      const fullUrl = URL.createObjectURL(file);
      setQrisFullPreview(fullUrl);

      // Extract QR only and enhance
      const croppedBlob = await extractQrRegionAndEnhance(file);
      const croppedFile = new File([croppedBlob], 'qris.png', { type: 'image/png' });
      const croppedPreview = URL.createObjectURL(croppedBlob);
      setQrisCroppedPreview(croppedPreview);

      // Upload cropped image via Edge Function (use Supabase client to avoid 401 and wrong URL issues)
      const form = new FormData();
      form.append('file', croppedFile);
      form.append('storeId', currentStore.id);

      const { data: fnData, error: fnError } = await supabase.functions.invoke('upload-qris', {
        body: form,
      } as any);
      if (fnError) {
        throw new Error(fnError.message || 'Upload failed');
      }
      const json = fnData as any;
      if (!json?.publicUrl) throw new Error('publicUrl not returned');

      // Simpan URL ke database
      const publicUrl = json.publicUrl as string;
      const { error: updateError } = await supabase
        .from('stores')
        .update({ qris_image_url: publicUrl } as any)
        .eq('id', currentStore.id);

      if (updateError) throw updateError;

      // Update local state dan localStorage
      setFormData(prev => ({ ...prev, qris_image_url: publicUrl }));
      localStorage.setItem(`qrisUrl:${currentStore.id}`, publicUrl);

      toast({ title: 'Sukses', description: 'QRIS berhasil diupload dan disimpan ke database' });
    } catch (err: any) {
      console.error('QRIS upload error:', err);
      const message = err?.message || (typeof err === 'string' ? err : 'Gagal memproses/mengupload QRIS');
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setUploadingQris(false);
    }
  };

  const handleRemoveQris = async () => {
    if (!currentStore) return;
    
    try {
      // Hapus dari database
      const { error } = await supabase
        .from('stores')
        .update({ qris_image_url: null } as any)
        .eq('id', currentStore.id);

      if (error) throw error;

      // Hapus dari localStorage dan state
      localStorage.removeItem(`qrisUrl:${currentStore.id}`);
      setFormData(prev => ({ ...prev, qris_image_url: '' }));
      setQrisFullPreview('');
      setQrisCroppedPreview('');

      toast({ title: 'Sukses', description: 'QRIS berhasil dihapus' });
    } catch (err) {
      console.error('Remove QRIS error:', err);
      toast({ title: 'Error', description: 'Gagal menghapus QRIS', variant: 'destructive' });
    }
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
          onClose={() => {
            setShowAdminProtection(false);
            navigate('/');
          }}
          onSuccess={() => setShowAdminProtection(false)}
          title="Masuk ke Pengaturan Toko"
          description="Masukkan kode pengaturan untuk mengakses menu ini"
          useSettingsPassword={true}
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
                    <Label htmlFor="opening_hours" className="text-xs sm:text-sm">Jam Buka (HH:MM)</Label>
                    <Input
                      id="opening_hours"
                      type="time"
                      value={formData.opening_hours}
                      onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                      placeholder="08:00"
                      className="h-9 sm:h-10 text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-second-field]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                      step="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="closing_hours" className="text-xs sm:text-sm">Jam Tutup (HH:MM)</Label>
                    <Input
                      id="closing_hours"
                      type="time"
                      value={formData.closing_hours}
                      onChange={(e) => handleInputChange('closing_hours', e.target.value)}
                      placeholder="21:00"
                      className="h-9 sm:h-10 text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-second-field]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                      step="60"
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
                  <div className="text-sm font-medium">Kode QRIS</div>
                  <p className="text-xs text-muted-foreground">
                    Upload gambar QRIS (bisa foto struk/aplikasi). Sistem akan otomatis memotong dan menajamkan bagian QR saja.
                  </p>

                  <div>
                    <Label htmlFor="qris_upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploadingQris ? 'Memproses...' : 'Klik untuk upload gambar QRIS'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PNG/JPG maks 5MB</p>
                      </div>
                    </Label>
                    <Input id="qris_upload" type="file" accept="image/*" onChange={handleQrisUpload} className="hidden" disabled={uploadingQris} />
                  </div>

                  {(qrisFullPreview || qrisCroppedPreview) && (
                    <div className="grid grid-cols-2 gap-3">
                      {qrisFullPreview && (
                        <div>
                          <div className="text-xs mb-1 text-muted-foreground">Gambar Asli</div>
                          <img src={qrisFullPreview} alt="Asli" className="w-full h-auto object-contain border rounded-lg p-2 bg-white" />
                        </div>
                      )}
                      {qrisCroppedPreview && (
                        <div>
                          <div className="text-xs mb-1 text-muted-foreground">Hanya QR (ditampilkan saat bayar)</div>
                          <img src={qrisCroppedPreview} alt="QR saja" className="w-full h-auto object-contain border rounded-lg p-2 bg-white" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleRemoveQris} disabled={uploadingQris}>Hapus QRIS</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Konfigurasi WhatsApp & Keamanan</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Nomor WhatsApp untuk daftar belanja & kata sandi admin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="whatsapp_number" className="text-xs sm:text-sm">Nomor WhatsApp (untuk Daftar Belanja)</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                    placeholder="08xx xxxx xxxx"
                    className="h-9 sm:h-10 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nomor WhatsApp untuk mengirim daftar belanja
                  </p>
                </div>

                <div>
                  <Label htmlFor="admin_password" className="text-xs sm:text-sm">Kata Sandi Admin (Menu Admin)</Label>
                  <div className="relative">
                    <Input
                      id="admin_password"
                      type={showAdminPassword ? "text" : "password"}
                      value={formData.admin_password}
                      onChange={(e) => handleInputChange('admin_password', e.target.value)}
                      placeholder="Default: 122344566"
                      className="h-9 sm:h-10 text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 sm:h-10 px-3 hover:bg-transparent"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                    >
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kode untuk mengakses menu admin
                  </p>
                </div>

                <div>
                  <Label htmlFor="settings_password" className="text-xs sm:text-sm">Kata Sandi Pengaturan (Menu Pengaturan)</Label>
                  <div className="relative">
                    <Input
                      id="settings_password"
                      type={showSettingsPassword ? "text" : "password"}
                      value={formData.settings_password}
                      onChange={(e) => handleInputChange('settings_password', e.target.value)}
                      placeholder="Default: 12234566"
                      className="h-9 sm:h-10 text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 sm:h-10 px-3 hover:bg-transparent"
                      onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                    >
                      {showSettingsPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kode untuk mengakses menu pengaturan toko
                  </p>
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