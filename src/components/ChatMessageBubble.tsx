import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Loader2,
  Lock,
  FileDown,
  FileText,
  FileCode,
  Stethoscope,
} from 'lucide-react';
import { exportNoteToPdf, exportNoteToDocx, generateFhirHl7ReadyJson, NoteExportSection } from '../lib/exportUtils';
import type { Icd10Suggestion } from '../types';
import { auth } from '../lib/firebase';

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
  imageResults?: unknown[];
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
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onRetry?: (message: ChatMessage) => void;
}

const NOT_SPECIFIED_REGEX = /(Not specified in transcript\.?|Not documented\.?)/gi;

function renderMutedNotSpecified(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child !== 'string') return child;
    if (!NOT_SPECIFIED_REGEX.test(child)) return child;
    NOT_SPECIFIED_REGEX.lastIndex = 0;
    const parts = child.split(NOT_SPECIFIED_REGEX);
    return parts.map((part, idx) => {
      if (/^(Not specified in transcript\.?|Not documented\.?)$/i.test(part)) {
        return (
          <span key={idx} className="text-slate-400 italic">
            Not specified in transcript
          </span>
        );
      }
      return part;
    });
  });
}

function isSoapNoteMessage(message: ChatMessage): boolean {
  if (message.structuredNote) {
    const keys = Object.keys(message.structuredNote).map((k) => k.toLowerCase());
    if (keys.includes('subjective') && keys.includes('assessment')) {
      return true;
    }
  }
  const text = message.content || '';
  return /\bSUBJECTIVE\b/i.test(text) && /\bASSESSMENT\b/i.test(text) && /\bPLAN\b/i.test(text);
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isPaidPlan = false,
  onOpenPricing,
  onShowToast,
  onRetry,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [icdLoading, setIcdLoading] = useState(false);
  const [icdSuggestions, setIcdSuggestions] = useState<Icd10Suggestion[] | null>(null);
  const [icdDisclaimer, setIcdDisclaimer] = useState<string | null>(null);

  const showIcdButton = !isUser && !message.isStreaming && Boolean(message.content) && isSoapNoteMessage(message);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onShowToast?.('success', 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuggestIcd10 = async () => {
    if (!isPaidPlan) {
      onShowToast?.('info', 'ICD-10 code suggestions are included in Pro, Team, and Enterprise plans.');
      onOpenPricing?.();
      return;
    }

    setIcdLoading(true);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (auth?.currentUser?.email) headers['x-user-email'] = auth.currentUser.email;

      const soapText = message.structuredNote
        ? Object.entries(message.structuredNote)
            .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
            .join('\n')
        : message.content;

      const res = await fetch('/api/notes/suggest-icd10', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          soapNote: message.structuredNote || undefined,
          noteText: soapText,
          userId: auth?.currentUser?.uid || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === 'UPGRADE_REQUIRED') {
          onOpenPricing?.();
        }
        throw new Error(data?.message || 'Failed to suggest ICD-10 codes.');
      }

      setIcdSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setIcdDisclaimer(
        data.disclaimer || 'Coding suggestions only — verify against current ICD-10-CM guidelines before billing.'
      );
      onShowToast?.('success', `Generated ${data.suggestions?.length || 0} ICD-10-CM code suggestions.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to suggest ICD-10 codes.';
      onShowToast?.('error', msg);
    } finally {
      setIcdLoading(false);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="bg-[#1e1f20] text-[#e3e3e3] ml-auto max-w-[85%] md:max-w-[70%] p-4 rounded-3xl border border-[#3c4043]/40 shadow-sm leading-relaxed text-[15px] space-y-2">
          {message.userAttachment?.previewUrl && (
            <div className="relative rounded-xl overflow-hidden max-w-xs border border-[#3c4043] bg-black">
              <img
                src={message.userAttachment.previewUrl}
                alt={message.userAttachment.name || 'Attached document'}
                className="w-full max-h-48 object-cover rounded-lg"
              />
            </div>
          )}
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 w-full text-[15px] leading-relaxed group">
      {/* PulseNote AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4e8cff] to-[#6366f1] flex items-center justify-center text-white shrink-0 shadow-md mt-1">
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
                className="px-3 py-1 bg-red-800/50 hover:bg-red-700/60 text-white rounded-lg transition-colors shrink-0 font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Text Content with Markdown & Muted "Not specified in transcript" */}
        {message.content && (
          <div className="prose prose-invert max-w-none text-[#e3e3e3] prose-p:leading-relaxed prose-pre:bg-[#1e1f20] prose-pre:border prose-pre:border-[#3c4043] prose-pre:rounded-xl">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p>{renderMutedNotSpecified(children)}</p>,
                li: ({ children }) => <li>{renderMutedNotSpecified(children)}</li>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Streaming Cursor */}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-[#4e8cff] animate-pulse ml-1 rounded-sm" />
        )}

        {/* ICD-10-CM Suggestions Panel (Pro+) */}
        {icdSuggestions && (
          <div className="rounded-2xl border border-emerald-500/30 bg-[#131720] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <Stethoscope size={15} />
                <span>Suggested ICD-10-CM Codes</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const summary = icdSuggestions
                    .map((s) => `${s.code} — ${s.description} (${s.rationale})`)
                    .join('\n');
                  navigator.clipboard.writeText(summary);
                  onShowToast?.('success', 'Copied ICD-10-CM code list.');
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1e1f20] hover:bg-[#2d2e30] text-slate-200 border border-[#3c4043] cursor-pointer"
              >
                Copy Codes
              </button>
            </div>

            {icdSuggestions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No billable diagnoses explicitly documented in this SOAP note.
              </p>
            ) : (
              <div className="space-y-2">
                {icdSuggestions.map((item, idx) => (
                  <div
                    key={`${item.code}-${idx}`}
                    className="rounded-xl bg-[#1b1f2a] border border-white/10 p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {item.code}
                        </span>
                        <span className="text-xs font-semibold text-white">{item.description}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{item.rationale}</p>
                      {item.specificityNote && (
                        <p className="text-[11px] text-amber-300/90 italic">{item.specificityNote}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {icdDisclaimer && (
              <p className="text-[11px] text-slate-400 italic">{icdDisclaimer}</p>
            )}
          </div>
        )}

        {/* Message Actions & Document Exports */}
        {!message.isStreaming && message.content && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2d2e30]/60">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/50 text-[#c4c7c5] hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5"
              title="Copy response"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Suggest ICD-10 Codes (Pro+) */}
            {showIcdButton && (
              <button
                type="button"
                onClick={handleSuggestIcd10}
                disabled={icdLoading}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  isPaidPlan
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#1e1f20] border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                }`}
                title={isPaidPlan ? 'Suggest ICD-10-CM codes from this SOAP note' : 'Upgrade to Pro to unlock ICD-10 code suggestions'}
              >
                {icdLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : !isPaidPlan ? (
                  <Lock size={12} className="text-amber-400" />
                ) : (
                  <Stethoscope size={13} />
                )}
                <span>{icdLoading ? 'Suggesting ICD-10...' : 'Suggest ICD-10 codes'}</span>
                {!isPaidPlan && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Pro
                  </span>
                )}
              </button>
            )}

            {/* Export PDF (Free gets clickable pulsenoteai.in watermark; Pro/Team clean) */}
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={async () => {
                setIsExportingPdf(true);
                try {
                  const sections = extractSectionsFromNote(message.content, message.structuredNote);
                  exportNoteToPdf(
                    {
                      title: 'PulseNote Clinical & Enterprise Record',
                      authorName: 'PulseNote AI',
                      isFreeTier: !isPaidPlan,
                    },
                    sections
                  );
                  onShowToast?.(
                    'success',
                    isPaidPlan
                      ? 'Clean PDF downloaded successfully.'
                      : 'PDF downloaded with Free tier watermark. Upgrade to Pro for watermark-free exports.'
                  );
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : 'Failed to export PDF.';
                  onShowToast?.('error', msg);
                } finally {
                  setIsExportingPdf(false);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer bg-[#1e1f20] hover:bg-[#2d2e30] border-blue-500/30 text-blue-300 hover:text-white"
              title={isPaidPlan ? 'Download clean formatted PDF' : 'Download PDF (includes Made with PulseNote AI watermark)'}
            >
              <FileDown size={13} className="text-blue-400" />
              <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
            </button>

            {/* Export Word (.docx) (Free gets clickable pulsenoteai.in watermark; Pro/Team clean) */}
            <button
              type="button"
              disabled={isExportingDocx}
              onClick={async () => {
                setIsExportingDocx(true);
                try {
                  const sections = extractSectionsFromNote(message.content, message.structuredNote);
                  await exportNoteToDocx(
                    {
                      title: 'PulseNote Clinical & Enterprise Record',
                      authorName: 'PulseNote AI',
                      isFreeTier: !isPaidPlan,
                    },
                    sections
                  );
                  onShowToast?.(
                    'success',
                    isPaidPlan
                      ? 'Clean Word (.docx) file downloaded.'
                      : 'Word (.docx) downloaded with Free tier watermark. Upgrade to Pro for watermark-free exports.'
                  );
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : 'Failed to export Word file.';
                  onShowToast?.('error', msg);
                } finally {
                  setIsExportingDocx(false);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer bg-[#1e1f20] hover:bg-[#2d2e30] border-indigo-500/30 text-indigo-300 hover:text-white"
              title={isPaidPlan ? 'Download clean Word (.docx)' : 'Download Word (.docx) (includes Made with PulseNote AI watermark)'}
            >
              <FileText size={13} className="text-indigo-400" />
              <span>{isExportingDocx ? 'Exporting...' : 'Export Word (.docx)'}</span>
            </button>

            {/* Copy as FHIR / HL7-ready JSON (Pro/Team only) */}
            <button
              type="button"
              onClick={() => {
                if (!isPaidPlan) {
                  onShowToast?.('info', 'FHIR / HL7 JSON export is available on Pro & Team plans.');
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
            <span>AI-assisted draft. A licensed professional must review before use.</span>
          </div>
        )}
      </div>
    </div>
  );
};

function extractSectionsFromNote(
  content: string,
  structuredNote?: Record<string, string>
): NoteExportSection[] {
  if (structuredNote && Object.keys(structuredNote).length > 0) {
    return Object.entries(structuredNote).map(([key, val]) => ({
      title: key.toUpperCase(),
      content: val || 'Not specified in transcript',
    }));
  }

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, val]) => ({
        title: key.toUpperCase(),
        content: typeof val === 'string' ? val : JSON.stringify(val),
      }));
    }
  } catch {
    // Fallback to markdown parsing
  }

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
