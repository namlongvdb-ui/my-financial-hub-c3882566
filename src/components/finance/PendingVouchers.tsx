import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { signData, hashData, getPrivateKey } from '@/lib/crypto-utils';
import { getVoucherLabel, notifyCreator } from '@/lib/notification-utils';
import { toast } from 'sonner';
import { PenTool, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PendingVoucher {
  id: string;
  voucher_id: string;
  voucher_type: string;
  voucher_data: any;
  created_by: string;
  status: string;
  created_at: string;
  creator_name?: string;
}

export function PendingVouchers() {
  const { user, profile } = useAuth();
  const [vouchers, setVouchers] = useState<PendingVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<PendingVoucher | null>(null);
  const [password, setPassword] = useState('');  // kept for UI but not used for key retrieval
  const [signing, setSigning] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    // Get vouchers that are pending and not yet signed by this user
    const { data: pendingData } = await supabase
      .from('pending_vouchers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!pendingData || !user) { setLoading(false); return; }

    // Check which ones this user already signed
    const voucherIds = pendingData.map(v => v.voucher_id);
    const { data: existingSigs } = await supabase
      .from('voucher_signatures')
      .select('voucher_id')
      .eq('signer_id', user.id)
      .in('voucher_id', voucherIds);

    const signedSet = new Set(existingSigs?.map(s => s.voucher_id) || []);

    // Get creator names
    const creatorIds = [...new Set(pendingData.map(v => v.created_by))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', creatorIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

    const unsigned = pendingData
      .filter(v => !signedSet.has(v.voucher_id))
      .map(v => ({
        ...v,
        voucher_data: v.voucher_data as any,
        creator_name: profileMap.get(v.created_by) || 'N/A',
      }));

    setVouchers(unsigned);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleSign = async () => {
    if (!selectedVoucher || !user || !password) return;
    setSigning(true);

    try {
      const privateKey = getPrivateKey(user.id);
      if (!privateKey) {
        toast.error('Chưa có chữ ký số trên thiết bị này');
        setSigning(false);
        return;
      }

      const dataStr = JSON.stringify({
        voucherNo: selectedVoucher.voucher_data.voucherNo || selectedVoucher.voucher_id,
        date: selectedVoucher.voucher_data.date,
        amount: selectedVoucher.voucher_data.amount,
        description: selectedVoucher.voucher_data.description,
        personName: selectedVoucher.voucher_data.personName,
        type: selectedVoucher.voucher_type,
      });

      const dataHash = await hashData(dataStr);
      const signature = await signData(privateKey, dataStr);

      const { error } = await supabase.from('voucher_signatures').insert({
        voucher_id: selectedVoucher.voucher_id,
        voucher_type: selectedVoucher.voucher_type,
        signer_id: user.id,
        signature,
        data_hash: dataHash,
      });

      if (error) throw error;

      // Check if all signers have signed - if so, mark as signed
      const signerIds = await getActiveSignerIds();
      const { data: allSigs } = await supabase
        .from('voucher_signatures')
        .select('signer_id')
        .eq('voucher_id', selectedVoucher.voucher_id);

      const signedBy = new Set(allSigs?.map(s => s.signer_id) || []);
      signedBy.add(user.id);
      const allSigned = signerIds.every(id => signedBy.has(id));

      if (allSigned) {
        await supabase.from('pending_vouchers')
          .update({ status: 'signed', signed_at: new Date().toISOString() })
          .eq('id', selectedVoucher.id);
      }

      // Notify creator
      await notifyCreator(
        selectedVoucher.created_by,
        selectedVoucher.voucher_id,
        selectedVoucher.voucher_type,
        getVoucherLabel(selectedVoucher.voucher_type),
        profile?.full_name || 'Người ký'
      );

      toast.success(`Đã ký duyệt ${getVoucherLabel(selectedVoucher.voucher_type)} số ${selectedVoucher.voucher_id}`);
      setSignDialogOpen(false);
      setPassword('');
      setSelectedVoucher(null);
      fetchPending();
    } catch (err: any) {
      toast.error('Lỗi khi ký: ' + (err.message || 'Unknown'));
    }
    setSigning(false);
  };

  return (
    <Card className="shadow-lg border-0 ring-1 ring-border">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b-2 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl">Chứng từ chờ ký duyệt</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
            <p>Không có chứng từ nào cần ký</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại</TableHead>
                <TableHead>Số chứng từ</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map(v => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Badge variant="outline">{getVoucherLabel(v.voucher_type)}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{v.voucher_id}</TableCell>
                  <TableCell>{v.voucher_data?.date || format(new Date(v.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="max-w-48 truncate">{v.voucher_data?.description || ''}</TableCell>
                  <TableCell className="text-right font-medium">
                    {(v.voucher_data?.amount || 0).toLocaleString('vi-VN')}đ
                  </TableCell>
                  <TableCell>{v.creator_name}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => { setSelectedVoucher(v); setSignDialogOpen(true); }}
                    >
                      <PenTool className="h-4 w-4 mr-1" /> Ký
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ký duyệt chứng từ</DialogTitle>
            <DialogDescription>
              {selectedVoucher && `${getVoucherLabel(selectedVoucher.voucher_type)} số ${selectedVoucher.voucher_id}`}
            </DialogDescription>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="font-medium">Ngày:</span> {selectedVoucher.voucher_data?.date}</p>
                <p><span className="font-medium">Nội dung:</span> {selectedVoucher.voucher_data?.description}</p>
                <p><span className="font-medium">Số tiền:</span> {(selectedVoucher.voucher_data?.amount || 0).toLocaleString('vi-VN')}đ</p>
                <p><span className="font-medium">Người liên quan:</span> {selectedVoucher.voucher_data?.personName}</p>
              </div>
              <div className="space-y-2">
                <Label>Nhập mật khẩu để ký</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mật khẩu chữ ký số..."
                  onKeyDown={e => e.key === 'Enter' && handleSign()}
                />
              </div>
              <Button onClick={handleSign} disabled={signing || !password} className="w-full">
                {signing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
                Xác nhận ký duyệt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

async function getActiveSignerIds(): Promise<string[]> {
  const { data } = await supabase
    .from('digital_signatures')
    .select('user_id')
    .eq('is_active', true);
  return data ? [...new Set(data.map(d => d.user_id))] : [];
}
