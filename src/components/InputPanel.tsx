import React, { useState, useMemo } from 'react';
import { TargetIndustry, ToneSetting, DynamicResponseMode } from '../types';
import { INDUSTRY_CONFIGS, PRESET_SAMPLES, PresetSample } from '../data/presets';
import { AudioRecorder } from './AudioRecorder';
import { 
  Sparkles, 
  Trash2, 
  Wand2, 
  Layers, 
  Mic, 
  FileText, 
  Sliders, 
  CheckCircle2, 
  Zap,
  Tag,
  Compass
} from 'lucide-react';

interface InputPanelProps {
  rawText: string;
  onChangeText: (text: string) => void;
  targetIndustry: TargetIndustry;
  tone: ToneSetting;
  onChangeTone: (tone: ToneSetting) => void;
  customContext: string;
  onChangeCustomContext: (val: string) => void;
  responseMode?: DynamicResponseMode;
  onChangeResponseMode?: (mode: DynamicResponseMode) => void;
  isProcessing: boolean;
  onTransform: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  rawText,
  onChangeText,
  targetIndustry,
  tone,
  onChangeTone,
  customContext,
  onChangeCustomContext,
  responseMode = 'auto',
  onChangeResponseMode,
  isProcessing,
  onTransform,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');
  const [showSettings, setShowSettings] = useState(false);

  const activeConfig = INDUSTRY_CONFIGS.find((c) => c.id === targetIndustry) || INDUSTRY_CONFIGS[0];

  // Presets matching the current industry or general test
  const relevantPresets = useMemo(() => {
    return PRESET_SAMPLES.filter(
      (p) => p.industry === targetIndustry || p.id === 'vague-test'
    );
  }, [targetIndustry]);

  // Analyze filler words and disorganization
  const fillerAnalysis = useMemo(() => {
    if (!rawText.trim()) return { count: 0, percentage: 0 };
    const fillerRegex = /\b(um|uh|like|you know|basically|actually|so yeah|sort of|kinda|i mean|honestly|right)\b/gi;
    const matches = rawText.match(fillerRegex);
    const count = matches ? matches.length : 0;
    const words = rawText.trim().split(/\s+/).length;
    const percentage = words > 0 ? Math.round((count / words) * 100) : 0;
    return { count, percentage, totalWords: words };
  }, [rawText]);

  const handlePresetSelect = (preset: PresetSample) => {
    onChangeText(preset.rawText);
  };

  const handleTranscriptReady = (transcribed: string) => {
    onChangeText(transcribed);
    setActiveTab('text');
  };

  const handleAppendVoice = (additionalText: string) => {
    onChangeText(rawText ? `${rawText} ${additionalText}` : additionalText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isProcessing && rawText.trim().length > 0) {
        onTransform();
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Input Bar: Mode Switcher & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Raw Notes / Text</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'voice'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Dictation</span>
          </button>
        </div>

        {/* Presets Button & Clear Button */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            {relevantPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all truncate max-w-[140px] sm:max-w-none ${
                  preset.id === 'vague-test'
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                }`}
                title={`Load: ${preset.title}`}
              >
                {preset.id === 'vague-test' ? '⚡ Test Guardrail' : `Sample: ${preset.title.split(':')[0]}`}
              </button>
            ))}
          </div>

          {rawText && (
            <button
              onClick={() => onChangeText('')}
              title="Clear text"
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Dictation Tab */}
      {activeTab === 'voice' && (
        <div className="w-full">
          <AudioRecorder
            onTranscriptReady={handleTranscriptReady}
            onAppendText={handleAppendVoice}
          />
          <div className="mt-2 text-center text-xs text-slate-400">
            Recorded words will stream into your transcript. Switch to "Raw Notes / Text" anytime to inspect or edit.
          </div>
        </div>
      )}

      {/* Raw Text Input Area */}
      <div className={`w-full relative flex flex-col ${activeTab === 'voice' ? 'hidden' : 'flex'}`}>
        <div className="relative rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-emerald-500/60 transition-all shadow-inner">
          <textarea
            value={rawText}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Enter your prompt, query, audio transcript, or rough notes here...\n\nPulse Note AI searches current web intelligence and Google data sources to deliver:\n1. Immediate Solution / Direct Answer\n2. Best Online Practices & Current Industry Standards\n3. Actionable Strategic Plan / Next Steps\n\nExample (${activeConfig.name}):\n${relevantPresets[0]?.rawText.slice(0, 160)}...`}
            rows={7}
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm sm:text-base p-4 rounded-2xl resize-y focus:outline-none leading-relaxed font-sans"
          />

          {/* Bottom Bar inside Textarea: Stats & Disorganization Meter */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 rounded-b-2xl text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span>{fillerAnalysis.totalWords || 0} words</span>
              <span>•</span>
              <span>{rawText.length} chars</span>
              {fillerAnalysis.count > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {fillerAnalysis.count} filler words / tangents detected
                </span>
              )}
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Settings: Tone, Response Mode & Custom Organization Context */}
      {showSettings && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1">
          {/* Top Row: Tone & Context */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Tone Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Tone / Detail:</span>
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                {(['concise', 'standard', 'detailed'] as ToneSetting[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => onChangeTone(t)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                      tone === t
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'detailed' ? 'Audit-Ready' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Context Field */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={customContext}
                onChange={(e) => onChangeCustomContext(e.target.value)}
                placeholder="Optional Client / Facility / Unit tag"
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500/50 w-full sm:w-60"
              />
            </div>
          </div>

          {/* Bottom Row: Dynamic Gemini Response Mode */}
          {onChangeResponseMode && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Response Mode:</span>
              </div>
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 flex-wrap gap-1">
                {[
                  { id: 'auto', label: 'Adaptive Auto' },
                  { id: 'productivity', label: 'Productivity' },
                  { id: 'research', label: 'Research' },
                  { id: 'problem_solving', label: 'Problem-Solving' },
                ].map((modeItem) => (
                  <button
                    key={modeItem.id}
                    onClick={() => onChangeResponseMode(modeItem.id as DynamicResponseMode)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      responseMode === modeItem.id
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {modeItem.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Transform Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-slate-300">Target: {activeConfig.shortName}</span>
          <span className="hidden md:inline text-slate-500">({activeConfig.templateFormat})</span>
        </div>

        <button
          onClick={onTransform}
          disabled={isProcessing || !rawText.trim()}
          className={`flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg active:scale-95 ${
            isProcessing || !rawText.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-emerald-950/40 hover:shadow-emerald-500/20 ring-1 ring-white/20'
          }`}
        >
          {isProcessing ? (
            <>
              <Wand2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Analyzing & Solving with Live Search...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Solve & Plan With Live Search</span>
              <span className="hidden sm:inline-block text-[10px] font-mono opacity-70 bg-black/20 px-1.5 py-0.5 rounded">
                ⌘↵
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
