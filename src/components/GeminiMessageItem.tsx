import React, { useState } from 'react';
import { 
  ChatMessage, 
  TransformedReport, 
  ActionItem,
  SearchSource 
} from '../types';
import { 
  Sparkles, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  ExternalLink, 
  Globe, 
  Film, 
  Image as ImageIcon, 
  Layers, 
  CheckSquare, 
  Square, 
  FileText,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Palette,
  Camera,
  Play
} from 'lucide-react';

interface GeminiMessageItemProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
  onOpenPricing?: () => void;
  onViewReportDetails?: (report: TransformedReport) => void;
  onUpdateActionItem?: (index: number, completed: boolean) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const GeminiMessageItem: React.FC<GeminiMessageItemProps> = ({
  message,
  onRegenerate,
  onFeedback,
  onOpenPricing,
  onViewReportDetails,
  onUpdateActionItem,
  onShowToast,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userFeedback, setUserFeedback] = useState<'like' | 'dislike' | null>(message.feedback || null);

  const isUser = message.role === 'user';
  const report = message.report;

  const handleCopy = () => {
    const textToCopy = report?.markdownReport || message.content;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    onShowToast?.('success', 'Copied response to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      onShowToast?.('info', 'Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = report?.executiveSummary 
      || report?.immediateSolution 
      || message.content.replace(/[#*`_]/g, '');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleFeedbackClick = (type: 'like' | 'dislike') => {
    const next = userFeedback === type ? null : type;
    setUserFeedback(next);
    if (next) {
      onFeedback?.(message.id, next);
      onShowToast?.('success', type === 'like' ? 'Thanks for your feedback!' : 'Feedback noted. We will refine future outputs.');
    }
  };

  // Render markdown line by line
  const renderFormattedMarkdown = (markdown: string) => {
    if (!markdown) return null;

    const lines = markdown.split('\n');
    return (
      <div className="space-y-2 text-slate-200 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-base font-bold text-white pt-2 pb-0.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>{trimmed.replace(/^###\s+/, '')}</span>
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-lg font-bold text-white pt-3 pb-1 border-b border-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                <span>{trimmed.replace(/^##\s+/, '')}</span>
              </h3>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={idx} className="text-xl font-black text-white pt-3 pb-1">
                {trimmed.replace(/^#\s+/, '')}
              </h2>
            );
          }

          // Bullets
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletContent = trimmed.replace(/^([•\-*]\s+)/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="text-teal-400 font-bold leading-normal">•</span>
                <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(bulletContent) }} />
              </div>
            );
          }

          // Numbered lists
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                  {numMatch[1]}
                </span>
                <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
              </div>
            );
          }

          // Code block or quotes
          if (trimmed.startsWith('```')) {
            return null; // Handled in code segmenting
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className="pl-3 border-l-2 border-teal-500/70 text-slate-400 italic text-xs py-1 my-1 bg-slate-900/50 rounded-r">
                {trimmed.replace(/^>\s+/, '')}
              </blockquote>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-mono text-xs">$1</code>');
  };

  // 1. User Message
  if (isUser) {
    return (
      <div className="flex justify-end gap-3 max-w-3xl ml-auto w-full my-3">
        <div className="flex flex-col items-end gap-2 max-w-[85%] sm:max-w-[75%]">
          {/* Attached Files if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {message.attachments.map((file, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-300 font-mono"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span className="truncate max-w-[140px]">{file.name}</span>
                  <span className="text-[10px] text-slate-400">({Math.round(file.size / 1024)}KB)</span>
                </div>
              ))}
            </div>
          )}

          {/* User Bubble */}
          <div className="px-4 py-3 rounded-2xl bg-gradient-to-tr from-slate-800 via-slate-800 to-slate-700/90 text-white text-sm leading-relaxed border border-slate-700/80 shadow-md whitespace-pre-wrap">
            {message.content}
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // 2. Daily Limit Reached Message
  const isLimitReached = (report as any)?.isLimitReached || report?.title === 'Daily Free Limit Reached' || message.content.includes('Daily Free Limit Reached');
  if (isLimitReached) {
    return (
      <div className="flex items-start gap-3 max-w-3xl w-full my-4">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-1">
          <ShieldAlert className="w-4 h-4" />
        </div>

        <div className="flex-1 bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              Monetization Guardrail Triggered
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white">
              🛑 Daily Free Limit Reached (3/3 Prompts Used)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Upgrade to Pro for unlimited prompts, advanced multi-modal generation (images/videos), and priority speed.
            </p>
          </div>

          {/* Pricing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Pro Monthly</div>
              <div className="text-base font-black text-white">₹299 <span className="text-xs text-slate-400 font-normal">/ mo (~$3.99)</span></div>
              <div className="text-[10px] text-slate-400">Unlimited prompts & media</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 relative">
              <span className="absolute -top-2 right-2 bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                Save 45%
              </span>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pro Annual</div>
              <div className="text-base font-black text-white">₹1,999 <span className="text-xs text-slate-400 font-normal">/ yr (~₹166/mo)</span></div>
              <div className="text-[10px] text-slate-400">Save 45% on annual billing</div>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={onOpenPricing}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <span>👉 Pay via Secure UPI (wagh.jayesh@oksbi), Credit/Debit Card, or Net Banking</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Gemini Assistant Message
  return (
    <div className="flex items-start gap-3 sm:gap-4 max-w-3xl w-full my-4 group">
      {/* Gemini Sparkle Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-teal-900/30">
        <Sparkles className="w-4 h-4 fill-white text-white" />
      </div>

      <div className="flex-1 space-y-4 overflow-hidden">
        {/* Instant Synthesis (Summary) */}
        {(report?.executiveSummary || report?.immediateSolution) && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900/60 to-cyan-950/30 border border-teal-800/40 shadow-sm space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 font-mono">
                Instant Synthesis & Core Solution
              </span>
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">
              {report.executiveSummary || report.immediateSolution}
            </p>
          </div>
        )}

        {/* Multi-Modal: Image Generation Studio Card */}
        {report?.imageParams && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Gemini Image Generation Prompt Studio
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                {report.imageParams.aspectRatio}
              </span>
            </div>

            {/* Visual Simulated Artwork Banner */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-900/60 flex flex-col items-center justify-center p-6 text-center shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
              <Palette className="w-10 h-10 text-indigo-400 mb-2 animate-pulse" />
              <p className="text-xs font-mono text-indigo-200 max-w-md line-clamp-2 px-4 z-10">
                "{report.imageParams.prompt}"
              </p>
              <div className="flex items-center gap-2 mt-3 z-10">
                <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-indigo-500/30 text-[10px] text-indigo-300 font-mono">
                  {report.imageParams.style}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-indigo-500/30 text-[10px] text-purple-300 font-mono">
                  {report.imageParams.lighting}
                </span>
              </div>
            </div>

            {/* Detailed Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Style</div>
                <div className="font-semibold text-slate-200 truncate">{report.imageParams.style}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Lighting</div>
                <div className="font-semibold text-slate-200 truncate">{report.imageParams.lighting}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Composition</div>
                <div className="font-semibold text-slate-200 truncate">{report.imageParams.composition}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Aspect Ratio</div>
                <div className="font-semibold text-slate-200 font-mono">{report.imageParams.aspectRatio}</div>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Modal: Video Storyboard Director Card */}
        {report?.videoParams && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Gemini Veo/Sora 8K Video Director Slate
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                {report.videoParams.targetDuration} • {report.videoParams.aspectRatio}
              </span>
            </div>

            {/* Scenes Breakdown */}
            <div className="space-y-2">
              {report.videoParams.scenes.map((scene) => (
                <div key={scene.shotNumber} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between font-mono font-bold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Shot {scene.shotNumber}: {scene.camera}
                    </span>
                    <span className="text-slate-400">{scene.duration}</span>
                  </div>
                  <p className="text-slate-300">{scene.visualAction}</p>
                  <p className="text-[11px] text-slate-400 italic">SFX: {scene.audioSFX}</p>
                </div>
              ))}
            </div>

            {/* Model Prompt Block */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all">
              {report.videoParams.modelPromptVeoSora}
            </div>
          </div>
        )}

        {/* Structured Deep-Dive Markdown */}
        <div className="text-slate-200">
          {renderFormattedMarkdown(report?.markdownReport || message.content)}
        </div>

        {/* Actionable Execution Steps (Checklist) */}
        {report?.actionItems && report.actionItems.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" />
                Actionable Execution Steps
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {report.actionItems.filter(a => a.completed).length}/{report.actionItems.length} Complete
              </span>
            </div>

            <div className="space-y-2">
              {report.actionItems.map((action, idx) => (
                <div
                  key={idx}
                  onClick={() => onUpdateActionItem?.(idx, !action.completed)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    action.completed
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button className="mt-0.5 text-emerald-400">
                    {action.completed ? (
                      <CheckSquare className="w-4 h-4 fill-emerald-500/20" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  <div className="flex-1 text-xs">
                    <span className={`font-medium ${action.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {action.task}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                      <span>Owner: <strong className="text-slate-300">{action.owner}</strong></span>
                      <span>•</span>
                      <span>Due: <strong className="text-slate-300">{action.deadline}</strong></span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold ${
                        action.priority === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {action.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grounding Search Sources if present */}
        {report?.searchSources && report.searchSources.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              Sources:
            </span>
            {report.searchSources.map((source, idx) => (
              <a
                key={idx}
                href={source.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                <span>{source.title}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
              </a>
            ))}
          </div>
        )}

        {/* Interactive Response Tools */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400 text-xs">
          <div className="flex items-center gap-1">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {isCopied && <span className="text-[10px] text-emerald-400 font-semibold">Copied</span>}
            </button>

            {/* Thumbs Up Feedback */}
            <button
              onClick={() => handleFeedbackClick('like')}
              title="Good response"
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                userFeedback === 'like' ? 'text-teal-400 bg-teal-500/10' : 'hover:text-white'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>

            {/* Thumbs Down Feedback */}
            <button
              onClick={() => handleFeedbackClick('dislike')}
              title="Poor response"
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                userFeedback === 'dislike' ? 'text-rose-400 bg-rose-500/10' : 'hover:text-white'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>

            {/* TTS Read Aloud */}
            <button
              onClick={handleToggleSpeak}
              title={isSpeaking ? 'Stop reading' : 'Read aloud'}
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                isSpeaking ? 'text-teal-400 bg-teal-500/10' : 'hover:text-white'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Regenerate Button */}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerate response"
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1 ml-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[10px] hidden sm:inline">Regenerate</span>
              </button>
            )}
          </div>

          {/* Full Report View Trigger */}
          {report && onViewReportDetails && (
            <button
              onClick={() => onViewReportDetails(report)}
              className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Open Document View</span>
            </button>
          )}
        </div>

        {/* Mandatory Legal & Professional Notice */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed font-sans">
          <span className="font-semibold text-slate-300">[Legal &amp; Professional Notice]: </span>
          Pulse Note AI is an assistive productivity and creative tool. All AI-generated text, plans, and media must be verified before professional or commercial use. The platform bears zero liability.
        </div>
      </div>
    </div>
  );
};
