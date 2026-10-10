import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Search, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Code as CodeIcon, 
  FileText, 
  Send, 
  Paperclip, 
  Loader2, 
  Zap, 
  Layers,
  ChevronUp,
  ShieldCheck,
  Crown,
  X,
  File,
  FileCode,
  Film,
  UploadCloud
} from 'lucide-react';
import { FlowNodeType, AttachedFile } from '../../types';

interface FlowCommandBarProps {
  onGenerate: (
    prompt: string, 
    type: FlowNodeType, 
    options?: { aspectRatio?: string; attachedFile?: AttachedFile }
  ) => void;
  isGenerating: boolean;
  dailyPromptsRemaining: number;
  isPro: boolean;
  onOpenUpgradeModal: () => void;
  attachedFile?: AttachedFile | null;
  onSetAttachedFile?: (file: AttachedFile | null) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const FlowCommandBar: React.FC<FlowCommandBarProps> = ({
  onGenerate,
  isGenerating,
  dailyPromptsRemaining,
  isPro,
  onOpenUpgradeModal,
  attachedFile: externalAttachedFile,
  onSetAttachedFile,
  onShowToast,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<FlowNodeType>('research');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [internalAttachedFile, setInternalAttachedFile] = useState<AttachedFile | null>(null);
  const [isDragOverInput, setIsDragOverInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachedFile = externalAttachedFile !== undefined ? externalAttachedFile : internalAttachedFile;
  const setFile = (file: AttachedFile | null) => {
    if (onSetAttachedFile) {
      onSetAttachedFile(file);
    } else {
      setInternalAttachedFile(file);
    }
  };

  const models: { id: FlowNodeType; label: string; sub: string; icon: any; color: string }[] = [
    {
      id: 'research',
      label: 'Gemini Deep Research',
      sub: 'Gemini 3.1 Pro • Deep Search & Structured Synthesis',
      icon: Search,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      id: 'image',
      label: 'Imagen 3 / Flash Image',
      sub: 'Photorealistic 8K Render & Real Asset Search',
      icon: ImageIcon,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      id: 'video',
      label: 'Veo 3.1 Cinema',
      sub: 'Cinematic Storyboard & 720p/1080p Video Diffusion',
      icon: VideoIcon,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    },
    {
      id: 'code',
      label: 'Code & Systems',
      sub: 'Gemini 3.1 Pro • Architecture, Algorithms & Logic',
      icon: CodeIcon,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
  ];

  const currentModel = models.find((m) => m.id === selectedType) || models[0];

  const processSelectedFile = (file: File) => {
    // 1. Enforce size limits: Max 20MB for images & documents, Max 100MB for video assets
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const maxSizeBytes = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    const maxSizeLabel = isVideo ? '100MB' : '20MB';

    if (file.size > maxSizeBytes) {
      onShowToast?.(
        'error',
        `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed for ${isVideo ? 'video' : 'images/documents'} is ${maxSizeLabel}.`
      );
      return;
    }

    let category: 'image' | 'video' | 'document' | 'other' = 'other';
    if (isImage) category = 'image';
    else if (isVideo) category = 'video';
    else if (
      file.type.includes('pdf') ||
      file.type.includes('text') ||
      file.type.includes('document') ||
      file.name.match(/\.(pdf|txt|docx|doc|csv|json|md)$/i)
    ) {
      category = 'document';
    }

    // Automatically adapt recommended model type if user hasn't explicitly selected one
    if (category === 'image' && selectedType !== 'image') {
      setSelectedType('image');
    } else if (category === 'video' && selectedType !== 'video') {
      setSelectedType('video');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      const previewUrl = category === 'image' || category === 'video' ? data : undefined;
      
      const newAttachment: AttachedFile = {
        id: `att_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        category,
        previewUrl,
        data,
      };

      setFile(newAttachment);
      onShowToast?.('success', `Attached "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
    };

    reader.onerror = () => {
      onShowToast?.('error', 'Failed to read the selected file. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
    // reset input so the same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverInput(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverInput(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverInput(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && !attachedFile) || isGenerating) return;

    if (!isPro && dailyPromptsRemaining <= 0) {
      onOpenUpgradeModal();
      return;
    }

    const finalPrompt = prompt.trim() || (attachedFile ? `Analyze and synthesize insights from attached file: ${attachedFile.name}` : '');

    onGenerate(finalPrompt, selectedType, {
      aspectRatio,
      attachedFile: attachedFile || undefined,
    });

    setPrompt('');
    setFile(null);
  };

  const getFileCategoryIcon = (file: AttachedFile) => {
    if (file.category === 'image') return ImageIcon;
    if (file.category === 'video') return Film;
    if (file.name.match(/\.(ts|js|py|html|css|json)$/i)) return FileCode;
    return FileText;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 pointer-events-auto">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime,.pdf,.txt,.docx,.doc,.csv,.json,.md"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Model Picker Flyout Menu */}
      {showModelPicker && (
        <div className="mb-2 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {models.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedType === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedType(m.id);
                  setShowModelPicker(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg border ${m.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{m.label}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{m.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Command Bar Container with Dropzone Target */}
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl bg-slate-900/95 backdrop-blur-xl border transition-all duration-200 shadow-2xl p-2.5 flex flex-col gap-2 ring-1 ${
          isDragOverInput
            ? 'border-indigo-400 ring-4 ring-indigo-500/30 bg-indigo-950/30'
            : 'border-slate-700 ring-white/10'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Model Selector Pill */}
          <button
            type="button"
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer shrink-0"
          >
            <currentModel.icon className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentModel.label}</span>
            <ChevronUp className={`w-3 h-3 text-slate-400 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
          </button>

          {/* Aspect Ratio Selector (for Image/Video) */}
          {(selectedType === 'image' || selectedType === 'video') && (
            <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[11px] font-mono">
              {(['16:9', '9:16', '1:1'] as const).map((ar) => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setAspectRatio(ar)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    aspectRatio === ar ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          )}

          {/* Freemium / Quota Status Pill */}
          <div className="ml-auto flex items-center gap-2">
            {!isPro ? (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>{dailyPromptsRemaining}/3 Free</span>
                <span className="text-[10px] text-amber-400 underline">Upgrade</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-semibold">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Pro Unlimited</span>
              </span>
            )}
          </div>
        </div>

        {/* Visual Preview Pill for Attached File */}
        {attachedFile && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-slate-200 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 min-w-0">
              {attachedFile.category === 'image' && attachedFile.previewUrl ? (
                <img
                  src={attachedFile.previewUrl}
                  alt={attachedFile.name}
                  className="w-8 h-8 rounded-lg object-cover border border-indigo-400/50 shrink-0 shadow"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                  {React.createElement(getFileCategoryIcon(attachedFile), { className: 'w-4 h-4' })}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-100 truncate text-[11px] max-w-[200px] sm:max-w-[280px]">
                    {attachedFile.name}
                  </span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {attachedFile.category}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {(attachedFile.size / 1024).toFixed(1)} KB • Multi-Modal Ready
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Animate Photo into Video Quick Button */}
              {attachedFile.category === 'image' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('video');
                    setAspectRatio('16:9');
                    if (!prompt.trim()) {
                      setPrompt('Animate this photo with cinematic camera motion and dynamic lighting');
                    }
                    onShowToast?.('info', 'Set mode to Veo 3.1: Animate Image into Video (16:9)');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 hover:text-pink-200 text-[11px] font-medium transition-all cursor-pointer shadow-sm"
                >
                  <Film className="w-3.5 h-3.5 text-pink-400" />
                  <span>Animate into Video (Veo 3.1)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setFile(null)}
                title="Remove attached file"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Input Textarea & Action Row */}
        <div className="flex items-center gap-2 bg-slate-950/80 rounded-xl px-3 py-2 border border-slate-800/80">
          {/* Local Drive File Picker Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file from local drive (Images, Videos, PDFs, Docs)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              attachedFile
                ? `Prompt for attached ${attachedFile.name} (or press Enter to synthesize)...`
                : selectedType === 'research'
                ? "Ask Deep Research to synthesize anything or drop files here..."
                : selectedType === 'image'
                ? "Describe an image for Imagen 3 or attach a reference image..."
                : selectedType === 'video'
                ? "Describe a cinematic motion sequence for Veo 2 or attach video storyboard..."
                : "Enter architectural requirements or drop code specifications..."
            }
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={(!prompt.trim() && !attachedFile) || isGenerating}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center shrink-0"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};
