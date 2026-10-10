import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChatMessage, 
  ChatThread, 
  TargetIndustry, 
  ToneSetting, 
  DynamicResponseMode, 
  TransformedReport, 
  UserUsageState, 
  UserProfile,
  ChatMessageAttachment,
  SearchFormatLens,
  ChatbotRole
} from '../types';
import { GeminiMessageItem } from './GeminiMessageItem';
import { AudioRecorder } from './AudioRecorder';
import { FormatLensDropdown } from './FormatLensDropdown';
import { MediaCountdownTimer } from './MediaCountdownTimer';
import { MultiModalStudioModal } from './MultiModalStudioModal';
import { LiveVoiceModal } from './LiveVoiceModal';
import { 
  Sparkles, 
  ArrowUp, 
  Paperclip, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Film, 
  Globe, 
  Layers, 
  X, 
  Plus, 
  ChevronDown, 
  Search, 
  SlidersHorizontal,
  Compass,
  FileText,
  Loader2,
  AlertCircle,
  Lightbulb,
  Stethoscope,
  Building,
  Terminal,
  Briefcase,
  Code,
  Music,
  MapPin,
  Radio,
  Wand2,
  Bot
} from 'lucide-react';

interface GeminiWorkspaceProps {
  thread: ChatThread;
  threads: ChatThread[];
  onSendMessage: (content: string, attachments?: ChatMessageAttachment[], creativeMode?: 'text' | 'image' | 'video' | 'music' | 'live_voice' | 'maps_query', role?: ChatbotRole) => Promise<void>;
  onRegenerate: () => void;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  isGenerating: boolean;
  currentIndustry: TargetIndustry;
  onSelectIndustry: (ind: TargetIndustry) => void;
  currentLens: SearchFormatLens;
  onSelectLens: (lens: SearchFormatLens) => void;
  tone: ToneSetting;
  onChangeTone: (tone: ToneSetting) => void;
  responseMode: DynamicResponseMode;
  onChangeResponseMode: (mode: DynamicResponseMode) => void;
  usageState: UserUsageState;
  onOpenPricing: () => void;
  currentUser?: UserProfile | null;
  onViewReportDetails?: (report: TransformedReport) => void;
  onUpdateActionItem?: (index: number, completed: boolean) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onNewChat: () => void;
}

