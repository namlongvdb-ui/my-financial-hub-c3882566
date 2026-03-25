export interface Transaction {
  id: string;
  date: string;
  voucherNo: string;
  type: 'thu' | 'chi';
  amount: number;
  description: string;
  personName: string;
  department: string;
  accountCode: string;
  approver: string;
  attachments: number;
  createdAt: string;
}

export interface CashBookEntry {
  date: string;
  voucherNo: string;
  description: string;
  thu: number;
  chi: number;
  balance: number;
}

export interface DetailLedgerEntry extends Transaction {
  runningBalance: number;
}

export type ViewType = 'dashboard' | 'phieu-thu' | 'phieu-chi' | 'so-quy' | 'so-chi-tiet';
