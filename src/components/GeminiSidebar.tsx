import React, { useState } from 'react';
import { ChatThread, UserUsageState, UserProfile } from '../types';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Search, 
  Zap, 
  ShieldCheck, 
  Lock, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Mail,
  Receipt,
  LogOut,
  FolderOpen
} from 'lucide-react';

interface GeminiSidebarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onRenameThread: (threadId: string, newTitle: string) => void;
  onDeleteThread: (threadId: string) => void;
  usageState: UserUsageState;
  onOpenPricing: () => void;
  onOpenAdmin?: () => void;
  onOpenBilling?: () => void;
  onOpenMailbox?: () => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({
  isOpen,
  onToggleOpen,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onRenameThread,
  onDeleteThread,
  usageState,
  onOpenPricing,
  onOpenAdmin,
  onOpenBilling,
  onOpenMailbox,
  currentUser,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const isAdmin = currentUser?.role === 'admin' 
    || currentUser?.email === 'jayeshofficial@gmail.com' 
    || currentUser?.email === 'contact@pulsenoteai.in';

  const handleStartRename = (thread: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
  };

  const handleSaveRename = (threadId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameThread(threadId, editingTitle.trim());
    }
    setEditingThreadId(null);
  };

  const filteredThreads = threads.filter((t) => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group threads by time
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const todayThreads: ChatThread[] = [];
  const yesterdayThreads: ChatThread[] = [];
  const previousWeekThreads: ChatThread[] = [];
  const olderThreads: ChatThread[] = [];

  filteredThreads.forEach((t) => {
    const diff = now - t.updatedAt;
    if (diff < ONE_DAY) {
      todayThreads.push(t);
    } else if (diff < 2 * ONE_DAY) {
      yesterdayThreads.push(t);
    } else if (diff < 7 * ONE_DAY) {
      previousWeekThreads.push(t);
    } else {
      olderThreads.push(t);
    }
  });

  const renderThreadList = (items: ChatThread[], label: string) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1 my-3">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1 font-mono">
          {label}
        </div>
        {items.map((thread) => {
          const isActive = thread.id === activeThreadId;
          const isEditing = thread.id === editingThreadId;

          return (
            <div
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/80 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-400'}`} />

                {isEditing ? (
                  <form onSubmit={(e) => handleSaveRename(thread.id, e)} className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      autoFocus
                      className="w-full bg-slate-950 border border-teal-500 rounded px-2 py-0.5 text-xs text-white outline-none"
                    />
                    <button type="submit" className="text-teal-400 hover:text-teal-300 p-0.5">
                      <Check className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => setEditingThreadId(null)} className="text-slate-400 hover:text-white p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <span className="truncate">{thread.title}</span>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleStartRename(thread, e)}
                    title="Rename chat"
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    title="Delete chat"
                    className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0b0f19] border-r border-slate-800/80 transition-all duration-300 w-72 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden'
        }`}
      >
        {/* Top Header: New Chat & Toggle */}
        <div className="p-3.5 border-b border-slate-800/60 flex items-center justify-between gap-2">
          {/* Gemini New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-white font-medium text-xs shadow-sm transition-all cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>New chat</span>
          </button>

          {/* Close Sidebar (Mobile or desktop) */}
          <button
            onClick={onToggleOpen}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search Threads Bar */}
        <div className="px-3.5 pt-3 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Thread History Groups */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs px-4">
              <FolderOpen className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p>No recent chats found.</p>
              <p className="text-[10px] text-slate-600 mt-1">Start a new query to create a thread.</p>
            </div>
          ) : (
            <>
              {renderThreadList(todayThreads, 'Today')}
              {renderThreadList(yesterdayThreads, 'Yesterday')}
              {renderThreadList(previousWeekThreads, 'Previous 7 Days')}
              {renderThreadList(olderThreads, 'Older')}
            </>
          )}
        </div>

        {/* Bottom Panel: Freemium Limit & Account */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          {/* Daily Freemium Prompt Usage Card */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {usageState.isPro ? 'Pro Unlimited' : 'Daily Free Usage'}
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-400">
                {usageState.isPro ? '∞' : `${usageState.dailyPromptCount}/3`}
              </span>
            </div>

            {/* Progress Bar for Free Tier */}
            {!usageState.isPro && (
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    usageState.dailyPromptCount >= 3 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (usageState.dailyPromptCount / 3) * 100)}%` }}
                />
              </div>
            )}

            {!usageState.isPro ? (
              <button
                onClick={onOpenPricing}
                className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:brightness-110 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>Upgrade to Pro (₹299/mo)</span>
              </button>
            ) : (
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Active: {usageState.activePlan}</span>
              </div>
            )}
          </div>

          {/* User Account / Navigation Links */}
          <div className="space-y-1 text-xs">
            {isAdmin && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Super Admin Panel</span>
              </button>
            )}

            {currentUser && onOpenBilling && (
              <button
                onClick={onOpenBilling}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-teal-400" />
                <span className="truncate">{currentUser.name || currentUser.email}</span>
              </button>
            )}

            {onOpenMailbox && (
              <button
                onClick={onOpenMailbox}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>System Notification Mailbox</span>
              </button>
            )}

            {currentUser && onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
