import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ImageIcon,
  Maximize2,
  Trash2,
  Layers,
} from 'lucide-react';
import { generateImageWithImagen, GeneratedImageResult } from '../services/mediaService';

interface ImageStudioProps {
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function ImageStudio({ onShowToast }: ImageStudioProps) {
  // Read prompt from React state at submit time
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<GeneratedImageResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<GeneratedImageResult | null>(null);

  // Gallery of generated images stored in localStorage
  const [gallery, setGallery] = useState<GeneratedImageResult[]>(() => {
    try {
      const stored = localStorage.getItem('pulsenote_imagen_gallery');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pulsenote_imagen_gallery', JSON.stringify(gallery.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to save image gallery to localStorage', e);
    }
  }, [gallery]);

  // Handle Image Generation
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Block submit if prompt is empty
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setError('Please enter a description for the image.');
      return;
    }

    if (isGenerating) return;

    setError(null);
    setIsGenerating(true);

    try {
      // Send user's prompt EXACTLY as typed (no system prompt or doc prepending)
      const result = await generateImageWithImagen(cleanPrompt, aspectRatio);
      setCurrentImage(result);
      setGallery((prev) => [result, ...prev]);
      onShowToast?.('success', 'Image generated successfully with Imagen 4.0');
    } catch (err: any) {
      console.error('[ImageStudio] Error generating image:', err);
      // Show clear error message if generation fails or is blocked by safety filters
      const errorMsg = err?.message || 'Image generation failed or was blocked by safety filters.';
      setError(errorMsg);
      onShowToast?.('error', errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedImageResult) => {
    const a = document.createElement('a');
    a.href = img.imageUrl;
    a.download = `imagen-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.('success', 'Image downloaded');
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('info', 'Prompt copied to clipboard');
  };

  const clearGallery = () => {
    setGallery([]);
    try {
      localStorage.removeItem('pulsenote_imagen_gallery');
    } catch {}
    onShowToast?.('info', 'Image history cleared');
  };

  const samplePrompts = [
    'A cinematic futuristic cityscape at twilight with glowing neon teal light trails and reflections on wet asphalt',
    'Macro photography of an iridescent dragonfly resting on a rain-drenched lotus leaf, soft bokeh background',
    'Minimalist isometric 3D render of an AI research laboratory with holographic data displays and soft pastel lighting',
    'A cozy coffee shop in rainy Kyoto with warm incandescent lanterns, steam rising from ceramic mugs',
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        {/* Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2d2e30] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ImageIcon size={20} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
                Imagen 4.0 Studio
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-normal">
                  imagen-4.0-generate-001
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#9aa0a6] mt-1">
              Create high-fidelity visuals using Google's dedicated Imagen model. Prompts are submitted directly with no documentation wrappers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9aa0a6] hidden sm:inline">Active Model:</span>
            <div className="px-3 py-1.5 rounded-lg bg-[#1e1f20] border border-[#3c4043] text-xs font-mono text-amber-300">
              imagen-4.0-generate-001
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 shadow-xl space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="imagen-prompt" className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                Image Description / Prompt
              </label>
              <textarea
                id="imagen-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want Imagen to create in rich visual detail..."
                rows={3}
                disabled={isGenerating}
                className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-xl px-4 py-3 text-sm text-[#e3e3e3] placeholder:text-[#9aa0a6] outline-none transition resize-none disabled:opacity-50"
              />
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Aspect Ratio Picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#9aa0a6] mr-1">Aspect Ratio:</span>
                {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#2d2e30] text-[#9aa0a6] hover:text-white hover:bg-[#35363a]'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Generating with Imagen...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Prompts */}
          <div className="pt-2 border-t border-[#2d2e30]/60">
            <span className="text-[11px] text-[#9aa0a6] block mb-2 font-medium">Quick suggestions:</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sp)}
                  disabled={isGenerating}
                  className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-[#2d2e30]/60 hover:bg-[#2d2e30] text-[#c4c7c5] hover:text-white transition truncate max-w-full sm:max-w-md cursor-pointer border border-transparent hover:border-[#3c4043]"
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 text-red-200">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-red-300">Generation Notice</p>
              <p className="mt-0.5 text-xs text-red-200/90 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400 hover:text-red-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Current Result Showcase */}
        {isGenerating ? (
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw size={32} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">Rendering with Google Imagen 4.0</h3>
              <p className="text-xs text-[#9aa0a6] mt-1 max-w-md mx-auto">
                Processing prompt via <span className="font-mono text-amber-300">imagen-4.0-generate-001</span>. Generating high-resolution pixels...
              </p>
            </div>
          </div>
        ) : currentImage ? (
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="relative aspect-auto max-h-[620px] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-[#3c4043]/50">
              {/* Rendered as <img src="data:image/png;base64,..."> */}
              <img
                src={currentImage.imageUrl}
                alt={currentImage.prompt}
                className="w-full h-full object-contain max-h-[620px] rounded-lg"
              />
            </div>

            {/* Info & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 px-1">
              <div className="space-y-0.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {currentImage.model}
                  </span>
                  <span className="text-[11px] text-[#9aa0a6] font-mono">{currentImage.mimeType}</span>
                </div>
                <p className="text-xs text-[#c4c7c5] line-clamp-2 italic">"{currentImage.prompt}"</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(currentImage.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#35363a] text-xs text-[#e3e3e3] transition cursor-pointer"
                  title="Copy prompt"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(currentImage)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs text-white font-medium transition cursor-pointer shadow-md shadow-amber-600/20"
                >
                  <Download size={14} />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Gallery / History */}
        {gallery.length > 0 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-amber-400" />
                <h3 className="text-sm font-medium text-white">Generated Gallery ({gallery.length})</h3>
              </div>
              <button
                type="button"
                onClick={clearGallery}
                className="flex items-center gap-1 text-[11px] text-[#9aa0a6] hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Clear History</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallery.map((item, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-black border border-[#2d2e30] hover:border-amber-500/50 transition cursor-pointer shadow-md"
                  onClick={() => setSelectedPreview(item)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                    <p className="text-[11px] text-white line-clamp-2 leading-tight">{item.prompt}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-amber-300">
                      <span>Imagen 4.0</span>
                      <Maximize2 size={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal for full preview */}
        {selectedPreview && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPreview(null)}
          >
            <div
              className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl max-w-3xl w-full p-4 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-auto max-h-[70vh] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={selectedPreview.imageUrl}
                  alt={selectedPreview.prompt}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#e3e3e3] line-clamp-2 max-w-xl">{selectedPreview.prompt}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(selectedPreview)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs text-white"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setSelectedPreview(null)}
                    className="px-3 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#35363a] text-xs text-[#9aa0a6] hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
