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
} from 'lucide-react';

interface GoalOption {
  id: string;
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

const GOALS: GoalOption[] = [
  { id: 'latte', title: 'Продвинуть новый продукт', icon: Sparkles },
  { id: 'weekend', title: 'Привлечь посетителей на выходных', icon: CalendarIcon },
  { id: 'promo', title: 'Рассказать об акции', icon: Send },
  { id: 'course', title: 'Набрать учеников на курс', icon: Users },
  { id: 'traffic', title: 'Увеличить переходы на товар', icon: LinkIcon },
];

export const CampaignGoalPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState('product');
  const [customGoalText, setCustomGoalText] = useState('Продвинуть специальное предложение');
  const durationDays = 7;
  const [generating, setGenerating] = useState(false);
  const [hasBrand, setHasBrand] = useState<boolean | null>(null);

  // Check if brand exists and adapt default goal dynamically
  useEffect(() => {
    async function checkBrand() {
      try {
        const brand = await apiRequest<any>('/brands/me');
        if (brand && brand.name) {
          setHasBrand(true);
          let firstItemName = '';
          if (brand.facts) {
            try {
              const factsObj = typeof brand.facts === 'string' ? JSON.parse(brand.facts) : brand.facts;
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
  }, []);

  const handleCreateCampaign = async () => {
    if (!hasBrand) {
      if (window.confirm('Для генерации кампании сначала нужен профиль бренда. Перейти к заполнению?')) {
        navigate('/brand');
      }
      return;
    }

    setGenerating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await apiRequest<any>('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          goal: customGoalText,
          periodStart: today,
          periodEnd: endDate,
        }),
      });

      // Navigate to campaign details
      navigate(`/campaigns/${res.id}`);
    } catch (err: any) {
      alert(err.message || 'Ошибка генерации кампании');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Brand setup warning banner if brand not configured */}
      {hasBrand === false && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[var(--warning)]" size={20} />
            <span className="text-sm font-semibold text-[var(--ink)]">
              Профиль бренда еще не заполнен. Заполните его (или нажмите "Заполнить кофейню для демо"), чтобы ИИ сверял цены и меню.
            </span>
          </div>
          <button
            onClick={() => navigate('/brand')}
            className="min-h-[38px] px-4 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] font-bold text-xs shrink-0 cursor-pointer"
          >
            Заполнить бренд
          </button>
        </div>
      )}

      {/* Main Grid: Goal Chooser & Verification Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Card: Goal Selection */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Какую цель решаем?</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)]">
              Шаг 1 из 2
            </span>
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
                    if (goal.id === 'latte') {
                      setCustomGoalText('Продвинуть сезонный латте Тыква-Пряности');
                    } else {
                      setCustomGoalText(goal.title);
                    }
                  }}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-2 border-[var(--accent)] bg-[var(--chip-bg)] text-[var(--chip-text)] shadow-sm'
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
              placeholder="Например: Продвинуть сезонный латте Тыква-Пряности"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="font-semibold">Срок: {durationDays} дней</span>
            <span>·</span>
            <span>Аудитория: Студенты, фрилансеры 20-35 лет</span>
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={generating}
            className="w-full min-h-[48px] rounded-xl bg-[var(--accent)] text-[var(--on-accent)] font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
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

        {/* Right Card: Factcheck & Verification Rules Preview */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Проверка перед публикацией</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)] font-medium">Режим:</span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--chip-bg)] text-[var(--chip-text)] text-xs font-extrabold">
                Полуавтомат
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--muted)] leading-relaxed">
            ContentPilot автоматически верифицирует каждую сгенерированную публикацию по 3 критериям перед отправкой в Telegram:
          </p>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-[var(--success)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">Факты и правила бренда</span>
              </div>
              <span className="text-xs font-extrabold text-[var(--success)]">Пройдено</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-[var(--success)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">Формат площадок</span>
              </div>
              <span className="text-xs font-extrabold text-[var(--success)]">Пройдено</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/5">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-[var(--warning)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">Сверка цен с меню бренда</span>
              </div>
              <span className="text-xs font-extrabold text-[var(--warning)]">Требует проверки</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">Готовы протестировать демо-сценарий?</span>
            <button
              onClick={() => navigate('/brand')}
              className="text-xs font-bold text-[var(--accent)] hover:underline cursor-pointer"
            >
              Настроить факты бренда →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
