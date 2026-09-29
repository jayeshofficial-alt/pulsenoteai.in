"use client"
import React, { useState } from "react"
import { Crown, Sparkles, Check, AlertTriangle } from "lucide-react"

export default function PremiumManage() {
  const [plans, setPlans] = useState([
    { id: 1, name: "Premium Monthly", price: 299, interval: "month", features: "2.5 Pro, Unlimited Chats, File Upload, Veo 3.1 Video, Imagen 3 Diffusion" },
    { id: 2, name: "Premium Yearly", price: 1999, interval: "year", features: "2.5 Pro, Save 45%, Priority Veo Fast Queue, Priority Support" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-medium text-[#e3e3e3]">Premium Plans</h3>
          <p className="text-xs text-[#9aa0a6] mt-0.5">Manage subscription tiers and pricing models</p>
        </div>
        <button className="bg-white hover:bg-gray-200 text-black px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer shadow-md">
          + Create Plan
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] flex items-center justify-center text-white">
                    <Crown size={16} />
                  </div>
                  <h4 className="font-medium text-[#e3e3e3]">{plan.name}</h4>
                </div>
                <span className="bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] text-white px-3 py-1 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <p className="text-3xl font-medium mt-4 text-white">
                ₹{plan.price}
                <span className="text-sm text-[#9aa0a6] font-normal">/{plan.interval}</span>
              </p>
              <p className="text-xs text-[#9aa0a6] mt-2 leading-relaxed">{plan.features}</p>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-[#3c4043]/40">
              <button className="flex-1 bg-[#2d2e30] hover:bg-[#35363a] text-[#e3e3e3] hover:text-white rounded-full py-2 text-sm font-medium transition-colors cursor-pointer">
                Edit
              </button>
              <button className="flex-1 bg-[#131314] hover:bg-[#2d2e30] border border-[#3c4043] text-[#9aa0a6] hover:text-[#e3e3e3] rounded-full py-2 text-sm font-medium transition-colors cursor-pointer">
                Disable
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1e1f20] border border-amber-500/30 rounded-2xl p-4 text-sm flex items-start gap-3 shadow-sm">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300 text-xs leading-relaxed">
          <strong>Security Notice:</strong> Do not change API keys here. This UI only edits display and tier metadata. Your payment gateway at <code className="bg-[#131314] px-1.5 py-0.5 rounded text-amber-200">/api/payment/*</code> and UPI VPA (<code className="bg-[#131314] px-1.5 py-0.5 rounded text-amber-200">wagh.jayesh@oksbi</code>) remain strictly verified and untouched.
        </p>
      </div>
    </div>
  )
}
