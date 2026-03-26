import { ViewType } from '@/types/finance';
import { LayoutDashboard, FileInput, FileOutput, Heart, FileText, BookOpen, ClipboardList, Settings } from 'lucide-react';

interface AppSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const menuItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { view: 'phieu-tham-hoi', label: 'Phiếu Thăm Hỏi', icon: Heart },
  { view: 'de-nghi-thanh-toan', label: 'Đề Nghị Thanh Toán', icon: FileText },
  { view: 'phieu-thu', label: 'Phiếu Thu', icon: FileInput },
  { view: 'phieu-chi', label: 'Phiếu Chi', icon: FileOutput },
  { view: 'so-quy', label: 'Sổ Quỹ', icon: BookOpen },
  { view: 'so-chi-tiet', label: 'Sổ Chi Tiết', icon: ClipboardList },
  { view: 'cai-dat', label: 'Cài đặt', icon: Settings },
];

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-blue-700 text-white flex flex-col shrink-0 no-print shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-blue-600/50">
        <h1 className="text-lg font-bold text-white tracking-tight">Quản Lý Tài Chính</h1>
        <p className="text-xs text-blue-200 mt-0.5 font-medium">Công Đoàn</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map(item => {
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-white text-blue-800 shadow-md' // Nút đang chọn: Nền trắng chữ xanh
                  : 'text-blue-100 hover:bg-blue-600 hover:text-white' // Nút chưa chọn
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? 'text-blue-700' : 'text-blue-200'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Copyright với hiệu ứng chữ chạy */}
      <div className="p-3 border-t border-blue-600/50 bg-blue-800/50 overflow-hidden">
        <marquee behavior="scroll" direction="left" scrollamount="4" className="text-[10px] text-blue-200 font-medium whitespace-nowrap">
          Copyright by Trần Nam Long VDB-Chi nhánh KV Bắc Đông Bắc, PGD Cao Bằng
        </marquee>
      </div>
    </aside>
  );
}
