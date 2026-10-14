import React, { useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Download,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { generateVideoWithVeo, GeneratedVideoResult } from '../services/mediaService';

interface VideoStudioProps {
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function VideoStudio({ onShowToast }: VideoStudioProps) {
  // Read prompt from React state at submit time
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideoResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Gallery of generated videos
  const [gallery, setGallery] = useState<GeneratedVideoResult[]>([]);

  // Handle Video Generation
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Block submit if prompt is empty
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setError('Please enter a description for the video.');
      return;
    }

    if (isGenerating) return;

    setError(null);
    setIsGenerating(true);
    setStatusMessage('Initiating Veo 3.0 generation operation...');
    setProgressPercent(5);

    try {
      // Send user's prompt EXACTLY as typed (no system prompt or doc instructions prepended)
      // Long-running operation polled every 10 seconds until operation.done is true (max 6 minutes)
      const result = await generateVideoWithVeo(
        cleanPrompt,
        (status, percent) => {
          setStatusMessage(status);
          setProgressPercent(percent);
        },
        aspectRatio
      );

      setCurrentVideo(result);
      setGallery((prev) => [result, ...prev]);
      onShowToast?.('success', 'Video generated successfully with Veo 3.0');
    } catch (err: any) {
      console.error('[VideoStudio] Generation error:', err);
      // Show exact error message instead of blank player
      const errorMsg = err?.message || 'Video generation failed or was blocked by safety filters.';
      setError(errorMsg);
      onShowToast?.('error', errorMsg);
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
      setProgressPercent(0);
    }
  };

  const handleDownload = (video: GeneratedVideoResult) => {
    const a = document.createElement('a');
    a.href = video.blobUrl;
    a.download = `veo-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.('success', 'Video downloaded');
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('info', 'Prompt copied to clipboard');
  };

  const samplePrompts = [
    'A cinematic drone shot flying over a bioluminescent misty pine forest at dusk, volumetric fog and soft glowing blue lights, 4k ultra-realistic',
    'A drop of water splashing in super slow motion into a calm lake, ripples expanding with golden sunset reflections',
    'Smooth camera pan across a sleek minimalist architecture pavilion nestled among rugged Nordic mountains with snow flurries',
    'A close-up shot of an antique mechanical brass clock with intricate gears turning smoothly in warm studio lighting',
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        {/* Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2d2e30] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Film size={20} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
                Veo 3.0 Video Studio
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-normal">
                  veo-3.0-generate-001
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#9aa0a6] mt-1">
              Generate cinematic video clips via Google's Veo 3.0 foundation model. Long-running operations are polled every 10 seconds and served safely via server-proxied video blobs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9aa0a6] hidden sm:inline">Active Model:</span>
            <div className="px-3 py-1.5 rounded-lg bg-[#1e1f20] border border-[#3c4043] text-xs font-mono text-purple-300">
              veo-3.0-generate-001
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 shadow-xl space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="veo-prompt" className="block text-xs font-medium text-[#c4c7c5] mb-1.5">
                Cinematic Video Scene Description
              </label>
              <textarea
                id="veo-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe camera movement, lighting, subject action, atmosphere, and cinematic details..."
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
                {(['16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-[#2d2e30] text-[#9aa0a6] hover:text-white hover:bg-[#35363a]'
                    }`}
                  >
                    {ratio} {ratio === '16:9' ? '(Landscape)' : '(Portrait)'}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Rendering with Veo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Video</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Prompts */}
          <div className="pt-2 border-t border-[#2d2e30]/60">
            <span className="text-[11px] text-[#9aa0a6] block mb-2 font-medium">Example cinematic prompts:</span>
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

        {/* Error Notice - If the operation returns an error or no video, show that exact error message */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 text-red-200">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-red-300">Video Generation Error</p>
              <p className="mt-0.5 text-xs text-red-200/90 leading-relaxed font-mono">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400 hover:text-red-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Long Running Operation Progress Card */}
        {isGenerating && (
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <RefreshCw size={32} className="animate-spin" />
            </div>

            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between text-xs text-[#c4c7c5]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock size={13} className="text-purple-400" />
                  Veo 3.0 Rendering Pipeline
                </span>
                <span className="font-mono text-purple-300">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[#131314] overflow-hidden border border-[#3c4043]">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-xs text-[#9aa0a6] pt-1">
                {statusMessage || 'Polling every 10 seconds until operation is complete (max 6 minutes)...'}
              </p>
            </div>
          </div>
        )}

        {/* Current Video Showcase (Renders <video controls> with Blob/Object URL) */}
        {!isGenerating && currentVideo && (
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-[#3c4043]/50">
              {/* Never put the raw URI in the video tag; using safe server-downloaded blobUrl */}
              <video
                src={currentVideo.blobUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain aspect-video rounded-lg bg-black"
              />
            </div>

            {/* Info & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 px-1">
              <div className="space-y-0.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {currentVideo.model}
                  </span>
                  <span className="text-[11px] text-[#9aa0a6] font-mono">video/mp4</span>
                  <span className="text-[11px] text-[#9aa0a6] font-mono truncate max-w-[200px]" title={currentVideo.operationName}>
                    {currentVideo.operationName}
                  </span>
                </div>
                <p className="text-xs text-[#c4c7c5] line-clamp-2 italic">"{currentVideo.prompt}"</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(currentVideo.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#35363a] text-xs text-[#e3e3e3] transition cursor-pointer"
                  title="Copy prompt"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(currentVideo)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium transition cursor-pointer shadow-md shadow-purple-600/20"
                >
                  <Download size={14} />
                  <span>Download MP4</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Gallery */}
        {gallery.length > 1 && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-purple-400" />
                <h3 className="text-sm font-medium text-white">Session Videos ({gallery.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setGallery([])}
                className="flex items-center gap-1 text-[11px] text-[#9aa0a6] hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gallery.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#1e1f20] border border-[#2d2e30] rounded-xl p-3 space-y-2 overflow-hidden shadow-md"
                >
                  <video
                    src={item.blobUrl}
                    controls
                    className="w-full aspect-video rounded-lg object-contain bg-black"
                  />
                  <div className="flex items-center justify-between text-xs pt-1">
                    <p className="text-[#c4c7c5] text-[11px] truncate max-w-[240px]">{item.prompt}</p>
                    <button
                      onClick={() => handleDownload(item)}
                      className="text-purple-400 hover:text-purple-300 font-medium text-[11px] flex items-center gap-1"
                    >
                      <Download size={12} /> Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
