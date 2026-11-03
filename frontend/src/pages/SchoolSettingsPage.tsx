import React, { useEffect, useState } from 'react';
import { canteenApi } from '../api/canteenApi';
import {
  School as SchoolIcon,
  Save,
  AlertTriangle,
  RefreshCw,
  Users,
  Coins,
  MapPin,
  Globe,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Eye,
  EyeOff,
  QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SchoolQrModal } from '../components/SchoolQrModal';

export const SchoolSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('school-24');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('KGS');
  const [totalStudents, setTotalStudents] = useState<number>(650);
  const [isMenuPublished, setIsMenuPublished] = useState<boolean>(true);
  const [allergensVisible, setAllergensVisible] = useState<boolean>(true);

  const loadSchool = async () => {
    try {
      setLoading(true);
      const s = await canteenApi.getSchool();
      setName(s.name || '');
      setSlug(s.slug || 'school-24');
      setAddress(s.address || '');
      setCurrency(s.currency || 'KGS');
      setTotalStudents(s.totalStudents || 650);
      setIsMenuPublished(s.isMenuPublished !== false);
      setAllergensVisible(s.allergensVisible !== false);
    } catch (err) {
      console.error('Ошибка загрузки настроек школы', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchool();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await canteenApi.updateSchool({
        name,
        slug,
        address,
        currency,
        totalStudents,
        isMenuPublished,
        allergensVisible,
      });
      alert('Настройки школы и параметры публикации успешно сохранены!');
    } catch (e: any) {
      alert(e.message || 'Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = `${window.location.origin}/public/${slug || 'school-24'}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublication = async (published: boolean) => {
    try {
      setIsMenuPublished(published);
      await canteenApi.toggleMenuPublication(published);
    } catch (err: any) {
      alert(err.message || 'Не удалось изменить статус публикации');
      setIsMenuPublished(!published);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
          <SchoolIcon className="w-4 h-4" />
          Параметры образовательного учреждения
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          Настройки школы и витрины питания
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Конфигурация школы, управление публикацией меню для школьников и QR-кодами.
        </p>
      </div>

      {/* Public Student Menu Portal & QR Card */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-[var(--surface)] to-[var(--surface)] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Globe className="w-4 h-4" />
              Публичная витрина школьника (0-PII)
            </div>
            <h2 className="text-lg font-bold text-[var(--ink)]">
              QR-код и онлайн-витрина для учеников
            </h2>
            <p className="text-xs text-[var(--muted)] max-w-xl">
              Школьники открывают меню по ссылке или QR-коду на столах столовой без регистрации, видят состав, аллергены и голосуют за блюда.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTogglePublication(!isMenuPublished)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                isMenuPublished
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
              }`}
            >
              {isMenuPublished ? (
                <>
                  <Eye className="w-4 h-4" /> Меню опубликовано
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" /> Меню скрыто
                </>
              )}
            </button>
          </div>
        </div>

        {/* Public link input & QR visual preview */}
        <div className="bg-[var(--bg)] rounded-2xl p-5 border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div
              onClick={() => setShowQrModal(true)}
              className="p-2.5 bg-white rounded-xl border-2 border-emerald-500/30 shadow-xs shrink-0 cursor-pointer hover:border-emerald-500 transition-all group"
              title="Нажмите для увеличения и печати плаката"
            >
              <QRCodeSVG
                value={publicUrl}
                size={84}
                level="M"
                fgColor="#059669"
              />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--ink)]">QR-код витрины столовой</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Активен
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Сканируется любой камерой смартфона. Готов к распечатке для обеденных столов.
              </p>
              <div className="font-mono text-xs text-[var(--ink)] font-semibold truncate bg-[var(--surface)] px-2.5 py-1.5 rounded-lg border border-[var(--border)] max-w-sm">
                {publicUrl}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Плакат и печать QR
            </button>

            <button
              type="button"
              onClick={copyPublicLink}
              className="px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Скопировать ссылку"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>

            <a
              href={`/public/${slug || 'school-24'}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--ink)] text-xs font-bold flex items-center justify-center transition-all"
              title="Открыть в новой вкладке"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1.5 flex items-center gap-1.5">
                <SchoolIcon className="w-4 h-4 text-[var(--accent)]" /> Наименование школы / лицея
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Например: Школа-гимназия №24 им. А. Токомбаева"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-500" /> URL-идентификатор (Slug)
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="school-24"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" /> Фактический адрес
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="г. Бишкек, ул. Тыныстанова, 110"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" /> Общее число учащихся в школе
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                value={totalStudents}
                onChange={e => setTotalStudents(parseInt(e.target.value) || 0)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--muted)] uppercase block mb-1.5 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" /> Валюта взаиморасчетов
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="KGS">KGS (Кыргызский сом)</option>
                <option value="RUB">RUB (Российский рубль)</option>
                <option value="KZT">KZT (Казахстанский тенге)</option>
                <option value="USD">USD (Доллар США)</option>
              </select>
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="pt-2 border-t border-[var(--border)] space-y-3">
            <div className="text-xs font-bold text-[var(--muted)] uppercase">Параметры безопасности и отображения</div>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <input
                type="checkbox"
                checked={allergensVisible}
                onChange={e => setAllergensVisible(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div className="text-xs">
                <span className="font-bold text-[var(--ink)] block flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  Отображать аллергены и предупреждения в публичном меню
                </span>
                <span className="text-[var(--muted)]">
                  Школьники и родители смогут видеть аллергены (глютен, лактоза, яйца и др.) и фильтровать блюда.
                </span>
              </div>
            </label>
          </div>

          {/* Demo Data Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold">Многопользовательская изоляция:</span> Каждая школа видит исключительно свои меню, рецептуры, остатки складов и бронирования. Доступ к чужим блюдам блокируется на уровне сервера (HTTP 403).
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-95 shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </form>
      </div>

      <SchoolQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        schoolName={name || 'Школа-гимназия №24'}
        schoolSlug={slug || 'school-24'}
        address={address}
      />
    </div>
  );
};