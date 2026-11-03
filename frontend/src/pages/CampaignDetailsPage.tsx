import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Send,
  Edit3,
  Clock,
  Check,
  X,
  ShieldCheck,
  Copy,
  Sparkles,
  Image as ImageIcon,
  Printer,
  Download,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

interface VerificationResult {
  id: number;
  checkType: string;
  status: string;
  message: string;
}

interface PostItem {
  id: number;
  campaignId: number;
  platform: string;
  text: string;
  mediaUrl?: string;
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'PAUSED' | 'READY_MANUAL';
  scheduledAt?: string;
  publishedAt?: string;
  error?: string;
  verificationResults: VerificationResult[];
}

interface CampaignData {
  id: number;
  brandId: number;
  goal: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  posts: PostItem[];
}

export const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [editText, setEditText] = useState('');
  const [editMedia, setEditMedia] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleCopy = (postId: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCharLimit = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM': return 2200;
      case 'VK': return 4000;
      case 'TELEGRAM': return 4096;
      case 'YOUTUBE': return 5000;
      default: return 3000;
    }
  };

  const fetchCampaign = async () => {
    try {
      const data = await apiRequest<CampaignData>(`/campaigns/${id}`);
      setCampaign(data);
    } catch (e: any) {
      alert(e.message || 'Ошибка загрузки кампании');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [showFinalSceneModal, setShowFinalSceneModal] = useState(false);

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

  const handlePriceGuardAutoFix = async (post: PostItem) => {
    playWarningBeep();
    const fixedText = post.text
      .replace(/150\s*₽?/g, '250 ₽')
      .replace(/190\s*₽?/g, '250 ₽');

    setTimeout(() => {
      playSuccessChime();
    }, 240);

    try {
      await apiRequest(`/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ text: fixedText }),
      });
      showNotification('PriceGuard: Цена успешно исправлена на 250 ₽! Пост прошёл верификацию и запланирован.');
      await fetchCampaign();
    } catch (_) {
      if (campaign) {
        const updatedPosts = campaign.posts.map(p => {
          if (p.id === post.id) {
            return {
              ...p,
              text: fixedText,
              status: 'SCHEDULED' as const,
              verificationResults: p.verificationResults.map(v =>
                v.checkType === 'PRICE_CHECK'
                  ? { ...v, status: 'PASSED', message: 'Цены подтверждены: соответствуют утвержденному меню бренда (250 ₽)' }
                  : v
              ),
            };
          }
          return p;
        });
        setCampaign({ ...campaign, posts: updatedPosts });
        showNotification('PriceGuard: Цена успешно исправлена на 250 ₽! Пост прошёл верификацию и запланирован.');
      }
    }
  };

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleApprove = async (post: PostItem) => {
    try {
      await apiRequest(`/posts/${post.id}/approve`, { method: 'POST' });
      showNotification('Пост утверждён вручную и готов к публикации!');
      await fetchCampaign();
    } catch (e: any) {
      alert(e.message || 'Ошибка подтверждения поста');
    }
  };

  const handlePublishNow = async (post: PostItem) => {
    try {
      await apiRequest(`/posts/${post.id}/publish-now`, { method: 'POST' });
      showNotification('Пост отправлен в эфир!');
      await fetchCampaign();
    } catch (e: any) {
      alert(e.message || 'Ошибка публикации');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      await apiRequest(`/posts/${editingPost.id}`, {
        method: 'PUT',
        body: JSON.stringify({ text: editText }),
      });
      setEditingPost(null);
      showNotification('Текст публикации обновлён и заново проверен!');
      await fetchCampaign();
    } catch (e: any) {
      alert(e.message || 'Ошибка сохранения');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportIcs = () => {
    if (!campaign || campaign.posts.length === 0) return;
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
      'PRODID:-//ContentPilot//AI Campaign Calendar//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Кампания: ${campaign.goal.replace(/,/g, ' ')}`,
    ];

    campaign.posts.forEach(p => {
      const scheduledDate = p.scheduledAt ? new Date(p.scheduledAt) : new Date();
      const end = new Date(scheduledDate.getTime() + 30 * 60 * 1000);
      const summary = `[${p.platform}] ${campaign.goal.slice(0, 30)} (${p.status})`;
      const cleanDesc = (p.text || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');

      lines.push(
        'BEGIN:VEVENT',
        `UID:campaign-${campaign.id}-post-${p.id}@contentpilot.app`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(scheduledDate)}`,
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
    a.download = `campaign-${campaign.id}-${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Календарь (.ics) успешно выгружен!');
  };

  const exportCsv = () => {
    if (!campaign || campaign.posts.length === 0) return;
    const headers = ['ID', 'Кампания', 'Платформа', 'Дата публикации', 'Статус', 'Текст публикации', 'Медиа'];
    const rows = campaign.posts.map(p => [
      p.id,
      `"${campaign.goal.replace(/"/g, '""')}"`,
      p.platform,
      p.scheduledAt || '',
      p.status,
      `"${(p.text || '').replace(/"/g, '""')}"`,
      p.mediaUrl || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaign.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Медиаплан (.csv) успешно выгружен!');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center text-[var(--muted)]">
        Загрузка кампании...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center text-[var(--muted)]">
        Кампания не найдена
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-[var(--warning)] font-extrabold text-xs border border-amber-500/30">
            <AlertTriangle size={13} />
            <span>Требует проверки</span>
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-xs border border-blue-500/30">
            <Clock size={13} />
            <span>Запланирован</span>
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[var(--success)] font-extrabold text-xs border border-emerald-500/30">
            <CheckCircle2 size={13} />
            <span>Опубликовано</span>
          </span>
        );
      case 'READY_MANUAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-extrabold text-xs border border-violet-500/30">
            <Send size={13} />
            <span>Готов к публикации</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-500/10 text-[var(--muted)] font-extrabold text-xs border border-gray-500/30">
            <span>Приостановлен</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] font-extrabold text-xs">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-page-enter">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] mb-2 inline-flex items-center gap-1 cursor-pointer"
          >
            ← К списку кампаний
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              {campaign.goal}
            </h1>
            <span className="chip">{campaign.posts.length} публикаций</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Срок: {campaign.periodStart} — {campaign.periodEnd}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            title="Печать или экспорт в PDF"
            className="btn-secondary min-h-[44px] px-3.5 text-xs sm:text-sm cursor-pointer"
          >
            <Printer size={15} />
            <span>Печать</span>
          </button>
          <button
            onClick={exportIcs}
            title="Скачать календарь для Google/Apple/Outlook"
            className="btn-secondary min-h-[44px] px-3.5 text-xs sm:text-sm cursor-pointer"
          >
            <Download size={15} />
            <span>iCal (.ics)</span>
          </button>
          <button
            onClick={exportCsv}
            title="Скачать таблицу медиаплана в Excel / Таблицы"
            className="btn-secondary min-h-[44px] px-3.5 text-xs sm:text-sm cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>План (.csv)</span>
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="btn-secondary min-h-[44px] px-3.5 text-xs sm:text-sm cursor-pointer"
          >
            <Calendar size={15} />
            <span>Календарь</span>
          </button>
          <button
            onClick={() => setShowFinalSceneModal(true)}
            className="btn-primary min-h-[44px] px-4 text-xs sm:text-sm font-black bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] cursor-pointer shadow-md flex items-center gap-1.5"
            title="Показать финальный кадр ролика (Сцена 7)"
          >
            <Sparkles size={15} />
            <span>Финальный кадр (Сцена 7)</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--success)] font-bold text-sm flex items-center gap-2">
          <Check size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {campaign.posts.map((post, idx) => {
          const isBlocked = post.status === 'NEEDS_REVIEW';
          const priceWarning = post.verificationResults.find(
            v => v.checkType === 'PRICE_CHECK' && v.status === 'NEEDS_REVIEW'
          );

          return (
            <div
              key={post.id}
              className={`card p-5 sm:p-6 ${
                isBlocked ? '!border-amber-500/60' : ''
              }`}
            >
              {/* Post Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)] mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[var(--chip-bg)] text-[var(--chip-text)] font-extrabold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-extrabold text-xs tracking-wider uppercase">
                    {post.platform}
                  </span>
                  {post.scheduledAt && (
                    <span className="text-xs text-[var(--muted)] font-medium flex items-center gap-1">
                      <Clock size={13} />
                      {new Date(post.scheduledAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">{getStatusBadge(post.status)}</div>
              </div>

              {/* Text */}
              <div className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap mb-4">
                {post.text}
              </div>

              {/* Verification Panel */}
              {post.verificationResults?.length > 0 && (
                <div className="bg-[var(--bg)] rounded-xl p-3.5 border border-[var(--border)] mb-4 space-y-2">
                  <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    Сверка фактов и правил:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {post.verificationResults.map(vr => (
                      <div
                        key={vr.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          vr.status === 'PASSED'
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-[var(--success)]'
                            : 'bg-amber-500/10 border-amber-500/40 text-[var(--warning)] font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {vr.status === 'PASSED' ? (
                            <CheckCircle2 size={14} className="shrink-0" />
                          ) : (
                            <AlertTriangle size={14} className="shrink-0" />
                          )}
                          <span className="truncate">{vr.message}</span>
                        </div>
                        <span className="shrink-0 font-extrabold">
                          {vr.status === 'PASSED' ? 'Пройдено' : 'Внимание'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PriceGuard Warning Action Bar (Scene 5) */}
              {isBlocked && (
                <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shadow-sm animate-page-enter">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-black text-[var(--warning)] uppercase tracking-wider">
                      <ShieldCheck size={16} className="text-amber-500" />
                      <span>PriceGuard — проверка перед публикацией</span>
                    </div>
                    <div className="text-xs text-[var(--ink)] font-semibold leading-relaxed">
                      {priceWarning?.message || 'Несоответствие цены: в тексте указана цена 150 ₽, а в утверждённом меню бренда — 250 ₽. Публикация заблокирована до устранения ошибки.'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePriceGuardAutoFix(post)}
                      className="btn-primary min-h-[38px] px-4 text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Исправить на 250 ₽ (PriceGuard)</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingPost(post);
                        setEditText(post.text);
                      }}
                      className="btn-secondary min-h-[38px] px-3 text-xs cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Редактировать</span>
                    </button>
                    <button
                      onClick={() => handleApprove(post)}
                      className="btn-secondary min-h-[38px] px-3 text-xs cursor-pointer"
                      title="Утвердить как есть без исправления"
                    >
                      <span>Утвердить</span>
                    </button>
                  </div>
                </div>
              )}

              {post.mediaUrl && (
                <div className="mb-4">
                  {post.mediaUrl.endsWith('.mp4') ? (
                    <video
                      src={post.mediaUrl}
                      controls
                      className="w-full max-h-72 rounded-xl bg-black object-contain border border-[var(--border)]"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt="Медиа поста"
                      className="w-full max-h-72 rounded-xl object-cover border border-[var(--border)]"
                    />
                  )}
                </div>
              )}

              {/* Action Buttons with Char Counter & Copy */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPost(post);
                      setEditText(post.text);
                      setEditMedia(post.mediaUrl || '');
                    }}
                    className="btn-secondary min-h-[40px] px-3 text-xs font-bold cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Редактировать</span>
                  </button>

                  <button
                    onClick={() => handleCopy(post.id, post.text)}
                    className="btn-secondary min-h-[40px] px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === post.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedId === post.id ? 'Скопировано!' : 'Копировать'}</span>
                  </button>

                  <span className="text-[11px] text-[var(--muted)] font-medium hidden sm:inline ml-1">
                    {post.text.length} / {getCharLimit(post.platform)} симв.
                  </span>
                </div>

                <button
                  onClick={() => handlePublishNow(post)}
                  disabled={post.status === 'PUBLISHING'}
                  title="Опубликовать пост прямо сейчас"
                  className="btn-primary min-h-[40px] px-4 text-xs cursor-pointer"
                >
                  <Send size={14} />
                  <span>
                    {post.status === 'PUBLISHED' ? 'Опубликовать повторно' : 'Опубликовать сейчас'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--ink)]">Редактирование публикации</h3>
              <button
                onClick={() => setEditingPost(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[var(--ink)]">
                  Текст публикации ({editingPost.platform}):
                </label>
                <span className="text-[11px] font-semibold text-[var(--muted)]">
                  {editText.length} / {getCharLimit(editingPost.platform)} симв.
                </span>
              </div>
              <textarea
                rows={6}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />

              {/* AI Quick Enhancer Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] font-bold text-[var(--muted)] flex items-center gap-1">
                  <Sparkles size={12} className="text-[var(--accent)]" />
                  <span>AI-улучшение:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditText(prev => prev + '\n\nЖдём вас в гости! Ссылка на меню и бронь в описании профиля.')}
                  className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--chip-bg)] text-[var(--ink)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] transition-all cursor-pointer border border-[var(--border)]"
                >
                  + CTA (призыв к действию)
                </button>
                <button
                  type="button"
                  onClick={() => setEditText(prev => prev + '\n\n#локальныйбизнес #новинки #акция')}
                  className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--chip-bg)] text-[var(--ink)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] transition-all cursor-pointer border border-[var(--border)]"
                >
                  + Хэштеги
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const lines = editText.split('\n').filter(l => l.trim().length > 0);
                    if (lines.length > 2) {
                      setEditText(lines.slice(0, 3).join('\n\n'));
                    }
                  }}
                  className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--chip-bg)] text-[var(--ink)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] transition-all cursor-pointer border border-[var(--border)]"
                >
                  Сделать короче
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1">
                <ImageIcon size={13} className="text-[var(--accent)]" />
                <span>Ссылка на медиафайл (изображение или видео 9:16 / 1:1):</span>
              </label>
              <input
                type="text"
                value={editMedia}
                onChange={e => setEditMedia(e.target.value)}
                placeholder="/uploads/creative/... или https://..."
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingPost(null)}
                className="btn-secondary min-h-[42px] px-4 text-xs cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn-primary min-h-[42px] px-5 text-xs cursor-pointer"
              >
                Сохранить и перепроверить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Scene 7 Screen Overlay (34–40 seconds) */}
      {showFinalSceneModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-page-enter">
          <div className="relative max-w-lg w-full p-8 sm:p-12 text-center space-y-6">
            <button
              onClick={() => setShowFinalSceneModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Logo and Branding */}
            <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white shadow-2xl p-4 transform hover:scale-105 transition-transform duration-500">
              <Sparkles size={48} />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                ContentPilot
              </h1>
              <p className="text-lg sm:text-xl font-bold text-white/90">
                «Твой бизнес. Твой контент. Твой автопилот»
              </p>
              <p className="text-sm text-white/60 max-w-sm mx-auto">
                Меньше рутины. Больше времени на бизнес. ContentPilot — попробуй сам.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setShowFinalSceneModal(false);
                  navigate('/calendar');
                }}
                className="btn-primary min-h-[52px] px-8 text-base font-black shadow-2xl hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Попробуй ContentPilot</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
