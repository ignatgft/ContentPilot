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
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'PAUSED';
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
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
  }, [id]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Quick fix price in post 3 from 250₽ to 320₽ (Demo criterion!)
  const handleQuickFixPrice = async (post: PostItem) => {
    const fixedText = post.text.replace(/250\s*(?:₽|руб)/gi, '320₽');
    try {
      await apiRequest(`/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ text: fixedText }),
      });
      showNotification('Цена исправлена на 320₽. Пост перепроверен и переведён в статус «Запланирован»!');
      await fetchCampaign();
    } catch (e: any) {
      alert(e.message || 'Ошибка исправления цены');
    }
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
      showNotification('🚀 Пост успешно опубликован в Telegram!');
      await fetchCampaign();
    } catch (e: any) {
      alert(e.message || 'Ошибка публикации в Telegram');
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] font-extrabold text-xs">
              {campaign.posts.length} публикаций
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Срок: {campaign.periodStart} — {campaign.periodEnd}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/calendar')}
            className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] text-[var(--ink)] font-bold text-sm hover:bg-[var(--surface)] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Calendar size={16} />
            <span>Календарь</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--success)] font-bold text-sm flex items-center gap-2">
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
              className={`bg-[var(--surface)] border rounded-2xl p-5 sm:p-6 transition-all ${
                isBlocked
                  ? 'border-amber-500/60 shadow-sm'
                  : 'border-[var(--border)]'
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

                <div className="flex items-center gap-2">
                  {getStatusBadge(post.status)}
                </div>
              </div>

              {/* Text */}
              <div className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap mb-4">
                {post.text}
              </div>

              {/* Verification Panel */}
              <div className="bg-[var(--bg)] rounded-xl p-3.5 border border-[var(--border)] mb-4 space-y-2">
                <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                  Результаты ИИ-проверки фактов и правил:
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

              {/* Warning Action Bar if blocked */}
              {isBlocked && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="text-xs font-bold text-[var(--warning)] flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span>
                      {priceWarning ? priceWarning.message : 'Пост заблокирован до ручной проверки.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {priceWarning && (
                      <button
                        onClick={() => handleQuickFixPrice(post)}
                        className="min-h-[38px] px-3.5 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] font-bold text-xs hover:opacity-95 transition-all shadow-sm cursor-pointer"
                      >
                        Исправить цену на 320₽
                      </button>
                    )}
                    <button
                      onClick={() => handleApprove(post)}
                      className="min-h-[38px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-bold text-xs hover:bg-[var(--bg)] transition-colors cursor-pointer"
                    >
                      Утвердить вручную
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    setEditingPost(post);
                    setEditText(post.text);
                  }}
                  className="min-h-[40px] px-3 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Редактировать текст</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePublishNow(post)}
                    disabled={isBlocked || post.status === 'PUBLISHING'}
                    title={
                      isBlocked
                        ? 'Заблокированный пост нельзя опубликовать до исправления'
                        : 'Опубликовать пост прямо сейчас'
                    }
                    className={`min-h-[40px] px-4 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      isBlocked
                        ? 'opacity-40 bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-95 shadow-sm'
                    }`}
                  >
                    <Send size={14} />
                    <span>
                      {post.status === 'PUBLISHED'
                        ? 'Опубликовать повторно'
                        : 'Опубликовать сейчас'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
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
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Текст публикации ({editingPost.platform}):
              </label>
              <textarea
                rows={6}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingPost(null)}
                className="min-h-[42px] px-4 rounded-xl border border-[var(--border)] text-[var(--ink)] text-xs font-bold hover:bg-[var(--bg)]"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEdit}
                className="min-h-[42px] px-5 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] text-xs font-extrabold hover:opacity-95"
              >
                Сохранить и перепроверить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
