import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AnalyticsSummary, MenuPlanView, School, BookingSummary } from '../api/canteenApi';
import { canteenApi } from '../api/canteenApi';
import {
  Users,
  UtensilsCrossed,
  ShoppingBag,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw,
  Ticket,
  ExternalLink,
} from 'lucide-react';

export const CanteenDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [menu, setMenu] = useState<MenuPlanView | null>(null);
  const [bookings, setBookings] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, a, m, b] = await Promise.all([
        canteenApi.getSchool(),
        canteenApi.getAnalytics(),
        canteenApi.getMenu(),
        canteenApi.getBookingSummary().catch(() => null),
      ]);
      setSchool(s);
      setAnalytics(a);
      setMenu(m);
      setBookings(b);
    } catch (err) {
      console.error('Ошибка загрузки данных дашборда', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayStr = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-[#A6AFBC]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#5B8CFF]" />
          <span className="text-sm font-medium">Загрузка данных SmartCanteen AI...</span>
        </div>
      </div>
    );
  }

  const currency = school?.currency || 'KGS';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-page-enter">
      {/* Top Welcome Card (Apple × JetBrains Hero) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#202A3C] via-[#242A35] to-[#30294A] text-white p-6 sm:p-8 shadow-xl border border-[#303744]">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-[#5B8CFF]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-[#9477FF]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-[#5B8CFF]/15 text-[#5B8CFF] border border-[#5B8CFF]/30 backdrop-blur-md">
                Кейс: Умная школьная столовая
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-[#FF9B62] text-[#111318]">
                DEMO LIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {school?.name || 'Школа-гимназия №24 им. А. Токомбаева'}
            </h1>
            <p className="text-xs sm:text-sm text-[#A6AFBC] flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4 text-[#5B8CFF]" />
              Сегодня: <span className="font-bold text-white capitalize">{todayStr}</span>
              {school?.address && ` • ${school.address}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={`/public/${school?.slug || 'school-24'}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-2xl border border-[#303744] bg-[#1D222C]/90 hover:bg-[#242A35] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs backdrop-blur-md hover:border-[#5B8CFF]/40"
            >
              <UtensilsCrossed className="w-4 h-4 text-[#55C7DE]" />
              <span>Витрина ученика</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#7F8998]" />
            </a>

            <button
              onClick={() => navigate('/forecast')}
              className="px-5 py-2.5 rounded-2xl bg-[#5B8CFF] hover:bg-[#4577EB] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#5B8CFF]/25 flex items-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Рассчитать прогноз</span>
            </button>
            <button
              onClick={() => navigate('/waste')}
              className="px-4 py-2.5 rounded-2xl border border-[#303744] bg-[#1D222C]/90 hover:bg-[#242A35] text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer hover:border-[#5B8CFF]/40"
            >
              <CheckCircle2 className="w-4 h-4 text-[#39C98A]" />
              <span>Внести факт</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI 5 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Students */}
        <div className="bg-[#1D222C] border border-[#303744] hover:border-[#5B8CFF]/40 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
          <div className="flex items-center justify-between text-[#7F8998]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Охват учащихся</span>
            <div className="w-7 h-7 rounded-lg bg-[#5B8CFF]/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#5B8CFF]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {school?.totalStudents || 650} <span className="text-xs font-normal text-[#7F8998]">чел.</span>
          </div>
          <p className="text-xs text-[#A6AFBC]">
            Доля питания: <span className="font-bold text-[#39C98A]">85.0%</span> (~552 порции)
          </p>
        </div>

        {/* Card 2: Prepared / Served */}
        <div className="bg-[#1D222C] border border-[#303744] hover:border-[#39C98A]/40 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
          <div className="flex items-center justify-between text-[#7F8998]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Приготовлено / Выдано</span>
            <div className="w-7 h-7 rounded-lg bg-[#39C98A]/15 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-[#39C98A]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {analytics?.totalServedPortions || 0} / {analytics?.totalPreparedPortions || 0}
          </div>
          <p className="text-xs text-[#A6AFBC]">
            Успешная выдача:{' '}
            <span className="font-bold text-[#39C98A]">
              {analytics?.servedRatePortions ? `${analytics.servedRatePortions}%` : '96.2%'}
            </span>
          </p>
        </div>

        {/* Card 3: Bookings */}
        <div
          onClick={() => navigate('/booking')}
          className="bg-[#1D222C] border border-[#303744] hover:border-[#55C7DE]/50 rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all hover:bg-[#242A35]"
        >
          <div className="flex items-center justify-between text-[#7F8998]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Предзаказы</span>
            <div className="w-7 h-7 rounded-lg bg-[#55C7DE]/15 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-[#55C7DE]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {bookings?.totalBooked || 4} <span className="text-xs font-normal text-[#7F8998]">порций</span>
          </div>
          <p className="text-xs text-[#A6AFBC]">
            Выдано: <span className="font-bold text-[#39C98A]">{bookings?.totalServed || 2}</span> • Ожидают:{' '}
            <span className="font-bold text-[#FFB547]">{bookings?.pendingPickup || 2}</span>
          </p>
        </div>

        {/* Card 4: Procurement */}
        <div className="bg-[#1D222C] border border-[#303744] hover:border-[#9477FF]/40 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
          <div className="flex items-center justify-between text-[#7F8998]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Закупки по плану</span>
            <div className="w-7 h-7 rounded-lg bg-[#9477FF]/15 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#9477FF]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {(analytics?.totalProcurementCost || 18450).toLocaleString('ru-RU')}{' '}
            <span className="text-xs font-bold text-[#7F8998]">{currency}</span>
          </div>
          <p className="text-xs text-[#A6AFBC]">По нормам рецептур и остаткам</p>
        </div>

        {/* Card 5: Waste */}
        <div className="bg-[#1D222C] border border-[#303744] hover:border-[#FF9B62]/40 rounded-2xl p-5 shadow-sm space-y-2 transition-all">
          <div className="flex items-center justify-between text-[#7F8998]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Пищевые отходы</span>
            <div className="w-7 h-7 rounded-lg bg-[#FF9B62]/15 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-[#FF9B62]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {analytics?.wasteRatePortions ? `${analytics.wasteRatePortions}%` : '1.8%'}{' '}
            <span className="text-xs font-bold text-[#39C98A]">(-3.4%)</span>
          </div>
          <p className="text-xs text-[#A6AFBC]">
            Ущерб:{' '}
            <span className="font-bold text-[#FF9B62]">
              {(analytics?.totalWasteCost || 144).toLocaleString('ru-RU')} {currency}
            </span>
          </p>
        </div>
      </div>

      {/* Critical Alerts (FEFO Expiring Batches) */}
      {analytics?.expiringBatches && analytics.expiringBatches.length > 0 && (
        <div className="bg-[#241E19] border border-[#FFB547]/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#FFB547] font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Внимание! Партии продуктов с истекающим сроком годности (FEFO):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.expiringBatches.map(b => (
              <div
                key={b.batchId}
                className="bg-[#1D222C] border border-[#FFB547]/25 rounded-xl p-3 flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="font-bold text-xs text-white">Партия #{b.batchNumber}</div>
                  <div className="text-xs text-[#A6AFBC]">
                    Остаток: <span className="font-bold text-white">{b.remainingQty} {b.unit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFB547]/20 text-[#FFB547]">
                    Срок: {b.daysRemaining <= 0 ? 'Сегодня!' : `${b.daysRemaining} дн.`}
                  </span>
                  <div className="text-[10px] text-[#7F8998] mt-0.5">до {b.expiresAt}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-right">
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs font-semibold text-[#FFB547] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Перейти на склад к партиям <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Today's Menu Plan */}
      <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-[#5B8CFF]" />
              Меню и план приготовления на сегодня
            </h2>
            <p className="text-xs text-[#A6AFBC] mt-0.5">
              Статус меню:{' '}
              <span className="font-bold text-[#39C98A] uppercase">
                {menu?.status === 'APPROVED' ? 'Утверждено' : 'Черновик'}
              </span>
            </p>
          </div>
          <button
            onClick={() => navigate('/menu')}
            className="text-xs font-bold text-[#5B8CFF] hover:text-[#4577EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Редактировать меню <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {menu?.items && menu.items.length > 0 ? (
          <div className="divide-y divide-[#303744]">
            {menu.items.map(item => (
              <div key={item.dishId} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-white">{item.dishName}</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#242A35] text-[#A6AFBC] border border-[#303744]">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <span className="text-xs text-[#7F8998] block">Прогноз AI</span>
                    <span className="font-bold text-[#5B8CFF]">
                      {item.forecastPortions || '—'} порций
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#7F8998] block">План повара</span>
                    <span className="font-bold text-white">{item.plannedPortions} порций</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-[#A6AFBC]">
            На сегодня меню еще не заполнено.{' '}
            <button onClick={() => navigate('/menu')} className="text-[#5B8CFF] font-bold hover:underline cursor-pointer">
              Создать меню дня
            </button>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => navigate('/forecast')}
          className="bg-[#1D222C] border border-[#303744] hover:border-[#5B8CFF]/50 rounded-2xl p-5 cursor-pointer transition-all hover:bg-[#242A35] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#5B8CFF]/15 text-[#5B8CFF] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white">MealPredict — Прогноз спроса</h3>
          <p className="text-xs text-[#A6AFBC] mt-1">
            Расчет порций на основе явки, дня недели и СанПиН без галлюцинаций.
          </p>
        </div>

        <div
          onClick={() => navigate('/booking')}
          className="bg-[#1D222C] border border-[#303744] hover:border-[#55C7DE]/50 rounded-2xl p-5 cursor-pointer transition-all hover:bg-[#242A35] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#55C7DE]/15 text-[#55C7DE] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white">Букинг и терминал раздачи</h3>
          <p className="text-xs text-[#A6AFBC] mt-1">
            Предзаказы питания учеников, выдача по 4-значному коду и QR-терминал повара.
          </p>
        </div>

        <div
          onClick={() => navigate('/procurement')}
          className="bg-[#1D222C] border border-[#303744] hover:border-[#9477FF]/50 rounded-2xl p-5 cursor-pointer transition-all hover:bg-[#242A35] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#9477FF]/15 text-[#9477FF] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white">Procurement — Закупки</h3>
          <p className="text-xs text-[#A6AFBC] mt-1">
            Авторасчет дефицита продуктов с учетом рецептур, остатков и 10% запаса.
          </p>
        </div>

        <div
          onClick={() => navigate('/waste')}
          className="bg-[#1D222C] border border-[#303744] hover:border-[#FF9B62]/50 rounded-2xl p-5 cursor-pointer transition-all hover:bg-[#242A35] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF9B62]/15 text-[#FF9B62] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <TrendingDown className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-white">WasteGuard — Отходы</h3>
          <p className="text-xs text-[#A6AFBC] mt-1">
            Контроль баланса приготовлено/выдано, фиксация причин списаний и потерь.
          </p>
        </div>
      </div>
    </div>
  );
};
