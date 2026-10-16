import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Copy,
  Check,
  CreditCard,
  Layers,
  Plus,
  Shield,
  ArrowLeft,
  Mail,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TeamDoc, TeamMemberRole, CustomTemplateDoc } from '../types';
import {
  subscribeToTeam,
  createTeamAccount,
  createTeamTrial,
  inviteTeamMember,
  removeTeamMember,
  setMemberRole,
  getMemberRole,
  isTeamTrialActive,
  TEAM_TRIAL_DAYS,
  db,
} from '../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

interface TeamDashboardProps {
  currentUser: { uid: string; email?: string | null; displayName?: string } | null;
  teamId?: string;
  onBack: () => void;
  onOpenPricing: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function TeamDashboard({
  currentUser,
  teamId,
  onBack,
  onOpenPricing,
  onShowToast,
}: TeamDashboardProps) {
  const [team, setTeam] = useState<TeamDoc | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [teamTemplates, setTeamTemplates] = useState<CustomTemplateDoc[]>([]);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [newTeamName, setNewTeamName] = useState('Medical Group Alpha');
  const [newTeamSeats, setNewTeamSeats] = useState(5);

  useEffect(() => {
    if (!teamId) return;
    const unsub = subscribeToTeam(teamId, (t) => {
      setTeam(t);
    });
    return () => unsub();
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    // Load shared templates in teams/{teamId}/templates
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'teams', teamId, 'templates'));
        const list: CustomTemplateDoc[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CustomTemplateDoc));
        setTeamTemplates(list);
      } catch (e) {
        console.warn('Failed to load team templates', e);
      }
    })();
  }, [teamId]);

  const isOwner = currentUser?.uid && team?.ownerUid === currentUser.uid;
  const myRole = getMemberRole(team, currentUser?.email);
  const isViewer = myRole === 'viewer';
  const trialActive = isTeamTrialActive(team);
  const trialDaysLeft = team?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(team.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  const handleStartTrial = async () => {
    if (!currentUser) return;
    setIsStartingTrial(true);
    try {
      await createTeamTrial(
        newTeamName || 'My Clinic Trial',
        currentUser.uid,
        currentUser.email || 'owner@pulsenoteai.in'
      );
      onShowToast?.('success', `14-day free trial started — 3 seats, full features, no card required!`);
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to start trial');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleRoleChange = async (email: string, role: TeamMemberRole) => {
    if (!teamId) return;
    try {
      await setMemberRole(teamId, email, role);
      onShowToast?.('success', `${email} is now ${role}.`);
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to update role');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsCreatingTeam(true);
    try {
      const id = await createTeamAccount(
        newTeamName,
        newTeamSeats,
        currentUser.uid,
        currentUser.email || 'owner@pulsenoteai.in'
      );
      onShowToast?.('success', `Team created! Team ID: ${id}`);
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !newMemberEmail.trim()) return;
    setIsInviting(true);
    try {
      await inviteTeamMember(teamId, newMemberEmail.trim());
      onShowToast?.('success', `Invited ${newMemberEmail.trim()} to the team workspace!`);
      setNewMemberEmail('');
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!teamId) return;
    try {
      await removeTeamMember(teamId, email);
      onShowToast?.('info', `Removed ${email} from team`);
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to remove member');
    }
  };

  const inviteLink = teamId
    ? `https://pulsenoteai.in?teamId=${teamId}`
    : 'https://pulsenoteai.in';

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    onShowToast?.('info', 'Team invite link copied to clipboard');
  };

  if (!teamId && !team) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold text-white">Create Clinic / Team Workspace</h1>
          </div>

          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-6 space-y-4">
            <p className="text-xs text-[#9aa0a6] leading-relaxed">
              Team accounts allow clinics, medical groups, and inspection practices to collaborate with shared templates, pooled credits, and member oversight.
            </p>

            <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                  Team / Practice Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-4 py-2.5 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                  Seats (Minimum 3 seats @ ₹399/seat/mo)
                </label>
                <input
                  type="number"
                  min={3}
                  max={100}
                  value={newTeamSeats}
                  onChange={(e) => setNewTeamSeats(Number(e.target.value))}
                  className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-4 py-2.5 text-sm text-white"
                />
                <span className="text-[11px] text-[#9aa0a6] mt-1 block">
                  Total: ₹{newTeamSeats * 399}/month billed via Razorpay
                </span>
              </div>

              <button
                type="submit"
                disabled={isCreatingTeam}
                className="w-full py-2.5 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] text-white text-sm font-medium transition cursor-pointer"
              >
                {isCreatingTeam ? 'Setting up Team...' : 'Create Team Workspace'}
              </button>
            </form>
          </div>

          {/* 14-day free trial — no card */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-[#1e1f20] border border-emerald-500/30 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Try free for {TEAM_TRIAL_DAYS} days</h3>
            </div>
            <p className="text-xs text-[#c4c7c5] leading-relaxed">
              Full Clinic/Team features for 3 seats — shared templates, member invites, exports.
              No card required. Upgrade to a paid plan before the trial ends to keep access.
            </p>
            <button
              type="button"
              onClick={handleStartTrial}
              disabled={isStartingTrial || !currentUser}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-sm font-bold transition cursor-pointer"
            >
              {isStartingTrial ? 'Starting trial…' : `Start ${TEAM_TRIAL_DAYS}-Day Free Trial`}
            </button>
            {!currentUser && (
              <p className="text-[11px] text-amber-300">Please sign in to start a trial workspace.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const membersCount = team?.members?.length || 1;
  const seatsTotal = team?.seats || 3;

  return (
    <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2d2e30] pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Users size={20} className="text-[#4e8cff]" />
                <h1 className="text-2xl font-bold text-white">{team?.name || 'Clinic Team'}</h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {membersCount} of {seatsTotal} seats used
                </span>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Centralized administration for practice members, shared clinical templates, and billing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-xs text-[#e3e3e3] transition cursor-pointer border border-[#3c4043]"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Invite Copied' : 'Copy Invite Link'}</span>
            </button>

            <button
              onClick={onOpenPricing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] text-xs text-white font-medium transition cursor-pointer"
            >
              <CreditCard size={14} />
              <span>Manage Billing</span>
            </button>
          </div>
        </div>

        {/* Trial status banner */}
        {team?.isTrial && (
          <div className={`rounded-2xl border p-4 flex items-center gap-3 ${trialActive ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-rose-950/40 border-rose-500/30'}`}>
            <Clock size={18} className={trialActive ? 'text-emerald-400' : 'text-rose-400'} />
            <div className="flex-1">
              <p className={`text-xs font-bold ${trialActive ? 'text-emerald-300' : 'text-rose-300'}`}>
                {trialActive ? `Free trial active — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left` : 'Free trial expired'}
              </p>
              <p className="text-[11px] text-[#9aa0a6]">
                {trialActive
                  ? 'Full features unlocked. Add a payment method before expiry to keep your workspace.'
                  : 'Upgrade to a paid Clinic/Team plan to restore full access for all members.'}
              </p>
            </div>
            <button
              onClick={onOpenPricing}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer shrink-0"
            >
              {trialActive ? 'Upgrade now' : 'Restore access'}
            </button>
          </div>
        )}

        {/* Viewer notice */}
        {isViewer && (
          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/30 p-3 text-[11px] text-sky-200">
            You have <strong>viewer</strong> access: you can read notes and shared templates, but cannot invite members, change roles, or edit shared templates.
          </div>
        )}

        {/* Member Management */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users size={16} className="text-[#4e8cff]" />
              Practice Members ({membersCount}/{seatsTotal})
            </h3>
            <span className="text-xs text-[#9aa0a6]">
              {seatsTotal - membersCount} seats remaining
            </span>
          </div>

          {/* Invite Form */}
          {isOwner && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="colleague@clinic.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 bg-[#131314] border border-[#3c4043] rounded-xl px-4 py-2 text-xs text-white placeholder:text-[#9aa0a6]"
                required
              />
              <button
                type="submit"
                disabled={isInviting || membersCount >= seatsTotal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] disabled:opacity-40 text-xs text-white font-medium transition cursor-pointer"
              >
                <UserPlus size={14} />
                <span>Invite</span>
              </button>
            </form>
          )}

          {/* Members List */}
          <div className="divide-y divide-[#2d2e30]/60 border border-[#2d2e30] rounded-xl overflow-hidden">
            {(team?.members || []).map((email, idx) => {
              const isLead = email === team?.members?.[0];
              const role = getMemberRole(team, email);
              const roleColor =
                role === 'owner'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : role === 'doctor'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    : 'bg-slate-500/20 text-slate-300 border-slate-500/30';
              return (
                <div key={idx} className="p-3 bg-[#131314]/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#2d2e30] flex items-center justify-center text-slate-300 font-mono text-[11px]">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-white">{email}</span>
                      <span className="text-[10px] text-[#9aa0a6] block">
                        {isLead ? 'Team Owner & Billing Admin' : 'Practice Member'}
                      </span>
                    </div>
                    {isOwner ? (
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(email, e.target.value as TeamMemberRole)}
                        disabled={isLead}
                        title={isLead ? 'Founding owner role is fixed' : 'Change member role'}
                        className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border outline-none cursor-pointer disabled:opacity-70 ${roleColor}`}
                      >
                        <option value="owner">Owner</option>
                        <option value="doctor">Doctor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${roleColor}`}>
                        {role}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Active this month
                    </span>
                    {isOwner && !isLead && (
                      <button
                        onClick={() => handleRemove(email)}
                        className="p-1 text-[#9aa0a6] hover:text-red-400 transition"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared Team Templates */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers size={16} className="text-amber-400" />
              Shared Clinical & Enterprise Templates ({teamTemplates.length})
            </h3>
            <span className="text-xs text-[#9aa0a6]">
              Readable by all team members
            </span>
          </div>

          {teamTemplates.length === 0 ? (
            <div className="p-6 text-center bg-[#131314] rounded-xl border border-[#2d2e30] text-xs text-[#9aa0a6]">
              No shared templates yet. Use the Template Builder to create shared team templates.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-xs">{tpl.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      {tpl.industry}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9aa0a6]">
                    {tpl.sections?.length || 0} ordered sections configured
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
