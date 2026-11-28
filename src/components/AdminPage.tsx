import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { FeatureSettingsDoc } from '../types';
import { updateFeatureSettings, isPulseNoteAdmin, ADMIN_EMAILS } from '../lib/firebase';

interface AdminPageProps {
  currentUser: { email?: string | null; emailVerified?: boolean } | null;
  features: FeatureSettingsDoc;
  onBack: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function AdminPage({
  currentUser,
  features,
  onBack,
  onShowToast,
}: AdminPageProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [allowEmailInput, setAllowEmailInput] = useState('');
  const [denyEmailInput, setDenyEmailInput] = useState('');
  const isAdmin = isPulseNoteAdmin(currentUser?.email, currentUser?.emailVerified);

  const geminiEnabledDefault = features.geminiEnabledDefault !== false;
  const allowedEmails = features.geminiAllowedEmails || [];
  const disabledEmails = features.geminiDisabledEmails || [];

  const saveFeatureUpdate = async (patch: Partial<FeatureSettingsDoc>, successMsg: string) => {
    if (!isAdmin) {
      onShowToast?.('error', 'Unauthorized: Admin privileges required.');
      return;
    }

    setIsUpdating(true);
    try {
      await updateFeatureSettings(
        {
          imageGenerationEnabled: false,
          videoGenerationEnabled: false,
          geminiEnabledDefault,
          geminiAllowedEmails: allowedEmails,
          geminiDisabledEmails: disabledEmails,
          ...patch,
        },
        currentUser?.email || 'admin'
      );
      onShowToast?.('success', successMsg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update feature settings.';
      console.error('Failed to update feature settings:', err);
      onShowToast?.('error', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleDefault = () => {
    const nextDefault = !geminiEnabledDefault;
    saveFeatureUpdate(
      { geminiEnabledDefault: nextDefault },
      `Default Gemini AI access ${nextDefault ? 'enabled' : 'disabled'} for workspace users.`
    );
  };

  const handleAddAllowEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = allowEmailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      onShowToast?.('error', 'Enter a valid email address.');
      return;
    }
    const nextAllowed = Array.from(new Set([...allowedEmails, email]));
    const nextDisabled = disabledEmails.filter((item) => item.toLowerCase() !== email);
    setAllowEmailInput('');
    saveFeatureUpdate(
      { geminiAllowedEmails: nextAllowed, geminiDisabledEmails: nextDisabled },
      `Enabled Gemini AI for ${email}.`
    );
  };

  const handleAddDenyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = denyEmailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      onShowToast?.('error', 'Enter a valid email address.');
      return;
    }
    const nextDisabled = Array.from(new Set([...disabledEmails, email]));
    const nextAllowed = allowedEmails.filter((item) => item.toLowerCase() !== email);
    setDenyEmailInput('');
    saveFeatureUpdate(
      { geminiAllowedEmails: nextAllowed, geminiDisabledEmails: nextDisabled },
      `Disabled Gemini AI for ${email}. All AI UI will be hidden for this account.`
    );
  };

  const handleRemoveAllowEmail = (email: string) => {
    saveFeatureUpdate(
      { geminiAllowedEmails: allowedEmails.filter((item) => item !== email) },
      `Removed ${email} from Gemini allowlist.`
    );
  };

  const handleRemoveDenyEmail = (email: string) => {
    saveFeatureUpdate(
      { geminiDisabledEmails: disabledEmails.filter((item) => item !== email) },
      `Removed ${email} from Gemini disabled list.`
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#131314] text-[#e3e3e3]">
        <div className="max-w-md w-full bg-[#1e1f20] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <Lock size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-xs text-[#9aa0a6] mt-1.5 leading-relaxed">
              The <span className="font-mono text-red-300">/admin</span> control portal is strictly restricted to authorized platform administrators:
            </p>
            <div className="mt-3 p-2.5 rounded-lg bg-[#131314] border border-[#2d2e30] font-mono text-[11px] text-slate-300 space-y-1">
              {ADMIN_EMAILS.map((em) => (
                <div key={em} className="text-amber-300/90">• {em}</div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Current account: <span className="text-white font-mono">{currentUser?.email || 'Signed out'}</span>
          </p>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-sm text-white font-medium transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = features.updatedAt
    ? new Date(features.updatedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'System Initial';

  return (
    <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d2e30] pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white transition cursor-pointer"
              title="Return"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Admin Feature Gating
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Admin
                </span>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Per-user Gemini AI access control synced between Firestore <span className="font-mono text-slate-300">settings/features</span> and backend API guards.
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-[#9aa0a6] block">Authenticated Administrator</span>
            <span className="text-xs font-mono text-emerald-400 font-medium">{currentUser?.email}</span>
          </div>
        </div>

        {/* Enforcement Summary */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#c4c7c5]">
          <ShieldCheck size={20} className="text-[#4e8cff] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Frontend Conditional Removal + Backend Safety Net</p>
            <p className="text-[#9aa0a6] leading-relaxed">
              When Gemini AI is disabled for a user, all AI inputs, prompt bars, output areas, buttons, spinners, and AI history are omitted from the DOM so they never see disabled fields or error banners. Backend routes also enforce HTTP 403 as a fallback safety net.
            </p>
          </div>
        </div>

        {/* Global Default Switch */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">Default Gemini AI Workspace Access</h2>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-medium border ${
                      geminiEnabledDefault
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {geminiEnabledDefault ? 'ENABLED BY DEFAULT' : 'DISABLED BY DEFAULT'}
                  </span>
                </div>
                <p className="text-xs text-[#9aa0a6] mt-1 leading-relaxed">
                  Applies to all users not listed in the per-user allowlist or disabled list below. Turn off to restrict Gemini AI strictly to allowlisted accounts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleDefault}
              disabled={isUpdating}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                geminiEnabledDefault
                  ? 'bg-red-600/80 hover:bg-red-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isUpdating ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : geminiEnabledDefault ? (
                <ToggleRight size={16} />
              ) : (
                <ToggleLeft size={16} />
              )}
              <span>{geminiEnabledDefault ? 'Disable Default' : 'Enable Default'}</span>
            </button>
          </div>
        </div>

        {/* Per-User Allowlist & Denylist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Enable for specific users */}
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Enable Gemini AI for Specific Users</h3>
            </div>
            <p className="text-xs text-[#9aa0a6]">
              Users here always receive the full Gemini AI document workspace, even when default access is disabled.
            </p>

            <form onSubmit={handleAddAllowEmail} className="flex gap-2">
              <input
                type="email"
                value={allowEmailInput}
                onChange={(e) => setAllowEmailInput(e.target.value)}
                placeholder="clinician@clinic.org"
                className="flex-1 bg-[#131314] border border-[#3c4043] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={isUpdating || !allowEmailInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition"
              >
                Allow
              </button>
            </form>

            <div className="space-y-1.5">
              {allowedEmails.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No per-user allow overrides configured.</p>
              ) : (
                allowedEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#131314] border border-emerald-500/30 text-xs"
                  >
                    <span className="font-mono text-emerald-300 truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllowEmail(email)}
                      disabled={isUpdating}
                      className="text-slate-400 hover:text-red-400 p-0.5 cursor-pointer"
                      title="Remove from allowlist"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Disable for specific users */}
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserX size={18} className="text-red-400" />
              <h3 className="text-sm font-semibold text-white">Disable Gemini AI for Specific Users</h3>
            </div>
            <p className="text-xs text-[#9aa0a6]">
              Users here will not see any Gemini AI inputs, outputs, buttons, or AI history anywhere in the workspace.
            </p>

            <form onSubmit={handleAddDenyEmail} className="flex gap-2">
              <input
                type="email"
                value={denyEmailInput}
                onChange={(e) => setDenyEmailInput(e.target.value)}
                placeholder="user@company.com"
                className="flex-1 bg-[#131314] border border-[#3c4043] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
              />
              <button
                type="submit"
                disabled={isUpdating || !denyEmailInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition"
              >
                Disable
              </button>
            </form>

            <div className="space-y-1.5">
              {disabledEmails.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No users explicitly disabled.</p>
              ) : (
                disabledEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#131314] border border-red-500/30 text-xs"
                  >
                    <span className="font-mono text-red-300 truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDenyEmail(email)}
                      disabled={isUpdating}
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                      title="Remove from disabled list"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Audit Metadata Card */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock size={14} className="text-[#4e8cff]" />
            Audit Trail & Last Change Metadata
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-3 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-1">
              <span className="text-[#9aa0a6] flex items-center gap-1.5 text-[11px]">
                <User size={12} /> Changed Last By
              </span>
              <span className="font-mono text-white font-medium block truncate">
                {features.updatedBy || 'system'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-1">
              <span className="text-[#9aa0a6] flex items-center gap-1.5 text-[11px]">
                <Clock size={12} /> Timestamp
              </span>
              <span className="font-mono text-emerald-400 font-medium block">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
