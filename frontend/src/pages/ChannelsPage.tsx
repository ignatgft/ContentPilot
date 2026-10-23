import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Send, CheckCircle2, Shield } from 'lucide-react';

interface ChannelItem {
  id: number;
  platform: string;
  externalId: string;
  status: string;
}

export const ChannelsPage: React.FC = () => {
  const [channelId, setChannelId] = useState('@coffee_point_demo');
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchChannels = async () => {
    try {
      const data = await apiRequest<ChannelItem[]>('/channels');
      if (data && data.length > 0) {
        setChannelId(data[0].externalId);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    try {
      await apiRequest('/channels/telegram', {
        method: 'POST',
        body: JSON.stringify({
          externalId: channelId,
          botToken: botToken,
        }),
      });
      setSavedSuccess(true);
      await fetchChannels();
    } catch (e: any) {
      alert(e.message || 'Ошибка подключения канала');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] text-xs font-bold mb-2">
          <Send size={14} />
          <span>Площадки публикации</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
          Подключение Telegram-канала
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          ContentPilot автоматически публикует проверенные посты в ваш канал по расписанию
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--ink)]">Параметры Telegram Bot</h2>

          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--success)] font-bold text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Канал успешно подключен! Тестовые публикации готовы к отправке.</span>
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                ID публичного канала или чата
              </label>
              <input
                type="text"
                required
                value={channelId}
                onChange={e => setChannelId(e.target.value)}
                placeholder="@my_coffee_point"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                Бот должен быть добавлен в администраторы канала с правом отправки сообщений.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Токен Telegram-бота (опционально для демо)
              </label>
              <input
                type="password"
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                Если оставить пустым, система использует токен из переменных окружения или режим симуляции хакатона.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] rounded-xl bg-[var(--accent)] text-[var(--on-accent)] font-extrabold text-sm hover:opacity-95 transition-all shadow-sm cursor-pointer"
            >
              {loading ? 'Подключение...' : 'Подключить Telegram-канал'}
            </button>
          </form>
        </div>

        {/* Info card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
            <Shield size={18} className="text-[var(--accent)]" />
            <span>Статус интеграции</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--chip-bg)] border border-[var(--border)] text-xs text-[var(--muted)] space-y-2">
            <div className="flex items-center justify-between font-bold text-[var(--ink)]">
              <span>Telegram:</span>
              <span className="text-[var(--success)]">Активен</span>
            </div>
            <div className="flex items-center justify-between font-bold text-[var(--ink)]">
              <span>VK:</span>
              <span className="text-[var(--muted)]">Режим экспорта</span>
            </div>
            <div className="flex items-center justify-between font-bold text-[var(--ink)]">
              <span>Instagram:</span>
              <span className="text-[var(--muted)]">Режим экспорта</span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            По ТЗ хакатона живая автопубликация API работает в Telegram. Для VK и Instagram формируются готовые к выгрузке медиаматериалы.
          </p>
        </div>
      </div>
    </div>
  );
};
