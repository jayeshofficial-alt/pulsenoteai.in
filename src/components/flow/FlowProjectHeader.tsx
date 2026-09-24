import React, { useState } from 'react';
import { 
  Folder, 
  Plus, 
  ChevronDown, 
  Users, 
  Share2, 
  Crown, 
  Layers, 
  ShieldCheck, 
  Download, 
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  User,
  LogOut,
  Sliders,
  CreditCard,
  Shield
} from 'lucide-react';
import { FlowProject, FlowCollaborator, UserProfile } from '../../types';

interface FlowProjectHeaderProps {
  currentProject: FlowProject;
  projects: FlowProject[];
  collaborators: FlowCollaborator[];
  currentUser: UserProfile | null;
  isPro: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string) => void;
  onOpenUpgradeModal: () => void;
  onOpenAuthModal: (tab?: 'login' | 'register') => void;
  onOpenAdminDashboard: () => void;
  onOpenBillingModal: () => void;
  onLogout: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const FlowProjectHeader: React.FC<FlowProjectHeaderProps> = ({
  currentProject,
  projects,
  collaborators,
  currentUser,
  isPro,
  onSelectProject,
  onCreateProject,
  onOpenUpgradeModal,
  onOpenAuthModal,
  onOpenAdminDashboard,
  onOpenBillingModal,
  onLogout,
  onShowToast,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const effectiveIsPro = isPro || isAdmin;

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    onShowToast?.('success', 'Project collaboration link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim());
    setNewProjectName('');
    setShowCreateInput(false);
    setShowDropdown(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 flex items-center justify-between pointer-events-auto">
      {/* Brand & Project Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent hidden sm:inline">
            Pulse Note AI • Flow
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Project Selector Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate">{currentProject.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                Your Flow Projects
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj.id);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      proj.id === currentProject.id
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{proj.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{proj.nodes?.length || 0} nodes</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800 my-1 pt-1">
                {showCreateInput ? (
                  <form onSubmit={handleCreate} className="p-1 space-y-1.5">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name..."
                      className="w-full bg-slate-950 px-2 py-1 rounded-lg text-xs text-white border border-slate-700 focus:outline-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setShowCreateInput(false)}
                        className="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-semibold"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowCreateInput(true)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-indigo-300 hover:bg-indigo-950/40 cursor-pointer font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Flow Canvas Project</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collaborators Live Stack & Action Tools */}
      <div className="flex items-center gap-2">
        {/* Collaborators Avatar Stack */}
        <div className="flex items-center -space-x-2 mr-2">
          {collaborators.slice(0, 4).map((collab, idx) => (
            <div
              key={`header-collab-${collab.id || 'anon'}-${idx}`}
              title={`${collab.name} (${collab.email})`}
              className="relative w-7 h-7 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white shadow"
              style={{ backgroundColor: collab.color || '#6366f1' }}
            >
              {collab.name?.charAt(0) || 'C'}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-950" />
            </div>
          ))}
          {collaborators.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] text-slate-300 font-mono">
              +{collaborators.length - 4}
            </div>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Share Flow'}</span>
        </button>

        {/* Upgrade / Pro Button (Hidden for Admin & Pro) */}
        {!effectiveIsPro ? (
          <button
            onClick={onOpenUpgradeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>Upgrade Pro (₹499)</span>
          </button>
        ) : isAdmin ? (
          <button
            onClick={onOpenAdminDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-lg shadow-purple-500/25 cursor-pointer border border-purple-400/30"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>ADMIN ACTIVE</span>
          </button>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
            PRO UNLIMITED
          </span>
        )}

        {/* User Account / Profile Dropdown */}
        <div className="relative ml-1">
          {currentUser ? (
            <div>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition-colors cursor-pointer"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                    isAdmin ? 'bg-gradient-to-tr from-purple-600 to-pink-500 ring-2 ring-purple-400/50' : 'bg-indigo-600 ring-1 ring-indigo-400/40'
                  }`}>
                    {currentUser.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="text-left hidden md:block pr-1">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <span className="max-w-[100px] truncate">{currentUser.name}</span>
                    {isAdmin && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                    {currentUser.email}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in">
                  <div className="p-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                        isAdmin ? 'bg-gradient-to-tr from-purple-600 to-pink-500' : 'bg-indigo-600'
                      }`}>
                        {currentUser.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {isAdmin ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          👑 Super Admin (Full Access)
                        </span>
                      ) : effectiveIsPro ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ⚡ Pro Unlimited Member
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Free Account (3 prompts/day)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1 space-y-1">
                    {/* Admin Dashboard Entry */}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAdminDashboard();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-purple-300 hover:bg-purple-950/40 font-semibold cursor-pointer transition-colors"
                      >
                        <Sliders className="w-4 h-4 text-purple-400" />
                        <span>Admin Dashboard & Controls</span>
                      </button>
                    )}

                    {/* Client Billing / Profile */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenBillingModal();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      <span>Account & Subscription</span>
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    {/* Log Out */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 text-red-400 hover:bg-red-500/10 cursor-pointer font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
