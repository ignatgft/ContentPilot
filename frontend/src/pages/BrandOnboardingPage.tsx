import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Store, Sparkles, Check, Clock, MapPin, Plus, Trash2, Coffee, Scissors, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  name: string;
  price: number;
}

interface BrandData {
  id?: number;
  name: string;
  description: string;
  audience: string;
  tone: string;
  facts: {
    menu: MenuItem[];
    schedule: string;
    address: string;
  };
  autonomyMode: string;
  samples: string[];
}

const EMPTY_BRAND: BrandData = {
  name: '',
  description: '',
  audience: '',
  tone: '',
  facts: {
    menu: [],
    schedule: '',
    address: '',
  },
  autonomyMode: 'SEMI_AUTO',
  samples: [],
};

export const BrandOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<BrandData>(EMPTY_BRAND);

  useEffect(() => {
    async function loadBrand() {
      try {
        const brand = await apiRequest<BrandData>('/brands/me');
        if (brand && brand.name) {
          setFormData({
            ...brand,
            facts: typeof brand.facts === 'object' && brand.facts !== null
              ? {
                  menu: Array.isArray((brand.facts as any).menu) ? (brand.facts as any).menu : [],
                  schedule: (brand.facts as any).schedule || '',
                  address: (brand.facts as any).address || '',
                }
              : EMPTY_BRAND.facts,
            samples: brand.samples || [],
          });
        }
      } catch (e) {
        // Not configured yet, defaults remain empty
      } finally {
        setFetching(false);
      }
    }
    loadBrand();
  }, []);

  const handleAddMenuItem = () => {
    setFormData(prev => ({
      ...prev,
      facts: {
        ...prev.facts,
        menu: [...prev.facts.menu, { name: '', price: 0 }],
      },
    }));
  };

  const handleRemoveMenuItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      facts: {
        ...prev.facts,
        menu: prev.facts.menu.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleUpdateMenuItem = (index: number, field: 'name' | 'price', value: string | number) => {
    setFormData(prev => {
      const updatedMenu = [...prev.facts.menu];
      updatedMenu[index] = {
        ...updatedMenu[index],
        [field]: value,
      };
      return {
        ...prev,
        facts: {
          ...prev.facts,
          menu: updatedMenu,
        },
      };
    });
  };

  const applyPreset = (type: 'COFFEE' | 'BARBERSHOP' | 'BAKERY') => {
    if (type === 'COFFEE') {
      setFormData({
        name: 'Кофейня «Surf Coffee»',
        description: 'Уютная спешелти-кофейня третьей волны с авторскими напитками и свежей выпечкой.',
        audience: 'Студенты, фрилансеры, диджитал-специалисты и ценители качественного зернового кофе (18–35 лет).',
        tone: 'Дружелюбный, вдохновляющий, экспертный, с лёгким юмором.',
        facts: {
          menu: [
            { name: 'Капучино 300мл', price: 290 },
            { name: 'Латте Солёная карамель', price: 340 },
            { name: 'Фирменный Раф Ваниль', price: 380 },
            { name: 'Круассан миндальный', price: 240 },
            { name: 'Матча латте на кокосовом', price: 360 },
          ],
          schedule: 'Пн-Пт 08:00–22:00, Сб-Вс 09:00–23:00',
          address: 'ул. Ленина, 42 (напротив сквера)',
        },
        autonomyMode: 'SEMI_AUTO',
        samples: [],
      });
    } else if (type === 'BARBERSHOP') {
      setFormData({
        name: 'Барбершоп «Chop-Chop»',
        description: 'Мужская парикмахерская классической стрижки и ухода за бородой в атмосфере комфорта.',
        audience: 'Мужчины 20–45 лет, ценящие безупречный стиль, комфорт и экономию времени.',
        tone: 'Сдержанный, уверенный, экспертный, стильный.',
        facts: {
          menu: [
            { name: 'Мужская стрижка', price: 1800 },
            { name: 'Моделирование бороды', price: 1200 },
            { name: 'Комплекс Стрижка + Борода', price: 2600 },
            { name: 'Камуфляж седины', price: 1100 },
          ],
          schedule: 'Ежедневно 10:00–22:00',
          address: 'просп. Мира, 15',
        },
        autonomyMode: 'SEMI_AUTO',
        samples: [],
      });
    } else {
      setFormData({
        name: 'Ремесленная пекарня «Багет & Ко»',
        description: 'Французская выпечка на живой закваске без улучшителей и авторские десерты.',
        audience: 'Жители района, семьи, ценители натуральных продуктов и свежего хлеба.',
        tone: 'Тёплый, семейный, аппетитный, заботливый.',
        facts: {
          menu: [
            { name: 'Багет традиционный', price: 160 },
            { name: 'Хлеб Тартин на закваске', price: 280 },
            { name: 'Круассан классический', price: 190 },
            { name: 'Улитка с корицей и орехами', price: 220 },
          ],
          schedule: 'Ежедневно 07:30–21:00',
          address: 'ул. Садовая, 8',
        },
        autonomyMode: 'SEMI_AUTO',
        samples: [],
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Укажите название бренда');
      return;
    }
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
      </div>

      {/* Quick Showcase Presets for Instant Demo */}
      <div className="mb-6 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--muted)] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--accent)]" />
            <span>Быстрый старт для демонстрации (выберите готовую модель бизнеса):</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => applyPreset('COFFEE')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--chip-bg)] text-[var(--ink)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] transition-all cursor-pointer border border-[var(--border)] inline-flex items-center gap-1.5"
          >
            <Coffee size={14} className="text-[var(--accent)]" />
            <span>Кофейня «Surf Coffee» (латте, раф, выпечка)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('BARBERSHOP')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--chip-bg)] text-[var(--ink)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] transition-all cursor-pointer border border-[var(--border)] inline-flex items-center gap-1.5"
          >
            <Scissors size={14} className="text-[var(--accent)]" />
            <span>Барбершоп «Chop-Chop» (стрижки, борода)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('BAKERY')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--chip-bg)] text-[var(--ink)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] transition-all cursor-pointer border border-[var(--border)] inline-flex items-center gap-1.5"
          >
            <UtensilsCrossed size={14} className="text-[var(--accent)]" />
            <span>Ремесленная пекарня «Багет & Ко»</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--success)] font-bold text-sm flex items-center gap-2">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Details Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
            <Store size={20} className="text-[var(--accent)]" />
            <span>Основная информация</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Название заведения / бренда *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например, Моя Компания или Магазин Уюта"
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
                placeholder="Дружелюбный, экспертный, лаконичный"
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
              placeholder="Расскажите кратко о вашей компании, товарах или услугах..."
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
              placeholder="Клиенты, возраст, интересы, сфера деятельности"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Facts Card (Menu, Prices, Hours, Location) */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              <Sparkles size={20} className="text-[var(--accent)]" />
              <span>Факты, товары и цены (для фактчекинга)</span>
            </h2>
            <button
              type="button"
              onClick={handleAddMenuItem}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] text-[var(--accent)] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Добавить позицию</span>
            </button>
          </div>
          <p className="text-xs text-[var(--muted)]">
            ИИ строго сверяет указанные в постах цены с этим списком. Указывайте актуальные позиции.
          </p>

          <div className="space-y-3">
            {formData.facts.menu.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted)]">
                Позиции пока не добавлены. Нажмите «Добавить позицию», чтобы внести товары или услуги с ценами.
              </div>
            ) : (
              formData.facts.menu.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => handleUpdateMenuItem(idx, 'name', e.target.value)}
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm"
                    placeholder="Название товара или услуги"
                  />
                  <div className="relative w-32">
                    <input
                      type="number"
                      value={item.price || ''}
                      onChange={e => handleUpdateMenuItem(idx, 'price', Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full min-h-[44px] px-3.5 pr-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm text-right font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] font-bold">
                      ₽
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMenuItem(idx)}
                    title="Удалить"
                    className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
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
                placeholder="Например, Пн-Пт 09:00 - 19:00"
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
                placeholder="Адрес офиса, магазина или онлайн"
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
