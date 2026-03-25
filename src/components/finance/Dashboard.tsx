import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTransactions, getOpeningBalance, getOrgSettings } from '@/lib/finance-store';
import { Wallet, TrendingUp, TrendingDown, Banknote } from 'lucide-react';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + ' ₫';
}

export function Dashboard({ refreshKey }: { refreshKey?: number }) {
  const settings = getOrgSettings();
  const stats = useMemo(() => {
    const txs = getTransactions();
    const opening = getOpeningBalance();
    const totalThu = txs.filter(t => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
    const totalChi = txs.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0);
    const closing = opening + totalThu - totalChi;
    return { opening, totalThu, totalChi, closing, txCount: txs.length };
  }, [refreshKey]);

  const cards = [
    { title: 'Số dư đầu kỳ', value: stats.opening, icon: Banknote, className: 'border-l-4 border-l-primary' },
    { title: 'Tổng thu', value: stats.totalThu, icon: TrendingUp, className: 'border-l-4 border-l-green-500' },
    { title: 'Tổng chi', value: stats.totalChi, icon: TrendingDown, className: 'border-l-4 border-l-destructive' },
    { title: 'Số dư cuối kỳ', value: stats.closing, icon: Wallet, className: 'border-l-4 border-l-accent' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan tài chính</h1>
        <p className="text-muted-foreground text-sm">{settings.orgSubName}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <Card key={card.title} className={`${card.className} shadow-md hover:shadow-lg transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{formatCurrency(card.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-md">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="text-4xl font-bold text-primary">{stats.txCount}</p>
          <p className="text-sm mt-1">Tổng số chứng từ</p>
        </CardContent>
      </Card>
    </div>
  );
}
