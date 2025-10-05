import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Ban, UserX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  user_id: string;
  email: string;
  username: string;
  is_approved: boolean;
  created_at: string;
  approved_at?: string;
}

export const UserManagement = () => {
  const { isAdmin } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<{ id: string; action: 'approve' | 'reject' | 'suspend' } | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, username, is_approved, created_at, approved_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pending = data?.filter(u => !u.is_approved) || [];
      const approved = data?.filter(u => u.is_approved) || [];

      setPendingUsers(pending);
      setApprovedUsers(approved);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          approved_by: authData.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Add user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'user',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      toast.success('User berhasil disetujui');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Gagal menyetujui user');
    } finally {
      setActionUser(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      // Delete user profile (will cascade to auth.users)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Delete from auth (using admin API would be better, but we'll let cascade handle it)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Auth delete error (may need service role key):', authError);
      }

      toast.success('User ditolak dan dihapus dari database');
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Gagal menolak user');
    } finally {
      setActionUser(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: false,
          approved_by: null,
          approved_at: null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User berhasil di-suspend');
      fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Gagal suspend user');
    } finally {
      setActionUser(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Anda tidak memiliki akses ke halaman ini
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Manajemen User</h1>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Menunggu Persetujuan
            {pendingUsers.length > 0 && (
              <span className="bg-destructive text-destructive-foreground text-sm px-2 py-1 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada user yang menunggu persetujuan</p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Daftar: {new Date(user.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setActionUser({ id: user.user_id, action: 'approve' })}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setActionUser({ id: user.user_id, action: 'reject' })}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Users */}
      <Card>
        <CardHeader>
          <CardTitle>User Aktif ({approvedUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedUsers.length === 0 ? (
            <p className="text-muted-foreground">Belum ada user yang disetujui</p>
          ) : (
            <div className="space-y-4">
              {approvedUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Disetujui: {user.approved_at ? new Date(user.approved_at).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActionUser({ id: user.user_id, action: 'suspend' })}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Suspend
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionUser} onOpenChange={() => setActionUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionUser?.action === 'approve' && 'Setujui User?'}
              {actionUser?.action === 'reject' && 'Tolak & Hapus User?'}
              {actionUser?.action === 'suspend' && 'Suspend User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionUser?.action === 'approve' &&
                'User akan dapat login dan menggunakan aplikasi.'}
              {actionUser?.action === 'reject' &&
                'User akan dihapus dari database dan tidak dapat login. Jika ingin mendaftar lagi, mereka harus menghubungi admin.'}
              {actionUser?.action === 'suspend' &&
                'User tidak akan dapat login sampai disetujui kembali.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionUser?.action === 'approve') handleApprove(actionUser.id);
                if (actionUser?.action === 'reject') handleReject(actionUser.id);
                if (actionUser?.action === 'suspend') handleSuspend(actionUser.id);
              }}
            >
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
