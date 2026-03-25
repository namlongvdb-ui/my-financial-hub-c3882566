import { Transaction, OrgSettings } from '@/types/finance';

const STORAGE_KEY = 'union-finance-transactions';
const BALANCE_KEY = 'union-finance-opening-balance';
const SETTINGS_KEY = 'union-finance-settings';

const defaultSettings: OrgSettings = {
  orgName: 'Công đoàn NHPT Việt Nam',
  orgSubName: 'CĐ NHPT Chi nhánh KV Bắc Đông Bắc',
  leaderName: 'Phí Quang Chiến',
  accountantName: 'Lê Thị Thu Hương',
  creatorName: 'Lê Thị Thu Hương',
  treasurerName: 'Nguyễn Thị Yến',
  unionGroups: [
    { name: 'Tổ CĐ BP Kế toán – Hành chính', leaderName: 'Phí Quang Chiến' },
  ],
  defaultAccountCode: '111',
  openingBalance: 50000000,
};

export function getOrgSettings(): OrgSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Backward compatibility: migrate old unionLeaderName to unionGroups
    if (!parsed.unionGroups && parsed.unionLeaderName) {
      parsed.unionGroups = [{ name: 'Tổ CĐ', leaderName: parsed.unionLeaderName }];
      delete parsed.unionLeaderName;
    }
    // Remove deprecated field
    delete parsed.chiefAccountantName;
    return { ...defaultSettings, ...parsed };
  }
  return defaultSettings;
}

export function saveOrgSettings(settings: OrgSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  setOpeningBalance(settings.openingBalance);
}

export function getOpeningBalance(): number {
  const settings = getOrgSettings();
  return settings.openingBalance;
}

export function setOpeningBalance(balance: number) {
  localStorage.setItem(BALANCE_KEY, JSON.stringify(balance));
}

export function getTransactions(): Transaction[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : getSampleData();
}

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const transactions = getTransactions();
  const newTx: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  transactions.push(newTx);
  saveTransactions(transactions);
  return newTx;
}

export function deleteTransaction(id: string) {
  const transactions = getTransactions().filter(t => t.id !== id);
  saveTransactions(transactions);
}

export function updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) {
  const transactions = getTransactions().map(t =>
    t.id === id ? { ...t, ...updates } : t
  );
  saveTransactions(transactions);
}

export function getNextVoucherNo(type: 'thu' | 'chi' | 'tham-hoi' | 'de-nghi'): string {
  const transactions = getTransactions();
  const prefixMap = { thu: 'PT', chi: 'PC', 'tham-hoi': 'TH', 'de-nghi': 'DN' };
  const prefix = prefixMap[type];
  const existing = transactions.filter(t => t.type === type);
  const nextNum = existing.length + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const groups = ['', 'nghìn', 'triệu', 'tỷ'];

  function readThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let result = '';
    if (h > 0) result += units[h] + ' trăm ';
    if (t > 1) result += units[t] + ' mươi ';
    else if (t === 1) result += 'mười ';
    else if (t === 0 && h > 0 && u > 0) result += 'lẻ ';
    if (u > 0) {
      if (t > 1 && u === 1) result += 'mốt';
      else if (t >= 1 && u === 5) result += 'lăm';
      else result += units[u];
    }
    return result.trim();
  }

  const parts: string[] = [];
  let remaining = num;
  let groupIdx = 0;
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      parts.unshift(readThreeDigits(chunk) + ' ' + groups[groupIdx]);
    }
    remaining = Math.floor(remaining / 1000);
    groupIdx++;
  }

  const text = parts.join(' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1) + ' đồng';
}

function getSampleData(): Transaction[] {
  return [
    {
      id: '1',
      date: '2026-01-22',
      voucherNo: 'PC001',
      type: 'chi',
      amount: 200000,
      description: 'Thăm bổ sung cho vay bù đắp khó khăn do bệnh suy hô hấp cấp',
      personName: 'Trần Nam Long',
      department: 'Tổ CĐ BP Kế toán - Hành chính',
      accountCode: '111',
      approver: 'Phí Quang Chiến',
      attachments: 1,
      createdAt: '2026-01-22T00:00:00Z',
    },
    {
      id: '2',
      date: '2026-01-22',
      voucherNo: 'PC002',
      type: 'chi',
      amount: 200000,
      description: 'Phan Văn Bình bị áp xe da nhọt và cụm nhọt ở mặt phải điều trị tại bệnh viện',
      personName: 'Trần Nam Long',
      department: 'Tổ CĐ BP Kế toán - Hành chính',
      accountCode: '112',
      approver: 'Phí Quang Chiến',
      attachments: 1,
      createdAt: '2026-01-22T00:00:00Z',
    },
    {
      id: '3',
      date: '2026-03-13',
      voucherNo: 'PC003',
      type: 'chi',
      amount: 2584400,
      description: 'Thanh toán chi phí tổ chức ngày Quốc tế Phụ Nữ 08/03',
      personName: 'Trần Nam Long',
      department: 'Tổ CĐ BP Kế toán - Hành chính',
      accountCode: '111',
      approver: 'Phí Quang Chiến',
      attachments: 1,
      createdAt: '2026-03-13T00:00:00Z',
    },
  ];
}
