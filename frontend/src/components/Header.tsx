import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  Power,
  Menu,
  X,
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
  Package,
  TrendingDown,
  BarChart3,
  Settings,
  User,
  LayoutDashboard,
  Ticket,
  QrCode,
} from 'lucide-react';
import { SchoolQrModal } from './SchoolQrModal';

const navItems = [
  { name: 'Дашборд', path: '/', icon: LayoutDashboard },
  { name: 'Предзаказ', path: '/booking', icon: Ticket },
  { name: 'Меню и блюда', path: '/menu', icon: UtensilsCrossed },
  { name: 'Прогноз порций', path: '/forecast', icon: Sparkles },
  { name: 'Закупки', path: '/procurement', icon: ShoppingBag },
  { name: 'Склад (FEFO)', path: '/inventory', icon: Package },
  { name: 'Отходы', path: '/waste', icon: TrendingDown },
  { name: 'Аналитика', path: '/analytics', icon: BarChart3 },
  { name: 'Настройки', path: '/settings', icon: Settings },
  { name: 'Аккаунт', path: '/account', icon: User },
];

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  const getInitials = (email?: string) => {
    if (!email) return 'SC';
    const namePart = email.split('@')[0];
    return namePart.substring(0, 2).toUpperCase();
  };

  const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center gap-1.5 ${
      isActive
        ? 'bg-[var(--chip-bg)] text-[var(--chip-text)] font-bold shadow-xs'
        : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
    }`;

  return (
    <header className="w-full bg-[var(--surface)]/95 dark:bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg tracking-tight text-[var(--ink)] leading-none">
              Smart<span className="text-emerald-600 dark:text-emerald-400">Canteen</span>{' '}
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                AI
              </span>
            </div>
            <div className="text-[10px] text-[var(--muted)] font-medium">Умная школьная столовая</div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} className={desktopNavLinkClass}>
              <item.icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Right tools: Theme, User, Logout, Mobile toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowQrModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] text-[var(--ink)] hover:bg-[var(--chip-bg)] text-xs font-bold transition-all border border-[var(--border)]"
            title="Сгенерировать и распечатать QR-код меню для столовой"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>QR столовой</span>
          </button>

          <a
            href="/public/school-24"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all border border-emerald-500/20"
            title="Открыть онлайн-витрину школьника по QR-коду"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Витрина ученика</span>
          </a>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip-bg)] transition-colors"
            title="Переключить тему оформления"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile button */}
          <div
            onClick={() => navigate('/account')}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--chip-bg)] cursor-pointer transition-colors"
            title="Личный кабинет и безопасность"
          >
            <span className="text-xs font-semibold text-[var(--ink)] hidden sm:inline max-w-[120px] truncate">
              {user?.email || 'Пользователь'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center text-xs font-bold">
              {getInitials(user?.email)}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-red-600 hover:bg-red-500/10 transition-colors"
            title="Выйти из системы"
          >
            <Power className="w-4 h-4" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip-bg)]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-1">
          <button
            onClick={() => {
              setMobileOpen(false);
              setShowQrModal(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 mb-2"
          >
            <QrCode className="w-4 h-4" />
            <span>QR-код столовой для печати</span>
          </button>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                  isActive
                    ? 'bg-[var(--chip-bg)] text-[var(--chip-text)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`
              }
            >
              <item.icon className="w-4 h-4 opacity-70" />
              {item.name}
            </NavLink>
          ))}
        </div>
      )}

      <SchoolQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        schoolName="Школа-гимназия №24 им. А. Токомбаева"
        schoolSlug="school-24"
        address="г. Бишкек, ул. Тыныстанова, 110"
      />
    </header>
  );
};
