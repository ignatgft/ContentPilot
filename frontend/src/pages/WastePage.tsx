import React, { useEffect, useState } from 'react';
import type { Dish, Ingredient, WasteSummary } from '../api/canteenApi';
import { canteenApi } from '../api/canteenApi';
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Save,
  Plus,
  Scale,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

export const WastePage: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [wasteData, setWasteData] = useState<WasteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingFact, setSavingFact] = useState(false);
  const [savingWaste, setSavingWaste] = useState(false);

  // Production fact form
  const [factDate, setFactDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [factDishId, setFactDishId] = useState<number>(0);
  const [factPrepared, setFactPrepared] = useState<number>(280);
  const [factServed, setFactServed] = useState<number>(268);
  const [factLeftovers, setFactLeftovers] = useState<number>(8);
  const [factWaste, setFactWaste] = useState<number>(4);
  const [factNote, setFactNote] = useState<string>('');

  // Waste logging form
  const [wasteDate, setWasteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [wasteIngId, setWasteIngId] = useState<number>(0);
  const [wasteQty, setWasteQty] = useState<number>(0.8);
  const [wasteUnit, setWasteUnit] = useState<string>('kg');
  const [wasteReason, setWasteReason] = useState<string>('PLATE_WASTE');

  const loadData = async () => {
    try {
      setLoading(true);
      const [, dList, iList, w] = await Promise.all([
        canteenApi.getSchool(),
        canteenApi.getDishes(),
        canteenApi.getIngredients(),
        canteenApi.getWaste(),
      ]);
      setDishes(dList);
      setIngredients(iList);
      setWasteData(w);
      if (dList.length > 0 && factDishId === 0) setFactDishId(dList[0].id);
      if (iList.length > 0 && wasteIngId === 0) {
        setWasteIngId(iList[0].id);
        setWasteUnit(iList[0].baseUnit);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных отходов', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Equation balance check:
  // prepared = served + leftovers + waste
  const accountSum = Number(factServed) + Number(factLeftovers) + Number(factWaste);
  const discrepancy = Number(factPrepared) - accountSum;
  const isBalanced = discrepancy === 0;

  const handleSaveFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factDishId) return;

    try {
      setSavingFact(true);
      await canteenApi.recordProductionFact({
        date: factDate,
        dishId: factDishId,
        preparedPortions: Number(factPrepared),
        servedPortions: Number(factServed),
        usableLeftovers: Number(factLeftovers),
        wastePortions: Number(factWaste),
        varianceNote: factNote || (!isBalanced ? `Расхождение баланса порций: ${discrepancy}` : ''),
      });
      alert('Факт приготовления и раздачи смены успешно зафиксирован!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения факта');
    } finally {
      setSavingFact(false);
    }
  };

  const handleSaveWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingWaste(true);
      await canteenApi.recordWasteLoss({
        date: wasteDate,
        ingredientId: wasteIngId > 0 ? wasteIngId : undefined,
        quantity: wasteQty,
        unit: wasteUnit,
        reason: wasteReason,
      });
      alert('Запись о пищевых отходах внесена с подсчетом себестоимости потерь!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения отходов');
    } finally {
      setSavingWaste(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
          <TrendingDown className="w-4 h-4" />
          WasteGuard Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          Фиксация факта смены и учет пищевых отходов
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Контроль уравнения баланса порций: Приготовлено = Выдано + Остаток + Отходы.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form 1: Production Shift Fact */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--accent)]" />
              1. Факт приготовления и выдачи порций
            </h2>
          </div>

          <form onSubmit={handleSaveFact} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Дата смены</label>
                <input
                  type="date"
                  value={factDate}
                  onChange={e => setFactDate(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Блюдо</label>
                <select
                  value={factDishId}
                  onChange={e => setFactDishId(Number(e.target.value))}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                >
                  {dishes.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] block mb-1">Приготовлено</label>
                <input
                  type="number"
                  min={0}
                  value={factPrepared}
                  onChange={e => setFactPrepared(parseInt(e.target.value) || 0)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold text-[var(--ink)] text-right"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] block mb-1">Выдано</label>
                <input
                  type="number"
                  min={0}
                  value={factServed}
                  onChange={e => setFactServed(parseInt(e.target.value) || 0)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold text-emerald-600 text-right"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] block mb-1">Остаток</label>
                <input
                  type="number"
                  min={0}
                  value={factLeftovers}
                  onChange={e => setFactLeftovers(parseInt(e.target.value) || 0)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold text-blue-600 text-right"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] block mb-1">Отходы</label>
                <input
                  type="number"
                  min={0}
                  value={factWaste}
                  onChange={e => setFactWaste(parseInt(e.target.value) || 0)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-bold text-amber-600 text-right"
                />
              </div>
            </div>

            {/* Dynamic Balance Equation Banner */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                isBalanced
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span>
                  Уравнение: {factPrepared} = {factServed} (выдано) + {factLeftovers} (остаток) + {factWaste} (отходы)
                </span>
              </div>
              <span className="font-bold">
                {isBalanced ? 'Баланс сошелся (0)' : `Расхождение: ${discrepancy > 0 ? `+${discrepancy}` : discrepancy}`}
              </span>
            </div>

            {!isBalanced && (
              <div>
                <label className="text-xs font-bold text-amber-700 dark:text-amber-300 block mb-1">
                  Объяснение расхождения баланса (обязательно при несовпадении):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Потери при порционировании / остывание на раздаче"
                  value={factNote}
                  onChange={e => setFactNote(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-[var(--ink)]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={savingFact}
              className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingFact ? 'Сохранение...' : 'Зафиксировать факт смены'}
            </button>
          </form>
        </div>

        {/* Form 2: Food Waste Loss Logging */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              2. Журнал отходов и расчет себестоимости потерь
            </h2>
          </div>

          <form onSubmit={handleSaveWaste} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Дата</label>
                <input
                  type="date"
                  value={wasteDate}
                  onChange={e => setWasteDate(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Ингредиент</label>
                <select
                  value={wasteIngId}
                  onChange={e => {
                    const id = Number(e.target.value);
                    setWasteIngId(id);
                    const found = ingredients.find(i => i.id === id);
                    if (found) setWasteUnit(found.baseUnit);
                  }}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                >
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.baseUnit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">
                  Объем списания ({wasteUnit})
                </label>
                <input
                  type="number"
                  step={0.05}
                  min={0.01}
                  value={wasteQty}
                  onChange={e => setWasteQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Причина отходов</label>
                <select
                  value={wasteReason}
                  onChange={e => setWasteReason(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                >
                  <option value="PLATE_WASTE">Отходы тарелочные (возврат учащимися)</option>
                  <option value="EXPIRED">Истек срок годности сырья</option>
                  <option value="SPOILED">Порча при хранении на складе</option>
                  <option value="PREPARATION_WASTE">Очистки и технологические отходы</option>
                  <option value="OVERCOOKED">Брак при термической обработке</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--chip-bg)] text-xs text-[var(--muted)] flex items-center justify-between">
              <span>Себестоимость будет рассчитана по фактической цене партии.</span>
              <span className="font-semibold text-[var(--ink)]">KGS</span>
            </div>

            <button
              type="submit"
              disabled={savingWaste}
              className="w-full py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:opacity-95 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {savingWaste ? 'Сохранение...' : 'Зафиксировать отходы и списать'}
            </button>
          </form>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[var(--ink)]">Аудит зафиксированных фактов приготовления</h2>
        {wasteData?.productionFacts && wasteData.productionFacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Дата</th>
                  <th className="py-3 px-3">Блюдо</th>
                  <th className="py-3 px-3 text-right">Приготовлено</th>
                  <th className="py-3 px-3 text-right">Выдано</th>
                  <th className="py-3 px-3 text-right">Остаток</th>
                  <th className="py-3 px-3 text-right">Отходы</th>
                  <th className="py-3 px-3">Примечание</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {wasteData.productionFacts.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--chip-bg)]/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[var(--ink)]">{p.date}</td>
                    <td className="py-3 px-3 font-bold text-[var(--ink)]">{p.dishName}</td>
                    <td className="py-3 px-3 text-right font-medium">{p.preparedPortions}</td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-bold">{p.servedPortions}</td>
                    <td className="py-3 px-3 text-right text-blue-600">{p.usableLeftovers}</td>
                    <td className="py-3 px-3 text-right text-amber-600 font-bold">{p.wastePortions}</td>
                    <td className="py-3 px-3 text-xs text-[var(--muted)]">{p.varianceNote || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-[var(--muted)]">История смен пока пуста</div>
        )}
      </div>
    </div>
  );
};
