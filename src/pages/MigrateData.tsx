import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { staffApi, orgSettingsApi, yearDataApi, transactionsApi } from '@/lib/api-client';
import { CheckCircle2, XCircle, Loader2, Database, ArrowRight } from 'lucide-react';

interface MigrationLog {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  message: string;
  count?: number;
}

const STORAGE_KEYS = {
  transactions: 'union-finance-transactions',
  balance: 'union-finance-opening-balance',
  settings: 'union-finance-settings',
  activeYear: 'union-finance-active-year',
  yearData: 'union-finance-year-data',
  staff: 'union-finance-staff',
  staffSettings: 'union-finance-staff-settings',
  transferHistory: 'union-finance-transfer-history',
};

export default function MigrateData() {
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (log: MigrationLog) => {
    setLogs(prev => [...prev, log]);
  };

  const updateLog = (step: string, updates: Partial<MigrationLog>) => {
    setLogs(prev => prev.map(l => l.step === step ? { ...l, ...updates } : l));
  };

  // Scan localStorage for transaction keys like union-finance-transactions-2024
  function getTransactionYears(): { year: number; transactions: any[] }[] {
    const results: { year: number; transactions: any[] }[] = [];
    
    // Check old format (no year suffix)
    const oldData = localStorage.getItem(STORAGE_KEYS.transactions);
    if (oldData) {
      try {
        const txs = JSON.parse(oldData);
        if (txs.length > 0) {
          // Group by year from date
          const yearMap: Record<number, any[]> = {};
          for (const tx of txs) {
            const y = new Date(tx.date).getFullYear();
            if (!yearMap[y]) yearMap[y] = [];
            yearMap[y].push(tx);
          }
          for (const [y, txs] of Object.entries(yearMap)) {
            results.push({ year: parseInt(y), transactions: txs });
          }
        }
      } catch {}
    }

    // Check year-specific keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.transactions + '-')) {
        const yearStr = key.replace(STORAGE_KEYS.transactions + '-', '');
        const year = parseInt(yearStr);
        if (!isNaN(year) && !results.find(r => r.year === year)) {
          try {
            const txs = JSON.parse(localStorage.getItem(key) || '[]');
            if (txs.length > 0) {
              results.push({ year, transactions: txs });
            }
          } catch {}
        }
      }
    }

    return results.sort((a, b) => a.year - b.year);
  }

  async function runMigration() {
    setRunning(true);
    setLogs([]);
    setDone(false);

    // ===== 1. Org Settings =====
    const settingsStep = 'org-settings';
    addLog({ step: settingsStep, status: 'running', message: 'Đang di chuyển cài đặt tổ chức...' });
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.settings);
      if (raw) {
        const settings = JSON.parse(raw);
        const { error } = await orgSettingsApi.save(settings);
        if (error) throw new Error(error.message);
        updateLog(settingsStep, { status: 'success', message: 'Đã di chuyển cài đặt tổ chức', count: 1 });
      } else {
        updateLog(settingsStep, { status: 'skipped', message: 'Không có dữ liệu cài đặt trong localStorage' });
      }
    } catch (err: any) {
      updateLog(settingsStep, { status: 'error', message: `Lỗi: ${err.message}` });
    }

    // ===== 2. Staff Settings =====
    const staffSettingsStep = 'staff-settings';
    addLog({ step: staffSettingsStep, status: 'running', message: 'Đang di chuyển cài đặt lương cơ sở...' });
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.staffSettings);
      if (raw) {
        const settings = JSON.parse(raw);
        const { error } = await staffApi.saveSettings({ baseSalary: settings.baseSalary || 2340000 });
        if (error) throw new Error(error.message);
        updateLog(staffSettingsStep, { status: 'success', message: 'Đã di chuyển cài đặt lương', count: 1 });
      } else {
        updateLog(staffSettingsStep, { status: 'skipped', message: 'Không có dữ liệu cài đặt lương' });
      }
    } catch (err: any) {
      updateLog(staffSettingsStep, { status: 'error', message: `Lỗi: ${err.message}` });
    }

    // ===== 3. Staff List =====
    const staffStep = 'staff';
    addLog({ step: staffStep, status: 'running', message: 'Đang di chuyển danh sách cán bộ...' });
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.staff);
      if (raw) {
        const staffList = JSON.parse(raw);
        let count = 0;
        for (const s of staffList) {
          const { error } = await staffApi.create({
            fullName: s.fullName,
            department: s.department,
            position: s.position,
            birthDate: s.birthDate,
            gender: s.gender,
            salaryCoefficient: s.salaryCoefficient,
            positionCoefficient: s.positionCoefficient,
            regionalSalary: s.regionalSalary,
          });
          if (error) {
            console.warn(`Lỗi thêm cán bộ ${s.fullName}:`, error);
          } else {
            count++;
          }
        }
        updateLog(staffStep, { status: 'success', message: `Đã di chuyển ${count}/${staffList.length} cán bộ`, count });
      } else {
        updateLog(staffStep, { status: 'skipped', message: 'Không có danh sách cán bộ' });
      }
    } catch (err: any) {
      updateLog(staffStep, { status: 'error', message: `Lỗi: ${err.message}` });
    }

    // ===== 4. Transfer History =====
    const transferStep = 'transfers';
    addLog({ step: transferStep, status: 'running', message: 'Đang di chuyển lịch sử điều chuyển...' });
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.transferHistory);
      if (raw) {
        const transfers = JSON.parse(raw);
        let count = 0;
        for (const t of transfers) {
          const { error } = await staffApi.addTransfer({
            staffName: t.staffName,
            fromDepartment: t.fromDepartment,
            toDepartment: t.toDepartment,
            type: t.type,
            date: t.date,
            note: t.note,
          });
          if (!error) count++;
        }
        updateLog(transferStep, { status: 'success', message: `Đã di chuyển ${count}/${transfers.length} bản ghi`, count });
      } else {
        updateLog(transferStep, { status: 'skipped', message: 'Không có lịch sử điều chuyển' });
      }
    } catch (err: any) {
      updateLog(transferStep, { status: 'error', message: `Lỗi: ${err.message}` });
    }

    // ===== 5. Year Data =====
    const yearStep = 'year-data';
    addLog({ step: yearStep, status: 'running', message: 'Đang di chuyển dữ liệu năm tài chính...' });
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.yearData);
      if (raw) {
        const yearList = JSON.parse(raw);
        let count = 0;
        for (const yd of yearList) {
          const { error } = await yearDataApi.create(yd.year, yd.openingBalance);
          if (!error) count++;
        }
        updateLog(yearStep, { status: 'success', message: `Đã di chuyển ${count}/${yearList.length} năm`, count });
      } else {
        updateLog(yearStep, { status: 'skipped', message: 'Không có dữ liệu năm tài chính' });
      }
    } catch (err: any) {
      updateLog(yearStep, { status: 'error', message: `Lỗi: ${err.message}` });
    }

    // ===== 6. Transactions (all years) =====
    const txStep = 'transactions';
    addLog({ step: txStep, status: 'running', message: 'Đang di chuyển chứng từ...' });
    try {
      const yearGroups = getTransactionYears();
      if (yearGroups.length > 0) {
        let totalCount = 0;
        let totalAll = 0;
        for (const { year, transactions } of yearGroups) {
          totalAll += transactions.length;
          for (const tx of transactions) {
            const payload = {
              date: tx.date,
              voucherNo: tx.voucherNo,
              type: tx.type,
              amount: tx.amount,
              description: tx.description,
              personName: tx.personName,
              department: tx.department,
              accountCode: tx.accountCode,
              approver: tx.approver,
              attachments: tx.attachments || 0,
              year,
              recipientName: tx.recipientName,
              reason: tx.reason,
              bankAccount: tx.bankAccount,
              bankAccountName: tx.bankAccountName,
              bankName: tx.bankName,
              times: tx.times,
            };
            const { error } = await transactionsApi.create(payload);
            if (!error) totalCount++;
          }
        }
        updateLog(txStep, { status: 'success', message: `Đã di chuyển ${totalCount}/${totalAll} chứng từ (${yearGroups.length} năm)`, count: totalCount });
      } else {
        updateLog(txStep, { status: 'skipped', message: 'Không có chứng từ nào trong localStorage' });
      }
    } catch (err: any) {
      updateLog(txStep, { status: 'error', message: `Lỗi: ${err.message}` });
    }

    setDone(true);
    setRunning(false);
  }

  const getIcon = (status: MigrationLog['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped': return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
      default: return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBadge = (status: MigrationLog['status']) => {
    switch (status) {
      case 'running': return <Badge variant="outline" className="text-blue-600 border-blue-300">Đang chạy</Badge>;
      case 'success': return <Badge variant="outline" className="text-green-600 border-green-300">Thành công</Badge>;
      case 'error': return <Badge variant="destructive">Lỗi</Badge>;
      case 'skipped': return <Badge variant="secondary">Bỏ qua</Badge>;
      default: return <Badge variant="outline">Chờ</Badge>;
    }
  };

  // Preview localStorage data counts
  const preview = {
    settings: !!localStorage.getItem(STORAGE_KEYS.settings),
    staffSettings: !!localStorage.getItem(STORAGE_KEYS.staffSettings),
    staff: (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.staff) || '[]').length; } catch { return 0; } })(),
    transfers: (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.transferHistory) || '[]').length; } catch { return 0; } })(),
    yearData: (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.yearData) || '[]').length; } catch { return 0; } })(),
    transactions: getTransactionYears(),
  };

  const totalTx = preview.transactions.reduce((s, g) => s + g.transactions.length, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Di chuyển dữ liệu localStorage → PostgreSQL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Công cụ này sẽ đọc toàn bộ dữ liệu đang lưu trong trình duyệt (localStorage) 
              và gửi lên máy chủ PostgreSQL qua API.
            </div>

            {/* Data preview */}
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm">Dữ liệu tìm thấy trong localStorage:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Cài đặt tổ chức: <Badge variant={preview.settings ? "default" : "secondary"}>{preview.settings ? "Có" : "Không"}</Badge></div>
                <div>Cài đặt lương: <Badge variant={preview.staffSettings ? "default" : "secondary"}>{preview.staffSettings ? "Có" : "Không"}</Badge></div>
                <div>Cán bộ: <Badge variant={preview.staff > 0 ? "default" : "secondary"}>{preview.staff}</Badge></div>
                <div>Điều chuyển: <Badge variant={preview.transfers > 0 ? "default" : "secondary"}>{preview.transfers}</Badge></div>
                <div>Năm tài chính: <Badge variant={preview.yearData > 0 ? "default" : "secondary"}>{preview.yearData}</Badge></div>
                <div>Chứng từ: <Badge variant={totalTx > 0 ? "default" : "secondary"}>{totalTx} ({preview.transactions.length} năm)</Badge></div>
              </div>
            </div>

            <Button onClick={runMigration} disabled={running} className="w-full" size="lg">
              {running ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang di chuyển...</>
              ) : done ? (
                'Chạy lại di chuyển'
              ) : (
                'Bắt đầu di chuyển dữ liệu'
              )}
            </Button>

            {logs.length > 0 && (
              <ScrollArea className="h-64 border rounded-lg p-3">
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.step} className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(log.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{log.message}</span>
                          {getBadge(log.status)}
                        </div>
                        {log.count !== undefined && log.status === 'success' && (
                          <span className="text-xs text-muted-foreground">{log.count} bản ghi</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {done && (
              <div className="text-center text-sm text-muted-foreground border-t pt-4">
                ✅ Hoàn tất! Bạn có thể xóa localStorage sau khi kiểm tra dữ liệu trên server.
                <br />
                <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = '/'}>
                  Quay về trang chính
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
