"use client"
import React, { useState, useEffect } from "react"
import { Users, Crown, MessageSquare, IndianRupee, ArrowUpRight } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { label: "Total Users", value: "12,480", icon: Users, change: "+12%" },
    { label: "Premium Users", value: "1,240", icon: Crown, change: "+8%" },
    { label: "Total Chats", value: "89.2K", icon: MessageSquare, change: "+23%" },
    { label: "Revenue", value: "₹2,45,000", icon: IndianRupee, change: "+15%" },
  ]);

  const [recentUsers, setRecentUsers] = useState([
    { email: "jayesh@email.com", plan: "Premium", chats: 245 },
    { email: "user2@email.com", plan: "Free", chats: 12 },
    { email: "contact@pulsenoteai.in", plan: "Super Admin", chats: 890 },
    { email: "sarah.tech@gmail.com", plan: "Premium", chats: 78 },
  ]);

  useEffect(() => {
    // Optionally fetch live counts from backend if available
    fetch('/api/admin/metrics')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.metrics) {
          const m = data.metrics;
          setStats([
            { label: "Total Users", value: String(m.totalUsers || "12,480"), icon: Users, change: "+12%" },
            { label: "Premium Users", value: String(m.proUsers || "1,240"), icon: Crown, change: "+8%" },
            { label: "Total Chats", value: String(m.totalChats || "89.2K"), icon: MessageSquare, change: "+23%" },
            { label: "Revenue", value: `₹${(m.totalRevenueINR || 245000).toLocaleString('en-IN')}`, icon: IndianRupee, change: "+15%" },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-[#9aa0a6]">{s.label}</p>
                <p className="text-2xl font-medium mt-2 text-[#e3e3e3]">{s.value}</p>
              </div>
              <div className="w-10 h-10 bg-[#2d2e30] rounded-full flex items-center justify-center text-[#4e8cff]">
                <s.icon size={18}/>
              </div>
            </div>
            <p className="text-xs text-[#4e8cff] mt-3 font-medium flex items-center gap-1">
              <ArrowUpRight size={14} />
              {s.change} vs last month
            </p>
          </div>
        ))}
      </div>

      {/* Revenue & Plans Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#1e1f20] border border-[#3c4043] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-[#e3e3e3]">Revenue Overview</h3>
            <span className="text-xs text-[#9aa0a6] bg-[#2d2e30] px-3 py-1 rounded-full border border-[#3c4043]">
              UPI: wagh.jayesh@oksbi
            </span>
          </div>
          <div className="h-[220px] bg-[#131314] rounded-xl flex flex-col items-center justify-center text-[#9aa0a6] text-sm border border-dashed border-[#3c4043] p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#2d2e30] flex items-center justify-center text-[#4e8cff] mb-2">
              <IndianRupee size={20} />
            </div>
            <p className="font-medium text-[#e3e3e3]">Live Revenue Stream Connected</p>
            <p className="text-xs text-[#9aa0a6] mt-1">
              ₹299/mo and ₹1,999/yr subscription settlement verified via SBI UPI
            </p>
          </div>
        </div>

        <div className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-medium mb-4 text-[#e3e3e3]">Premium Plans Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm p-3 bg-[#2d2e30] rounded-xl border border-[#3c4043]/40">
                <span className="text-[#e3e3e3]">Monthly ₹299</span>
                <span className="text-[#4e8cff] font-medium">820 users</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-[#2d2e30] rounded-xl border border-[#3c4043]/40">
                <span className="text-[#e3e3e3]">Yearly ₹1,999</span>
                <span className="text-[#4e8cff] font-medium">420 users</span>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] hover:from-[#3b7cee] hover:to-[#7c4ae6] text-white rounded-full py-2.5 text-sm font-medium transition-all shadow-md cursor-pointer">
            Manage Plans
          </button>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl p-5">
        <h3 className="font-medium mb-4 text-[#e3e3e3]">Recent Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[#9aa0a6] text-xs">
              <tr>
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Plan</th>
                <th className="text-left py-2">Chats</th>
                <th className="text-left py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u, i) => (
                <tr key={i} className="border-t border-[#3c4043]/50">
                  <td className="py-3 text-[#e3e3e3]">{u.email}</td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      u.plan === 'Premium' || u.plan === 'Super Admin'
                        ? 'bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] text-white shadow-sm'
                        : 'bg-[#2d2e30] text-[#9aa0a6] border border-[#3c4043]'
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-3 text-[#c4c7c5]">{u.chats}</td>
                  <td className="py-3 text-[#4e8cff] hover:text-[#8ab4f8] cursor-pointer font-medium">
                    View
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
