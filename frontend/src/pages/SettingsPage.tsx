import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Settings, ShieldAlert, Sun, Moon, Globe, Bot, Check, User } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const [brandData, setBrandData] = useState<any>(null);
  const [autonomyMode, setAutonomyMode] = useState('SEMI_AUTO');
  const [language, setLanguage] = useState<'ru' | 'kg'>(() =>
    (localStorage.getItem('cp_language') as 'ru' | 'kg') || 'ru'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    async function loadBrand() {
      try {
        const brand = await apiRequest<any>('/brands/me');
        if (brand) {
          setBrandData(brand);
          if (brand.autonomyMode) {
            setAutonomyMode(brand.autonomyMode);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    loadBrand();
  }, []);

  const handleSaveAutonomy = async (mode: string) => {
    setAutonomyMode(mode);
    try {
      await apiRequest('/brands', {
        method: 'POST',
        body: JSON.stringify({
          name: brandData?.name || 'Мой Бренд',
          autonomyMode: mode,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      // ignore
    }
  };

  const handleSelectLanguage = (next: 'ru' | 'kg') => {
    setLanguage(next);
    localStorage.setItem('cp_language', next);
  };

  const handleStopAll = async () => {
    if (window.confirm('Внимание! Все запланированные посты бренда будут переведены в режим паузы. Продолжить?')) {
      setStopping(true);
      try {
        const res = await apiRequest<{ message: string; pausedPostsCount: number }>('/posts/stop-all', {
          method: 'POST',
        });
        alert(`${res.message}. Приостановлено постов: ${res.pausedPostsCount}`);
      } catch (e: any) {
        alert(e.message || 'Ошибка');
      } finally {
        setStopping(false);
      }
    }
  };

  const autonomyOptions = [
    {
      key: 'MANUAL',
      title: 'Ручной',
      desc: 'Все посты требуют ручного подтверждения перед публикацией в каналы.',
    },
    {
      key: 'SEMI_AUTO',
      title: 'Полуавтомат (Рекомендуется)',
      desc: 'Посты с верными фактами выходят по расписанию; при расхождении цен пост блокируется.',
    },
    {
      key: 'AUTOPILOT',
      title: 'Автопилот',
      desc: 'Полный цикл генерации и автопубликации без обязательного участия человека.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-page-enter">
      <div>
        <div className="chip mb-2">
          <Settings size={14} />
          <span>Конфигурация системы</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">Настройки</h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          Управление режимами автономности, темой оформления и безопасностью
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--success)] font-bold text-xs flex items-center gap-2">
          <Check size={16} />
          <span>Настройки сохранены!</span>
        </div>
      )}

      {/* Account card */}
      <div className="card p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white font-extrabold shadow-sm shrink-0">
          <User size={20} />
        </div>
        <div>
          <div className="font-extrabold text-sm text-[var(--ink)]">{user?.email || '—'}</div>
          <div className="text-xs text-[var(--muted)]">Ваш аккаунт и бренд в ContentPilot</div>
        </div>
      </div>

      {/* Autonomy Mode */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
            <Bot size={18} className="text-[var(--accent)]" />
            <span>Режим автономности ИИ</span>
          </h2>
          <span className="chip">
            Текущий:{' '}
            {autonomyMode === 'MANUAL' ? 'Ручной' : autonomyMode === 'AUTOPILOT' ? 'Автопилот' : 'Полуавтомат'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {autonomyOptions.map(opt => (
            <div
              key={opt.key}
              onClick={() => handleSaveAutonomy(opt.key)}
              role="radio"
              aria-checked={autonomyMode === opt.key}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') handleSaveAutonomy(opt.key);
              }}
              className={`p-4 rounded-xl cursor-pointer transition-all focus:outline-none ${
                autonomyMode === opt.key
                  ? 'border-2 border-[var(--accent)] bg-[var(--chip-bg)]'
                  : 'border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface)]'
              }`}
            >
              <div className="font-extrabold text-sm text-[var(--ink)] mb-1">{opt.title}</div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">{opt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Theme and Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Theme */}
        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-extrabold text-[var(--ink)] flex items-center gap-2">
            <Sun size={17} className="text-[var(--accent)]" />
            <span>Тема интерфейса</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`btn-secondary flex-1 min-h-[44px] text-xs cursor-pointer ${
                theme === 'light' ? '!bg-[var(--chip-bg)] !border-[var(--accent)] !text-[var(--chip-text)]' : ''
              }`}
            >
              <Sun size={15} />
              <span>Светлая</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`btn-secondary flex-1 min-h-[44px] text-xs cursor-pointer ${
                theme === 'dark' ? '!bg-[var(--chip-bg)] !border-[var(--accent)] !text-[var(--chip-text)]' : ''
              }`}
            >
              <Moon size={15} />
              <span>Тёмная</span>
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-extrabold text-[var(--ink)] flex items-center gap-2">
            <Globe size={17} className="text-[var(--accent)]" />
            <span>Язык интерфейса</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectLanguage('ru')}
              className={`btn-secondary flex-1 min-h-[44px] text-xs cursor-pointer ${
                language === 'ru' ? '!bg-[var(--chip-bg)] !border-[var(--accent)] !text-[var(--chip-text)]' : ''
              }`}
            >
              <span>Русский (RU)</span>
            </button>
            <button
              onClick={() => handleSelectLanguage('kg')}
              className={`btn-secondary flex-1 min-h-[44px] text-xs cursor-pointer ${
                language === 'kg' ? '!bg-[var(--chip-bg)] !border-[var(--accent)] !text-[var(--chip-text)]' : ''
              }`}
            >
              <span>Кыргызча (KG)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Stop All Button Card */}
      <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 !border-red-500/40">
        <div>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-sm mb-1">
            <ShieldAlert size={18} />
            <span>Экстренная остановка (Kill Switch)</span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Кнопка «Остановить всё» переводит все запланированные публикации бренда в статус PAUSED.
          </p>
        </div>

        <button
          onClick={handleStopAll}
          disabled={stopping}
          className="min-h-[44px] px-5 rounded-xl border border-red-500 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <ShieldAlert size={16} />
          <span>{stopping ? 'Остановка...' : 'Остановить всё'}</span>
        </button>
      </div>
    </div>
  );
};
