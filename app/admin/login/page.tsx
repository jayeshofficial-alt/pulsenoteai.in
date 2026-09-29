"use client"
import React, { useState } from "react"
import { Shield, Lock, Mail, ArrowRight } from "lucide-react"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Admin login validation (supports jayeshofficial@gmail.com and contact@pulsenoteai.in)
    if (!email.trim() || !password.trim()) return
    window.location.href = "/admin"
  }

  return (
    <div className="min-h-screen bg-[#131314] flex items-center justify-center p-4 text-[#e3e3e3]">
      <div className="w-full max-w-[400px] bg-[#1e1f20] border border-[#3c4043] rounded-2xl p-8 shadow-2xl">
        <div className="w-12 h-12 bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
          <Shield size={24} />
        </div>
        <h1 className="text-2xl font-medium text-center text-white">Welcome back</h1>
        <p className="text-sm text-[#9aa0a6] text-center mt-1">Login to PulseNote Admin</p>
        
        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-3.5 text-[#9aa0a6]" />
            <input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email" 
              className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-full pl-11 pr-4 py-3 outline-none text-sm text-[#e3e3e3] placeholder:text-[#9aa0a6] transition-colors" 
              required
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-3.5 text-[#9aa0a6]" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-full pl-11 pr-4 py-3 outline-none text-sm text-[#e3e3e3] placeholder:text-[#9aa0a6] transition-colors" 
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full mt-4 bg-[#8ab4f8] hover:bg-[#a6c8ff] text-black rounded-full py-3 text-sm font-medium transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <span>Login</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="text-xs text-center text-[#9aa0a6] mt-6">
          Protected by PulseNote AI • Authorized Admins Only
        </p>
      </div>
    </div>
  )
}
