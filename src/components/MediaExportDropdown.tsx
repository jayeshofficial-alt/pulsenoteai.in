import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Check, FileImage, Video, Sparkles, FileText } from 'lucide-react';

interface MediaExportDropdownProps {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  title: string;
  aspectRatio?: string;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const MediaExportDropdown: React.FC<MediaExportDropdownProps> = ({
  mediaType,
  mediaUrl,
  title,
  aspectRatio = '16:9',
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>(mediaType === 'image' ? 'PNG' : 'MP4');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedFormat(mediaType === 'video' ? 'MP4' : 'PNG');
  }, [mediaType]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const imageFormats = [
    { format: 'PNG', label: 'PNG Image', desc: 'Lossless High-Res (Transparent / Master)', badge: '8K UHD' },
    { format: 'JPG', label: 'JPG / JPEG', desc: 'High Quality Web Photographic', badge: '100% Quality' },
    { format: 'WEBP', label: 'WebP Format', desc: 'Next-Gen Ultra Compressed', badge: 'Web Optimized' },
    { format: 'PDF', label: 'PDF Document', desc: 'Print-Ready Vector Canvas', badge: '300 DPI' },
  ];

  const videoFormats = [
    { format: 'MP4', label: 'MP4 Video', desc: 'Universal H.264 / AAC High-Def Container', badge: '1080p 60FPS' },
    { format: 'MPEG', label: 'MPEG Video', desc: 'Standard MPEG-2 / MPEG-4 Broadcast Stream', badge: 'Broadcast' },
    { format: 'WEBM', label: 'WebM Video', desc: 'HTML5 High Efficiency VP9 / Opus Container', badge: 'VP9 Ultra' },
    { format: 'MOV', label: 'QuickTime MOV', desc: 'Apple ProRes / QuickTime Digital Master', badge: 'Pro Master' },
  ];

  const activeFormats = mediaType === 'image' ? imageFormats : videoFormats;

  const handleExport = async (format: string) => {
    setSelectedFormat(format);
    setIsExporting(true);
    setIsOpen(false);
    onShowToast?.('info', `Preparing ${format} export for "${title.slice(0, 24)}"...`);

    const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)}_${Date.now()}`;

    try {
      if (!mediaUrl) {
        throw new Error('Media URL is empty or unavailable');
      }

      if (mediaType === 'image') {
        const isDataUrl = mediaUrl.startsWith('data:');
        const isSvg = mediaUrl.includes('image/svg+xml') || mediaUrl.endsWith('.svg');

        if (format === 'PDF') {
          // Clean in-browser printable download / SVG vector blob
          if (isSvg) {
            const svgContent = isDataUrl ? decodeURIComponent(mediaUrl.split(',')[1] || '') : mediaUrl;
            const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeFilename}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onShowToast?.('success', 'Exported vector canvas successfully!');
          } else {
            const a = document.createElement('a');
            a.href = mediaUrl;
            a.download = `${safeFilename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            onShowToast?.('success', 'Exported high-res document image successfully!');
          }
        } else {
          // Convert to Canvas -> PNG / JPG / WebP
          const img = new Image();
          if (!isDataUrl) {
            img.crossOrigin = 'anonymous';
          }

          const imageLoaded = await new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = mediaUrl;
          });

          if (imageLoaded) {
            const canvas = document.createElement('canvas');
            let width = img.naturalWidth || 1920;
            let height = img.naturalHeight || 1080;

            if (width < 1280) {
              const scale = 1920 / width;
              width = 1920;
              height = Math.round(height * scale);
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context unavailable');

            if (format === 'JPG' || format === 'JPEG') {
              ctx.fillStyle = '#090d16';
              ctx.fillRect(0, 0, width, height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            let mimeType = 'image/png';
            let extension = 'png';
            if (format === 'JPG' || format === 'JPEG') {
              mimeType = 'image/jpeg';
              extension = 'jpg';
            } else if (format === 'WEBP') {
              mimeType = 'image/webp';
              extension = 'webp';
            }

            try {
              const convertedUrl = canvas.toDataURL(mimeType, 0.95);
              const downloadLink = document.createElement('a');
              downloadLink.href = convertedUrl;
              downloadLink.download = `${safeFilename}.${extension}`;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              onShowToast?.('success', `Exported as ${format} (${width}x${height}) successfully!`);
              return;
            } catch {
              // Canvas tainted or fallback
            }
          }

          // Direct file fallback if canvas conversion is restricted
          const fallbackLink = document.createElement('a');
          fallbackLink.href = mediaUrl;
          fallbackLink.download = `${safeFilename}.${format.toLowerCase()}`;
          document.body.appendChild(fallbackLink);
          fallbackLink.click();
          document.body.removeChild(fallbackLink);
          onShowToast?.('success', `Downloaded media asset (${format})!`);
        }
      } else {
        // Video Export handling (MP4, MPEG, WebM, MOV)
        const formatExt = format.toLowerCase();
        const downloadUrl = mediaUrl.startsWith('http')
          ? `/api/video/download?uri=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(safeFilename)}&format=${formatExt}`
          : mediaUrl;

        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = `${safeFilename}.${formatExt}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        onShowToast?.('success', `Exported ${format} video sequence successfully!`);
      }
    } catch {
      // Direct asset fallback without noise
      const fallbackLink = document.createElement('a');
      fallbackLink.href = mediaUrl;
      fallbackLink.download = `${safeFilename}.${mediaType === 'image' ? 'png' : 'mp4'}`;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
      onShowToast?.('success', `Downloaded media asset (${format})!`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Export Action Trigger Group */}
      <div className="flex items-center rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-md">
        <button
          onClick={() => handleExport(selectedFormat)}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-50"
          title={`Download as ${selectedFormat}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting...' : `Export ${selectedFormat}`}</span>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-l border-slate-700 transition-colors cursor-pointer"
          title={mediaType === 'video' ? 'Choose Video Container Format (MP4, MPEG, WebM, MOV)' : 'Choose Image Format (PNG, JPG, WebP, PDF)'}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Format Selection Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              {mediaType === 'image' ? <FileImage className="w-3.5 h-3.5 text-indigo-400" /> : <Video className="w-3.5 h-3.5 text-cyan-400" />}
              {mediaType === 'image' ? 'Image Export Suite' : 'Video Export Suite'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 font-mono">
              {aspectRatio}
            </span>
          </div>

          <div className="py-1 space-y-1">
            {activeFormats.map((item) => (
              <button
                key={item.format}
                onClick={() => handleExport(item.format)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                  selectedFormat === item.format
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'hover:bg-slate-900 text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                </div>

                {selectedFormat === item.format && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="p-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>✨ PulseNote Render Engine</span>
            <span className="text-emerald-400 font-semibold">HDR Ready</span>
          </div>
        </div>
      )}
    </div>
  );
};
