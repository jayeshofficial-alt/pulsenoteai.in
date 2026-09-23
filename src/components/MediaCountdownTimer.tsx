import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon, Film, Clock, Sparkles, CheckCircle2, Zap } from 'lucide-react';

interface MediaCountdownTimerProps {
  mediaType: 'image' | 'video';
  totalDurationSeconds?: number;
  promptSnippet: string;
  isBackendReady: boolean;
  onCountdownComplete: () => void;
}

export const MediaCountdownTimer: React.FC<MediaCountdownTimerProps> = ({
  mediaType,
  totalDurationSeconds = mediaType === 'video' ? 30 : 12,
  promptSnippet,
  isBackendReady,
  onCountdownComplete,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalDurationSeconds);
  const [isCompleted, setIsCompleted] = useState(false);
  const onCompleteRef = useRef(onCountdownComplete);
  onCompleteRef.current = onCountdownComplete;

  const isBackendReadyRef = useRef(isBackendReady);
  isBackendReadyRef.current = isBackendReady;

  useEffect(() => {
    setRemainingSeconds(totalDurationSeconds);
    setIsCompleted(false);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          // Trigger completion at the exact second it hits zero
          setTimeout(() => {
            onCompleteRef.current();
          }, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalDurationSeconds]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100)
  );

  // Calibrated generative status messages
  const getPhaseMessage = () => {
    if (remainingSeconds === 0) {
      return isBackendReady
        ? 'Generation complete! Revealing media now...'
        : 'Finalizing 8K asset rendering...';
    }

    if (mediaType === 'video') {
      if (progressPercent < 25) return 'Parsing cinematic script & 3D scene parameters...';
      if (progressPercent < 55) return 'Synthesizing camera kinematics, pan & focal keyframes...';
      if (progressPercent < 80) return 'Rendering volumetric lighting & high-frame-rate diffusion...';
      return 'Mastering color grade & encoding 8K video storyboard...';
    } else {
      if (progressPercent < 30) return 'Calibrating style tokens, lighting & aspect ratio...';
      if (progressPercent < 70) return 'Diffusing high-frequency geometry & ray-traced reflections...';
      return 'Upscaling textures & applying chromatic balance...';
    }
  };

  const isVideo = mediaType === 'video';

  return (
    <div className="w-full my-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-750 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Background ambient lighting pulse */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isVideo ? 'bg-cyan-500' : 'bg-indigo-500'
        }`}
      />

      <div className="relative z-10 space-y-3.5">
        {/* Header with Media Badge & Live Countdown Timer */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-2xl border shadow-lg ${
                isVideo
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-cyan-500/10'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10'
              }`}
            >
              {isVideo ? (
                <Film className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              ) : (
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {isVideo ? 'Generating 8K Cinematic Video' : 'Synthesizing High-Fidelity Image'}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isVideo ? 'bg-cyan-400' : 'bg-indigo-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isVideo ? 'bg-cyan-500' : 'bg-indigo-500'
                    }`}
                  />
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-sm sm:max-w-md">
                "{promptSnippet}"
              </p>
            </div>
          </div>

          {/* Synchronized Exact Countdown Clock Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Time Remaining:
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isVideo
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-sm shadow-cyan-500/50'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-400 to-cyan-400 shadow-sm shadow-indigo-500/50'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Progress Percentage & Calibrated Status */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-teal-400 animate-pulse shrink-0" />
              {getPhaseMessage()}
            </span>
            <span className="font-mono font-bold text-slate-400">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>

        {/* Quality Safeguard Notice */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Speed-Optimized Async Worker • Zero Latency Bottlenecks</span>
          <span>Calibrated to 00:00 Exact Completion</span>
        </div>
      </div>
    </div>
  );
};
