import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../api/client';
import {
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Library,
  Download,
  Send,
  CheckCircle2,
  Layers,
  Sliders,
  Play,
  RefreshCw,
} from 'lucide-react';

interface CreativeTaskResponse {
  id: number;
  type: 'IMAGE' | 'VIDEO';
  provider: string;
  model: string;
  prompt: string;
  aspectRatio: string;
  style: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  resultUrl?: string;
  errorMessage?: string;
  createdAt: string;
}

interface MediaAssetResponse {
  id: number;
  taskId?: number;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  width: number;
  height: number;
  durationSeconds?: number;
  createdAt: string;
}

interface CreativePreset {
  id: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  defaultAspectRatio: string;
  suggestedBadge: string;
  suggestedPrice?: string;
  suggestedCta: string;
  category: string;
}

const STYLE_OPTIONS = [
  { value: 'STUDIO_COMMERCIAL', label: 'Студийное фото (Чистый свет)' },
  { value: 'DARK_LUXURY', label: 'Тёмный люкс (Премиум-неоны)' },
  { value: 'VIBRANT_POP', label: 'Яркий поп (Контрастные цвета)' },
  { value: 'MINIMALIST', label: 'Минимализм & Эко' },
  { value: 'COFFEE_AESTHETIC', label: 'Тёплый уютный свет' },
];

const PLATFORM_OPTIONS = ['TELEGRAM', 'VK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK'];

