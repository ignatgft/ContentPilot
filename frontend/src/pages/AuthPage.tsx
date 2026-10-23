import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, googleLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password validation: minimum 8 chars, letters and digits
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-zА-Яа-я]/.test(password);
  const hasDigit = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasDigit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && !isPasswordValid) {
      setError('Пароль должен содержать минимум 8 символов, буквы и цифры');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации. Проверьте введенные данные.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleLogin();
    } catch (err: any) {
      setError(err.message || 'Ошибка входа через Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center text-[var(--on-accent)]">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M8 19L14 7l6 12-6-3z" fill="currentColor" />
            </svg>
          </div>
          <span className="font-extrabold text-lg text-[var(--ink)]">ContentPilot 2.0</span>
        </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm transition-colors duration-200">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] text-xs font-bold mb-3">
              <Sparkles size={14} />
              <span>ИИ-маркетолог на автопилоте</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-2">
              {isRegister ? 'Создать аккаунт' : 'Вход в аккаунт'}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {isRegister
                ? 'Начните генерировать и публиковать посты для вашего бизнеса'
                : 'С возвращением! Войдите, чтобы управлять кампаниями'}
            </p>
          </div>

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleSubmit}
            disabled={loading}
            className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-transparent hover:bg-[var(--bg)] text-[var(--ink)] font-bold text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Продолжить с Google</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-[var(--border)] w-full"></div>
            <span className="bg-[var(--surface)] px-3 text-xs text-[var(--muted)] uppercase font-semibold absolute">
              или почта
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                Электронная почта
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="owner@coffeeshop.ru"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  className="w-full min-h-[44px] px-3.5 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Requirements helper (shown on registration) */}
              {isRegister && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div
                    className={`flex items-center gap-1.5 text-xs ${
                      hasMinLength ? 'text-[var(--success)] font-bold' : 'text-[var(--muted)]'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    <span>Минимум 8 символов</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-xs ${
                      hasLetter && hasDigit
                        ? 'text-[var(--success)] font-bold'
                        : 'text-[var(--muted)]'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    <span>Буквы и хотя бы одна цифра</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (isRegister && !isPasswordValid)}
              className="w-full min-h-[44px] rounded-xl bg-[var(--accent)] hover:opacity-95 text-[var(--on-accent)] font-extrabold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer mt-2"
            >
              {loading
                ? 'Загрузка...'
                : isRegister
                ? 'Зарегистрироваться'
                : 'Войти'}
            </button>
          </form>

          {/* Toggle between register and login */}
          <div className="mt-6 text-center text-sm text-[var(--muted)]">
            {isRegister ? (
              <>
                Уже есть аккаунт?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className="text-[var(--accent)] font-bold hover:underline cursor-pointer"
                >
                  Войти
                </button>
              </>
            ) : (
              <>
                Нет аккаунта?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  className="text-[var(--accent)] font-bold hover:underline cursor-pointer"
                >
                  Зарегистрироваться
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--muted)] pb-2">
        ContentPilot 2.0 · Хакатон MVP · Спешелти кофе & Малый бизнес
      </div>
    </div>
  );
};
