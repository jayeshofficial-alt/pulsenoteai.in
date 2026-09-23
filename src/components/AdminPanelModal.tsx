import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  PaymentRecord, 
  UserActivityLog, 
  AppInterfaceSettings,
  SystemEmailNotification 
} from '../types';
import { 
  X, 
  Users, 
  Search, 
  DollarSign, 
  Edit3, 
  ShieldAlert, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Key, 
  Lock, 
  RefreshCw, 
  Mail, 
  Phone, 
  Sliders, 
  Filter, 
  ArrowUpRight,
  Sparkles,
  Download,
  Eye,
  Check,
  Building2,
  FileText
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: (settings: AppInterfaceSettings) => void;
  currentUser?: UserProfile | null;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'financials' | 'wording' | 'security' | 'emails'>('users');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Directory State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForGrant, setSelectedUserForGrant] = useState<UserProfile | null>(null);
  const [grantAmount, setGrantAmount] = useState<number>(1);
  const [grantUnit, setGrantUnit] = useState<'days' | 'months' | 'years'>('months');
  const [resetPassUserId, setResetPassUserId] = useState<string | null>(null);
  const [newPassForUser, setNewPassForUser] = useState('');

  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<UserActivityLog | null>(null);

  // Financials State
  const [financialsTimeframe, setFinancialsTimeframe] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [financialData, setFinancialData] = useState<any>(null);

  // Wording / Settings State
  const [settings, setSettings] = useState<AppInterfaceSettings>({
    appTagline: '',
    announcementBanner: '',
    isBannerActive: true,
    heroHeadline: '',
    heroSubhead: '',
    customComplianceNote: '',
    updatedAt: Date.now(),
    lastUpdatedBy: 'jayeshofficial@gmail.com',
  });

  // Admin Security
  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  // System Emails
  const [systemEmails, setSystemEmails] = useState<SystemEmailNotification[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, activeTab]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.users) setUsers(data.users);
      } else if (activeTab === 'activity') {
        const res = await fetch('/api/admin/activity-logs');
        const data = await res.json();
        if (data.logs) setActivityLogs(data.logs);
      } else if (activeTab === 'financials') {
        let url = `/api/admin/financials?timeframe=${financialsTimeframe}`;
        if (financialsTimeframe === 'custom' && customStartDate && customEndDate) {
          url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setFinancialData(data);
      } else if (activeTab === 'wording') {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      } else if (activeTab === 'emails') {
        const res = await fetch('/api/system/emails');
        const data = await res.json();
        if (data.emails) setSystemEmails(data.emails);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPremium = async () => {
    if (!selectedUserForGrant) return;
    try {
      const res = await fetch('/api/admin/grant-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForGrant.id,
          amount: grantAmount,
          unit: grantUnit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grant premium');

      setMsg({ type: 'success', text: `Successfully granted ${grantAmount} ${grantUnit} to ${selectedUserForGrant.name}!` });
      setSelectedUserForGrant(null);
      loadInitialData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleResetUserPassword = async (userId: string) => {
    if (!newPassForUser) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPassForUser }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg({ type: 'success', text: 'User password reset successfully.' });
      setResetPassUserId(null);
      setNewPassForUser('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg({ type: 'success', text: 'Dynamic interface text updated successfully!' });
      if (onSettingsUpdated && data.settings) {
        onSettingsUpdated(data.settings);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentAdminPass,
          newPassword: newAdminPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change admin password');

      setMsg({ type: 'success', text: 'Admin password successfully changed!' });
      setCurrentAdminPass('');
      setNewAdminPass('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.mobile.includes(userSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col h-[92vh] overflow-hidden my-auto">
        {/* Admin Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Super Admin Control Panel
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold uppercase">
                  {currentUser?.email || 'Authorized Administrator'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage user directory, manual premium grants, solution activity logs, aggregate financials, and app wording
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadInitialData}
              disabled={loading}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto bg-slate-950 border-b border-slate-800 text-xs font-semibold p-1.5 gap-1 scrollbar-none">
          <button
            onClick={() => { setActiveTab('users'); setMsg(null); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            User Directory & Premium Grants
          </button>

          <button
            onClick={() => { setActiveTab('activity'); setMsg(null); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'activity'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Activity Logs (Searches & Solutions)
          </button>

          <button
            onClick={() => { setActiveTab('financials'); setMsg(null); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'financials'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Financial Analytics & Reports
          </button>

          <button
            onClick={() => { setActiveTab('wording'); setMsg(null); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'wording'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Interface Wording Editor
          </button>

          <button
            onClick={() => { setActiveTab('security'); setMsg(null); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'security'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            Admin Security & Password
          </button>

          <button
            onClick={() => { setActiveTab('emails'); setMsg(null); }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'emails'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            System Emails Log
          </button>
        </div>

        {/* Global Feedback Message */}
        {msg && (
          <div className={`mx-4 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
            msg.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: USERS DIRECTORY & MANUAL GRANT */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by client name, email, or mobile..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                Total Registered Clients: <strong className="text-white">{users.length}</strong>
              </div>
            </div>

            {/* User Directory Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                  <tr>
                    <th className="p-3">User & Contact</th>
                    <th className="p-3">Status / Activation</th>
                    <th className="p-3">Privacy Consent & Timestamp</th>
                    <th className="p-3">Subscription Status</th>
                    <th className="p-3">Active Tenure</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredUsers.map((u) => {
                    const isPro = u.subscription?.isPro;
                    const expiresAt = u.subscription?.expiresAt;
                    return (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {u.role === 'admin' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span>{u.email}</span>
                            {u.mobile && <span>• {u.mobile}</span>}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActivated 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {u.isActivated ? 'Activated' : 'Pending Activation'}
                          </span>
                        </td>

                        <td className="p-3 text-[11px]">
                          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            Explicit Consent
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {u.consentTimestamp ? new Date(u.consentTimestamp).toLocaleString() : 'N/A'}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isPro ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {u.subscription?.tier}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-[11px] text-slate-300">
                          {isPro ? (
                            expiresAt ? (
                              `Until ${new Date(expiresAt).toLocaleDateString()}`
                            ) : (
                              'Perpetual / Admin'
                            )
                          ) : (
                            'Free (3/day limit)'
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUserForGrant(u)}
                              title="Manual Premium Grant Tool"
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Zap className="w-3 h-3" />
                              Grant Pro
                            </button>

                            <button
                              onClick={() => setResetPassUserId(u.id)}
                              title="Reset Password Directly"
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Grant Premium Modal Dialog */}
            {selectedUserForGrant && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Manual Premium Grant Tool
                    </h4>
                    <button
                      onClick={() => setSelectedUserForGrant(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div>Granting to: <strong className="text-amber-300">{selectedUserForGrant.name}</strong></div>
                    <div className="text-slate-400 font-mono text-[11px]">{selectedUserForGrant.email}</div>
                  </div>

                  {/* Selectable Duration Pickers: Days, Months, Years */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">Select Tenure Duration</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={grantAmount}
                          onChange={(e) => setGrantAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <select
                          value={grantUnit}
                          onChange={(e) => setGrantUnit(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSelectedUserForGrant(null)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGrantPremium}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider"
                    >
                      Confirm Grant
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Password Reset Dialog */}
            {resetPassUserId && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-3">
                  <h4 className="font-bold text-white text-sm">Direct User Password Reset</h4>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassForUser}
                    onChange={(e) => setNewPassForUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setResetPassUserId(null); setNewPassForUser(''); }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleResetUserPassword(resetPassUserId)}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER ACTIVITY LOGS (SEARCHES & SOLUTIONS) */}
        {activeTab === 'activity' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Client Activity & AI Solution Logs</h4>
                <p className="text-xs text-slate-400">Detailed record of input audio/transcripts and generated industry documentation</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Total Events: {activityLogs.length}
              </span>
            </div>

            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                  No activity logs recorded yet. Once users transform notes, logs appear here.
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.userName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({log.userEmail})</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-amber-300 uppercase font-mono">
                          {log.industry}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {log.solutionTitle}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-300 font-mono leading-relaxed line-clamp-3">
                      {log.rawInput}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FINANCIAL ANALYTICS & REPORTS */}
        {activeTab === 'financials' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Filters: Per Month, Custom Date Range, Full Year */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Timeframe:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setFinancialsTimeframe('monthly')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      financialsTimeframe === 'monthly'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Per Month
                  </button>
                  <button
                    onClick={() => setFinancialsTimeframe('yearly')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      financialsTimeframe === 'yearly'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Full Year
                  </button>
                  <button
                    onClick={() => setFinancialsTimeframe('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      financialsTimeframe === 'custom'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom Date Range
                  </button>
                </div>
              </div>

              {financialsTimeframe === 'custom' && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-white text-xs"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-white text-xs"
                  />
                  <button
                    onClick={loadInitialData}
                    className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Filter
                  </button>
                </div>
              )}
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Gross INR Revenue</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  ₹{financialData?.totalINR?.toLocaleString() || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Settled directly to: <span className="text-amber-300 font-mono">wagh.jayesh@oksbi</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Gross USD Revenue</span>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  ${financialData?.totalUSD?.toFixed(2) || '0.00'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Multi-currency checkout enabled
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Completed Transactions</span>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {financialData?.totalTransactions || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  PCI-DSS Tokenized / 3D Secure
                </div>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            {financialData?.monthlyBreakdown && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-300">Monthly Volume Breakdown</h5>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                      <tr>
                        <th className="p-3">Month (YYYY-MM)</th>
                        <th className="p-3">Total Volume (INR)</th>
                        <th className="p-3 text-right">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Object.entries(financialData.monthlyBreakdown).map(([month, data]: any) => (
                        <tr key={month} className="hover:bg-slate-900/40">
                          <td className="p-3 font-mono font-bold text-white">{month}</td>
                          <td className="p-3 font-mono text-emerald-400 font-semibold">₹{data.totalINR.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-slate-300">{data.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: APP INTERFACE WORDING DYNAMIC EDITOR */}
        {activeTab === 'wording' && (
          <form onSubmit={handleSaveSettings} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white">Dynamic App Interface Text & Announcements</h4>
              <p className="text-xs text-slate-400">Update banners, taglines, and compliance text across the live mobile/web view without redeploying</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Top Announcement Banner</label>
                <input
                  type="text"
                  value={settings.announcementBanner}
                  onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">App Tagline / Subtitle</label>
                <input
                  type="text"
                  value={settings.appTagline}
                  onChange={(e) => setSettings({ ...settings, appTagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  value={settings.heroHeadline}
                  onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hero Subheading & Description</label>
                <textarea
                  rows={2}
                  value={settings.heroSubhead}
                  onChange={(e) => setSettings({ ...settings, heroSubhead: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Custom Compliance & Legal Notice Wording</label>
                <textarea
                  rows={2}
                  value={settings.customComplianceNote}
                  onChange={(e) => setSettings({ ...settings, customComplianceNote: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Save Dynamic Changes
            </button>
          </form>
        )}

        {/* TAB 5: ADMIN SECURITY & PASSWORD UPDATE */}
        {activeTab === 'security' && (
          <form onSubmit={handleUpdateAdminPassword} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-lg">
            <div>
              <h4 className="text-sm font-bold text-white">Super Admin Security Settings</h4>
              <p className="text-xs text-slate-400">Update the primary administrative credential for <strong>jayeshofficial@gmail.com</strong></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Current Password (Default: Jayesh@123)</label>
                <input
                  type="password"
                  required
                  value={currentAdminPass}
                  onChange={(e) => setCurrentAdminPass(e.target.value)}
                  placeholder="Enter current admin password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Enter new admin password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Update Admin Password
            </button>
          </form>
        )}

        {/* TAB 6: SYSTEM EMAILS LOG */}
        {activeTab === 'emails' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">System Email Dispatch Stream</h4>
                <p className="text-xs text-slate-400">All Welcome Emails with activation links, OTPs, and subscription notices</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Total Sent: {systemEmails.length}</span>
            </div>

            <div className="space-y-3">
              {systemEmails.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                  No system emails sent yet.
                </div>
              ) : (
                systemEmails.map((em) => (
                  <div key={em.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        {em.subject}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(em.sentAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      To: <strong className="text-slate-200">{em.toName} &lt;{em.toEmail}&gt;</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 whitespace-pre-line font-mono">
                      {em.bodyText}
                    </div>

                    {em.actionLabel && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] text-emerald-400 font-semibold">Action Trigger:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-mono border border-emerald-500/30">
                          {em.actionLabel} ({em.actionUrl})
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
