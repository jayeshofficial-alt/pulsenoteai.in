import React, { useState } from 'react';
import { TransformedReport, TargetIndustry } from '../types';
import { INDUSTRY_CONFIGS } from '../data/presets';
import { 
  Copy, 
  Check, 
  Printer, 
  Download, 
  Volume2, 
  VolumeX, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  ListChecks, 
  Tag, 
  Code,
  Edit3,
  Calendar,
  User,
  Clock,
  Zap,
  Globe,
  Compass,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DocumentViewerProps {
  report: TransformedReport;
  onCopy: (text: string) => void;
  onUpdateActionItem?: (index: number, completed: boolean) => void;
  onEditMarkdown?: (newMarkdown: string) => void;
  onOpenPricing?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  report,
  onCopy,
  onUpdateActionItem,
  onEditMarkdown,
  onOpenPricing,
}) => {
  const [activeTab, setActiveTab] = useState<'solution' | 'structured' | 'markdown' | 'actions' | 'entities'>('solution');
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState(report.markdownReport);

  const activeConfig = INDUSTRY_CONFIGS.find((c) => c.id === report.industry) || INDUSTRY_CONFIGS[0];

  // Daily Free Limit Reached Upgrade View
  if ((report as any).isLimitReached || report.title === 'Daily Free Limit Reached') {
    return (
      <div className="w-full bg-slate-900/90 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-5 shadow-2xl animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
            Monetization Guardrail Triggered
          </span>
          <h3 className="text-xl font-black text-white">
            Daily Free Limit Reached (3/3 Prompts Used)
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You've reached your free limit for today. To unlock <strong>unlimited daily prompts</strong>, priority processing, and advanced industry templates, upgrade to Pro!
          </p>
        </div>

        {/* Pricing summary pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md text-left">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Pro Monthly</div>
            <div className="text-lg font-black text-white">₹299 <span className="text-xs text-slate-400 font-normal">/ mo (~$3.99)</span></div>
            <div className="text-[11px] text-slate-400 mt-1">Cheaper than $20 market standard!</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 relative">
            <span className="absolute -top-2 right-2 bg-amber-400 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
              Save 45%
            </span>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pro Annual</div>
            <div className="text-lg font-black text-white">₹1,999 <span className="text-xs text-slate-400 font-normal">/ yr (~₹166/mo)</span></div>
            <div className="text-[11px] text-slate-400 mt-1">Best value for everyday professionals</div>
          </div>
        </div>

        {/* Tap to Upgrade button */}
        <button
          onClick={onOpenPricing}
          className="w-full max-w-md py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>👉 Tap Here to Upgrade via Secure Checkout</span>
        </button>

        <div className="text-[11px] text-slate-400 font-mono">
          Accepted: Direct UPI settlement to <strong className="text-emerald-400">wagh.jayesh@oksbi</strong>, Credit/Debit Cards, Net Banking
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    onCopy(isEditing ? editedMarkdown : report.markdownReport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([report.markdownReport], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_PulseNote.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title,
          text: report.markdownReport,
        });
      } catch (e) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      // Prepare speech text
      const speechText = `${report.title}. ${report.markdownReport.replace(/[#*`_\[\]]/g, '')}`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const getSeverityBadgeClass = (severity?: 'Low' | 'Medium' | 'High' | null) => {
    switch (severity) {
      case 'High':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Low':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  // Guardrail state: input was too vague
  if (report.isVague) {
    return (
      <div className="w-full bg-amber-950/30 border border-amber-500/40 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-4 animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-300">
            More Details Required for Professional Documentation
          </h3>
          <p className="text-sm text-slate-300 mt-2 max-w-lg leading-relaxed">
            {report.clarificationRequest ||
              'The input text is too vague or lacks sufficient operational context to generate an industry-standard professional report. Please provide specific details such as symptoms, property locations, technical issues, or action owners rather than ambiguous notes.'}
          </p>
        </div>
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-400 max-w-md w-full text-left font-mono">
          <span className="text-amber-400 font-semibold block mb-1">Your Input:</span>
          "{report.rawInput}"
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Document Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl no-print">
        {/* Navigation View Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('solution')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'solution'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Solution & Strategy</span>
          </button>

          <button
            onClick={() => setActiveTab('structured')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'structured'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Structured Document</span>
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'markdown'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Direct Markdown</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'actions'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Action Items ({report.actionItems?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'entities'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Intelligence ({report.detectedEntities?.length || 0})</span>
          </button>
        </div>

        {/* Quick Export Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title="Copy Report to Clipboard"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleToggleSpeak}
            title={isSpeaking ? 'Stop Reading' : 'Listen to Report (TTS)'}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              isSpeaking
                ? 'bg-emerald-500 text-slate-950 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handlePrint}
            title="Print / Export as PDF"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            title="Download Markdown (.md)"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleShare}
            title="Share via Android Native Intent"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="printable-document w-full bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-xl relative backdrop-blur-md">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${activeConfig.badgeBg}`}>
                {activeConfig.name}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
              {report.title}
            </h2>
          </div>

          <div className="text-right sm:self-center">
            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              Verified Compliance Ready
            </span>
          </div>
        </div>

        {/* Medical / Legal Mandatory Compliance Notice Banner */}
        {report.complianceDisclaimer && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 uppercase tracking-wide mr-1.5">Mandatory Compliance Notice:</span>
              {report.complianceDisclaimer}
            </div>
          </div>
        )}

        {/* View Tab: Live Intelligent Solution & Strategic Plan (Requirement 3) */}
        {activeTab === 'solution' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* 1. Immediate Solution / Direct Answer */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 border-2 border-emerald-500/50 shadow-xl shadow-emerald-950/30 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                      Category 1 • Direct Execution
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Immediate Solution / Direct Answer
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Priority 1
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-line font-medium">
                {report.immediateSolution || 'Direct action formulated based on prompt parameters.'}
              </p>
            </div>

            {/* 2. Best Online Practices & Current Industry Standards */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-950 to-slate-900 border border-cyan-500/40 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      Category 2 • Verified Intelligence
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Best Online Practices & Current Industry Standards
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Online Standards
                </span>
              </div>
              <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {report.bestOnlinePractices || 'Industry-standard compliance standards and verified online practices synthesized.'}
              </div>

              {/* Grounded Web Sources Citations */}
              {report.searchSources && report.searchSources.length > 0 && (
                <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Verified Research & Grounded Sources:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {report.searchSources.map((source, sIdx) => (
                      <div key={sIdx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-cyan-300 truncate">{source.title}</span>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {source.snippet && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {source.snippet}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Actionable Strategic Plan / Next Steps */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-teal-950/30 via-slate-950 to-slate-900 border border-teal-500/40 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 border-b border-teal-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 font-mono">
                      Category 3 • Roadmap & Milestones
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Actionable Strategic Plan & Next Moves
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  Execution Ready
                </span>
              </div>
              <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {report.actionableStrategicPlan || 'Strategic step-by-step roadmap to plan and execute next moves.'}
              </div>

              {/* Action Item Cards Preview */}
              {report.actionItems && report.actionItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Immediate Milestones & Task Register:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {report.actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-2"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-200 block">{item.task}</span>
                            <span className="text-[11px] text-slate-400">Owner: {item.owner} • Target: {item.deadline}</span>
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getSeverityBadgeClass(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Tab 1: Formatted Industry Sections */}
        {activeTab === 'structured' && (
          <div className="flex flex-col gap-5">
            {/* Key Takeaways Bar if present */}
            {report.keyTakeaways && report.keyTakeaways.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Strategic / Executive Highlights
                </span>
                <ul className="space-y-1.5">
                  {report.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structured Section Cards */}
            <div className="grid grid-cols-1 gap-4">
              {report.sections && report.sections.length > 0 ? (
                report.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {section.heading}
                      </h4>
                      {section.severity && (
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getSeverityBadgeClass(section.severity)}`}>
                          Severity: {section.severity}
                        </span>
                      )}
                      {section.category && !section.severity && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                          {section.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                      {section.content}
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback to rendered markdown if sections array was simple */
                <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {report.markdownReport}
                </div>
              )}
            </div>

            {/* Action Items & Next Steps Block (Always required) */}
            {report.actionItems && report.actionItems.length > 0 && (
              <div className="mt-2 p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Action Items & Next Steps
                  </h3>
                  <span className="text-xs text-slate-400">
                    {report.actionItems.filter((a) => a.completed).length}/{report.actionItems.length} Completed
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {report.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-3 flex items-start gap-3 group"
                    >
                      <input
                        type="checkbox"
                        checked={!!item.completed}
                        onChange={(e) => onUpdateActionItem?.(idx, e.target.checked)}
                        className="mt-1 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {item.task}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                          {item.owner && item.owner !== 'Unassigned' && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <User className="w-3 h-3 text-slate-400" />
                              {item.owner}
                            </span>
                          )}
                          {item.deadline && item.deadline !== 'Not specified' && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {item.deadline}
                            </span>
                          )}
                          {item.priority && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                item.priority === 'High'
                                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                  : item.priority === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {item.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mandatory Disclaimer & Legal Safeguard Integration */}
            <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5 font-sans">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <span>[Legal & Professional Verification Notice]</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
                This document is an AI-generated assistive draft. It does NOT constitute formal professional, legal, clinical, or financial advice. You are solely responsible for reviewing, validating, and verifying all data with a licensed professional before official use. The developer assumes zero liability for any errors, omissions, or damages resulting from reliance on this content.
              </p>
            </div>
          </div>
        )}

        {/* View Tab 2: Direct Markdown Block */}
        {activeTab === 'markdown' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Standard Raw Output • Ready for Jira, EHR, Notion, or Slack</span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Preview Markdown' : 'Edit Markdown'}</span>
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={editedMarkdown}
                onChange={(e) => {
                  setEditedMarkdown(e.target.value);
                  onEditMarkdown?.(e.target.value);
                }}
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-y"
              />
            ) : (
              <pre className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                {editedMarkdown || report.markdownReport}
              </pre>
            )}
          </div>
        )}

        {/* View Tab 3: Action Items Checklist */}
        {activeTab === 'actions' && (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-sm font-bold text-slate-200 mb-3">
                Full Deliverable Action Register
              </h4>
              {report.actionItems && report.actionItems.length > 0 ? (
                <div className="space-y-3">
                  {report.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={!!item.completed}
                        onChange={(e) => onUpdateActionItem?.(idx, e.target.checked)}
                        className="mt-1 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-100">{item.task}</div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span>Owner: <strong className="text-slate-200">{item.owner}</strong></span>
                          <span>Deadline: <strong className="text-slate-200">{item.deadline}</strong></span>
                          <span>Priority: <strong className="text-emerald-400">{item.priority}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No action items were explicitly identified.</p>
              )}
            </div>
          </div>
        )}

        {/* View Tab 4: Contextual Entities Detected */}
        {activeTab === 'entities' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Entities, medical formulations, systems, metrics, and risks extracted automatically from the input:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {report.detectedEntities && report.detectedEntities.length > 0 ? (
                report.detectedEntities.map((ent, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    <span className="font-semibold text-slate-200">{ent.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono px-1 rounded bg-slate-900">
                      {ent.type}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No specific entities detected.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
