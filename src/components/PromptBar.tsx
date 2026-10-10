import React, { useRef } from 'react';
import { 
  Plus, 
  Mic, 
  Search, 
  Palette, 
  Send, 
  X, 
  Loader2, 
  Film, 
  Paperclip, 
  Check, 
  Square,
  MessageSquare,
  Eye,
  Image as ImageIcon,
  Sparkles,
  Wand2
} from 'lucide-react';
import { AttachedFile } from '../types';

export type GeminiToolMode = 'chat' | 'understanding' | 'image' | 'video' | 'animation';

interface PromptBarProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isGenerating?: boolean;
  attachedFile?: AttachedFile | null;
  onSetAttachedFile?: (file: AttachedFile | null) => void;
  toolMode?: GeminiToolMode;
  onSetToolMode?: (mode: GeminiToolMode) => void;
  isDeepResearch?: boolean;
  onToggleDeepResearch?: () => void;
  onToggleCanvas?: () => void;
  onStartVoice?: () => void;
  isRecording?: boolean;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function PromptBar({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating = false,
  attachedFile,
  onSetAttachedFile,
  toolMode = 'chat',
  onSetToolMode,
  isDeepResearch = false,
  onToggleDeepResearch,
  onToggleCanvas,
  onStartVoice,
  isRecording = false,
  onShowToast,
}: PromptBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating && onStop) {
        onStop();
      } else {
        onSend();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const maxSizeBytes = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      onShowToast?.(
        'error',
        `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is ${
          isVideo ? '100MB' : '20MB'
        }.`
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

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      const newAttachment: AttachedFile = {
        id: `att_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        category,
        previewUrl: category === 'image' || category === 'video' ? data : undefined,
        data,
      };
      onSetAttachedFile?.(newAttachment);
      if (isImage) {
        onSetToolMode?.('understanding');
      }
      onShowToast?.('success', `Attached "${file.name}"`);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toolModes: Array<{ id: GeminiToolMode; label: string; icon: any; color: string }> = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-blue-400' },
    { id: 'image', label: 'Create Image', icon: ImageIcon, color: 'text-amber-400' },
    { id: 'video', label: 'Veo Video', icon: Film, color: 'text-purple-400' },
    { id: 'animation', label: 'Animation', icon: Wand2, color: 'text-pink-400' },
    { id: 'understanding', label: 'Understand Photo', icon: Eye, color: 'text-emerald-400' },
  ];

  const getPlaceholder = () => {
    switch (toolMode) {
      case 'image':
        return 'Describe the image you want Gemini to create...';
      case 'video':
        return 'Describe a cinematic scene for Veo video generation (16:9 / 9:16)...';
      case 'animation':
        return 'Describe an interactive SVG, CSS, or Canvas animation to render live...';
      case 'understanding':
        return attachedFile
          ? `Ask a question about ${attachedFile.name}...`
          : 'Attach a photo and ask Gemini to explain, analyze, or transcribe...';
      default:
        return isDeepResearch
          ? 'Ask Deep Research for comprehensive multi-source intelligence...'
          : 'Ask PulseNote with Google Gemini...';
    }
  };

  return (
    <div className="w-full max-w-[840px] mx-auto space-y-2">
      {/* Mode / Tool Switcher Bar */}
      <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 no-scrollbar">
        {toolModes.map((m) => {
          const Icon = m.icon;
          const isActive = toolMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSetToolMode?.(m.id);
                if (m.id === 'understanding' && !attachedFile) {
                  fileInputRef.current?.click();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#2d2e30] text-white border border-[#4e8cff]/50 shadow-sm'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#1e1f20]'
              }`}
            >
              <Icon size={13} className={isActive ? m.color : 'text-[#9aa0a6]'} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Input Capsule */}
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-[28px] p-2.5 shadow-2xl transition-all focus-within:border-[#4e8cff]/70 focus-within:shadow-[0_0_20px_rgba(78,140,255,0.15)]">
        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,.pdf,.txt,.docx,.doc,.csv,.json,.md"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Pill (if any) */}
        {attachedFile && (
          <div className="mx-2 mb-2 p-2 rounded-2xl bg-[#131314] border border-[#3c4043] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              {attachedFile.category === 'image' && attachedFile.previewUrl ? (
                <img
                  src={attachedFile.previewUrl}
                  alt={attachedFile.name}
                  className="w-8 h-8 rounded-lg object-cover border border-[#4e8cff]/40 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#2d2e30] flex items-center justify-center text-[#9aa0a6] shrink-0">
                  <Paperclip size={14} />
                </div>
              )}
              <div className="truncate">
                <span className="text-[#e3e3e3] font-medium block truncate max-w-[280px]">
                  {attachedFile.name}
                </span>
                <span className="text-[10px] text-[#9aa0a6]">
                  {(attachedFile.size / 1024).toFixed(1)} KB • {attachedFile.category}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Eye size={11} /> Image Understanding
              </span>
              <button
                type="button"
                onClick={() => onSetAttachedFile?.(null)}
                className="p-1 hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-red-400 rounded-full transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Text Input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="w-full bg-transparent outline-none px-4 py-2 text-[16px] text-[#e3e3e3] placeholder:text-[#9aa0a6]"
          autoFocus
        />

        {/* Button Toolbars */}
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-[#2d2e30] text-[#c4c7c5] hover:text-white rounded-full transition-colors cursor-pointer"
              title="Attach photo or document for Gemini analysis"
            >
              <Plus size={18} />
            </button>

            <button
              type="button"
              onClick={onToggleDeepResearch}
              className={`hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                isDeepResearch
                  ? 'bg-[#4e8cff] text-white font-medium shadow-md shadow-[#4e8cff]/20'
                  : 'bg-[#2d2e30] hover:bg-[#35363a] text-[#c4c7c5] hover:text-white'
              }`}
              title="Toggle Deep Research synthesis"
            >
              <Search size={14} />
              <span>Deep Research</span>
              {isDeepResearch && <Check size={12} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={onToggleCanvas}
              className="hidden md:flex items-center gap-1.5 text-xs bg-[#2d2e30] hover:bg-[#35363a] text-[#c4c7c5] hover:text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              title="Open Infinite Flow Canvas"
            >
              <Palette size={14} />
              <span>Canvas</span>
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={onStartVoice}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'hover:bg-[#2d2e30] text-[#c4c7c5] hover:text-white'
              }`}
              title={isRecording ? 'Listening...' : 'Voice input'}
            >
              <Mic size={18} />
            </button>

            {/* Send or Stop Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center animate-pulse"
                title="Stop generation"
              >
                <Square size={16} className="fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!input.trim() && !attachedFile}
                className="bg-white text-black disabled:opacity-40 disabled:hover:bg-white p-2.5 rounded-full hover:bg-gray-200 transition-all cursor-pointer shadow-md flex items-center justify-center"
                title="Send to Gemini"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
