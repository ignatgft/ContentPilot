import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Send, CheckCircle2, RefreshCw, ShieldCheck, ShieldAlert, XCircle } from 'lucide-react';

interface ChannelItem {
  id: number;
  platform: string;
  externalId: string;
  status: string;
  botUsername?: string | null;
  verifiedAt?: string | null;
  verificationError?: string | null;
}

interface BotIdentityResult {
  valid: boolean;
  botUsername?: string;
  botName?: string;
  botId?: number;
  error?: string;
}

interface BotAdminResult {
  valid: boolean;
  botUsername?: string;
  chatTitle?: string;
  chatType?: string;
  botStatus?: string;
  isAdmin?: boolean;
  canPostMessages?: boolean;
  error?: string;
}

interface PlatformConfig {
  id: string;
  name: string;
  type: 'live' | 'manual'; // live = публикация через API, manual = «Готово к публикации»
  badge: string;
  description: string;
  tokenHint: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'TELEGRAM',
    name: 'Telegram',
    type: 'live',
    badge: 'Живая публикация',
    description: 'Мгновенная отправка постов в публичный канал или группу через Bot API.',
    tokenHint: 'Токен бота из @BotFather (обязателен для живой публикации)',
  },
  {
    id: 'VK',
    name: 'ВКонтакте',
    type: 'live',
    badge: 'Живая публикация',
    description: 'Публикация записей на стене сообщества через VK API (wall.post).',
    tokenHint: 'AccessToken сообщества с правом wall',
  },
  {
    id: 'YOUTUBE',
    name: 'YouTube Shorts',
    type: 'manual',
    badge: 'Готово к публикации',
    description: 'Загрузка вертикальных видео требует OAuth-авторизации канала — до неё посты формируются для ручной загрузки.',
    tokenHint: 'AccessToken канала (необязательно на текущем этапе)',
  },
  {
    id: 'INSTAGRAM',
    name: 'Instagram Business',
    type: 'manual',
    badge: 'Готово к публикации',
    description: 'Graph API публикует после аудита приложения Meta — до неё посты формируются для ручной загрузки.',
    tokenHint: 'AccessToken бизнес-аккаунта (после аудита Meta)',
  },
  {
    id: 'TIKTOK',
    name: 'TikTok',
    type: 'manual',
    badge: 'Готово к публикации',
    description: 'Content Posting API ждёт аудита TikTok: формируем сценарий и хэштеги для ручной публикации.',
    tokenHint: 'AccessToken после аудита TikTok',
  },
];

