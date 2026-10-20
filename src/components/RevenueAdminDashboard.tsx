import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Download,
  Users,
  IndianRupee,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Image as ImageIcon,
  Film,
  Pencil,
  Play,
  Square,
  Check,
} from 'lucide-react';
import { isRevenueAdmin } from '../lib/firebase';
import type { UserProfile } from '../types';

interface RevenueAdminDashboardProps {
  currentUser?: UserProfile | null;
  onBack: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface SubRow {
  id: string;
  name: string;
  email: string;
  mobile: string;
  plan: string;
  tier: string;
  isPro: boolean;
  signInDate: number | null;
  planOptedDate: number | null;
  planOptedAmount: number | null;
  planCurrency: string;
  amountPaidDate: number | null;
  planExpiryDate: number | null;
  status: string;
  aiImageEnabled: boolean;
  aiVideoEnabled: boolean;
}

interface Analytics {
  earnings: number;
  currency: string;
  paymentsCount: number;
  activeSubscribers: number;
  renewals: number;
  newSubscribers: number;
  byPlan: Record<string, { count: number; earnings: number }>;
  dailySeries: Array<{ date: string; earnings: number; count: number }>;
}

// Plan catalog with dynamic amounts (mirrors server BILLING_MATRIX + upfront)
const PLAN_OPTIONS = [
  { id: 'pro_monthly', label: 'Pro Monthly — ₹699/mo', plan: 'pro', billing: 'monthly', baseAmount: 699, per: 'month' },
  { id: 'pro_yearly_upfront', label: 'Pro Yearly Upfront — ₹5,508/yr', plan: 'pro', billing: 'yearly_upfront', baseAmount: 5508, per: 'year' },
  { id: 'team_monthly', label: 'Team Monthly — ₹399/seat/mo', plan: 'team', billing: 'monthly', baseAmount: 399, per: 'seat/month' },
  { id: 'team_yearly_upfront', label: 'Team Yearly Upfront — ₹299/seat/mo', plan: 'team', billing: 'yearly_upfront', baseAmount: 299 * 12, per: 'seat/year' },
];

const fmtDate = (ts: number | null) =>
  ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (ts: number | null) =>
  ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const inr = (n: number | null) =>
  n === null || n === undefined ? '—' : `₹${Number(n).toLocaleString('en-IN')}`;

export function RevenueAdminDashboard({ currentUser, onBack, onShowToast }: RevenueAdminDashboardProps) {
  const adminEmail = currentUser?.email || '';
  const allowed = isRevenueAdmin(adminEmail);

  const [users, setUsers] = useState<SubRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'pro' | 'free' | 'expired'>('all');
  const [loading, setLoading] = useState(false);

  const [range, setRange] = useState<'daily' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [expiryUser, setExpiryUser] = useState<SubRow | null>(null);
  const [expiryValue, setExpiryValue] = useState('');
  const [expiryLifetime, setExpiryLifetime] = useState(false);
  const [planUser, setPlanUser] = useState<SubRow | null>(null);
  const [planAction, setPlanAction] = useState<'start' | 'end'>('start');
  const [planChoice, setPlanChoice] = useState(PLAN_OPTIONS[0].id);
  const [planSeats, setPlanSeats] = useState(3);
  const [planMonths, setPlanMonths] = useState(1);
  const [saving, setSaving] = useState(false);

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', 'x-admin-email': adminEmail }),
    [adminEmail]
  );

