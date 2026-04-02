import { useState, useEffect, useCallback } from 'react';
import { Transaction, OrgSettings, YearData } from '@/types/finance';
import { transactionsApi, orgSettingsApi, yearDataApi } from '@/lib/api-client';
import { toast } from 'sonner';

const defaultSettings: OrgSettings = {
  orgName: 'CÔNG ĐOÀN NHPT VIỆT NAM',
  orgSubName: 'CÔNG ĐOÀN NHPT CHI NHÁNH KV BẮC ĐÔNG BẮC',
  leaderName: '',
  accountantName: '',
  creatorName: '',
  treasurerName: '',
  unionGroups: [],
  areaRepresentatives: [],
  defaultAccountCode: '',
  openingBalance: 0,
};

// ============ ORG SETTINGS ============
export function useOrgSettings() {
  const [settings, setSettings] = useState<OrgSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await orgSettingsApi.get();
    if (data && !error) {
      setSettings({ ...defaultSettings, ...data });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = useCallback(async (newSettings: OrgSettings) => {
    const { error } = await orgSettingsApi.save(newSettings);
    if (error) {
      toast.error('Lỗi lưu cài đặt: ' + error.message);
      return false;
    }
    setSettings(newSettings);
    return true;
  }, []);

  return { settings, loading, saveSettings, refetch: fetchSettings };
}

// ============ TRANSACTIONS ============
export function useTransactions(year?: number, type?: string, refreshKey?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await transactionsApi.getAll(year, type);
    if (data && !error) {
      setTransactions(data);
    }
    setLoading(false);
  }, [year, type]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions, refreshKey]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const { data, error } = await transactionsApi.create(tx);
    if (error) {
      toast.error('Lỗi thêm chứng từ: ' + error.message);
      return null;
    }
    await fetchTransactions();
    return data;
  }, [fetchTransactions]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const { error } = await transactionsApi.update(id, updates);
    if (error) {
      toast.error('Lỗi cập nhật: ' + error.message);
      return false;
    }
    await fetchTransactions();
    return true;
  }, [fetchTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await transactionsApi.delete(id);
    if (error) {
      toast.error('Lỗi xóa: ' + error.message);
      return false;
    }
    await fetchTransactions();
    return true;
  }, [fetchTransactions]);

  const getNextVoucherNo = useCallback(async (voucherType: string) => {
    const { data } = await transactionsApi.getNextVoucherNo(voucherType, year);
    return data?.voucherNo || '';
  }, [year]);

  return {
    transactions, loading, refetch: fetchTransactions,
    addTransaction, updateTransaction, deleteTransaction, getNextVoucherNo,
  };
}

// ============ YEAR DATA ============
export function useYearData(refreshKey?: number) {
  const [yearDataList, setYearDataList] = useState<YearData[]>([]);
  const [activeYear, setActiveYearState] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const fetchYearData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await yearDataApi.getAll();
    if (data && !error) {
      setYearDataList(data);
    }
    // Active year from localStorage (lightweight, no API needed)
    const stored = localStorage.getItem('union-finance-active-year');
    if (stored) setActiveYearState(parseInt(stored, 10));
    setLoading(false);
  }, []);

  useEffect(() => { fetchYearData(); }, [fetchYearData, refreshKey]);

  const setActiveYear = useCallback((year: number) => {
    localStorage.setItem('union-finance-active-year', JSON.stringify(year));
    setActiveYearState(year);
  }, []);

  const closeYear = useCallback(async (year: number) => {
    const { data, error } = await yearDataApi.closeYear(year);
    if (error) {
      toast.error('Lỗi khóa sổ: ' + error.message);
      return { success: false, message: error.message };
    }
    await fetchYearData();
    return { success: true, message: data?.message || 'Khóa sổ thành công' };
  }, [fetchYearData]);

  const isYearClosed = useCallback((year: number) => {
    const yd = yearDataList.find(y => y.year === year);
    return yd?.isClosed ?? false;
  }, [yearDataList]);

  const getOpeningBalanceForYear = useCallback((year: number) => {
    const yd = yearDataList.find(y => y.year === year);
    return yd?.openingBalance ?? 0;
  }, [yearDataList]);

  const availableYears = yearDataList.map(y => y.year).sort((a, b) => b - a);
  if (!availableYears.includes(activeYear)) availableYears.unshift(activeYear);

  return {
    yearDataList, activeYear, setActiveYear, loading,
    closeYear, isYearClosed, getOpeningBalanceForYear, availableYears,
    refetch: fetchYearData,
  };
}
