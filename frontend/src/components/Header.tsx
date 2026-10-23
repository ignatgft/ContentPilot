import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Power, ShieldAlert } from 'lucide-react';
import { apiRequest } from '../api/client';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleStopAll = async () => {
    if (window.confirm('Вы действительно хотите остановить все запланированные публикации?')) {
      try {
        const res = await apiRequest<{ message: string; pausedPostsCount: number }>('/posts/stop-all', {
          method: 'POST',
        });
        alert(`${res.message}. Приостановлено постов: ${res.pausedPostsCount}`);
        window.location.reload();
      } catch (e: any) {
        alert(e.message || 'Ошибка остановки публикаций');
      }
    }
  };

  const navItems = [
    { name: 'Кампании', path: '/' },
    { name: 'Календарь', path: '/calendar' },
    { name: 'AI Студия', path: '/creative' },
    { name: 'Бренд', path: '/brand' },
    { name: 'Каналы', path: '/channels' },
    { name: 'Аналитика', path: '/analytics' },
    { name: 'Настройки', path: '/settings' },
  ];

  const getInitials = (email?: string) => {
    if (!email) return 'CP';
    const namePart = email.split('@')[0];
    return namePart.substring(0, 2).toUpperCase();
  };

  return (
    <header className="w-full bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-[var(--on-accent)] shadow-sm group-hover:scale-105 transition-transform">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M8 19L14 7l6 12-6-3z" fill="currentColor" />
            </svg>
          </div>
          <div className="font-extrabold text-xl tracking-tight text-[var(--ink)]">
            Content<span className="text-[var(--accent)]">Pilot</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'bg-[var(--chip-bg)] text-[var(--chip-text)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Stop All Emergency Button */}
          <button
            onClick={handleStopAll}
            title="Остановить все запланированные публикации бренда"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning)]/10 text-xs font-bold transition-colors"
          >
            <ShieldAlert size={15} />
            <span>Остановить всё</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--ink)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
            <div 
              onClick={() => navigate('/settings')}
              title={user?.email}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white font-extrabold text-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              {getInitials(user?.email)}
            </div>

            <button
              onClick={() => logout()}
              title="Выйти из аккаунта"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Power size={17} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
