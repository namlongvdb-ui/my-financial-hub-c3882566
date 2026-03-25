import { useState, useCallback } from 'react';
import { ViewType } from '@/types/finance';
import { AppSidebar } from '@/components/finance/AppSidebar';
import { Dashboard } from '@/components/finance/Dashboard';
import { VoucherForm } from '@/components/finance/VoucherForm';
import { VisitVoucherForm } from '@/components/finance/VisitVoucherForm';
import { PaymentRequestForm } from '@/components/finance/PaymentRequestForm';
import { CashBook } from '@/components/finance/CashBook';
import { DetailLedger } from '@/components/finance/DetailLedger';
import { SettingsForm } from '@/components/finance/SettingsForm';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-6 overflow-auto">
        {currentView === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
        {currentView === 'phieu-thu' && <VoucherForm type="thu" onSaved={handleSaved} refreshKey={refreshKey} />}
        {currentView === 'phieu-chi' && <VoucherForm type="chi" onSaved={handleSaved} refreshKey={refreshKey} />}
        {currentView === 'phieu-tham-hoi' && <VisitVoucherForm onSaved={handleSaved} />}
        {currentView === 'de-nghi-thanh-toan' && <PaymentRequestForm onSaved={handleSaved} />}
        {currentView === 'so-quy' && <CashBook refreshKey={refreshKey} />}
        {currentView === 'so-chi-tiet' && <DetailLedger refreshKey={refreshKey} onSaved={handleSaved} />}
        {currentView === 'cai-dat' && <SettingsForm onSaved={handleSaved} />}
      </main>
    </div>
  );
};

export default Index;