  const loadUsers = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        plan: planFilter,
        page: String(page),
        limit: '10',
      });
      const res = await fetch(`/api/admin/subscriptions/users?${q.toString()}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to load users.');
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [allowed, search, planFilter, page, headers, onShowToast]);

  const loadAnalytics = useCallback(async () => {
    if (!allowed) return;
    try {
      const q = new URLSearchParams({ range });
      if (range === 'custom') {
        q.set('from', from);
        q.set('to', to);
      }
      const res = await fetch(`/api/admin/subscriptions/analytics?${q.toString()}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load analytics.');
      setAnalytics(data);
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to load analytics.');
    }
  }, [allowed, range, from, to, headers, onShowToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const mutate = async (url: string, method: string, body?: any) => {
    const res = await fetch(url, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || 'Request failed.');
    }
    return data;
  };

  const handleExpirySave = async () => {
    if (!expiryUser) return;
    setSaving(true);
    try {
      const expiresAt = expiryLifetime ? null : expiryValue ? new Date(expiryValue).getTime() : null;
      if (!expiryLifetime && !expiryValue) throw new Error('Pick a date or Lifetime.');
      await mutate(`/api/admin/subscriptions/users/${expiryUser.id}/expiry`, 'PATCH', { expiresAt });
      onShowToast?.('success', `Expiry updated for ${expiryUser.email}.`);
      setExpiryUser(null);
      loadUsers();
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to update expiry.');
    } finally {
      setSaving(false);
    }
  };

  const selectedPlan = PLAN_OPTIONS.find((p) => p.id === planChoice) || PLAN_OPTIONS[0];
  const dynamicAmount =
    planAction === 'end'
      ? 0
      : selectedPlan.plan === 'team'
        ? (selectedPlan.billing === 'yearly_upfront' ? planSeats * 299 * 12 : planSeats * 399)
        : selectedPlan.billing === 'yearly_upfront'
          ? 5508
          : 699;

  const handlePlanSave = async () => {
    if (!planUser) return;
    setSaving(true);
    try {
      await mutate(`/api/admin/subscriptions/users/${planUser.id}/plan`, 'POST', {
        action: planAction,
        plan: planAction === 'end' ? undefined : selectedPlan.plan,
        billing: selectedPlan.billing,
        seats: planSeats,
        amount: dynamicAmount,
        months: selectedPlan.billing === 'yearly_upfront' ? 12 : planMonths,
      });
      onShowToast?.('success', planAction === 'end' ? `Plan ended for ${planUser.email}.` : `Plan started for ${planUser.email} — ${inr(dynamicAmount)}.`);
      setPlanUser(null);
      loadUsers();
      loadAnalytics();
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to update plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleAiToggle = async (row: SubRow, feature: 'image' | 'video') => {
    try {
      const next = feature === 'image' ? !row.aiImageEnabled : !row.aiVideoEnabled;
      await mutate(`/api/admin/subscriptions/users/${row.id}/ai-flags`, 'PATCH', {
        [feature === 'image' ? 'aiImageEnabled' : 'aiVideoEnabled']: next,
      });
      onShowToast?.('success', `AI ${feature} ${next ? 'enabled' : 'disabled'} for ${row.email}.`);
      loadUsers();
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to toggle AI access.');
    }
  };

  const handleExport = async () => {
    try {
      onShowToast?.('info', 'Preparing Excel export…');
      const res = await fetch('/api/admin/subscriptions/export.xlsx', { headers: { 'x-admin-email': adminEmail } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || 'Export failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = res.headers.get('content-disposition') || '';
      const m = cd.match(/filename="([^"]+)"/);
      a.download = m ? m[1] : `pulsenote-subscriptions-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      onShowToast?.('success', 'Excel report downloaded.');
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Export failed.');
    }
  };

  if (!allowed) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-6 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4 bg-[#1e1f20] border border-red-500/30 rounded-2xl p-8">
          <ShieldAlert size={36} className="mx-auto text-red-400" />
          <h2 className="text-lg font-bold text-white">Restricted Area</h2>
          <p className="text-sm text-[#9aa0a6]">
            The Subscription & Revenue Dashboard is accessible only to authorized admins.
            {adminEmail ? ` Signed in as ${adminEmail}.` : ' Please sign in with an authorized admin account.'}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-sm text-white font-semibold transition cursor-pointer"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <IndianRupee size={22} className="text-emerald-400" />
            Subscription & Revenue Dashboard
          </h1>
          <p className="text-xs text-[#9aa0a6] mt-1">
            Signed in as <span className="font-mono text-emerald-300">{adminEmail}</span> · Restricted access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <Download size={14} /> Export to Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-xs text-white font-semibold transition cursor-pointer"
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-[#1e1f20] border border-[#3c4043]/50 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays size={14} /> Earnings filter
          </span>
          {(['daily', 'monthly', 'yearly', 'custom'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                range === r ? 'bg-[#4e8cff] text-white' : 'bg-[#131314] text-[#9aa0a6] hover:text-white border border-[#3c4043]/50'
              }`}
            >
              {r}
            </button>
          ))}
          {range === 'custom' && (
            <>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-[#131314] border border-[#3c4043] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
              <span className="text-xs text-[#9aa0a6]">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-[#131314] border border-[#3c4043] rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: `Earnings (${range})`, value: analytics ? inr(analytics.earnings) : '…', accent: 'text-emerald-300' },
            { label: 'Active subscribers', value: analytics ? String(analytics.activeSubscribers) : '…', accent: 'text-white' },
            { label: 'Renewals', value: analytics ? String(analytics.renewals) : '…', accent: 'text-sky-300' },
            { label: 'New subscribers', value: analytics ? String(analytics.newSubscribers) : '…', accent: 'text-white' },
            { label: 'Payments', value: analytics ? String(analytics.paymentsCount) : '…', accent: 'text-white' },
            { label: 'Total users', value: String(total), accent: 'text-white' },
          ].map((m) => (
            <div key={m.label} className="bg-[#131314] border border-[#3c4043]/40 rounded-xl p-3">
              <p className="text-[11px] text-[#9aa0a6]">{m.label}</p>
              <p className={`text-lg font-black font-mono ${m.accent}`}>{m.value}</p>
            </div>
          ))}
        </div>
        {analytics && Object.keys(analytics.byPlan).length > 0 && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {Object.entries(analytics.byPlan).map(([plan, v]) => (
              <span key={plan} className="px-2.5 py-1 rounded-full bg-[#131314] border border-[#3c4043]/50 text-[#c4c7c5] font-mono">
                {plan}: {v.count} × {inr(v.earnings)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Users table */}
      <div className="bg-[#1e1f20] border border-[#3c4043]/50 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-[#131314] border border-[#3c4043]/50 rounded-xl px-3 py-1.5 flex-1 min-w-[200px]">
            <Search size={14} className="text-[#9aa0a6] shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchInput.trim());
                  setPage(1);
                }
              }}
              placeholder="Search name, email, mobile… (Enter)"
              className="bg-transparent outline-none text-xs text-white w-full placeholder:text-[#5f6368]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch(searchInput.trim());
              setPage(1);
              loadUsers();
            }}
            className="px-3 py-1.5 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-xs font-semibold text-white transition cursor-pointer"
          >
            Search
          </button>
          {(['all', 'pro', 'free', 'expired'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setPlanFilter(f);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                planFilter === f ? 'bg-[#4e8cff] text-white' : 'bg-[#131314] text-[#9aa0a6] hover:text-white border border-[#3c4043]/50'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              loadUsers();
              loadAnalytics();
            }}
            className="p-1.5 rounded-xl bg-[#131314] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white border border-[#3c4043]/50 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#3c4043]/40">
          <table className="w-full text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-[#131314] text-[#9aa0a6] uppercase text-[10px] tracking-wider">
                <th className="text-left p-3 font-semibold">User (Name / Email)</th>
                <th className="text-left p-3 font-semibold">Mobile</th>
                <th className="text-left p-3 font-semibold">Plan</th>
                <th className="text-left p-3 font-semibold">Sign-in Date</th>
                <th className="text-left p-3 font-semibold">Plan Opted Date</th>
                <th className="text-left p-3 font-semibold">Opted Amount</th>
                <th className="text-left p-3 font-semibold">Paid Date</th>
                <th className="text-left p-3 font-semibold">Expiry Date</th>
                <th className="text-left p-3 font-semibold">AI Image</th>
                <th className="text-left p-3 font-semibold">AI Video</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-[#9aa0a6]">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-[#9aa0a6]">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-[#3c4043]/30 hover:bg-[#232425]/60">
                    <td className="p-3">
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="font-mono text-[11px] text-[#9aa0a6]">{u.email}</p>
                    </td>
                    <td className="p-3 font-mono">{u.mobile || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isPro ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{fmtDate(u.signInDate)}</td>
                    <td className="p-3 whitespace-nowrap">{fmtDate(u.planOptedDate)}</td>
                    <td className="p-3 font-mono font-semibold">{inr(u.planOptedAmount)}</td>
                    <td className="p-3 whitespace-nowrap">{fmtDate(u.amountPaidDate)}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={u.planExpiryDate && u.planExpiryDate < Date.now() ? 'text-rose-300 font-semibold' : ''}>
                        {u.planExpiryDate ? fmtDate(u.planExpiryDate) : u.isPro ? 'Lifetime' : '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleAiToggle(u, 'image')}
                        title={u.aiImageEnabled ? 'Disable AI Image' : 'Enable AI Image'}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${u.aiImageEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'}`}
                      >
                        <ImageIcon size={14} />
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleAiToggle(u, 'video')}
                        title={u.aiVideoEnabled ? 'Disable AI Video' : 'Enable AI Video'}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${u.aiVideoEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'}`}
                      >
                        <Film size={14} />
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setExpiryUser(u);
                            setExpiryLifetime(u.planExpiryDate === null && u.isPro);
                            setExpiryValue(u.planExpiryDate ? new Date(u.planExpiryDate).toISOString().slice(0, 10) : '');
                          }}
                          title="Edit plan expiry"
                          className="p-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] text-[#c4c7c5] hover:text-white transition cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanUser(u);
                            setPlanAction(u.isPro ? 'end' : 'start');
                            setPlanMonths(1);
                            setPlanSeats(3);
                          }}
                          title={u.isPro ? 'End plan' : 'Start plan'}
                          className="p-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] text-[#c4c7c5] hover:text-white transition cursor-pointer"
                        >
                          {u.isPro ? <Square size={14} /> : <Play size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-[#9aa0a6]">
          <span>
            <Users size={12} className="inline mr-1" />
            {total} user{total === 1 ? '' : 's'} · Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-[#131314] border border-[#3c4043]/50 disabled:opacity-40 hover:bg-[#2d2e30] transition cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-[#131314] border border-[#3c4043]/50 disabled:opacity-40 hover:bg-[#2d2e30] transition cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expiry modal */}
      {expiryUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-white">Plan Expiry — {expiryUser.email}</h3>
            <label className="flex items-center gap-2 text-xs text-[#c4c7c5] cursor-pointer">
              <input type="checkbox" checked={expiryLifetime} onChange={(e) => setExpiryLifetime(e.target.checked)} />
              Lifetime access (no expiry)
            </label>
            {!expiryLifetime && (
              <input
                type="date"
                value={expiryValue}
                onChange={(e) => setExpiryValue(e.target.value)}
                className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setExpiryUser(null)} className="px-4 py-2 rounded-xl text-xs text-[#9aa0a6] hover:text-white hover:bg-[#2d2e30] transition cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleExpirySave}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4e8cff] hover:bg-[#3b78e7] text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? 'Saving…' : <><Check size={13} /> Save Expiry</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start/End plan modal */}
      {planUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-white">
              {planAction === 'end' ? 'End Plan' : 'Start Plan'} — {planUser.email}
            </h3>
            <div className="flex gap-2">
              {(['start', 'end'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setPlanAction(a)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${planAction === a ? (a === 'end' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white') : 'bg-[#131314] text-[#9aa0a6] hover:text-white border border-[#3c4043]/50'}`}
                >
                  {a} plan
                </button>
              ))}
            </div>
            {planAction === 'start' && (
              <>
                <div>
                  <label className="block text-[11px] text-[#9aa0a6] mb-1">Plan type (amount updates live)</label>
                  <select
                    value={planChoice}
                    onChange={(e) => setPlanChoice(e.target.value)}
                    className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedPlan.plan === 'team' && (
                  <div>
                    <label className="block text-[11px] text-[#9aa0a6] mb-1">Seats (min 1)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={planSeats}
                      onChange={(e) => setPlanSeats(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                      className="w-20 bg-[#131314] border border-[#3c4043] rounded-xl px-2 py-1.5 text-xs text-white text-center outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] text-[#9aa0a6] mb-1">Duration (months)</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={planMonths}
                    onChange={(e) => setPlanMonths(Math.max(1, Math.min(36, Number(e.target.value) || 1)))}
                    className="w-20 bg-[#131314] border border-[#3c4043] rounded-xl px-2 py-1.5 text-xs text-white text-center outline-none"
                  />
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                  <span className="text-[#9aa0a6]">Amount to record: </span>
                  <span className="font-black font-mono text-emerald-300 text-sm">{inr(dynamicAmount)}</span>
                  <span className="text-[#9aa0a6]"> · {planMonths} mo</span>
                </div>
              </>
            )}
            {planAction === 'end' && (
              <p className="text-xs text-[#c4c7c5]">The user reverts to Free immediately. No refund is recorded.</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPlanUser(null)} className="px-4 py-2 rounded-xl text-xs text-[#9aa0a6] hover:text-white hover:bg-[#2d2e30] transition cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handlePlanSave}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 ${planAction === 'end' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              >
                {saving ? 'Saving…' : planAction === 'end' ? 'End Plan Now' : `Start Plan (${inr(dynamicAmount)})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
