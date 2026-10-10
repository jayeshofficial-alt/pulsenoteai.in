import React from 'react';
import { UserUsageState } from '../types';
import { Zap, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

interface DailyLimitBadgeProps {
  usageState: UserUsageState;
  onOpenPricing: () => void;
}

export const DailyLimitBadge: React.FC<DailyLimitBadgeProps> = ({
  usageState,
  onOpenPricing,
}) => {
  const { isPro, dailyPromptCount, activePlan } = usageState;

  if (isPro) {
    return (
      <button
        onClick={onOpenPricing}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="font-mono text-[11px] font-bold">
          {activePlan === 'pro_annual' ? 'PRO ANNUAL' : 'PRO UNLIMITED'}
        </span>
      </button>
    );
  }

  const remaining = Math.max(0, 3 - dailyPromptCount);
  const isExhausted = remaining === 0;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onOpenPricing}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
          isExhausted
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/40 animate-pulse'
            : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-emerald-500/40 hover:text-white'
        }`}
      >
        {isExhausted ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        )}
        <span className="font-mono text-[11px]">
          {isExhausted ? '0/3 Free Left' : `${dailyPromptCount}/3 Prompts`}
        </span>
      </button>

      <button
        onClick={onOpenPricing}
        className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-all"
      >
        <Zap className="w-3 h-3 fill-amber-400" />
        Upgrade ₹299
        <ArrowUpRight className="w-3 h-3 opacity-70" />
      </button>
    </div>
  );
};
