import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Play, 
  Film, 
  Image as ImageIcon, 
  Code, 
  RotateCcw, 
  Maximize2, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mediaType?: 'text' | 'image' | 'video' | 'animation';
  mediaUrl?: string;
  animationCode?: string;
  videoParams?: {
    videoUrl?: string;
    previewPosterUrl?: string;
    title?: string;
    aspectRatio?: string;
  };
  imageResults?: any[];
  userAttachment?: {
    previewUrl?: string;
    name?: string;
    category?: string;
  };
  isStreaming?: boolean;
  statusMessage?: string;
  progressPercent?: number;
  error?: string;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onAnimateImage?: (imageUrl: string, title: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onRetry?: (message: ChatMessage) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onAnimateImage,
  onShowToast,
  onRetry,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onShowToast?.('success', 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = (url: string, filename: string = 'gemini-image.png') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast?.('success', 'Image download started');
  };

  const handleDownloadVideo = (url: string, filename: string = 'veo-video.mp4') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast?.('success', 'Video download started');
  };

  // User Message
  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="bg-[#1e1f20] text-[#e3e3e3] ml-auto max-w-[85%] md:max-w-[70%] p-4 rounded-3xl border border-[#3c4043]/40 shadow-sm leading-relaxed text-[15px] space-y-2">
          {message.userAttachment?.previewUrl && (
            <div className="relative rounded-xl overflow-hidden max-w-xs border border-[#3c4043] bg-black">
              <img
                src={message.userAttachment.previewUrl}
                alt={message.userAttachment.name || 'Uploaded visual'}
                className="w-full max-h-48 object-cover rounded-lg"
              />
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] bg-black/70 text-cyan-300 font-mono">
                Image Understanding
              </span>
            </div>
          )}
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  // Model Assistant Message
  return (
    <div className="flex gap-4 w-full text-[15px] leading-relaxed group">
      {/* PulseNote AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4e8cff] to-[#ff5757] flex items-center justify-center text-white shrink-0 shadow-md mt-1">
        <Sparkles size={16} />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Error Notification */}
        {message.error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-200 text-xs flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Generation Error</p>
                <p className="mt-0.5 leading-normal">{message.error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message)}
                className="px-3 py-1 bg-red-800/50 hover:bg-red-700/60 text-white rounded-lg transition-colors shrink-0 font-medium text-xs flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Video Generation Progress Indicator (Veo) */}
        {message.mediaType === 'video' && message.isStreaming && (
          <div className="p-4 bg-slate-900 border border-purple-800/40 rounded-2xl space-y-3 max-w-[640px]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-purple-300 font-medium">
                <Loader2 size={16} className="animate-spin text-purple-400" />
                <span>{message.statusMessage || 'Veo is rendering your cinematic video...'}</span>
              </div>
              <span className="font-mono text-purple-400 font-semibold">
                {message.progressPercent || 25}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-purple-900/40">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${message.progressPercent || 25}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Polling every 10 seconds via Google GenAI Veo operations pipeline.
            </p>
          </div>
        )}

        {/* Rendered Media: Generated Image (gemini-2.5-flash-image) */}
        {message.mediaType === 'image' && message.mediaUrl && (
          <div className="rounded-2xl overflow-hidden bg-black border border-[#3c4043] p-2 space-y-2 max-w-[640px]">
            <div className="relative aspect-square sm:aspect-auto max-h-[500px] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
              <img
                src={message.mediaUrl}
                alt={message.content || 'Generated Visual'}
                className="w-full h-full object-contain max-h-[500px] rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between px-1 text-xs text-slate-400">
              <span className="truncate">gemini-2.5-flash-image</span>
              <button
                type="button"
                onClick={() => handleDownloadImage(message.mediaUrl!, 'gemini-generated-image.png')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] text-white text-xs transition"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        {/* Rendered Media: Veo Video */}
        {message.mediaType === 'video' && (message.videoParams?.videoUrl || message.mediaUrl) && (
          <div className="rounded-2xl overflow-hidden bg-black border border-[#3c4043] p-2 space-y-2 max-w-[640px]">
            <video
              src={message.videoParams?.videoUrl || message.mediaUrl}
              controls
              autoPlay
              loop
              poster={message.videoParams?.previewPosterUrl}
              className="w-full aspect-video rounded-xl object-contain bg-black"
            />
            <div className="flex items-center justify-between px-1 text-xs text-slate-400">
              <span className="truncate font-medium">Veo Video (16:9)</span>
              <button
                type="button"
                onClick={() => handleDownloadVideo(message.videoParams?.videoUrl || message.mediaUrl!, 'veo-generated-video.mp4')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] text-white text-xs transition"
              >
                <Download size={13} />
                <span>Download MP4</span>
              </button>
            </div>
          </div>
        )}

        {/* Rendered Media: Live Animation in Sandboxed Iframe */}
        {message.mediaType === 'animation' && message.animationCode && (
          <div className="rounded-2xl overflow-hidden bg-[#090a0f] border border-[#3c4043] p-3 space-y-3 max-w-[680px] shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200">Live Sandboxed Animation</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  60 FPS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIframeKey((prev) => prev + 1)}
                  className="p-1 hover:bg-[#2d2e30] text-slate-300 hover:text-white rounded-md transition"
                  title="Replay animation"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="px-2.5 py-1 bg-[#2d2e30] hover:bg-[#3c4043] text-slate-200 text-xs rounded-md transition flex items-center gap-1"
                >
                  <Code size={13} />
                  <span>{showCode ? 'View Preview' : 'View Code'}</span>
                </button>
              </div>
            </div>

            {showCode ? (
              <pre className="p-3 bg-black/80 rounded-xl overflow-x-auto text-[11px] font-mono text-cyan-200 max-h-72 border border-slate-800">
                <code>{message.animationCode}</code>
              </pre>
            ) : (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  srcDoc={message.animationCode}
                  sandbox="allow-scripts"
                  title="Live Animation Preview"
                  className="w-full h-full border-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Text Content with Markdown */}
        {message.content && (
          <div className="prose prose-invert max-w-none text-[#e3e3e3] prose-p:leading-relaxed prose-pre:bg-[#1e1f20] prose-pre:border prose-pre:border-[#3c4043] prose-pre:rounded-xl">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Streaming Cursor */}
        {message.isStreaming && !message.mediaType && (
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
