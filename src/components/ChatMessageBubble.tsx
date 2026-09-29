import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, User, Copy, Check, Download, Play, Film, Image as ImageIcon } from 'lucide-react';
import { MediaExportDropdown } from './MediaExportDropdown';
import { ImageResultsGrid } from './ImageResultsGrid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mediaType?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  videoParams?: any;
  imageResults?: any[];
  isStreaming?: boolean;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onAnimateImage?: (imageUrl: string, title: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onAnimateImage,
  onShowToast,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onShowToast?.('success', 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="bg-[#1e1f20] text-[#e3e3e3] ml-auto max-w-[85%] md:max-w-[70%] p-4 rounded-3xl border border-[#3c4043]/40 shadow-sm leading-relaxed text-[15px]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 w-full text-[15px] leading-relaxed group">
      {/* PulseNote AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4e8cff] to-[#ff5757] flex items-center justify-center text-white shrink-0 shadow-md mt-1">
        <Sparkles size={16} />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Rendered Media: Veo 3.1 Video */}
        {message.mediaType === 'video' && message.videoParams && (
          <div className="rounded-2xl overflow-hidden bg-black border border-[#3c4043] p-2 space-y-2 max-w-[640px]">
            {message.videoParams.videoUrl ? (
              <video
                src={message.videoParams.videoUrl}
                controls
                poster={message.videoParams.previewPosterUrl}
                className="w-full aspect-video rounded-xl object-cover bg-black"
              />
            ) : message.videoParams.previewPosterUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950">
                <img
                  src={message.videoParams.previewPosterUrl}
                  alt={message.videoParams.title || 'Video sequence'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#4e8cff] flex items-center justify-center text-white shadow-xl">
                    <Play size={20} className="ml-1 fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-cyan-300 bg-black/70 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                  <span>Veo 3.1 (veo-3.1-fast-generate-preview)</span>
                  <span>{message.videoParams.aspectRatio || '16:9'}</span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between px-1 text-xs">
              <span className="text-[#9aa0a6] truncate font-medium">
                {message.videoParams.title || 'Veo 3.1 Cinematic Sequence'}
              </span>
              <MediaExportDropdown
                mediaType="video"
                mediaUrl={message.videoParams.videoUrl || message.videoParams.previewPosterUrl || ''}
                title={message.videoParams.title || 'PulseNote_Video'}
                aspectRatio={message.videoParams.aspectRatio || '16:9'}
                onShowToast={onShowToast}
              />
            </div>
          </div>
        )}

        {/* Rendered Media: Imagen 3 Image Search Results */}
        {message.mediaType === 'image' && message.imageResults && message.imageResults.length > 0 && (
          <div className="py-2">
            <ImageResultsGrid
              results={message.imageResults}
              queryTitle={message.content.slice(0, 40)}
              onAnimateImage={onAnimateImage}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* Text Content with Markdown */}
        <div className="prose prose-invert max-w-none text-[#e3e3e3] prose-p:leading-relaxed prose-pre:bg-[#1e1f20] prose-pre:border prose-pre:border-[#3c4043] prose-pre:rounded-xl">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Streaming Cursor */}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-[#4e8cff] animate-pulse ml-1 rounded-sm" />
        )}

        {/* Message Actions */}
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 hover:bg-[#2d2e30] rounded-lg text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Copy response"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
