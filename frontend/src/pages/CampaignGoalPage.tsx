import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar as CalendarIcon,
  Send,
  Users,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Layers,
  Clock,
} from 'lucide-react';

interface GoalOption {
  id: string;
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

const GOALS: GoalOption[] = [
  { id: 'product', title: 'Продвинуть продукт или услугу', icon: Sparkles },
  { id: 'weekend', title: 'Привлечь посетителей на выходных', icon: CalendarIcon },
  { id: 'promo', title: 'Рассказать об акции', icon: Send },
  { id: 'course', title: 'Набрать учеников на курс', icon: Users },
  { id: 'traffic', title: 'Увеличить переходы на товар', icon: LinkIcon },
];

const VERIFICATION_STEPS = [
  {
    title: 'Факты и правила бренда',
    text: 'Тон, описание и данные бренда учитываются при генерации.',
  },
  {
    title: 'Формат площадок',
    text: 'Лимиты символов, хэштеги и структура — под требования каждой платформы.',
  },
  {
    title: 'Сверка цен с меню бренда',
    text: 'Цена в тексте сопоставляется с реальным меню; при расхождении пост блокируется.',
  },
];

export const CampaignGoalPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState('product');
  const [customGoalText, setCustomGoalText] = useState('');
  const durationDays = 7;
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(1);
  const [hasBrand, setHasBrand] = useState<boolean | null>(null);
  const [brandAudience, setBrandAudience] = useState<string>('');
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const loadCampaigns = async () => {
    try {
      const data = await apiRequest<any[]>('/campaigns');
      setCampaigns(data || []);
    } catch (_) {}
  };

  // Check if brand exists and adapt default goal dynamically
  useEffect(() => {
    async function checkBrand() {
      try {
        const brand = await apiRequest<any>('/brands/me');
        if (brand && brand.name) {
          setHasBrand(true);
          setBrandAudience(typeof brand.audience === 'string' ? brand.audience : '');
          let firstItemName = '';
          if (brand.facts) {
            try {
              const factsObj =
                typeof brand.facts === 'string' ? JSON.parse(brand.facts) : brand.facts;
              if (factsObj.menu && Array.isArray(factsObj.menu) && factsObj.menu.length > 0) {
                firstItemName = factsObj.menu[0].name;
              }
            } catch (ignored) {}
          }
          if (firstItemName) {
            setCustomGoalText(`Продвинуть ${firstItemName}`);
          } else {
            setCustomGoalText(`Привлечь новых клиентов в ${brand.name}`);
          }
        } else {
          setHasBrand(false);
        }
      } catch (e) {
        setHasBrand(false);
      }
    }
    checkBrand();
    loadCampaigns();
  }, []);

  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(null);

  const finishAndNavigate = () => {
    if (createdCampaignId) {
      navigate(`/campaigns/${createdCampaignId}`);
    } else {
      navigate('/campaigns/1');
    }
  };

