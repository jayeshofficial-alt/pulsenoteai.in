import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  CreditCard,
  Lock,
  Layers,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PulseNotePlan } from '../types';
import { auth } from '../lib/firebase';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: PulseNotePlan;
  currentCredits?: number;
  notesUsedThisMonth?: number;
  onUpgradeSuccess?: (plan: PulseNotePlan) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan = 'free',
  currentCredits = 0,
  notesUsedThisMonth = 0,
  onUpgradeSuccess,
  onShowToast,
}) => {
  const [tab, setTab] = useState<'plans' | 'credits' | 'faq'>('plans');
  const [teamSeats, setTeamSeats] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribePlan = async (plan: 'pro' | 'team') => {
    setIsProcessing(true);
    try {
      await loadRazorpayScript();

      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ plan, seats: teamSeats }),
      });

      const data = await res.json();
      const activeKeyId = data.keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || (import.meta as any).env?.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_To8VhLeb57Fbsw';

      if (!data.success || (!data.subscriptionId && !data.orderId)) {
        const errDesc = data.error || 'Failed to initiate Razorpay subscription';
        onShowToast?.('error', errDesc);
        setIsProcessing(false);
        return;
      }

      // Check if Razorpay script loaded
      if (!(window as any).Razorpay) {
        await verifyLocalPayment({ plan, seats: teamSeats, subscriptionId: data.subscriptionId || data.orderId, token });
        return;
      }

      // Exact options required for Razorpay Subscriptions / Orders (NO amount or currency for sub)
      const options: any = {
        key: activeKeyId,
        name: 'PulseNote AI',
        description: plan === 'pro' ? 'Pro Monthly Plan' : `Clinic Team Plan (${teamSeats} seats)`,
        prefill: {
          email: data.customerEmail || auth.currentUser?.email || '',
        },
        theme: {
          color: '#4e8cff',
        },
        handler: async (response: any) => {
          await verifyLocalPayment({
            plan,
            seats: teamSeats,
            paymentId: response.razorpay_payment_id,
            subscriptionId: response.razorpay_subscription_id || response.razorpay_order_id,
            signature: response.razorpay_signature,
            token,
          });
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      if (data.subscriptionId) {
        options.subscription_id = data.subscriptionId;
      } else if (data.orderId) {
        options.order_id = data.orderId;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        console.error('[Razorpay Payment Failed]', {
          code: resp.error?.code,
          description: resp.error?.description,
          source: resp.error?.source,
          step: resp.error?.step,
          reason: resp.error?.reason,
          metadata: resp.error?.metadata,
        });
        onShowToast?.('error', resp.error?.description || 'Payment process failed or was cancelled.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Subscription error:', err);
      onShowToast?.('error', err?.message || 'Payment initiation failed.');
      setIsProcessing(false);
    }
  };

  const handleBuyCredits = async (packId: 'credits_100' | 'credits_500') => {
    setIsProcessing(true);
    try {
      await loadRazorpayScript();

      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate credit order');
      }

      if (!(window as any).Razorpay) {
        await verifyLocalPayment({ packId, orderId: data.orderId, token });
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'PulseNote AI',
        description: `${packId === 'credits_100' ? '100 Multimedia Credits' : '500 Multimedia Credits'}`,
        order_id: data.orderId,
        prefill: {
          email: data.customerEmail || auth.currentUser?.email || '',
        },
        theme: {
          color: '#10b981',
        },
        handler: async (response: any) => {
          await verifyLocalPayment({
            packId,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            token,
          });
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        onShowToast?.('error', resp.error?.description || 'Payment was cancelled or failed.');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Credits error:', err);
      onShowToast?.('error', err?.message || 'Credit purchase failed.');
      setIsProcessing(false);
    }
  };

  const verifyLocalPayment = async (payload: any) => {
    try {
      const res = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: payload.token ? `Bearer ${payload.token}` : '',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast?.('success', `Payment completed successfully!`);
        if (payload.plan) {
          onUpgradeSuccess?.(payload.plan);
        }
        onClose();
      }
    } catch (e) {
      console.error('Verification notice:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const faqs = [
    {
      q: 'How do the 5 free notes work on the Free plan?',
      a: 'Free accounts receive 5 deterministic notes each calendar month. When you reach 5 notes, an upgrade dialog invites you to subscribe to Pro for unlimited notes.',
    },
    {
      q: 'What do multimedia credits cover?',
      a: 'Credits power advanced Google generative media models: 1 credit per Imagen 4.0 image generation, and 10 credits per Veo 3.0 cinematic video generation. Pro accounts receive 50 credits every month.',
    },
    {
      q: 'How does Clinic/Team billing work?',
      a: 'Teams start at ₹399 per seat per month (minimum 3 seats). The team owner manages invites and shared templates across all team members.',
    },
    {
      q: 'Is GST included in the prices?',
      a: 'Prices are listed in Indian Rupees (INR) with Razorpay checkout providing compliant digital receipts.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-3xl max-w-4xl w-full p-5 sm:p-8 space-y-6 shadow-2xl my-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d2e30] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#4e8cff]/10 border border-[#4e8cff]/30 flex items-center justify-center text-[#4e8cff]">
                <Sparkles size={18} />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Plans & Credit Packs
              </h2>
            </div>
            <p className="text-xs text-[#9aa0a6] mt-1">
              Deterministic documentation and multimodal intelligence built on Google Cloud.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9aa0a6] hover:text-white hover:bg-[#2d2e30] transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-[#131314] rounded-2xl border border-[#2d2e30] max-w-sm">
          <button
            type="button"
            onClick={() => setTab('plans')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              tab === 'plans' ? 'bg-[#2d2e30] text-white shadow-sm' : 'text-[#9aa0a6] hover:text-white'
            }`}
          >
            Subscription Plans
          </button>
          <button
            type="button"
            onClick={() => setTab('credits')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              tab === 'credits' ? 'bg-[#2d2e30] text-white shadow-sm' : 'text-[#9aa0a6] hover:text-white'
            }`}
          >
            Credit Packs
          </button>
          <button
            type="button"
            onClick={() => setTab('faq')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              tab === 'faq' ? 'bg-[#2d2e30] text-white shadow-sm' : 'text-[#9aa0a6] hover:text-white'
            }`}
          >
            FAQ
          </button>
        </div>

        {/* TAB 1: Subscription Plans */}
        {tab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free Plan */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 ${
                currentPlan === 'free'
                  ? 'bg-[#131314] border-[#4e8cff]/50 ring-1 ring-[#4e8cff]/30'
                  : 'bg-[#131314]/70 border-[#2d2e30]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Free Starter</h3>
                  {currentPlan === 'free' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-white">
                  ₹0 <span className="text-xs text-[#9aa0a6] font-normal">/ month</span>
                </div>
                <p className="text-xs text-[#9aa0a6]">
                  Ideal for solo clinicians exploring deterministic documentation output.
                </p>
                <ul className="space-y-2 text-xs text-[#c4c7c5] pt-2 border-t border-[#2d2e30]">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#4e8cff] shrink-0" />
                    <span>5 notes per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#4e8cff] shrink-0" />
                    <span>All 5 standard domain lenses</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#70757a]">
                    <Lock size={13} className="shrink-0" />
                    <span>No exports (PDF/Word locked)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#70757a]">
                    <Lock size={13} className="shrink-0" />
                    <span>No Image or Video generation</span>
                  </li>
                </ul>
              </div>

              <button
                disabled
                className="w-full py-2.5 rounded-xl bg-[#2d2e30] text-xs text-[#9aa0a6] font-medium"
              >
                {currentPlan === 'free' ? 'Active Plan' : 'Free Tier'}
              </button>
            </div>

            {/* Pro Plan */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 relative ${
                currentPlan === 'pro'
                  ? 'bg-gradient-to-b from-[#1c2438] to-[#131314] border-[#4e8cff] ring-2 ring-[#4e8cff]/40 shadow-xl'
                  : 'bg-gradient-to-b from-[#1a2030] to-[#131314] border-[#4e8cff]/60 shadow-xl'
              }`}
            >
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-[#4e8cff] to-indigo-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                Most Popular
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Zap size={16} className="text-[#4e8cff]" /> Pro Practitioner
                  </h3>
                  {currentPlan === 'pro' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-white">
                  ₹499 <span className="text-xs text-[#9aa0a6] font-normal">/ month</span>
                </div>
                <p className="text-xs text-[#9aa0a6]">
                  For active doctors, attorneys, and engineers demanding full deterministic volume and exports.
                </p>
                <ul className="space-y-2 text-xs text-[#c4c7c5] pt-2 border-t border-[#2d2e30]">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Unlimited notes & dictations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>PDF & Word (.docx) export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Copy as FHIR / HL7-ready text</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Up to 10 custom templates</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSubscribePlan('pro')}
                disabled={isProcessing || currentPlan === 'pro'}
                className="w-full py-2.5 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] disabled:opacity-50 text-xs text-white font-bold transition shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                {isProcessing
                  ? 'Connecting to Razorpay...'
                  : currentPlan === 'pro'
                  ? 'Current Plan Active'
                  : 'Upgrade to Pro (₹499/mo)'}
              </button>
            </div>

            {/* Clinic / Team Plan */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 ${
                currentPlan === 'team'
                  ? 'bg-[#131314] border-purple-500/60 ring-2 ring-purple-500/40'
                  : 'bg-[#131314]/70 border-[#2d2e30]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Users size={16} className="text-purple-400" /> Clinic / Team
                  </h3>
                  {currentPlan === 'team' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-white">
                  ₹399 <span className="text-xs text-[#9aa0a6] font-normal">/ seat / month</span>
                </div>
                <p className="text-xs text-[#9aa0a6]">
                  For group practices, inspection firms, and enterprise teams with centralized management.
                </p>

                <div className="p-2.5 rounded-xl bg-[#1e1f20] border border-[#2d2e30] space-y-1">
                  <label className="text-[11px] text-[#9aa0a6] block">
                    Seats (Minimum 3 seats):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={3}
                      max={50}
                      value={teamSeats}
                      onChange={(e) => setTeamSeats(Math.max(3, Number(e.target.value)))}
                      className="w-16 bg-[#131314] border border-[#3c4043] rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                    <span className="text-xs text-white font-mono font-medium">
                      = ₹{teamSeats * 399}/mo
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-[#c4c7c5] pt-1 border-t border-[#2d2e30]">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-purple-400 shrink-0" />
                    <span>Everything in Pro for all seats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-purple-400 shrink-0" />
                    <span>Unlimited shared team templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-purple-400 shrink-0" />
                    <span>Team admin dashboard (/team)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-purple-400 shrink-0" />
                    <span>Pooled credits across all members</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSubscribePlan('team')}
                disabled={isProcessing || currentPlan === 'team'}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs text-white font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                {isProcessing
                  ? 'Connecting to Razorpay...'
                  : currentPlan === 'team'
                  ? 'Current Plan Active'
                  : `Start Team Plan (₹${teamSeats * 399}/mo)`}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Credit Packs */}
        {tab === 'credits' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#131314] border border-[#2d2e30] flex items-center justify-between text-xs">
              <span className="text-[#9aa0a6]">Your current balance:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {currentCredits} Credits
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 100 Credits */}
              <div className="bg-[#131314] border border-[#2d2e30] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
                      Starter Pack
                    </span>
                    <span className="text-xs text-[#9aa0a6]">One-Time Order</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">100 Credits</h3>
                  <div className="text-2xl font-black text-white">₹299</div>
                  <p className="text-xs text-[#9aa0a6] leading-relaxed">
                    Provides 100 Imagen 4.0 images or 10 Veo 3.0 cinematic videos. Never expires.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleBuyCredits('credits_100')}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold transition cursor-pointer"
                >
                  Buy 100 Credits (₹299)
                </button>
              </div>

              {/* 500 Credits */}
              <div className="bg-[#131314] border border-emerald-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between relative shadow-lg">
                <div className="absolute -top-3 right-4 bg-emerald-500 text-black font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                  Best Value
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
                      Pro Power Pack
                    </span>
                    <span className="text-xs text-[#9aa0a6]">One-Time Order</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">500 Credits</h3>
                  <div className="text-2xl font-black text-white">₹1,199</div>
                  <p className="text-xs text-[#9aa0a6] leading-relaxed">
                    Provides 500 Imagen 4.0 images or 50 Veo 3.0 cinematic videos. Save over 20%.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleBuyCredits('credits_500')}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold transition cursor-pointer"
                >
                  Buy 500 Credits (₹1,199)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FAQ */}
        {tab === 'faq' && (
          <div className="space-y-2.5">
            {faqs.map((f, idx) => {
              const isOpenItem = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#131314] border border-[#2d2e30] rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpenItem ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-white hover:bg-[#1a1b1d] transition cursor-pointer"
                  >
                    <span>{f.q}</span>
                    {isOpenItem ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpenItem && (
                    <div className="p-4 pt-0 text-xs text-[#9aa0a6] leading-relaxed border-t border-[#2d2e30]/40">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trust Footer */}
        <div className="pt-3 border-t border-[#2d2e30] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#9aa0a6]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Secure Razorpay Checkout • Built on Google Cloud</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Do not enter patient-identifying information.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
