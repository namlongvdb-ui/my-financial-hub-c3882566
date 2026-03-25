import { numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';

interface PrintPaymentRequestProps {
  data: {
    date: string;
    requestNo: string;
    requesterName: string;
    department: string;
    content: string;
    amount: number;
    times: string;
    bankAccount: string;
    bankAccountName: string;
    bankName: string;
    attachments: string;
  };
}

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

export function PrintPaymentRequest({ data }: PrintPaymentRequestProps) {
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
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>TỔ CĐ BỘ PHẬN KẾ TOÁN – HÀNH CHÍNH</p>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>PHÒNG GD CAO BẰNG</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <p style={{ margin: 0 }}>Mẫu số C37- HĐ</p>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '20px 0 5px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>GIẤY ĐỀ NGHỊ THANH TOÁN</h2>
        <p style={{ fontStyle: 'italic', fontSize: '13px', margin: '5px 0' }}>
          Ngày {day} tháng {month} năm {year}
        </p>
        <p style={{ fontSize: '13px', margin: '3px 0' }}>Số: {data.requestNo || '...............'}</p>
      </div>

      {/* Kính gửi */}
      <div style={{ textAlign: 'center', margin: '15px 0', fontWeight: 'bold', fontSize: '13px' }}>
        <p style={{ margin: 0 }}>Kính gửi: BCH Công đoàn NHPT CN KV Bắc Đông Bắc</p>
      </div>

      {/* Content */}
      <div style={{ lineHeight: '1.9' }}>
        <p style={{ margin: '3px 0' }}>Họ và tên người đề nghị thanh toán: <span>{data.requesterName || '...................................'}</span></p>
        <p style={{ margin: '3px 0' }}>Bộ phận: <span>{data.department || '...................................'}</span></p>
        <p style={{ margin: '3px 0' }}>Nội dung thanh toán: <span>{data.content || '...................................'}</span>{data.times ? ` (Lần ${data.times}).` : ''}</p>
        <p style={{ margin: '3px 0' }}>
          Số tiền: <span style={{ fontWeight: 'bold' }}>{data.amount > 0 ? `${formatCurrency(data.amount)} đ` : '.................'}</span>
          {' '}Viết bằng chữ: <span style={{ fontStyle: 'italic', fontWeight: 'bold' }}>{amountWords}./.</span>
        </p>
      </div>

      {/* Bank info */}
      {(data.bankAccount || data.bankAccountName || data.bankName) && (
        <div style={{ fontStyle: 'italic', textAlign: 'center', lineHeight: '1.8', margin: '10px 0' }}>
          <p style={{ margin: '2px 0' }}>Thông tin Chuyển khoản: Số TK: {data.bankAccount || '...............'}</p>
          <p style={{ margin: '2px 0' }}>Tên TK: {data.bankAccountName || '...............'}</p>
          <p style={{ margin: '2px 0' }}>Tại NH: {data.bankName || '...............'}</p>
        </div>
      )}

      {/* Attachments */}
      <div style={{ fontStyle: 'italic', margin: '10px 0' }}>
        <p style={{ margin: '3px 0' }}>(Kèm theo ..... chứng từ gốc)</p>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
        <div style={{ width: '33%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Người đề nghị thanh toán</p>
          <p style={{ minHeight: '60px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{data.requesterName}</p>
        </div>
        <div style={{ width: '33%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Phụ trách kế toán</p>
          <p style={{ minHeight: '60px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{settings.accountantName}</p>
        </div>
        <div style={{ width: '33%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Chủ tịch Công đoàn</p>
          <p style={{ minHeight: '60px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{settings.unionLeaderName}</p>
        </div>
      </div>
    </div>
  );
}
