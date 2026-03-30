import * as XLSX from 'xlsx';
import { getTransactions, getOpeningBalance, getOrgSettings } from '@/lib/finance-store';
import { getStaffList, getStaffSettings, calculateInsuranceSalary, calculateUnionFee } from '@/lib/staff-store';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN');
}

const typeLabels: Record<string, string> = {
  thu: 'Phiếu Thu',
  chi: 'Phiếu Chi',
  'tham-hoi': 'Thăm Hỏi',
  'de-nghi': 'Đề Nghị TT',
};

export function exportCashBookExcel() {
  const settings = getOrgSettings();
  const txs = getTransactions().sort((a, b) => a.date.localeCompare(b.date));
  const opening = getOpeningBalance();
  let balance = opening;

  const rows: (string | number)[][] = [
    [settings.orgName + ' - ' + settings.orgSubName],
    ['SỔ QUỸ TIỀN MẶT'],
    [],
    ['Ngày CT', 'Số CT', 'Nội dung', 'Thu', 'Chi', 'Tồn'],
    ['', '', 'Số dư đầu kỳ', '', '', opening],
  ];

  txs.forEach(tx => {
    const thu = tx.type === 'thu' ? tx.amount : 0;
    const chi = tx.type === 'chi' ? tx.amount : 0;
    balance = balance + thu - chi;
    rows.push([formatDate(tx.date), tx.voucherNo, tx.description, thu || '', chi || '', balance]);
  });

  const totalThu = txs.filter(t => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
  const totalChi = txs.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0);
  rows.push(['', '', 'Tổng phát sinh', totalThu, totalChi, '']);
  rows.push(['', '', 'Số dư cuối kỳ', '', '', opening + totalThu - totalChi]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 50 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sổ Quỹ');
  XLSX.writeFile(wb, `SoQuy_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportDetailLedgerExcel() {
  const settings = getOrgSettings();
  const txs = getTransactions().sort((a, b) => a.date.localeCompare(b.date));

  const rows: (string | number)[][] = [
    [settings.orgName + ' - ' + settings.orgSubName],
    ['SỔ CHI TIẾT'],
    [],
    ['Ngày CT', 'Số CT', 'Loại', 'Số tiền', 'Nội dung', 'Thu', 'Chi', 'TK', 'Họ tên', 'Đơn vị', 'Lãnh đạo'],
  ];

  txs.forEach(tx => {
    rows.push([
      formatDate(tx.date),
      tx.voucherNo,
      typeLabels[tx.type] || tx.type,
      tx.amount,
      tx.description,
      tx.type === 'thu' ? tx.amount : '',
      tx.type === 'chi' ? tx.amount : '',
      tx.accountCode,
      tx.personName,
      tx.department,
      tx.approver,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 50 }, { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 20 }, { wch: 30 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sổ Chi Tiết');
  XLSX.writeFile(wb, `SoChiTiet_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportFullReportExcel() {
  const settings = getOrgSettings();
  const txs = getTransactions().sort((a, b) => a.date.localeCompare(b.date));
  const opening = getOpeningBalance();
  const wb = XLSX.utils.book_new();

  const totalThu = txs.filter(t => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
  const totalChi = txs.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0);
  const totalTH = txs.filter(t => t.type === 'tham-hoi').reduce((s, t) => s + t.amount, 0);
  const totalDN = txs.filter(t => t.type === 'de-nghi').reduce((s, t) => s + t.amount, 0);

  const summaryRows = [
    [settings.orgName],
    [settings.orgSubName],
    ['BÁO CÁO TÀI CHÍNH TỔNG HỢP'],
    [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['Chỉ tiêu', 'Số tiền (VNĐ)'],
    ['Số dư đầu kỳ', opening],
    ['Tổng thu', totalThu],
    ['Tổng chi', totalChi],
    ['Tổng thăm hỏi', totalTH],
    ['Tổng đề nghị thanh toán', totalDN],
    ['Số dư cuối kỳ', opening + totalThu - totalChi],
    [],
    ['Tổng số chứng từ', txs.length],
    ['Phiếu thu', txs.filter(t => t.type === 'thu').length],
    ['Phiếu chi', txs.filter(t => t.type === 'chi').length],
    ['Phiếu thăm hỏi', txs.filter(t => t.type === 'tham-hoi').length],
    ['Đề nghị thanh toán', txs.filter(t => t.type === 'de-nghi').length],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

  let balance = opening;
  const cashRows: (string | number)[][] = [
    ['Ngày CT', 'Số CT', 'Nội dung', 'Thu', 'Chi', 'Tồn'],
    ['', '', 'Số dư đầu kỳ', '', '', opening],
  ];
  txs.forEach(tx => {
    const thu = tx.type === 'thu' ? tx.amount : 0;
    const chi = tx.type === 'chi' ? tx.amount : 0;
    balance = balance + thu - chi;
    cashRows.push([formatDate(tx.date), tx.voucherNo, tx.description, thu || '', chi || '', balance]);
  });
  cashRows.push(['', '', 'Số dư cuối kỳ', '', '', opening + totalThu - totalChi]);
  const ws2 = XLSX.utils.aoa_to_sheet(cashRows);
  ws2['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 50 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Sổ Quỹ');

  const detailRows: (string | number)[][] = [
    ['Ngày CT', 'Số CT', 'Loại', 'Số tiền', 'Nội dung', 'Họ tên', 'Đơn vị', 'TK', 'Lãnh đạo'],
  ];
  txs.forEach(tx => {
    detailRows.push([formatDate(tx.date), tx.voucherNo, typeLabels[tx.type] || tx.type, tx.amount, tx.description, tx.personName, tx.department, tx.accountCode, tx.approver]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(detailRows);
  ws3['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 50 }, { wch: 20 }, { wch: 30 }, { wch: 8 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Chi Tiết');

  XLSX.writeFile(wb, `BaoCaoTaiChinh_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportStaffListExcel() {
  const settings = getOrgSettings();
  const staffSettings = getStaffSettings();
  const list = getStaffList();
  const wb = XLSX.utils.book_new();

  const fmt = (n: number) => Math.round(n);

  // Group by department
  const grouped: Record<string, typeof list> = {};
  for (const s of list) {
    const dept = s.department || 'Chưa phân tổ';
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(s);
  }

  // Sheet for each union group
  for (const [dept, members] of Object.entries(grouped)) {
    const rows: (string | number)[][] = [
      [settings.orgName + ' - ' + settings.orgSubName],
      [`DANH SÁCH ĐOÀN VIÊN - ${dept.toUpperCase()}`],
      [`Lương cơ sở: ${staffSettings.baseSalary.toLocaleString('vi-VN')} đ`],
      [],
      ['STT', 'Họ và tên', 'Chức vụ', 'Ngày sinh', 'GT', 'HS lương', 'HS CV', 'Lương vùng', 'Lương BH', 'Đoàn phí CĐ'],
    ];

    let totalFee = 0;
    members.forEach((s, i) => {
      const lbh = calculateInsuranceSalary(s.salaryCoefficient, s.positionCoefficient, s.regionalSalary, staffSettings.baseSalary);
      const fee = calculateUnionFee(lbh, staffSettings.baseSalary);
      totalFee += fee;
      rows.push([
        i + 1,
        s.fullName,
        s.position,
        s.birthDate ? new Date(s.birthDate).toLocaleDateString('vi-VN') : '',
        s.gender === 'nam' ? 'Nam' : 'Nữ',
        s.salaryCoefficient,
        s.positionCoefficient,
        fmt(s.regionalSalary),
        fmt(lbh),
        fmt(fee),
      ]);
    });

    rows.push([]);
    rows.push(['', '', '', '', '', '', '', 'Tổng cộng:', '', fmt(totalFee)]);

    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = dept.length > 31 ? dept.substring(0, 28) + '...' : dept;
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 5 },
      { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Summary sheet
  const summaryRows: (string | number)[][] = [
    [settings.orgName + ' - ' + settings.orgSubName],
    ['TỔNG HỢP DANH SÁCH ĐOÀN VIÊN'],
    [],
    ['Tổ công đoàn', 'Số đoàn viên', 'Tổng đoàn phí CĐ/tháng'],
  ];
  let grandTotal = 0;
  for (const [dept, members] of Object.entries(grouped)) {
    const deptFee = members.reduce((sum, s) => {
      const lbh = calculateInsuranceSalary(s.salaryCoefficient, s.positionCoefficient, s.regionalSalary, staffSettings.baseSalary);
      return sum + calculateUnionFee(lbh, staffSettings.baseSalary);
    }, 0);
    grandTotal += deptFee;
    summaryRows.push([dept, members.length, fmt(deptFee)]);
  }
  summaryRows.push([]);
  summaryRows.push(['Tổng cộng', list.length, fmt(grandTotal)]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 16 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp');

  XLSX.writeFile(wb, `DanhSachDoanVien_${new Date().toISOString().slice(0, 10)}.xlsx`);
}