export const ChannelsPage: React.FC = () => {
  const [connectedChannels, setConnectedChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<PlatformConfig | null>(null);
  const [targetId, setTargetId] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [botCheck, setBotCheck] = useState<BotIdentityResult | null>(null);
  const [botCheckLoading, setBotCheckLoading] = useState(false);
  const [adminCheck, setAdminCheck] = useState<BotAdminResult | null>(null);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);

  const fetchChannels = async () => {
    try {
      const data = await apiRequest<ChannelItem[]>('/channels');
      setConnectedChannels(data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const resetChecks = () => {
    setBotCheck(null);
    setAdminCheck(null);
  };

  const handleVerifyBot = async () => {
    if (!tokenInput.trim()) return;
    setBotCheckLoading(true);
    try {
      const data = await apiRequest<BotIdentityResult>('/channels/telegram/verify-bot', {
        method: 'POST',
        body: JSON.stringify({ botToken: tokenInput.trim() }),
      });
      setBotCheck(data);
    } catch (e: any) {
      setBotCheck({ valid: false, error: e.message || 'Не удалось связаться с Telegram API' });
    } finally {
      setBotCheckLoading(false);
    }
  };

  const handleCheckAdmin = async () => {
    if (!targetId.trim() || !tokenInput.trim()) return;
    setAdminCheckLoading(true);
    try {
      const data = await apiRequest<BotAdminResult>('/channels/telegram/check-admin', {
        method: 'POST',
        body: JSON.stringify({ botToken: tokenInput.trim(), channelExternalId: targetId.trim() }),
      });
      setAdminCheck(data);
    } catch (e: any) {
      setAdminCheck({
        valid: false,
        canPostMessages: false,
        error: e.message || 'Не удалось связаться с Telegram API',
      });
    } finally {
      setAdminCheckLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlatform) return;

    setLoading(true);
    try {
      const connected = await apiRequest<ChannelItem>(`/channels/${activePlatform.id.toLowerCase()}`, {
        method: 'POST',
        body: JSON.stringify({
          externalId: targetId,
          botToken: tokenInput,
          platform: activePlatform.id,
        }),
      });
      setSuccessMsg(
        activePlatform.id === 'TELEGRAM' && connected.botUsername
          ? `Канал подключён! Проверенный бот ${connected.botUsername} опубликован в ${connected.externalId}.`
          : `Площадка ${activePlatform.name} успешно подключена!`
      );
      setActivePlatform(null);
      await fetchChannels();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      alert(e.message || 'Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (platformId: string) => {
    return connectedChannels.some(c => c.platform.toUpperCase() === platformId.toUpperCase());
  };

  const getChannelExternalId = (platformId: string) => {
    const found = connectedChannels.find(c => c.platform.toUpperCase() === platformId.toUpperCase());
    return found ? found.externalId : null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="chip mb-2">
            <Send size={14} />
            <span>Мультиканальная дистрибуция</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
            Подключение площадок публикации
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Telegram, ВКонтакте, YouTube Shorts, Instagram и TikTok по единому расписанию
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--success)] font-bold text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map(p => {
          const connected = isConnected(p.id);
          const extId = getChannelExternalId(p.id);
          const connectedChannel = connectedChannels.find(
            c => c.platform.toUpperCase() === p.id.toUpperCase()
          );
          const verified = !!connectedChannel?.verifiedAt;

          return (
            <div
              key={p.id}
              className={`card card-hover p-5 flex flex-col justify-between ${
                connected && verified ? '!border-emerald-500/50 !bg-emerald-500/5' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-[var(--ink)]">{p.name}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      p.type === 'live'
                        ? 'bg-emerald-500/10 text-[var(--success)] border border-emerald-500/30'
                        : 'bg-amber-500/10 text-[var(--warning)] border border-amber-500/30'
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">{p.description}</p>

                {connected && extId && (
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                      <span>Подключено:</span>
                      <span className="text-[var(--accent)]">{extId}</span>
                    </div>
                    {p.id === 'TELEGRAM' && connectedChannel && (
                      verified ? (
                        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/30 text-[11px] font-bold text-[var(--success)] flex items-center gap-1.5">
                          <ShieldCheck size={13} />
                          <span>Бот {connectedChannel.botUsername} проверен: админ канала</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/30 text-[11px] font-bold text-[var(--warning)] flex items-center gap-1.5">
                          <ShieldAlert size={13} />
                          <span className="truncate">
                            {connectedChannel.verificationError || 'Бот не проверен — возможно, живая публикация недоступна'}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border)] mt-4">
                <button
                  onClick={() => {
                    setActivePlatform(p);
                    setTargetId(extId || '');
                    setTokenInput('');
                    resetChecks();
                  }}
                  className={`w-full min-h-[42px] font-extrabold text-xs cursor-pointer ${
                    connected ? 'btn-secondary' : 'btn-primary'
                  }`}
                >
                  {connected ? <RefreshCw size={14} /> : <Send size={14} />}
                  <span>{connected ? 'Переподключить' : 'Подключить'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Modal */}
      {activePlatform && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--ink)]">Подключение: {activePlatform.name}</h3>
              <button
                onClick={() => {
                  setActivePlatform(null);
                  resetChecks();
                }}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              {activePlatform.id === 'TELEGRAM' && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20">
                  <ShieldCheck size={15} className="text-[var(--accent)] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Шаги: 1) вставьте токен и нажмите «Проверить бота», 2) укажите канал и нажмите
                    «Проверить права», 3) бот должен быть администратором канала с правом «Публикация сообщений».
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  API токен (доступ к публикации):
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={e => {
                    setTokenInput(e.target.value);
                    resetChecks();
                  }}
                  placeholder="Вставьте токен доступа"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <span className="text-[11px] text-[var(--muted)] mt-1 block">{activePlatform.tokenHint}</span>
              </div>

              {activePlatform.id === 'TELEGRAM' && (
                <button
                  type="button"
                  onClick={handleVerifyBot}
                  disabled={!tokenInput.trim() || botCheckLoading}
                  className="btn-secondary min-h-[38px] px-4 text-xs cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck size={14} />
                  <span>{botCheckLoading ? 'Проверяем...' : 'Шаг 1. Проверить бота'}</span>
                </button>
              )}

              {botCheck &&
                (botCheck.valid ? (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-[var(--success)] flex items-start gap-1.5">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Токен валиден: бот {botCheck.botUsername} ({botCheck.botName}, ID {botCheck.botId}).
                    </span>
                  </div>
                ) : (
                  <CheckButtonResult label="Проверка токена не прошла" error={botCheck.error} />
                ))}

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  ID канала / сообщества / аккаунта:
                </label>
                <input
                  type="text"
                  required
                  value={targetId}
                  onChange={e => {
                    setTargetId(e.target.value);
                    setAdminCheck(null);
                  }}
                  placeholder={
                    activePlatform.id === 'TELEGRAM'
                      ? '@my_public_channel'
                      : activePlatform.id === 'VK' || activePlatform.id === 'YOUTUBE'
                      ? 'ID сообщества / канала'
                      : 'Логин или ID аккаунта'
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                {activePlatform.id === 'TELEGRAM' && (
                  <span className="text-[11px] text-[var(--muted)] mt-1 block">
                    Для приватного канала — числовой Chat ID (начинается с -100).
                  </span>
                )}
              </div>

              {activePlatform.id === 'TELEGRAM' && (
                <>
                  <button
                    type="button"
                    onClick={handleCheckAdmin}
                    disabled={!tokenInput.trim() || !targetId.trim() || adminCheckLoading}
                    className="btn-secondary min-h-[38px] px-4 text-xs cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck size={14} />
                    <span>{adminCheckLoading ? 'Проверяем...' : 'Шаг 2. Проверить права администратора'}</span>
                  </button>

                  {adminCheck &&
                    (adminCheck.valid ? (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-[var(--success)] flex items-start gap-1.5">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                        <span>
                          {adminCheck.botUsername} — администратор «{adminCheck.chatTitle}» с правом
                          публикации. Готово к автопостингу!
                        </span>
                      </div>
                    ) : (
                      <CheckButtonResult label="Права публикации не подтверждены" error={adminCheck.error} />
                    ))}
                </>
              )}

              {activePlatform.id !== 'TELEGRAM' && (
                <span className="text-[11px] text-[var(--muted)] block">
                  Без токена площадка подключится, но живые публикации по ней будут «Готово к публикации».
                </span>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePlatform(null);
                    resetChecks();
                  }}
                  className="btn-secondary min-h-[42px] px-4 text-xs cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary min-h-[42px] px-5 text-xs cursor-pointer"
                >
                  {loading ? 'Подключение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckButtonResult: React.FC<{ label: string; error?: string }> = ({ label, error }) => (
  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-1.5">
    <XCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
    <div>
      <span className="text-[11px] font-bold text-red-500">{label}</span>
      {error && <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-0.5">{error}</p>}
    </div>
  </div>
);
