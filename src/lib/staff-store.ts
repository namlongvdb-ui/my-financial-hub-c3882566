import { StaffMember, StaffSettings } from '@/types/finance';

const STAFF_KEY = 'union-finance-staff';
const STAFF_SETTINGS_KEY = 'union-finance-staff-settings';

const defaultStaffSettings: StaffSettings = {
  minimumSalary: 2340000,
  regionalSalary: 2340000,
  baseSalary: 2340000,
};

export function getStaffSettings(): StaffSettings {
  const stored = localStorage.getItem(STAFF_SETTINGS_KEY);
  return stored ? { ...defaultStaffSettings, ...JSON.parse(stored) } : defaultStaffSettings;
}

export function saveStaffSettings(settings: StaffSettings) {
  localStorage.setItem(STAFF_SETTINGS_KEY, JSON.stringify(settings));
}

export function getStaffList(): StaffMember[] {
  const stored = localStorage.getItem(STAFF_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveStaffList(list: StaffMember[]) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(list));
}

export function addStaff(staff: Omit<StaffMember, 'id'>): StaffMember {
  const list = getStaffList();
  const newStaff: StaffMember = { ...staff, id: crypto.randomUUID() };
  list.push(newStaff);
  saveStaffList(list);
  return newStaff;
}

export function updateStaff(id: string, updates: Partial<Omit<StaffMember, 'id'>>) {
  const list = getStaffList().map(s => s.id === id ? { ...s, ...updates } : s);
  saveStaffList(list);
}

export function deleteStaff(id: string) {
  saveStaffList(getStaffList().filter(s => s.id !== id));
}

export function calculateInsuranceSalary(
  salaryCoefficient: number,
  positionCoefficient: number,
  settings: StaffSettings
): number {
  return (salaryCoefficient * settings.regionalSalary) + (positionCoefficient * settings.minimumSalary);
}

export function calculateUnionFee(insuranceSalary: number, baseSalary: number): number {
  const fee = insuranceSalary * 0.005;
  const cap = baseSalary * 0.10;
  return Math.min(fee, cap);
}
