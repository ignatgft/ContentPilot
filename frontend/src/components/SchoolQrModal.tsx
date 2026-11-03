import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  UtensilsCrossed,
  QrCode,
} from 'lucide-react';

interface SchoolQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolSlug: string;
  address?: string;
}

export const SchoolQrModal: React.FC<SchoolQrModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  schoolSlug,
  address,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrColor, setQrColor] = useState<'blue' | 'black'>('blue');
  const qrRef = useRef<HTMLDivElement>(null);

  // Close on Escape & lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const publicUrl = `${origin}/public/${schoolSlug || 'school-24'}`;
  const fgColor = qrColor === 'blue' ? '#5B8CFF' : '#111318';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 600;
    canvas.height = 600;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 50, 50, 500, 500);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_Меню_${schoolSlug || 'school'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <>
      {/* Printable Poster Section (only visible on print) */}
      <div className="hidden print:flex flex-col items-center justify-center text-center p-8 bg-white text-slate-900 min-h-screen">
        <div className="w-16 h-16 rounded-2xl bg-[#5B8CFF] text-white flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black mb-2">{schoolName || 'Школьная столовая'}</h1>
        <p className="text-sm text-slate-600 mb-8">{address || 'SmartCanteen AI — Цифровое питание'}</p>

        <div className="p-6 bg-white border-4 border-slate-900 rounded-3xl shadow-xl mb-6">
          <QRCodeSVG
            value={publicUrl}
            size={360}
            level="H"
            includeMargin={true}
            fgColor="#1E293B"
          />
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-1">МЕНЮ СТОЛОВОЙ ОНЛАЙН</h2>
        <p className="text-base text-slate-700 max-w-md mb-4">
          Наведите камеру смартфона, чтобы открыть сегодняшнее меню, состав блюд, КБЖУ и аллергены
        </p>
        <div className="text-xs text-slate-500 font-mono bg-slate-100 px-4 py-2 rounded-lg">
          {publicUrl}
        </div>
      </div>

      {/* Screen Modal Overlay */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:hidden"
      >
        <div className="relative w-full max-w-md my-auto bg-[#272E3A] text-[#F5F7FA] rounded-3xl shadow-2xl border border-[#303744] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#202A3C] to-[#30294A] text-white flex items-center justify-between border-b border-[#303744]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5B8CFF]/20 border border-[#5B8CFF]/30 flex items-center justify-center shadow-xs">
                <QrCode className="w-5 h-5 text-[#5B8CFF]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">QR-код витрины столовой</h3>
                <p className="text-xs text-[#A6AFBC]">Для размещения в зале и на стендах</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#A6AFBC] hover:text-white transition-colors cursor-pointer"
              title="Закрыть (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col items-center text-center">
            <div className="mb-3">
              <h4 className="font-black text-base text-white">{schoolName}</h4>
              <p className="text-xs text-[#A6AFBC]">{address || 'г. Бишкек'}</p>
            </div>

            {/* Color Switcher */}
            <div className="flex items-center gap-2 mb-4 text-xs">
              <span className="text-[#A6AFBC] font-medium">Стиль QR:</span>
              <button
                type="button"
                onClick={() => setQrColor('blue')}
                className={`px-3 py-1 rounded-xl font-bold border transition-all cursor-pointer ${
                  qrColor === 'blue'
                    ? 'bg-[#5B8CFF]/20 border-[#5B8CFF]/50 text-white'
                    : 'bg-[#1D222C] border-[#303744] text-[#A6AFBC]'
                }`}
              >
                Apple Sapphire
              </button>
              <button
                type="button"
                onClick={() => setQrColor('black')}
                className={`px-3 py-1 rounded-xl font-bold border transition-all cursor-pointer ${
                  qrColor === 'black'
                    ? 'bg-[#171A21] border-[#5B8CFF]/40 text-white'
                    : 'bg-[#1D222C] border-[#303744] text-[#A6AFBC]'
                }`}
              >
                Graphite Dark
              </button>
            </div>

            {/* QR Code Container */}
            <div
              ref={qrRef}
              className="p-4 bg-white rounded-2xl border-2 border-[#303744] shadow-lg inline-block relative group"
            >
              <QRCodeSVG
                value={publicUrl}
                size={210}
                level="H"
                includeMargin={false}
                fgColor={fgColor}
                imageSettings={{
                  src: '/favicon.ico',
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            <p className="text-xs text-[#A6AFBC] mt-3 max-w-xs">
              Ученики и родители открывают меню в один клик без логина и регистрации (Zero-PII).
            </p>

            {/* Public Link Box */}
            <div className="mt-4 w-full flex items-center gap-2 p-2 rounded-xl bg-[#1D222C] border border-[#303744] text-left">
              <span className="text-xs font-mono text-white truncate flex-1 pl-1">
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg hover:bg-[#242A35] text-[#A6AFBC] hover:text-white transition-colors shrink-0 cursor-pointer"
                title="Скопировать ссылку"
              >
                {copied ? <Check className="w-4 h-4 text-[#39C98A]" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-[#242A35] text-[#A6AFBC] hover:text-white transition-colors shrink-0"
                title="Открыть витрину"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-5 w-full">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Скачать PNG
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Печать плаката
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
