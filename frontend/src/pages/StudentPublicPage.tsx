import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { canteenApi } from '../api/canteenApi';
import type {
  PublicSchoolInfo,
  PublicMenuPlan,
  PublicDish,
  Allergen,
} from '../api/canteenApi';
import {
  UtensilsCrossed,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Heart,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Info,
  Sparkles,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';

export const StudentPublicPage: React.FC = () => {
  const { schoolSlug = 'school-24' } = useParams<{ schoolSlug: string }>();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [school, setSchool] = useState<PublicSchoolInfo | null>(null);
  const [todayMenu, setTodayMenu] = useState<PublicMenuPlan | null>(null);
  const [weekMenu, setWeekMenu] = useState<PublicMenuPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'info'>('today');
  const [selectedAllergenFilter, setSelectedAllergenFilter] = useState<string | null>(null);
  const [votedDishes, setVotedDishes] = useState<Record<number, boolean>>({});
  const [voteLoading, setVoteLoading] = useState<number | null>(null);

  // Anonymous session ID for 0-PII voting
  const [sessionId] = useState<string>(() => {
    let sid = localStorage.getItem('smartcanteen_sid');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem('smartcanteen_sid', sid);
    }
    return sid;
  });

  const getDishes = (plan?: PublicMenuPlan | null): PublicDish[] => plan?.dishes || plan?.items || [];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [schoolData, todayData, weekData] = await Promise.all([
        canteenApi.getPublicSchoolInfo(schoolSlug),
        canteenApi.getPublicTodayMenu(schoolSlug, sessionId),
        canteenApi.getPublicWeekMenu(schoolSlug, sessionId),
      ]);
      setSchool(schoolData);
      setTodayMenu(todayData);
      setWeekMenu(weekData);

      const votedMap: Record<number, boolean> = {};
      const allDishes = [...getDishes(todayData)];
      weekData?.forEach(w => allDishes.push(...getDishes(w)));
      allDishes.forEach(d => {
        if (d.userVoted) votedMap[d.id] = true;
      });
      setVotedDishes(votedMap);
    } catch (err: any) {
      console.error('Ошибка загрузки публичного меню', err);
      setError(err.message || 'Не удалось загрузить меню школы. Проверьте ссылку.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolSlug]);

  const handleVote = async (dish: PublicDish, date: string) => {
    if (voteLoading === dish.id) return;
    try {
      setVoteLoading(dish.id);
      const res = await canteenApi.votePreference(schoolSlug, {
        dishId: dish.id,
        date: date || new Date().toISOString().split('T')[0],
        sessionId,
      });

      // Update local voted state (backend toggles true/false)
      setVotedDishes(prev => ({ ...prev, [dish.id]: res.voted }));

      // Update vote counts in todayMenu
      if (todayMenu) {
        const updateDishList = (list: PublicDish[]) =>
          list.map(d =>
            d.id === dish.id
              ? {
                  ...d,
                  votesCount: res.votesCount,
                  studentVotesCount: res.votesCount,
                  userVoted: res.voted,
                }
              : d
          );
        setTodayMenu({
          ...todayMenu,
          dishes: updateDishList(getDishes(todayMenu)),
          items: updateDishList(getDishes(todayMenu)),
        });
      }
    } catch (err: any) {
      console.error('Ошибка голосования', err);
    } finally {
      setVoteLoading(null);
    }
  };

  const getAllergensList = (): Allergen[] => {
    const map = new Map<string, Allergen>();
    getDishes(todayMenu).forEach(dish => {
      dish.allergens?.forEach(a => map.set(a.code, a));
    });
    return Array.from(map.values());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111318] text-[#F5F7FA] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-[#1D222C] border border-[#303744] text-[#5B8CFF] flex items-center justify-center shadow-2xl animate-pulse mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <p className="text-base font-bold text-white">Загрузка меню столовой...</p>
        <p className="text-xs text-[#7F8998] mt-1">SmartCanteen AI • Без сбора персональных данных (Zero-PII)</p>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-[#111318] text-[#F5F7FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FF647C]/15 border border-[#FF647C]/30 text-[#FF647C] flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-extrabold text-white mb-2">Столовая не найдена</h1>
        <p className="text-sm text-[#A6AFBC] max-w-md mb-6">{error || 'Проверьте адрес ссылки или QR-код школы.'}</p>
        <button
          onClick={loadData}
          className="btn-primary px-5 py-2.5"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const isPublished = school.isMenuPublished !== false;
  const todayDishes = getDishes(todayMenu);
  const filteredTodayDishes = selectedAllergenFilter
    ? todayDishes.filter(d => !d.allergens?.some(a => a.code === selectedAllergenFilter))
    : todayDishes;

  return (
    <div className="min-h-screen bg-[#111318] text-[#F5F7FA] font-sans pb-16 transition-colors duration-200">
      {/* Top Banner / School Profile Header (Apple × JetBrains Premium Graphite) */}
      <header className="bg-gradient-to-br from-[#202A3C] via-[#242A35] to-[#30294A] text-white border-b border-[#303744] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#5B8CFF]/15 pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-[#9477FF]/10 pointer-events-none blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-6 relative z-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B8CFF]/15 border border-[#5B8CFF]/30 backdrop-blur-md text-xs font-bold tracking-wide text-[#5B8CFF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Школьное питание SmartCanteen</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#55C7DE]/20 text-[#55C7DE] border border-[#55C7DE]/30">
                0-PII
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-[#1D222C] border border-[#303744] hover:bg-[#2D3543] text-[#A6AFBC] hover:text-white transition-colors cursor-pointer"
                title="Переключить тему оформления"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-[#FFB547]" /> : <Moon className="w-4 h-4 text-[#A58BFA]" />}
              </button>

              <Link
                to="/account"
                className="text-xs text-[#F5F7FA] hover:text-white px-3.5 py-2 rounded-xl bg-[#1D222C] border border-[#303744] hover:bg-[#2D3543] hover:border-[#5B8CFF]/40 transition-colors font-bold"
              >
                Вход для персонала
              </Link>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{school.name}</h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-[#A6AFBC]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#5B8CFF]" />
              <span>{school.address || 'г. Бишкек'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#55C7DE]" />
              <span>Столовая открыта с 08:30 до 16:30</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-[#303744] pt-2 relative z-10">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'today'
                ? 'border-[#5B8CFF] text-white'
                : 'border-transparent text-[#7F8998] hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-[#5B8CFF]" />
            Сегодня
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'week'
                ? 'border-[#5B8CFF] text-white'
                : 'border-transparent text-[#7F8998] hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#55C7DE]" />
            На неделю
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#5B8CFF] text-white'
                : 'border-transparent text-[#7F8998] hover:text-white'
            }`}
          >
            <Info className="w-4 h-4 text-[#9477FF]" />
            О столовой и стандартах
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {!isPublished ? (
          <div className="bg-[#1D222C] border border-[#FFB547]/30 rounded-2xl p-8 text-center my-6 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#FFB547]/15 text-[#FFB547] flex items-center justify-center mx-auto mb-4 border border-[#FFB547]/20">
              <Clock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Меню на сегодня формируется</h2>
            <p className="text-sm text-[#A6AFBC] max-w-md mx-auto">
              Шеф-повар и технологи школьной столовой обновляют рацион в соответствии с нормами СанПиН. Загляните чуть позже!
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: TODAY */}
            {activeTab === 'today' && (
              <div className="space-y-6 animate-page-enter">
                {/* Allergen Safe Filter Bar */}
                {school.allergensVisible && getAllergensList().length > 0 && (
                  <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wide">
                        <ShieldAlert className="w-4 h-4 text-[#FFB547]" />
                        Фильтр аллергенов (исключить из показа):
                      </div>
                      {selectedAllergenFilter && (
                        <button
                          onClick={() => setSelectedAllergenFilter(null)}
                          className="text-xs text-[#5B8CFF] font-semibold hover:underline cursor-pointer"
                        >
                          Сбросить фильтр
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getAllergensList().map(allergen => {
                        const isSelected = selectedAllergenFilter === allergen.code;
                        return (
                          <button
                            key={allergen.code}
                            onClick={() =>
                              setSelectedAllergenFilter(isSelected ? null : allergen.code)
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF647C]/20 border-[#FF647C]/50 text-white font-bold shadow-xs'
                                : 'bg-[#171A21] border-[#303744] text-[#A6AFBC] hover:text-white hover:bg-[#242A35]'
                            }`}
                          >
                            <span>Без: {allergen.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedAllergenFilter && (
                      <p className="text-[11px] text-[#A6AFBC] mt-1">
                        Скрыты блюда, содержащие аллерген: <span className="font-bold text-white">{selectedAllergenFilter}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Date header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Рацион на сегодня
                    </h2>
                    <p className="text-xs text-[#A6AFBC] capitalize">
                      {todayMenu?.date ? new Date(todayMenu.date).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Сегодня'}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-[#5B8CFF] bg-[#5B8CFF]/15 px-3 py-1.5 rounded-xl border border-[#5B8CFF]/30 shadow-xs">
                    {filteredTodayDishes.length} блюд в меню
                  </div>
                </div>

                {filteredTodayDishes.length === 0 ? (
                  <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-8 text-center text-[#A6AFBC]">
                    Нет блюд, соответствующих выбранным критериям.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredTodayDishes.map(dish => {
                      const isVoted = votedDishes[dish.id] || false;
                      return (
                        <div
                          key={dish.id}
                          className="bg-[#1D222C] border border-[#303744] hover:border-[#5B8CFF]/50 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md group duration-200"
                        >
                          {/* Dish Image */}
                          <div className="relative h-44 w-full bg-[#171A21] overflow-hidden">
                            {dish.imageUrl ? (
                              <img
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e: any) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#242A35] to-[#1D222C] text-[#5B8CFF]">
                                <UtensilsCrossed className="w-12 h-12 stroke-[1.5]" />
                                <span className="text-xs font-semibold mt-2 text-white">
                                  {dish.category}
                                </span>
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wide border border-white/10">
                                {dish.category}
                              </span>
                            </div>

                            {/* Votes count badge */}
                            <div className="absolute top-3 right-3 bg-[#1D222C]/90 backdrop-blur-md border border-[#303744] px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-xs">
                              <Heart className="w-3.5 h-3.5 fill-[#FF647C] text-[#FF647C]" />
                              <span>{dish.studentVotesCount || 0}</span>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <h3 className="text-base font-bold text-white mb-1 leading-snug group-hover:text-[#5B8CFF] transition-colors">
                                {dish.name}
                              </h3>
                              <p className="text-xs text-[#A6AFBC] line-clamp-2 leading-relaxed">
                                {dish.description || 'Приготовлено из натуральных отборных продуктов по стандарту школьного питания.'}
                              </p>

                              {/* KBJU Nutritional Facts */}
                              <div className="mt-3 grid grid-cols-4 gap-1.5 bg-[#171A21] rounded-xl p-2.5 text-center border border-[#303744]">
                                <div>
                                  <div className="text-[10px] text-[#7F8998] font-bold uppercase">Ккал</div>
                                  <div className="text-xs font-extrabold text-white flex items-center justify-center gap-0.5">
                                    <Flame className="w-3 h-3 text-[#FFB547] inline" />
                                    {dish.calories || 240}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-[#7F8998] font-bold uppercase">Белки</div>
                                  <div className="text-xs font-extrabold text-white">
                                    {dish.proteins ? Number(dish.proteins).toFixed(1) : '12'}г
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-[#7F8998] font-bold uppercase">Жиры</div>
                                  <div className="text-xs font-extrabold text-white">
                                    {dish.fats ? Number(dish.fats).toFixed(1) : '8'}г
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-[#7F8998] font-bold uppercase">Углев.</div>
                                  <div className="text-xs font-extrabold text-white">
                                    {dish.carbs ? Number(dish.carbs).toFixed(1) : '26'}г
                                  </div>
                                </div>
                              </div>

                              {/* Ingredients summary */}
                              {dish.ingredientsSummary && dish.ingredientsSummary.length > 0 && (
                                <div className="mt-2.5 text-[11px] text-[#A6AFBC]">
                                  <span className="font-semibold text-white">Ингредиенты: </span>
                                  {dish.ingredientsSummary.join(', ')}
                                </div>
                              )}

                              {/* Allergen Badges */}
                              {school.allergensVisible && dish.allergens && dish.allergens.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-[#303744]">
                                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-[#FFB547] uppercase tracking-wide">
                                    <ShieldAlert className="w-3 h-3" /> Содержит аллергены:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {dish.allergens.map(al => (
                                      <span
                                        key={al.code}
                                        title={al.description}
                                        className="px-2 py-0.5 rounded-lg bg-[#FF647C]/15 border border-[#FF647C]/30 text-[#FF647C] text-[10px] font-semibold"
                                      >
                                        {al.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Vote / Choose Action Button with toggle capability */}
                            <div className="pt-2 border-t border-[#303744] flex items-center justify-between gap-3">
                              <span className="text-[11px]">
                                {isVoted ? (
                                  <span className="font-bold text-[#39C98A] flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Выбранный вариант
                                  </span>
                                ) : (
                                  <span className="text-[#7F8998]">Планируете кушать?</span>
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleVote(dish, todayMenu?.date || '')}
                                disabled={voteLoading === dish.id}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                  isVoted
                                    ? 'bg-[#39C98A]/20 hover:bg-[#FF647C]/20 text-[#39C98A] hover:text-[#FF647C] border border-[#39C98A]/40 hover:border-[#FF647C]/40'
                                    : 'btn-primary'
                                }`}
                                title={isVoted ? 'Нажмите, чтобы отменить выбор' : 'Отметить, что будете кушать это блюдо'}
                              >
                                {voteLoading === dish.id ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Секунду...</span>
                                  </>
                                ) : isVoted ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#39C98A]" />
                                    <span>Выбрано</span>
                                  </>
                                ) : (
                                  <>
                                    <Heart className="w-3.5 h-3.5" />
                                    <span>Буду кушать</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: WEEK */}
            {activeTab === 'week' && (
              <div className="space-y-6 animate-page-enter">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Меню на текущую неделю
                  </h2>
                  <p className="text-xs text-[#A6AFBC]">
                    Сбалансированное пятидневное цикличное меню столовой по стандартам СанПиН
                  </p>
                </div>

                {weekMenu.length === 0 ? (
                  <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-8 text-center text-[#A6AFBC]">
                    Меню на неделю формируется администрацией столовой.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {weekMenu.map((dayPlan, index) => {
                      const dayDate = new Date(dayPlan.date);
                      const isToday =
                        todayMenu?.date &&
                        new Date(todayMenu.date).toDateString() === dayDate.toDateString();

                      return (
                        <div
                          key={dayPlan.date || index}
                          className={`bg-[#1D222C] border rounded-2xl p-5 transition-all shadow-sm ${
                            isToday ? 'border-[#5B8CFF] ring-2 ring-[#5B8CFF]/20' : 'border-[#303744]'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-[#303744] mb-3">
                            <div>
                              <div className="text-sm font-black text-white capitalize">
                                {dayDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
                              </div>
                              <div className="text-xs text-[#7F8998]">
                                {dayDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                              </div>
                            </div>
                            {isToday && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#5B8CFF]/15 border border-[#5B8CFF]/30 text-[#5B8CFF] text-[11px] font-bold">
                                Сегодня
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {getDishes(dayPlan).length === 0 ? (
                              <p className="text-xs text-[#A6AFBC] col-span-full py-2">
                                Блюда на этот день уточняются
                              </p>
                            ) : (
                              getDishes(dayPlan).map(dish => (
                                <div
                                  key={dish.id}
                                  className="bg-[#171A21] rounded-xl p-3 border border-[#303744] flex items-start gap-3"
                                >
                                  {dish.imageUrl ? (
                                    <img
                                      src={dish.imageUrl}
                                      alt={dish.name}
                                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#303744]"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-[#242A35] text-[#5B8CFF] border border-[#303744] flex items-center justify-center shrink-0">
                                      <UtensilsCrossed className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[10px] font-bold text-[#7F8998] uppercase">
                                      {dish.category}
                                    </div>
                                    <div className="text-xs font-bold text-white truncate">
                                      {dish.name}
                                    </div>
                                    <div className="text-[11px] text-[#A6AFBC] mt-0.5">
                                      {dish.calories || 250} ккал
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CANTEEN INFO & SANPIN STANDARDS */}
            {activeTab === 'info' && (
              <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm animate-page-enter">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    О столовой и стандартах питания
                  </h2>
                  <p className="text-xs text-[#A6AFBC] mt-1">
                    Школа гарантирует качество, свежесть и безопасность каждого блюда
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#171A21] rounded-2xl p-4 border border-[#303744] space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-[#39C98A]/15 text-[#39C98A] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-white">СанПиН и ГОСТ</div>
                    <p className="text-xs text-[#A6AFBC] leading-relaxed">
                      Все рационы составляются согласно санитарным нормам школьного питания. Калорийность и баланс белков, жиров и углеводов строго контролируются.
                    </p>
                  </div>

                  <div className="bg-[#171A21] rounded-2xl p-4 border border-[#303744] space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-[#5B8CFF]/15 text-[#5B8CFF] flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-white">Контроль свежести FEFO</div>
                    <p className="text-xs text-[#A6AFBC] leading-relaxed">
                      Ингредиенты расходуются по алгоритму First-Expired-First-Out. Продукты с истекающим сроком годности списываются автоматически.
                    </p>
                  </div>

                  <div className="bg-[#171A21] rounded-2xl p-4 border border-[#303744] space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FFB547]/15 text-[#FFB547] flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-white">Маркировка аллергенов</div>
                    <p className="text-xs text-[#A6AFBC] leading-relaxed">
                      Каждое блюдо проверено на наличие 8 основных аллергенов (глютен, лактоза, яйца, рыба, орехи, сельдерей, соя, горчица).
                    </p>
                  </div>

                  <div className="bg-[#171A21] rounded-2xl p-4 border border-[#303744] space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-[#9477FF]/15 text-[#9477FF] flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-white">Защита приватности детей</div>
                    <p className="text-xs text-[#A6AFBC] leading-relaxed">
                      Сервис работает анонимно. Мы не собираем ФИО, номера телефонов и персональные данные школьников (Zero-PII).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#5B8CFF]/10 border border-[#5B8CFF]/20 text-xs text-[#A6AFBC] space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-[#5B8CFF]" />
                    Режим работы раздачи:
                  </div>
                  <div>• 09:15 – 09:35 (Завтрак 1-4 классы)</div>
                  <div>• 10:15 – 10:35 (Завтрак 5-11 классы)</div>
                  <div>• 12:00 – 14:00 (Горячий комплексный обед)</div>
                  <div>• 15:00 – 16:30 (Полдник и свежая выпечка)</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 text-center text-xs text-[#7F8998] space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span>SmartCanteen AI • {school.name}</span>
          <span>•</span>
          <Link to="/account" className="underline hover:text-white">Вход для персонала</Link>
        </div>
        <p className="text-[11px] text-[#7F8998]">
          Цифровая платформа школьного питания без сбора персональных данных школьников (Zero-PII).
        </p>
      </footer>
    </div>
  );
};
