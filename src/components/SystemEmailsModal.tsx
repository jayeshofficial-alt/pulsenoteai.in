import React, { useState, useEffect } from 'react';
import { SystemEmailNotification } from '../types';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Inbox,
  AlertCircle
} from 'lucide-react';

interface SystemEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onActivateAccount?: (token: string, email: string) => void;
}

export const SystemEmailsModal: React.FC<SystemEmailsModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onActivateAccount,
}) => {
  const [emails, setEmails] = useState<SystemEmailNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEmails();
    }
  }, [isOpen, userEmail]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const url = userEmail 
        ? `/api/system/emails?email=${encodeURIComponent(userEmail)}`
        : '/api/system/emails';
      const res = await fetch(url);
      const data = await res.json();
      if (data.emails) {
        setEmails(data.emails);
      }
    } catch (err) {
      console.error('Failed to load system emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOtp = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Simulated User Mailbox & SMS Center
              </h3>
              <p className="text-xs text-slate-400">
                Live capture of Welcome Emails, Activation Tokens, and Password Reset OTPs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading system emails...</div>
          ) : emails.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
              No emails or SMS messages sent yet. Create an account or request a password reset to see messages.
            </div>
          ) : (
            emails.map((msg) => {
              const isWelcome = msg.type === 'welcome_activation';
              const isOtp = msg.type === 'password_reset_otp';
              const isExpired = msg.type === 'subscription_expired';

              // Extract token from actionUrl if available
              let tokenFromUrl = '';
              if (msg.actionUrl && msg.actionUrl.includes('token=')) {
                const match = msg.actionUrl.match(/token=([a-zA-Z0-9]+)/);
                if (match) tokenFromUrl = match[1];
              }

              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isWelcome 
                      ? 'bg-emerald-950/20 border-emerald-500/30' 
                      : isExpired 
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-950 border-slate-800'
                  } space-y-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg text-xs ${
                        isWelcome ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {msg.subject}
                        </h4>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          To: {msg.toName} &lt;{msg.toEmail}&gt;
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                    {msg.bodyText}
                  </div>

                  {/* Interactive Button for Welcome Activation or OTP Copy */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {isWelcome && onActivateAccount && tokenFromUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          onActivateAccount(tokenFromUrl, msg.toEmail);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Activate Account Now (1-Click)
                      </button>
                    )}

                    {isOtp && msg.otpCode && (
                      <button
                        type="button"
                        onClick={() => handleCopyOtp(msg.otpCode!, msg.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Copied {msg.otpCode}!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy OTP Code ({msg.otpCode})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
