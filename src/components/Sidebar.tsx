import React from 'react';
import {
  Menu,
  Plus,
  Settings,
  Gem,
  MessageSquare,
  Trash2,
  Globe,
  ShieldAlert,
  Users,
  Handshake,
  Layers,
  IndianRupee,
  BookOpen,
} from 'lucide-react';
import UserNavMenu from './UserNavMenu';
import { isRevenueAdmin } from '../lib/firebase';

export type AppActiveView =
  | 'marketing'
  | 'blog'
  | 'chat'
  | 'admin'
  | 'team'
  | 'partners'
  | 'pricing'
  | 'documents'
  | 'gallery'
  | 'revenue';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  recentChats?: Array<{ id: string; title: string; timestamp: number }>;
  currentChatId?: string;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (id: string, e: React.MouseEvent) => void;
  onOpenUpgrade?: () => void;
  onOpenSettings?: () => void;
  activeView?: AppActiveView;
  onToggleView?: (view: AppActiveView) => void;
  geminiEnabled?: boolean;
  isAdmin?: boolean;
  onOpenTemplates?: () => void;
  currentUser?: { email?: string | null; name?: string } | null;
  onLogout?: () => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  recentChats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenUpgrade,
  onOpenSettings,
  activeView = 'marketing',
  onToggleView,
  geminiEnabled = true,
  isAdmin = false,
  onOpenTemplates,
  currentUser,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={`h-screen bg-[#1e1f20] text-[#e3e3e3] flex flex-col transition-all duration-300 z-30 select-none border-r border-[#3c4043]/40 ${
        collapsed ? 'w-16 p-2' : 'w-72 p-3'
      }`}
    >
      {/* Top action row */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-[#2d2e30] rounded-full transition-colors cursor-pointer text-[#c4c7c5] hover:text-white"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={20} />
        </button>

        {!collapsed && geminiEnabled && onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-2 bg-[#2d2e30] hover:bg-[#35363a] text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors cursor-pointer text-white shadow-sm"
          >
            <Plus size={16} />
            <span>New note</span>
          </button>
        )}
      </div>

      {/* Main View Switcher Tabs */}
      {onToggleView && !collapsed && (
        <div className="mb-3 p-1 bg-[#131314] rounded-xl flex gap-1 border border-[#3c4043]/40 text-xs">
          <button
            type="button"
            onClick={() => onToggleView('marketing')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors text-[11px] cursor-pointer ${
              activeView === 'marketing'
                ? 'bg-[#2d2e30] text-white shadow-sm'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
            title="Marketing Site"
          >
            <Globe size={13} className="text-[#4e8cff]" />
            <span>Home</span>
          </button>

          {geminiEnabled && (
            <button
              type="button"
              onClick={() => onToggleView('chat')}
              className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors text-[11px] cursor-pointer ${
                activeView === 'chat'
                  ? 'bg-[#2d2e30] text-white shadow-sm'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
              title="Clinical & Enterprise Notes"
            >
              <MessageSquare size={13} />
              <span>Notes</span>
            </button>
          )}
        </div>
      )}

      {/* Sub-navigation buttons */}
      {!collapsed && onToggleView && (
        <div className="space-y-1 mb-3 pb-2 border-b border-[#3c4043]/30">
          {onOpenTemplates && (
            <button
              type="button"
              onClick={onOpenTemplates}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[#c4c7c5] hover:text-white hover:bg-[#2d2e30] transition cursor-pointer"
            >
              <Layers size={14} className="text-amber-400" />
              <span>Custom Templates</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleView('documents')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
              activeView === 'documents'
                ? 'bg-[#2d2e30] text-white font-medium'
                : 'text-[#c4c7c5] hover:text-white hover:bg-[#2d2e30]'
            }`}
          >
            <MessageSquare size={14} className="text-[#4e8cff]" />
            <span>My Documents</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleView('gallery')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
              activeView === 'gallery'
                ? 'bg-[#2d2e30] text-white font-medium'
                : 'text-[#c4c7c5] hover:text-white hover:bg-[#2d2e30]'
            }`}
          >
            <Layers size={14} className="text-amber-400" />
            <span>Template Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleView('team')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
              activeView === 'team'
                ? 'bg-[#2d2e30] text-white font-medium'
                : 'text-[#c4c7c5] hover:text-white hover:bg-[#2d2e30]'
            }`}
          >
            <Users size={14} className="text-blue-400" />
            <span>Clinic / Team</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleView('partners')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
              activeView === 'partners'
                ? 'bg-[#2d2e30] text-white font-medium'
                : 'text-[#c4c7c5] hover:text-white hover:bg-[#2d2e30]'
            }`}
          >
            <Handshake size={14} className="text-emerald-400" />
            <span>Partners & Resellers</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleView('blog')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
              activeView === 'blog'
                ? 'bg-[#2d2e30] text-white font-medium'
                : 'text-[#c4c7c5] hover:text-white hover:bg-[#2d2e30]'
            }`}
          >
            <BookOpen size={14} className="text-indigo-400" />
            <span>Documentation Blog</span>
          </button>

          {/* Admin Switch button: ONLY visible to verified admins */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onToggleView('admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer border ${
                activeView === 'admin'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 font-semibold'
                  : 'text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              <ShieldAlert size={14} className="text-red-400" />
              <span>Admin Feature Portal</span>
            </button>
          )}

          {/* Revenue Dashboard: ONLY for subscription-revenue admins */}
          {isRevenueAdmin(currentUser?.email) && (
            <button
              type="button"
              onClick={() => onToggleView('revenue')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer border ${
                activeView === 'revenue'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10'
              }`}
            >
              <IndianRupee size={14} className="text-emerald-400" />
              <span>Revenue Dashboard</span>
            </button>
          )}
        </div>
      )}

      {/* Recent AI Notes Section — omitted completely when Gemini AI is disabled for this user */}
      {!collapsed && geminiEnabled && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 scrollbar-thin">
          <div className="px-2 py-1 text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider flex items-center justify-between">
            <span>Recent Encounters & Docs</span>
            <span className="text-[10px] text-slate-500 font-mono">{recentChats.length}</span>
          </div>

          {recentChats.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[#70757a] text-center italic">
              No recent documents. Paste a transcript or dictation to create a note.
            </div>
          ) : (
            recentChats.map((chat) => {
              const isSelected = chat.id === currentChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat?.(chat.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2d2e30] text-white font-medium shadow-sm'
                      : 'text-[#c4c7c5] hover:bg-[#28292a] hover:text-white'
                  }`}
                >
                  <span className="truncate pr-4 flex-1">{chat.title || 'Untitled Note'}</span>
                  {onDeleteChat && (
                    <button
                      type="button"
                      onClick={(e) => onDeleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 rounded transition-opacity"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer: Upgrade & Settings */}
      <div className="mt-auto space-y-2 pt-2 border-t border-[#3c4043]/30">
        <button
          type="button"
          onClick={onOpenUpgrade}
          className={`w-full bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] hover:from-[#3b7cee] hover:to-[#7c4ae6] rounded-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 text-white shadow-lg shadow-[#4e8cff]/10 transition-all cursor-pointer ${
            collapsed ? 'px-0' : 'px-4'
          }`}
          title="Upgrade Plan"
        >
          <Gem size={15} className="shrink-0" />
          {!collapsed && <span>Upgrade Plan</span>}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'gap-3 p-2.5'
          } hover:bg-[#2d2e30] rounded-xl text-xs text-[#c4c7c5] hover:text-white transition-colors cursor-pointer`}
          title="Settings & profile"
        >
          <Settings size={18} className="shrink-0 text-[#9aa0a6]" />
          {!collapsed && <span>Settings & Profile</span>}
        </button>

        {!collapsed && currentUser && (
          <UserNavMenu
            userEmail={currentUser.email}
            onLogout={onLogout}
            className="mt-2"
          />
        )}
      </div>
    </aside>
  );
}
