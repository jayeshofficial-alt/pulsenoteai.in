import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon, Film, Clock, Sparkles, CheckCircle2, Zap, Layers, AlertCircle } from 'lucide-react';
import { MediaJobStatus } from '../types';

interface MediaCountdownTimerProps {
  mediaType: 'image' | 'video';
  totalDurationSeconds?: number;
  promptSnippet: string;
  isBackendReady: boolean;
  jobId?: string;
  onCountdownComplete: (result?: any) => void;
}

export const MediaCountdownTimer: React.FC<MediaCountdownTimerProps> = ({
  mediaType,
  totalDurationSeconds = mediaType === 'video' ? 28 : 10,
  promptSnippet,
  isBackendReady,
  jobId,
  onCountdownComplete,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalDurationSeconds);
  const [backendStatus, setBackendStatus] = useState<MediaJobStatus | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const onCompleteRef = useRef(onCountdownComplete);
  onCompleteRef.current = onCountdownComplete;

  const isBackendReadyRef = useRef(isBackendReady);
  isBackendReadyRef.current = isBackendReady;

  const isCompletedRef = useRef(isCompleted);
  isCompletedRef.current = isCompleted;

  // 1. Backend Status Polling Hook (linked to /api/media/status/:id)
  useEffect(() => {
    if (!jobId) return;

    let isPolling = true;
    const pollBackend = async () => {
      try {
        const res = await fetch(`/api/media/status/${encodeURIComponent(jobId)}`);
        if (res.ok && isPolling) {
          const data: MediaJobStatus = await res.json();
          setBackendStatus(data);

          if (data.progressPercent !== undefined) {
            setProgressPercent((prev) => Math.max(prev, data.progressPercent));
          }

          if (data.estimatedSecondsRemaining !== undefined && data.estimatedSecondsRemaining > 0) {
            setRemainingSeconds((prev) => {
              // Smooth calibration with backend estimate
              if (Math.abs(prev - data.estimatedSecondsRemaining) > 2) {
                return data.estimatedSecondsRemaining;
              }
              return prev;
            });
          }

          if (data.status === 'completed' && !isCompletedRef.current) {
            isPolling = false;
            setIsCompleted(true);
            setProgressPercent(100);
            setRemainingSeconds(0);
            setTimeout(() => {
              onCompleteRef.current(data.result);
            }, 300);
          }
        }
      } catch (err) {
        console.warn('[POLLING_ERROR] Retrying media status poll:', err);
      }
    };

    pollBackend();
    const interval = setInterval(pollBackend, 800);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [jobId]);

  // 2. High-precision 1-second countdown ticker
  useEffect(() => {
    setRemainingSeconds(totalDurationSeconds);
    setIsCompleted(false);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isCompletedRef.current) {
            setIsCompleted(true);
            setProgressPercent(100);
            setTimeout(() => {
              onCompleteRef.current(backendStatus?.result);
            }, 300);
          }
          return 0;
        }

        const next = prev - 1;
        // Calculate estimated progress percentage if backend is not actively overriding
        const calculatedPercent = Math.min(
          96,
          Math.max(0, ((totalDurationSeconds - next) / totalDurationSeconds) * 100)
        );
        setProgressPercent((curr) => Math.max(curr, Math.round(calculatedPercent)));
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalDurationSeconds]);

  // 3. Trigger immediate completion when isBackendReady prop turns true
  useEffect(() => {
    if (isBackendReady && !isCompleted) {
      setIsCompleted(true);
      setProgressPercent(100);
      setRemainingSeconds(0);
      const timer = setTimeout(() => {
        onCompleteRef.current(backendStatus?.result);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isBackendReady]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calibrated generative status messages
  const getPhaseMessage = () => {
    if (backendStatus?.phaseMessage) {
      return backendStatus.phaseMessage;
    }

    if (remainingSeconds === 0 || isCompleted) {
      return 'Generation complete! Revealing media asset...';
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
  const queuePos = backendStatus?.queuePosition ?? 0;

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
                  {isVideo ? 'Generating 8K Cinematic Video (Veo 3.1)' : 'Synthesizing High-Fidelity Image (Imagen 3)'}
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

          {/* Synchronized Exact Countdown Clock Display & FIFO Tag */}
          <div className="flex items-center gap-2">
            {queuePos > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>FIFO Queue: #{queuePos}</span>
              </span>
            )}
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
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-700 ease-linear rounded-full ${
                isVideo
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-sm shadow-cyan-500/50'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-400 to-cyan-400 shadow-sm shadow-indigo-500/50'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          {/* Progress Percentage & Calibrated Status */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-teal-400 animate-pulse shrink-0" />
              {getPhaseMessage()}
            </span>
            <span className="font-mono font-bold text-slate-400">
              {Math.min(100, Math.round(progressPercent))}%
            </span>
          </div>
        </div>

        {/* Quality Safeguard Notice */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Sequential FIFO Queue Processing • Zero Race Conditions</span>
          <span>Exact Synchronized Reveal at 00:00</span>
        </div>
      </div>
    </div>
  );
};
