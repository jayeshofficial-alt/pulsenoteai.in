import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Check,
  CreditCard,
  Lock,
} from 'lucide-react';
import { CustomTemplateDoc, CustomTemplateSection, PulseNotePlan } from '../types';
import { saveCustomTemplate } from '../lib/firebase';

interface TemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userPlan: PulseNotePlan;
  customTemplatesCount: number;
  teamId?: string;
  onOpenPricing: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function TemplateBuilderModal({
  isOpen,
  onClose,
  userId,
  userPlan,
  customTemplatesCount,
  teamId,
  onOpenPricing,
  onShowToast,
}: TemplateBuilderModalProps) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState<
    'Clinical' | 'Legal' | 'Property Inspection' | 'Engineering RFC' | 'Corporate Memo'
  >('Clinical');
  const [sections, setSections] = useState<CustomTemplateSection[]>([
    { id: '1', title: 'Subjective / Chief Complaint', instructions: 'Document patient reported history and symptoms only.' },
    { id: '2', title: 'Objective Physical Exam', instructions: 'Document examined signs, vitals, or state Not documented.' },
    { id: '3', title: 'Clinical Assessment', instructions: 'Document diagnoses or clinical rationale without inventing facts.' },
    { id: '4', title: 'Plan & Disposition', instructions: 'Document recommended therapies, referrals, and follow up.' },
  ]);
  const [isTeamShared, setIsTeamShared] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSetupService, setShowSetupService] = useState(false);
  const [setupNotes, setSetupNotes] = useState('');

  if (!isOpen) return null;

  // Free users: built-in templates only
  const isFree = userPlan === 'free';
  // Pro users: up to 10 custom templates
  const isProLimitReached = userPlan === 'pro' && customTemplatesCount >= 10;

  const handleAddSection = () => {
    const id = Date.now().toString();
    setSections((prev) => [
      ...prev,
      { id, title: `Section ${prev.length + 1}`, instructions: 'Enter instructions for this section...' },
    ]);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const copy = [...sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    setSections(copy);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isFree) {
      onOpenPricing();
      onShowToast?.('info', 'Custom templates require a Pro or Team subscription.');
      return;
    }

    if (isProLimitReached) {
      onOpenPricing();
      onShowToast?.('error', 'Pro plan supports up to 10 custom templates. Upgrade to Team for unlimited shared templates.');
      return;
    }

    setIsSaving(true);
    try {
      await saveCustomTemplate(
        userId,
        {
          name: name.trim(),
          industry,
          sections,
          createdAt: new Date().toISOString(),
          isTeamShared: Boolean(isTeamShared && teamId),
        },
        teamId
      );
      onShowToast?.('success', 'Custom template saved successfully!');
      onClose();
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to save custom template.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrderSetupService = async () => {
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: 'template_setup', notes: setupNotes }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast?.('success', 'Custom Template Setup order initiated (₹2,999). Our engineers will contact you.');
        setShowSetupService(false);
      }
    } catch (e) {
      onShowToast?.('error', 'Could not initiate setup service order.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d2e30] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Custom Template Builder</h2>
              <p className="text-xs text-[#9aa0a6]">
                Configure deterministic multi-section documentation structures tailored to your practice.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9aa0a6] hover:text-white hover:bg-[#2d2e30] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Plan Lock Notice */}
        {isFree && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Lock size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Custom Templates are a Pro / Team Feature</p>
                <p className="text-[#9aa0a6] mt-0.5">
                  Free plan includes all 5 built-in domain modes. Upgrade to Pro for up to 10 custom templates or Team for unlimited shared templates.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenPricing();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shrink-0 cursor-pointer"
            >
              Upgrade
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                Template Name
              </label>
              <input
                type="text"
                placeholder="e.g., Pediatric Progress Encounter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-3.5 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                Industry Domain
              </label>
              <select
                value={industry}
                onChange={(e: any) => setIndustry(e.target.value)}
                className="w-full bg-[#131314] border border-[#3c4043] rounded-xl px-3.5 py-2 text-xs text-white"
              >
                <option value="Clinical">Clinical</option>
                <option value="Legal">Legal</option>
                <option value="Property Inspection">Property Inspection</option>
                <option value="Engineering RFC">Engineering RFC</option>
                <option value="Corporate Memo">Corporate Memo</option>
              </select>
            </div>
          </div>

          {teamId && (
            <label className="flex items-center gap-2 text-xs text-[#c4c7c5] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isTeamShared}
                onChange={(e) => setIsTeamShared(e.target.checked)}
                className="rounded accent-[#4e8cff]"
              />
              <span>Share this template with the entire clinic / team workspace</span>
            </label>
          )}

          {/* Ordered Sections */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#c4c7c5]">
                Ordered Template Sections ({sections.length})
              </label>
              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-1 text-xs text-[#4e8cff] hover:text-[#70a3ff] cursor-pointer"
              >
                <Plus size={14} /> Add Section
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="bg-[#131314] border border-[#2d2e30] rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSections((prev) =>
                          prev.map((s) => (s.id === sec.id ? { ...s, title: val } : s))
                        );
                      }}
                      className="flex-1 bg-transparent border-b border-[#3c4043] focus:border-[#4e8cff] px-1 py-0.5 text-xs text-white font-medium outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-[#9aa0a6] hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 text-[#9aa0a6] hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sec.id)}
                        disabled={sections.length <= 1}
                        className="p-1 text-[#9aa0a6] hover:text-red-400 disabled:opacity-30"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={sec.instructions}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSections((prev) =>
                        prev.map((s) => (s.id === sec.id ? { ...s, instructions: val } : s))
                      );
                    }}
                    placeholder="Instructions for Gemini formatting in this section..."
                    className="w-full bg-[#1e1f20] border border-[#2d2e30] rounded-lg p-2 text-[11px] text-[#c4c7c5] outline-none resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-[#2d2e30] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowSetupService(!showSetupService)}
              className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Need our team to build it for you? (₹2,999)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-xs text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] disabled:opacity-40 text-xs text-white font-medium cursor-pointer"
              >
                <Check size={14} />
                <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Custom Template Setup Service Card */}
        {showSetupService && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles size={14} /> Custom Template Setup Service (₹2,999 One-Time)
              </span>
              <span className="font-mono text-amber-400">Razorpay Order</span>
            </div>
            <p className="text-[#c4c7c5]">
              Provide your existing Word or PDF EHR/inspection format. Our engineers will configure deterministic JSON schemas, field validators, and test benchmarks for your practice.
            </p>
            <textarea
              rows={2}
              value={setupNotes}
              onChange={(e) => setSetupNotes(e.target.value)}
              placeholder="Describe your template requirements or paste section headings..."
              className="w-full bg-[#131314] border border-[#3c4043] rounded-lg p-2 text-xs text-white"
            />
            <button
              type="button"
              onClick={handleOrderSetupService}
              className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CreditCard size={14} />
              <span>Order Setup Service via Razorpay (₹2,999)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
