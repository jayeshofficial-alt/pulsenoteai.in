import React from 'react';
import { TargetIndustry, UserUsageState, UserProfile } from '../types';
import { INDUSTRY_CONFIGS } from '../data/presets';
import { DailyLimitBadge } from './DailyLimitBadge';
import { 
  Stethoscope, 
  Building2, 
  Cpu, 
  Briefcase, 
  Smartphone, 
  Maximize2, 
  History,
  Activity,
  ShieldAlert,
  ShieldCheck,
  User,
  LogOut,
  Mail,
  Receipt,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentIndustry: TargetIndustry;
  onSelectIndustry: (industry: TargetIndustry) => void;
  isDeviceMode: boolean;
  onToggleDeviceMode: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  usageState: UserUsageState;
  onOpenPricing: () => void;
  onOpenLegal: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenBilling: () => void;
  onOpenAdmin: () => void;
  onOpenMailbox: () => void;
  onLogout: () => void;
  announcementBanner?: string;
  isBannerActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentIndustry,
  onSelectIndustry,
  isDeviceMode,
  onToggleDeviceMode,
  onOpenHistory,
  historyCount,
  usageState,
  onOpenPricing,
  onOpenLegal,
  currentUser,
  onOpenAuth,
  onOpenBilling,
  onOpenAdmin,
  onOpenMailbox,
  onLogout,
  announcementBanner,
  isBannerActive,
}) => {
  const getIndustryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Stethoscope': return <Stethoscope className="w-4 h-4" />;
      case 'Building2': return <Building2 className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const activeConfig = INDUSTRY_CONFIGS.find((c) => c.id === currentIndustry) || INDUSTRY_CONFIGS[0];
  const userEmail = currentUser?.email?.trim().toLowerCase();
  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'admin' ||
      userEmail === 'jayeshofficial@gmail.com' ||
      userEmail === 'contact@pulsenoteai.in'
    )
  );

  return (
    <header className="w-full shrink-0 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl px-3 py-2.5 sm:px-6 sm:py-3 sticky top-0 z-20 no-print">
      {/* Dynamic Announcement Banner if configured by Admin */}
      {isBannerActive && announcementBanner && (
        <div className="mb-2 -mx-3 -mt-2.5 sm:-mx-6 sm:-mt-3 px-3 py-1.5 bg-gradient-to-r from-emerald-950/70 via-teal-900/60 to-cyan-950/70 border-b border-emerald-500/20 text-center text-[11px] text-emerald-300 font-medium flex items-center justify-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{announcementBanner}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 shadow-lg shadow-teal-900/30 shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1">
                PulseNote <span className="text-emerald-400">AI</span>
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 hidden sm:inline-block">
                Android Core
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden xs:block">
              {activeConfig.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Daily Limit / Pro Badge */}
          <DailyLimitBadge usageState={usageState} onOpenPricing={onOpenPricing} />

          {/* Admin Dashboard Control (STRICTLY rendered ONLY if logged in as verified Admin) */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-sm shadow-amber-500/20"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Admin Dashboard</span>
            </button>
          )}

          {/* User Auth or Client Billing Button */}
          {currentUser ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenBilling}
                title="Client Profile & Subscription Tenure"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40 text-xs font-semibold transition-all"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden sm:inline truncate max-w-[90px]">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  {currentUser.subscription?.isPro ? 'PRO' : 'FREE'}
                </span>
              </button>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700/60 text-slate-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </button>
          )}

          {/* Simulated Mailbox & SMS Notification Center */}
          <button
            onClick={onOpenMailbox}
            title="View Simulated Emails (Welcome, Activation & OTPs)"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-400 hover:text-indigo-400 transition-colors relative"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Legal Agreement Button */}
          <button
            onClick={onOpenLegal}
            title="Legal Notice & User Agreement"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-400 hover:text-amber-400 transition-colors hidden xs:flex"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            title="Saved Documentation History"
            className="relative flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-all active:scale-95"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Archive</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {historyCount}
              </span>
            )}
          </button>

          {/* Toggle Device Frame / Full Responsive */}
          <button
            onClick={onToggleDeviceMode}
            title={isDeviceMode ? 'Switch to Full Screen Responsive Mode' : 'Switch to Android Handset Frame'}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-all active:scale-95"
          >
            {isDeviceMode ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">Expand</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Handset</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Industry Selection Tabs */}
      <div className="mt-2.5 -mx-1 px-1 overflow-x-auto flex gap-1.5 scrollbar-none pb-0.5">
        {INDUSTRY_CONFIGS.map((industry) => {
          const isSelected = industry.id === currentIndustry;
          return (
            <button
              key={industry.id}
              onClick={() => onSelectIndustry(industry.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-slate-100 text-slate-950 font-semibold shadow-md shadow-white/5 ring-2 ring-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className={isSelected ? 'text-slate-950' : 'text-slate-400'}>
                {getIndustryIcon(industry.icon)}
              </span>
              <span>{industry.name.split('/')[0].trim()}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
