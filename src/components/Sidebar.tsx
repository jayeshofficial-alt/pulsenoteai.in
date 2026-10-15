import React from 'react';
import {
  Menu,
  Plus,
  Clock,
  Settings,
  Gem,
  LayoutGrid,
  MessageSquare,
  Trash2,
  Globe,
  ImageIcon,
  Film,
  ShieldAlert,
  Users,
  Handshake,
  Layers,
} from 'lucide-react';

export type AppActiveView =
  | 'marketing'
  | 'chat'
  | 'image'
  | 'video'
  | 'canvas'
  | 'admin'
  | 'team'
  | 'partners'
  | 'pricing'
  | 'documents'
  | 'gallery';

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
  imageGenerationEnabled?: boolean;
  videoGenerationEnabled?: boolean;
  isAdmin?: boolean;
  onOpenTemplates?: () => void;
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
  imageGenerationEnabled = false,
  videoGenerationEnabled = false,
  isAdmin = false,
  onOpenTemplates,
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

        {!collapsed && onNewChat && (
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
        <div className="mb-3 p-1 bg-[#131314] rounded-xl flex flex-wrap gap-1 border border-[#3c4043]/40 text-xs">
          <button
            type="button"
            onClick={() => onToggleView('marketing')}
            className={`flex-1 py-1 px-1 rounded-lg flex items-center justify-center gap-1 font-medium transition-colors text-[10px] ${
              activeView === 'marketing'
                ? 'bg-[#2d2e30] text-white shadow-sm'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
            title="Marketing Site"
          >
            <Globe size={12} className="text-[#4e8cff]" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleView('chat')}
            className={`flex-1 py-1 px-1 rounded-lg flex items-center justify-center gap-1 font-medium transition-colors text-[10px] ${
              activeView === 'chat'
                ? 'bg-[#2d2e30] text-white shadow-sm'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
            title="Chat & Notes"
          >
            <MessageSquare size={12} />
            <span>Notes</span>
          </button>

          {/* Conditional: Only show Image tab when imageGenerationEnabled is true */}
          {imageGenerationEnabled && (
            <button
              type="button"
              onClick={() => onToggleView('image')}
              className={`flex-1 py-1 px-1 rounded-lg flex items-center justify-center gap-1 font-medium transition-colors text-[10px] ${
                activeView === 'image'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-[#9aa0a6] hover:text-amber-300'
              }`}
              title="Imagen 4.0 Studio"
            >
              <ImageIcon size={12} className="text-amber-400" />
              <span>Image</span>
            </button>
          )}

          {/* Conditional: Only show Video tab when videoGenerationEnabled is true */}
          {videoGenerationEnabled && (
            <button
              type="button"
              onClick={() => onToggleView('video')}
              className={`flex-1 py-1 px-1 rounded-lg flex items-center justify-center gap-1 font-medium transition-colors text-[10px] ${
                activeView === 'video'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-[#9aa0a6] hover:text-purple-300'
              }`}
              title="Veo 3.0 Video Studio"
            >
              <Film size={12} className="text-purple-400" />
              <span>Video</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleView('canvas')}
            className={`flex-1 py-1 px-1 rounded-lg flex items-center justify-center gap-1 font-medium transition-colors text-[10px] ${
              activeView === 'canvas'
                ? 'bg-[#2d2e30] text-white shadow-sm'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
            title="Flow Canvas"
          >
            <LayoutGrid size={12} />
            <span>Canvas</span>
          </button>
        </div>
      )}

      {/* Sub-navigation buttons (Templates, Team, Partners, Admin) */}
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
            <span>My Documents (/documents)</span>
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
            <span>Template Gallery (/templates)</span>
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
            <span>Clinic / Team (/team)</span>
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
            <span>Partners & Resellers (/partners)</span>
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
              <span>Admin Feature Portal (/admin)</span>
            </button>
          )}
        </div>
      )}

      {/* Recent Notes Section */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 scrollbar-thin">
          <div className="px-2 py-1 text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider flex items-center justify-between">
            <span>Recent Encounters & Docs</span>
            <span className="text-[10px] text-slate-500 font-mono">{recentChats.length}</span>
          </div>

          {recentChats.length === 0 ? (
            <div className="px-3 py-4 text-xs text-[#70757a] text-center italic">
              No recent documents. Speak or type to create a note.
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

      {/* Footer: Upgrade to Premium & Settings */}
      <div className="mt-auto space-y-2 pt-2 border-t border-[#3c4043]/30">
        <button
          type="button"
          onClick={onOpenUpgrade}
          className={`w-full bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] hover:from-[#3b7cee] hover:to-[#7c4ae6] rounded-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 text-white shadow-lg shadow-[#4e8cff]/10 transition-all cursor-pointer ${
            collapsed ? 'px-0' : 'px-4'
          }`}
          title="Upgrade & Credits"
        >
          <Gem size={15} className="shrink-0" />
          {!collapsed && <span>Upgrade / Buy Credits</span>}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'gap-3 p-2.5'
          } hover:bg-[#2d2e30] rounded-xl text-xs text-[#c4c7c5] hover:text-white transition-colors cursor-pointer`}
          title="Settings & help"
        >
          <Settings size={18} className="shrink-0 text-[#9aa0a6]" />
          {!collapsed && <span>Settings & Profile</span>}
        </button>
      </div>
    </aside>
  );
}
