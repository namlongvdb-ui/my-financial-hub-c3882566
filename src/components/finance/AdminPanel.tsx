import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { generateRSAKeyPair, storePrivateKey } from '@/lib/crypto-utils';
import { UserPlus, Key, Shield, Users } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  user_id: string;
  full_name: string;
  email: string | null;
  roles: AppRole[];
  has_signature: boolean;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Quản trị viên',
  lanh_dao: 'Lãnh đạo',
  ke_toan_truong: 'Kế toán trưởng',
  ke_toan: 'Kế toán',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800',
  lanh_dao: 'bg-purple-100 text-purple-800',
  ke_toan_truong: 'bg-blue-100 text-blue-800',
  ke_toan: 'bg-green-100 text-green-800',
};

export function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('ke_toan');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, sigsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email'),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('digital_signatures').select('user_id').eq('is_active', true),
    ]);

    if (profilesRes.data) {
      const userMap = new Map<string, UserWithRole>();
      profilesRes.data.forEach(p => {
        userMap.set(p.user_id, {
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          roles: [],
          has_signature: false,
        });
      });

      rolesRes.data?.forEach(r => {
        const u = userMap.get(r.user_id);
        if (u) u.roles.push(r.role);
      });

      sigsRes.data?.forEach(s => {
        const u = userMap.get(s.user_id);
        if (u) u.has_signature = true;
      });

      setUsers(Array.from(userMap.values()));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newFullName || !newRole) return;
    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email: newEmail, password: newPassword, full_name: newFullName, role: newRole }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Thành công', description: `Đã tạo tài khoản cho ${newFullName}` });
      setCreateDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('ke_toan');
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleGenerateSignature = async (targetUserId: string, targetName: string) => {
    try {
      const { publicKey, privateKey } = await generateRSAKeyPair();

      // Save public key to database
      const { error } = await supabase.from('digital_signatures').upsert({
        user_id: targetUserId,
        public_key: publicKey,
        created_by: user!.id,
        is_active: true,
      }, { onConflict: 'user_id' });

      if (error) throw error;

      // Store private key in localStorage temporarily for the admin to deliver
      // In production, this should be delivered securely to the user
      storePrivateKey(targetUserId, privateKey);

      toast({
        title: 'Đã tạo chữ ký số',
        description: `Cặp khóa RSA đã được tạo cho ${targetName}. Khóa bí mật đã được lưu tạm trong trình duyệt. Khi ${targetName} đăng nhập trên máy này, khóa sẽ được chuyển sang tài khoản của họ.`,
      });

      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi tạo chữ ký số', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Quản trị hệ thống</h1>
            <p className="text-muted-foreground">Quản lý người dùng và phân quyền</p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Tạo tài khoản mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo tài khoản mới</DialogTitle>
              <DialogDescription>Thêm người dùng mới vào hệ thống</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Họ tên</Label>
                <Input value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Mật khẩu</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                    <SelectItem value="lanh_dao">Lãnh đạo</SelectItem>
                    <SelectItem value="ke_toan_truong">Kế toán trưởng</SelectItem>
                    <SelectItem value="ke_toan">Kế toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateUser} disabled={creating} className="w-full">
                {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Danh sách người dùng
          </CardTitle>
          <CardDescription>Quản lý tài khoản, phân quyền và chữ ký số</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Đang tải...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Chữ ký số</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map(r => (
                          <Badge key={r} variant="secondary" className={ROLE_COLORS[r]}>
                            {ROLE_LABELS[r]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.has_signature ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Key className="w-3 h-3 mr-1" /> Đã có
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500">Chưa có</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(u.roles.includes('lanh_dao') || u.roles.includes('ke_toan_truong')) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateSignature(u.user_id, u.full_name)}
                        >
                          <Key className="w-3 h-3 mr-1" />
                          {u.has_signature ? 'Tạo lại khóa' : 'Tạo chữ ký số'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
