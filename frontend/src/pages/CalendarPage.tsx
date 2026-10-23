import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Calendar as CalendarIcon, Clock, Send, X, Image as ImageIcon, Video } from 'lucide-react';

interface PostItem {
  id: number;
  platform: string;
  text: string;
  status: string;
  scheduledAt?: string;
  mediaUrl?: string;
}

export const CalendarPage: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const loadPosts = async () => {
    try {
      const data = await apiRequest<PostItem[]>('/posts');
      setPosts(data);
    } catch (e: any) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Generate next 7 days starting today
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + idx);
    return d;
  });

  const getPostsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return posts.filter(p => {
      if (!p.scheduledAt) return false;
      return p.scheduledAt.startsWith(dateStr);
    });
  };

  const handleOpenPost = (post: PostItem) => {
    setSelectedPost(post);
    if (post.scheduledAt) {
      setNewDate(post.scheduledAt.slice(0, 16));
    } else {
      setNewDate(new Date().toISOString().slice(0, 16));
    }
    setActionMsg('');
  };

  const handleReschedule = async () => {
    if (!selectedPost || !newDate) return;
    setSaving(true);
    setActionMsg('');
    try {
      const updated = await apiRequest<PostItem>(`/posts/${selectedPost.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          scheduledAt: new Date(newDate).toISOString(),
        }),
      });
      setSelectedPost(updated);
      setActionMsg('Время публикации успешно перенесено!');
      loadPosts();
    } catch (e: any) {
      setActionMsg(e.message || 'Ошибка обновления времени');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!selectedPost) return;
    setSaving(true);
    setActionMsg('');
    try {
      const res = await apiRequest<PostItem>(`/posts/${selectedPost.id}/publish`, {
        method: 'POST',
      });
      setSelectedPost(res);
      setActionMsg('Публикация успешно отправлена в эфир!');
      loadPosts();
    } catch (e: any) {
      setActionMsg(e.message || 'Ошибка публикации');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] text-xs font-bold mb-2">
            <CalendarIcon size={14} />
            <span>Расписание публикаций</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
            Календарь контента
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Кликните на публикацию, чтобы просмотреть детали, прикрепленный медиафайл или изменить время выхода
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8 text-[var(--muted)]">Загрузка календаря...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {days.map((day, idx) => {
            const dayPosts = getPostsForDay(day);
            const isToday = idx === 0;

            return (
              <div
                key={idx}
                className={`min-h-[220px] rounded-2xl border p-3.5 flex flex-col justify-between transition-colors ${
                  isToday
                    ? 'border-[var(--accent)] bg-[var(--chip-bg)]/30'
                    : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
                    <span className="text-xs font-extrabold text-[var(--ink)] uppercase">
                      {day.toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                        isToday
                          ? 'bg-[var(--accent)] text-[var(--on-accent)] font-extrabold'
                          : 'text-[var(--muted)]'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayPosts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleOpenPost(p)}
                        className={`p-2.5 rounded-xl border text-xs space-y-1.5 cursor-pointer hover:shadow-md transition-all ${
                          p.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : p.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-[var(--bg)] border-[var(--border)]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="text-[var(--accent)]">{p.platform}</span>
                          <span
                            className={
                              p.status === 'NEEDS_REVIEW'
                                ? 'text-[var(--warning)]'
                                : p.status === 'PUBLISHED'
                                ? 'text-[var(--success)]'
                                : 'text-[var(--muted)]'
                            }
                          >
                            {p.status === 'NEEDS_REVIEW'
                              ? 'Внимание'
                              : p.status === 'PUBLISHED'
                              ? 'Вышел'
                              : 'План'}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[var(--ink)] leading-snug">
                          {p.text}
                        </p>
                        {p.mediaUrl && (
                          <div className="pt-1 flex items-center gap-1 text-[10px] text-[var(--accent)] font-semibold">
                            {p.mediaUrl.endsWith('.mp4') ? <Video size={12} /> : <ImageIcon size={12} />}
                            <span>Медиа вложено</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {dayPosts.length === 0 && (
                      <div className="text-[11px] text-[var(--muted)] text-center py-6 italic">
                        Нет постов
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-[var(--muted)] text-right pt-2 font-medium">
                  {dayPosts.length} пост(ов)
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Details & Reschedule Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[var(--accent)] text-sm">{selectedPost.platform}</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[var(--chip-bg)] text-[var(--chip-text)]">
                  {selectedPost.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {actionMsg && (
              <div className="p-3 rounded-xl bg-[var(--chip-bg)] text-xs font-bold text-[var(--ink)] border border-[var(--border)]">
                {actionMsg}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[var(--muted)]">Текст публикации</label>
              <div className="mt-1 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--ink)] whitespace-pre-wrap max-h-40 overflow-y-auto">
                {selectedPost.text}
              </div>
            </div>

            {selectedPost.mediaUrl && (
              <div>
                <label className="text-xs font-bold text-[var(--muted)] mb-1 block">Прикреплённый медиафайл</label>
                {selectedPost.mediaUrl.endsWith('.mp4') ? (
                  <video
                    src={selectedPost.mediaUrl}
                    controls
                    className="w-full max-h-48 rounded-xl bg-black object-contain"
                  />
                ) : (
                  <img
                    src={selectedPost.mediaUrl}
                    alt="Creative visual"
                    className="w-full max-h-48 rounded-xl object-cover border border-[var(--border)]"
                  />
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[var(--muted)] flex items-center gap-1.5 mb-1">
                <Clock size={14} />
                <span>Запланированное время выхода (UTC)</span>
              </label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--ink)] font-bold outline-hidden focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handlePublishNow}
                disabled={saving || selectedPost.status === 'PUBLISHED'}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>Опубликовать сейчас</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--chip-bg)] cursor-pointer"
                >
                  Закрыть
                </button>
                <button
                  type="button"
                  onClick={handleReschedule}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--on-accent)] font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Перенести'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
