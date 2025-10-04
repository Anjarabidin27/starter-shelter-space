import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';

interface AdminProtectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  useSettingsPassword?: boolean; // Add flag to use settings password instead
}

export const AdminProtection = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Autentikasi Admin Diperlukan",
  description = "Masukkan kata sandi admin untuk melanjutkan",
  useSettingsPassword = false
}: AdminProtectionProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentStore } = useStore();

  // Use settings password or admin password based on prop
  const REQUIRED_PASSWORD = useSettingsPassword 
    ? ((currentStore as any)?.settings_password || '12234566')
    : ((currentStore as any)?.admin_password || '122344566');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a brief delay for security
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Password check:', { entered: password, required: REQUIRED_PASSWORD, useSettings: useSettingsPassword });

    if (password === REQUIRED_PASSWORD) {
      const successMsg = useSettingsPassword ? 'Akses pengaturan berhasil!' : 'Akses admin berhasil!';
      toast.success(successMsg);
      setPassword('');
      setIsLoading(false);
      onSuccess();
      handleClose(); // Auto close after success
    } else {
      const errorMsg = useSettingsPassword ? 'Kode pengaturan salah!' : 'Kata sandi admin salah!';
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminPassword">
              {useSettingsPassword ? 'Kode Pengaturan' : 'Kata Sandi Admin'}
            </Label>
            <Input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={useSettingsPassword ? 'Masukkan kode pengaturan' : 'Masukkan kata sandi admin'}
              required
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Memverifikasi...' : 'Masuk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};