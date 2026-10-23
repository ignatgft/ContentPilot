import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Send, CheckCircle2, Shield, RefreshCw } from 'lucide-react';

interface ChannelItem {
  id: number;
  platform: string;
  externalId: string;
  status: string;
}

interface PlatformConfig {
  id: string;
  name: string;
  type: string; // 'live' | 'manual'
  badge: string;
  description: string;
  defaultId: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'TELEGRAM',
    name: 'Telegram',
    type: 'live',
    badge: 'Живая публикация',
    description: 'Мгновенная отправка постов в публичный канал или группу через Bot API.',
    defaultId: '@coffee_point_demo',
  },
  {
    id: 'VK',
    name: 'ВКонтакте',
    type: 'live',
    badge: 'Живая публикация',
    description: 'Публикация записей и фото на стене сообщества через официальный VK API.',
    defaultId: 'public_coffee_point',
  },
  {
    id: 'YOUTUBE',
    name: 'YouTube Shorts',
    type: 'live',
    badge: 'Живая публикация',
    description: 'Загрузка коротких вертикальных видео через YouTube Data API v3.',
    defaultId: '@CoffeePointShorts',
  },
  {
    id: 'INSTAGRAM',
    name: 'Instagram Business',
    type: 'live',
    badge: 'Graph API (Тестовый аккаунт)',
    description: 'Публикация постов и Reels через Meta Graph API для связанных бизнес-аккаунтов.',
    defaultId: 'coffeepoint.official',
  },
  {
    id: 'TIKTOK',
    name: 'TikTok',
    type: 'manual',
    badge: 'Готово к публикации',
    description: 'Content Posting API в режиме ожидания аудита TikTok. Формируется сценарий и видео.',
    defaultId: '@coffeepoint_tok',
  },
];

export const ChannelsPage: React.FC = () => {
  const [connectedChannels, setConnectedChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<PlatformConfig | null>(null);
  const [targetId, setTargetId] = useState('');
  const [tokenInput, setTokenInput] = useState('');

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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlatform) return;

    setLoading(true);
    try {
      await apiRequest(`/channels/${activePlatform.id.toLowerCase()}`, {
        method: 'POST',
        body: JSON.stringify({
          externalId: targetId,
          botToken: tokenInput,
          platform: activePlatform.id,
        }),
      });
      setSuccessMsg(`Площадка ${activePlatform.name} успешно подключена!`);
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] text-xs font-bold mb-2">
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

        <div className="p-3 rounded-xl bg-[var(--chip-bg)] border border-[var(--border)] text-xs font-bold text-[var(--ink)] flex items-center gap-2">
          <Shield size={16} className="text-[var(--accent)]" />
          <span>Доступ с телефона: http://192.168.10.181:3000</span>
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

          return (
            <div
              key={p.id}
              className={`bg-[var(--surface)] border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all ${
                connected
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-[var(--border)]'
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
                  <div className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                    <span>Подключено:</span>
                    <span className="text-[var(--accent)]">{extId}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border)] mt-4">
                <button
                  onClick={() => {
                    setActivePlatform(p);
                    setTargetId(extId || p.defaultId);
                    setTokenInput('');
                  }}
                  className={`w-full min-h-[40px] rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    connected
                      ? 'border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--bg)]'
                      : 'bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-95 shadow-sm'
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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--ink)]">
                Подключение: {activePlatform.name}
              </h3>
              <button
                onClick={() => setActivePlatform(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  ID канала / сообщества / аккаунта:
                </label>
                <input
                  type="text"
                  required
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  API токен (опционально для демо):
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="Вставьте токен доступа или оставьте пустым"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
                <span className="text-[11px] text-[var(--muted)] mt-1 block">
                  Для демо-режима токен можно оставить пустым.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePlatform(null)}
                  className="min-h-[42px] px-4 rounded-xl border border-[var(--border)] text-[var(--ink)] text-xs font-bold hover:bg-[var(--bg)]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[42px] px-5 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] text-xs font-extrabold hover:opacity-95"
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
