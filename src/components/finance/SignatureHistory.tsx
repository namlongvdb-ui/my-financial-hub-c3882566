import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { History, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface SignatureRecord {
  id: string;
  voucher_id: string;
  voucher_type: string;
  signed_at: string;
  signer_name: string;
  signer_role: string;
}

const TYPE_LABELS: Record<string, string> = {
  thu: 'Phiếu Thu',
  chi: 'Phiếu Chi',
};

const ROLE_LABELS: Record<string, string> = {
  lanh_dao: 'Lãnh đạo',
  ke_toan_truong: 'Kế toán trưởng',
  admin: 'Quản trị viên',
  ke_toan: 'Kế toán',
};

export function SignatureHistory() {
  const [records, setRecords] = useState<SignatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);

      const [sigsRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from('voucher_signatures').select('*').order('signed_at', { ascending: false }),
        supabase.from('profiles').select('user_id, full_name'),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      const nameMap = new Map<string, string>();
      profilesRes.data?.forEach(p => nameMap.set(p.user_id, p.full_name));

      const roleMap = new Map<string, string>();
      rolesRes.data?.forEach(r => {
        // Keep highest-priority role
        if (!roleMap.has(r.user_id) || r.role === 'lanh_dao') {
          roleMap.set(r.user_id, r.role);
        }
      });

      const mapped: SignatureRecord[] = (sigsRes.data || []).map(s => ({
        id: s.id,
        voucher_id: s.voucher_id,
        voucher_type: s.voucher_type,
        signed_at: s.signed_at,
        signer_name: nameMap.get(s.signer_id) || 'Không rõ',
        signer_role: roleMap.get(s.signer_id) || '',
      }));

      setRecords(mapped);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filtered = records.filter(r =>
    !search ||
    r.voucher_id.toLowerCase().includes(search.toLowerCase()) ||
    r.signer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <History className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Lịch sử ký duyệt</h1>
          <p className="text-muted-foreground">Xem toàn bộ lịch sử ký duyệt chứng từ</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Danh sách chữ ký ({filtered.length})
          </CardTitle>
          <CardDescription>
            <div className="relative mt-2 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo số phiếu hoặc người ký..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có lịch sử ký duyệt</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian ký</TableHead>
                  <TableHead>Loại chứng từ</TableHead>
                  <TableHead>Số phiếu</TableHead>
                  <TableHead>Người ký</TableHead>
                  <TableHead>Chức vụ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {format(new Date(r.signed_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TYPE_LABELS[r.voucher_type] || r.voucher_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.voucher_id}</TableCell>
                    <TableCell>{r.signer_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ROLE_LABELS[r.signer_role] || r.signer_role}
                      </Badge>
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
