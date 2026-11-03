import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Utensils,
  CheckCircle2,
  UserCheck,
  QrCode,
  Search,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { canteenApi, type MealBooking, type BookingSummary, type Dish } from '../api/canteenApi';
import { QRCodeSVG } from 'qrcode.react';

export const BookingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'counter'>('student');
  const [loading, setLoading] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [bookings, setBookings] = useState<MealBooking[]>([]);
  const [summary, setSummary] = useState<BookingSummary | null>(null);

  // Student Form State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [studentName, setStudentName] = useState('Азамат Ибраимов');
  const [grade, setGrade] = useState('7-Б');
  const [selectedDishId, setSelectedDishId] = useState<number | undefined>(undefined);
  const [dietaryNotes, setDietaryNotes] = useState('Без ограничений');
  const [recentTicket, setRecentTicket] = useState<MealBooking | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Counter Terminal State
  const [searchCode, setSearchCode] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    loadDishes();
    loadBookingsAndSummary();
  }, [selectedDate]);

  const loadDishes = async () => {
    try {
      const data = await canteenApi.getDishes();
      setDishes(data);
      if (data.length > 0 && !selectedDishId) {
        setSelectedDishId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load dishes', e);
    }
  };

  const loadBookingsAndSummary = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        canteenApi.getBookings(selectedDate),
        canteenApi.getBookingSummary(selectedDate),
      ]);
      setBookings(list);
      setSummary(sum);
    } catch (e) {
      console.error('Failed to load bookings', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !grade.trim()) return;

    setLoading(true);
    setActionMessage(null);
    try {
      const created = await canteenApi.createBooking({
        studentName: studentName.trim(),
        grade: grade.trim(),
        bookingDate: selectedDate,
        mealType: 'LUNCH',
        dishId: selectedDishId,
        dietaryNotes: dietaryNotes.trim(),
        price: 75.0,
      });
      setRecentTicket(created);
      setActionMessage({ text: `Бронирование успешно оформлено! Код талона: ${created.code}` });
      await loadBookingsAndSummary();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Ошибка оформления бронирования', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleServeByCode = async (codeToServe: string) => {
    if (!codeToServe.trim()) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const served = await canteenApi.serveBookingByCode(codeToServe.trim());
      setActionMessage({ text: `Порция успешно выдана для: ${served.studentName} (${served.dishName})` });
      setSearchCode('');
      await loadBookingsAndSummary();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Не удалось выдать порцию по указанному коду', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleServeById = async (id: number) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const served = await canteenApi.serveBookingById(id);
      setActionMessage({ text: `Порция выдана: ${served.studentName}` });
      await loadBookingsAndSummary();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Ошибка выдачи порции', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Отменить бронирование обеда?')) return;
    setLoading(true);
    setActionMessage(null);
    try {
      await canteenApi.cancelBooking(id);
      setActionMessage({ text: 'Бронирование отменено' });
      await loadBookingsAndSummary();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Ошибка отмены бронирования', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filter Bookings for Counter Table
  const filteredBookings = bookings.filter((b) => {
    const matchesGrade = gradeFilter === 'ALL' || b.grade === gradeFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesGrade && matchesStatus;
  });

  const uniqueGrades = Array.from(new Set(bookings.map((b) => b.grade))).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-page-enter text-[#F5F7FA]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303744]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B8CFF]/15 border border-[#5B8CFF]/30 text-[#5B8CFF] text-xs font-bold mb-1.5">
            <Ticket size={13} />
            <span>SmartCanteen AI • MealBooking System</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Предзаказ и раздача питания
          </h1>
          <p className="text-xs text-[#A6AFBC]">
            Электронное бронирование горячих обедов для школьников, выдача по кодам талонов и учёт явки
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[#1D222C] border border-[#303744] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-[#5B8CFF] text-white shadow-sm'
                : 'text-[#A6AFBC] hover:text-white'
            }`}
          >
            <UserCheck size={15} />
            <span>Школьник / Родитель</span>
          </button>
          <button
            onClick={() => setActiveTab('counter')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'counter'
                ? 'bg-[#5B8CFF] text-white shadow-sm'
                : 'text-[#A6AFBC] hover:text-white'
            }`}
          >
            <QrCode size={15} />
            <span>Терминал раздачи</span>
          </button>
        </div>
      </div>

      {/* Global Action Message */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
            actionMessage.isError
              ? 'bg-[#FF647C]/15 border-[#FF647C]/30 text-[#FF647C]'
              : 'bg-[#39C98A]/15 border-[#39C98A]/30 text-[#39C98A]'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer text-white"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* TAB 1: Student / Parent Pre-Order */}
      {activeTab === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form (2 cols) */}
          <div className="lg:col-span-2 bg-[#1D222C] border border-[#303744] rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#303744]">
              <div className="flex items-center gap-2">
                <Utensils className="text-[#5B8CFF]" size={18} />
                <h2 className="text-base font-bold text-white">
                  Оформление талона на горячий обед
                </h2>
              </div>
              <span className="text-xs font-bold text-[#55C7DE] bg-[#55C7DE]/15 border border-[#55C7DE]/30 px-2.5 py-1 rounded-full">
                75.00 сом / комплекс
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="block text-xs font-bold text-[#7F8998] uppercase mb-2">
                Быстрый выбор ученика (Демо)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Азамат Ибраимов', g: '7-Б' },
                  { name: 'Айгерим Садыкова', g: '9-А' },
                  { name: 'Дастан Оморов', g: '4-В' },
                  { name: 'Камила Жумабекова', g: '11-Б' },
                ].map((demo) => (
                  <button
                    key={demo.name}
                    type="button"
                    onClick={() => {
                      setStudentName(demo.name);
                      setGrade(demo.g);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      studentName === demo.name
                        ? 'border-[#5B8CFF] bg-[#5B8CFF]/20 text-white font-bold'
                        : 'border-[#303744] hover:bg-[#242A35] text-[#A6AFBC]'
                    }`}
                  >
                    {demo.name} ({demo.g})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    ФИО Ученика
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Фамилия Имя"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#303744] bg-[#171A21] text-sm text-white focus:outline-none focus:border-[#5B8CFF] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">Класс</label>
                  <input
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Например: 7-Б"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#303744] bg-[#171A21] text-sm text-white focus:outline-none focus:border-[#5B8CFF] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Дата питания
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#303744] bg-[#171A21] text-sm text-white focus:outline-none focus:border-[#5B8CFF] transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Диетические особенности
                  </label>
                  <select
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#303744] bg-[#171A21] text-sm text-white focus:outline-none focus:border-[#5B8CFF] transition-colors cursor-pointer"
                  >
                    <option value="Без ограничений" className="bg-[#171A21] text-white">Без ограничений (Стандарт)</option>
                    <option value="Халяль" className="bg-[#171A21] text-white">Халяль</option>
                    <option value="Без лактозы" className="bg-[#171A21] text-white">Без лактозы</option>
                    <option value="Без глютена" className="bg-[#171A21] text-white">Без глютена</option>
                    <option value="Вегетарианское" className="bg-[#171A21] text-white">Вегетарианское</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Выбор основного блюда из меню столовой
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {dishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => setSelectedDishId(dish.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        selectedDishId === dish.id
                          ? 'border-[#5B8CFF] bg-[#5B8CFF]/15 shadow-sm'
                          : 'border-[#303744] hover:border-[#5B8CFF]/50 bg-[#171A21]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white leading-snug">
                          {dish.name}
                        </span>
                        {selectedDishId === dish.id && (
                          <CheckCircle2 size={16} className="text-[#5B8CFF] shrink-0 mt-0.5" />
                        )}
                      </div>
                      <span className="text-[11px] text-[#A6AFBC] mt-1">{dish.category}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#5B8CFF] hover:bg-[#4577EB] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Ticket size={18} />
                  <span>
                    {loading ? 'Формирование талона...' : 'Забронировать горячий обед (75 сом)'}
                  </span>
                </button>
                <p className="text-[11px] text-[#7F8998] text-center mt-2">
                  Талон сохраняется в системе и автоматически передается в план заготовок повара
                </p>
              </div>
            </form>
          </div>

          {/* Ticket Card / Status (1 col) */}
          <div className="space-y-6">
            {recentTicket ? (
              <div className="bg-[#1D222C] border-2 border-[#5B8CFF]/40 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#303744]">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#5B8CFF] uppercase tracking-wide">
                    <Sparkles size={14} />
                    <span>Электронный талон</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#39C98A]/20 text-[#39C98A] border border-[#39C98A]/30">
                    {recentTicket.status}
                  </span>
                </div>

                <div className="text-center py-4 px-3 bg-[#171A21] rounded-2xl border border-[#303744] flex flex-col items-center">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs mb-3">
                    <QRCodeSVG
                      value={recentTicket.code}
                      size={130}
                      level="M"
                      fgColor="#111318"
                    />
                  </div>
                  <span className="text-xs text-[#A6AFBC] block mb-1">Код для получения на раздаче:</span>
                  <div className="text-3xl font-black text-[#5B8CFF] font-mono tracking-wider">
                    {recentTicket.code}
                  </div>
                  <button
                    onClick={() => copyToClipboard(recentTicket.code)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#A6AFBC] hover:text-[#5B8CFF] mt-2 cursor-pointer font-semibold"
                  >
                    {copiedCode ? <Check size={14} className="text-[#39C98A]" /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Скопировано!' : 'Скопировать код'}</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#303744]">
                    <span className="text-[#7F8998]">Ученик:</span>
                    <span className="font-bold text-white">{recentTicket.studentName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#303744]">
                    <span className="text-[#7F8998]">Класс:</span>
                    <span className="font-bold text-white">{recentTicket.grade}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#303744]">
                    <span className="text-[#7F8998]">Дата:</span>
                    <span className="font-bold text-white">{recentTicket.bookingDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#303744]">
                    <span className="text-[#7F8998]">Блюдо:</span>
                    <span className="font-bold text-white text-right">{recentTicket.dishName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#303744]">
                    <span className="text-[#7F8998]">Диета:</span>
                    <span className="font-semibold text-[#55C7DE]">{recentTicket.dietaryNotes || 'Обычный'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#7F8998]">К оплате:</span>
                    <span className="font-extrabold text-white">{recentTicket.price} сом</span>
                  </div>
                </div>

                <div className="p-3 bg-[#5B8CFF]/10 border border-[#5B8CFF]/20 rounded-xl text-[11px] text-[#A6AFBC] leading-relaxed flex items-start gap-2">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#5B8CFF]" />
                  <span>
                    Покажите этот код в школьной столовой на раздаче питания во время обеденной перемены.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#5B8CFF]/15 text-[#5B8CFF] flex items-center justify-center mx-auto">
                  <QrCode size={24} />
                </div>
                <h3 className="text-sm font-bold text-white">Цифровой талон школьника</h3>
                <p className="text-xs text-[#A6AFBC] leading-relaxed">
                  Заполните форму слева для предзаказа обеда. После нажатия сформируется уникальный код получения.
                </p>
              </div>
            )}

            {/* Quick Rules */}
            <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-5 space-y-2.5 text-xs text-[#A6AFBC]">
              <span className="font-bold text-white block text-xs uppercase tracking-wider">
                Правила предзаказа питания:
              </span>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Бронирование принимается до 09:30 текущего учебного дня.</li>
                <li>Каждая заявка учитывается в расчёте потребности продуктов по СанПиН.</li>
                <li>При болезни ученика бронь можно отменить без списания средств.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Canteen Counter Terminal (Терминал раздачи) */}
      {activeTab === 'counter' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-[#7F8998] uppercase font-bold">Всего предзаказов</span>
                <div className="text-2xl font-black text-white">{summary.totalBooked}</div>
                <span className="text-[10px] text-[#5B8CFF] font-bold">На дату: {summary.date}</span>
              </div>
              <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-[#7F8998] uppercase font-bold">Выдано порций</span>
                <div className="text-2xl font-black text-[#39C98A]">{summary.totalServed}</div>
                <span className="text-[10px] text-[#A6AFBC]">
                  {summary.totalBooked > 0 ? Math.round((summary.totalServed / summary.totalBooked) * 100) : 0}% явки
                </span>
              </div>
              <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-[#7F8998] uppercase font-bold">Ожидают на раздаче</span>
                <div className="text-2xl font-black text-[#FFB547]">{summary.pendingPickup}</div>
                <span className="text-[10px] text-[#A6AFBC]">горячих блюд</span>
              </div>
              <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-[#7F8998] uppercase font-bold">Сумма питания</span>
                <div className="text-2xl font-black text-white">{summary.totalRevenueKgs} сом</div>
                <span className="text-[10px] text-[#39C98A] font-bold">По 75 сом/комплекс</span>
              </div>
            </div>
          )}

          {/* Quick Code Scanner Input */}
          <div className="bg-gradient-to-r from-[#202A3C] to-[#30294A] border border-[#303744] rounded-2xl p-6 shadow-md">
            <div className="max-w-2xl mx-auto space-y-3 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <QrCode className="text-[#5B8CFF]" size={20} />
                  <span className="font-extrabold text-sm text-white">
                    Экспресс-выдача порции по коду талона
                  </span>
                </div>
                <span className="text-xs text-[#A6AFBC]">Например: SC-7841, SC-7843</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleServeByCode(searchCode);
                    }}
                    placeholder="Введите код талона (SC-XXXX)"
                    className="w-full px-4 py-3 rounded-xl border border-[#303744] bg-[#171A21] text-lg font-mono font-bold text-white tracking-wider focus:outline-none focus:border-[#5B8CFF] uppercase"
                  />
                  {searchCode && (
                    <button
                      onClick={() => setSearchCode('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7F8998] hover:text-white"
                    >
                      Очистить
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleServeByCode(searchCode)}
                  disabled={loading || !searchCode.trim()}
                  className="px-6 py-3 rounded-xl bg-[#5B8CFF] hover:bg-[#4577EB] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <CheckCircle2 size={18} />
                  <span>Выдать порцию</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bookings List Table & Filters */}
          <div className="bg-[#1D222C] border border-[#303744] rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#303744]">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-[#7F8998]" />
                <h3 className="text-sm font-bold text-white">
                  Журнал предзаказов на {selectedDate} ({filteredBookings.length})
                </h3>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Date Picker */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[#303744] bg-[#171A21] text-xs text-white">
                  <Calendar size={13} className="text-[#5B8CFF]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-xs text-white cursor-pointer"
                  />
                </div>

                {/* Grade Filter */}
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-[#303744] bg-[#171A21] text-xs text-white cursor-pointer"
                >
                  <option value="ALL">Все классы</option>
                  {uniqueGrades.map((g) => (
                    <option key={g} value={g}>
                      {g} класс
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-[#303744] bg-[#171A21] text-xs text-white cursor-pointer"
                >
                  <option value="ALL">Все статусы</option>
                  <option value="CONFIRMED">Ожидают выдачи</option>
                  <option value="SERVED">Выдано</option>
                  <option value="CANCELLED">Отменено</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#A6AFBC]">
                Нет оформленных предзаказов по выбранным фильтрам
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#303744] text-[#7F8998] uppercase font-bold text-[10px]">
                      <th className="py-2.5 px-3">Код</th>
                      <th className="py-2.5 px-3">Ученик</th>
                      <th className="py-2.5 px-3">Класс</th>
                      <th className="py-2.5 px-3">Блюдо</th>
                      <th className="py-2.5 px-3">Диета</th>
                      <th className="py-2.5 px-3">Статус</th>
                      <th className="py-2.5 px-3 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#303744]">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#242A35]/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#5B8CFF]">
                          {b.code}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">{b.studentName}</td>
                        <td className="py-3 px-3 text-white font-semibold">{b.grade}</td>
                        <td className="py-3 px-3 text-white">{b.dishName}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              b.dietaryNotes && b.dietaryNotes !== 'Без ограничений'
                                ? 'bg-[#FFB547]/15 text-[#FFB547] border border-[#FFB547]/30'
                                : 'bg-[#242A35] text-[#A6AFBC] border border-[#303744]'
                            }`}
                          >
                            {b.dietaryNotes || 'Стандарт'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              b.status === 'SERVED'
                                ? 'bg-[#39C98A]/15 text-[#39C98A] border border-[#39C98A]/30'
                                : b.status === 'CONFIRMED'
                                ? 'bg-[#FFB547]/15 text-[#FFB547] border border-[#FFB547]/30'
                                : 'bg-[#FF647C]/15 text-[#FF647C] border border-[#FF647C]/30'
                            }`}
                          >
                            {b.status === 'SERVED' ? 'Выдано' : b.status === 'CONFIRMED' ? 'Ожидает' : 'Отменено'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          {b.status === 'CONFIRMED' && (
                            <>
                              <button
                                onClick={() => handleServeById(b.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#5B8CFF] hover:bg-[#4577EB] text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                              >
                                Выдать
                              </button>
                              <button
                                onClick={() => handleCancel(b.id)}
                                className="px-2 py-1 rounded-lg border border-[#FF647C]/40 text-[#FF647C] hover:bg-[#FF647C]/10 text-[11px] transition-all cursor-pointer"
                              >
                                Отмена
                              </button>
                            </>
                          )}
                          {b.status === 'SERVED' && (
                            <span className="text-[11px] text-[#A6AFBC] flex items-center justify-end gap-1">
                              <CheckCircle2 size={13} className="text-[#39C98A]" />
                              <span>Выдано</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
