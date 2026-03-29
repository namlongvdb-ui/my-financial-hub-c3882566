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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { generateRSAKeyPair, storePrivateKey } from '@/lib/crypto-utils';
import { UserPlus, Key, Shield, Users, RotateCcw, Ban, Trash2, UserCheck, RefreshCw } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  user_id: string;
  full_name: string;
  username: string | null;
  roles: AppRole[];
  has_signature: boolean;
  is_banned: boolean;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Quản trị viên',
  lanh_dao: 'Lãnh đạo',
  nguoi_lap: 'Người lập',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800',
  lanh_dao: 'bg-purple-100 text-purple-800',
  nguoi_lap: 'bg-green-100 text-green-800',
};

export function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ user_id: string; full_name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('nguoi_lap');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ user_id: string; full_name: string } | null>(null);
  const [managing, setManaging] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<{ user_id: string; full_name: string; currentRole: AppRole } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('nguoi_lap');
  const [changingRole, setChangingRole] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, sigsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, username'),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('digital_signatures').select('user_id').eq('is_active', true),
    ]);

    if (profilesRes.data) {
      const userMap = new Map<string, UserWithRole>();
      profilesRes.data.forEach(p => {
        userMap.set(p.user_id, {
          user_id: p.user_id,
          full_name: p.full_name,
          username: p.username,
          roles: [],
          has_signature: false,
          is_banned: false,
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
    if (!newUsername || !newPassword || !newFullName || !newRole) return;
    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { username: newUsername, password: newPassword, full_name: newFullName, role: newRole }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Thành công', description: `Đã tạo tài khoản cho ${newFullName}` });
      setCreateDialogOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('nguoi_lap');
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPassword) return;
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { user_id: resetTarget.user_id, new_password: resetPassword }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Thành công', description: `Đã đặt lại mật khẩu cho ${resetTarget.full_name}` });
      setResetDialogOpen(false);
      setResetPassword('');
      setResetTarget(null);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setResetting(false);
  };

  const handleManageUser = async (targetUserId: string, targetName: string, action: 'disable' | 'enable' | 'delete') => {
    setManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { user_id: targetUserId, action }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const msgs: Record<string, string> = { disable: 'Đã vô hiệu hoá', enable: 'Đã kích hoạt lại', delete: 'Đã xoá' };
      toast({ title: 'Thành công', description: `${msgs[action]} tài khoản ${targetName}` });
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setManaging(false);
  };

  const handleChangeRole = async () => {
    if (!roleTarget || !selectedRole) return;
    setChangingRole(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { user_id: roleTarget.user_id, action: 'change_role', new_role: selectedRole }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Thành công', description: `Đã đổi vai trò của ${roleTarget.full_name} thành ${ROLE_LABELS[selectedRole]}` });
      setRoleDialogOpen(false);
      setRoleTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setChangingRole(false);
  };

  const handleGenerateSignature = async (targetUserId: string, targetName: string) => {
    try {
      const { publicKey, privateKey } = await generateRSAKeyPair();

      const { error } = await supabase.from('digital_signatures').upsert({
        user_id: targetUserId,
        public_key: publicKey,
        created_by: user!.id,
        is_active: true,
      }, { onConflict: 'user_id' });

      if (error) throw error;

      storePrivateKey(targetUserId, privateKey);

      toast({
        title: 'Đã tạo chữ ký số',
        description: `Cặp khóa RSA đã được tạo cho ${targetName}. Khóa bí mật đã được lưu tạm trong trình duyệt.`,
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
                <Label>Tên đăng nhập</Label>
                <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="nguyenvana" />
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
                    <SelectItem value="nguoi_lap">Người lập</SelectItem>
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
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Chữ ký số</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.username}</TableCell>
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
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.includes('lanh_dao') && (
                          <Button size="sm" variant="outline" onClick={() => handleGenerateSignature(u.user_id, u.full_name)}>
                            <Key className="w-3 h-3 mr-1" />
                            {u.has_signature ? 'Tạo lại khóa' : 'Tạo chữ ký số'}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setResetTarget({ user_id: u.user_id, full_name: u.full_name }); setResetDialogOpen(true); }}>
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reset MK
                        </Button>
                        {u.username !== 'admin' && (
                          <Button size="sm" variant="outline" onClick={() => {
                            setRoleTarget({ user_id: u.user_id, full_name: u.full_name, currentRole: u.roles[0] || 'nguoi_lap' });
                            setSelectedRole(u.roles[0] || 'nguoi_lap');
                            setRoleDialogOpen(true);
                          }}>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Đổi vai trò
                          </Button>
                        )}
                        {u.username !== 'admin' && (
                          <>
                            <Button
                              size="sm"
                              variant={u.is_banned ? 'default' : 'outline'}
                              onClick={() => handleManageUser(u.user_id, u.full_name, u.is_banned ? 'enable' : 'disable')}
                              disabled={managing}
                            >
                              {u.is_banned ? <UserCheck className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                              {u.is_banned ? 'Kích hoạt' : 'Vô hiệu hoá'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget({ user_id: u.user_id, full_name: u.full_name })}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Xoá
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt mật khẩu mới cho: <strong>{resetTarget?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mật khẩu mới</Label>
              <Input
                type="password"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <Button onClick={handleResetPassword} disabled={resetting || resetPassword.length < 6} className="w-full">
              {resetting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xoá tài khoản <strong>{deleteTarget?.full_name}</strong>? Thao tác này không thể hoàn tác. Toàn bộ dữ liệu liên quan sẽ bị xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleManageUser(deleteTarget.user_id, deleteTarget.full_name, 'delete')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {managing ? 'Đang xoá...' : 'Xoá tài khoản'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi vai trò</DialogTitle>
            <DialogDescription>
              Thay đổi vai trò cho: <strong>{roleTarget?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vai trò mới</Label>
              <Select value={selectedRole} onValueChange={v => setSelectedRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="lanh_dao">Lãnh đạo</SelectItem>
                  <SelectItem value="nguoi_lap">Người lập</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleChangeRole} disabled={changingRole} className="w-full">
              {changingRole ? 'Đang xử lý...' : 'Xác nhận đổi vai trò'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
