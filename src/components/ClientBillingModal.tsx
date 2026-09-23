import React, { useState, useEffect } from 'react';
import { UserProfile, PaymentRecord, UserSubscriptionInfo } from '../types';
import { 
  X, 
  CreditCard, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Download, 
  RefreshCw, 
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Receipt
} from 'lucide-react';

interface ClientBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenPricing: () => void;
  onRefreshUser: () => void;
}

export const ClientBillingModal: React.FC<ClientBillingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenPricing,
  onRefreshUser,
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadBillingData();
    }
  }, [isOpen, currentUser]);

  const loadBillingData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/billing?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data.payments) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSyncExpiration = async () => {
    setSyncing(true);
    try {
      await fetch('/api/cron/check-expirations', { method: 'POST' });
      await loadBillingData();
      onRefreshUser();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadInvoice = (payment: PaymentRecord) => {
    const invoiceContent = `
============================================================
PULSE NOTE AI TECHNOLOGIES - OFFICIAL PAYMENT RECEIPT
============================================================
Receipt ID: ${payment.id}
Order ID: ${payment.orderId}
Date: ${new Date(payment.timestamp).toLocaleString()}
Client Name: ${payment.userName}
Client Email: ${payment.userEmail}

Plan Purchased: ${payment.planName}
Amount Paid: ${payment.currency === 'INR' ? '₹' : '$'}${payment.amount}
Payment Mode: ${payment.paymentMethod}
Transaction Reference / UTR: ${payment.transactionRef}
Settlement Account (Direct VPA): ${payment.settlementVpa}
Payment Status: ${payment.status.toUpperCase()}

Security & Compliance:
• Direct Settlement to wagh.jayesh@oksbi
• PCI-DSS Compliant Tokenized Checkout
• TLS 1.3 / AES-256 Encryption

Thank you for choosing PulseNote AI.
============================================================
    `.trim();

    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${payment.orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const subscription = currentUser?.subscription;
  const isPro = subscription?.isPro;
  const expiresAt = subscription?.expiresAt;

  // Format Expiry & Remaining Tenure
  let tenureText = 'No active premium package';
  let daysRemaining: number | null = null;

  if (isPro) {
    if (!expiresAt) {
      tenureText = 'Perpetual / Lifetime Access';
    } else {
      const msLeft = expiresAt - Date.now();
      daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      tenureText = `Active until: ${new Date(expiresAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining)`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Client Billing & Subscription Tenure
              </h3>
              <p className="text-xs text-slate-400">
                Logged in as: <span className="text-slate-200 font-semibold">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSyncExpiration}
              disabled={syncing}
              title="Sync subscription status with expiration engine"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Subscription Tenure Status Card */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isPro 
              ? 'bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 border-emerald-500/40' 
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    isPro 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isPro ? (subscription?.tier === 'admin_grant' ? 'Admin Granted Pro' : subscription?.tier?.toUpperCase()) : 'Free Tier Limit (3 / Day)'}
                  </span>
                  {isPro && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Unlimited Prompts
                    </span>
                  )}
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                  {isPro ? 'PulseNote Pro Unlimited Active' : 'Basic Tier (Free Plan)'}
                </h4>

                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {tenureText}
                </p>
              </div>

              <div className="shrink-0 flex sm:flex-col gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {isPro ? 'Extend / Upgrade Plan' : 'Upgrade to Pro (₹299/mo)'}
                </button>
              </div>
            </div>
          </div>

          {/* Past Payments History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Complete Payment & Settlement History
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Direct VPA: wagh.jayesh@oksbi
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading payment history...</div>
            ) : payments.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                No past payments recorded for this account. Upgrade to Pro to unlock unlimited usage.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Plan / Description</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Reference / UTR</th>
                      <th className="p-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          {new Date(p.timestamp).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-semibold text-white whitespace-nowrap">
                          {p.planName}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {p.currency === 'INR' ? '₹' : '$'}{p.amount}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-mono border border-slate-800">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap max-w-[120px] truncate" title={p.transactionRef}>
                          {p.transactionRef}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDownloadInvoice(p)}
                            title="Download Receipt"
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
