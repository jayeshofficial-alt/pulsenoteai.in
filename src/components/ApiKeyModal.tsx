import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Check } from 'lucide-react';
import { getOpenRouterApiKey } from '../services/openrouter';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (key: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getOpenRouterApiKey());
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      if (apiKey.trim()) {
        localStorage.setItem('pulsenote_openrouter_api_key', apiKey.trim());
      } else {
        localStorage.removeItem('pulsenote_openrouter_api_key');
      }
      setSaved(true);
      onSave?.(apiKey.trim());
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-3xl w-full max-w-md p-6 shadow-2xl text-[#e3e3e3] space-y-5">
        <div className="flex items-center justify-between border-b border-[#3c4043]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#4e8cff]/20 text-[#4e8cff] border border-[#4e8cff]/30">
              <Key size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">OpenRouter API Key Settings</h3>
              <p className="text-xs text-[#9aa0a6]">Direct client &amp; live deployment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9aa0a6] hover:text-white rounded-lg hover:bg-[#2d2e30] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-[#c4c7c5]">
          <p>
            Enter your OpenRouter API key below or set <code className="px-1.5 py-0.5 rounded bg-black/50 text-cyan-300 font-mono">VITE_OPENROUTER_API_KEY</code> in your environment variables.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono placeholder:text-[#9aa0a6]"
            />
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl space-y-1 text-[11px] text-blue-200">
            <div className="flex items-center gap-1.5 font-semibold text-blue-300">
              <ShieldCheck size={14} />
              <span>In AI Studio Backend:</span>
            </div>
            <p>
              Your key can also be injected automatically into <code className="font-mono text-cyan-300">OPENROUTER_API_KEY</code> on the server.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4e8cff] hover:underline flex items-center gap-1"
          >
            <span>Get an OpenRouter Key</span>
            <ExternalLink size={12} />
          </a>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#9aa0a6] hover:text-white hover:bg-[#2d2e30] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#4e8cff] hover:bg-[#3b7cef] text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#4e8cff]/20"
            >
              {saved ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
