import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  Menu,
  Calendar,
  UtensilsCrossed,
} from 'lucide-react';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
}

const routeTitles: Record<string, { title: string; section: string }> = {
  '/': { title: 'Главный дашборд', section: 'Обзор' },
  '/menu': { title: 'Меню и технологические карты', section: 'Рацион питания' },
  '/booking': { title: 'Предзаказ и терминал выдачи', section: 'Обслуживание' },
  '/forecast': { title: 'AI-прогнозирование порций', section: 'Планирование' },
  '/procurement': { title: 'Закупки и снабжение', section: 'Логистика' },
  '/inventory': { title: 'Склад партий и сроки годности (FEFO)', section: 'Хранение' },
  '/waste': { title: 'WasteGuard — Учет отходов', section: 'Экология и СанПиН' },
  '/analytics': { title: 'Финансовая аналитика столовой', section: 'Отчетность' },
  '/settings': { title: 'Настройки школы и публикации', section: 'Система' },
  '/account': { title: 'Профиль администратора', section: 'Безопасность' },
};

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();

  const currentRoute = routeTitles[location.pathname] || {
    title: 'SmartCanteen AI',
    section: 'Столовая',
  };

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date());
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-[#191D25] border-b border-[#303744] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile trigger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#A6AFBC] hover:text-white hover:bg-[#242A35] cursor-pointer"
          title="Открыть меню"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#7F8998] leading-none">
            <span>{currentRoute.section}</span>
            <span className="opacity-30">/</span>
            <span className="text-white truncate font-bold">
              {currentRoute.title}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Date badge, Student Portal shortcut, Theme switch */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Date pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#242A35] border border-[#303744] text-xs font-semibold text-[#F5F7FA]">
          <Calendar className="w-3.5 h-3.5 text-[#5B8CFF]" />
          <span className="capitalize">{todayFormatted}</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5B8CFF] shadow-[0_0_8px_#5B8CFF]" />
        </div>

        {/* Public portal quick button */}
        <a
          href="/public/school-24"
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#242A35] hover:bg-[#2D3543] text-[#F5F7FA] text-xs font-bold transition-all border border-[#303744] hover:border-[#5B8CFF]/40 shadow-xs"
          title="Открыть онлайн-витрину питания для учеников"
        >
          <UtensilsCrossed className="w-3.5 h-3.5 text-[#55C7DE]" />
          <span>Витрина ученика</span>
        </a>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-[#A6AFBC] hover:text-white hover:bg-[#242A35] transition-colors cursor-pointer"
          title="Переключить тему оформления"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#FFB547]" />
          ) : (
            <Moon className="w-4 h-4 text-[#A58BFA]" />
          )}
        </button>
      </div>
    </header>
  );
};
