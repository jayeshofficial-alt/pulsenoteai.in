"use client"
import React, { useState } from "react"
import Sidebar from "@/components/Sidebar"
import PromptBar from "@/components/PromptBar"

export default function Home() {
  const [collapsed, setCollapsed] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [model, setModel] = useState("2.5 Flash")
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // KEEP PREMIUM LOGIC INTACT
    const userPlan: string = "free"; // Replace with real: user.plan
    if (userPlan !== 'premium' && model === '2.5 Pro') {
      alert("Upgrade to Premium to use 2.5 Pro");
      window.location.href = "/premium";
      return;
    }

    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, model }),
      });

      const data = await res.json();
      
      if (data.error) {
        setMessages([...newMessages, { role: "assistant", content: "Error: " + data.error }]);
      } else {
        const replyText = data.reply || data.text || "No response received";
        setMessages([...newMessages, { role: "assistant", content: replyText }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Network error. Check console and Vercel logs." }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#131314] text-[#e3e3e3]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col bg-[#131314]">
        <header className="flex justify-between items-center p-4 border-b border-[#3c4043]">
          <h1 className="text-xl font-medium">PulseNote AI</h1>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)} 
            className="bg-[#1e1f20] border border-[#3c4043] rounded-full px-4 py-1.5 text-sm text-[#e3e3e3] outline-none cursor-pointer"
          >
            <option>2.5 Flash</option>
            <option>2.5 Pro</option>
          </select>
          <img src="https://i.pravatar.cc/100" alt="profile" className="w-8 h-8 rounded-full border border-[#3c4043]" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {messages.length === 0 ? (
            <div className="max-w-[800px] mx-auto mt-[10vh] w-full">
              <h1 className="text-4xl font-medium mb-8">
                <span className="bg-gradient-to-r from-[#4e8cff] to-[#ff5757] bg-clip-text text-transparent">
                  Hello, User
                </span>
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
                <div onClick={() => setInput("Create an image of a futuristic city")} className="bg-[#1e1f20] p-4 rounded-xl hover:bg-[#2d2e30] border border-[#3c4043]/40 cursor-pointer transition-colors text-sm">
                  Create image
                </div>
                <div onClick={() => setInput("Deep research on AI trends 2025")} className="bg-[#1e1f20] p-4 rounded-xl hover:bg-[#2d2e30] border border-[#3c4043]/40 cursor-pointer transition-colors text-sm">
                  Deep Research
                </div>
                <div onClick={() => setInput("Write code for a todo app in React")} className="bg-[#1e1f20] p-4 rounded-xl hover:bg-[#2d2e30] border border-[#3c4043]/40 cursor-pointer transition-colors text-sm">
                  Write code
                </div>
                <div onClick={() => setInput("Brainstorm startup ideas")} className="bg-[#1e1f20] p-4 rounded-xl hover:bg-[#2d2e30] border border-[#3c4043]/40 cursor-pointer transition-colors text-sm">
                  Brainstorm
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-[800px] mx-auto space-y-6 w-full">
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={`${
                    m.role === 'user' 
                      ? 'bg-[#1e1f20] border border-[#3c4043] ml-auto max-w-[70%] p-4 rounded-2xl text-sm' 
                      : 'bg-transparent p-4 whitespace-pre-wrap text-sm leading-relaxed text-[#e3e3e3]'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && <div className="p-4 text-[#9aa0a6] text-sm animate-pulse">PulseNote AI is thinking...</div>}
            </div>
          )}
          <div className="max-w-[800px] mx-auto mt-auto w-full sticky bottom-6 pt-6">
            <PromptBar input={input} setInput={setInput} onSend={handleSend} isGenerating={loading} />
            <p className="text-xs text-center text-[#9aa0a6] mt-3">PulseNote AI can make mistakes, so double-check it</p>
          </div>
        </div>
      </div>
    </div>
  )
}