export const GeminiWorkspace: React.FC<GeminiWorkspaceProps> = ({
  thread,
  threads,
  onSendMessage,
  onRegenerate,
  onFeedback,
  isGenerating,
  currentIndustry,
  onSelectIndustry,
  currentLens,
  onSelectLens,
  tone,
  onChangeTone,
  responseMode,
  onChangeResponseMode,
  usageState,
  onOpenPricing,
  currentUser,
  onViewReportDetails,
  onUpdateActionItem,
  onShowToast,
  onNewChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatMessageAttachment[]>([]);
  const [creativeMode, setCreativeMode] = useState<'text' | 'image' | 'video' | 'music' | 'live_voice' | 'maps_query'>('text');
  const [activeRole, setActiveRole] = useState<ChatbotRole>('general');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Active calibrated media countdown timer state
  const [activeMediaTimer, setActiveMediaTimer] = useState<{
    mediaType: 'image' | 'video' | 'music' | 'edit_image';
    promptSnippet: string;
    totalDurationSeconds: number;
    jobId?: string;
  } | null>(null);

  const [isBackendReady, setIsBackendReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isThreadEmpty = thread.messages.length === 0;

  // Synchronized message view: while media countdown is running, hold back the assistant message until 00:00
  const displayedMessages = useMemo(() => {
    if (!activeMediaTimer) return thread.messages;
    if (thread.messages.length > 0 && thread.messages[thread.messages.length - 1].role === 'assistant') {
      return thread.messages.slice(0, -1);
    }
    return thread.messages;
  }, [thread.messages, activeMediaTimer]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages, isGenerating, activeMediaTimer]);

  // Auto expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async (overrideText?: string, modeOverride?: 'text' | 'image' | 'video') => {
    const textToSend = (overrideText || inputText).trim();
    if ((!textToSend && attachments.length === 0) || isGenerating) return;

    // Check freemium limit
    if (!usageState.isPro && usageState.dailyPromptCount >= 3) {
      onOpenPricing();
      onShowToast?.('error', 'Daily free limit reached (3/3 prompts used). Please upgrade to Pro.');
      return;
    }

    const mode = modeOverride || creativeMode;
    const currentAttachments = [...attachments];

    // Detect image vs video generation prompt
    const isImageRequest = mode === 'image' || /(create|generate|make|draw|render)\b.+(image|photo|picture|artwork|illustration)/i.test(textToSend);
    const isVideoRequest = mode === 'video' || /(create|generate|make|direct)\b.+(video|scene|storyboard|cinematic|film)/i.test(textToSend);

    if (isVideoRequest || isImageRequest) {
      const mType: 'image' | 'video' = isVideoRequest ? 'video' : 'image';
      const duration = isVideoRequest ? 30 : 12;
      setActiveMediaTimer({
        mediaType: mType,
        promptSnippet: textToSend.slice(0, 70),
        totalDurationSeconds: duration,
      });
      setIsBackendReady(false);
    } else {
      setActiveMediaTimer(null);
    }

    setInputText('');
    setAttachments([]);
    setCreativeMode('text');
    setShowVoiceRecorder(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(textToSend, currentAttachments, mode);
      setIsBackendReady(true);
    } catch (err) {
      setActiveMediaTimer(null);
      setIsBackendReady(false);
    }
  };

  const handleCountdownComplete = () => {
    // Exact timer reached 00:00: reveal synthesized media asset on screen
    setActiveMediaTimer(null);
    setIsBackendReady(false);
  };

  // Handle file attachment
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: ChatMessageAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        onShowToast?.('error', `File "${file.name}" exceeds 25MB limit.`);
        continue;
      }

      try {
        // Read file
        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.txt')) {
          const text = await file.text();
          newAttachments.push({
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            base64: text,
          });
          onShowToast?.('success', `Attached document: ${file.name}`);
        } else {
          // Binary / Audio / Image base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            setAttachments((prev) => [
              ...prev,
              {
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                base64: res.includes(',') ? res.split(',')[1] : res,
              },
            ]);
          };
          reader.readAsDataURL(file);
          onShowToast?.('success', `Attached file: ${file.name}`);
        }
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick prompt cards aligned with universal lenses and creative capabilities
  const promptSuggestions = [
    {
      title: 'Deep Market & Technical Research',
      description: 'Comprehensive multi-source analysis with source citations, risk matrices, and trend data.',
      icon: Search,
      color: 'text-indigo-400',
      prompt: 'Conduct deep technical research into commercial solid-state battery manufacturing timelines, major OEM roadmaps, and supply chain bottlenecks for 2026-2030.',
      lens: 'deep_research' as SearchFormatLens,
      mode: 'text' as const,
    },
    {
      title: 'Full-Stack Architecture & Code',
      description: 'Production-ready system architecture, resilient algorithms, circuit breakers, and unit tests.',
      icon: Terminal,
      color: 'text-emerald-400',
      prompt: 'Architect a resilient TypeScript async queue worker with redis-backed distributed locking, automatic exponential backoff retry, and prometheus telemetry metrics.',
      lens: 'code_generation' as SearchFormatLens,
      mode: 'text' as const,
    },
    {
      title: 'Synthesize 8K Concept Image',
      description: 'Photorealistic concept art with optical lighting, 35mm composition, and volumetric depth.',
      icon: ImageIcon,
      color: 'text-purple-400',
      prompt: 'Create an image of an ultra-modern sustainable cliffside architectural residence at sunset, overlooking an ocean with volumetric warm golden-hour lighting, minimalist glass framing, and photorealistic 8K textures.',
      lens: 'creative_writing' as SearchFormatLens,
      mode: 'image' as const,
    },
    {
      title: 'Direct 8K Video Storyboard',
      description: 'Architect a 3-scene cinematic sequence with camera motion and Veo/Sora prompts.',
      icon: Film,
      color: 'text-cyan-400',
      prompt: 'Generate an 8-second cinematic video scene of a sleek autonomous hyperloop train gliding across a neon cyberpunk cityscape at dawn, with dynamic low-angle tracking camera motion.',
      lens: 'creative_writing' as SearchFormatLens,
      mode: 'video' as const,
    },
  ];

  const handleSelectSuggestion = (suggestion: typeof promptSuggestions[0]) => {
    onSelectLens(suggestion.lens);
    setCreativeMode(suggestion.mode);
    setInputText(suggestion.prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const getUserFirstName = () => {
    if (currentUser?.name) {
      return currentUser.name.split(' ')[0];
    }
    return 'there';
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#090d16]">
      {/* Universal Header & Expandable Lens Dropdown */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-sm shadow-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Universal Search & Multi-Modal</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Pulse Engine
              </span>
            </h2>
          </div>

          {/* Expandable Dropdown Menu for Format / Lens */}
          <FormatLensDropdown
            currentLens={currentLens}
            onSelectLens={onSelectLens}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Gemini 2.5 Active</span>
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col justify-start">
        {/* Empty / Welcome State: Center-Aligned Minimalist Greeting */}
        {isThreadEmpty ? (
          <div className="max-w-3xl mx-auto w-full my-auto py-8 sm:py-12 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
            {/* Gemini Greeting Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-teal-400 font-mono mb-2">
                <Sparkles className="w-3.5 h-3.5 fill-teal-400 text-teal-400 animate-pulse" />
                <span>Google Gemini Architecture • Pulse Note AI</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-cyan-300 to-indigo-300">
                Hello, {getUserFirstName()}
              </h1>
              <p className="text-base sm:text-lg text-slate-400 font-medium max-w-xl mx-auto">
                What would you like to synthesize, research, or create today?
              </p>
            </div>

            {/* Center-Aligned Prompt Input Box */}
            <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-md transition-all focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20">
              {/* Attached file chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  {attachments.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-xs text-slate-200 border border-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a prompt here..."
                rows={2}
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base outline-none resize-none leading-relaxed px-1"
              />

              {/* Multi-Modal Action Buttons Row */}
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* File Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload file or document"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Voice Dictation Button */}
                  <button
                    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                    title="Voice dictation with live streaming"
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      showVoiceRecorder ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Create Image Trigger */}
                  <button
                    onClick={() => {
                      const next = creativeMode === 'image' ? 'text' : 'image';
                      setCreativeMode(next);
                      if (next === 'image' && !inputText.startsWith('Create an image of:')) {
                        setInputText('Create an image of: ' + inputText);
                      }
                    }}
                    title="Generate AI Image"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      creativeMode === 'image'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Image</span>
                  </button>

                  {/* Generate Video Trigger */}
                  <button
                    onClick={() => {
                      const next = creativeMode === 'video' ? 'text' : 'video';
                      setCreativeMode(next);
                      if (next === 'video' && !inputText.startsWith('Generate a video scene of:')) {
                        setInputText('Generate a video scene of: ' + inputText);
                      }
                    }}
                    title="Generate 8K Video Storyboard"
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      creativeMode === 'video'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Video</span>
                  </button>
                  {/* Live Voice Conversation Button */}
                  <button
                    onClick={() => setShowLiveVoiceModal(true)}
                    title="Real-Time Voice Conversation (gemini-3.8-live)"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                    <span className="hidden sm:inline">Live Voice</span>
                  </button>

                  {/* Multi-Modal Studio Launcher */}
                  <button
                    onClick={() => setShowStudioModal(true)}
                    title="Open Multi-Modal Studio (Veo 3.1, Lyria 3, Image Edit, Maps Grounding)"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Studio</span>
                  </button>
                </div>

                {/* Right controls: Format Lens selector & Send Prompt Button */}
                <div className="flex items-center gap-2">
                  <FormatLensDropdown
                    currentLens={currentLens}
                    onSelectLens={onSelectLens}
                    compact={true}
                    dropDirection="down"
                    align="right"
                  />

                  {/* Send Prompt Button */}
                  <button
                    onClick={() => handleSubmit()}
                    disabled={(!inputText.trim() && attachments.length === 0) || isGenerating}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                      inputText.trim() || attachments.length > 0
                        ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 hover:brightness-110 active:scale-95'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : (
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Embedded Voice Dictation Streaming Tray */}
              {showVoiceRecorder && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" />
                      Live Voice Dictation Streaming
                    </span>
                    <button 
                      onClick={() => setShowVoiceRecorder(false)}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <AudioRecorder
                    onTranscriptReady={(text) => {
                      setInputText((prev) => (prev ? `${prev.trim()} ${text.trim()}` : text.trim()));
                    }}
                    onAppendText={(streamText) => {
                      setInputText((prev) => `${prev}${streamText}`);
                    }}
                    onError={(err) => onShowToast?.('error', err)}
                  />
                </div>
              )}
            </div>

            {/* Quick Suggestion Cards */}
            <div className="w-full max-w-3xl pt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-left font-mono">
                Suggested Prompts & Modes
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {promptSuggestions.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectSuggestion(item)}
                      className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group shadow-sm flex items-start gap-3"
                    >
                      <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Turn Conversational Stream */
          <div className="max-w-3xl mx-auto w-full space-y-4 pb-28 pt-2">
            {displayedMessages.map((message) => (
              <GeminiMessageItem
                key={message.id}
                message={message}
                onRegenerate={onRegenerate}
                onFeedback={onFeedback}
                onOpenPricing={onOpenPricing}
                onViewReportDetails={onViewReportDetails}
                onUpdateActionItem={onUpdateActionItem}
                onShowToast={onShowToast}
              />
            ))}

            {/* Synchronized Exact Media Countdown Timer Component */}
            {activeMediaTimer && (
              <MediaCountdownTimer
                mediaType={activeMediaTimer.mediaType}
                promptSnippet={activeMediaTimer.promptSnippet}
                totalDurationSeconds={activeMediaTimer.totalDurationSeconds}
                jobId={activeMediaTimer.jobId || (thread.messages.length > 0 ? thread.messages[thread.messages.length - 1]?.report?.jobId : undefined)}
                isBackendReady={isBackendReady}
                onCountdownComplete={handleCountdownComplete}
              />
            )}

            {/* Shimmering Gemini Generation Indicator for text/code/research queries */}
            {isGenerating && !activeMediaTimer && (
              <div className="flex items-start gap-3 max-w-3xl w-full my-4 animate-in fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-teal-900/30">
                  <Sparkles className="w-4 h-4 fill-white text-white animate-spin" />
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                    <span className="text-xs font-bold text-teal-300 font-mono">
                      Gemini Neural Engine Synthesizing...
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 bg-slate-800 rounded-full w-4/5 animate-pulse"></div>
                    <div className="h-3 bg-slate-800 rounded-full w-3/5 animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Prompt Bar (Always active when conversation exists) */}
      {!isThreadEmpty && (
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-[#090d16] via-[#090d16]/95 to-transparent z-20">
          <div className="max-w-3xl mx-auto w-full">
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-3 shadow-2xl backdrop-blur-md transition-all focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20">
              {/* Attached file chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  {attachments.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-xs text-slate-200 border border-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button 
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Input */}
              <div className="flex items-center gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Pulse Note AI or enter a prompt..."
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none resize-none leading-relaxed px-2 max-h-36"
                />

                {/* Send Prompt Button */}
                <button
                  onClick={() => handleSubmit()}
                  disabled={(!inputText.trim() && attachments.length === 0) || isGenerating}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                    inputText.trim() || attachments.length > 0
                      ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 hover:brightness-110 active:scale-95'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>

              {/* Bottom Multi-Modal Action Icons */}
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/60 text-xs">
                <div className="flex items-center gap-1">
                  {/* File Upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload file or document"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Voice Dictation */}
                  <button
                    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                    title="Voice dictation"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      showVoiceRecorder ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Create Image Trigger */}
                  <button
                    onClick={() => {
                      const next = creativeMode === 'image' ? 'text' : 'image';
                      setCreativeMode(next);
                      if (next === 'image' && !inputText.startsWith('Create an image of:')) {
                        setInputText('Create an image of: ' + inputText);
                      }
                    }}
                    title="Generate Image"
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      creativeMode === 'image'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3 text-indigo-400" />
                    <span>Image</span>
                  </button>

                  {/* Generate Video Trigger */}
                  <button
                    onClick={() => {
                      const next = creativeMode === 'video' ? 'text' : 'video';
                      setCreativeMode(next);
                      if (next === 'video' && !inputText.startsWith('Generate a video scene of:')) {
                        setInputText('Generate a video scene of: ' + inputText);
                      }
                    }}
                    title="Generate Video"
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      creativeMode === 'video'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Film className="w-3 h-3 text-cyan-400" />
                    <span>Video</span>
                  </button>
                  {/* Live Voice */}
                  <button
                    onClick={() => setShowLiveVoiceModal(true)}
                    title="Real-Time Voice (gemini-3.8-live)"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all cursor-pointer"
                  >
                    <Radio className="w-3 h-3 text-teal-400 animate-pulse" />
                    <span>Live Voice</span>
                  </button>

                  {/* Studio */}
                  <button
                    onClick={() => setShowStudioModal(true)}
                    title="Multi-Modal Studio (Veo, Lyria, Image Edit, Maps)"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3 text-purple-400" />
                    <span>Studio</span>
                  </button>
                </div>

                {/* Expandable Lens Dropdown inside prompt bar */}
                <div className="flex items-center gap-2">
                  <FormatLensDropdown
                    currentLens={currentLens}
                    onSelectLens={onSelectLens}
                    dropDirection="up"
                    align="right"
                  />
                </div>
              </div>

              {/* Streaming Voice Dictation Tray */}
              {showVoiceRecorder && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 animate-in fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" />
                      Live Voice Dictation Streaming
                    </span>
                    <button 
                      onClick={() => setShowVoiceRecorder(false)}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <AudioRecorder
                    onTranscriptReady={(text) => {
                      setInputText((prev) => (prev ? `${prev.trim()} ${text.trim()}` : text.trim()));
                    }}
                    onAppendText={(streamText) => {
                      setInputText((prev) => `${prev}${streamText}`);
                    }}
                    onError={(err) => onShowToast?.('error', err)}
                  />
                </div>
              )}
            </div>

            {/* Subtle Gemini Disclaimer below prompt box */}
            <div className="text-center text-[10px] text-slate-500 mt-1">
              Pulse Note AI can make mistakes. Verify critical clinical and strategic information.
            </div>
          </div>
        </div>
      )}

      {/* Multi-Modal Generative Studio Modal */}
      <MultiModalStudioModal
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        usageState={usageState}
        onOpenPricing={onOpenPricing}
        onShowToast={onShowToast}
      />

      {/* Gemini 3.8 Live Voice Modal */}
      <LiveVoiceModal
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
        onTranscriptReceived={(text) => {
          setInputText((prev) => (prev ? `${prev} ${text}` : text));
        }}
      />
    </div>
  );
};
