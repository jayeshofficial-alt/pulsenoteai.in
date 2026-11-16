import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, ExternalLink, User, Zap, BookOpen, MessageSquare, ShieldCheck, Plus } from 'lucide-react';
import type { UserProfile, UserUsageState } from '../types';
import {
  auth,
  subscribeToDictionary,
  saveDictionaryTerm,
  deleteDictionaryTerm,
  type DictionaryTermDoc,
} from '../lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  usageState?: UserUsageState;
  onOpenPricing?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  usageState,
  onOpenPricing,
}: SettingsModalProps) {
  const [dictTerms, setDictTerms] = useState<DictionaryTermDoc[]>(() => {
    try {
      const saved = localStorage.getItem('pulsenote_personal_dictionary_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [termInput, setTermInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');

  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUser?.id;
    if (!uid || !isOpen) return;
    const unsub = subscribeToDictionary(uid, (terms) => setDictTerms(terms));
    return () => unsub();
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  const isPro = usageState?.isPro || false;
  const dailyUsed = usageState?.dailyPromptCount || 0;
  const dailyRemaining = Math.max(0, 3 - dailyUsed);

  const handleAddTerm = async () => {
    const term = termInput.trim();
    if (!term) return;
    const replacement = aliasInput.trim();
    const uid = auth.currentUser?.uid || currentUser?.id;
    if (uid) {
      await saveDictionaryTerm(uid, { term, replacement: replacement || undefined });
    } else {
      const updated = [
        { id: `local_${Date.now()}`, term, ...(replacement ? { replacement } : {}) },
        ...dictTerms,
      ];
      setDictTerms(updated);
      try {
        localStorage.setItem('pulsenote_personal_dictionary_v1', JSON.stringify(updated));
      } catch {}
    }
    setTermInput('');
    setAliasInput('');
  };

  const handleRemoveTerm = async (id: string) => {
    const uid = auth.currentUser?.uid || currentUser?.id;
    if (uid && !id.startsWith('local_')) {
      await deleteDictionaryTerm(uid, id);
    } else {
      const updated = dictTerms.filter((t) => t.id !== id);
      setDictTerms(updated);
      try {
        localStorage.setItem('pulsenote_personal_dictionary_v1', JSON.stringify(updated));
      } catch {}
    }
  };

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
              <h3 className="font-semibold text-white text-base">Settings & Vocabulary</h3>
              <p className="text-xs text-[#9aa0a6]">Manage your workspace & custom terminology</p>
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
            <div className="flex items-center justify-between text-xs tabular-nums">
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
                <span>Upgrade to Pro — from ₹699/month</span>
              </button>
            )}
          </div>
        </div>

        {/* Personal Dictionary Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={13} className="text-indigo-400" /> Personal Dictionary ({dictTerms.length})
          </h4>
          <div className="p-3 rounded-xl bg-[#131314] border border-[#3c4043]/50 space-y-2.5">
            <p className="text-[11px] text-[#9aa0a6]">
              Save exact drug names, patient names, or technical terms to guide speech-to-text and note formatting.
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                placeholder="Term (e.g. Metformin)"
                className="flex-1 bg-[#1e1f20] border border-[#3c4043] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#4e8cff]"
              />
              <input
                type="text"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                placeholder="Alias (optional)"
                className="w-28 bg-[#1e1f20] border border-[#3c4043] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#4e8cff]"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                disabled={!termInput.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-[#4e8cff] hover:bg-[#3b78e7] disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                title="Add term"
              >
                <Plus size={14} />
              </button>
            </div>
            {dictTerms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {dictTerms.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] text-indigo-200"
                  >
                    <span>
                      {t.term}
                      {t.replacement ? ` (← ${t.replacement})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(t.id)}
                      className="text-indigo-400 hover:text-white cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Managed Engine Status */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider">AI Engine</h4>
          <div className="p-3 rounded-xl bg-[#131314] border border-emerald-500/30 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">Server-Managed PulseNote Intelligence</p>
              <p className="text-[11px] text-[#9aa0a6]">
                All Gemini & transcription requests are authenticated automatically via secure server routes.
              </p>
            </div>
          </div>
        </div>

        {/* Support Link */}
        <div className="space-y-2">
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
              <p className="text-sm font-medium text-white">PulseNote AI Portal</p>
              <p className="text-xs text-[#9aa0a6]">pulsenoteai.in</p>
            </div>
            <ExternalLink size={14} className="text-[#9aa0a6]" />
          </a>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#3c4043]/30">
          <p className="text-[10px] text-[#9aa0a6]">PulseNote AI • pulsenoteai.in</p>
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
