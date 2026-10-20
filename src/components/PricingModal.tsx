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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mandateStatus, setMandateStatus] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ---- Pricing matrix (single source of truth, mirrors server BILLING_MATRIX) ----
  // Two options only: Monthly mandate (₹699 / ₹399·seat) or Yearly upfront
  // (₹5,508 pro / seats×₹299×12 team). UPI AutoPay powers recurring billing silently.
  const PRO_MONTHLY = 699; // month-to-month mandate, cancel anytime
  const PRO_UPFRONT_TOTAL = 5508; // ₹459 × 12, one-time yearly payment
  const PRO_UPFRONT_MO = 459;
  const TEAM_MO_PER_SEAT = 399; // monthly mandate
  const TEAM_UPFRONT_MO_PER_SEAT = 299; // yearly upfront, per seat

  const proUpfrontSaving = (PRO_MONTHLY - PRO_UPFRONT_MO) * 12; // 2880
  const teamMonthlyRunRate = (seats: number) => seats * TEAM_MO_PER_SEAT * 12; // 3 seats → 14364
  const teamUpfrontTotal = (seats: number) => seats * TEAM_UPFRONT_MO_PER_SEAT * 12; // 3 seats → 10764
  const teamSaving = (seats: number) => teamMonthlyRunRate(seats) - teamUpfrontTotal(seats); // 3600 @3

  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  // Safe JSON: never throw "Unexpected token '<'" on HTML gateway pages
  const safeJson = async (res: Response): Promise<any> => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        res.status >= 500
          ? `Server error (${res.status}). Please retry in a moment.`
          : `Unexpected server response (${res.status}). Please retry.`
      );
    }
  };

  const fetchTimeout = async (url: string, options: any, ms = 60000): Promise<Response> => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    try {
      return await fetch(url, { ...options, signal: c.signal });
    } finally {
      clearTimeout(t);
    }
  };

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

  const handleSubscribePlan = async (
    plan: 'pro' | 'team',
    mode: 'mandate' | 'upfront' = 'mandate'
  ) => {
    setIsProcessing(true);
    setMandateStatus(null);
    try {
      await loadRazorpayScript();

      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      if (mode === 'upfront') {
        // ONE-TIME yearly payment: Pro ₹5,508 | Team seats×₹299×12
        const expectedTotal = plan === 'pro' ? PRO_UPFRONT_TOTAL : teamUpfrontTotal(teamSeats);
        const res = await fetchTimeout('/api/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            plan,
            billing: 'yearly_upfront',
            seats: teamSeats,
            currency: 'INR',
          }),
        });
        const data = await safeJson(res);
        if (!data.success || !data.orderId) {
          throw new Error(data.message || data.error || 'Failed to create yearly order.');
        }
        if (Math.round(Number(data.amount) / 100) !== expectedTotal) {
          throw new Error(`Amount mismatch: expected ${inr(expectedTotal)}. Please retry.`);
        }
        await openCheckout({
          key: data.keyId,
          orderId: data.orderId,
          amount: data.amount,
          plan,
          billing: 'yearly_upfront',
          token,
          description:
            plan === 'pro'
              ? `Pro Yearly Upfront — ${inr(PRO_UPFRONT_TOTAL)} (₹459/mo effective)`
              : `Team Yearly Upfront — ${teamSeats} seats × 12 mo (${inr(expectedTotal)})`,
        });
        return;
      }

      // MANDATE path: recurring monthly deductions (UPI AutoPay / cards).
      // Billing is always monthly now; yearly is sold as one-time upfront.
      const res = await fetchTimeout('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ plan, seats: teamSeats, billing: 'monthly' }),
      });

      const data = await safeJson(res);

      if (!data.success || (!data.subscriptionId && !data.orderId)) {
        const errDesc = data.error || 'Failed to initiate Razorpay subscription';
        onShowToast?.('error', errDesc);
        setIsProcessing(false);
        return;
      }

      // Check if Razorpay script loaded
      if (!(window as any).Razorpay) {
        await verifyLocalPayment({ plan, seats: teamSeats, billing, subscriptionId: data.subscriptionId || data.orderId, token });
        return;
      }

      const perCycleInr = plan === 'pro' ? PRO_MONTHLY : TEAM_MO_PER_SEAT;
      await openCheckout({
        key: data.keyId,
        subscriptionId: data.subscriptionId,
        plan,
        billing: 'monthly',
        token,
        perCycleInr,
        seats: teamSeats,
        description: plan === 'pro'
          ? `Pro Monthly — ${inr(PRO_MONTHLY)}/mo, cancel anytime`
          : `Team Monthly — ${teamSeats} seats × ${inr(TEAM_MO_PER_SEAT)}/mo`,
      });
    } catch (err: any) {
      console.error('Subscription error:', err);
      onShowToast?.('error', err?.message || 'Payment initiation failed.');
      setIsProcessing(false);
    }
  };

  // Shared Razorpay checkout opener for mandate (subscription) and upfront (order) flows
  const openCheckout = async (opts: {
    key: string;
    subscriptionId?: string;
    orderId?: string;
    amount?: number;
    plan: 'pro' | 'team';
    billing: string;
    token: string;
    perCycleInr?: number;
    seats?: number;
    description: string;
  }) => {
    const activeKeyId = opts.key || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_live_To8VhLeb57Fbsw';
    const checkoutOptions: any = {
      key: activeKeyId,
      name: 'PulseNote AI',
      description: opts.description,
      prefill: { email: auth.currentUser?.email || '' },
      theme: { color: '#4e8cff' },
      handler: async (response: any) => {
        await verifyLocalPayment({
          plan: opts.plan,
          seats: opts.seats ?? teamSeats,
          billing: opts.billing,
          paymentId: response.razorpay_payment_id,
          subscriptionId: response.razorpay_subscription_id || response.razorpay_order_id,
          signature: response.razorpay_signature,
          token: opts.token,
        });
      },
      modal: { ondismiss: () => { setIsProcessing(false); setMandateStatus(null); } },
    };
    if (opts.subscriptionId) checkoutOptions.subscription_id = opts.subscriptionId;
    if (opts.orderId) {
      checkoutOptions.order_id = opts.orderId;
      if (opts.amount) checkoutOptions.amount = opts.amount;
      checkoutOptions.currency = 'INR';
    }
    const rzp = new (window as any).Razorpay(checkoutOptions);
    rzp.on('payment.failed', (resp: any) => {
      console.error('[Razorpay Payment Failed]', resp?.error);
      onShowToast?.('error', resp?.error?.description || 'Payment process failed or was cancelled.');
      setIsProcessing(false);
      setMandateStatus(null);
    });
    rzp.open();
  };

  // Poll mandate status — UPI AutoPay authorizations settle asynchronously
  const pollMandateStatus = async (subscriptionId: string, token: string): Promise<boolean> => {
    setMandateStatus('Mandate authorized. Waiting for bank approval…');
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetchTimeout(`/api/razorpay/subscription/${subscriptionId}`, { method: 'GET' }, 20000);
        const data = await safeJson(res);
        if (data.success && data.active) return true;
        setMandateStatus(`Waiting for bank approval… (status: ${data.status || 'pending'})`);
      } catch {
        /* keep polling */
      }
    }
    return false;
  };

  const handleBuyCredits = async (packId: 'credits_100' | 'credits_500') => {
    setIsProcessing(true);
    try {
      await loadRazorpayScript();

      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const res = await fetchTimeout('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ packId }),
      });

      const data = await safeJson(res);
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
      const res = await fetchTimeout('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: payload.token ? `Bearer ${payload.token}` : '',
        },
        body: JSON.stringify(payload),
      }, 45000);
      const data = await safeJson(res);
      if (data.success) {
        // UPI mandates settle asynchronously: confirm the subscription is active
        if (payload.subscriptionId && String(payload.subscriptionId).startsWith('sub_')) {
          const confirmed = await pollMandateStatus(payload.subscriptionId, payload.token);
          if (!confirmed) {
            onShowToast?.('info', 'Payment received — bank mandate approval pending. Your plan activates automatically once approved.');
            setIsProcessing(false);
            setMandateStatus(null);
            if (payload.plan) onUpgradeSuccess?.(payload.plan);
            onClose();
            return;
          }
        }
        onShowToast?.('success', `Payment completed successfully!`);
        if (payload.plan) {
          onUpgradeSuccess?.(payload.plan);
        }
        onClose();
      } else {
        onShowToast?.('error', data.message || 'Payment verification failed. Please contact support with your payment ID.');
      }
    } catch (e: any) {
      console.error('Verification notice:', e);
      onShowToast?.('error', e?.message || 'Verification failed. If money was debited, your plan activates automatically on confirmation.');
    } finally {
      setIsProcessing(false);
      setMandateStatus(null);
    }
  };

  const faqs = [
    {
      q: 'How do the 5 free notes work on the Free plan?',
      a: 'Free accounts receive 5 deterministic notes each calendar month. When you reach 5 notes, an upgrade dialog invites you to subscribe to Pro for unlimited notes.',
    },
    {
      q: 'How does subscription billing work?',
      a: 'Choose Monthly or Yearly at the top. Monthly Pro is ₹699/mo with no commitment, billed via UPI AutoPay or card mandate — cancel anytime. Yearly Pro is a single upfront payment of ₹5,508 (effective ₹459/mo, save ₹2,880/yr, 34%). Mandate payments may take a few minutes for bank approval; your plan activates automatically.',
    },
    {
      q: 'How does Clinic/Team billing work?',
      a: 'Teams start at ₹399 per seat per month (minimum 3 seats) billed via mandate — 3 seats run ₹1,197/mo (₹14,364/yr). Pay yearly upfront at ₹299/seat/mo and 3 seats cost ₹10,764 one-time — a saving of ₹3,600/yr (25%). The team owner manages invites and shared templates across all team members.',
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
                Subscription Plans
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
        <div className="flex items-center gap-2 p-1 bg-[#131314] rounded-2xl border border-[#2d2e30] max-w-xs">
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
            onClick={() => setTab('faq')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              tab === 'faq' ? 'bg-[#2d2e30] text-white shadow-sm' : 'text-[#9aa0a6] hover:text-white'
            }`}
          >
            FAQ
          </button>
        </div>

        {/* Billing Period Slider: Monthly vs Yearly */}
        {tab === 'plans' && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#131314] rounded-2xl border border-[#2d2e30]">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  billingPeriod === 'monthly' ? 'bg-[#4e8cff] text-white shadow' : 'text-[#9aa0a6] hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  billingPeriod === 'yearly' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-[#9aa0a6] hover:text-white'
                }`}
              >
                Yearly
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${billingPeriod === 'yearly' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  −34%
                </span>
              </button>
            </div>
            <p className="text-[11px] text-[#9aa0a6]">
              {billingPeriod === 'monthly'
                ? 'Pay month-to-month via UPI AutoPay or card. Cancel anytime.'
                : `One payment of ${inr(PRO_UPFRONT_TOTAL)} covers 12 months — no monthly deductions.`}
            </p>
          </div>
        )}

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
                  {billingPeriod === 'monthly' ? (
                    <>₹699 <span className="text-xs text-[#9aa0a6] font-normal">/ month</span></>
                  ) : (
                    <>₹5,508 <span className="text-xs text-[#9aa0a6] font-normal">/ year, one-time</span></>
                  )}
                </div>
                {billingPeriod === 'monthly' ? (
                  <p className="text-xs text-[#9aa0a6]">
                    Month-to-month billing via mandate. Cancel anytime.
                  </p>
                ) : (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-300 font-semibold">Effective rate</span>
                      <span className="text-sm font-black text-white">{inr(PRO_UPFRONT_MO)} <span className="text-[10px] font-normal text-[#9aa0a6]">/ month equivalent</span></span>
                    </div>
                    <p className="text-[11px] text-[#c4c7c5]">
                      Effective {inr(PRO_UPFRONT_MO)}/mo — <span className="font-bold text-emerald-300">save {inr(proUpfrontSaving)}/yr (34%)</span> vs monthly billing.
                    </p>
                  </div>
                )}
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

              {billingPeriod === 'monthly' ? (
                <button
                  type="button"
                  onClick={() => handleSubscribePlan('pro', 'mandate')}
                  disabled={isProcessing || currentPlan === 'pro'}
                  className="w-full py-2.5 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] disabled:opacity-50 text-xs text-white font-bold transition shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  {isProcessing
                    ? (mandateStatus || 'Connecting to Razorpay...')
                    : currentPlan === 'pro'
                    ? 'Current Plan Active'
                    : 'Upgrade to Pro (₹699/mo)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubscribePlan('pro', 'upfront')}
                  disabled={isProcessing || currentPlan === 'pro'}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-xs text-slate-950 font-extrabold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {isProcessing
                    ? (mandateStatus || 'Connecting to Razorpay...')
                    : currentPlan === 'pro'
                    ? 'Current Plan Active'
                    : `Pay Yearly Upfront (${inr(PRO_UPFRONT_TOTAL)})`}
                </button>
              )}
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
                  {billingPeriod === 'monthly' ? (
                    <>₹399 <span className="text-xs text-[#9aa0a6] font-normal">/ seat / month</span></>
                  ) : (
                    <>₹299 <span className="text-xs text-[#9aa0a6] font-normal">/ seat / month, yearly upfront</span></>
                  )}
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
                      onChange={(e) => setTeamSeats(Math.max(3, Math.min(50, Number(e.target.value) || 3)))}
                      className="w-16 bg-[#131314] border border-[#3c4043] rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                    {billingPeriod === 'monthly' ? (
                      <span className="text-xs text-white font-mono font-medium">
                        = {inr(teamSeats * 399)}/mo
                      </span>
                    ) : (
                      <span className="text-xs text-white font-mono font-medium">
                        = {inr(teamUpfrontTotal(teamSeats))} one-time
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'monthly' ? (
                    <p className="text-[11px] text-[#9aa0a6]">
                      Yearly run-rate: {inr(teamMonthlyRunRate(teamSeats))}/yr · Switch to <button type="button" onClick={() => setBillingPeriod('yearly')} className="text-purple-300 font-semibold hover:underline cursor-pointer">Yearly</button> to save {inr(teamSaving(teamSeats))} (25%).
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-300 font-semibold">
                      You save {inr(teamSaving(teamSeats))}/yr (25%) vs monthly billing.
                    </p>
                  )}
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
                    <span>Centralized billing & member management</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSubscribePlan('team', billingPeriod === 'yearly' ? 'upfront' : 'mandate')}
                disabled={isProcessing || currentPlan === 'team'}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs text-white font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                {isProcessing
                  ? (mandateStatus || 'Connecting to Razorpay...')
                  : currentPlan === 'team'
                  ? 'Current Plan Active'
                  : billingPeriod === 'yearly'
                    ? `Pay Yearly Upfront (${inr(teamUpfrontTotal(teamSeats))})`
                    : `Start Team Plan (${inr(teamSeats * 399)}/mo)`}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FAQ */}
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
