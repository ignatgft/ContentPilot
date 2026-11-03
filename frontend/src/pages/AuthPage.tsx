import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  Eye,
  EyeOff,
  CheckCircle2,
  TrendingUp,
  Warehouse,
  ShieldCheck,
  UtensilsCrossed,
  School,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@smartcanteen.kg');
  const [password, setPassword] = useState('demo1234');
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
      // If login fails because user doesn't exist yet, try to auto-register for demo convenience
      if (!isRegister && err.message && (err.message.includes('401') || err.message.includes('не найден') || err.message.includes('Invalid credentials') || err.message.includes('Bad credentials'))) {
        try {
          await register(email, password);
          return;
        } catch {
          // ignore fallback
        }
      }
      setError(err.message || 'Ошибка авторизации. Проверьте введенные данные.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@smartcanteen.kg');
    setPassword('demo1234');
    setError(null);
    setLoading(true);
    try {
      await login('admin@smartcanteen.kg', 'demo1234');
    } catch {
      try {
        await register('admin@smartcanteen.kg', 'demo1234');
      } catch (err: any) {
        setError(err.message || 'Ошибка входа в демо');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Прогноз спроса и посещаемости',
      text: 'Точный расчёт порций с учётом дней недели, погоды, четвертей и исторических данных без галлюцинаций',
    },
    {
      icon: Warehouse,
      title: 'Партионный склад и списание по FEFO',
      text: 'Контроль сроков годности скоропортящихся продуктов, автоматическое списание сначала более ранних партий',
    },
    {
      icon: ShieldCheck,
      title: 'СанПиН и детерминированные закупки',
      text: 'Автоматический расчёт дефицита сырья на неделю с округлением до упаковок поставщика и контролем бюджета',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B8CFF] to-[#9477FF] flex items-center justify-center text-white shadow-sm">
            <UtensilsCrossed size={18} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-[var(--ink)] leading-tight">
              SmartCanteen <span className="text-[#5B8CFF]">AI</span>
            </span>
            <span className="text-[10px] text-[var(--muted)] tracking-wider uppercase font-semibold">
              Управление школьной столовой
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
          aria-label="Сменить тему"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Pitch Panel (desktop only) */}
          <div className="hidden lg:block">
            <div className="card p-8 space-y-7 animate-page-enter">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B8CFF]/15 text-[#5B8CFF] text-xs font-bold">
                <School size={14} />
                <span>Кейс: Школа-гимназия №24 (г. Бишкек)</span>
              </div>

              <h2 className="text-3xl font-extrabold text-[var(--ink)] tracking-tight leading-snug">
                Цифровая столовая: <span className="text-[#5B8CFF]">минимум отходов, 100% сытых детей</span>
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Интеллектуальное планирование меню, точный прогноз порций по классам, контроль FEFO-партий и исключение порчи продуктов по нормам СанПиН.
              </p>

              <div className="space-y-4">
                {features.map((f) => (
                  <div key={f.title} className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <div className="w-9 h-9 rounded-lg bg-[#5B8CFF]/15 text-[#5B8CFF] flex items-center justify-center shrink-0">
                      <f.icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--ink)]">{f.title}</div>
                      <div className="text-xs text-[var(--muted)] leading-relaxed">{f.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Auth Card */}
          <div className="max-w-md w-full mx-auto">
            <div className="card p-6 sm:p-8 space-y-1 transition-colors duration-200 animate-page-enter">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B8CFF]/15 text-[#5B8CFF] text-xs font-bold mb-3">
                  <UtensilsCrossed size={14} />
                  <span>Единая панель столовой</span>
                </div>
                <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-2">
                  {isRegister ? 'Регистрация столовой' : 'Вход в систему'}
                </h1>
                <p className="text-sm text-[var(--muted)]">
                  {isRegister
                    ? 'Подключите вашу школу к интеллектуальной платформе питания'
                    : 'Войдите для управления меню, складом и закупками'}
                </p>
              </div>

              {/* Fast 1-click Demo Account Login */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={loading}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#5B8CFF]/40 hover:border-[#5B8CFF] bg-[#5B8CFF]/15 hover:bg-[#5B8CFF]/25 text-[#5B8CFF] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  title="Мгновенный вход в заполненный демо-аккаунт школы №24"
                >
                  <School size={16} />
                  <span>Войти в демо: Школа №24 г. Бишкек</span>
                </button>
                <p className="text-[11px] text-[var(--muted)] text-center mt-1.5">
                  1 250 учащихся • Меню на неделю • FEFO-склад • СанПиН
                </p>
              </div>

              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-[var(--border)] w-full"></div>
                <span className="bg-[var(--surface)] px-3 text-xs text-[var(--muted)] uppercase font-semibold absolute">
                  или учётная запись
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
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="canteen@school.edu.kg"
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">Пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      className="w-full min-h-[44px] px-3.5 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--muted)] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
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
                          hasLetter && hasDigit ? 'text-[var(--success)] font-bold' : 'text-[var(--muted)]'
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
                  className="btn-primary w-full min-h-[44px] text-sm cursor-pointer mt-2 disabled:cursor-not-allowed bg-[#5B8CFF] hover:bg-[#4577EB] text-white border-none shadow-md"
                >
                  {loading
                    ? 'Загрузка...'
                    : isRegister
                    ? 'Зарегистрироваться'
                    : 'Войти в SmartCanteen'}
                </button>
              </form>

              {/* Toggle between register and login */}
              <div className="mt-6 text-center text-sm text-[var(--muted)] space-y-3">
                <div>
                  {isRegister ? (
                    <>
                      Уже есть доступ?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(false);
                          setError(null);
                        }}
                        className="text-[#5B8CFF] font-bold hover:underline cursor-pointer"
                      >
                        Войти
                      </button>
                    </>
                  ) : (
                    <>
                      Новая школа?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(true);
                          setError(null);
                        }}
                        className="text-[#5B8CFF] font-bold hover:underline cursor-pointer"
                      >
                        Зарегистрироваться
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <a
                    href="/public/school-24"
                    className="inline-flex items-center gap-1.5 text-xs text-[#55C7DE] font-bold hover:underline"
                  >
                    <UtensilsCrossed size={14} />
                    <span>Вы ученик или родитель? Открыть меню без входа</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--muted)] pb-2 opacity-75">
        SmartCanteen AI — Цифровая платформа управления школьным питанием • Бишкек 2026
      </div>
    </div>
  );
};
