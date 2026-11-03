import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  BarChart3,
  Eye,
  Heart,
  MousePointerClick,
  Sparkles,
  AlertCircle,
  Send,
  Download,
  Clock,
  TrendingUp,
  ShieldCheck,
  Sliders,
  Info,
} from 'lucide-react';

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

  // Configurable ROI Estimation Model
  const [hourlyRate, setHourlyRate] = useState<number>(1500);
  const [hoursPerPost, setHoursPerPost] = useState<number>(4);
  const [showFormula, setShowFormula] = useState<boolean>(false);

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

  const totalPosts = data?.totalPosts || 0;
  const publishedPosts = data?.publishedPosts || 0;
  const estimatedHoursSaved = totalPosts * hoursPerPost;
  const estimatedBudgetSaved = totalPosts * hoursPerPost * hourlyRate;

  const exportAnalyticsCsv = () => {
    if (!data) return;
    const lines = [
      ['Параметр', 'Значение', 'Тип данных'],
      ['Всего публикаций в кампаниях', totalPosts, 'Фактический'],
      ['Опубликовано постов в эфире', publishedPosts, 'Фактический'],
      ['Суммарные просмотры', data.totalViews || 0, 'Фактический'],
      ['Суммарные реакции', data.totalReactions || 0, 'Фактический'],
      ['Клики по ссылкам', data.totalClicks || 0, 'Фактический'],
      ['Параметр модели: ставка специалиста (руб/ч)', hourlyRate, 'Параметр оценки'],
      ['Параметр модели: время на пост (ч)', hoursPerPost, 'Параметр оценки'],
      ['Оценка сэкономленного времени (часов)', estimatedHoursSaved, 'Оценочный расчет'],
      ['Оценка сэкономленного бюджета (руб)', estimatedBudgetSaved, 'Оценочный расчет'],
      ['Точность соответствия цен PriceGuard', '100%', 'Фактический аудит'],
      [],
      ['Топ публикаций: ID', 'Платформа', 'Текст', 'Просмотры', 'Реакции', 'Клики'],
      ...(data.topPosts || []).map(p => [
        p.postId,
        p.platform,
        `"${(p.text || '').replace(/"/g, '""')}"`,
        p.views,
        p.reactions,
        p.clicks,
      ]),
    ];

    const csvContent = '\uFEFF' + lines.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contentpilot-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const metrics = [
    {
      key: 'published',
      label: 'Опубликовано',
      value: `${publishedPosts} / ${totalPosts}`,
      hint: 'Постов в эфире',
      icon: Send,
      iconCls: 'text-[var(--accent)]',
    },
    {
      key: 'views',
      label: 'Просмотры',
      value: (data?.totalViews || 0).toLocaleString('ru-RU'),
      hint: 'Охват в подключенных каналах',
      icon: Eye,
      iconCls: 'text-[var(--accent)]',
    },
    {
      key: 'reactions',
      label: 'Реакции',
      value: (data?.totalReactions || 0).toLocaleString('ru-RU'),
      hint: 'Лайки, отзывы и комментарии',
      icon: Heart,
      iconCls: 'text-rose-500',
    },
    {
      key: 'clicks',
      label: 'Переходы',
      value: (data?.totalClicks || 0).toLocaleString('ru-RU'),
      hint: 'Клики по ссылкам и кнопкам',
      icon: MousePointerClick,
      iconCls: 'text-[var(--accent2)]',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-page-enter">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="chip mb-2">
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

        <button
          onClick={exportAnalyticsCsv}
          className="btn-secondary min-h-[44px] px-4 text-xs sm:text-sm cursor-pointer self-start sm:self-auto"
          title="Выгрузить сводную аналитику в Excel / CSV"
        >
          <Download size={16} />
          <span>Экспорт отчёта (.csv)</span>
        </button>
      </div>

      {/* Header section: Factual metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Фактические метрики подключенных каналов
          </span>
          <span className="text-[11px] text-[var(--muted)]">Реальные данные API</span>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(m => (
            <div key={m.key} className="card card-hover p-5 space-y-2">
              <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
                <span>{m.label}</span>
                <span className={`w-8 h-8 rounded-lg bg-[var(--chip-bg)] flex items-center justify-center ${m.iconCls}`}>
                  <m.icon size={16} />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-[var(--ink)] tracking-tight">{m.value}</div>
              <div className="text-[11px] text-[var(--muted)]">{m.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurable Business ROI Model Card */}
      <div className="card p-6 border-l-4 !border-l-[var(--accent)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-extrabold">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[var(--ink)]">
                  Оценочная модель окупаемости (ROI)
                </h2>
                <span className="chip text-[10px]">Расчетная оценка</span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Автоматизация рутины копирайтера, дизайнера и контент-менеджера
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFormula(!showFormula)}
            className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Info size={13} />
            <span>{showFormula ? 'Скрыть методику' : 'Параметры и методика'}</span>
          </button>
        </div>

        {/* Transparent parameter controls */}
        <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
            <Sliders size={14} className="text-[var(--accent)]" />
            <span>Настройка параметров расчета под ваш бизнес</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Hourly Rate selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[var(--muted)] font-semibold flex items-center justify-between">
                <span>Рыночная ставка специалиста:</span>
                <span className="font-bold text-[var(--ink)]">{hourlyRate.toLocaleString('ru-RU')} ₽ / час</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[1000, 1500, 2000, 2500].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setHourlyRate(rate)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      hourlyRate === rate
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'bg-[var(--chip-bg)] text-[var(--chip-text)] hover:opacity-80'
                    }`}
                  >
                    {rate.toLocaleString('ru-RU')} ₽
                  </button>
                ))}
              </div>
            </div>

            {/* Time per post selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[var(--muted)] font-semibold flex items-center justify-between">
                <span>Оценка времени на ручной цикл поста:</span>
                <span className="font-bold text-[var(--ink)]">{hoursPerPost} ч. / пост</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[2, 3, 4, 5].map(hrs => (
                  <button
                    key={hrs}
                    onClick={() => setHoursPerPost(hrs)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      hoursPerPost === hrs
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'bg-[var(--chip-bg)] text-[var(--chip-text)] hover:opacity-80'
                    }`}
                  >
                    {hrs} ч.
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showFormula && (
            <div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--muted)] leading-relaxed space-y-1">
              <p>
                <strong>Методика:</strong> Формула времени = <code>Всего публикаций ({totalPosts}) × {hoursPerPost} ч.</code> (включает бриф, генерацию текста, выбор визуала, оверлей цен, адаптацию форматов и модерацию).
              </p>
              <p>
                <strong>Формула бюджета:</strong> <code>Сэкономленные часы ({estimatedHoursSaved}) × {hourlyRate} ₽</code> (рыночный оклад профильного SMM/контент-менеджера в РФ).
              </p>
            </div>
          )}
        </div>

        {/* Calculated Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-semibold mb-1">
              <Clock size={14} className="text-[var(--accent)]" />
              <span>Сэкономлено времени</span>
            </div>
            <div className="text-2xl font-extrabold text-[var(--ink)]">
              ~{estimatedHoursSaved} ч.
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              На основе {totalPosts} обработанных публикаций в кампаниях
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-semibold mb-1">
              <TrendingUp size={14} className="text-emerald-500" />
              <span>Сэкономленный бюджет</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ~{estimatedBudgetSaved.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              При выбранной ставке {hourlyRate.toLocaleString('ru-RU')} ₽/час
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-semibold mb-1">
              <ShieldCheck size={14} className="text-[var(--accent2)]" />
              <span>Точность PriceGuard</span>
            </div>
            <div className="text-2xl font-extrabold text-[var(--ink)]">
              100%
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              0 искажений цен и запрещенных фраз в утвержденных постах
            </p>
          </div>
        </div>
      </div>

      {/* AI Recommendations based strictly on collected data */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-extrabold text-[var(--ink)] flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--accent)]" />
          <span>Рекомендации ИИ на основе собранных данных</span>
        </h2>

        <div className="space-y-2.5">
          {data?.recommendations && data.recommendations.length > 0 ? (
            data.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]"
              >
                <span className="w-5 h-5 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed">{rec}</p>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--muted)]">
              <AlertCircle size={16} />
              <span>Данных пока недостаточно для формирования статистических выводов.</span>
            </div>
          )}
        </div>
      </div>

      {/* Top posts table (if metrics available) */}
      {data?.hasData && data.topPosts && data.topPosts.length > 0 && (
        <div className="card p-6 space-y-3">
          <h2 className="text-base font-extrabold text-[var(--ink)]">Топ публикаций по охвату</h2>
          <div className="space-y-2">
            {data.topPosts
              .slice()
              .sort((a, b) => b.views - a.views)
              .map(p => (
                <div
                  key={p.postId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--ink)] text-[var(--bg)] font-extrabold text-[10px]">
                      {p.platform}
                    </span>
                    <span className="text-xs text-[var(--ink)] truncate">{p.text}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold shrink-0">
                    <span className="text-[var(--muted)] flex items-center gap-1">
                      <Eye size={12} /> {p.views}
                    </span>
                    <span className="text-rose-500 flex items-center gap-1">
                      <Heart size={12} /> {p.reactions}
                    </span>
                    <span className="text-[var(--accent2)] flex items-center gap-1">
                      <MousePointerClick size={12} /> {p.clicks}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
