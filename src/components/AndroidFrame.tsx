import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, SignalHigh } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isDeviceMode: boolean;
  onToggleDeviceMode: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isDeviceMode,
}) => {
  const [timeStr, setTimeStr] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours % 12 || 12}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isDeviceMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Subtle responsive ambient top bar */}
        <div className="w-full bg-slate-900/80 border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 no-print">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono font-medium text-slate-300">PulseNote AI • Android Core Engine</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>ENV: Flagship Mobile Web</span>
            <span>STATUS: Online</span>
          </div>
        </div>
        <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-6 lg:p-8">
      {/* Handset Outer Chassis */}
      <div className="relative w-full max-w-[430px] h-[910px] bg-slate-900 rounded-[48px] border-[6px] border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.1)] flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Android Punch Hole & Speaker */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 pointer-events-none">
          <div className="w-14 h-1.5 bg-slate-800 rounded-full mb-1"></div>
        </div>

        {/* Android Status Bar */}
        <div className="h-10 w-full px-7 flex items-center justify-between z-30 select-none text-xs font-semibold text-slate-300 bg-slate-950/70 backdrop-blur-md border-b border-slate-800/40 shrink-0">
          <span className="font-medium tracking-tight font-mono text-[13px]">{timeStr}</span>
          <div className="w-4 h-4 rounded-full bg-black border border-slate-700/80 flex items-center justify-center shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 font-mono">5G</span>
            <SignalHigh className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono">92%</span>
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Scrollable Handset Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative bg-slate-950/95 scroll-smooth">
          {children}
        </div>

        {/* Android Gesture Navigation Bar */}
        <div className="h-7 w-full bg-slate-950 flex items-center justify-center shrink-0 z-30 border-t border-slate-900">
          <div className="w-32 h-1 bg-slate-500 rounded-full opacity-60"></div>
        </div>
      </div>
    </div>
  );
};
