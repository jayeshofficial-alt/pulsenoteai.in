import React, { useRef } from 'react';
import {
  Plus,
  Mic,
  Send,
  X,
  Paperclip,
  Square,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { AttachedFile } from '../types';

export type GeminiToolMode = 'chat' | 'understanding';

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

    const isImage = file.type.startsWith('image/');
    const maxSizeBytes = 20 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      onShowToast?.(
        'error',
        `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is 20MB.`
      );
      return;
    }

    let category: 'image' | 'video' | 'document' | 'other' = 'other';
    if (isImage) category = 'image';
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
        previewUrl: category === 'image' ? data : undefined,
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

  const toolModes: Array<{ id: GeminiToolMode; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = [
    { id: 'chat', label: 'Document Assistant', icon: MessageSquare, color: 'text-blue-400' },
    { id: 'understanding', label: 'Analyze Attachment', icon: FileText, color: 'text-emerald-400' },
  ];

  const getPlaceholder = () => {
    if (toolMode === 'understanding') {
      return attachedFile
        ? `Ask a documentation question about ${attachedFile.name}...`
        : 'Attach a clinical note, lab summary, or document to structure...';
    }
    return 'Paste a clinical transcript, encounter notes, or ask to draft a SOAP note, discharge summary, referral, memo, or RFC...';
  };

  return (
    <div className="w-full max-w-[840px] mx-auto space-y-2">
      {/* Focused Document Mode Switcher */}
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
          accept="image/png,image/jpeg,image/webp,.pdf,.txt,.docx,.doc,.csv,.json,.md"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Preview */}
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

            <button
              type="button"
              onClick={() => onSetAttachedFile?.(null)}
              className="p-1 hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-red-400 rounded-full transition-colors cursor-pointer shrink-0"
              title="Remove attachment"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Text Input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="w-full bg-transparent outline-none px-4 py-2 text-[15px] text-[#e3e3e3] placeholder:text-[#9aa0a6]"
          autoFocus
        />

        {/* Button Toolbar */}
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-[#2d2e30] text-[#c4c7c5] hover:text-white rounded-full transition-colors cursor-pointer"
              title="Attach document or scanned note"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={onStartVoice}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isRecording
                  ? 'bg-red-500/20 text-red-400'
                  : 'hover:bg-[#2d2e30] text-[#c4c7c5] hover:text-white'
              }`}
              title={isRecording ? 'Listening...' : 'Voice dictation'}
            >
              <Mic size={18} />
            </button>

            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center"
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
                title="Generate structured document"
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
