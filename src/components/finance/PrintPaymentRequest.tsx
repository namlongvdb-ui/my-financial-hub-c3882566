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
      
      {/* 1. Header: Dùng Table và KHÔNG dùng nowrap để tránh dàn hàng ngang */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '65%', verticalAlign: 'top' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                maxWidth: '280px'
              }}>
                <p style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 2px 0', lineHeight: '1.2' }}>
                  {settings.orgName.toUpperCase()}
                </p>
                <p style={{ fontWeight: 'bold', fontSize: '11px', margin: 0, lineHeight: '1.2' }}>
                  {settings.orgSubName.toUpperCase()}
                </p>
              </div>
            </td>
            <td style={{ width: '35%', verticalAlign: 'top', textAlign: 'right' }}>
              <p style={{ fontWeight: 'bold', fontSize: '12px', margin: 0 }}>Mẫu số C37- HĐ</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. Tiêu đề phiếu */}
      <div style={{ textAlign: 'center', margin: '20px 0 10px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>GIẤY ĐỀ NGHỊ THANH TOÁN</h2>
        <p style={{ fontStyle: 'italic', fontSize: '13px', margin: '5px 0' }}>
          Ngày {d.getDate() || '...'} tháng {(d.getMonth() + 1) || '...'} năm {d.getFullYear() || '202...'} 
        </p>
        <p style={{ fontSize: '13px', margin: '2px 0' }}>Số: {data.requestNo || '...............'}</p>
      </div>

      {/* 3. Kính gửi */}
      <div style={{ textAlign: 'center', margin: '15px 0', fontWeight: 'bold' }}>
        <p style={{ margin: 0 }}>Kính gửi: BCH Công đoàn NHPT CN KV Bắc Đông Bắc</p>
      </div>

      {/* 4. Nội dung */}
      <div style={{ lineHeight: '1.8' }}>
        <p style={labelStyle}>Họ và tên người đề nghị thanh toán: <span style={{ fontWeight: 500 }}>{data.requesterName || '...................................'}</span></p>
        <p style={labelStyle}>Bộ phận: <span style={{ fontWeight: 500 }}>{data.department || '...................................'}</span></p>
        <p style={labelStyle}>Nội dung thanh toán: <span style={{ fontWeight: 500 }}>{data.content || '...................................'}</span>{data.times ? ` (Lần ${data.times}).` : ''}</p>
        <p style={labelStyle}>
          Số tiền: <span style={{ fontWeight: 'bold' }}>{data.amount > 0 ? `${formatCurrency(data.amount)} đ` : '.................'}</span>
          {' '}Viết bằng chữ: <span style={{ fontStyle: 'italic', fontWeight: 'bold' }}>{amountWords}./.</span>
        </p>
      </div>

      {/* 5. Thông tin chuyển khoản - Căn lề chuẩn tt.bmp */}
      {(data.bankAccount || data.bankAccountName || data.bankName) && (
        <div style={{ marginTop: '15px', display: 'flex' }}>
          <div style={{
            marginLeft: 'auto', 
            marginRight: '5%',
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            columnGap: '5px',
            fontStyle: 'italic',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div>Thông tin Chuyển khoản:</div>
            <div>Số TK: {data.bankAccount || '...............'}</div>
            <div></div>
            <div>Tên TK: {data.bankAccountName || '...............'}</div>
            <div></div>
            <div>Tại NH: {data.bankName || '...............'}</div>
          </div>
        </div>
      )}

      {/* 6. Chứng từ kèm theo */}
      <div style={{ fontStyle: 'italic', margin: '15px 0' }}>
        <p>(Kèm theo {data.attachments || '.....'} chứng từ gốc)</p>
      </div>

      {/* 7. Chữ ký */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', textAlign: 'center', fontSize: '13px' }}>
        <div style={{ width: '32%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>Người đề nghị thanh toán</p>
          <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0 }}>(Ký, họ tên)</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold' }}>{data.requesterName}</p>
        </div>
        <div style={{ width: '32%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>Phụ trách kế toán</p>
          <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0 }}>(Ký, họ tên)</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold' }}>{settings.accountantName}</p>
        </div>
        <div style={{ width: '32%' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>Chủ tịch Công đoàn</p>
          <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0 }}>(Ký, họ tên)</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold' }}>{settings.unionGroups[0]?.leaderName || ''}</p>
        </div>
      </div>
    </div>
  );
}
