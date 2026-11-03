import React, { useEffect, useState } from 'react';
import type { ProcurementPlanView, School } from '../api/canteenApi';
import { canteenApi } from '../api/canteenApi';
import {
  ShoppingBag,
  Calendar,
  Calculator,
  CheckCircle2,
  Download,
  Info,
  RefreshCw,
} from 'lucide-react';

export const ProcurementPage: React.FC = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [plan, setPlan] = useState<ProcurementPlanView | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const loadData = async (date: string) => {
    try {
      setLoading(true);
      const [s, p] = await Promise.all([
        canteenApi.getSchool(),
        canteenApi.getProcurement(date),
      ]);
      setSchool(s);
      setPlan(p);
    } catch (err) {
      console.error('Ошибка загрузки плана закупок', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handleRecalculate = async () => {
    try {
      setCalculating(true);
      const res = await canteenApi.calculateProcurement({ date: selectedDate });
      setPlan(res);
      alert('Потребность успешно пересчитана на основе утвержденного меню и складских остатков!');
    } catch (e: any) {
      alert(e.message || 'Ошибка расчета плана закупок');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const currency = school?.currency || 'KGS';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
            <ShoppingBag className="w-4 h-4" />
            ProcurementPlanner & SmartStock
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            Планирование закупок продуктов
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Расчет дефицита сырья на основе меню, норм закладки, текущих остатков и 10% страхового запаса.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--chip-bg)] text-sm font-semibold text-[var(--ink)] flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Печать накладной
          </button>
          <button
            onClick={handleRecalculate}
            disabled={calculating}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-95 shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {calculating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Пересчет...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" /> Пересчитать потребность
              </>
            )}
          </button>
        </div>
      </div>

      {/* Control bar: Date and Status */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[var(--accent)]" />
          <div>
            <label className="text-xs font-bold text-[var(--muted)] uppercase block">Дата поставки / приготовления</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
            Статус: {plan?.status === 'CALCULATED' ? 'Рассчитан системой' : 'Заказан у поставщиков'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-[var(--muted)] block">Итого к закупке:</span>
            <span className="text-xl sm:text-2xl font-black text-[var(--ink)]">
              {(plan?.totalEstimatedCost || 0).toLocaleString('ru-RU')} {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Formula explanation note */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3 text-xs text-[var(--muted)]">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[var(--ink)]">Детерминированная формула закупки:</span>{' '}
          <code className="bg-[var(--chip-bg)] px-1.5 py-0.5 rounded text-[var(--ink)] font-mono">
            К закупке = max(0, Потребность меню + Страховой запас (10%) − Складской остаток)
          </code>
          . Если текущий склад перекрывает потребность меню, объем закупки равен 0.
        </div>
      </div>

      {/* Procurement Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[var(--ink)]">Спецификация сырья к закупке</h2>

        {plan?.lines && plan.lines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Ингредиент</th>
                  <th className="py-3 px-3 text-right">Потребность по меню</th>
                  <th className="py-3 px-3 text-right">На складе</th>
                  <th className="py-3 px-3 text-right">Страховой запас (10%)</th>
                  <th className="py-3 px-3 text-right">К закупке</th>
                  <th className="py-3 px-3 text-right">Цена за ед.</th>
                  <th className="py-3 px-3 text-right">Сумма ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {plan.lines.map(line => {
                  const hasToBuy = line.purchaseQty > 0;
                  return (
                    <tr
                      key={line.id}
                      className={`hover:bg-[var(--chip-bg)]/50 transition-colors ${
                        hasToBuy ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 font-bold text-[var(--ink)]">{line.ingredientName}</td>
                      <td className="py-3.5 px-3 text-right text-[var(--muted)]">
                        {line.requiredQty} {line.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-[var(--ink)]">
                        {line.stockQty} {line.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right text-[var(--muted)] text-xs">
                        +{line.safetyStock} {line.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {hasToBuy ? (
                          <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                            {line.purchaseQty} {line.unit}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> В наличии
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right text-[var(--muted)]">
                        {line.estimatedUnitCost} {currency}/{line.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-[var(--ink)]">
                        {line.estimatedTotalCost.toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-[var(--muted)]">
            Нет строк закупки. Убедитесь, что утвержден план меню на дату, и нажмите «Пересчитать потребность».
          </div>
        )}
      </div>
    </div>
  );
};
