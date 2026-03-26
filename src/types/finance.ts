export interface Transaction {
  id: string;
  date: string;
  voucherNo: string;
  type: 'thu' | 'chi' | 'tham-hoi' | 'de-nghi';
  amount: number;
  description: string;
  personName: string;
  department: string;
  accountCode: string;
  approver: string;
  attachments: number;
  createdAt: string;
  // Extra fields for tham-hoi
  recipientName?: string;
  reason?: string;
  // Extra fields for de-nghi
  bankAccount?: string;
  bankAccountName?: string;
  bankName?: string;
  times?: string;
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

export type ViewType = 'dashboard' | 'phieu-thu' | 'phieu-chi' | 'phieu-tham-hoi' | 'de-nghi-thanh-toan' | 'so-quy' | 'so-chi-tiet' | 'danh-sach-can-bo' | 'cai-dat';

export interface StaffMember {
  id: string;
  fullName: string;
  department: string;
  position: string;
  birthDate: string;
  gender: 'nam' | 'nu';
  salaryCoefficient: number;
  positionCoefficient: number;
}

export interface StaffSettings {
  minimumSalary: number; // Lương tối thiểu
  regionalSalary: number; // Lương vùng
  baseSalary: number; // Lương cơ sở (để tính trần đoàn phí)
}

export interface OrgSettings {
  orgName: string;
  orgSubName: string;
  leaderName: string;
  accountantName: string;
  creatorName: string;
  treasurerName: string;
  unionGroups: { name: string; leaderName: string }[];
  defaultAccountCode: string;
  openingBalance: number;
}