  const handleCreateCampaign = async () => {
    if (!hasBrand) {
      if (window.confirm('Для генерации кампании сначала нужен профиль бренда. Перейти к заполнению?')) {
        navigate('/brand');
      }
      return;
    }

    setGenerating(true);
    setGenStep(1);

    // Frame 1: Тексты (0 - 2.2s)
    // Frame 2: Фото (2.2s - 4.5s)
    // Frame 3: Видео (4.5s - 7.0s)
    setTimeout(() => setGenStep(2), 2200);
    setTimeout(() => setGenStep(3), 4500);

    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = await apiRequest<any>('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          goal: customGoalText,
          periodStart: today,
          periodEnd: endDate,
        }),
      });

      if (res && res.id) {
        setCreatedCampaignId(res.id);
      }

      setTimeout(() => {
        navigate(`/campaigns/${res?.id || 1}`);
      }, 7200);
    } catch (err: any) {
      console.warn('Backend campaign generate fallback:', err);
      setCreatedCampaignId(1);
      setTimeout(() => {
        navigate('/campaigns/1');
      }, 7200);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-page-enter">
      {/* Brand setup warning banner if brand not configured */}
      {hasBrand === false && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[var(--warning)] shrink-0" size={20} />
            <span className="text-sm font-semibold text-[var(--ink)]">
              Профиль бренда ещё не заполнен. ИИ нуждается в фактах бренда для генерации и сверки цен.
            </span>
          </div>
          <button
            onClick={() => navigate('/brand')}
            className="btn-primary min-h-[38px] px-4 text-xs shrink-0 cursor-pointer"
          >
            Заполнить бренд
          </button>
        </div>
      )}

      {/* Main Grid: Goal Chooser & Verification Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Card: Goal Selection */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Какую цель решаем?</h2>
            <span className="chip">Шаг 1 из 2</span>
          </div>

          <div className="space-y-2.5">
            {GOALS.map(goal => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.id;
              return (
                <div
                  key={goal.id}
                  onClick={() => {
                    setSelectedGoal(goal.id);
                    setCustomGoalText(goal.title);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedGoal(goal.id);
                      setCustomGoalText(goal.title);
                    }
                  }}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl transition-all cursor-pointer select-none focus:outline-none ${
                    isSelected
                      ? 'border-2 border-[var(--accent)] bg-[var(--chip-bg)] text-[var(--chip-text)]'
                      : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--bg)]'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                        : 'bg-[var(--chip-bg)] text-[var(--chip-text)]'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="font-bold text-sm">{goal.title}</div>
                </div>
              );
            })}
          </div>

          {/* Goal specifics input */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">
              Уточнение цели для ИИ:
            </label>
            <input
              type="text"
              value={customGoalText}
              onChange={e => setCustomGoalText(e.target.value)}
              placeholder="Например: продвинуть новый сезонный продукт"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="font-semibold">Срок кампании: {durationDays} дней</span>
            {brandAudience && (
              <>
                <span>·</span>
                <span>Аудитория: {brandAudience}</span>
              </>
            )}
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={generating || !customGoalText.trim()}
            className="btn-primary w-full min-h-[48px] text-sm cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>ИИ строит стратегию и публикации...</span>
              </>
            ) : (
              <>
                <span>Создать кампанию</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Right Card: How verification works */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Проверка перед публикацией</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)] font-medium">Режим:</span>
              <span className="chip">Полуавтомат</span>
            </div>
          </div>

          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Каждая публикация проходит верификацию перед тем, как попасть на канал. В зависимости от
            результатов пост публикуется автоматически или отправляется вам на утверждение:
          </p>

          <div className="space-y-3.5">
            {VERIFICATION_STEPS.map(step => (
              <div
                key={step.title}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]"
              >
                <ShieldCheck size={18} className="text-[var(--success)] shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[var(--ink)]">{step.title}</div>
                  <div className="text-xs text-[var(--muted)] leading-relaxed">{step.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
            <CheckCircle2 size={16} className="text-[var(--success)] shrink-0" />
            <span className="text-xs text-[var(--muted)] leading-relaxed">
              Проверенные посты выходят по расписанию автоматически, спорные — требуют одного клика
              утверждения.
            </span>
          </div>
        </div>
      </div>

      {/* Campaigns History Section */}
      {campaigns.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-extrabold text-[var(--ink)]">Ваши маркетинговые кампании</h2>
            </div>
            <span className="chip">{campaigns.length} кампаний</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/campaigns/${c.id}`)}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[var(--muted)] flex items-center gap-1">
                      <Clock size={12} />
                      {c.periodStart} — {c.periodEnd}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[var(--chip-bg)] text-[var(--chip-text)]">
                      {c.status || 'ACTIVE'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                    {c.goal}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] text-xs">
                  <span className="text-[var(--muted)] font-semibold">
                    {c.posts ? `${c.posts.length} публикаций` : 'Кампания создана'}
                  </span>
                  <span className="text-[var(--accent)] font-bold inline-flex items-center gap-1">
                    <span>Открыть</span>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic 3-Cadre Generation Sequence (Scene 4: Тексты, Фото, Видео) */}
      {generating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-[var(--accent)]/50 animate-page-enter">
            {/* Header: Exact Scene 4 voiceover & on-screen title */}
            <div className="space-y-1.5 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--accent)] font-extrabold text-xs">
                <Sparkles size={14} className="animate-spin" />
                <span>Создание контента · 16–23 с</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight">
                Тексты. Фото. Видео.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] font-medium">
                «Тексты, рекламные визуалы и сценарии видео — в стиле твоего бренда»
              </p>
            </div>

            {/* Segmented Story Progress Bar (3 frames) */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { step: 1, label: '1. Тексты' },
                { step: 2, label: '2. Фото (250 ₽)' },
                { step: 3, label: '3. Видео (9:16)' },
              ].map(item => (
                <div key={item.step} className="space-y-1">
                  <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        genStep >= item.step
                          ? 'w-full bg-[var(--accent)] shadow-sm'
                          : 'w-0'
                      }`}
                    />
                  </div>
                  <div className={`text-[11px] font-bold text-center ${genStep === item.step ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Frame Viewport */}
            <div className="min-h-[260px] sm:min-h-[300px] flex items-center justify-center">
              {genStep === 1 && (
                /* Cadre 1: Тексты */
                <div className="w-full p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)] space-y-3 animate-page-enter shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[var(--ink)] text-[var(--bg)] font-extrabold text-[11px]">
                        TELEGRAM & VK
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-extrabold text-[10px]">
                        Mokka Coffee Tone
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Адаптировано под лимиты
                    </span>
                  </div>
                  <p className="text-sm text-[var(--ink)] leading-relaxed">
                    Осенние выходные созданы для уюта и неспешных встреч. Специально для этих дней мы приготовили наш сезонный карамельный латте за <strong className="text-[var(--accent)] font-extrabold px-1.5 py-0.5 rounded bg-[var(--accent)]/10">250 ₽</strong>: два шота спешелти эспрессо, бархатистое молоко и домашняя тягучая карамель. Заглядывайте согреться или берите с собой на прогулку!
                  </p>
                  <div className="text-xs text-[var(--accent)] font-bold">
                    #mokka_coffee #кофейня #карамельныйлатте #выходные
                  </div>
                </div>
              )}

              {genStep === 2 && (
                /* Cadre 2: Рекламная фотография латте с аккуратной ценой */
                <div className="w-full flex flex-col items-center gap-2 animate-page-enter">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--accent)] shadow-2xl w-[240px] sm:w-[260px] aspect-square bg-neutral-900">
                    <img
                      src="/uploads/creative/mokka-caramel-latte.png"
                      alt="Карамельный латте 250 ₽"
                      className="w-full h-full object-cover transform scale-102 transition-transform duration-700"
                    />
                    <div className="absolute top-3 right-3 px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white font-black text-sm tracking-wide shadow-lg">
                      250 ₽
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold text-center">
                      Java2D · Фирменный оверлей цены 250 ₽
                    </div>
                  </div>
                </div>
              )}

              {genStep >= 3 && (
                /* Cadre 3: Вертикальный видеоролик с движением камеры */
                <div className="w-full flex flex-col items-center gap-2 animate-page-enter">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--accent)] shadow-2xl w-[180px] aspect-[9/16] bg-black">
                    <video
                      src="/uploads/creative/mokka-latte-reels.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-[9px] uppercase tracking-wider shadow">
                      Instagram Reels 9:16
                    </div>
                    <div className="absolute bottom-2.5 left-2 right-2 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold text-center">
                      FFmpeg · Динамичный Ken Burns Zoom
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] font-medium">
                {genStep === 1 ? 'Генерация текстов...' : genStep === 2 ? 'Рендеринг визуалов с ценой...' : 'Готово к переходу в кампанию'}
              </span>
              <button
                onClick={finishAndNavigate}
                className="btn-primary min-h-[40px] px-4 text-xs font-bold cursor-pointer"
              >
                <span>Перейти к проверке (Сцена 5)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
