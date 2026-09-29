import React, { useRef } from 'react';
import { Plus, Mic, Search, Palette, Send, X, Loader2, Film, Paperclip, Check } from 'lucide-react';
import { AttachedFile } from '../types';

interface PromptBarProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isGenerating?: boolean;
  attachedFile?: AttachedFile | null;
  onSetAttachedFile?: (file: AttachedFile | null) => void;
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
  isGenerating = false,
  attachedFile,
  onSetAttachedFile,
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
      onSend();
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
      onShowToast?.('success', `Attached "${file.name}"`);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-[800px] mx-auto bg-[#1e1f20] border border-[#3c4043] rounded-[28px] p-2.5 shadow-2xl transition-all focus-within:border-[#4e8cff]/70 focus-within:shadow-[0_0_20px_rgba(78,140,255,0.15)]">
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
                className="w-7 h-7 rounded-lg object-cover border border-[#4e8cff]/40 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#2d2e30] flex items-center justify-center text-[#9aa0a6] shrink-0">
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
            {attachedFile.category === 'image' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                <Film size={11} /> Veo 3.1
              </span>
            )}
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
        placeholder={
          attachedFile
            ? `Ask about ${attachedFile.name} or prompt to animate/transform...`
            : isDeepResearch
            ? 'Ask Deep Research for comprehensive multi-source intelligence...'
            : 'Ask PulseNote'
        }
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
            title="Attach file (images, videos, documents)"
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

          <button
            type="button"
            onClick={onSend}
            disabled={(!input.trim() && !attachedFile) || isGenerating}
            className="bg-white text-black disabled:opacity-40 disabled:hover:bg-white p-2.5 rounded-full hover:bg-gray-200 transition-all cursor-pointer shadow-md flex items-center justify-center"
            title="Send message"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin text-black" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
