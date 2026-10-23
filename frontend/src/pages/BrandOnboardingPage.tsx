import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Store, Sparkles, Check, Coffee, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BrandData {
  id?: number;
  name: string;
  description: string;
  audience: string;
  tone: string;
  facts: {
    menu: Array<{ name: string; price: number }>;
    schedule: string;
    address: string;
  };
  autonomyMode: string;
  samples: string[];
}

const DEMO_COFFEE_SHOP: BrandData = {
  name: 'Coffee Point',
  description: 'Уютная спешелти кофейня в центре города с авторскими напитками и свежей выпечкой.',
  audience: 'Студенты, фрилансеры, креативные специалисты и жители района 20–35 лет.',
  tone: 'Дружелюбный, теплый, заботливый, экспертный.',
  facts: {
    menu: [
      { name: 'Сезонный латте Тыква-Пряности', price: 320 },
      { name: 'Капучино классический 300мл', price: 250 },
      { name: 'Флэт уайт 200мл', price: 280 },
      { name: 'Миндальный круассан', price: 210 },
    ],
    schedule: 'Пн–Вс с 08:00 до 22:00',
    address: 'ул. Ленина, д. 42 (напротив парка)',
  },
  autonomyMode: 'SEMI_AUTO',
  samples: [
    'Осень создана для уютных встреч и согревающего кофе в Coffee Point!',
    'Свежая обжарка 100% арабика от локальных обжарщиков каждое утро.',
  ],
};

export const BrandOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<BrandData>(DEMO_COFFEE_SHOP);

  useEffect(() => {
    async function loadBrand() {
      try {
        const brand = await apiRequest<BrandData>('/brands/me');
        if (brand && brand.name) {
          setFormData({
            ...brand,
            facts: typeof brand.facts === 'object' && brand.facts !== null
              ? (brand.facts as any)
              : DEMO_COFFEE_SHOP.facts,
            samples: brand.samples || [],
          });
        }
      } catch (e) {
        // Not configured yet, defaults remain
      } finally {
        setFetching(false);
      }
    }
    loadBrand();
  }, []);

  const handleFillDemo = () => {
    setFormData(DEMO_COFFEE_SHOP);
    setSuccessMsg('Данные кофейни успешно подставлены для демо!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    try {
      await apiRequest('/brands', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setSuccessMsg('Профиль бренда успешно сохранен!');
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения бренда');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-[var(--muted)]">
        Загрузка профиля бренда...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Title & Quick Demo Fill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] text-xs font-bold mb-2">
            <Store size={14} />
            <span>Профиль бизнеса</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
            Бренд и факты
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            На основе этих данных ИИ строит контент-стратегию и проверяет цены публикаций
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillDemo}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--chip-bg)] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer select-none"
        >
          <Sparkles size={16} />
          <span>Заполнить кофейню для демо (3 мин)</span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--success)] font-bold text-sm flex items-center gap-2">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Details Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
            <Coffee size={20} className="text-[var(--accent)]" />
            <span>Основная информация</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Название заведения / бренда
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Coffee Point"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Тональность коммуникации (Tone of Voice)
              </label>
              <input
                type="text"
                value={formData.tone}
                onChange={e => setFormData({ ...formData, tone: e.target.value })}
                placeholder="Дружелюбный, экспертный, теплый"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">
              Описание бизнеса и позиционирование
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Спешелти кофейня с авторскими сезонными напитками..."
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">
              Целевая аудитория
            </label>
            <input
              type="text"
              value={formData.audience}
              onChange={e => setFormData({ ...formData, audience: e.target.value })}
              placeholder="Студенты, фрилансеры 20-35 лет"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Facts Card (Menu, Prices, Hours, Location) */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              <Sparkles size={20} className="text-[var(--accent)]" />
              <span>Факты и меню (для фактчекинга)</span>
            </h2>
            <span className="text-xs text-[var(--muted)]">ИИ строго сверяет цены с этим списком</span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-[var(--ink)]">
              Позиции меню и утвержденные цены (в рублях)
            </label>
            {formData.facts.menu.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  value={item.name}
                  onChange={e => {
                    const newMenu = [...formData.facts.menu];
                    newMenu[idx].name = e.target.value;
                    setFormData({ ...formData, facts: { ...formData.facts, menu: newMenu } });
                  }}
                  className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                  placeholder="Название напитка или десерта"
                />
                <div className="relative w-32">
                  <input
                    type="number"
                    value={item.price}
                    onChange={e => {
                      const newMenu = [...formData.facts.menu];
                      newMenu[idx].price = Number(e.target.value);
                      setFormData({ ...formData, facts: { ...formData.facts, menu: newMenu } });
                    }}
                    className="w-full min-h-[44px] px-3.5 pr-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm text-right font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] font-bold">
                    ₽
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
                <Clock size={14} className="text-[var(--muted)]" />
                <span>График работы</span>
              </label>
              <input
                type="text"
                value={formData.facts.schedule}
                onChange={e =>
                  setFormData({
                    ...formData,
                    facts: { ...formData.facts, schedule: e.target.value },
                  })
                }
                placeholder="Пн-Вс 08:00 - 22:00"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-[var(--muted)]" />
                <span>Адрес локации</span>
              </label>
              <input
                type="text"
                value={formData.facts.address}
                onChange={e =>
                  setFormData({
                    ...formData,
                    facts: { ...formData.facts, address: e.target.value },
                  })
                }
                placeholder="ул. Ленина, д. 42"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-h-[44px] px-6 rounded-xl border border-[var(--border)] text-[var(--ink)] font-bold text-sm hover:bg-[var(--surface)] transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] px-8 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] font-extrabold text-sm hover:opacity-95 transition-all shadow-sm cursor-pointer"
          >
            {loading ? 'Сохранение...' : 'Сохранить профиль бренда'}
          </button>
        </div>
      </form>
    </div>
  );
};
