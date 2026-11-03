import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Ticket,
  Sparkles,
  ShoppingBag,
  Package,
  TrendingDown,
  BarChart3,
  Settings,
  QrCode,
  ExternalLink,
  Power,
  ChevronRight,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { SchoolQrModal } from './SchoolQrModal';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const mainNavItems = [
  { name: 'Обзор столовой', path: '/', icon: LayoutDashboard },
  { name: 'Меню и техкарты', path: '/menu', icon: UtensilsCrossed, badge: 'СанПиН', badgeColor: 'blue' },
  { name: 'Предзаказ и выдача', path: '/booking', icon: Ticket },
  { name: 'Прогноз порций', path: '/forecast', icon: Sparkles, badge: 'AI', badgeColor: 'purple' },
  { name: 'Закупки', path: '/procurement', icon: ShoppingBag },
  { name: 'Склад (FEFO)', path: '/inventory', icon: Package, badge: 'FEFO', badgeColor: 'amber' },
  { name: 'Пищевые отходы', path: '/waste', icon: TrendingDown },
  { name: 'Аналитика', path: '/analytics', icon: BarChart3 },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showQrModal, setShowQrModal] = useState(false);

  const getInitials = (email?: string) => {
    if (!email) return 'SC';
    const namePart = email.split('@')[0];
    return namePart.substring(0, 2).toUpperCase();
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
      isActive
        ? 'bg-[#5B8CFF]/12 text-white font-bold border border-[#5B8CFF]/30 shadow-xs'
        : 'text-[#A6AFBC] hover:text-[#FFFFFF] hover:bg-[#242A35]'
    }`;

  const renderBadge = (badge?: string, color?: string) => {
    if (!badge) return null;
    let badgeClasses = 'bg-[#5B8CFF]/15 text-[#5B8CFF] border-[#5B8CFF]/25';
    if (color === 'purple') {
      badgeClasses = 'bg-[#9477FF]/15 text-[#A58BFA] border-[#9477FF]/30';
    } else if (color === 'amber') {
      badgeClasses = 'bg-[#FFB547]/15 text-[#FFB547] border-[#FFB547]/30';
    }
    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeClasses}`}>
        {badge}
      </span>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-[#171A21] text-[#F5F7FA] select-none border-r border-[#303744]">
      {/* Top Header & Brand */}
      <div className="space-y-4">
        {/* Brand Header */}
        <div
          onClick={() => {
            navigate('/');
            onCloseMobile?.();
          }}
          className="flex items-center gap-3 px-2 py-1 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5B8CFF] to-[#9477FF] flex items-center justify-center text-white shadow-lg shadow-[#5B8CFF]/20 group-hover:scale-105 transition-transform shrink-0">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                Smart<span className="text-[#5B8CFF]">Canteen</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#5B8CFF]/15 text-[#5B8CFF] border border-[#5B8CFF]/30">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-[#7F8998] font-medium truncate">
              FoodTech Management SaaS
            </div>
          </div>
        </div>

        {/* Current School Card */}
        <div className="p-3 rounded-2xl bg-[#1D222C] border border-[#303744] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#7F8998] uppercase tracking-wider">
            <span>Школа</span>
            <span className="inline-flex items-center gap-1 text-[#39C98A] font-bold">
              <ShieldCheck className="w-3 h-3" /> DEMO
            </span>
          </div>
          <div className="font-extrabold text-xs text-white leading-tight line-clamp-1">
            Школа-гимназия №24
          </div>
          <div className="text-[10px] text-[#A6AFBC] flex items-center justify-between">
            <span>г. Бишкек</span>
            <span className="font-semibold text-white">650 учащихся</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#7F8998] uppercase tracking-wider">
            Основное меню
          </div>
          <nav className="space-y-0.5">
            {mainNavItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={navLinkClass}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <item.icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#5B8CFF]' : 'text-[#7F8998] group-hover:text-white'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {renderBadge(item.badge, item.badgeColor)}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Actions & User Profile */}
      <div className="pt-4 border-t border-[#303744] space-y-2">
        {/* Quick Utilities: QR and Public Menu */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#242A35] hover:bg-[#2D3543] border border-[#303744] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#5B8CFF]" />
              <span>QR-код столовой</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#7F8998]" />
          </button>

          <a
            href="/public/school-24"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[#A6AFBC] hover:text-white hover:bg-[#242A35] transition-all"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#7F8998]" />
              <span>Витрина ученика</span>
            </div>
            <span className="text-[9px] font-bold text-[#55C7DE] bg-[#55C7DE]/10 border border-[#55C7DE]/25 px-1.5 py-0.5 rounded">
              0-PII
            </span>
          </a>

          <NavLink
            to="/settings"
            onClick={onCloseMobile}
            className={navLinkClass}
          >
            {({ isActive }) => (
              <div className="flex items-center gap-2.5">
                <Settings
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#5B8CFF]' : 'text-[#7F8998] group-hover:text-white'
                  }`}
                />
                <span>Настройки школы</span>
              </div>
            )}
          </NavLink>
        </div>

        {/* User Card */}
        <div className="p-2.5 rounded-2xl bg-[#1D222C] border border-[#303744] flex items-center justify-between gap-2">
          <div
            onClick={() => {
              navigate('/account');
              onCloseMobile?.();
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#242A35] to-[#2D3543] border border-[#303744] text-[#5B8CFF] flex items-center justify-center text-xs font-black shrink-0 group-hover:scale-105 transition-transform">
              {getInitials(user?.email)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {user?.email?.split('@')[0] || 'Администратор'}
              </div>
              <div className="text-[10px] text-[#7F8998] truncate">
                Управляющий столовой
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[#7F8998] hover:text-[#FF647C] hover:bg-[#FF647C]/10 transition-colors cursor-pointer shrink-0"
            title="Выйти из аккаунта"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QR Modal instance */}
      <SchoolQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        schoolName="Школа-гимназия №24 им. А. Токомбаева"
        schoolSlug="school-24"
        address="г. Бишкек, ул. Тыныстанова, 110"
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 sticky top-0 h-screen z-40 bg-[#171A21]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
