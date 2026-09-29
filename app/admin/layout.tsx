"use client"
import React, { useState } from "react"
import { LayoutDashboard, Users, Crown, BarChart3, Settings, LogOut, Menu, Shield } from "lucide-react"

// Universal Link component for seamless Next.js and client routing
const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3]">
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-[72px]' : 'w-[280px]'} bg-[#1e1f20] border-r border-[#3c4043] flex flex-col transition-all duration-300`}>
        <div className="p-4 flex items-center gap-3 border-b border-[#3c4043]">
          <div className="w-9 h-9 bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] rounded-full flex items-center justify-center shrink-0">
            <Shield size={18} className="text-white"/>
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">PulseNote AI</p>
              <p className="text-xs text-[#9aa0a6]">Admin Panel</p>
            </div>
          )}
          <Menu className="ml-auto cursor-pointer text-[#9aa0a6] hover:text-white" size={18} onClick={() => setCollapsed(!collapsed)} />
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 bg-[#2d2e30] rounded-full text-sm text-white">
            <LayoutDashboard size={18}/>
            {!collapsed && "Dashboard"}
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#2d2e30] rounded-full text-sm text-[#c4c7c5] hover:text-white">
            <Users size={18}/>
            {!collapsed && "Users"}
          </Link>
          <Link href="/admin/premium" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#2d2e30] rounded-full text-sm text-[#c4c7c5] hover:text-white">
            <Crown size={18}/>
            {!collapsed && "Premium Plans"}
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#2d2e30] rounded-full text-sm text-[#c4c7c5] hover:text-white">
            <BarChart3 size={18}/>
            {!collapsed && "Analytics"}
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#2d2e30] rounded-full text-sm text-[#c4c7c5] hover:text-white">
            <Settings size={18}/>
            {!collapsed && "Settings"}
          </Link>
        </nav>

        <div className="p-3 border-t border-[#3c4043]">
          <div className="flex items-center gap-3 px-3 py-2">
            <img src="https://i.pravatar.cc/100?img=12" className="w-8 h-8 rounded-full border border-[#3c4043]" alt="admin"/>
            {!collapsed && (
              <div>
                <p className="text-sm">Admin</p>
                <p className="text-xs text-[#9aa0a6]">admin@pulsenoteai.in</p>
              </div>
            )}
          </div>
          <button className="w-full mt-2 flex items-center gap-3 px-3 py-2 hover:bg-[#2d2e30] rounded-full text-sm text-[#ff5757] transition-colors cursor-pointer">
            <LogOut size={18}/>
            {!collapsed && "Logout"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="h-[64px] bg-[#131314] border-b border-[#3c4043] flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-lg font-medium">Admin Dashboard</h2>
          <div className="bg-[#1e1f20] border border-[#3c4043] rounded-full px-4 py-1.5 text-xs text-[#9aa0a6]">
            Gemini Dark Theme • Premium Intact
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
