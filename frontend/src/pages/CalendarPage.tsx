import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Calendar as CalendarIcon } from 'lucide-react';

interface PostItem {
  id: number;
  platform: string;
  text: string;
  status: string;
  scheduledAt?: string;
}

export const CalendarPage: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await apiRequest<PostItem[]>('/posts');
        setPosts(data);
      } catch (e: any) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
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
            Посты отправляются автоматически в заданное время планировщиком задач
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
                        className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
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
    </div>
  );
};
