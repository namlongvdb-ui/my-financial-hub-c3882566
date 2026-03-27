import { ViewType } from '@/types/finance';
import { LayoutDashboard, FileInput, FileOutput, Heart, FileText, BookOpen, ClipboardList, Users, Settings, BookOpenCheck, Shield, LogOut, KeyRound } from 'lucide-react';
import { getActiveYear, isYearClosed } from '@/lib/finance-store';
import { useAuth } from '@/hooks/useAuth';

interface AppSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  refreshKey?: number;
}

const menuItems: { view: ViewType; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
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
  { view: 'doi-mat-khau', label: 'Đổi mật khẩu', icon: KeyRound },
  { view: 'quan-tri', label: 'Quản trị hệ thống', icon: Shield, adminOnly: true },
];

export function AppSidebar({ currentView, onViewChange, refreshKey }: AppSidebarProps) {
  const activeYear = getActiveYear();
  const closed = isYearClosed(activeYear);
  const { isAdmin, profile, signOut } = useAuth();
  const bidvBlue = "#005BA1"; 

  const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

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

      {/* User info */}
      {profile && (
        <div className="px-5 py-3 border-b border-white/10 bg-black/5">
          <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
          <p className="text-[10px] text-blue-200 truncate">@{profile.username}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {visibleItems.map(item => {
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

      {/* Logout button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-red-600/30 hover:text-white transition-all"
        >
          <LogOut className="h-5 w-5 text-blue-200" />
          Đăng xuất
        </button>
      </div>

      {/* Copyright */}
      <div className="py-2 px-1 border-t border-white/10 bg-black/20 overflow-hidden">
        <div className="text-[11px] text-blue-100 font-light whitespace-nowrap animate-marquee">
          Copyright by Trần Nam Long VDB-Chi nhánh KV Bắc Đông Bắc, PGD Cao Bằng
        </div>
      </div>
    </aside>
  );
}