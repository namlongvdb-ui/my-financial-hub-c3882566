import { numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';

interface PrintVisitVoucherProps {
  data: {
    date: string;
    visitorDepartment: string;
    recipientName: string;
    reason: string;
    amount: number;
  };
}

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

export function PrintVisitVoucher({ data }: PrintVisitVoucherProps) {
  const settings = getOrgSettings();
  const d = new Date(data.date);
  const year = d.getFullYear();
  const amountWords = data.amount > 0 ? numberToVietnameseWords(data.amount) : 'Không đồng';

  const labelStyle: React.CSSProperties = { margin: '8px 0', lineHeight: '1.7' };

  return (
    <div className="print-voucher" style={{ fontFamily: 'Times New Roman, serif', fontSize: '14px', color: '#000', padding: '30px 45px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>{settings.orgName.toUpperCase()}</p>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>{settings.orgSubName.toUpperCase()}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <p style={{ margin: 0 }}>Mẫu: C11-TLĐ</p>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '28px 0 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>PHIẾU THĂM HỎI</h2>
      </div>

      {/* Content */}
      <div style={{ lineHeight: '1.7', fontSize: '14px' }}>
        <p style={labelStyle}>Họ và tên người thăm hỏi: <span style={{ fontWeight: 500 }}>{data.visitorDepartment || '...................................'}</span></p>
        <p style={labelStyle}>Họ và Tên người được thăm hỏi: <span style={{ fontWeight: 500 }}>{data.recipientName || '...................................'}</span></p>
        <p style={labelStyle}>Lý do thăm hỏi: <span style={{ fontWeight: 500 }}>{data.reason || '...................................'}</span></p>
        <p style={labelStyle}>Số tiền: <span style={{ fontWeight: 'bold' }}>{data.amount > 0 ? `${formatCurrency(data.amount)} đ` : '.................'}</span></p>
        <p style={labelStyle}>Bằng chữ: <span style={{ fontWeight: 'bold' }}>{amountWords}.</span></p>
      </div>

      {/* Date */}
      <div style={{ textAlign: 'center', margin: '24px 0 8px', fontStyle: 'italic', fontSize: '13px' }}>
        <p style={{ margin: 0 }}>Ngày ..... tháng ..... năm {year}</p>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', textAlign: 'center', fontSize: '13px' }}>
        <div style={{ width: '50%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>TM.BCH CĐCS</p>
          <p style={{ fontWeight: 'bold', margin: '0 0 2px' }}>Chủ Tịch</p>
          <p style={{ fontSize: '11px', fontStyle: 'italic', margin: '0 0 2px', color: '#666' }}>(Ký, họ tên)</p>
          <p style={{ minHeight: '60px' }}></p>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{settings.unionGroups[0]?.leaderName || ''}</p>
        </div>
        <div style={{ width: '50%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>TM. Tổ công đoàn</p>
          <p style={{ fontWeight: 'bold', margin: '0 0 2px' }}>Tổ trưởng</p>
          <p style={{ fontSize: '11px', fontStyle: 'italic', margin: '0 0 2px', color: '#666' }}>(Ký, họ tên)</p>
          <p style={{ minHeight: '60px' }}></p>
          <p style={{ fontWeight: 'bold', margin: 0 }}></p>
        </div>
      </div>
    </div>
  );
}
