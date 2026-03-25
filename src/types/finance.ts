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

export type ViewType = 'dashboard' | 'phieu-thu' | 'phieu-chi' | 'phieu-tham-hoi' | 'de-nghi-thanh-toan' | 'so-quy' | 'so-chi-tiet' | 'cai-dat';

export interface OrgSettings {
  orgName: string;
  orgSubName: string;
  leaderName: string;
  accountantName: string;
  chiefAccountantName: string;
  creatorName: string;
  treasurerName: string;
  unionLeaderName: string;
  defaultAccountCode: string;
  openingBalance: number;
}
