import React, { useState, useEffect } from 'react';
import { X, Key, Settings as SettingsIcon, ExternalLink, Check, User, Zap, BookOpen, MessageSquare } from 'lucide-react';
import { getOpenRouterApiKey } from '../services/openrouter';
import type { UserProfile, UserUsageState } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  usageState?: UserUsageState;
  onOpenPricing?: () => void;
  onOpenApiKey?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  usageState,
  onOpenPricing,
  onOpenApiKey,
}: SettingsModalProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) setSaved(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const isPro = usageState?.isPro || false;
  const dailyUsed = usageState?.dailyPromptCount || 0;
  const dailyRemaining = Math.max(0, 3 - dailyUsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-3xl w-full max-w-md p-6 shadow-2xl text-[#e3e3e3] space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3c4043]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#4e8cff]/20 text-[#4e8cff] border border-[#4e8cff]/30">
              <SettingsIcon size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Settings & Help</h3>
              <p className="text-xs text-[#9aa0a6]">Manage your workspace</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9aa0a6] hover:text-white rounded-lg hover:bg-[#2d2e30] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Account Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider">Account</h4>
          <div className="p-3 rounded-xl bg-[#131314] border border-[#3c4043]/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4e8cff] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User size={18} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.name || 'Guest User'}
              </p>
              <p className="text-xs text-[#9aa0a6] truncate">
                {currentUser?.email || 'Not signed in'}
              </p>
            </div>
            {isPro && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold shrink-0">
                PRO
              </span>
            )}
          </div>
        </div>

        {/* Usage Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider">Usage</h4>
          <div className="p-3 rounded-xl bg-[#131314] border border-[#3c4043]/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#c4c7c5]">Free transformations today</span>
              <span className={`font-mono font-bold ${isPro ? 'text-emerald-300' : dailyRemaining === 0 ? 'text-rose-300' : 'text-white'}`}>
                {isPro ? 'Unlimited' : `${dailyRemaining} of 3 left`}
              </span>
            </div>
            {!isPro && (
              <div className="w-full h-1.5 rounded-full bg-[#3c4043] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] transition-all"
                  style={{ width: `${Math.min(100, (dailyUsed / 3) * 100)}%` }}
                />
              </div>
            )}
            {!isPro && (
              <button
                type="button"
                onClick={() => { onClose(); onOpenPricing?.(); }}
                className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer"
              >
                <Zap size={13} />
                <span>Upgrade to Pro — ₹1,999/year</span>
              </button>
            )}
          </div>
        </div>

        {/* API Keys Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider">API Keys</h4>
          <button
            type="button"
            onClick={() => { onClose(); onOpenApiKey?.(); }}
            className="w-full p-3 rounded-xl bg-[#131314] border border-[#3c4043]/50 flex items-center gap-3 hover:border-[#4e8cff]/50 transition cursor-pointer text-left"
          >
            <div className="p-2 rounded-lg bg-[#4e8cff]/10 text-[#4e8cff]">
              <Key size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">OpenRouter API Key</p>
              <p className="text-xs text-[#9aa0a6] truncate">
                {getOpenRouterApiKey() ? '••••••••••••••••••••••••' : 'Not configured'}
              </p>
            </div>
            <ExternalLink size={14} className="text-[#9aa0a6]" />
          </button>
        </div>

        {/* Help Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider">Help & Resources</h4>
          <div className="space-y-1">
            <a
              href="https://openrouter.ai/workspaces/default/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-xl bg-[#131314] border border-[#3c4043]/50 flex items-center gap-3 hover:border-[#4e8cff]/50 transition cursor-pointer text-left"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Key size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">OpenRouter Keys</p>
                <p className="text-xs text-[#9aa0a6]">Manage your API keys</p>
              </div>
              <ExternalLink size={14} className="text-[#9aa0a6]" />
            </a>
            <a
              href="https://openrouter.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-xl bg-[#131314] border border-[#3c4043]/50 flex items-center gap-3 hover:border-[#4e8cff]/50 transition cursor-pointer text-left"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <BookOpen size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">OpenRouter Docs</p>
                <p className="text-xs text-[#9aa0a6]">API reference & models</p>
              </div>
              <ExternalLink size={14} className="text-[#9aa0a6]" />
            </a>
            <a
              href="https://pulsenoteai.in"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-xl bg-[#131314] border border-[#3c4043]/50 flex items-center gap-3 hover:border-[#4e8cff]/50 transition cursor-pointer text-left"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <MessageSquare size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">PulseNote AI</p>
                <p className="text-xs text-[#9aa0a6]">pulsenoteai.in</p>
              </div>
              <ExternalLink size={14} className="text-[#9aa0a6]" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3c4043]/30">
          <p className="text-[10px] text-[#9aa0a6]">PulseNote AI v3.8 • pulsenoteai.in</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#9aa0a6] hover:text-white hover:bg-[#2d2e30] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
