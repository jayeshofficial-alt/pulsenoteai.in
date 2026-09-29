import React from 'react';
import { Menu, Plus, Clock, Settings, Gem, LayoutGrid, MessageSquare, Trash2 } from 'lucide-react';

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
  activeView?: 'chat' | 'canvas';
  onToggleView?: (view: 'chat' | 'canvas') => void;
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
  activeView = 'chat',
  onToggleView,
}: SidebarProps) {
  const defaultRecent = [
    { id: 'rec-1', title: 'How to build Gemini clone', timestamp: Date.now() - 3600000 },
    { id: 'rec-2', title: 'Premium plan logic', timestamp: Date.now() - 7200000 },
  ];

  const displayChats = recentChats.length > 0 ? recentChats : defaultRecent;

  return (
    <aside
      className={`${
        collapsed ? 'w-[68px]' : 'w-[280px]'
      } bg-[#1e1f20] h-screen p-3 flex flex-col transition-all duration-300 border-r border-[#3c4043]/30 shrink-0 z-30 select-none`}
    >
      {/* Top Header with Hamburger and Logo */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-[#2d2e30] rounded-full text-[#e3e3e3] hover:text-white transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={20} />
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg tracking-tight text-[#e3e3e3]">PulseNote AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#4e8cff]/20 text-[#4e8cff] font-mono font-bold">
              3.8
            </span>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <button
        type="button"
        onClick={onNewChat}
        className={`bg-[#2d2e30] hover:bg-[#35363a] text-[#e3e3e3] rounded-full py-3 px-4 flex items-center ${
          collapsed ? 'justify-center' : 'gap-3'
        } text-sm font-medium mb-4 transition-all shadow-md cursor-pointer border border-[#3c4043]/40`}
        title="Start a new chat"
      >
        <Plus size={18} className="text-[#e3e3e3] shrink-0" />
        {!collapsed && <span>New chat</span>}
      </button>

      {/* View Switcher: Chat vs Canvas */}
      {onToggleView && !collapsed && (
        <div className="mb-4 p-1 bg-[#131314] rounded-xl flex gap-1 border border-[#3c4043]/40 text-xs">
          <button
            type="button"
            onClick={() => onToggleView('chat')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors ${
              activeView === 'chat'
                ? 'bg-[#2d2e30] text-white shadow-sm'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleView('canvas')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors ${
              activeView === 'canvas'
                ? 'bg-[#2d2e30] text-white shadow-sm'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Canvas</span>
          </button>
        </div>
      )}

      {/* Recent Chats Section */}
      {!collapsed ? (
        <div className="flex-1 overflow-y-auto pr-1 space-y-1">
          <p className="text-xs font-medium text-[#9aa0a6] px-2 mb-2 uppercase tracking-wider">Recent</p>
          <div className="space-y-1 text-sm">
            {displayChats.map((c) => {
              const isSelected = currentChatId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectChat?.(c.id)}
                  className={`group relative p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#2d2e30] text-white font-medium shadow-sm'
                      : 'text-[#c4c7c5] hover:bg-[#2d2e30]/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                    <Clock size={15} className="text-[#9aa0a6] shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  {onDeleteChat && (
                    <button
                      type="button"
                      onClick={(e) => onDeleteChat(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-[#9aa0a6] transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center gap-3 pt-2 text-[#9aa0a6]">
          {onToggleView && (
            <button
              type="button"
              onClick={() => onToggleView(activeView === 'chat' ? 'canvas' : 'chat')}
              className={`p-2.5 rounded-xl hover:bg-[#2d2e30] transition-colors ${
                activeView === 'canvas' ? 'text-[#4e8cff]' : 'text-[#9aa0a6]'
              }`}
              title={activeView === 'chat' ? 'Switch to Canvas' : 'Switch to Chat'}
            >
              <LayoutGrid size={18} />
            </button>
          )}
          <div className="w-8 h-px bg-[#3c4043]" />
          <div title="Recent Chats">
            <Clock size={18} className="cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      )}

      {/* Footer: Upgrade to Premium & Settings */}
      <div className="mt-auto space-y-2 pt-2 border-t border-[#3c4043]/30">
        <button
          type="button"
          onClick={onOpenUpgrade}
          className={`w-full bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] hover:from-[#3b7cee] hover:to-[#7c4ae6] rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2 text-white shadow-lg shadow-[#4e8cff]/10 transition-all cursor-pointer ${
            collapsed ? 'px-0' : 'px-4'
          }`}
          title="Upgrade to Premium"
        >
          <Gem size={16} className="shrink-0" />
          {!collapsed && <span>Upgrade to Premium</span>}
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
          {!collapsed && <span>Settings & help</span>}
        </button>
      </div>
    </aside>
  );
}