export const CreativeStudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'IMAGE' | 'VIDEO' | 'LIBRARY'>('IMAGE');

  // Form State
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('STUDIO_COMMERCIAL');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [cameraMotion, setCameraMotion] = useState('SLOW_ZOOM_IN');

  // Deterministic Overlay state
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [price, setPrice] = useState('');
  const [badgeText, setBadgeText] = useState('Хит продаж');
  const [ctaText, setCtaText] = useState('Заказать');
  const [overlayPosition, setOverlayPosition] = useState('BOTTOM_CENTER');

  // Processing & Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTask, setActiveTask] = useState<CreativeTaskResponse | null>(null);
  const [latestMedia, setLatestMedia] = useState<MediaAssetResponse | null>(null);
  const [mediaList, setMediaList] = useState<MediaAssetResponse[]>([]);
  const [presets, setPresets] = useState<CreativePreset[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Attach to post modal
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachTargetMedia, setAttachTargetMedia] = useState<MediaAssetResponse | null>(null);
  const [targetPlatform, setTargetPlatform] = useState('TELEGRAM');
  const [postCaption, setPostCaption] = useState('');
  const [attachSuccessMessage, setAttachSuccessMessage] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  const taskPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load brand memory, presets & media gallery dynamically
  useEffect(() => {
    loadBrandInfo();
    loadPresets();
    loadMedia();
    // Cleanup polling on unmount
    return () => {
      if (taskPollRef.current) {
        clearInterval(taskPollRef.current);
      }
    };
  }, []);

  const loadBrandInfo = async () => {
    try {
      const brand = await apiRequest<any>('/brands/me');
      if (brand && brand.name) {
        setBrandName(brand.name);
        if (brand.facts) {
          try {
            const factsObj = typeof brand.facts === 'string' ? JSON.parse(brand.facts) : brand.facts;
            if (factsObj.menu && Array.isArray(factsObj.menu) && factsObj.menu.length > 0) {
              const firstItem = factsObj.menu[0];
              if (firstItem.price) {
                setPrice(`${firstItem.price} ₽`);
              }
              if (firstItem.name) {
                setPrompt(
                  `Профессиональная студийная съёмка позиции ${firstItem.name}, аппетитная подача, мягкий естественный свет`
                );
              }
            }
          } catch (ignored) {}
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const loadPresets = async () => {
    try {
      const data = await apiRequest<CreativePreset[]>('/creative/presets');
      setPresets(data);
    } catch (e) {
      console.warn('Presets failed to load', e);
    }
  };

  const loadMedia = async () => {
    try {
      const data = await apiRequest<MediaAssetResponse[]>('/creative/media');
      setMediaList(data);
    } catch (e) {
      console.warn('Media library failed to load', e);
    }
  };

  const handleApplyPreset = (preset: CreativePreset) => {
    setPrompt(preset.prompt);
    setStyle(preset.style);
    setAspectRatio(preset.defaultAspectRatio);
    setBadgeText(preset.suggestedBadge);
    setCtaText(preset.suggestedCta);
    if (preset.suggestedPrice) {
      setPrice(preset.suggestedPrice);
    }
  };

  const markCompleted = (task: CreativeTaskResponse) => {
    if (task.status === 'COMPLETED' && task.resultUrl) {
      // Real asset comes from the backend media registry — no fabricated metadata
      refreshMediaAndPick(task.resultUrl);
    }
  };

  const refreshMediaAndPick = async (resultUrl: string) => {
    try {
      const data = await apiRequest<MediaAssetResponse[]>('/creative/media');
      setMediaList(data);
      const found = data.find(m => m.url === resultUrl);
      if (found) {
        setLatestMedia(found);
      }
    } catch (e) {
      console.warn('Media refresh failed', e);
    }
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setActiveTask(null);
    setLatestMedia(null);
    try {
      const res = await apiRequest<CreativeTaskResponse>('/creative/images', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio,
          enableOverlay,
          brandName,
          price,
          badgeText,
          ctaText,
          overlayPosition,
        }),
      });

      setActiveTask(res);
      markCompleted(res);
    } catch (err: any) {
      setGenerationError(err.message || 'Ошибка генерации изображения');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setActiveTask(null);
    setLatestMedia(null);
    try {
      const task = await apiRequest<CreativeTaskResponse>('/creative/videos', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio,
          durationSeconds,
          cameraMotion,
          enableOverlay,
          brandName,
          price,
          badgeText,
        }),
      });

      setActiveTask(task);
      pollVideoTask(task.id);
    } catch (err: any) {
      setGenerationError(err.message || 'Ошибка создания видео');
      setIsGenerating(false);
    }
  };

  const pollVideoTask = (taskId: number) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 120; // ~5 minutes with 2.5s interval

    if (taskPollRef.current) {
      clearInterval(taskPollRef.current);
    }

    taskPollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const updated = await apiRequest<CreativeTaskResponse>(`/creative/tasks/${taskId}`);
        setActiveTask(updated);

        if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
          stopPolling();
          setIsGenerating(false);
          if (updated.status === 'FAILED') {
            setGenerationError(updated.errorMessage || 'Генерация видео завершилась ошибкой');
          } else {
            markCompleted(updated);
          }
          return;
        }

        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setIsGenerating(false);
          setGenerationError('Генерация заняла слишком много времени. Попробуйте ещё раз.');
        }
      } catch (e: any) {
        stopPolling();
        setIsGenerating(false);
        setGenerationError(e?.message || 'Ошибка проверки статуса задачи');
      }
    }, 2500);
  };

  const stopPolling = () => {
    if (taskPollRef.current) {
      clearInterval(taskPollRef.current);
      taskPollRef.current = null;
    }
  };

  const handleOpenAttachModal = (asset: MediaAssetResponse) => {
    setAttachTargetMedia(asset);
    setPostCaption(`${asset.prompt}\n\nСпециальное предложение от ${brandName}`.trim());
    setAttachSuccessMessage(null);
    setAttachError(null);
    setIsAttachModalOpen(true);
  };

  const handleAttachSubmit = async () => {
    if (!attachTargetMedia) return;
    setAttachError(null);
    try {
      await apiRequest(`/creative/media/${attachTargetMedia.id}/attach-post`, {
        method: 'POST',
        body: JSON.stringify({
          platform: targetPlatform,
          postText: postCaption,
        }),
      });
      setAttachSuccessMessage('Публикация создана! Управляйте ею в разделе «Кампании» или «Календарь».');
      loadMedia();
    } catch (e: any) {
      setAttachError(e.message || 'Ошибка прикрепления к посту');
    }
  };

  const filteredMedia = mediaList.filter(item => {
    if (libraryFilter === 'IMAGE') return item.mediaType === 'IMAGE';
    if (libraryFilter === 'VIDEO') return item.mediaType === 'VIDEO';
    return true;
  });

  const tabClass = (tab: string) =>
    `flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
      activeTab === tab
        ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
        : 'text-[var(--muted)] hover:text-[var(--ink)]'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-page-enter">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--chip-bg)] border border-[var(--border)] text-[var(--chip-text)] flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight">AI Creative Studio</h1>
            <p className="text-sm text-[var(--muted)]">
              Генерация рекламных визуалов, продуктовых фото и коротких роликов для соцсетей
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] shadow-sm overflow-x-auto">
          <button onClick={() => setActiveTab('IMAGE')} className={tabClass('IMAGE')}>
            <ImageIcon size={16} />
            <span className="whitespace-nowrap">Фото & Баннеры</span>
          </button>
          <button onClick={() => setActiveTab('VIDEO')} className={tabClass('VIDEO')}>
            <VideoIcon size={16} />
            <span className="whitespace-nowrap">Reels & Видео</span>
          </button>
          <button onClick={() => { setActiveTab('LIBRARY'); loadMedia(); }} className={tabClass('LIBRARY')}>
            <Library size={16} />
            <span className="whitespace-nowrap">Медиатека ({mediaList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab !== 'LIBRARY' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Controls & Configuration */}
          <div className="lg:col-span-7 space-y-6">
            {/* Presets Bar */}
            {presets.length > 0 && (
              <div className="card p-4 space-y-3">
                <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} />
                  <span>Быстрые пресеты бизнеса</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPreset(p)}
                      title={p.description}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{p.title}</span>
                      <span className="text-[10px] text-[var(--accent)] font-bold bg-[var(--chip-bg)] px-1.5 py-0.5 rounded">
                        {p.defaultAspectRatio}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Formulation */}
            <div className="card p-5 space-y-4">
              <label className="block text-sm font-bold text-[var(--ink)]">
                Описание рекламного визуала (Промпт)
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Например: профессиональная съёмка продукта на чистом фоне, мягкий свет..."
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
              />

              {/* Style & Aspect Ratio Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                    Стиль визуала
                  </label>
                  <select
                    value={style}
                    onChange={e => setStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm font-medium focus:outline-none focus:border-[var(--accent)]"
                  >
                    {STYLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                    Формат (Соотношение сторон)
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={e => setAspectRatio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm font-medium focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="1:1">1:1 Квадрат (Лента VK, Telegram, Inst)</option>
                    <option value="9:16">9:16 Вертикальный (Shorts, Reels, Stories)</option>
                    <option value="16:9">16:9 Горизонтальный (Баннер сайта, YouTube)</option>
                    <option value="4:5">4:5 Портрет (Инстаграм пост)</option>
                  </select>
                </div>
              </div>

              {/* Video Specific Settings */}
              {activeTab === 'VIDEO' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                      Длительность ролика: {durationSeconds} сек
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={12}
                      value={durationSeconds}
                      onChange={e => setDurationSeconds(Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                      Движение камеры
                    </label>
                    <select
                      value={cameraMotion}
                      onChange={e => setCameraMotion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm font-medium focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="SLOW_ZOOM_IN">Плавный наезд (Ken Burns Zoom)</option>
                      <option value="PAN_RIGHT">Панорама слева направо</option>
                      <option value="STATIC">Статичный кинематографичный кадр</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Deterministic Overlay Panel */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-[var(--accent)] shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)]">
                      Детерминированный оверлей (Бренд, Цены, Бейджи)
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Накладывается графическим слоем — 100% точность без галлюцинаций нейросети
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enableOverlay}
                    onChange={e => setEnableOverlay(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] rounded-full peer focus:outline-none after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-[20px]"></div>
                </label>
              </div>

              {enableOverlay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border)]">
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">
                      Название бренда
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      placeholder="Название из профиля бренда"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1 flex items-center justify-between">
                      <span>Точная цена</span>
                      {price && (
                        <span className="text-[10px] text-[var(--success)] font-bold">Из меню</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="Например: 320 ₽"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">
                      Промо-бейдж / Стикер
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={e => setBadgeText(e.target.value)}
                      placeholder="Например: Хит продаж"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">
                      Призыв к действию (Кнопка)
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={e => setCtaText(e.target.value)}
                      placeholder="Например: Попробовать"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">
                      Расположение плашки на изображении
                    </label>
                    <select
                      value={overlayPosition}
                      onChange={e => setOverlayPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="BOTTOM_CENTER">Снизу по центру</option>
                      <option value="BOTTOM_LEFT">Снизу слева</option>
                      <option value="BOTTOM_RIGHT">Снизу справа</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {generationError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-start gap-2">
                {generationError}
              </div>
            )}

            {/* Submit Action Button */}
            <button
              onClick={activeTab === 'IMAGE' ? handleGenerateImage : handleGenerateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="btn-primary w-full py-4 px-6 rounded-2xl text-base cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>
                    {activeTab === 'IMAGE'
                      ? 'Создание визуального креатива...'
                      : 'Рендеринг видеоролика...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>
                    {activeTab === 'IMAGE'
                      ? 'Сгенерировать рекламный визуал'
                      : 'Создать промо-ролик Reels'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Live Result & Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card p-6 flex flex-col items-center justify-center min-h-[420px] sm:min-h-[480px]">
              {/* State: In Progress */}
              {isGenerating && (
                <div className="text-center space-y-4 max-w-xs">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--ink)]">Генерация креатива</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Интеграция памяти бренда, композиция и детерминированный рендеринг цен...
                  </p>
                  {activeTask && (
                    <div className="w-full bg-[var(--bg)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
                      <div
                        className="bg-[var(--accent)] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${activeTask.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* State: Result Available */}
              {!isGenerating && latestMedia && (
                <div className="w-full space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-black/40 shadow-md flex items-center justify-center">
                    {latestMedia.mediaType === 'VIDEO' ? (
                      <video
                        src={latestMedia.url}
                        controls
                        autoPlay
                        loop
                        className="w-full h-auto object-contain max-h-[460px]"
                      />
                    ) : (
                      <img
                        src={latestMedia.url}
                        alt="Creative output"
                        className="w-full h-auto object-contain max-h-[460px]"
                      />
                    )}

                    {/* Format badge overlay */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white border border-white/20">
                      {latestMedia.aspectRatio}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={latestMedia.url}
                      download={`creative_${latestMedia.id}.${latestMedia.mediaType === 'VIDEO' ? 'mp4' : 'png'}`}
                      className="btn-secondary flex-1 py-3 px-4 text-xs cursor-pointer"
                    >
                      <Download size={16} />
                      <span>Скачать файл</span>
                    </a>

                    <button
                      onClick={() => handleOpenAttachModal(latestMedia)}
                      className="btn-primary flex-1 py-3 px-4 text-xs cursor-pointer"
                    >
                      <Send size={16} />
                      <span>Прикрепить к посту</span>
                    </button>
                  </div>
                </div>
              )}

              {/* State: Initial Empty */}
              {!isGenerating && !latestMedia && (
                <div className="text-center space-y-3 max-w-xs text-[var(--muted)]">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--muted)]">
                    <ImageIcon size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">Готовый креатив появится здесь</h4>
                  <p className="text-xs leading-relaxed">
                    Настройте параметры или выберите готовый бизнес-пресет и нажмите «Сгенерировать»
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Media Library Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setLibraryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  libraryFilter === 'ALL'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                }`}
              >
                Все материалы ({mediaList.length})
              </button>
              <button
                onClick={() => setLibraryFilter('IMAGE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  libraryFilter === 'IMAGE'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                }`}
              >
                Фото ({mediaList.filter(m => m.mediaType === 'IMAGE').length})
              </button>
              <button
                onClick={() => setLibraryFilter('VIDEO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  libraryFilter === 'VIDEO'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                }`}
              >
                Видео ({mediaList.filter(m => m.mediaType === 'VIDEO').length})
              </button>
            </div>

            <button
              onClick={loadMedia}
              className="btn-secondary p-2 rounded-lg cursor-pointer"
              title="Обновить"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <Library size={36} className="mx-auto text-[var(--muted)]" />
              <h3 className="text-base font-bold text-[var(--ink)]">В медиатеке пока нет файлов</h3>
              <p className="text-xs text-[var(--muted)]">
                Создайте первое изображение или рекламный видеоролик во вкладках генерации
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="card card-hover overflow-hidden flex flex-col group"
                >
                  <div className="relative aspect-square bg-black/10 overflow-hidden flex items-center justify-center">
                    {item.mediaType === 'VIDEO' ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.prompt || 'Creative asset'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                      {item.aspectRatio}
                    </span>
                    {item.mediaType === 'VIDEO' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={32} className="text-white fill-white" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <p className="text-xs text-[var(--ink)] font-medium line-clamp-2">
                      {item.prompt || 'Рекламный креатив'}
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                      <a
                        href={item.url}
                        download={`asset_${item.id}`}
                        className="btn-secondary p-2 rounded-lg cursor-pointer"
                        title="Скачать"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleOpenAttachModal(item)}
                        className="btn-primary flex-1 py-1.5 px-3 text-xs cursor-pointer"
                      >
                        <Send size={13} />
                        <span>В публикацию</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attach To Post Modal */}
      {isAttachModalOpen && attachTargetMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-[var(--ink)]">Прикрепить к публикации</h3>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {attachSuccessMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[var(--success)] text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{attachSuccessMessage}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                    Целевая соцсеть
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PLATFORM_OPTIONS.map(p => (
                      <button
                        key={p}
                        onClick={() => setTargetPlatform(p)}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          targetPlatform === p
                            ? 'bg-[var(--accent)] text-[var(--on-accent)] border-[var(--accent)]'
                            : 'bg-[var(--bg)] text-[var(--ink)] border-[var(--border)]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                    Текст поста к медиафайлу
                  </label>
                  <textarea
                    rows={4}
                    value={postCaption}
                    onChange={e => setPostCaption(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                {attachError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
                    {attachError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    onClick={() => setIsAttachModalOpen(false)}
                    className="btn-secondary px-4 py-2 text-xs cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAttachSubmit}
                    className="btn-primary px-5 py-2 text-xs cursor-pointer"
                  >
                    Создать публикацию
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
