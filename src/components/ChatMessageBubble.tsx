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
  ExternalLink,
  Lock,
  FileDown,
  FileText,
  FileCode,
  RefreshCw
} from 'lucide-react';
import { exportNoteToPdf, exportNoteToDocx, generateFhirHl7ReadyJson, NoteExportSection } from '../lib/exportUtils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mediaType?: 'text' | 'image' | 'video' | 'animation';
  mediaUrl?: string;
  videoBlob?: Blob;
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
  structuredNote?: Record<string, string>;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isPaidPlan?: boolean;
  onOpenPricing?: () => void;
  onAnimateImage?: (imageUrl: string, title: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onRetry?: (message: ChatMessage) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isPaidPlan = false,
  onOpenPricing,
  onAnimateImage,
  onShowToast,
  onRetry,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
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

  const handleDownloadVideo = (url: string, filename: string = 'veo-video.mp4', blob?: Blob) => {
    try {
      const link = document.createElement('a');
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = filename.replace(/\.mp4$/i, '.webm');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } else {
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      onShowToast?.('success', 'Video download started');
    } catch {
      onShowToast?.('error', 'Video download failed');
    }
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
              <span className="truncate font-mono text-[11px] text-amber-300">imagen-4.0-generate-001</span>
              <button
                type="button"
                onClick={() => handleDownloadImage(message.mediaUrl!, 'imagen-generated-image.png')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] text-white text-xs transition cursor-pointer"
              >
                <Download size={13} />
                <span>Download PNG</span>
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
              <span className="truncate font-mono text-[11px] text-purple-300">veo-3.0-generate-001</span>
              <button
                type="button"
                onClick={() => handleDownloadVideo(message.videoParams?.videoUrl || message.mediaUrl!, 'veo-generated-video.mp4', message.videoBlob)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] text-white text-xs transition cursor-pointer"
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

        {/* Error State with prominent Retry button (Never blank output) */}
        {message.error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start justify-between gap-3 text-red-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-300">Generation Notice</p>
                <p className="text-xs text-red-200/90 mt-0.5">{message.error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message)}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <RefreshCw size={13} />
                <span>Retry</span>
              </button>
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

        {/* Message Actions & Paywalled Downloads (Section 5) */}
        {!message.isStreaming && message.content && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2d2e30]/60">
            {/* Copy raw response button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/50 text-[#c4c7c5] hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5"
              title="Copy response"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Export PDF Button (Pro/Team only) */}
            <button
              type="button"
              onClick={async () => {
                if (!isPaidPlan) {
                  onShowToast?.('info', 'PDF export is locked on the Free plan. Upgrade to Pro or Team to download.');
                  onOpenPricing?.();
                  return;
                }
                setIsExportingPdf(true);
                try {
                  const sections = extractSectionsFromNote(message.content, message.structuredNote);
                  exportNoteToPdf({ title: 'PulseNote Clinical & Enterprise Record', authorName: 'PulseNote AI' }, sections);
                  onShowToast?.('success', 'PDF downloaded successfully.');
                } catch (e: any) {
                  onShowToast?.('error', e?.message || 'Failed to export PDF.');
                } finally {
                  setIsExportingPdf(false);
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                !isPaidPlan
                  ? 'bg-[#1e1f20] border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                  : 'bg-[#1e1f20] hover:bg-[#2d2e30] border-blue-500/30 text-blue-300 hover:text-white'
              }`}
              title={!isPaidPlan ? 'Upgrade to Pro to export PDF' : 'Download formatted PDF note'}
            >
              {!isPaidPlan ? <Lock size={12} className="text-amber-400" /> : <FileDown size={13} className="text-blue-400" />}
              <span>Export PDF</span>
            </button>

            {/* Export Word (.docx) Button (Pro/Team only) */}
            <button
              type="button"
              onClick={async () => {
                if (!isPaidPlan) {
                  onShowToast?.('info', 'Word (.docx) export is locked on the Free plan. Upgrade to Pro or Team to download.');
                  onOpenPricing?.();
                  return;
                }
                setIsExportingDocx(true);
                try {
                  const sections = extractSectionsFromNote(message.content, message.structuredNote);
                  await exportNoteToDocx({ title: 'PulseNote Clinical & Enterprise Record', authorName: 'PulseNote AI' }, sections);
                  onShowToast?.('success', 'Word (.docx) file downloaded successfully.');
                } catch (e: any) {
                  onShowToast?.('error', e?.message || 'Failed to export Word file.');
                } finally {
                  setIsExportingDocx(false);
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                !isPaidPlan
                  ? 'bg-[#1e1f20] border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                  : 'bg-[#1e1f20] hover:bg-[#2d2e30] border-indigo-500/30 text-indigo-300 hover:text-white'
              }`}
              title={!isPaidPlan ? 'Upgrade to Pro to export Word (.docx)' : 'Download formatted Word (.docx) note'}
            >
              {!isPaidPlan ? <Lock size={12} className="text-amber-400" /> : <FileText size={13} className="text-indigo-400" />}
              <span>Export Word (.docx)</span>
            </button>

            {/* Copy as FHIR / HL7-ready text (Pro/Team only) */}
            <button
              type="button"
              onClick={() => {
                if (!isPaidPlan) {
                  onShowToast?.('info', 'FHIR / HL7 text export is locked on the Free plan. Upgrade to Pro or Team to unlock.');
                  onOpenPricing?.();
                  return;
                }
                const sections = extractSectionsFromNote(message.content, message.structuredNote);
                const fhirJson = generateFhirHl7ReadyJson({ title: 'PulseNote SOAP Clinical Composition' }, sections);
                navigator.clipboard.writeText(fhirJson);
                setCopiedFhir(true);
                onShowToast?.('success', 'FHIR / HL7 Composition JSON copied to clipboard.');
                setTimeout(() => setCopiedFhir(false), 2500);
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                !isPaidPlan
                  ? 'bg-[#1e1f20] border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                  : 'bg-[#1e1f20] hover:bg-[#2d2e30] border-emerald-500/30 text-emerald-300 hover:text-white'
              }`}
              title={!isPaidPlan ? 'Upgrade to Pro to export FHIR / HL7 JSON' : 'Copy structured FHIR HL7 JSON'}
            >
              {!isPaidPlan ? <Lock size={12} className="text-amber-400" /> : copiedFhir ? <Check size={13} className="text-emerald-400" /> : <FileCode size={13} className="text-emerald-400" />}
              <span>{copiedFhir ? 'Copied FHIR JSON' : 'Copy as FHIR / HL7'}</span>
            </button>
          </div>
        )}

        {/* Clinical / Legal Disclaimer Line */}
        {!message.isStreaming && message.content && message.role === 'model' && (
          <div className="mt-2 text-[11px] text-[#9aa0a6] flex items-center gap-1.5 italic border-t border-[#2d2e30]/40 pt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>AI-assisted draft. A licensed professional must review before use.</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to convert structured note or markdown text into NoteExportSections
function extractSectionsFromNote(
  content: string,
  structuredNote?: Record<string, string>
): NoteExportSection[] {
  if (structuredNote && Object.keys(structuredNote).length > 0) {
    return Object.entries(structuredNote).map(([key, val]) => ({
      title: key.toUpperCase(),
      content: val || 'Not documented',
    }));
  }

  // Try parsing JSON if content itself is JSON
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, val]) => ({
        title: key.toUpperCase(),
        content: typeof val === 'string' ? val : JSON.stringify(val),
      }));
    }
  } catch {}

  // Parse markdown headings
  const lines = content.split('\n');
  const sections: NoteExportSection[] = [];
  let currentTitle = 'Clinical / Enterprise Synthesis';
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^#{1,4}\s+(.+)$/);
    if (match) {
      if (currentLines.length > 0) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
        currentLines = [];
      }
      currentTitle = match[1].trim();
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
  }

  return sections.length > 0 ? sections : [{ title: 'Documentation Note', content }];
}
