import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiRequest, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  User, Shield, Sun, Moon, Globe, Bell, Database, LogOut,
  Check, Loader2, Trash2, Download, MonitorSmartphone, AlertTriangle,
  Camera, Lock, RefreshCw, ExternalLink,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---------- types ----------

interface Profile {
  id: number;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  provider: string;
  registeredAt?: string | null;
}

interface SessionItem {
  id: string;
  client: string;
  current: boolean;
  createdAt?: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

interface Settings {
  language: string;
  timezone: string;
  notifyPublishFailed: boolean;
  notifyGenerationCompleted: boolean;
  notifyReviewRequired: boolean;
}





const TIMEZONES = [
  'Asia/Bishkek', 'Asia/Almaty', 'Asia/Yekaterinburg', 'Europe/Moscow',
  'Europe/Kyiv', 'Europe/Berlin', 'UTC',
];

type Tab = 'profile' | 'security' | 'settings' | 'notifications' | 'privacy' | 'logout';

const SECTIONS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Мой профиль', icon: User },
  { id: 'security', label: 'Безопасность и вход', icon: Shield },
  { id: 'settings', label: 'Оформление и тема', icon: Sun },
  { id: 'notifications', label: 'Уведомления', icon: Bell },

  { id: 'privacy', label: 'Конфиденциальность (Zero-PII)', icon: Database },

  { id: 'logout', label: 'Выход из аккаунта', icon: LogOut },
];

