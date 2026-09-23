import React, { useState, useEffect } from 'react';
import { 
  TargetIndustry, 
  ToneSetting, 
  DynamicResponseMode,
  TransformedReport, 
  ActionItem, 
  UserUsageState, 
  SubscriptionPlan,
  UserProfile,
  AppInterfaceSettings 
} from './types';
import { PRESET_SAMPLES, INDUSTRY_CONFIGS } from './data/presets';
import { AndroidFrame } from './components/AndroidFrame';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { DocumentViewer } from './components/DocumentViewer';
import { HistoryModal } from './components/HistoryModal';
import { PricingModal } from './components/PricingModal';
import { OnboardingLegalModal } from './components/OnboardingLegalModal';
import { AuthModal } from './components/AuthModal';
import { ClientBillingModal } from './components/ClientBillingModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SystemEmailsModal } from './components/SystemEmailsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Sparkles, ShieldCheck, Zap, Lock, ExternalLink, ShieldAlert, Receipt, Mail } from 'lucide-react';

const TODAY_DATE_STR = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [currentIndustry, setCurrentIndustry] = useState<TargetIndustry>('medical');
  const [rawText, setRawText] = useState<string>(PRESET_SAMPLES[0].rawText);
  const [tone, setTone] = useState<ToneSetting>('standard');
  const [responseMode, setResponseMode] = useState<DynamicResponseMode>('auto');
  const [customContext, setCustomContext] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<TransformedReport | null>(null);
  const [isDeviceMode, setIsDeviceMode] = useState<boolean>(false);
  const [history, setHistory] = useState<TransformedReport[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [hasAcceptedLegalOnboarding, setHasAcceptedLegalOnboarding] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // User Authentication & Profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('pulsenote_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [isBillingModalOpen, setIsBillingModalOpen] = useState<boolean>(false);
  const [isAdminPanelModalOpen, setIsAdminPanelModalOpen] = useState<boolean>(false);
  const [isMailboxModalOpen, setIsMailboxModalOpen] = useState<boolean>(false);

  // Dynamic Interface Settings from Admin
  const [appSettings, setAppSettings] = useState<AppInterfaceSettings>({
    appTagline: 'Transform messy voice memos and rough notes into structured industry documentation.',
    announcementBanner: '🚀 PulseNote Pro Power Pack is live! 45% discount for annual subscriptions.',
    isBannerActive: true,
    heroHeadline: 'Turn messy voice transcripts into elite documentation',
    heroSubhead: 'PulseNote filters filler words, extracts action owners & deadlines, and structures records to strict industry standards.',
    customComplianceNote: 'Mandatory verification required by a licensed professional prior to clinical or legal submission.',
    updatedAt: Date.now(),
    lastUpdatedBy: 'System Administrator',
  });

  // User Usage State & Daily Monetization Tracking (3 Free Prompts / Day)
  const [usageState, setUsageState] = useState<UserUsageState>({
    dailyPromptCount: 0,
    lastResetDate: TODAY_DATE_STR(),
    isPro: false,
    activePlan: 'free',
  });

  // Load user usage & legal status on mount
  useEffect(() => {
    // 1. Check legal onboarding
    try {
      const accepted = localStorage.getItem('pulsenote_legal_accepted_v1');
      if (!accepted) {
        setHasAcceptedLegalOnboarding(false);
        setIsLegalModalOpen(true);
      }
    } catch (e) {
      console.warn('Could not read legal acceptance status:', e);
    }

    // 2. Load usage state
    try {
      const storedUsage = localStorage.getItem('pulsenote_user_usage');
      if (storedUsage) {
        const parsed: UserUsageState = JSON.parse(storedUsage);
        const today = TODAY_DATE_STR();
        
        // Reset daily count if date has changed
        if (parsed.lastResetDate !== today) {
          const resetState: UserUsageState = {
            ...parsed,
            dailyPromptCount: 0,
            lastResetDate: today,
          };
          setUsageState(resetState);
          localStorage.setItem('pulsenote_user_usage', JSON.stringify(resetState));
        } else {
          setUsageState(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read user usage state:', e);
    }

    // 3. Load history
    try {
      const stored = localStorage.getItem('pulsenote_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load history:', e);
    }

    // 4. Fetch dynamic app settings
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setAppSettings(data.settings);
        }
      })
      .catch((e) => console.warn('Could not load settings:', e));

    // 5. Sync user session if logged in
    if (currentUser?.id) {
      refreshUserProfile(currentUser.id);
    }
  }, []);

  const refreshUserProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/auth/me?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('pulsenote_auth_user', JSON.stringify(data.user));

          // Sync usage state with fresh backend subscription status
          const isPro = data.user.subscription?.isPro || false;
          setUsageState((prev) => ({
            ...prev,
            isPro,
            activePlan: isPro ? data.user.subscription?.tier : 'free',
            expiresAt: data.user.subscription?.expiresAt,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('pulsenote_auth_user', JSON.stringify(user));
      localStorage.setItem('pulsenote_auth_token', token);
    } catch (e) {
      console.warn('Failed to save auth token:', e);
    }

    // Strict Role-Based Access Control Check
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const isAdmin = cleanEmail === 'jayeshofficial@gmail.com' || cleanEmail === 'contact@pulsenoteai.in' || user.role === 'admin';

    // Synchronize subscription status: admins get perpetual Pro access; clients get their tier or Free 3/day
    const isPro = isAdmin ? true : Boolean(user.subscription?.isPro);
    setUsageState((prev) => ({
      ...prev,
      isPro,
      activePlan: isPro ? (isAdmin ? 'admin_grant' : (user.subscription?.tier || 'free')) : 'free',
      expiresAt: isAdmin ? null : user.subscription?.expiresAt,
    }));

    // Close the login modal
    setIsAuthModalOpen(false);

    // Dynamic RBAC Redirection:
    if (isAdmin) {
      addToast('success', `Admin authentication verified (${user.name}). Redirecting to Super Admin Dashboard...`);
      setIsAdminPanelModalOpen(true);
      setIsBillingModalOpen(false);
    } else {
      addToast('success', `Welcome back, ${user.name}! Redirecting to Customer Profile...`);
      setIsBillingModalOpen(true);
      setIsAdminPanelModalOpen(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('pulsenote_auth_user');
      localStorage.removeItem('pulsenote_auth_token');
    } catch (e) {
      console.warn('Failed to clear auth:', e);
    }

    setUsageState((prev) => ({
      ...prev,
      isPro: false,
      activePlan: 'free',
    }));
    addToast('info', 'Logged out successfully.');
  };

  const handleActivateAccountFromMailbox = async (token: string, email: string) => {
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed');

      addToast('success', '🎉 Account successfully activated! You can now sign in.');
      setIsAuthModalOpen(true);
      setAuthModalTab('login');
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  const saveUsageState = (newState: UserUsageState) => {
    setUsageState(newState);
    try {
      localStorage.setItem('pulsenote_user_usage', JSON.stringify(newState));
    } catch (e) {
      console.warn('Could not save user usage:', e);
    }
  };

  const handleAcceptLegalOnboarding = () => {
    try {
      localStorage.setItem('pulsenote_legal_accepted_v1', 'true');
    } catch (e) {
      console.warn('Could not store legal accepted flag:', e);
    }
    setHasAcceptedLegalOnboarding(true);
    setIsLegalModalOpen(false);
    addToast('success', 'User Agreement accepted. Welcome to PulseNote AI.');
  };

  const handleUpgradeSuccess = (plan: SubscriptionPlan, txnRef: string) => {
    const isAnnual = plan === 'pro_annual';
    const expiresAt = Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000;

    const updatedState: UserUsageState = {
      ...usageState,
      isPro: true,
      activePlan: plan,
      subscribedAt: Date.now(),
      expiresAt,
      transactionRef: txnRef,
    };

    saveUsageState(updatedState);
    if (currentUser?.id) {
      refreshUserProfile(currentUser.id);
    }
    addToast('success', `🎉 Upgraded to PulseNote ${isAnnual ? 'Pro Annual' : 'Pro Monthly'}! Unlimited prompts unlocked.`);
  };

  const saveHistory = (newHistory: TransformedReport[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('pulsenote_history', JSON.stringify(newHistory));
    } catch (e) {
      console.warn('Could not save history:', e);
    }
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectIndustry = (ind: TargetIndustry) => {
    setCurrentIndustry(ind);
    const matchingPreset = PRESET_SAMPLES.find((p) => p.industry === ind);
    if (matchingPreset && (!rawText || rawText === PRESET_SAMPLES[0].rawText)) {
      setRawText(matchingPreset.rawText);
    }
  };

  // Transform rough notes into industry documentation
  const handleTransform = async () => {
    if (!rawText.trim()) {
      addToast('error', 'Please provide notes or voice transcript to transform.');
      return;
    }

    // Check client-side daily limit for free tier
    if (!usageState.isPro && usageState.dailyPromptCount >= 3) {
      setIsPricingModalOpen(true);
      addToast('info', 'Daily free limit reached (3/3). Please upgrade to Pro for unlimited prompts.');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          targetIndustry: currentIndustry,
          tone,
          responseMode,
          customContext,
          dailyPromptCount: usageState.dailyPromptCount,
          isPro: usageState.isPro,
          userId: currentUser?.id || 'usr_guest',
          userEmail: currentUser?.email || 'client@pulsenote.ai',
          userName: currentUser?.name || 'Guest Client',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      // Check if server halted request due to monetization guardrail
      if (data.isLimitReached) {
        const limitReport: TransformedReport = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          industry: currentIndustry,
          title: 'Daily Free Limit Reached',
          rawInput: rawText,
          executiveSummary: 'Daily free prompt limit reached. Upgrade to Pro for unlimited prompts.',
          responseMode: 'productivity',
          markdownReport: data.markdownReport,
          sections: data.sections || [],
          actionItems: data.actionItems || [],
          detectedEntities: [],
          keyTakeaways: data.keyTakeaways || [],
          complianceDisclaimer: data.complianceDisclaimer,
        };
        setCurrentReport(limitReport);
        setIsPricingModalOpen(true);
        return;
      }

      const newReport: TransformedReport = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        industry: currentIndustry,
        title: data.title || `${currentIndustry.toUpperCase()} Documentation`,
        rawInput: rawText,
        executiveSummary: data.executiveSummary || '',
        responseMode: data.responseMode || (responseMode !== 'auto' ? responseMode : 'productivity'),
        immediateSolution: data.immediateSolution || '',
        bestOnlinePractices: data.bestOnlinePractices || '',
        actionableStrategicPlan: data.actionableStrategicPlan || '',
        searchSources: data.searchSources || [],
        markdownReport: data.markdownReport || '',
        sections: data.sections || [],
        actionItems: (data.actionItems || []).map((item: ActionItem) => ({
          ...item,
          completed: false,
        })),
        detectedEntities: data.detectedEntities || [],
        keyTakeaways: data.keyTakeaways || [],
        complianceDisclaimer: data.complianceDisclaimer || '',
        isVague: data.isVague || false,
        clarificationRequest: data.clarificationRequest || '',
      };

      setCurrentReport(newReport);

      if (data.isVague) {
        addToast('info', 'Guardrail Notice: More context needed for professional summary.');
      } else {
        addToast('success', 'Flawless industry documentation generated!');
        saveHistory([newReport, ...history]);

        // Increment daily prompt count if on Free tier
        if (!usageState.isPro) {
          const newCount = usageState.dailyPromptCount + 1;
          const updatedUsage = {
            ...usageState,
            dailyPromptCount: newCount,
            lastResetDate: TODAY_DATE_STR(),
          };
          saveUsageState(updatedUsage);
        }
      }
    } catch (err: unknown) {
      console.error('Transform error:', err);
      const msg = err instanceof Error ? err.message : 'Transformation failed';
      addToast('error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', 'Copied documentation to clipboard!');
  };

  const handleUpdateActionItem = (index: number, completed: boolean) => {
    if (!currentReport) return;
    const updatedActions = [...currentReport.actionItems];
    updatedActions[index] = { ...updatedActions[index], completed };
    const updatedReport = { ...currentReport, actionItems: updatedActions };
    setCurrentReport(updatedReport);

    const updatedHistory = history.map((h) => (h.id === updatedReport.id ? updatedReport : h));
    saveHistory(updatedHistory);
  };

  const handleEditMarkdown = (newMarkdown: string) => {
    if (!currentReport) return;
    const updatedReport = { ...currentReport, markdownReport: newMarkdown };
    setCurrentReport(updatedReport);
  };

  const handleDeleteReport = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    if (currentReport?.id === id) {
      setCurrentReport(null);
    }
    addToast('info', 'Report deleted from archive.');
  };

  const handleClearAllHistory = () => {
    saveHistory([]);
    addToast('info', 'Archive cleared.');
  };

  const activeConfig = INDUSTRY_CONFIGS.find((c) => c.id === currentIndustry) || INDUSTRY_CONFIGS[0];

  return (
    <AndroidFrame
      isDeviceMode={isDeviceMode}
      onToggleDeviceMode={() => setIsDeviceMode(!isDeviceMode)}
    >
      <div className="flex flex-col min-h-full pb-10">
        {/* Top Header with Usage Badge, User Account & Admin Trigger */}
        <Header
          currentIndustry={currentIndustry}
          onSelectIndustry={handleSelectIndustry}
          isDeviceMode={isDeviceMode}
          onToggleDeviceMode={() => setIsDeviceMode(!isDeviceMode)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={history.length}
          usageState={usageState}
          onOpenPricing={() => setIsPricingModalOpen(true)}
          onOpenLegal={() => setIsLegalModalOpen(true)}
          currentUser={currentUser}
          onOpenAuth={() => {
            setAuthModalTab('login');
            setIsAuthModalOpen(true);
          }}
          onOpenBilling={() => setIsBillingModalOpen(true)}
          onOpenAdmin={() => setIsAdminPanelModalOpen(true)}
          onOpenMailbox={() => setIsMailboxModalOpen(true)}
          onLogout={handleLogout}
          announcementBanner={appSettings.announcementBanner}
          isBannerActive={appSettings.isBannerActive}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-3 sm:px-6 py-4 flex flex-col gap-6 max-w-5xl mx-auto w-full">
          {/* Dynamic Hero Pitch Banner (Visible when no report is generated yet) */}
          {!currentReport && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/30 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    High-Precision Intelligence Engine
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {appSettings.heroHeadline || 'Turn messy voice transcripts into elite documentation'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                  {appSettings.heroSubhead || 'PulseNote filters filler words, extracts action owners & deadlines, and structures records to strict industry standards.'}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-xs font-mono font-bold text-emerald-400">100%</div>
                  <div className="text-[10px] text-slate-400">No Filler Words</div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-xs font-mono font-bold text-cyan-400">Audit-Ready</div>
                  <div className="text-[10px] text-slate-400">Strict Templates</div>
                </div>
              </div>
            </div>
          )}

          {/* Input Module */}
          <section className="w-full">
            <InputPanel
              rawText={rawText}
              onChangeText={setRawText}
              targetIndustry={currentIndustry}
              tone={tone}
              onChangeTone={setTone}
              customContext={customContext}
              onChangeCustomContext={setCustomContext}
              responseMode={responseMode}
              onChangeResponseMode={setResponseMode}
              isProcessing={isProcessing}
              onTransform={handleTransform}
            />
          </section>

          {/* Generated Document Hub */}
          {currentReport && (
            <section className="w-full pt-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <DocumentViewer
                report={currentReport}
                onCopy={handleCopy}
                onUpdateActionItem={handleUpdateActionItem}
                onEditMarkdown={handleEditMarkdown}
                onOpenPricing={() => setIsPricingModalOpen(true)}
              />
            </section>
          )}

          {/* Industry Guidelines & Quality Safeguards Card */}
          <section className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col gap-3 text-xs text-slate-400 no-print">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Industry Compliance & Template Rules ({activeConfig.name})
              </span>
              <span className="text-[11px] font-mono text-slate-500">Android Flagship Engine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {activeConfig.keyFields.map((field, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-medium text-slate-300 truncate">{field}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Legal Notice & Payment Direct Settlement Footer */}
          <footer className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 no-print">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Direct Settlement UPI: <strong className="text-slate-300 font-mono">wagh.jayesh@oksbi</strong>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLegalModalOpen(true)}
                className="hover:text-amber-400 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Legal Agreement & Disclaimer
              </button>
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="hover:text-emerald-400 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Pro Pricing (₹299/mo)
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Pricing & Checkout Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        usageState={usageState}
        onUpgradeSuccess={handleUpgradeSuccess}
        currentUser={currentUser}
      />

      {/* Mandatory Onboarding Legal Modal */}
      <OnboardingLegalModal
        isOpen={isLegalModalOpen}
        onAccept={handleAcceptLegalOnboarding}
        canDismissWithoutAccept={hasAcceptedLegalOnboarding}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* User Authentication & OTP Reset Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onLoginSuccess={handleLoginSuccess}
        onOpenSystemEmails={() => {
          setIsAuthModalOpen(false);
          setIsMailboxModalOpen(true);
        }}
      />

      {/* Client Billing & Subscription Tenure Modal */}
      <ClientBillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        currentUser={currentUser}
        onOpenPricing={() => {
          setIsBillingModalOpen(false);
          setIsPricingModalOpen(true);
        }}
        onRefreshUser={() => {
          if (currentUser?.id) refreshUserProfile(currentUser.id);
        }}
      />

      {/* Super Admin Control Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelModalOpen}
        onClose={() => setIsAdminPanelModalOpen(false)}
        onSettingsUpdated={(newSettings) => setAppSettings(newSettings)}
        currentUser={currentUser}
      />

      {/* Simulated System Mailbox & SMS Center */}
      <SystemEmailsModal
        isOpen={isMailboxModalOpen}
        onClose={() => setIsMailboxModalOpen(false)}
        userEmail={currentUser?.email}
        onActivateAccount={handleActivateAccountFromMailbox}
      />

      {/* History Archive Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        reports={history}
        onSelectReport={(rep) => {
          setCurrentReport(rep);
          setCurrentIndustry(rep.industry);
          setRawText(rep.rawInput);
        }}
        onDeleteReport={handleDeleteReport}
        onClearAll={handleClearAllHistory}
      />

      {/* Floating Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AndroidFrame>
  );
}
