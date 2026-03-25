import { ViewType } from '@/types/finance';
import { LayoutDashboard, FileInput, FileOutput, BookOpen, ClipboardList } from 'lucide-react';

interface AppSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const menuItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { view: 'phieu-thu', label: 'Phiếu Thu', icon: FileInput },
  { view: 'phieu-chi', label: 'Phiếu Chi', icon: FileOutput },
  { view: 'so-quy', label: 'Sổ Quỹ', icon: BookOpen },
  { view: 'so-chi-tiet', label: 'Sổ Chi Tiết', icon: ClipboardList },
];

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col shrink-0 no-print">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">Tài Chính</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">Công Đoàn</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map(item => {
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/40">
        © 2026 CĐ NHPT
      </div>
    </aside>
  );
}
