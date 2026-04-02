import { useState, useEffect, useCallback } from 'react';
import { StaffMember, StaffSettings, TransferRecord } from '@/types/finance';
import { staffApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { calculateInsuranceSalary, calculateUnionFee } from '@/lib/staff-store';

const defaultStaffSettings: StaffSettings = { baseSalary: 2340000 };

export function useStaffList() {
  const [list, setList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data, error } = await staffApi.getAll();
    if (data && !error) {
      setList(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const addStaff = useCallback(async (staff: Omit<StaffMember, 'id'>) => {
    const { data, error } = await staffApi.create(staff);
    if (error) { toast.error('Lỗi thêm đoàn viên: ' + error.message); return null; }
    await fetchList();
    return data;
  }, [fetchList]);

  const updateStaff = useCallback(async (id: string, updates: Partial<StaffMember>) => {
    const { error } = await staffApi.update(id, updates);
    if (error) { toast.error('Lỗi cập nhật: ' + error.message); return false; }
    await fetchList();
    return true;
  }, [fetchList]);

  const deleteStaff = useCallback(async (id: string) => {
    const { error } = await staffApi.delete(id);
    if (error) { toast.error('Lỗi xóa: ' + error.message); return false; }
    await fetchList();
    return true;
  }, [fetchList]);

  return { list, loading, refetch: fetchList, addStaff, updateStaff, deleteStaff };
}

export function useStaffSettings() {
  const [settings, setSettings] = useState<StaffSettings>(defaultStaffSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await staffApi.getSettings();
    if (data && !error) {
      setSettings({ ...defaultStaffSettings, ...data });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = useCallback(async (newSettings: StaffSettings) => {
    const { error } = await staffApi.saveSettings(newSettings);
    if (error) { toast.error('Lỗi lưu thông số: ' + error.message); return false; }
    setSettings(newSettings);
    return true;
  }, []);

  return { settings, loading, saveSettings, refetch: fetchSettings };
}

export function useTransferHistory() {
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data, error } = await staffApi.getTransferHistory();
    if (data && !error) {
      setHistory(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const addTransfer = useCallback(async (record: Omit<TransferRecord, 'id'>) => {
    const { error } = await staffApi.addTransfer(record);
    if (error) { toast.error('Lỗi ghi lịch sử: ' + error.message); return false; }
    await fetchHistory();
    return true;
  }, [fetchHistory]);

  return { history, loading, addTransfer, refetch: fetchHistory };
}

export { calculateInsuranceSalary, calculateUnionFee };
