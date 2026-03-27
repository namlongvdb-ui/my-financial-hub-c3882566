import { ViewType } from '@/types/finance';
import { LayoutDashboard, FileInput, FileOutput, Heart, FileText, BookOpen, ClipboardList, Users, Settings, BookOpenCheck } from 'lucide-react';
import { getActiveYear, isYearClosed } from '@/lib/finance-store';

interface AppSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  refreshKey?: number;
}

const menuItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { view: 'phieu-tham-hoi', label: 'Phiếu Thăm Hỏi', icon: Heart },
  { view: 'de-nghi-thanh-toan', label: 'Đề Nghị Thanh Toán', icon: FileText },
  { view: 'phieu-thu', label: 'Phiếu Thu', icon: FileInput },
  { view: 'phieu-chi', label: 'Phiếu Chi', icon: FileOutput },
  { view: 'so-quy', label: 'Sổ Quỹ', icon: BookOpen },
  { view: 'so-chi-tiet', label: 'Sổ Chi Tiết', icon: ClipboardList },
  { view: 'danh-sach-can-bo', label: 'Danh Sách Cán Bộ', icon: Users },
  { view: 'khoa-so', label: 'Khóa Sổ & Kết Chuyển', icon: BookOpenCheck },
  { view: 'cai-dat', label: 'Cài đặt', icon: Settings },
];

export function AppSidebar({ currentView, onViewChange, refreshKey }: AppSidebarProps) {
  const activeYear = getActiveYear();
  const closed = isYearClosed(activeYear);
  // Mã màu xanh BIDV (Thường là #0056a2 hoặc tương đương trong hệ thống nhận diện)
  const bidvBlue = "#005BA1"; 
  const bidvLightBlue = "#0071C5";

  return (
    <aside 
      className="w-64 min-h-screen text-white flex flex-col shrink-0 no-print shadow-2xl"
      style={{ backgroundColor: bidvBlue }}
    >
      {/* Header */}
      <div className="p-5 border-b border-white/10" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          Quản Lý Tài Chính
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-blue-200 mt-1 font-semibold opacity-80">
          Công Đoàn NHPT Chi nhánh
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className={`inline-block w-2 h-2 rounded-full ${closed ? 'bg-red-400' : 'bg-green-400'}`}></span>
          <span className="text-blue-100">Năm {activeYear} {closed ? '(Đã khóa)' : ''}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {menuItems.map(item => {
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                active
                  ? 'bg-white text-[#005BA1] shadow-lg transform scale-[1.02]' 
                  : 'text-white/80 hover:bg-[#0071C5] hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'text-[#005BA1]' : 'text-blue-200'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Copyright với hiệu ứng chữ chạy từ phải sang trái */}
      <div className="py-2 px-1 border-t border-white/10 bg-black/20 overflow-hidden">
        <div className="text-[11px] text-blue-100 font-light whitespace-nowrap animate-marquee">
          Copyright by Trần Nam Long VDB-Chi nhánh KV Bắc Đông Bắc, PGD Cao Bằng
        </div>
      </div>
    </aside>
  );
}
