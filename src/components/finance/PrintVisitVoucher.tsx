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
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const amountWords = data.amount > 0 ? numberToVietnameseWords(data.amount) : 'Không đồng';

  return (
    <div className="print-voucher" style={{ fontFamily: 'Times New Roman, serif', fontSize: '13px', color: '#000', padding: '30px 40px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>CĐ NHPT CHI NHÁNH KV BẮC ĐÔNG BẮC</p>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>TỔ CÔNG ĐOÀN KẾ TOÁN – HÀNH CHÍNH</p>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>PGD CAO BẰNG</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <p style={{ margin: 0 }}>Mẫu: C11-TLĐ</p>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '25px 0 20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>PHIẾU THĂM HỎI</h2>
      </div>

      {/* Content */}
      <div style={{ lineHeight: '2' }}>
        <p style={{ margin: '3px 0' }}>Họ và tên người thăm hỏi: <span>{data.visitorDepartment || '...................................'}</span></p>
        <p style={{ margin: '3px 0' }}>Họ và Tên người được thăm hỏi: <span>{data.recipientName || '...................................'}</span></p>
        <p style={{ margin: '3px 0' }}>Lý do thăm hỏi: <span>{data.reason || '...................................'}</span></p>
        <p style={{ margin: '3px 0' }}>Số tiền: <span style={{ fontWeight: 'bold' }}>{data.amount > 0 ? `${formatCurrency(data.amount)} đ` : '.................'}</span></p>
        <p style={{ margin: '3px 0' }}>Bằng chữ: <span style={{ fontWeight: 'bold' }}>{amountWords}.</span></p>
      </div>

      {/* Date and Signatures */}
      <div style={{ textAlign: 'center', margin: '20px 0 5px', fontStyle: 'italic', fontSize: '13px' }}>
        <p style={{ margin: 0 }}>Ngày ..... tháng ..... năm {year}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', textAlign: 'center', fontSize: '13px' }}>
        <div style={{ width: '50%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>TM.BCH CĐCS</p>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Chủ Tịch</p>
          <p style={{ minHeight: '60px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{settings.unionLeaderName}</p>
        </div>
        <div style={{ width: '50%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>TM. Tổ công đoàn</p>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Tổ trưởng</p>
          <p style={{ minHeight: '60px' }}></p>
          <p style={{ fontWeight: 'bold' }}></p>
        </div>
      </div>
    </div>
  );
}
