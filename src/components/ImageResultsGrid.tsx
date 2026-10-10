import React, { useState } from 'react';
import { 
  ExternalLink, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Globe, 
  Sparkles,
  Download,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { ImageSearchResult } from '../types';
import { MediaExportDropdown } from './MediaExportDropdown';

interface ImageResultsGridProps {
  results: ImageSearchResult[];
  queryTitle: string;
  onAnimateImage?: (imageUrl: string, title: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ImageResultsGrid: React.FC<ImageResultsGridProps> = ({
  results,
  queryTitle,
  onAnimateImage,
  onShowToast,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!results || results.length === 0) return null;

  const activeModalImage = selectedIdx !== null ? results[selectedIdx] : null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    onShowToast?.('success', 'Image URL copied to clipboard');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleNext = () => {
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx + 1) % results.length);
  };

  const handlePrev = () => {
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx - 1 + results.length) % results.length);
  };

  return (
    <div className="space-y-3 w-full">
      {/* Gallery Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">
            Live Image Results ({results.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://www.google.com/search?udm=2&q=${encodeURIComponent(queryTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-mono text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-700/50 transition-colors"
            title="Open Google Images in new tab"
          >
            <Globe className="w-2.5 h-2.5" />
            <span>Google Images Index</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Google Images-Style Multi-Column Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {results.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => setSelectedIdx(idx)}
            className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between"
          >
            {/* Thumbnail Image Container */}
            <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-950">
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  // Fallback on load error
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Hover Overlay with Quick Actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                <div className="flex justify-end">
                  <span className="p-1 rounded-lg bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/60 shadow">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-200">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/80 font-mono text-[9px] border border-slate-700">
                    {item.width && item.height ? `${item.width}×${item.height}` : 'HD'}
                  </span>
                  <span className="text-[10px] text-indigo-300 font-semibold truncate max-w-[100px]">
                    {item.domain}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Caption */}
            <div className="p-2.5 bg-slate-950/80 border-t border-slate-800/60 space-y-1">
              <p className="text-[11px] font-semibold text-slate-200 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                {item.title}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-mono text-[9px] text-slate-400 truncate max-w-[110px]">
                  <Globe className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  {item.domain}
                </span>
                <span className="text-[9px] font-bold text-emerald-400">Live</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Lightbox Modal with Full Metadata & Multi-Format Export Suite */}
      {activeModalImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedIdx(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {activeModalImage.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <span>Source: {activeModalImage.domain}</span>
                    <span>•</span>
                    <span>{activeModalImage.width || 1920}×{activeModalImage.height || 1080}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Multi-Format Export Dropdown */}
                <MediaExportDropdown
                  mediaType="image"
                  mediaUrl={activeModalImage.url}
                  title={activeModalImage.title}
                  aspectRatio={activeModalImage.aspectRatio || '16:9'}
                  onShowToast={onShowToast}
                />

                <button
                  onClick={() => setSelectedIdx(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Body with Navigation Chevrons */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] max-h-[60vh] p-4 overflow-hidden">
              <img
                src={activeModalImage.url}
                alt={activeModalImage.title}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              />

              {/* Previous Button */}
              {results.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-all cursor-pointer hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Button */}
              {results.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-all cursor-pointer hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Footer with Metadata and Links */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                  {(selectedIdx !== null ? selectedIdx + 1 : 1)} of {results.length}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]">
                  8K HDR Vectorized
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onAnimateImage && (
                  <button
                    onClick={() => {
                      onAnimateImage(activeModalImage.url, `Animate "${activeModalImage.title}" with cinematic motion and dynamic lighting`);
                      setSelectedIdx(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  >
                    <Film className="w-3.5 h-3.5 text-pink-400" />
                    <span>Animate into Video (Veo 3.1)</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopy(activeModalImage.url)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {copiedUrl === activeModalImage.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl === activeModalImage.url ? 'Copied' : 'Copy Image Link'}</span>
                </button>

                {activeModalImage.sourceUrl && (
                  <a
                    href={activeModalImage.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                  >
                    <span>Visit Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
