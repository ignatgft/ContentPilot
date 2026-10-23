import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FolderArchive, 
  Download, 
  Send, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Play, 
  RefreshCw
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
  suggestedCta: string;
  category: string;
}

export const CreativeStudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'IMAGE' | 'VIDEO' | 'LIBRARY'>('IMAGE');
  
  // Form State
  const [prompt, setPrompt] = useState('Чашка капучино с нежным латте-артом на деревянном столике у окна кофейни');
  const [style, setStyle] = useState('COFFEE_AESTHETIC');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [cameraMotion, setCameraMotion] = useState('SLOW_ZOOM_IN');
  
  // Deterministic Overlay state
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [brandName, setBrandName] = useState('COFFEE PILOT');
  const [price, setPrice] = useState('320 ₽');
  const [badgeText, setBadgeText] = useState('Сезонная новинка');
  const [ctaText, setCtaText] = useState('Попробовать');
  const [overlayPosition, setOverlayPosition] = useState('BOTTOM_CENTER');

  // Processing & Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTask, setActiveTask] = useState<CreativeTaskResponse | null>(null);
  const [latestMedia, setLatestMedia] = useState<MediaAssetResponse | null>(null);
  const [mediaList, setMediaList] = useState<MediaAssetResponse[]>([]);
  const [presets, setPresets] = useState<CreativePreset[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  
  // Attach to post modal
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachTargetMedia, setAttachTargetMedia] = useState<MediaAssetResponse | null>(null);
  const [targetPlatform, setTargetPlatform] = useState('TELEGRAM');
  const [postCaption, setPostCaption] = useState('');
  const [attachSuccessMessage, setAttachSuccessMessage] = useState('');

  // Load presets & media gallery
  useEffect(() => {
    loadPresets();
    loadMedia();
  }, []);

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
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
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
          overlayPosition
        })
      });

      setActiveTask(res);
      if (res.status === 'COMPLETED' && res.resultUrl) {
        setLatestMedia({
          id: Date.now(),
          mediaType: 'IMAGE',
          url: res.resultUrl,
          thumbnailUrl: res.resultUrl,
          prompt: res.prompt,
          style: res.style,
          aspectRatio: res.aspectRatio,
          width: 1080,
          height: 1080,
          createdAt: new Date().toISOString()
        });
        loadMedia();
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка генерации изображения');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
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
          badgeText
        })
      });

      setActiveTask(task);
      pollVideoTask(task.id);
    } catch (err: any) {
      alert(err.message || 'Ошибка создания видео');
      setIsGenerating(false);
    }
  };

  const pollVideoTask = async (taskId: number) => {
    const interval = setInterval(async () => {
      try {
        const updated = await apiRequest<CreativeTaskResponse>(`/creative/tasks/${taskId}`);
        setActiveTask(updated);

        if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
          clearInterval(interval);
          setIsGenerating(false);
          if (updated.status === 'COMPLETED' && updated.resultUrl) {
            setLatestMedia({
              id: Date.now(),
              mediaType: 'VIDEO',
              url: updated.resultUrl,
              thumbnailUrl: updated.resultUrl,
              prompt: updated.prompt,
              style: updated.style,
              aspectRatio: updated.aspectRatio,
              width: 1080,
              height: 1920,
              durationSeconds,
              createdAt: new Date().toISOString()
            });
            loadMedia();
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 2500);
  };

  const handleOpenAttachModal = (asset: MediaAssetResponse) => {
    setAttachTargetMedia(asset);
    setPostCaption(`🔥 ${asset.prompt}\n\nСпециальное предложение от ${brandName}!`);
    setAttachSuccessMessage('');
    setIsAttachModalOpen(true);
  };

  const handleAttachSubmit = async () => {
    if (!attachTargetMedia) return;
    try {
      await apiRequest(`/creative/media/${attachTargetMedia.id}/attach-post`, {
        method: 'POST',
        body: JSON.stringify({
          platform: targetPlatform,
          postText: postCaption
        })
      });
      setAttachSuccessMessage('✅ Публикация успешно создана в кампаниях с этим медиафайлом!');
      setTimeout(() => {
        setIsAttachModalOpen(false);
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Ошибка прикрепления к посту');
    }
  };

  const filteredMedia = mediaList.filter(item => {
    if (libraryFilter === 'IMAGE') return item.mediaType === 'IMAGE';
    if (libraryFilter === 'VIDEO') return item.mediaType === 'VIDEO';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--ink)] tracking-tight">AI Creative Studio</h1>
              <p className="text-sm text-[var(--muted)]">
                Генерация рекламных визуалов, продуктовых фото и коротких роликов для соцсетей
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] shadow-sm">
          <button
            onClick={() => setActiveTab('IMAGE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'IMAGE' 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <ImageIcon size={16} />
            <span>Фото & Баннеры</span>
          </button>
          <button
            onClick={() => setActiveTab('VIDEO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'VIDEO' 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <VideoIcon size={16} />
            <span>Reels & Видео</span>
          </button>
          <button
            onClick={() => { setActiveTab('LIBRARY'); loadMedia(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'LIBRARY' 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <FolderArchive size={16} />
            <span>Медиатека ({mediaList.length})</span>
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
              <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] space-y-3">
                <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} />
                  <span>Быстрые пресеты бизнеса</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPreset(p)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:border-amber-500/50 hover:bg-amber-500/5 text-xs font-semibold text-[var(--ink)] transition-colors flex items-center gap-1.5"
                    >
                      <span>{p.title}</span>
                      <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {p.defaultAspectRatio}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Formulation */}
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
              <label className="block text-sm font-bold text-[var(--ink)]">
                Описание рекламного визуала (Промпт)
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Например: Нежный черничный чизкейк со свежими ягодами и мятой на матовой тарелке..."
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="COFFEE_AESTHETIC">☕ Кофейная эстетика (Тёплый свет)</option>
                    <option value="STUDIO_COMMERCIAL">📸 Студийное фото (Чистый белый)</option>
                    <option value="DARK_LUXURY">✨ Тёмный люкс (Премиум неоны)</option>
                    <option value="VIBRANT_POP">🎨 Яркий поп (Контрастные цвета)</option>
                    <option value="MINIMALIST">🌿 Минимализм & Эко</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                    Формат (Соотношение сторон)
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={e => setAspectRatio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                      Движение камеры
                    </label>
                    <select
                      value={cameraMotion}
                      onChange={e => setCameraMotion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="SLOW_ZOOM_IN">Плавный наезд (Ken Burns Zoom)</option>
                      <option value="PAN_RIGHT">Панорама слева направо</option>
                      <option value="STATIC">Статичный кинематографичный кадр</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Deterministic Overlay Panel (Section 7 from Tech Spec) */}
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)]">
                      Детерминированный оверлей (Бренд, Цены, Бейджи)
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Накладывается графическим слоем — 100% точность без галлюцинаций нейросети
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableOverlay}
                    onChange={e => setEnableOverlay(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
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
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1 flex items-center justify-between">
                      <span>Точная цена</span>
                      <span className="text-[10px] text-amber-500 font-bold">Из меню</span>
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="Например: 320 ₽"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-bold text-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">
                      Расположение плашки на изображении
                    </label>
                    <select
                      value={overlayPosition}
                      onChange={e => setOverlayPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="BOTTOM_CENTER">Снизу по центру</option>
                      <option value="BOTTOM_LEFT">Снизу слева</option>
                      <option value="BOTTOM_RIGHT">Снизу справа</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              onClick={activeTab === 'IMAGE' ? handleGenerateImage : handleGenerateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>
                    {activeTab === 'IMAGE' ? 'Создание визуального креатива...' : 'Рендеринг видеоролика...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>
                    {activeTab === 'IMAGE' ? 'Сгенерировать рекламный визуал' : 'Создать промо-ролик Reels'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Live Result & Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center min-h-[480px]">
              
              {/* State: In Progress */}
              {isGenerating && (
                <div className="text-center space-y-4 max-w-xs">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--ink)]">Генерация креатива</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    Интеграция памяти бренда, композиция и детерминированный рендеринг цен...
                  </p>
                  {activeTask && (
                    <div className="w-full bg-[var(--bg)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${activeTask.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* State: Result Available */}
              {!isGenerating && latestMedia && (
                <div className="w-full space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-black/40 group shadow-md flex items-center justify-center max-h-[500px]">
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
                      className="flex-1 py-3 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg)] text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download size={16} />
                      <span>Скачать файл</span>
                    </a>

                    <button
                      onClick={() => handleOpenAttachModal(latestMedia)}
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLibraryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  libraryFilter === 'ALL'
                    ? 'bg-amber-500 text-white'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                }`}
              >
                Все материалы ({mediaList.length})
              </button>
              <button
                onClick={() => setLibraryFilter('IMAGE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  libraryFilter === 'IMAGE'
                    ? 'bg-amber-500 text-white'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                }`}
              >
                Фото ({mediaList.filter(m => m.mediaType === 'IMAGE').length})
              </button>
              <button
                onClick={() => setLibraryFilter('VIDEO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  libraryFilter === 'VIDEO'
                    ? 'bg-amber-500 text-white'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                }`}
              >
                Видео ({mediaList.filter(m => m.mediaType === 'VIDEO').length})
              </button>
            </div>

            <button
              onClick={loadMedia}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="bg-[var(--surface)] p-12 rounded-2xl border border-[var(--border)] text-center space-y-3">
              <FolderArchive size={36} className="mx-auto text-[var(--muted)]" />
              <h3 className="text-base font-bold text-[var(--ink)]">В медиатеке пока нет файлов</h3>
              <p className="text-xs text-[var(--muted)]">
                Создайте первое изображение или рекламный видеоролик во вкладках генерации
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
                >
                  <div className="relative aspect-square bg-black/20 overflow-hidden flex items-center justify-center">
                    {item.mediaType === 'VIDEO' ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt="Media"
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
                        className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                        title="Скачать"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleOpenAttachModal(item)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
          <div className="bg-[var(--surface)] w-full max-w-lg rounded-2xl border border-[var(--border)] p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-[var(--ink)]">Прикрепить к публикации</h3>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {attachSuccessMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{attachSuccessMessage}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-2">
                    Целевая соцсеть
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['TELEGRAM', 'VK', 'INSTAGRAM'].map(p => (
                      <button
                        key={p}
                        onClick={() => setTargetPlatform(p)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          targetPlatform === p
                            ? 'bg-amber-500 text-white border-amber-500'
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
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    onClick={() => setIsAttachModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--bg)]"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAttachSubmit}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md cursor-pointer"
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
