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
  const amountWords = data.amount > 0 ? numberToVietnameseWords(data.amount) : 'Không đồng';

  const labelStyle: React.CSSProperties = { margin: '6px 0', lineHeight: '1.7' };

  return (
    <div className="print-voucher" style={{ 
      fontFamily: 'Times New Roman, serif', 
      fontSize: '14px', 
      color: '#000', 
      padding: '30px 45px', 
      maxWidth: '720px', 
      margin: '0 auto',
      backgroundColor: '#fff' 
    }}>
      
      {/* 1. Header: Sử dụng Table để cố định 2 bên, tránh dàn hàng ngang */}
      <div style={{ width: '100%', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            <tr>
              {/* Cụm tên đơn vị bên trái */}
              <td style={{ width: '60%', verticalAlign: 'top', border: 'none', padding: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  width: 'fit-content' 
                }}>
                  <p style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 2px 0', whiteSpace: 'nowrap' }}>
                    CĐ NHPT CHI NHÁNH KV BẮC ĐÔNG BẮC
                  </p>
                  <p style={{ fontWeight: 'bold', fontSize: '11px', margin: '0 0 2px 0', whiteSpace: 'nowrap' }}>
                    TỔ CĐ BỘ PHẬN KẾ TOÁN – HÀNH CHÍNH
                  </p>
                  <p style={{ fontWeight: 'bold', fontSize: '11px', margin: 0, whiteSpace: 'nowrap' }}>
                    PHÒNG GD CAO BẰNG
                  </p>
                </div>
              </td>

              {/* Cụm mẫu số bên phải */}
              <td style={{ width: '40%', verticalAlign: 'top', textAlign: 'right', border: 'none', padding: 0 }}>
                <p style={{ fontWeight: 'bold', fontSize: '12px', margin: 0 }}>Mẫu số C37- HĐ</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. Tiêu đề phiếu */}
      <div style={{ textAlign: 'center', margin: '22px 0 8px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>GIẤY ĐỀ NGHỊ THANH TOÁN</h2>
        <p style={{ fontStyle: 'italic', fontSize: '13px', margin: '6px 0' }}>
          Ngày {d.getDate() || '...'} tháng {(d.getMonth() + 1) || '...'} năm {d.getFullYear() || '202...'} 
        </p>
        <p style={{ fontSize: '13px', margin: '3px 0' }}>Số: {data.requestNo || '...............'}</p>
      </div>

      {/* 3. Kính gửi */}
      <div style={{ textAlign: 'center', margin: '16px 0', fontWeight: 'bold', fontSize: '14px' }}>
        <p style={{ margin: 0 }}>Kính gửi: BCH Công đoàn NHPT CN KV Bắc Đông Bắc</p>
      </div>

      {/* 4. Nội dung chính */}
      <div style={{ lineHeight: '1.7', fontSize: '14px' }}>
        <p style={labelStyle}>Họ và tên người đề nghị thanh toán: <span style={{ fontWeight: 500 }}>{data.requesterName || '...................................'}</span></p>
        <p style={labelStyle}>Bộ phận: <span style={{ fontWeight: 500 }}>{data.department || '...................................'}</span></p>
        <p style={labelStyle}>Nội dung thanh toán: <span style={{ fontWeight: 500 }}>{data.content || '...................................'}</span>{data.times ? ` (Lần ${data.times}).` : ''}</p>
        <p
