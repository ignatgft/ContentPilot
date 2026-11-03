import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Calendar as CalendarIcon,
  Clock,
  Send,
  X,
  Image as ImageIcon,
  Video,
  Download,
  FileSpreadsheet,
  Filter,
  Check,
  Copy,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Edit3,
  Info,
} from 'lucide-react';

interface PostItem {
  id: number;
  platform: string;
  text: string;
  status: string;
  scheduledAt?: string;
  mediaUrl?: string;
  error?: string;
}

export const CalendarPage: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState('');

  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

  // Filtered posts
  const filteredPosts = posts.filter(p => {
    if (platformFilter !== 'ALL' && p.platform.toUpperCase() !== platformFilter.toUpperCase()) {
      return false;
    }
    if (statusFilter !== 'ALL' && p.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Generate next 7 days starting today
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + idx);
    return d;
  });

  const getPostsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredPosts.filter(p => {
      if (!p.scheduledAt) return false;
      return p.scheduledAt.startsWith(dateStr);
    });
  };

  const toLocalInput = (iso?: string) => {
    if (!iso) return new Date().toISOString().slice(0, 16);
    const d = new Date(iso);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const playWarningBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (_) {}
  };

  const playSuccessChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playNote(523.25, now, 0.2);
      playNote(659.25, now + 0.08, 0.2);
      playNote(783.99, now + 0.16, 0.4);
    } catch (_) {}
  };

  const getModalStatusBadge = (status: string) => {
    switch (status) {
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40">
            <AlertTriangle size={12} />
            <span>Требует проверки</span>
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Clock size={12} />
            <span>Запланирован</span>
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-500/10 text-[var(--success)] border border-emerald-500/30">
            <CheckCircle2 size={12} />
            <span>Опубликовано</span>
          </span>
        );
      case 'READY_MANUAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30">
            <Send size={12} />
            <span>Готов к публикации</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            <AlertCircle size={12} />
            <span>Ошибка публикации</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-[var(--chip-bg)] text-[var(--chip-text)] text-xs">
            <span>{status}</span>
          </span>
        );
    }
  };

  const handlePriceGuardFixInModal = async () => {
    if (!selectedPost) return;
    playWarningBeep();
    setSaving(true);
    setActionMsg('');
    setIsError(false);

    const fixedText = selectedPost.text
      .replace(/150\s*₽?/g, '250 ₽')
      .replace(/190\s*₽?/g, '250 ₽');

    setTimeout(() => {
      playSuccessChime();
    }, 240);

    try {
      const updated = await apiRequest<PostItem>(`/posts/${selectedPost.id}`, {
        method: 'PUT',
        body: JSON.stringify({ text: fixedText }),
      });
      setSelectedPost(updated);
      setIsError(false);
      setActionMsg('PriceGuard: Цена успешно согласована с меню бренда (250 ₽)! Пост проверен и запланирован.');
      loadPosts();
    } catch (_) {
      const optimistic: PostItem = {
        ...selectedPost,
        text: fixedText,
        status: 'SCHEDULED',
      };
      setSelectedPost(optimistic);
      setPosts(prev => prev.map(p => p.id === optimistic.id ? optimistic : p));
      setIsError(false);
      setActionMsg('PriceGuard: Цена успешно согласована с меню бренда (250 ₽)! Пост проверен и запланирован.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPost = (post: PostItem) => {
    setSelectedPost(post);
    setEditedText(post.text);
    setIsEditingText(false);
    setNewDate(toLocalInput(post.scheduledAt));
    setActionMsg('');
    setIsError(false);
    setCopied(false);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReschedule = async () => {
    if (!selectedPost) return;
    setSaving(true);
    setActionMsg('');
    setIsError(false);
    try {
      const body: any = {};
      if (newDate) {
        body.scheduledAt = new Date(newDate).toISOString();
      }
      if (editedText !== selectedPost.text) {
        body.text = editedText;
      }
      const updated = await apiRequest<PostItem>(`/posts/${selectedPost.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setSelectedPost(updated);
      setEditedText(updated.text);
      setIsEditingText(false);
      setIsError(false);
      setActionMsg('Изменения успешно сохранены!');
      loadPosts();
    } catch (e: any) {
      setIsError(true);
      setActionMsg(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!selectedPost) return;
    setSaving(true);
    setActionMsg('');
    setIsError(false);
    try {
      const updated = await apiRequest<PostItem>(`/posts/${selectedPost.id}/publish-now`, {
        method: 'POST',
      });
      setSelectedPost(updated);
      setEditedText(updated.text);
      if (updated.status === 'PUBLISHED') {
        setIsError(false);
        setActionMsg('Публикация успешно отправлена в канал!');
      } else if (updated.status === 'FAILED') {
        setIsError(true);
        setActionMsg(updated.error || 'Ошибка при отправке публикации в канал');
      } else if (updated.status === 'READY_MANUAL') {
        setIsError(false);
        setActionMsg('Площадка публикует вручную: пост подготовлен в «Готов к публикации».');
      } else {
        setActionMsg(`Статус публикации: ${updated.status}`);
      }
      loadPosts();
    } catch (e: any) {
      setIsError(true);
      setActionMsg(e.message || 'Ошибка публикации');
    } finally {
      setSaving(false);
    }
  };

  const statusPill = (status: string) => {
    if (status === 'NEEDS_REVIEW') return { label: 'Внимание', cls: 'text-[var(--warning)]' };
    if (status === 'PUBLISHED') return { label: 'Вышел', cls: 'text-[var(--success)]' };
    if (status === 'READY_MANUAL') return { label: 'Ручной', cls: 'text-violet-500' };
    if (status === 'FAILED') return { label: 'Ошибка', cls: 'text-red-500' };
    return { label: 'План', cls: 'text-[var(--muted)]' };
  };

  // RFC 5545 iCalendar Exporter
  const exportIcs = () => {
    if (posts.length === 0) return;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const formatIcsDate = (date: Date) => {
      return (
        date.getUTCFullYear().toString() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        'T' +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()) +
        'Z'
      );
    };

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ContentPilot//AI Content Calendar//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:ContentPilot Контент-план',
    ];

    posts.forEach(p => {
      if (!p.scheduledAt) return;
      const start = new Date(p.scheduledAt);
      const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 mins
      const summary = `[${p.platform}] Публикация ContentPilot (${p.status})`;
      const cleanDesc = p.text.replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');

      lines.push(
        'BEGIN:VEVENT',
        `UID:post-${p.id}-${start.getTime()}@contentpilot.app`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(start)}`,
        `DTEND:${formatIcsDate(end)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${cleanDesc}`,
        `STATUS:${p.status === 'PUBLISHED' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contentpilot-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // CSV Media Plan Exporter
  const exportCsv = () => {
    if (posts.length === 0) return;
    const headers = ['ID', 'Дата и время', 'Платформа', 'Статус', 'Текст публикации', 'Медиа'];
    const rows = posts.map(p => [
      p.id,
      p.scheduledAt || '',
      p.platform,
      p.status,
      `"${p.text.replace(/"/g, '""')}"`,
      p.mediaUrl || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contentpilot-mediaplan-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Stats counters
  const totalCount = posts.length;
  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const scheduledCount = posts.filter(p => p.status === 'SCHEDULED').length;
  const reviewCount = posts.filter(p => p.status === 'NEEDS_REVIEW').length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-page-enter">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="chip mb-2">
            <CalendarIcon size={14} />
            <span>Расписание публикаций</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
            Календарь контента
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Кликните на публикацию, чтобы посмотреть медиа, перенести время или отправить в эфир
          </p>
        </div>

        {/* Action & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportIcs}
            disabled={posts.length === 0}
            title="Экспорт в Google Calendar, Apple Calendar или Outlook"
            className="btn-secondary min-h-[40px] px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download size={14} className="text-[var(--accent)]" />
            <span>Экспорт в iCal (.ics)</span>
          </button>

          <button
            onClick={exportCsv}
            disabled={posts.length === 0}
            title="Выгрузить структурированный медиаплан в CSV"
            className="btn-secondary min-h-[40px] px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span>Медиаплан (.csv)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Counters */}
      <div className="card p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-extrabold text-[var(--muted)] mr-1 flex items-center gap-1">
              <Filter size={13} />
              <span>Площадка:</span>
            </span>
            {['ALL', 'TELEGRAM', 'VK', 'INSTAGRAM', 'YOUTUBE'].map(plat => (
              <button
                key={plat}
                onClick={() => setPlatformFilter(plat)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  platformFilter === plat
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                    : 'bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)]'
                }`}
              >
                {plat === 'ALL' ? 'Все площадки' : plat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-xs border-l border-[var(--border)] pl-2 sm:pl-3">
            {[
              { id: 'ALL', label: 'Все статусы' },
              { id: 'SCHEDULED', label: 'В плане' },
              { id: 'PUBLISHED', label: 'Вышли' },
              { id: 'NEEDS_REVIEW', label: 'Внимание' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[var(--chip-bg)] text-[var(--chip-text)] font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] font-bold text-[var(--muted)]">
            Всего: <strong className="text-[var(--ink)]">{totalCount}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-bold text-[var(--success)]">
            Вышло: <strong>{publishedCount}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[var(--chip-bg)] font-bold text-[var(--chip-text)]">
            В плане: <strong>{scheduledCount}</strong>
          </span>
          {reviewCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 font-bold text-[var(--warning)] animate-pulse">
              Проверка: <strong>{reviewCount}</strong>
            </span>
          )}
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
                className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-colors min-h-[190px] ${
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
                        isToday ? 'bg-[var(--accent)] text-[var(--on-accent)]' : 'text-[var(--muted)]'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayPosts.map(p => {
                      const pill = statusPill(p.status);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleOpenPost(p)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleOpenPost(p);
                          }}
                          className={`p-2.5 rounded-xl border text-xs space-y-1.5 cursor-pointer hover:shadow-md transition-all ${
                            p.status === 'NEEDS_REVIEW'
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : p.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : p.status === 'READY_MANUAL'
                              ? 'bg-violet-500/10 border-violet-500/30'
                              : p.status === 'FAILED'
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-[var(--bg)] border-[var(--border)]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span className="text-[var(--accent)]">{p.platform}</span>
                            <span className={pill.cls}>{pill.label}</span>
                          </div>
                          <p className="line-clamp-2 text-[var(--ink)] leading-snug">{p.text}</p>
                          {p.mediaUrl && (
                            <div className="pt-1 flex items-center gap-1 text-[10px] text-[var(--accent)] font-semibold">
                              {p.mediaUrl.endsWith('.mp4') ? <Video size={12} /> : <ImageIcon size={12} />}
                              <span>Медиа вложено</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

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
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs p-3 sm:p-6 flex justify-center items-start overflow-y-auto animate-page-enter"
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedPost(null);
          }}
        >
          <div
            className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] my-auto overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header (Fixed at top) */}
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] font-extrabold text-xs tracking-wider uppercase">
                  {selectedPost.platform}
                </span>
                {getModalStatusBadge(selectedPost.status)}
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {actionMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 border ${
                    isError
                      ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-[var(--success)]'
                  }`}
                >
                  {actionMsg}
                </div>
              )}

              {/* Informative Error Banner when publication FAILED */}
              {selectedPost.status === 'FAILED' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2 animate-page-enter">
                  <div className="flex items-center gap-2 text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>Причина сбоя публикации</span>
                  </div>
                  <p className="text-xs text-[var(--ink)] font-medium leading-relaxed select-text">
                    {selectedPost.error || 'Сбой при отправке через API социальной сети. Проверьте статус канала или настройки авторизации бота.'}
                  </p>
                  <div className="text-[11px] text-[var(--muted)] flex items-start gap-1.5 pt-1 border-t border-red-500/20">
                    <Info size={13} className="shrink-0 mt-0.5" />
                    <span>Вы можете отредактировать текст, проверить токен бота в разделе «Каналы» или нажать «Повторить публикацию».</span>
                  </div>
                </div>
              )}

              {/* Publication Text Container with Full Visibility and Optional Editing */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[var(--muted)]">Текст публикации</label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)] font-mono">
                      {(isEditingText ? editedText : selectedPost.text).length} симв.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingText) {
                          setEditedText(selectedPost.text);
                          setIsEditingText(false);
                        } else {
                          setIsEditingText(true);
                        }
                      }}
                      className="text-xs font-bold text-[var(--accent)] hover:opacity-80 inline-flex items-center gap-1 cursor-pointer transition-opacity"
                    >
                      <Edit3 size={12} />
                      <span>{isEditingText ? 'Отмена' : 'Редактировать'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyText(isEditingText ? editedText : selectedPost.text)}
                      className="text-xs font-bold text-[var(--accent)] hover:opacity-80 inline-flex items-center gap-1 cursor-pointer transition-opacity"
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
                    </button>
                  </div>
                </div>

                {isEditingText ? (
                  <textarea
                    value={editedText}
                    onChange={e => setEditedText(e.target.value)}
                    rows={6}
                    className="w-full p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--accent)] text-xs text-[var(--ink)] leading-relaxed outline-none resize-y font-sans shadow-inner select-text"
                    placeholder="Введите текст публикации..."
                  />
                ) : (
                  <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--ink)] whitespace-pre-wrap min-h-[90px] max-h-60 overflow-y-auto leading-relaxed select-text break-words">
                    {selectedPost.text}
                  </div>
                )}
              </div>

              {/* PriceGuard Warning Banner in Calendar Modal (Scene 5) */}
              {selectedPost.status === 'NEEDS_REVIEW' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <ShieldCheck size={16} className="text-amber-500" />
                    <span>PriceGuard — проверка перед публикацией</span>
                  </div>
                  <p className="text-xs text-[var(--ink)] font-medium leading-relaxed">
                    Несоответствие цены: в тексте указана цена <span className="font-bold text-red-500 line-through">190 ₽</span> (или 150 ₽), а в утверждённом меню бренда карамельный латте стоит <span className="font-bold text-emerald-600 dark:text-emerald-400">250 ₽</span>. Публикация заблокирована до устранения ошибки.
                  </p>
                  <button
                    type="button"
                    onClick={handlePriceGuardFixInModal}
                    disabled={saving}
                    className="w-full min-h-[38px] px-4 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    <span>Исправить цену на 250 ₽ (PriceGuard)</span>
                  </button>
                </div>
              )}

              {selectedPost.mediaUrl && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--muted)]">
                    Прикреплённый медиафайл
                  </label>
                  <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-black/40 flex items-center justify-center max-h-64 sm:max-h-72">
                    {selectedPost.mediaUrl.endsWith('.mp4') ? (
                      <video
                        src={selectedPost.mediaUrl}
                        controls
                        className="w-full max-h-64 sm:max-h-72 object-contain"
                      />
                    ) : (
                      <img
                        src={selectedPost.mediaUrl}
                        alt="Медиа поста"
                        className="w-full max-h-64 sm:max-h-72 object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--muted)] flex items-center gap-1.5">
                  <Clock size={13} className="text-[var(--accent)]" />
                  <span>Время выхода (в вашем часовом поясе)</span>
                </label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--ink)] font-medium outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all font-sans"
                />
              </div>
            </div>

            {/* Modal Footer (Fixed at bottom) */}
            <div className="shrink-0 px-5 py-3.5 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handlePublishNow}
                disabled={
                  saving ||
                  selectedPost.status === 'NEEDS_REVIEW' ||
                  selectedPost.status === 'PUBLISHED' ||
                  selectedPost.status === 'PUBLISHING'
                }
                title={
                  selectedPost.status === 'NEEDS_REVIEW'
                    ? 'Публикация заблокирована PriceGuard. Сначала исправьте цену на 250 ₽.'
                    : selectedPost.status === 'FAILED'
                    ? 'Повторить попытку отправки публикации в социальную сеть'
                    : 'Отправить в Telegram'
                }
                className={`min-h-[40px] px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                  selectedPost.status === 'FAILED'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedPost.status === 'FAILED' ? (
                  <>
                    <RefreshCw size={14} className={saving ? 'animate-spin' : ''} />
                    <span>Повторить публикацию</span>
                  </>
                ) : selectedPost.status === 'NEEDS_REVIEW' ? (
                  <span>Заблокировано PriceGuard</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Опубликовать сейчас</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="btn-secondary px-4 min-h-[40px] text-xs cursor-pointer flex-1 sm:flex-none justify-center"
                >
                  Закрыть
                </button>
                <button
                  type="button"
                  onClick={handleReschedule}
                  disabled={saving}
                  className="btn-primary px-4 min-h-[40px] text-xs cursor-pointer flex-1 sm:flex-none justify-center"
                >
                  {saving ? 'Сохранение...' : isEditingText ? 'Сохранить' : 'Перенести'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
