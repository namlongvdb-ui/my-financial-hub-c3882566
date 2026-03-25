import { getTransactions, getOrgSettings } from '@/lib/finance-store';
import { useMemo } from 'react';

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN');
}

export function PrintDetailLedger({ refreshKey }: { refreshKey?: number }) {
  const settings = getOrgSettings();
  const rows = useMemo(() => {
    return getTransactions().sort((a, b) => a.date.localeCompare(b.date));
  }, [refreshKey]);

  const cellStyle: React.CSSProperties = { border: '1px solid #000', padding: '3px 5px', fontSize: '11px' };
  const headerCellStyle: React.CSSProperties = { ...cellStyle, fontWeight: 'bold', textAlign: 'center', background: '#f0f0f0' };
  const rightCell: React.CSSProperties = { ...cellStyle, textAlign: 'right' };
  const centerCell: React.CSSProperties = { ...cellStyle, textAlign: 'center' };

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', color: '#000', padding: '15px 20px' }}>
      {/* Header */}
      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '12px' }}>{settings.orgName.toUpperCase()}</p>
      <p style={{ fontWeight: 'bold', margin: '0 0 10px', fontSize: '12px' }}>{settings.orgSubName.toUpperCase()}</p>

      <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', margin: '10px 0 15px' }}>SỔ CHI TIẾT</h2>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerCellStyle}>NgàyCT</th>
            <th style={headerCellStyle}>SoCT</th>
            <th style={headerCellStyle}>Sotien</th>
            <th style={headerCellStyle}>Noidung</th>
            <th style={headerCellStyle}>LoaiCT</th>
            <th style={headerCellStyle}>Thu</th>
            <th style={headerCellStyle}>Chi</th>
            <th style={headerCellStyle}>TK</th>
            <th style={headerCellStyle}>Hoten</th>
            <th style={headerCellStyle}>Donvi</th>
            <th style={headerCellStyle}>LD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td style={centerCell}>{formatDate(row.date)}</td>
              <td style={centerCell}>{row.voucherNo}</td>
              <td style={rightCell}>{formatCurrency(row.amount)}</td>
              <td style={cellStyle}>{row.description}</td>
              <td style={centerCell}>{row.type === 'thu' ? 'PT' : 'PC'}</td>
              <td style={rightCell}>{row.type === 'thu' ? formatCurrency(row.amount) : '0'}</td>
              <td style={rightCell}>{row.type === 'chi' ? formatCurrency(row.amount) : '0'}</td>
              <td style={centerCell}>{row.accountCode}</td>
              <td style={cellStyle}>{row.personName}</td>
              <td style={cellStyle}>{row.department}</td>
              <td style={cellStyle}>{row.approver}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={cellStyle} colSpan={11}>Chưa có dữ liệu</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
