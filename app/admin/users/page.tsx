"use client"
import React, { useState, useEffect } from "react"
import { Search, Ban, Crown, Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react"

type User = {
  _id: string;
  name: string;
  email: string;
  plan: "free" | "premium";
  isBanned: boolean;
  chats: number;
  createdAt: string;
}

export default function UsersManage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / limit);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&filter=${encodeURIComponent(filter)}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (Array.isArray(data.users)) {
        setUsers(data.users);
      }
      setTotal(data.total || 0);
    } catch (e) {
      console.warn("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    fetchUsers(); 
  }, [search, filter, page]);
  
  // Reset to page 1 when search or filter changes
  useEffect(() => { 
    setPage(1); 
  }, [search, filter]);

  const handleBan = async (id: string, isBanned: boolean) => {
    if(!confirm(isBanned ? "Unban this user?" : "Ban this user?")) return;
    try {
      await fetch(`/api/admin/users/${id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !isBanned })
      });
      fetchUsers();
    } catch (e) {
      console.warn("Ban failed:", e);
    }
  }

  const handlePremium = async (id: string, plan: string) => {
    if(!confirm(plan === 'premium' ? "Revoke Premium?" : "Make this user Premium?")) return;
    try {
      await fetch(`/api/admin/users/${id}/premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan === 'premium' ? 'free' : 'premium' })
      });
      fetchUsers();
    } catch (e) {
      console.warn("Premium update failed:", e);
    }
  }

  const handleExportPremiumCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/users/export?filter=premium&search=${encodeURIComponent(search)}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `premium-users-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.warn("CSV export failed:", e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4 text-[#e3e3e3]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-medium text-white">
            Users Management <span className="text-sm font-normal text-[#9aa0a6]">({total})</span>
          </h3>
          <p className="text-xs text-[#9aa0a6] mt-0.5">Filter accounts, moderate users, and export subscribed records</p>
        </div>
        <button
          onClick={handleExportPremiumCSV}
          disabled={exporting}
          className="bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] hover:opacity-90 px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 disabled:opacity-50 text-white cursor-pointer shadow-md transition-all"
        >
          {exporting ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
          Export Premium CSV
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="bg-[#1e1f20] border border-[#3c4043] focus-within:border-[#4e8cff] rounded-full flex items-center px-4 py-2 flex-1 max-w-[500px] shadow-sm transition-colors">
          <Search size={18} className="text-[#9aa0a6]" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search by name or email" 
            className="flex-1 bg-transparent outline-none px-3 text-sm text-[#e3e3e3] placeholder:text-[#9aa0a6]" 
          />
        </div>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          className="bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043] rounded-full px-4 py-2 text-sm text-[#e3e3e3] outline-none cursor-pointer transition-colors"
        >
          <option value="all">All Users</option>
          <option value="premium">Premium Only</option>
          <option value="free">Free Only</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#2d2e30] text-[#9aa0a6] text-xs">
              <tr>
                <th className="text-left px-5 py-3 font-normal">User</th>
                <th className="text-left py-3 font-normal">Plan</th>
                <th className="text-left py-3 font-normal">Chats</th>
                <th className="text-left py-3 font-normal">Status</th>
                <th className="text-left py-3 font-normal">Joined</th>
                <th className="text-right px-5 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Loader2 className="animate-spin mx-auto text-[#9aa0a6]" size={24}/>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#9aa0a6]">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u._id} className="border-t border-[#3c4043] hover:bg-[#2d2e30]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://i.pravatar.cc/100?u=${u.email}`} 
                        alt="" 
                        className="w-8 h-8 rounded-full border border-[#3c4043] object-cover"
                      />
                      <div>
                        <p className="font-medium text-[#e3e3e3]">{u.name}</p>
                        <p className="text-xs text-[#9aa0a6]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.plan === 'premium' ? (
                      <span className="bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                        Premium
                      </span>
                    ) : (
                      <span className="bg-[#2d2e30] border border-[#3c4043] text-[#c4c7c5] px-3 py-1 rounded-full text-xs">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="text-[#c4c7c5]">{u.chats}</td>
                  <td>
                    {u.isBanned ? (
                      <span className="text-[#ff5757] bg-[#ff5757]/10 border border-[#ff5757]/20 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 w-fit font-medium">
                        <Ban size={12}/> Banned
                      </span>
                    ) : (
                      <span className="text-[#34a853] bg-[#34a853]/10 border border-[#34a853]/20 px-3 py-1 rounded-full text-xs w-fit font-medium">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="text-[#9aa0a6] text-xs">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                  </td>
                  <td className="px-5">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handlePremium(u._id, u.plan)} 
                        className={`${
                          u.plan === 'premium' 
                            ? 'bg-[#131314] hover:bg-[#2d2e30] border border-[#3c4043] text-[#c4c7c5] hover:text-white' 
                            : 'bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] hover:from-[#3b7cee] hover:to-[#7c4ae6] text-white'
                        } px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm`}
                      >
                        <Crown size={12}/>
                        <span>{u.plan === 'premium' ? 'Revoke' : 'Make Premium'}</span>
                      </button>

                      <button 
                        onClick={() => handleBan(u._id, u.isBanned)} 
                        className={`${
                          u.isBanned 
                            ? 'bg-[#34a853] hover:bg-[#2e9348] text-white' 
                            : 'bg-[#ff5757]/10 hover:bg-[#ff5757]/20 text-[#ff5757] border border-[#ff5757]/30'
                        } px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Gemini Style */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#3c4043] bg-[#1e1f20]">
          <p className="text-xs text-[#9aa0a6]">
            Page {page} of {totalPages || 1} • {total} users
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              className="p-2 bg-[#2d2e30] rounded-full disabled:opacity-30 hover:bg-[#35363a] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft size={16}/>
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, Math.max(1, totalPages)) }, (_, i) => {
                const p = i + 1;
                return (
                  <button 
                    key={p} 
                    onClick={() => setPage(p)} 
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      page === p 
                        ? 'bg-white text-black shadow-sm' 
                        : 'bg-[#2d2e30] hover:bg-[#35363a] text-[#c4c7c5] hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
              className="p-2 bg-[#2d2e30] rounded-full disabled:opacity-30 hover:bg-[#35363a] text-[#c4c7c5] hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
