import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { BarChart3, Eye, Heart, MousePointerClick, Sparkles, AlertCircle } from 'lucide-react';

interface AnalyticsData {
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalReactions: number;
  totalClicks: number;
  hasData: boolean;
  summaryMessage: string;
  recommendations: string[];
  topPosts: Array<{
    postId: number;
    platform: string;
    text: string;
    views: number;
    reactions: number;
    clicks: number;
  }>;
}

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await apiRequest<AnalyticsData>('/analytics/overview');
        setData(res);
      } catch (e: any) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-[var(--muted)]">
        Загрузка аналитики...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] text-xs font-bold mb-2">
          <BarChart3 size={14} />
          <span>Измерения и инсайты</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
          Аналитика и рекомендации
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          {data?.summaryMessage || 'Сбор реальных метрик из подключенных площадок'}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
            <span>Опубликовано</span>
            <span className="w-8 h-8 rounded-lg bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-extrabold">
              #
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[var(--ink)]">
            {data?.publishedPosts || 0}{' '}
            <span className="text-xs font-normal text-[var(--muted)]">/ {data?.totalPosts || 0}</span>
          </div>
          <div className="text-[11px] text-[var(--muted)]">Постов в эфире</div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
            <span>Просмотры</span>
            <Eye size={16} className="text-[var(--accent)]" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--ink)]">
            {data?.totalViews ? data.totalViews.toLocaleString('ru-RU') : '0'}
          </div>
          <div className="text-[11px] text-[var(--muted)]">Охват в Telegram и соцсетях</div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
            <span>Реакции</span>
            <Heart size={16} className="text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--ink)]">
            {data?.totalReactions ? data.totalReactions.toLocaleString('ru-RU') : '0'}
          </div>
          <div className="text-[11px] text-[var(--muted)]">Лайки, огоньки и комментарии</div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
            <span>Переходы</span>
            <MousePointerClick size={16} className="text-[var(--accent2)]" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--ink)]">
            {data?.totalClicks ? data.totalClicks.toLocaleString('ru-RU') : '0'}
          </div>
          <div className="text-[11px] text-[var(--muted)]">Клики по ссылкам и кнопкам</div>
        </div>
      </div>

      {/* AI Recommendations based strictly on collected data */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--accent)]" />
          <span>Рекомендации ИИ на основе собранных данных</span>
        </h2>

        <div className="space-y-2.5">
          {data?.recommendations && data.recommendations.length > 0 ? (
            data.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">{rec}</p>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--muted)] flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Данных пока недостаточно для формирования статистических выводов.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
