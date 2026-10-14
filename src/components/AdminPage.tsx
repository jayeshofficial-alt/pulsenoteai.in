import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Film,
  Image as ImageIcon,
  ArrowLeft,
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
  const isAdmin = isPulseNoteAdmin(currentUser?.email, currentUser?.emailVerified);

  const handleToggle = async (key: 'image' | 'video') => {
    if (!isAdmin) {
      onShowToast?.('error', 'Unauthorized: Admin privileges required.');
      return;
    }

    setIsUpdating(true);
    const newImage = key === 'image' ? !features.imageGenerationEnabled : features.imageGenerationEnabled;
    const newVideo = key === 'video' ? !features.videoGenerationEnabled : features.videoGenerationEnabled;

    try {
      await updateFeatureSettings(newImage, newVideo, currentUser?.email || 'admin');
      onShowToast?.('success', `${key === 'image' ? 'Image' : 'Video'} generation switch updated.`);
    } catch (err: any) {
      console.error('Failed to update feature settings:', err);
      onShowToast?.('error', err?.message || 'Failed to update feature switch.');
    } finally {
      setIsUpdating(false);
    }
  };

  // If not signed in as one of the two admin emails, show Access Denied
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
        {/* Navigation & Title */}
        <div className="flex items-center justify-between border-b border-[#2d2e30] pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white transition cursor-pointer"
              title="Return"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Admin Feature Switches
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Admin
                </span>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Authoritative Firestore <span className="font-mono text-slate-300">settings/features</span> switches. Real-time broadcast to all clients.
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-[#9aa0a6] block">Authenticated Administrator</span>
            <span className="text-xs font-mono text-emerald-400 font-medium">{currentUser?.email}</span>
          </div>
        </div>

        {/* Security Notice Banner */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#c4c7c5]">
          <ShieldCheck size={20} className="text-[#4e8cff] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Cryptographic Server & Firestore Security Rule Enforcement</p>
            <p className="text-[#9aa0a6] leading-relaxed">
              When toggled off, image and video prompt boxes, navigation tabs, and output areas are immediately removed from client views. In addition, Cloud Functions return HTTP 403 "This feature is turned off", preventing API bypass.
            </p>
          </div>
        </div>

        {/* Switches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Generation Toggle */}
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ImageIcon size={22} />
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border ${
                    features.imageGenerationEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}
                >
                  {features.imageGenerationEnabled ? 'ONLINE / ENABLED' : 'OFFLINE / DISABLED'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white">Image Generation</h3>
              <p className="text-xs text-[#9aa0a6] leading-relaxed">
                Controls Imagen 4.0 (<span className="font-mono text-amber-300">imagen-4.0-generate-001</span>) creation pipeline across the workspace and Imagen Studio.
              </p>
            </div>

            <div className="pt-4 border-t border-[#2d2e30] flex items-center justify-between">
              <span className="text-xs text-slate-300">
                {features.imageGenerationEnabled ? 'Currently enabled' : 'Currently disabled'}
              </span>
              <button
                type="button"
                onClick={() => handleToggle('image')}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md ${
                  features.imageGenerationEnabled
                    ? 'bg-red-600/80 hover:bg-red-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isUpdating ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : features.imageGenerationEnabled ? (
                  <ToggleRight size={16} />
                ) : (
                  <ToggleLeft size={16} />
                )}
                <span>{features.imageGenerationEnabled ? 'Turn Off' : 'Turn On'}</span>
              </button>
            </div>
          </div>

          {/* Video Generation Toggle */}
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Film size={22} />
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border ${
                    features.videoGenerationEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}
                >
                  {features.videoGenerationEnabled ? 'ONLINE / ENABLED' : 'OFFLINE / DISABLED'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white">Video Generation</h3>
              <p className="text-xs text-[#9aa0a6] leading-relaxed">
                Controls Google Veo 3.0 (<span className="font-mono text-purple-300">veo-3.0-fast-generate-001</span>) long-running video synthesis pipeline and Veo Studio.
              </p>
            </div>

            <div className="pt-4 border-t border-[#2d2e30] flex items-center justify-between">
              <span className="text-xs text-slate-300">
                {features.videoGenerationEnabled ? 'Currently enabled' : 'Currently disabled'}
              </span>
              <button
                type="button"
                onClick={() => handleToggle('video')}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md ${
                  features.videoGenerationEnabled
                    ? 'bg-red-600/80 hover:bg-red-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isUpdating ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : features.videoGenerationEnabled ? (
                  <ToggleRight size={16} />
                ) : (
                  <ToggleLeft size={16} />
                )}
                <span>{features.videoGenerationEnabled ? 'Turn Off' : 'Turn On'}</span>
              </button>
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
