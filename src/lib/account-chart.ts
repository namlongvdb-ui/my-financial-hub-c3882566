// Hệ thống tài khoản kế toán theo Thông tư 99/2025/TT-BTC
// Có hiệu lực từ 01/01/2026

export interface AccountItem {
  code: string;
  name: string;
  level: 1 | 2 | 3;  // Cấp 1, Cấp 2, Cấp 3
  category: string;
}

export const ACCOUNT_CATEGORIES = [
  'TÀI SẢN',
  'NỢ PHẢI TRẢ',
  'VỐN CHỦ SỞ HỮU',
  'DOANH THU',
  'CHI PHÍ SẢN XUẤT, KINH DOANH',
  'THU NHẬP KHÁC',
  'CHI PHÍ KHÁC',
  'XÁC ĐỊNH KẾT QUẢ KINH DOANH',
] as const;

export const ACCOUNT_CHART: AccountItem[] = [
  // === LOẠI TÀI KHOẢN TÀI SẢN ===
  { code: '111', name: 'Tiền mặt', level: 1, category: 'TÀI SẢN' },
  { code: '112', name: 'Tiền gửi không kỳ hạn', level: 1, category: 'TÀI SẢN' },
  { code: '113', name: 'Tiền đang chuyển', level: 1, category: 'TÀI SẢN' },
  { code: '121', name: 'Chứng khoán kinh doanh', level: 1, category: 'TÀI SẢN' },
  { code: '128', name: 'Đầu tư nắm giữ đến ngày đáo hạn', level: 1, category: 'TÀI SẢN' },
  { code: '1281', name: 'Tiền gửi có kỳ hạn', level: 2, category: 'TÀI SẢN' },
  { code: '1282', name: 'Trái phiếu', level: 2, category: 'TÀI SẢN' },
  { code: '1283', name: 'Cho vay', level: 2, category: 'TÀI SẢN' },
  { code: '1288', name: 'Các khoản đầu tư khác nắm giữ đến ngày đáo hạn', level: 2, category: 'TÀI SẢN' },
  { code: '131', name: 'Phải thu của khách hàng', level: 1, category: 'TÀI SẢN' },
  { code: '133', name: 'Thuế GTGT được khấu trừ', level: 1, category: 'TÀI SẢN' },
  { code: '1331', name: 'Thuế GTGT được khấu trừ của hàng hóa, dịch vụ', level: 2, category: 'TÀI SẢN' },
  { code: '1332', name: 'Thuế GTGT được khấu trừ của TSCĐ', level: 2, category: 'TÀI SẢN' },
  { code: '136', name: 'Phải thu nội bộ', level: 1, category: 'TÀI SẢN' },
  { code: '1361', name: 'Vốn kinh doanh ở đơn vị trực thuộc', level: 2, category: 'TÀI SẢN' },
  { code: '1362', name: 'Phải thu nội bộ về chênh lệch tỷ giá', level: 2, category: 'TÀI SẢN' },
  { code: '1363', name: 'Phải thu nội bộ về chi phí đi vay đủ điều kiện được vốn hoá', level: 2, category: 'TÀI SẢN' },
  { code: '1368', name: 'Phải thu nội bộ khác', level: 2, category: 'TÀI SẢN' },
  { code: '138', name: 'Phải thu khác', level: 1, category: 'TÀI SẢN' },
  { code: '1381', name: 'Tài sản thiếu chờ xử lý', level: 2, category: 'TÀI SẢN' },
  { code: '1383', name: 'Thuế TTĐB của hàng nhập khẩu', level: 2, category: 'TÀI SẢN' },
  { code: '1388', name: 'Phải thu khác', level: 2, category: 'TÀI SẢN' },
  { code: '141', name: 'Tạm ứng', level: 1, category: 'TÀI SẢN' },
  { code: '151', name: 'Hàng mua đang đi đường', level: 1, category: 'TÀI SẢN' },
  { code: '152', name: 'Nguyên liệu, vật liệu', level: 1, category: 'TÀI SẢN' },
  { code: '153', name: 'Công cụ, dụng cụ', level: 1, category: 'TÀI SẢN' },
  { code: '154', name: 'Chi phí sản xuất, kinh doanh dở dang', level: 1, category: 'TÀI SẢN' },
  { code: '155', name: 'Sản phẩm', level: 1, category: 'TÀI SẢN' },
  { code: '156', name: 'Hàng hóa', level: 1, category: 'TÀI SẢN' },
  { code: '157', name: 'Hàng gửi đi bán', level: 1, category: 'TÀI SẢN' },
  { code: '158', name: 'Nguyên liệu, vật tư tại kho bảo thuế', level: 1, category: 'TÀI SẢN' },
  { code: '171', name: 'Giao dịch mua, bán lại trái phiếu chính phủ', level: 1, category: 'TÀI SẢN' },
  { code: '211', name: 'Tài sản cố định hữu hình', level: 1, category: 'TÀI SẢN' },
  { code: '212', name: 'Tài sản cố định thuê tài chính', level: 1, category: 'TÀI SẢN' },
  { code: '213', name: 'Tài sản cố định vô hình', level: 1, category: 'TÀI SẢN' },
  { code: '214', name: 'Hao mòn tài sản cố định', level: 1, category: 'TÀI SẢN' },
  { code: '2141', name: 'Hao mòn TSCĐ hữu hình', level: 2, category: 'TÀI SẢN' },
  { code: '2142', name: 'Hao mòn TSCĐ thuê tài chính', level: 2, category: 'TÀI SẢN' },
  { code: '2143', name: 'Hao mòn TSCĐ vô hình', level: 2, category: 'TÀI SẢN' },
  { code: '2147', name: 'Hao mòn BĐSĐT', level: 2, category: 'TÀI SẢN' },
  { code: '215', name: 'Tài sản sinh học', level: 1, category: 'TÀI SẢN' },
  { code: '2151', name: 'Súc vật nuôi cho sản phẩm định kỳ', level: 2, category: 'TÀI SẢN' },
  { code: '2152', name: 'Súc vật nuôi lấy sản phẩm một lần', level: 2, category: 'TÀI SẢN' },
  { code: '2153', name: 'Cây trồng theo mùa vụ hoặc lấy sản phẩm một lần', level: 2, category: 'TÀI SẢN' },
  { code: '217', name: 'Bất động sản đầu tư', level: 1, category: 'TÀI SẢN' },
  { code: '221', name: 'Đầu tư vào công ty con', level: 1, category: 'TÀI SẢN' },
  { code: '222', name: 'Đầu tư vào công ty liên doanh, liên kết', level: 1, category: 'TÀI SẢN' },
  { code: '228', name: 'Đầu tư khác', level: 1, category: 'TÀI SẢN' },
  { code: '2281', name: 'Đầu tư góp vốn vào đơn vị khác', level: 2, category: 'TÀI SẢN' },
  { code: '2288', name: 'Đầu tư khác', level: 2, category: 'TÀI SẢN' },
  { code: '229', name: 'Dự phòng tổn thất tài sản', level: 1, category: 'TÀI SẢN' },
  { code: '2291', name: 'Dự phòng giảm giá chứng khoán kinh doanh', level: 2, category: 'TÀI SẢN' },
  { code: '2292', name: 'Dự phòng tổn thất đầu tư vào đơn vị khác', level: 2, category: 'TÀI SẢN' },
  { code: '2293', name: 'Dự phòng phải thu khó đòi', level: 2, category: 'TÀI SẢN' },
  { code: '2294', name: 'Dự phòng giảm giá hàng tồn kho', level: 2, category: 'TÀI SẢN' },
  { code: '2295', name: 'Dự phòng tổn thất tài sản sinh học', level: 2, category: 'TÀI SẢN' },
  { code: '241', name: 'Xây dựng cơ bản dở dang', level: 1, category: 'TÀI SẢN' },
  { code: '2411', name: 'Mua sắm TSCĐ', level: 2, category: 'TÀI SẢN' },
  { code: '2412', name: 'Xây dựng cơ bản', level: 2, category: 'TÀI SẢN' },
  { code: '2413', name: 'Sửa chữa, bảo dưỡng định kỳ TSCĐ', level: 2, category: 'TÀI SẢN' },
  { code: '2414', name: 'Nâng cấp, cải tạo TSCĐ', level: 2, category: 'TÀI SẢN' },
  { code: '242', name: 'Chi phí chờ phân bổ', level: 1, category: 'TÀI SẢN' },
  { code: '243', name: 'Tài sản thuế thu nhập hoãn lại', level: 1, category: 'TÀI SẢN' },
  { code: '244', name: 'Ký quỹ, ký cược', level: 1, category: 'TÀI SẢN' },

  // === LOẠI TÀI KHOẢN NỢ PHẢI TRẢ ===
  { code: '331', name: 'Phải trả cho người bán', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '332', name: 'Phải trả cổ tức, lợi nhuận', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '333', name: 'Thuế và các khoản phải nộp Nhà nước', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '3331', name: 'Thuế giá trị gia tăng phải nộp', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3332', name: 'Thuế tiêu thụ đặc biệt', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3333', name: 'Thuế xuất, nhập khẩu', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3334', name: 'Thuế thu nhập doanh nghiệp', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3335', name: 'Thuế thu nhập cá nhân', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3336', name: 'Thuế tài nguyên', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3337', name: 'Thuế nhà đất, tiền thuê đất', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3338', name: 'Thuế bảo vệ môi trường và các loại thuế khác', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3339', name: 'Phí, lệ phí và các khoản phải nộp khác', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '334', name: 'Phải trả người lao động', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '335', name: 'Chi phí phải trả', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '336', name: 'Phải trả nội bộ', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '3361', name: 'Phải trả nội bộ về vốn kinh doanh', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3362', name: 'Phải trả nội bộ về chênh lệch tỷ giá', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3363', name: 'Phải trả nội bộ về chi phí đi vay đủ điều kiện được vốn hóa', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3368', name: 'Phải trả nội bộ khác', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '337', name: 'Thanh toán theo tiến độ hợp đồng xây dựng', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '338', name: 'Phải trả, phải nộp khác', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '3381', name: 'Tài sản thừa chờ giải quyết', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3382', name: 'Kinh phí công đoàn', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3383', name: 'Bảo hiểm xã hội', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3384', name: 'Bảo hiểm y tế', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3386', name: 'Bảo hiểm thất nghiệp', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3387', name: 'Doanh thu chờ phân bổ', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3388', name: 'Phải trả, phải nộp khác', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '341', name: 'Vay và nợ thuê tài chính', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '3411', name: 'Các khoản đi vay', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3412', name: 'Nợ thuê tài chính', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '343', name: 'Trái phiếu phát hành', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '3431', name: 'Trái phiếu thường', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3432', name: 'Trái phiếu chuyển đổi', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '344', name: 'Nhận ký quỹ, ký cược', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '347', name: 'Thuế thu nhập hoãn lại phải trả', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '352', name: 'Dự phòng phải trả', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '3521', name: 'Dự phòng bảo hành sản phẩm, hàng hóa', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3522', name: 'Dự phòng bảo hành công trình xây dựng', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3523', name: 'Dự phòng tái cơ cấu doanh nghiệp', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3525', name: 'Dự phòng phải trả khác', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '353', name: 'Quỹ khen thưởng, phúc lợi', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '3531', name: 'Quỹ khen thưởng', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3532', name: 'Quỹ phúc lợi', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3533', name: 'Quỹ phúc lợi đã hình thành TSCĐ', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3534', name: 'Quỹ thưởng ban quản lý điều hành công ty', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '356', name: 'Quỹ phát triển khoa học và công nghệ', level: 1, category: 'NỢ PHẢI TRẢ' },
  { code: '3561', name: 'Quỹ phát triển khoa học và công nghệ', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '3562', name: 'Quỹ phát triển khoa học và công nghệ đã hình thành tài sản', level: 2, category: 'NỢ PHẢI TRẢ' },
  { code: '357', name: 'Quỹ bình ổn giá', level: 1, category: 'NỢ PHẢI TRẢ' },

  // === LOẠI TÀI KHOẢN VỐN CHỦ SỞ HỮU ===
  { code: '411', name: 'Vốn đầu tư của chủ sở hữu', level: 1, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '4111', name: 'Vốn góp của chủ sở hữu', level: 2, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '4112', name: 'Thặng dư vốn', level: 2, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '4113', name: 'Quyền chọn chuyển đổi trái phiếu', level: 2, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '4118', name: 'Vốn khác', level: 2, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '412', name: 'Chênh lệch đánh giá lại tài sản', level: 1, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '413', name: 'Chênh lệch tỷ giá hối đoái', level: 1, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '414', name: 'Quỹ đầu tư phát triển', level: 1, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '418', name: 'Các quỹ khác thuộc vốn chủ sở hữu', level: 1, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '419', name: 'Cổ phiếu mua lại của chính mình', level: 1, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '421', name: 'Lợi nhuận sau thuế chưa phân phối', level: 1, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '4211', name: 'Lợi nhuận sau thuế chưa phân phối lũy kế đến cuối năm trước', level: 2, category: 'VỐN CHỦ SỞ HỮU' },
  { code: '4212', name: 'Lợi nhuận sau thuế chưa phân phối năm nay', level: 2, category: 'VỐN CHỦ SỞ HỮU' },

  // === LOẠI TÀI KHOẢN DOANH THU ===
  { code: '511', name: 'Doanh thu bán hàng và cung cấp dịch vụ', level: 1, category: 'DOANH THU' },
  { code: '515', name: 'Doanh thu hoạt động tài chính', level: 1, category: 'DOANH THU' },
  { code: '521', name: 'Các khoản giảm trừ doanh thu', level: 1, category: 'DOANH THU' },

  // === LOẠI TÀI KHOẢN CHI PHÍ SẢN XUẤT, KINH DOANH ===
  { code: '621', name: 'Chi phí nguyên liệu, vật liệu trực tiếp', level: 1, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '622', name: 'Chi phí nhân công trực tiếp', level: 1, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '623', name: 'Chi phí sử dụng máy thi công', level: 1, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6231', name: 'Chi phí nhân công', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6232', name: 'Chi phí vật liệu', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6233', name: 'Chi phí dụng cụ sản xuất', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6234', name: 'Chi phí khấu hao máy thi công', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6237', name: 'Chi phí dịch vụ mua ngoài', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6238', name: 'Chi phí bằng tiền khác', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '627', name: 'Chi phí sản xuất chung', level: 1, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6271', name: 'Chi phí nhân viên phân xưởng', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6272', name: 'Chi phí vật liệu', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6273', name: 'Chi phí dụng cụ sản xuất', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6274', name: 'Chi phí khấu hao TSCĐ', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6275', name: 'Thuế, phí, lệ phí', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6277', name: 'Chi phí dịch vụ mua ngoài', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6278', name: 'Chi phí bằng tiền khác', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '632', name: 'Giá vốn hàng bán', level: 1, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '635', name: 'Chi phí tài chính', level: 1, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '641', name: 'Chi phí bán hàng', level: 1, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6411', name: 'Chi phí nhân viên', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6412', name: 'Chi phí vật liệu, bao bì', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6413', name: 'Chi phí dụng cụ, đồ dùng', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6414', name: 'Chi phí khấu hao TSCĐ', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6415', name: 'Thuế, phí, lệ phí', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6417', name: 'Chi phí dịch vụ mua ngoài', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6418', name: 'Chi phí bằng tiền khác', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '642', name: 'Chi phí quản lý doanh nghiệp', level: 1, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6421', name: 'Chi phí nhân viên quản lý', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6422', name: 'Chi phí vật liệu quản lý', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6423', name: 'Chi phí đồ dùng văn phòng', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6424', name: 'Chi phí khấu hao TSCĐ', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6425', name: 'Thuế, phí và lệ phí', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6426', name: 'Chi phí dự phòng', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6427', name: 'Chi phí dịch vụ mua ngoài', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },
  { code: '6428', name: 'Chi phí bằng tiền khác', level: 2, category: 'CHI PHÍ SẢN XUẤT, KINH DOANH' },

  // === LOẠI TÀI KHOẢN THU NHẬP KHÁC ===
  { code: '711', name: 'Thu nhập khác', level: 1, category: 'THU NHẬP KHÁC' },

  // === LOẠI TÀI KHOẢN CHI PHÍ KHÁC ===
  { code: '811', name: 'Chi phí khác', level: 1, category: 'CHI PHÍ KHÁC' },
  { code: '821', name: 'Chi phí thuế thu nhập doanh nghiệp', level: 1, category: 'CHI PHÍ KHÁC' },
  { code: '8211', name: 'Chi phí thuế TNDN hiện hành', level: 2, category: 'CHI PHÍ KHÁC' },
  { code: '8212', name: 'Chi phí thuế TNDN hoãn lại', level: 2, category: 'CHI PHÍ KHÁC' },

  // === TÀI KHOẢN XÁC ĐỊNH KẾT QUẢ KINH DOANH ===
  { code: '911', name: 'Xác định kết quả kinh doanh', level: 1, category: 'XÁC ĐỊNH KẾT QUẢ KINH DOANH' },
];

export function searchAccounts(query: string): AccountItem[] {
  if (!query.trim()) return ACCOUNT_CHART;
  const q = query.toLowerCase().trim();
  return ACCOUNT_CHART.filter(
    a => a.code.includes(q) || a.name.toLowerCase().includes(q)
  );
}

export function getAccountByCode(code: string): AccountItem | undefined {
  return ACCOUNT_CHART.find(a => a.code === code);
}

export function getAccountLabel(code: string): string {
  const acc = getAccountByCode(code);
  return acc ? `${acc.code} - ${acc.name}` : code;
}
