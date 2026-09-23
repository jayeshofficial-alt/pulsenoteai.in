import React, { useState } from 'react';
import { ShieldAlert, CheckSquare, Square, FileText, Lock, AlertTriangle } from 'lucide-react';

interface OnboardingLegalModalProps {
  isOpen: boolean;
  onAccept: () => void;
  canDismissWithoutAccept?: boolean;
  onClose?: () => void;
}

export const OnboardingLegalModal: React.FC<OnboardingLegalModalProps> = ({
  isOpen,
  onAccept,
  canDismissWithoutAccept = false,
  onClose,
}) => {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (isChecked) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Terminal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide font-mono uppercase">
                Legal Notice & User Agreement
              </h2>
              <p className="text-xs text-slate-400">Mandatory Verification & Release of Liability</p>
            </div>
          </div>

          {canDismissWithoutAccept && onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Legal Text Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              By proceeding to use <strong>PulseNote AI</strong>, you explicitly acknowledge, understand, and agree to the following terms prior to accessing the tool.
            </span>
          </div>

          <div className="space-y-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2 text-emerald-400">
                <span>1. ASSISTIVE NATURE ONLY</span>
              </h4>
              <p className="text-slate-400 text-xs mt-1 leading-normal">
                The app utilizes automated artificial intelligence to generate text, summaries, and structural layouts. It is strictly an administrative productivity aid and does <strong>NOT</strong> provide certified professional, clinical, legal, or financial advice.
              </p>
            </div>

            <div className="border-t border-slate-800/60 pt-3">
              <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2 text-cyan-400">
                <span>2. MANDATORY HUMAN VERIFICATION</span>
              </h4>
              <p className="text-slate-400 text-xs mt-1 leading-normal">
                You agree that you are <strong>solely responsible</strong> for reviewing, editing, verifying, and validating every word of any AI-generated output with a qualified, licensed expert before utilizing, filing, sharing, or acting upon it.
              </p>
            </div>

            <div className="border-t border-slate-800/60 pt-3">
              <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2 text-rose-400">
                <span>3. ABSOLUTE LIMITATION OF LIABILITY</span>
              </h4>
              <p className="text-slate-400 text-xs mt-1 leading-normal">
                To the fullest extent permitted by law, the developer, creators, and affiliates of this application shall bear <strong>ZERO liability</strong> for any direct, indirect, incidental, consequential, or punitive damages—including data loss, financial loss, professional penalties, or legal liabilities—arising from your use of or reliance upon app-generated suggestions.
              </p>
            </div>

            <div className="border-t border-slate-800/60 pt-3">
              <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2 text-purple-400">
                <span>4. DATA COLLECTION</span>
              </h4>
              <p className="text-slate-400 text-xs mt-1 leading-normal">
                You consent to secure server logging of your account registration details, usage timelines, and search history to maintain service quality and prevent abuse.
              </p>
            </div>
          </div>
        </div>

        {/* Checkbox Gate & Action Button */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col gap-3">
          <label
            onClick={() => setIsChecked(!isChecked)}
            className="flex items-start gap-3 cursor-pointer select-none p-2 rounded-xl hover:bg-slate-900/60 transition-colors"
          >
            <div className="mt-0.5 text-emerald-400 shrink-0">
              {isChecked ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <span className="text-xs text-slate-300 font-medium leading-relaxed">
              I have fully read, understood, and accept all terms of this <strong>Disclaimer</strong>, <strong>Limitation of Liability</strong>, and <strong>Data Policy</strong>.
            </span>
          </label>

          <button
            onClick={handleProceed}
            disabled={!isChecked}
            className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${
              isChecked
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Lock className="w-4 h-4" />
            {isChecked ? 'PROCEED TO APP' : 'PROCEED TO APP (Check box to unlock)'}
          </button>
        </div>
      </div>
    </div>
  );
};