export const AccountPage: React.FC = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-page-enter">
      <div>
        <div className="chip mb-2">
          <User size={14} />
          <span>Личный кабинет</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">Мой аккаунт</h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          Профиль, безопасность, настройки и данные — всё в одном месте
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
        {/* Sidebar navigation */}
        <nav className="card p-2 space-y-0.5">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = s.id === tab;
            return (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                  active
                    ? 'bg-[var(--chip-bg)] text-[var(--chip-text)]'
                    : s.id === 'logout'
                    ? 'text-red-500 hover:bg-red-500/10'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
                }`}
              >
                <Icon size={15} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active section */}
        <div className="space-y-4">
          {tab === 'profile' && <ProfileSection />}
          {tab === 'security' && <SecuritySection />}
          {tab === 'settings' && <AppSettingsSection />}
          {tab === 'notifications' && <NotificationsSection />}

          {tab === 'privacy' && <PrivacySection />}

          {tab === 'logout' && <LogoutSection logout={logout} />}
        </div>
      </div>
    </div>
  );
};

// ---------- shared ----------

const SuccessBanner: React.FC<{ text: string }> = ({ text }) => (
  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--success)] font-bold text-xs flex items-center gap-2">
    <Check size={15} />
    <span>{text}</span>
  </div>
);

const ErrorBanner: React.FC<{ text: string }> = ({ text }) => (
  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-xs flex items-start gap-2">
    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
    <span>{text}</span>
  </div>
);

const useMessage = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flashError = useCallback((msg: string) => setError(msg), []);
  const flashSuccess = useCallback((msg: string, ttl = 3000) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), ttl);
  }, []);
  return useMemo(() => ({ success, error, flashError, flashSuccess }), [success, error, flashError, flashSuccess]);
};

const sectionTitle = (text: string, subtitle?: string) => (
  <div>
    <h2 className="text-base font-extrabold text-[var(--ink)]">{text}</h2>
    {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
  </div>
);

// ---------- Профиль ----------

const ProfileSection: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const msg = useMessage();

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<Profile>('/account/me');
      setProfile(data);
      setName(data.displayName || '');
      setSavedName(data.displayName || '');
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [msg.flashError]);

  useEffect(() => { load(); }, [load]);

  const dirty = name.trim() !== savedName.trim() && name.trim() !== '';

  const saveName = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const updated = await apiRequest<Profile>('/account/me', {
        method: 'PUT',
        body: JSON.stringify({ displayName: name.trim() }),
      });
      setProfile(updated);
      setName(updated.displayName || '');
      setSavedName(updated.displayName || '');
      msg.flashSuccess('Профиль сохранён');
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const data = await apiRequest<Profile>('/account/avatar', { method: 'POST', body: form });
      setProfile(data);
      msg.flashSuccess('Фото профиля обновлено');
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await apiRequest<Profile>('/account/avatar', { method: 'DELETE' });
      setProfile((p) => (p ? { ...p, avatarUrl: null } : p));
      msg.flashSuccess('Фото удалено');
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Не удалось удалить фото');
    }
  };

  if (loading) {
    return <div className="card p-6 flex items-center gap-2 text-xs text-[var(--muted)]"><Loader2 size={15} className="animate-spin" /> Загрузка профиля…</div>;
  }
  if (!profile) return <div className="card p-6 text-xs text-[var(--muted)]">Профиль недоступен</div>;

  const providerLabel = profile.provider === 'google' ? 'Google'
    : profile.provider === 'password+google' ? 'Email + Google' : 'Email и пароль';

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-5">
        {sectionTitle('Мой профиль', 'Данные аккаунта ContentPilot. Изменения сохраняются на сервере.')}
        {msg.success && <SuccessBanner text={msg.success} />}
        {msg.error && <ErrorBanner text={msg.error} />}

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Фото профиля" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent)]/40" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white font-extrabold text-xl">
                {getInitials(profile.email)}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)] hover:bg-[var(--chip-bg)] cursor-pointer transition-colors"
              title="Загрузить фото"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) uploadAvatar(f);
                e.target.value = '';
              }}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-extrabold text-base text-[var(--ink)]">{profile.displayName || 'Без имени'}</div>
            <div className="text-xs text-[var(--muted)]">{profile.email}</div>
            <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
              <span className="chip">{providerLabel}</span>
              <span className="chip">ID: {profile.id}</span>
            </div>
          </div>
          {profile.avatarUrl && (
            <button onClick={removeAvatar} className="btn-secondary text-xs min-h-[38px] px-3 cursor-pointer">
              <Trash2 size={14} />
              <span>Убрать фото</span>
            </button>
          )}
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[var(--ink)]">Отображаемое имя:</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={name}
              maxLength={120}
              onChange={e => setName(e.target.value)}
              placeholder="Как показывать ваше имя"
              className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <button disabled={!dirty || saving} onClick={saveName} className="btn-primary min-h-[44px] px-5 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Сохранить</span>
            </button>
            {dirty && (
              <button onClick={() => setName(savedName)} className="btn-secondary min-h-[44px] px-4 text-xs cursor-pointer">
                Отменить
              </button>
            )}
          </div>
        </div>

        {/* Read-only facts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoTile label="Почта" value={profile.email} />
          <InfoTile
            label="Дата регистрации"
            value={profile.registeredAt ? new Date(profile.registeredAt).toLocaleDateString('ru-RU') : '—'}
          />
          <InfoTile label="Способ входа" value={providerLabel} />
        </div>
      </div>
    </div>
  );
};

const InfoTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
    <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wide">{label}</div>
    <div className="text-xs font-extrabold text-[var(--ink)] mt-1 truncate" title={value}>{value}</div>
  </div>
);

const getInitials = (email?: string) => {
  if (!email) return 'U';
  const base = email.split('@')[0];
  return base.slice(0, 2).toUpperCase();
};

// ---------- Безопасность ----------

const SecuritySection: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[] | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const msg = useMessage();

  const reloadSessions = useCallback(async () => {
    try {
      const stored = localStorage.getItem('refresh_token') || '';
      const list = await apiRequest<SessionItem[]>('/auth/sessions', {
        method: 'POST',
        body: JSON.stringify(stored ? { refreshToken: stored } : {}),
      });
      setSessions(list);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setProfile(await apiRequest<Profile>('/account/me'));
      } catch {}
      await reloadSessions();
    })();
  }, [reloadSessions]);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== repeatPassword) {
      msg.flashError('Новый пароль и его повтор не совпадают');
      return;
    }
    setChanging(true);
    try {
      const res = await apiRequest<{ message: string }>('/account/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword(''); setNewPassword(''); setRepeatPassword('');
      msg.flashSuccess(res.message || 'Пароль изменён');
      await reloadSessions();
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Не удалось изменить пароль');
    } finally {
      setChanging(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await apiRequest(`/auth/sessions/${id}`, { method: 'DELETE' });
      await reloadSessions();
    } catch {}
  };

  const revokeAll = async () => {
    try {
      await apiRequest<{ message: string }>('/auth/logout-all', { method: 'POST' });
      msg.flashSuccess('Все сессии завершены');
      await reloadSessions();
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Ошибка');
    }
  };

  const isGoogleOnly = profile?.provider === 'google';

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-5">
        {sectionTitle('Изменение пароля', isGoogleOnly
          ? 'Аккаунт создан через Google — вход выполняется через Google, локальный пароль не используется.'
          : 'После смены пароля все активные сессии завершаются и потребуется повторный вход.')}
        {msg.success && <SuccessBanner text={msg.success} />}
        {msg.error && <ErrorBanner text={msg.error} />}

        {isGoogleOnly ? (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[var(--warning)] font-bold text-xs flex items-center gap-2">
            <ExternalLink size={15} />
            <span>Доступен только вход через Google. Управляйте безопасностью в аккаунте Google.</span>
          </div>
        ) : (
          <form onSubmit={changePassword} className="space-y-3 max-w-md">
            <input
              type="email"
              hidden
              autoComplete="username"
              value={user?.email}
              readOnly
            />
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Текущий пароль:</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Новый пароль:</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                pattern=".{8,}"
                title="Минимум 8 символов, включая буквы и цифры"
                required
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">Минимум 8 символов, включая буквы и цифры</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Повторите новый пароль:</label>
              <input
                type="password"
                value={repeatPassword}
                onChange={e => setRepeatPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <button type="submit" disabled={changing} className="btn-primary min-h-[44px] px-5 text-xs cursor-pointer">
              {changing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              <span>Изменить пароль</span>
            </button>
          </form>
        )}
      </div>

      {/* Sessions */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          {sectionTitle('Активные сессии', 'Устройства, в которых вы сейчас вошли')}
          <button onClick={revokeAll} className="btn-secondary text-xs min-h-[38px] px-3 cursor-pointer">
            <RefreshCw size={13} />
            <span>Выйти со всех устройств</span>
          </button>
        </div>
        {msg.error && <ErrorBanner text={msg.error} />}
        {!sessions ? (
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] py-3"><Loader2 size={14} className="animate-spin" /> Загрузка…</div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-[var(--muted)] py-3">Нет активных сессий</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <div className="flex items-center gap-3 min-w-0">
                  <MonitorSmartphone size={17} className="text-[var(--muted)] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[var(--ink)] flex items-center gap-1.5">
                      {s.client === 'mobile' ? 'Мобильное приложение' : 'Веб-интерфейс'}
                      {s.current && <span className="chip !text-[10px] !py-0">Эта сессия</span>}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] truncate">
                      Вход: {s.createdAt ? new Date(s.createdAt).toLocaleString('ru-RU') : '—'} · Активность: {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString('ru-RU') : '—'}
                    </div>
                  </div>
                </div>
                {!s.current && (
                  <button onClick={() => revoke(s.id)} title="Завершить сессию"
                    className="text-[var(--muted)] hover:text-red-500 cursor-pointer p-2 rounded-lg hover:bg-red-500/10 shrink-0">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Настройки приложения ----------

const AppSettingsSection: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const msg = useMessage();

  useEffect(() => {
    (async () => {
      try {
        setSettings(await apiRequest<Settings>('/account/settings'));
      } catch (e: any) {
        msg.flashError(e instanceof ApiError ? e.message : 'Не удалось загрузить настройки');
      }
    })();
  }, [msg.flashError]);

  const save = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next); // optimistic
    setSaving(true);
    try {
      const saved = await apiRequest<Settings>('/account/settings', {
        method: 'PUT',
        body: JSON.stringify(next),
      });
      setSettings(saved);
      msg.flashSuccess('Настройки сохранены');
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 space-y-5">
      {sectionTitle('Настройки приложения', 'Тема хранится на устройстве; язык, часовой пояс и прочее синхронизируются между web и мобильным приложением.')}
      {msg.success && <SuccessBanner text={msg.success} />}
      {msg.error && <ErrorBanner text={msg.error} />}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--ink)]"><Sun size={15} className="text-[var(--accent)]" /> Тема интерфейса <span className="text-[10px] text-[var(--muted)] font-normal">(на устройстве)</span></div>
        <div className="flex gap-2">
          {([['light', 'Светлая', Sun], ['dark', 'Тёмная', Moon], ['system', 'Системная', MonitorSmartphone]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`btn-secondary flex-1 min-h-[44px] text-xs cursor-pointer ${
                theme === key ? '!bg-[var(--chip-bg)] !border-[var(--accent)] !text-[var(--chip-text)]' : ''
              }`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--ink)]"><Globe size={15} className="text-[var(--accent)]" /> Язык интерфейса</div>
        <div className="flex gap-2">
          {[['ru', 'Русский (RU)'], ['kg', 'Кыргызча (KG)']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { localStorage.setItem('cp_language', key); save({ language: key }); }}
              disabled={!settings || saving}
              className={`btn-secondary flex-1 min-h-[44px] text-xs cursor-pointer ${
                settings?.language === key ? '!bg-[var(--chip-bg)] !border-[var(--accent)] !text-[var(--chip-text)]' : ''
              }`}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-extrabold text-[var(--ink)]">Часовой пояс (для расписания публикаций)</div>
        <select
          value={settings?.timezone || 'Asia/Bishkek'}
          onChange={e => save({ timezone: e.target.value })}
          className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>
    </div>
  );
};

// ---------- Уведомления ----------

const NotificationsSection: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [mounted, setMounted] = useState(false);
  const msg = useMessage();

  useEffect(() => {
    (async () => {
      try {
        setSettings(await apiRequest<Settings>('/account/settings'));
      } catch (e: any) {
        msg.flashError(e instanceof ApiError ? e.message : 'Не удалось загрузить настройки');
      } finally {
        setMounted(true);
      }
    })();
  }, [msg.flashError]);

  const toggle = async (key: keyof Settings, label: string) => {
    if (!settings) return;
    const next = { ...settings, [key]: !(settings[key] as boolean) };
    setSettings(next);
    try {
      const saved = await apiRequest<Settings>('/account/settings', {
        method: 'PUT',
        body: JSON.stringify(next),
      });
      setSettings(saved);
      msg.flashSuccess(`«${label}» ${saved[key] ? 'включено' : 'выключено'}`);
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Не удалось сохранить');
    }
  };

  const items: { key: keyof Settings; title: string; desc: string }[] = [
    { key: 'notifyPublishFailed', title: 'Ошибки публикаций', desc: 'Публикация не удалась на площадке или остановлена после 3 попыток.' },
    { key: 'notifyGenerationCompleted', title: 'Завершение генерации контента', desc: 'Контент для кампании или текучки готов к просмотру.' },
    { key: 'notifyReviewRequired', title: 'Необходима проверка', desc: 'Материал отправлен вам на ручное подтверждение перед публикацией.' },
  ];

  return (
    <div className="card p-6 space-y-4">
      {sectionTitle('Уведомления', 'Предпочтения сохраняются на сервере и применяются во всех клиентах. Push-доставка подключается отдельно — сейчас предпочтения влияют на очередь уведомлений внутри приложения.')}
      {msg.success && <SuccessBanner text={msg.success} />}
      {msg.error && <ErrorBanner text={msg.error} />}
      {!settings && !msg.error ? (
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] py-2"><Loader2 size={14} className="animate-spin" /> Загрузка…</div>
      ) : (
        <div className="space-y-2.5">
          {items.map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-[var(--ink)]">{item.title}</div>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggle(item.key, item.title)}
                disabled={!mounted}
                role="switch"
                aria-checked={!!settings?.[item.key]}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                  settings?.[item.key] ? 'bg-emerald-500' : 'bg-[var(--border)]'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings?.[item.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Конфиденциальность ----------

const PrivacySection: React.FC = () => {
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const msg = useMessage();

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/v1/account/export', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Не удалось выгрузить данные');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contentpilot-export.json';
      a.click();
      URL.revokeObjectURL(url);
      msg.flashSuccess('Данные выгружены');
    } catch (e: any) {
      msg.flashError(e.message || 'Ошибка выгрузки');
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await apiRequest('/account/me', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: confirmText }),
      });
      setShowDelete(false);
      await logout();
      window.location.assign('/');
    } catch (e: any) {
      msg.flashError(e instanceof ApiError ? e.message : 'Не удалось удалить аккаунт');
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-4">
        {sectionTitle('Экспорт данных', 'JSON-файл со всеми вашими брендами, кампаниями, постами и подключениями.')}
        <button onClick={exportData} disabled={exporting} className="btn-secondary min-h-[42px] px-4 text-xs cursor-pointer">
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          <span>Скачать данные (JSON)</span>
        </button>
      </div>

      <div className="card p-6 space-y-4 !border-red-500/40">
        <div className="flex items-center gap-2 text-red-500 font-extrabold text-sm">
          <Trash2 size={16} />
          <span>Удаление аккаунта</span>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Аккаунт удаляется безвозвратно вместе со всеми брендами, кампаниями, черновиками и запланированными
          публикациями, а также подключениями площадок и историей генераций. Активные сессии завершаются.
          Мы не берём и не храним платёжные данные.
        </p>
        <button onClick={() => setShowDelete(true)} className="min-h-[42px] px-5 rounded-xl border border-red-500 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white font-extrabold text-xs transition-colors cursor-pointer w-full sm:w-auto">
          <span>Удалить аккаунт…</span>
        </button>
      </div>

      {msg.success && <SuccessBanner text={msg.success} />}
      {msg.error && <ErrorBanner text={msg.error} />}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-6 space-y-3 shadow-xl">
            <h3 className="text-base font-extrabold text-[var(--ink)]">Подтверждение удаления</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Введите <span className="font-extrabold text-red-500">DELETE</span> для подтверждения. Действие необратимо.
            </p>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDelete(false); setConfirmText(''); }} className="btn-secondary min-h-[42px] px-4 text-xs cursor-pointer">Отмена</button>
              <button
                onClick={deleteAccount}
                disabled={confirmText !== 'DELETE' || deleting}
                className="min-h-[42px] px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Удалить навсегда</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Выход ----------

const LogoutSection: React.FC<{ logout: () => Promise<void> }> = ({ logout }) => (
  <div className="card p-6 space-y-4">
    {sectionTitle('Выход из аккаунта', 'Текущая сессия отзывается на сервере, токены удаляются на этом устройстве.')}
    <button
      onClick={async () => { await logout(); window.location.assign('/'); }}
      className="min-h-[44px] px-5 rounded-xl border border-red-500 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-colors"
    >
      <LogOut size={15} />
      <span>Выйти</span>
    </button>
  </div>
);
