import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getVoucherLabel } from '@/lib/notification-utils';
import { toast } from 'sonner';
import { Printer, CheckCircle2, FileCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ApprovedVoucher {
  id: string;
  voucher_id: string;
  voucher_type: string;
  voucher_data: any;
  created_by: string;
  status: string;
  created_at: string;
  signed_at: string | null;
  printed_at: string | null;
}

export function ApprovedVouchers() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<ApprovedVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApproved = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('pending_vouchers')
      .select('*')
      .eq('created_by', user.id)
      .in('status', ['signed', 'printed'])
      .order('signed_at', { ascending: false });

    setVouchers((data || []).map(v => ({ ...v, voucher_data: v.voucher_data as any })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchApproved(); }, [fetchApproved]);

  const handleMarkPrinted = async (voucher: ApprovedVoucher) => {
    await supabase.from('pending_vouchers')
      .update({ status: 'printed', printed_at: new Date().toISOString() })
      .eq('id', voucher.id);

    toast.success(`Đã đánh dấu in ${getVoucherLabel(voucher.voucher_type)} số ${voucher.voucher_id}`);
    fetchApproved();
  };

  return (
    <Card className="shadow-lg border-0 ring-1 ring-border">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b-2 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Chứng từ đã duyệt</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p>Chưa có chứng từ nào được duyệt</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại</TableHead>
                <TableHead>Số chứng từ</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Ngày ký</TableHead>
                <TableHead>Trạng thái</TableHead>
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
                  <TableCell>
                    {v.signed_at ? format(new Date(v.signed_at), 'dd/MM/yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell>
                    {v.status === 'printed' ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Đã in</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Đã ký</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {v.status === 'signed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPrinted(v)}
                      >
                        <Printer className="h-4 w-4 mr-1" /> Đánh dấu đã in
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
  );
}
