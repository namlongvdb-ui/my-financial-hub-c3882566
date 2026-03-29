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
import { StaffList } from '@/components/finance/StaffList';
import { YearClosing } from '@/components/finance/YearClosing';
import { AdminPanel } from '@/components/finance/AdminPanel';
import { ChangePasswordForm } from '@/components/finance/ChangePasswordForm';
import { SignatureHistory } from '@/components/finance/SignatureHistory';
import { PendingVouchers } from '@/components/finance/PendingVouchers';
import { ApprovedVouchers } from '@/components/finance/ApprovedVouchers';
import { NotificationBell } from '@/components/finance/NotificationBell';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin } = useAuth();

  const handleSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleNotificationNavigate = useCallback((view: 'cho-ky' | 'da-duyet') => {
    setCurrentView(view);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        refreshKey={refreshKey}
        notificationBell={<NotificationBell onNavigate={handleNotificationNavigate} />}
      />
      <main className="flex-1 p-6 overflow-auto">
        {currentView === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
        {currentView === 'phieu-tham-hoi' && <VisitVoucherForm onSaved={handleSaved} refreshKey={refreshKey} />}
        {currentView === 'de-nghi-thanh-toan' && <PaymentRequestForm onSaved={handleSaved} refreshKey={refreshKey} />}
        {currentView === 'phieu-thu' && <VoucherForm type="thu" onSaved={handleSaved} refreshKey={refreshKey} />}
        {currentView === 'phieu-chi' && <VoucherForm type="chi" onSaved={handleSaved} refreshKey={refreshKey} />}
        {currentView === 'so-quy' && <CashBook refreshKey={refreshKey} />}
        {currentView === 'so-chi-tiet' && <DetailLedger refreshKey={refreshKey} onSaved={handleSaved} />}
        {currentView === 'danh-sach-can-bo' && <StaffList />}
        {currentView === 'khoa-so' && <YearClosing onYearChanged={handleSaved} />}
        {currentView === 'cai-dat' && <SettingsForm onSaved={handleSaved} />}
        {currentView === 'doi-mat-khau' && <ChangePasswordForm />}
        {currentView === 'lich-su-ky' && <SignatureHistory />}
        {currentView === 'cho-ky' && <PendingVouchers />}
        {currentView === 'da-duyet' && <ApprovedVouchers />}
        {currentView === 'quan-tri' && isAdmin && <AdminPanel />}
      </main>
    </div>
  );
};

export default Index;
