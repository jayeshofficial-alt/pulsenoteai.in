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
  FileText,
  Trash2,
  Shield,
  SlidersHorizontal
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
  const [userFilterTier, setUserFilterTier] = useState<'all' | 'free' | 'pro' | 'admin'>('all');
  const [selectedUserForGrant, setSelectedUserForGrant] = useState<UserProfile | null>(null);
  const [grantAmount, setGrantAmount] = useState<number>(1);
  const [grantUnit, setGrantUnit] = useState<'days' | 'months' | 'years'>('months');
  const [resetPassUserId, setResetPassUserId] = useState<string | null>(null);
  const [newPassForUser, setNewPassForUser] = useState('');

  // User Deletion State
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Subscription Override State
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState<UserProfile | null>(null);
  const [subOverrideTier, setSubOverrideTier] = useState<'free' | 'pro_monthly' | 'pro_annual' | 'admin_grant'>('pro_monthly');
  const [subOverrideLifetime, setSubOverrideLifetime] = useState(false);
  const [subOverrideExpiryDate, setSubOverrideExpiryDate] = useState('');
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);

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

  // Delete User Handler
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      setMsg({ type: 'success', text: `User ${userToDelete.name} (${userToDelete.email}) permanently deleted.` });
      setUserToDelete(null);
      loadInitialData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Open Subscription Override Modal
  const openSubscriptionOverride = (u: UserProfile) => {
    setSelectedUserForSubscription(u);
    setSubOverrideTier(u.subscription?.tier as any || 'pro_monthly');
    setSubOverrideLifetime(u.subscription?.isPro && !u.subscription?.expiresAt);
    if (u.subscription?.expiresAt) {
      setSubOverrideExpiryDate(new Date(u.subscription.expiresAt).toISOString().slice(0, 10));
    } else {
      const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      setSubOverrideExpiryDate(thirtyDays);
    }
  };

  // Update User Subscription Handler
  const handleUpdateSubscription = async () => {
    if (!selectedUserForSubscription) return;
    setIsUpdatingSubscription(true);
    try {
      const isPro = subOverrideLifetime ? true : subOverrideTier !== 'free';
      let expiresAt: number | null = null;
      if (!subOverrideLifetime && isPro && subOverrideExpiryDate) {
        expiresAt = new Date(subOverrideExpiryDate).getTime() + 86399000;
      }

      const res = await fetch(`/api/admin/users/${selectedUserForSubscription.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: subOverrideLifetime ? 'admin_grant' : subOverrideTier,
          isPro,
          expiresAt,
          lifetime: subOverrideLifetime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription');

      setMsg({ type: 'success', text: `Subscription updated for ${selectedUserForSubscription.name}!` });
      setSelectedUserForSubscription(null);
      loadInitialData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setIsUpdatingSubscription(false);
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.mobile.includes(userSearch);
    if (!matchesSearch) return false;

    if (userFilterTier === 'free') return !u.subscription?.isPro && u.role !== 'admin';
    if (userFilterTier === 'pro') return u.subscription?.isPro && u.role !== 'admin';
    if (userFilterTier === 'admin') return u.role === 'admin';
    return true;
  });

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

        {/* TAB 1: USERS DIRECTORY & FULL ADMIN CONTROLS */}
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

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  onClick={() => setUserFilterTier('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    userFilterTier === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  onClick={() => setUserFilterTier('free')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    userFilterTier === 'free' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Free ({users.filter((u) => !u.subscription?.isPro && u.role !== 'admin').length})
                </button>
                <button
                  onClick={() => setUserFilterTier('pro')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    userFilterTier === 'pro' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pro ({users.filter((u) => u.subscription?.isPro && u.role !== 'admin').length})
                </button>
                <button
                  onClick={() => setUserFilterTier('admin')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    userFilterTier === 'admin' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admins ({users.filter((u) => u.role === 'admin').length})
                </button>
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
                    <th className="p-3">Active Tenure / Expiry</th>
                    <th className="p-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredUsers.map((u, idx) => {
                    const isPro = u.subscription?.isPro;
                    const expiresAt = u.subscription?.expiresAt;
                    const isSuperAdmin = u.role === 'admin' || u.email === 'jayeshofficial@gmail.com' || u.email === 'contact@pulsenoteai.in';
                    return (
                      <tr key={`admin-user-${u.id || 'usr'}-${idx}`} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {isSuperAdmin && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-0.5 border border-amber-500/30">
                                <Shield className="w-3 h-3" />
                                SUPER ADMIN
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
                            {u.subscription?.tier || (isPro ? 'Pro' : 'Free')}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-[11px] text-slate-300">
                          {isPro ? (
                            expiresAt ? (
                              `Until ${new Date(expiresAt).toLocaleDateString()}`
                            ) : (
                              <span className="text-emerald-400 font-semibold">Lifetime Unlimited</span>
                            )
                          ) : (
                            'Free (3 prompts/day)'
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Subscription Override Button */}
                            <button
                              onClick={() => openSubscriptionOverride(u)}
                              title="Override Subscription Tier & Expiration"
                              className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>Override Sub</span>
                            </button>

                            {/* Quick Grant Pro Button */}
                            <button
                              onClick={() => setSelectedUserForGrant(u)}
                              title="Quick Pro Grant Tool"
                              className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Grant</span>
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => setResetPassUserId(u.id)}
                              title="Reset Password Directly"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Permanent User Deletion Button */}
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={isSuperAdmin}
                              title={isSuperAdmin ? 'Cannot delete Super Admin account' : 'Permanently Delete User Account'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSuperAdmin 
                                  ? 'bg-slate-900 text-slate-700 cursor-not-allowed' 
                                  : 'bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/20'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Permanent User Deletion Confirmation Modal */}
            {userToDelete && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-md bg-slate-900 border border-red-500/60 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-red-400 flex items-center gap-2 text-sm">
                      <Trash2 className="w-4 h-4 text-red-400" />
                      Permanent User Deletion
                    </h4>
                    <button
                      onClick={() => setUserToDelete(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/30 text-xs space-y-1">
                    <div className="text-red-200 font-semibold">
                      Are you sure you want to permanently delete this user account?
                    </div>
                    <div className="text-slate-300 pt-1">User: <strong className="text-white">{userToDelete.name}</strong></div>
                    <div className="text-slate-400 font-mono text-[11px]">Email: {userToDelete.email}</div>
                    <p className="text-[11px] text-red-400/90 pt-1">
                      ⚠️ This will permanently erase their credentials, profile, activity records, and session data. This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setUserToDelete(null)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      disabled={isDeletingUser}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/40"
                    >
                      {isDeletingUser ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Override Modal Dialog */}
            {selectedUserForSubscription && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                      Subscription Override Controls
                    </h4>
                    <button
                      onClick={() => setSelectedUserForSubscription(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div>Managing User: <strong className="text-indigo-300">{selectedUserForSubscription.name}</strong></div>
                    <div className="text-slate-400 font-mono text-[11px]">{selectedUserForSubscription.email}</div>
                  </div>

                  {/* Tier Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Subscription Tier</label>
                    <select
                      value={subOverrideTier}
                      onChange={(e) => setSubOverrideTier(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="free">Free Tier (3 Prompts / Day Limit)</option>
                      <option value="pro_monthly">Pro Monthly (₹299/mo Unlimited)</option>
                      <option value="pro_annual">Pro Annual (₹1,999/yr Unlimited)</option>
                      <option value="admin_grant">Admin Granted Pro (Manual Access)</option>
                    </select>
                  </div>

                  {/* Lifetime Unlimited Access Toggle */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">Grant Lifetime Unlimited Access</span>
                      <span className="text-[10px] text-slate-400">Never expires, unlimited daily generations</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={subOverrideLifetime}
                      onChange={(e) => setSubOverrideLifetime(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Custom Renewal / Expiration Date */}
                  {!subOverrideLifetime && subOverrideTier !== 'free' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Active Tenure Expiration Date</label>
                      <input
                        type="date"
                        value={subOverrideExpiryDate}
                        onChange={(e) => setSubOverrideExpiryDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSelectedUserForSubscription(null)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateSubscription}
                      disabled={isUpdatingSubscription}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-900/40"
                    >
                      {isUpdatingSubscription ? 'Saving...' : 'Save Override'}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                activityLogs.map((log, lIdx) => (
                  <div key={`admin-log-${log.id || 'log'}-${lIdx}`} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
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
                systemEmails.map((em, eIdx) => (
                  <div key={`admin-email-${em.id || 'em'}-${eIdx}`} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
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
