import React, { useEffect, useState } from 'react';
import type { Ingredient, InventoryBatch, School } from '../api/canteenApi';
import { canteenApi } from '../api/canteenApi';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'BATCHES'>('STOCK');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);

  // New batch form
  const [recIngredientId, setRecIngredientId] = useState<number>(0);
  const [recBatchNum, setRecBatchNum] = useState('');
  const [recQty, setRecQty] = useState<number>(10);
  const [recUnit, setRecUnit] = useState('kg');
  const [recCost, setRecCost] = useState<number>(100);
  const [recExpiry, setRecExpiry] = useState(() =>
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [recSupplier, setRecSupplier] = useState('');

  // Write off form
  const [woQty, setWoQty] = useState<number>(1);
  const [woReason, setWoReason] = useState('EXPIRED');
  const [woNote, setWoNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, ings, bts] = await Promise.all([
        canteenApi.getSchool(),
        canteenApi.getIngredients(),
        canteenApi.getBatches(),
      ]);
      setSchool(s);
      setIngredients(ings);
      setBatches(bts);
      if (ings.length > 0 && recIngredientId === 0) {
        setRecIngredientId(ings[0].id);
        setRecUnit(ings[0].baseUnit);
      }
    } catch (err) {
      console.error('Ошибка загрузки склада', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await canteenApi.receiveBatch({
        ingredientId: recIngredientId,
        batchNumber: recBatchNum || `П-${Date.now().toString().slice(-4)}`,
        quantity: recQty,
        unit: recUnit,
        unitCost: recCost,
        expiresAt: new Date(recExpiry).toISOString(),
        supplier: recSupplier || 'ОсОО "Поставщик"',
      });
      setShowReceiveModal(false);
      setRecBatchNum('');
      loadData();
      alert('Партия успешно оприходована на склад!');
    } catch (err: any) {
      alert(err.message || 'Ошибка оприходования партии');
    }
  };

  const handleWriteOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
      await canteenApi.writeOffBatch({
        batchId: selectedBatch.id,
        quantity: woQty,
        reason: woReason,
        note: woNote || 'Списание по акту бракеража',
      });
      setShowWriteOffModal(false);
      setSelectedBatch(null);
      loadData();
      alert('Списание успешно зафиксировано!');
    } catch (err: any) {
      alert(err.message || 'Ошибка списания партии');
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

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
            <Package className="w-4 h-4" />
            SmartStock FEFO Storage
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            Склад и партионный учет сырья
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Контроль остатков, сроков годности (FEFO) и учет каждого движения продуктов.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReceiveModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-95 shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Приход партии
          </button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'STOCK'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Остатки ингредиентов
          </button>
          <button
            onClick={() => setActiveTab('BATCHES')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'BATCHES'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Партии и сроки годности (FEFO)
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Поиск по складу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Tab 1: Ingredients Stock Balances */}
      {activeTab === 'STOCK' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Ингредиент</th>
                  <th className="py-3 px-3">Категория</th>
                  <th className="py-3 px-3 text-right">Текущий остаток</th>
                  <th className="py-3 px-3 text-right">Неснижаемый минимум</th>
                  <th className="py-3 px-3 text-center">Статус запаса</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredIngredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-[var(--chip-bg)]/50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-[var(--ink)] flex items-center gap-2">
                      {ing.name}
                      {ing.isDemo && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-[var(--muted)] text-xs">{ing.category}</td>
                    <td className="py-3.5 px-3 text-right font-black text-sm text-[var(--ink)]">
                      {ing.currentStock} {ing.baseUnit}
                    </td>
                    <td className="py-3.5 px-3 text-right text-[var(--muted)]">
                      {ing.minBalance} {ing.baseUnit}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {ing.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" /> Ниже минимума
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> В норме
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Batches (FEFO Expirations) */}
      {activeTab === 'BATCHES' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-3">Номер партии</th>
                  <th className="py-3 px-3">Поставщик</th>
                  <th className="py-3 px-3 text-right">Поступило</th>
                  <th className="py-3 px-3 text-right">Остаток</th>
                  <th className="py-3 px-3 text-right">Цена за ед.</th>
                  <th className="py-3 px-3 text-center">Срок годности</th>
                  <th className="py-3 px-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {batches.map(b => {
                  const expiryDate = new Date(b.expiresAt);
                  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 3600 * 24));
                  const isExpiring = daysLeft <= 3 && daysLeft >= 0;
                  const isExpired = daysLeft < 0;

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-[var(--chip-bg)]/50 transition-colors ${
                        isExpired ? 'bg-red-500/5' : isExpiring ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 font-bold text-[var(--ink)]">#{b.batchNumber}</td>
                      <td className="py-3.5 px-3 text-[var(--muted)] text-xs">{b.supplier || '—'}</td>
                      <td className="py-3.5 px-3 text-right text-[var(--muted)]">
                        {b.receivedQty} {b.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-sm text-[var(--ink)]">
                        {b.remainingQty} {b.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right text-[var(--muted)]">
                        {b.unitCost} {currency}/{b.unit}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                            isExpired
                              ? 'bg-red-500/20 text-red-600'
                              : isExpiring
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-500/10 text-emerald-600'
                          }`}
                        >
                          {isExpired ? 'Просрочено' : `${daysLeft} дн. (${expiryDate.toLocaleDateString()})`}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedBatch(b);
                            setWoQty(b.remainingQty);
                            setShowWriteOffModal(true);
                          }}
                          disabled={b.remainingQty <= 0}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-red-500/30 text-red-600 hover:bg-red-500/10 disabled:opacity-40"
                        >
                          Списать
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Receive Batch */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-[var(--ink)]">Оприходование партии на склад</h2>
            <form onSubmit={handleReceiveBatch} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Ингредиент</label>
                <select
                  value={recIngredientId}
                  onChange={e => {
                    const id = Number(e.target.value);
                    setRecIngredientId(id);
                    const found = ingredients.find(i => i.id === id);
                    if (found) setRecUnit(found.baseUnit);
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

              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Номер партии / ТТН</label>
                <input
                  type="text"
                  placeholder="Например: П-ГОВ-105"
                  value={recBatchNum}
                  onChange={e => setRecBatchNum(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Количество ({recUnit})</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={recQty}
                    onChange={e => setRecQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Цена за {recUnit} ({currency})</label>
                  <input
                    type="number"
                    step={1}
                    min={0}
                    value={recCost}
                    onChange={e => setRecCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Срок годности</label>
                <input
                  type="date"
                  value={recExpiry}
                  onChange={e => setRecExpiry(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Поставщик</label>
                <input
                  type="text"
                  placeholder="ОсОО 'Поставщик'"
                  value={recSupplier}
                  onChange={e => setRecSupplier(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--muted)]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold"
                >
                  Оприходовать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Write Off Batch */}
      {showWriteOffModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-red-600">Списание партии #{selectedBatch.batchNumber}</h2>
            <form onSubmit={handleWriteOff} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">
                  Количество к списанию (доступно: {selectedBatch.remainingQty} {selectedBatch.unit})
                </label>
                <input
                  type="number"
                  step={0.1}
                  max={selectedBatch.remainingQty}
                  min={0.1}
                  value={woQty}
                  onChange={e => setWoQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Причина списания</label>
                <select
                  value={woReason}
                  onChange={e => setWoReason(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                >
                  <option value="EXPIRED">Истек срок годности (EXPIRED)</option>
                  <option value="SPOILED">Порча сырья при хранении (SPOILED)</option>
                  <option value="PREPARATION_WASTE">Технологические отходы кухни</option>
                  <option value="STORAGE_FAILURE">Сбой холодильного оборудования</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1">Номер акта / примечание</label>
                <input
                  type="text"
                  placeholder="Акт бракеража №..."
                  value={woNote}
                  onChange={e => setWoNote(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowWriteOffModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--muted)]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
                >
                  Подтвердить списание
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
