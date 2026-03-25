import { Transaction } from '@/types/finance';
import { numberToVietnameseWords, getOrgSettings } from '@/lib/finance-store';

interface PrintVoucherProps {
  type: 'thu' | 'chi';
  data: {
    date: string;
    voucherNo: string;
    amount: number;
    description: string;
    personName: string;
    department: string;
    accountCode: string;
    approver: string;
    attachments: number;
  };
}

function formatDateParts(dateStr: string) {
  const d = new Date(dateStr);
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN');
}

export function PrintVoucher({ type, data }: PrintVoucherProps) {
  const settings = getOrgSettings();
  const title = type === 'thu' ? 'PHIẾU THU' : 'PHIẾU CHI';
  const personLabel = type === 'thu' ? 'Họ và tên người nộp tiền' : 'Họ và tên người nhận tiền';
  const { day, month, year } = formatDateParts(data.date);
  const amountWords = data.amount > 0 ? numberToVietnameseWords(data.amount) : 'Không đồng';

  return (
    <div className="print-voucher" style={{ fontFamily: 'Times New Roman, serif', fontSize: '13px', color: '#000', padding: '30px 40px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>{settings.orgName.toUpperCase()}</p>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>{settings.orgSubName.toUpperCase()}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <p style={{ margin: 0 }}>Mẫu số: C41-BB</p>
          <p style={{ margin: '2px 0' }}>Quyển số:........</p>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '15px 0 5px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: '13px', margin: '3px 0', fontStyle: 'italic' }}>
          Ngày {day} tháng {month} năm {year}
        </p>
        <p style={{ fontSize: '13px', margin: '2px 0' }}>Số CT: {data.voucherNo}</p>
      </div>

      {/* Right side: Nợ/Có */}
      <div style={{ textAlign: 'right', fontSize: '12px', marginBottom: '10px' }}>
        <p style={{ margin: '1px 0' }}>Nợ:.................</p>
        <p style={{ margin: '1px 0' }}>Có:.................</p>
      </div>

      {/* Body */}
      <div style={{ lineHeight: '1.8' }}>
        <p style={{ margin: '3px 0' }}>{personLabel}: <span style={{ borderBottom: '1px dotted #000', paddingBottom: '1px' }}>{data.personName || '...................................'}</span></p>
        <p style={{ margin: '3px 0' }}>Đơn vị: <span style={{ borderBottom: '1px dotted #000', paddingBottom: '1px' }}>{data.department || '...................................'}</span></p>
        <p style={{ margin: '3px 0' }}>Nội dung: <span style={{ borderBottom: '1px dotted #000', paddingBottom: '1px' }}>{data.description || '...................................'}</span></p>
        <p style={{ margin: '3px 0' }}>Số tiền: <span style={{ fontWeight: 'bold', borderBottom: '1px dotted #000', paddingBottom: '1px' }}>{data.amount > 0 ? `${formatCurrency(data.amount)} VNĐ` : '0 VNĐ'}</span></p>
        <p style={{ margin: '3px 0' }}>Viết bằng chữ: <span style={{ fontStyle: 'italic', borderBottom: '1px dotted #000', paddingBottom: '1px' }}>{amountWords}</span></p>
        <p style={{ margin: '3px 0' }}>Chứng từ kèm theo: ................ là chứng từ gốc</p>
      </div>

      {/* Signatures - top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
        <div style={{ width: '33%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>LÃNH ĐẠO ĐƠN VỊ</p>
          <p style={{ minHeight: '50px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{settings.leaderName}</p>
        </div>
        <div style={{ width: '33%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>PHỤ TRÁCH KẾ TOÁN</p>
          <p style={{ minHeight: '50px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{settings.accountantName}</p>
        </div>
        <div style={{ width: '33%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>NGƯỜI LẬP</p>
          <p style={{ minHeight: '50px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{settings.creatorName}</p>
        </div>
      </div>

      {/* Separator line */}
      <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '25px 0' }} />

      {/* Receipt section (bottom half) */}
      <p style={{ margin: '5px 0' }}>Đã nhận đủ số tiền: <span style={{ fontWeight: 'bold' }}>{data.amount > 0 ? `${formatCurrency(data.amount)} VNĐ` : '0 VNĐ'}</span></p>
      <p style={{ margin: '5px 0' }}>Viết bằng chữ: <span style={{ fontStyle: 'italic' }}>{amountWords}</span></p>

      <div style={{ textAlign: 'right', margin: '15px 0', fontStyle: 'italic', fontSize: '13px' }}>
        Ngày {day} tháng {month} năm {year}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', textAlign: 'center', fontSize: '13px' }}>
        <div style={{ width: '50%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>THỦ QUỸ</p>
          <p style={{ minHeight: '50px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{settings.treasurerName}</p>
        </div>
        <div style={{ width: '50%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Người {type === 'thu' ? 'nộp' : 'nhận'} tiền</p>
          <p style={{ minHeight: '50px' }}></p>
          <p style={{ fontWeight: 'bold' }}>{data.personName}</p>
        </div>
      </div>
    </div>
  );
}
