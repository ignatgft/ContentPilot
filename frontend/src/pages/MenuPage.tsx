import React, { useEffect, useState, useMemo } from 'react';
import type { Dish, Ingredient, MenuPlanView } from '../api/canteenApi';
import { canteenApi } from '../api/canteenApi';
import {
  Plus,
  Calendar,
  Save,
  Layers,
  ChefHat,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Flame,
  Minus,
  Check,
  X,
  Utensils,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuPlan, setMenuPlan] = useState<MenuPlanView | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Views
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'calories' | 'portions'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Collapsed state for dish recipes: set of dish IDs whose recipes are expanded
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());

  // Daily plan portions mapping: dishId -> plannedPortions
  const [plannedPortions, setPlannedPortions] = useState<{ [dishId: number]: number }>({});

  // New Dish Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Вторые блюда');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishImageUrl, setNewDishImageUrl] = useState('');
  const [newDishCalories, setNewDishCalories] = useState<number>(450);
  const [newDishProteins, setNewDishProteins] = useState<number>(16);
  const [newDishFats, setNewDishFats] = useState<number>(12);
  const [newDishCarbs, setNewDishCarbs] = useState<number>(55);
  const [newDishInstructions, setNewDishInstructions] = useState('');
  const [newDishYield, setNewDishYield] = useState(1);
  const [newRecipeIngs, setNewRecipeIngs] = useState<
    { ingredientId: number; quantity: number; unit: string }[]
  >([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAll = async (date: string) => {
    try {
      setLoading(true);
      const [dList, iList, mPlan] = await Promise.all([
        canteenApi.getDishes(),
        canteenApi.getIngredients(),
        canteenApi.getMenu(date),
      ]);
      setDishes(dList);
      setIngredients(iList);
      setMenuPlan(mPlan);

      // Populate planned portions
      const map: { [dishId: number]: number } = {};
      if (mPlan && mPlan.items) {
        mPlan.items.forEach((i) => {
          map[i.dishId] = i.plannedPortions;
        });
      }
      setPlannedPortions(map);
    } catch (err) {
      console.error('Ошибка загрузки меню:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(selectedDate);
  }, [selectedDate]);

  // Stepper helper
  const handlePortionDelta = (dishId: number, delta: number) => {
    setPlannedPortions((prev) => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [dishId]: next };
    });
  };

  const handlePortionInput = (dishId: number, value: string) => {
    const val = parseInt(value, 10);
    setPlannedPortions((prev) => ({
      ...prev,
      [dishId]: isNaN(val) ? 0 : Math.max(0, val),
    }));
  };

  const toggleRecipeExpand = (dishId: number) => {
    setExpandedRecipes((prev) => {
      const next = new Set(prev);
      if (next.has(dishId)) {
        next.delete(dishId);
      } else {
        next.add(dishId);
      }
      return next;
    });
  };

  const handleQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSaveMenu = async () => {
    try {
      setSaving(true);
      const itemsToSave = Object.entries(plannedPortions)
        .filter(([, qty]) => qty > 0)
        .map(([dId, qty]) => ({
          dishId: Number(dId),
          plannedPortions: qty,
        }));

      await canteenApi.saveMenu({
        date: selectedDate,
        items: itemsToSave,
      });
      showToast('План меню успешно утверждён и сохранён!');
      await loadAll(selectedDate);
    } catch (err) {
      console.error('Ошибка при сохранении меню:', err);
      showToast('Ошибка при сохранении меню');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    try {
      const createdDish = await canteenApi.createDish({
        name: newDishName,
        category: newDishCategory,
        description: newDishDesc,
        imageUrl: newDishImageUrl || undefined,
        calories: newDishCalories,
        proteins: newDishProteins,
        fats: newDishFats,
        carbs: newDishCarbs,
        yieldPortions: newDishYield,
        instructions: newDishInstructions,
        ingredients: newRecipeIngs.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          unit: i.unit,
        })),
      });

      showToast(`Блюдо «${createdDish.name}» успешно добавлено!`);
      setShowAddModal(false);
      resetAddForm();
      await loadAll(selectedDate);
    } catch (err) {
      console.error('Ошибка создания блюда:', err);
      showToast('Не удалось создать блюдо');
    }
  };

  const resetAddForm = () => {
    setNewDishName('');
    setNewDishCategory('Вторые блюда');
    setNewDishDesc('');
    setNewDishImageUrl('');
    setNewDishCalories(450);
    setNewDishProteins(16);
    setNewDishFats(12);
    setNewDishCarbs(55);
    setNewDishInstructions('');
    setNewDishYield(1);
    setNewRecipeIngs([]);
  };

  // KPI Calculations
  const totalDishesCount = dishes.length;
  const totalPlannedPortions = useMemo(
    () => Object.values(plannedPortions).reduce((sum, val) => sum + val, 0),
    [plannedPortions]
  );
  const filledRecipesCount = dishes.filter(
    (d) => d.ingredients && d.ingredients.length > 0
  ).length;
  const recipeWarningsCount = totalDishesCount - filledRecipesCount;

  // Categories list with count
  const categories = ['ALL', 'Первые блюда', 'Вторые блюда', 'Завтраки', 'Салаты', 'Напитки'];

  const filteredDishes = useMemo(() => {
    let list = dishes.filter((d) => {
      const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase()));
      return matchesCat && matchesSearch;
    });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ru');
      if (sortBy === 'calories') return (b.calories || 0) - (a.calories || 0);
      if (sortBy === 'portions') {
        const pA = plannedPortions[a.id] || 0;
        const pB = plannedPortions[b.id] || 0;
        return pB - pA;
      }
      return 0;
    });

    return list;
  }, [dishes, selectedCategory, search, sortBy, plannedPortions]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#1D222C] border border-[#303744] flex items-center justify-center text-white shadow-md animate-pulse">
          <ChefHat className="w-6 h-6 text-[#5B8CFF]" />
        </div>
        <p className="text-sm font-bold text-white">
          Загрузка технологических карт и меню...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-page-enter">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1D222C] text-white shadow-2xl border border-[#5B8CFF]/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#39C98A]" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[#7F8998] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Hero Header (Apple × JetBrains) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#202A3C] via-[#242A35] to-[#30294A] text-white p-6 sm:p-8 shadow-xl border border-[#303744]">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-[#5B8CFF]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-[#9477FF]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B8CFF]/15 border border-[#5B8CFF]/30 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-[#5B8CFF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Технологические карты • СанПиН КР</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Меню и технологические карты
            </h1>
            <p className="text-xs sm:text-sm text-[#A6AFBC] leading-relaxed font-medium">
              Управляйте блюдами, рецептурами и планом питания в одном месте. Нормы расхода и расчет
              ингредиентов привязаны к складским партиям по принципу FEFO.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 rounded-2xl bg-[#5B8CFF] hover:bg-[#4577EB] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#5B8CFF]/25 flex items-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ Новое блюдо</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Horizontal KPI Stats Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Dishes in Catalog */}
        <div className="bg-[#1D222C] border border-[#303744] hover:border-[#5B8CFF]/40 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
          <div className="flex items-center justify-between text-[#7F8998] text-[11px] font-bold uppercase tracking-wider">
            <span>Блюд в каталоге</span>
            <div className="w-7 h-7 rounded-lg bg-[#5B8CFF]/15 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-[#5B8CFF]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalDishesCount}
          </div>
          <p className="text-[11px] text-[#A6AFBC]">Активные позиции рациона</p>
        </div>

        {/* KPI 2: Planned Portions */}
        <div className="bg-[#1D222C] border border-[#303744] hover:border-[#55C7DE]/40 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
          <div className="flex items-center justify-between text-[#7F8998] text-[11px] font-bold uppercase tracking-wider">
            <span>Порций в плане</span>
            <div className="w-7 h-7 rounded-lg bg-[#55C7DE]/15 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#55C7DE]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalPlannedPortions}
          </div>
          <p className="text-[11px] text-[#A6AFBC]">
            На дату: <span className="font-bold text-white">{selectedDate}</span>
          </p>
        </div>

        {/* KPI 3: Filled Tech Cards */}
        <div className="bg-[#1D222C] border border-[#303744] hover:border-[#9477FF]/40 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
          <div className="flex items-center justify-between text-[#7F8998] text-[11px] font-bold uppercase tracking-wider">
            <span>Заполненные карты</span>
            <div className="w-7 h-7 rounded-lg bg-[#9477FF]/15 flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#9477FF]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {filledRecipesCount}{' '}
            <span className="text-sm font-semibold text-[#7F8998]">/ {totalDishesCount}</span>
          </div>
          <div className="w-full bg-[#242A35] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#5B8CFF] h-full rounded-full transition-all duration-300"
              style={{
                width: `${totalDishesCount > 0 ? (filledRecipesCount / totalDishesCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* KPI 4: Warnings */}
        <div
          className={`rounded-2xl p-5 shadow-sm space-y-2 border transition-all ${
            recipeWarningsCount > 0
              ? 'border-[#FFB547]/30 bg-[#241E19]'
              : 'border-[#303744] bg-[#1D222C]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#7F8998]">
            <span>Предупреждения</span>
            {recipeWarningsCount > 0 ? (
              <div className="w-7 h-7 rounded-lg bg-[#FFB547]/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#FFB547]" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#39C98A]/15 flex items-center justify-center">
                <Check className="w-4 h-4 text-[#39C98A]" />
              </div>
            )}
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black ${
              recipeWarningsCount > 0 ? 'text-[#FFB547]' : 'text-[#39C98A]'
            }`}
          >
            {recipeWarningsCount}
          </div>
          <p className="text-[11px] text-[#A6AFBC]">
            {recipeWarningsCount > 0 ? 'Требуется заполнить рецептуру' : 'Все рецептуры заполнены'}
          </p>
        </div>
      </div>

      {/* 3. Planning & Date Bar */}
      <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm">
        {/* Left: Date selector & Presets */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#171A21] border border-[#303744]">
            <Calendar className="w-4 h-4 text-[#5B8CFF] ml-1" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-extrabold text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Quick Date Chips */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDate(-1)}
              className="px-3 py-1.5 rounded-xl bg-[#242A35] border border-[#303744] hover:bg-[#2D3543] font-semibold text-[#A6AFBC] hover:text-white transition-colors cursor-pointer"
            >
              Вчера
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate(0)}
              className="px-3 py-1.5 rounded-xl bg-[#5B8CFF] text-white font-extrabold shadow-xs transition-colors cursor-pointer"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate(1)}
              className="px-3 py-1.5 rounded-xl bg-[#242A35] border border-[#303744] hover:bg-[#2D3543] font-semibold text-[#A6AFBC] hover:text-white transition-colors cursor-pointer"
            >
              Завтра
            </button>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              menuPlan?.status === 'APPROVED'
                ? 'bg-[#39C98A]/15 text-[#39C98A] border-[#39C98A]/30'
                : 'bg-[#FFB547]/15 text-[#FFB547] border-[#FFB547]/30'
            }`}
          >
            {menuPlan?.status === 'APPROVED' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#39C98A]" />
                <span>Меню утверждено</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-[#FFB547]" />
                <span>Черновик плана</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Submit Button & Auto Sync indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#303744]">
          <div className="hidden sm:block text-right">
            <div className="text-[10px] font-bold text-[#7F8998] uppercase">Складской учет</div>
            <div className="text-xs font-bold text-[#39C98A]">FEFO Синхронизация активна</div>
          </div>

          <button
            type="button"
            onClick={handleSaveMenu}
            disabled={saving}
            className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-extrabold shadow-md flex items-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Сохранение...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Утвердить меню на дату</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Filter, Search & View Controls */}
      <div className="space-y-4">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const count =
              cat === 'ALL' ? dishes.length : dishes.filter((d) => d.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#5B8CFF] text-white border-[#5B8CFF] shadow-sm'
                    : 'bg-[#1D222C] border-[#303744] text-[#A6AFBC] hover:text-white hover:bg-[#242A35]'
                }`}
              >
                <span>{cat === 'ALL' ? 'Все блюда' : cat}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#242A35] text-[#A6AFBC] border border-[#303744]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort, View Mode Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#7F8998]" />
            <input
              type="text"
              placeholder="Поиск блюд по названию или описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1D222C] border border-[#303744] rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-[#7F8998] focus:outline-none focus:border-[#5B8CFF]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-[#7F8998] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Sort & Layout Switch */}
          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#1D222C] border border-[#303744] text-xs text-white">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7F8998]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer text-white"
              >
                <option value="name" className="bg-[#1D222C] text-white">По названию</option>
                <option value="calories" className="bg-[#1D222C] text-white">По калориям</option>
                <option value="portions" className="bg-[#1D222C] text-white">По порциям в плане</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-[#1D222C] border border-[#303744]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#242A35] text-[#5B8CFF]'
                    : 'text-[#7F8998] hover:text-white'
                }`}
                title="Сетка карточек"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#242A35] text-[#5B8CFF]'
                    : 'text-[#7F8998] hover:text-white'
                }`}
                title="Компактная таблица"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Grid or Table View */}
      {filteredDishes.length === 0 ? (
        <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#242A35] text-[#5B8CFF] flex items-center justify-center mx-auto border border-[#303744]">
            <Utensils className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-white">Блюда не найдены</h3>
          <p className="text-xs text-[#A6AFBC] max-w-sm mx-auto">
            По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска или добавьте
            новое блюдо.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('ALL');
            }}
            className="btn-secondary px-4 py-2 text-xs font-bold"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW OF DISHES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDishes.map((dish) => {
            const currentPlanned = plannedPortions[dish.id] || 0;
            const isRecipeExpanded = expandedRecipes.has(dish.id);
            const hasIngredients = dish.ingredients && dish.ingredients.length > 0;

            return (
              <div
                key={dish.id}
                className="bg-[#1D222C] border border-[#303744] hover:border-[#5B8CFF]/50 rounded-2xl overflow-hidden flex flex-col justify-between group shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Upper 40%: Delicious Photo with Badges */}
                <div className="relative h-48 w-full bg-[#171A21] overflow-hidden">
                  {dish.imageUrl ? (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#7F8998] p-4 text-center">
                      <ChefHat className="w-10 h-10 mb-2 opacity-40" />
                      <span className="text-[11px] font-bold">Фото блюда не загружено</span>
                    </div>
                  )}

                  {/* Gradient Overlay for badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                  {/* Category Pill on top-left */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#171A21]/90 text-white backdrop-blur-md border border-white/10 shadow-xs">
                      {dish.category}
                    </span>
                  </div>

                  {/* Demo or Status Pill on top-right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {dish.isDemo && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FF9B62] text-[#111318] shadow-xs">
                        DEMO
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Info: Calories */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-black">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                      <Flame className="w-3.5 h-3.5 text-[#FFB547]" />
                      <span>{dish.calories || 350} ккал</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Title & Description */}
                  <div>
                    <h3 className="font-black text-base text-white leading-snug group-hover:text-[#5B8CFF] transition-colors">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-[#A6AFBC] mt-1.5 line-clamp-2 leading-relaxed">
                      {dish.description || 'Традиционное блюдо школьного питания по нормам СанПиН.'}
                    </p>

                    {/* Macro Nutrition Badges */}
                    <div className="mt-3 grid grid-cols-3 gap-1.5 text-center p-2 rounded-xl bg-[#171A21] border border-[#303744] text-[11px]">
                      <div>
                        <div className="text-[9px] font-bold text-[#7F8998] uppercase">Белки</div>
                        <div className="font-extrabold text-white">
                          {dish.proteins ? Number(dish.proteins).toFixed(1) : '14'}г
                        </div>
                      </div>
                      <div className="border-x border-[#303744]">
                        <div className="text-[9px] font-bold text-[#7F8998] uppercase">Жиры</div>
                        <div className="font-extrabold text-white">
                          {dish.fats ? Number(dish.fats).toFixed(1) : '10'}г
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-[#7F8998] uppercase">Углев.</div>
                        <div className="font-extrabold text-white">
                          {dish.carbs ? Number(dish.carbs).toFixed(1) : '45'}г
                        </div>
                      </div>
                    </div>

                    {/* Allergens warning pills */}
                    {dish.allergens && dish.allergens.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-[#FF647C] mr-0.5">
                          <ShieldAlert className="w-3 h-3 inline mr-0.5" /> Аллергены:
                        </span>
                        {dish.allergens.map((al) => (
                          <span
                            key={al.code}
                            className="px-2 py-0.5 rounded-lg bg-[#FF647C]/15 text-[#FF647C] text-[10px] font-bold border border-[#FF647C]/30"
                          >
                            {al.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Collapsible Recipe Drawer */}
                    <div className="mt-3 pt-3 border-t border-[#303744]">
                      <button
                        type="button"
                        onClick={() => toggleRecipeExpand(dish.id)}
                        className="w-full flex items-center justify-between text-xs font-bold text-[#A6AFBC] hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#5B8CFF]" />
                          <span>Технологическая карта</span>
                          <span className="text-[10px] font-semibold text-[#7F8998]">
                            ({dish.ingredients?.length || 0} ингр.)
                          </span>
                        </span>
                        {isRecipeExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isRecipeExpanded && (
                        <div className="mt-2.5 p-3 rounded-xl bg-[#171A21] border border-[#303744] text-xs space-y-1.5 animate-in fade-in duration-150">
                          {hasIngredients ? (
                            dish.ingredients?.map((ing) => (
                              <div
                                key={ing.ingredientId}
                                className="flex items-center justify-between text-[11px]"
                              >
                                <span className="text-[#A6AFBC]">
                                  {ing.ingredientName}
                                </span>
                                <span className="font-bold text-white">
                                  {ing.quantity} {ing.unit}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-[#FFB547] font-bold py-1 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Рецептура еще не заполнена</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action: Portion Planner Stepper */}
                  <div className="pt-3 border-t border-[#303744] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold text-[#7F8998] uppercase">
                        Порций в плане
                      </div>
                      <div className="text-xs font-bold text-white">
                        {currentPlanned > 0 ? `${currentPlanned} порций` : 'Не запланировано'}
                      </div>
                    </div>

                    {/* Numeric Stepper with Plus / Minus */}
                    <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#171A21] border border-[#303744]">
                      <button
                        type="button"
                        onClick={() => handlePortionDelta(dish.id, -10)}
                        className="w-7 h-7 rounded-xl bg-[#242A35] hover:bg-[#2D3543] text-white flex items-center justify-center transition-colors cursor-pointer border border-[#303744]"
                        title="-10 порций"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={currentPlanned || ''}
                        placeholder="0"
                        onChange={(e) => handlePortionInput(dish.id, e.target.value)}
                        className="w-14 text-center bg-transparent font-black text-xs sm:text-sm text-white focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handlePortionDelta(dish.id, 10)}
                        className="w-7 h-7 rounded-xl bg-[#5B8CFF] hover:bg-[#4577EB] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                        title="+10 порций"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW OF DISHES */
        <div className="bg-[#1D222C] border border-[#303744] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#171A21] border-b border-[#303744] text-[#7F8998] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Блюдо</th>
                  <th className="p-4">Категория</th>
                  <th className="p-4">КБЖУ</th>
                  <th className="p-4">Аллергены</th>
                  <th className="p-4">Техкарта</th>
                  <th className="p-4 text-right">Порций в плане</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303744]">
                {filteredDishes.map((dish) => {
                  const currentPlanned = plannedPortions[dish.id] || 0;
                  const hasIngredients = dish.ingredients && dish.ingredients.length > 0;

                  return (
                    <tr
                      key={dish.id}
                      className="hover:bg-[#242A35]/60 transition-colors"
                    >
                      {/* Name & Photo */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {dish.imageUrl ? (
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#303744]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#242A35] text-[#5B8CFF] border border-[#303744] flex items-center justify-center shrink-0">
                              <Utensils className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-sm text-white">
                              {dish.name}
                            </div>
                            <div className="text-[11px] text-[#A6AFBC] line-clamp-1 max-w-xs">
                              {dish.description || 'Школьное меню'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[#242A35] text-white border border-[#303744]">
                          {dish.category}
                        </span>
                      </td>

                      {/* KBJU */}
                      <td className="p-4 font-mono">
                        <div className="font-bold text-white">{dish.calories || 350} ккал</div>
                        <div className="text-[10px] text-[#A6AFBC]">
                          Б:{dish.proteins || 14} • Ж:{dish.fats || 10} • У:{dish.carbs || 45}
                        </div>
                      </td>

                      {/* Allergens */}
                      <td className="p-4">
                        {dish.allergens && dish.allergens.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {dish.allergens.map((al) => (
                              <span
                                key={al.code}
                                className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FF647C]/15 text-[#FF647C] border border-[#FF647C]/30"
                              >
                                {al.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#39C98A] font-semibold text-[11px]">
                            Гипоаллергенно
                          </span>
                        )}
                      </td>

                      {/* Recipe status */}
                      <td className="p-4">
                        {hasIngredients ? (
                          <span className="inline-flex items-center gap-1 text-[#39C98A] font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" />
                            <span>{dish.ingredients?.length} ингр.</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#FFB547] font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Не заполнена</span>
                          </span>
                        )}
                      </td>

                      {/* Stepper */}
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#171A21] border border-[#303744]">
                          <button
                            type="button"
                            onClick={() => handlePortionDelta(dish.id, -10)}
                            className="w-6 h-6 rounded-lg bg-[#242A35] text-white flex items-center justify-center cursor-pointer hover:bg-[#2D3543]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={currentPlanned || ''}
                            placeholder="0"
                            onChange={(e) => handlePortionInput(dish.id, e.target.value)}
                            className="w-12 text-center bg-transparent font-black text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handlePortionDelta(dish.id, 10)}
                            className="w-6 h-6 rounded-lg bg-[#5B8CFF] text-white flex items-center justify-center cursor-pointer shadow-xs hover:bg-[#4577EB]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Modal: Add New Dish */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 bg-[#272E3A] border border-[#303744] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-[#F5F7FA]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#303744]">
              <div>
                <h2 className="text-lg font-black text-white">
                  Добавить новое блюдо и техкарту
                </h2>
                <p className="text-xs text-[#A6AFBC]">
                  Создание позиции меню в соответствии со стандартами школьного питания СанПиН
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-[#7F8998] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDish} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#7F8998] uppercase block mb-1">
                  Название блюда
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Плов школьный с говядиной"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#303744] rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#5B8CFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#7F8998] uppercase block mb-1">
                    Категория блюда
                  </label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full bg-[#171A21] border border-[#303744] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#5B8CFF]"
                  >
                    <option value="Первые блюда" className="bg-[#171A21] text-white">Первые блюда</option>
                    <option value="Вторые блюда" className="bg-[#171A21] text-white">Вторые блюда</option>
                    <option value="Завтраки" className="bg-[#171A21] text-white">Завтраки</option>
                    <option value="Напитки" className="bg-[#171A21] text-white">Напитки</option>
                    <option value="Салаты" className="bg-[#171A21] text-white">Салаты</option>
                    <option value="Выпечка" className="bg-[#171A21] text-white">Выпечка</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#7F8998] uppercase block mb-1">
                    Выход порций (базовый)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newDishYield}
                    onChange={(e) => setNewDishYield(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#171A21] border border-[#303744] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#5B8CFF]"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="text-xs font-bold text-[#7F8998] uppercase block mb-1">
                  URL фотографии блюда (опционально)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newDishImageUrl}
                  onChange={(e) => setNewDishImageUrl(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#303744] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5B8CFF]"
                />
              </div>

              {/* Nutrition Grid (Calories, P, F, C) */}
              <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-[#171A21] border border-[#303744]">
                <div>
                  <label className="text-[10px] font-bold text-[#7F8998] uppercase block">
                    Ккал
                  </label>
                  <input
                    type="number"
                    value={newDishCalories}
                    onChange={(e) => setNewDishCalories(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-transparent font-black text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7F8998] uppercase block">
                    Белки (г)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDishProteins}
                    onChange={(e) => setNewDishProteins(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-black text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7F8998] uppercase block">
                    Жиры (г)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDishFats}
                    onChange={(e) => setNewDishFats(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-black text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7F8998] uppercase block">
                    Углев. (г)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDishCarbs}
                    onChange={(e) => setNewDishCarbs(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-black text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#7F8998] uppercase block mb-1">
                  Краткое описание и подача
                </label>
                <textarea
                  rows={2}
                  placeholder="Соответствие СанПиН, рекомендации подачи..."
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#303744] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5B8CFF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#7F8998] uppercase block mb-1">
                  Технологический процесс (инструкция)
                </label>
                <textarea
                  rows={2}
                  placeholder="Последовательность приготовления по СанПиН..."
                  value={newDishInstructions}
                  onChange={(e) => setNewDishInstructions(e.target.value)}
                  className="w-full bg-[#171A21] border border-[#303744] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5B8CFF]"
                />
              </div>

              {/* Ingredients Builder for Recipe */}
              <div className="border-t border-[#303744] pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">
                    Ингредиенты техкарты (на 1 порцию):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (ingredients.length > 0) {
                        setNewRecipeIngs((prev) => [
                          ...prev,
                          {
                            ingredientId: ingredients[0].id,
                            quantity: 0.05,
                            unit: ingredients[0].baseUnit,
                          },
                        ]);
                      }
                    }}
                    className="text-xs font-bold text-[#5B8CFF] hover:underline cursor-pointer"
                  >
                    + Добавить ингредиент
                  </button>
                </div>

                {newRecipeIngs.map((ingItem, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={ingItem.ingredientId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const found = ingredients.find((i) => i.id === id);
                        const updated = [...newRecipeIngs];
                        updated[idx].ingredientId = id;
                        if (found) updated[idx].unit = found.baseUnit;
                        setNewRecipeIngs(updated);
                      }}
                      className="flex-1 bg-[#171A21] border border-[#303744] rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id} className="bg-[#171A21] text-white">
                          {i.name} ({i.baseUnit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step={0.005}
                      min={0.001}
                      value={ingItem.quantity}
                      onChange={(e) => {
                        const updated = [...newRecipeIngs];
                        updated[idx].quantity = parseFloat(e.target.value) || 0;
                        setNewRecipeIngs(updated);
                      }}
                      className="w-20 bg-[#171A21] border border-[#303744] rounded-xl px-2 py-1.5 text-xs text-right font-bold text-white"
                    />
                    <span className="text-xs text-[#7F8998] w-8">{ingItem.unit}</span>

                    <button
                      type="button"
                      onClick={() =>
                        setNewRecipeIngs((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-[#FF647C] hover:opacity-80 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#303744]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary px-4 py-2.5 text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 text-xs font-bold shadow-md"
                >
                  Создать блюдо
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
