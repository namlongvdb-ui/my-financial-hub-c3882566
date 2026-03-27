import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Key, Shield, Trash2 } from 'lucide-react';
import { generateRSAKeyPair } from '@/lib/crypto-utils';

type AppRole = 'admin' | 'accountant' | 'leader' | 'user';

interface UserInfo {
  user_id: string;
  email: string;
  full_name: string;
  roles: AppRole[];
  hasDigitalKey: boolean;
}

export function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: allRoles } = await supabase.from('user_roles').select('*');
    const { data: allKeys } = await supabase.from('digital_keys').select('user_id');

    if (profiles) {
      const userList: UserInfo[] = profiles.map(p => ({
        user_id: p.user_id,
        email: p.full_name,
        full_name: p.full_name,
        roles: (allRoles || []).filter(r => r.user_id === p.user_id).map(r => r.role as AppRole),
        hasDigitalKey: (allKeys || []).some(k => k.user_id === p.user_id),
      }));
      setUsers(userList);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // Create user via edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: newEmail, password: newPassword, fullName: newFullName, role: newRole }
      });

      if (error) throw error;
      
      toast({ title: 'Thành công', description: `Đã tạo tài khoản cho ${newFullName}` });
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('user');
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleGenerateKeys = async (userId: string) => {
    try {
      const { publicKey, privateKeyEncrypted } = await generateRSAKeyPair();
      
      // Delete existing key if any
      await supabase.from('digital_keys').delete().eq('user_id', userId);
      
      const { error } = await supabase.from('digital_keys').insert({
        user_id: userId,
        public_key: publicKey,
        private_key_encrypted: privateKeyEncrypted,
        created_by: user?.id,
      });

      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã tạo cặp khóa RSA cho người dùng' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Thành công', description: `Đã thêm quyền ${role}` });
      fetchUsers();
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').delete()
      .eq('user_id', userId).eq('role', role);
    if (!error) {
      toast({ title: 'Đã xóa quyền' });
      fetchUsers();
    }
  };

  const roleLabels: Record<AppRole, string> = {
    admin: 'Quản trị',
    leader: 'Lãnh đạo',
    accountant: 'Kế toán',
    user: 'Người dùng',
  };

  const roleColors: Record<AppRole, string> = {
    admin: 'bg-red-100 text-red-800',
    leader: 'bg-blue-100 text-blue-800',
    accountant: 'bg-green-100 text-green-800',
    user: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6" /> Quản trị người dùng
      </h2>

      {/* Create user form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Tạo tài khoản mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <Label>Họ tên</Label>
              <Input value={newFullName} onChange={e => setNewFullName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Mật khẩu</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-1">
              <Label>Vai trò</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Người dùng</SelectItem>
                  <SelectItem value="accountant">Kế toán</SelectItem>
                  <SelectItem value="leader">Lãnh đạo</SelectItem>
                  <SelectItem value="admin">Quản trị</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* User list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Chữ ký số</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.map(r => (
                        <Badge key={r} variant="outline" className={roleColors[r]}>
                          {roleLabels[r]}
                          <button
                            onClick={() => handleRemoveRole(u.user_id, r)}
                            className="ml-1 hover:text-destructive"
                          >×</button>
                        </Badge>
                      ))}
                      <Select onValueChange={v => handleAddRole(u.user_id, v as AppRole)}>
                        <SelectTrigger className="h-6 w-20 text-xs">
                          <SelectValue placeholder="+ Thêm" />
                        </SelectTrigger>
                        <SelectContent>
                          {(['admin', 'leader', 'accountant', 'user'] as AppRole[])
                            .filter(r => !u.roles.includes(r))
                            .map(r => (
                              <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.hasDigitalKey ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <Key className="h-3 w-3 mr-1" /> Đã tạo
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Chưa có</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateKeys(u.user_id)}
                    >
                      <Key className="h-4 w-4 mr-1" />
                      {u.hasDigitalKey ? 'Tạo lại khóa' : 'Tạo chữ ký số'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
