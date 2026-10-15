import React from 'react';
import { LogOut, User } from 'lucide-react';

interface UserNavMenuProps {
  userEmail?: string | null;
  onLogout?: () => void | Promise<void>;
  className?: string;
}

export default function UserNavMenu({ userEmail, onLogout, className = '' }: UserNavMenuProps) {
  const handleLogout = async () => {
    try {
      // 1. Call backend API endpoint to invalidate server-side session/cookies
      await fetch('/api/auth/logout', { method: 'POST' }).catch((error) => {
        console.error("Logout request failed:", error);
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      // 2. Clear client-side storage tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('pulsenote_auth_token');
      localStorage.removeItem('pulsenote_user_profile');
      sessionStorage.clear();

      // 3. Invoke callback or redirect
      if (onLogout) {
        await onLogout();
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border-t border-[#3c4043]/50 bg-[#1e1f20]/80 rounded-xl ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#3c4043]/60 flex items-center justify-center shrink-0 text-[#4e8cff] font-bold text-xs border border-[#3c4043]">
          {(userEmail?.[0] || 'A').toUpperCase()}
        </div>
        <div className="text-sm font-medium text-[#e3e3e3] truncate">
          {userEmail || "Admin User"}
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer shrink-0"
        title="Sign out of your account"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Logout</span>
      </button>
    </div>
  );
}
