import React, { useState } from 'react';
import {
  Handshake,
  DollarSign,
  TrendingUp,
  Building,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  Send,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { submitPartnerLead } from '../lib/firebase';

interface PartnersPageProps {
  onBack: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function PartnersPage({ onBack, onShowToast }: PartnersPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [type, setType] = useState('Clinic / Healthcare Group');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !organization.trim()) return;

    setIsSubmitting(true);
    try {
      await submitPartnerLead({
        name: name.trim(),
        email: email.trim(),
        organization: organization.trim(),
        type,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
      onShowToast?.('success', 'Partner inquiry submitted! Our team will contact you within 24 hours.');
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Failed to submit partner lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 border-b border-[#2d2e30] pb-5">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Handshake size={22} className="text-[#4e8cff]" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Partner Program & Resellers</h1>
            </div>
            <p className="text-xs sm:text-sm text-[#9aa0a6] mt-1">
              Join clinics, resellers, and property inspection firms scaling deterministic AI documentation.
            </p>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign size={22} />
            </div>
            <h3 className="text-sm font-bold text-white">20% Recurring Commission</h3>
            <p className="text-xs text-[#9aa0a6] leading-relaxed">
              Earn ongoing monthly recurring revenue for every paying clinic, enterprise team, or inspection firm you introduce.
            </p>
          </div>

          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Stethoscope size={22} />
            </div>
            <h3 className="text-sm font-bold text-white">Co-Branded Templates</h3>
            <p className="text-xs text-[#9aa0a6] leading-relaxed">
              Distribute specialized clinical SOAP schemas, property defect protocols, or engineering RFC templates with custom branding.
            </p>
          </div>

          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-sm font-bold text-white">Dedicated Support Desk</h3>
            <p className="text-xs text-[#9aa0a6] leading-relaxed">
              Direct line to our executive systems architect, priority webhook access, and enterprise billing support.
            </p>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-[#4e8cff]" />
              Partner Application & Inquiries
            </h2>
            <p className="text-xs text-[#9aa0a6] mt-1">
              Submit your organization details to activate your partner dashboard and receive your affiliate code.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center bg-[#131314] rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-semibold text-white">Thank you for applying!</h3>
              <p className="text-xs text-[#9aa0a6] max-w-md mx-auto">
                Your partnership inquiry has been registered in our database. Our leadership team will review your application and respond at <span className="text-white font-mono">{email}</span>.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 px-4 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-xs text-white"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Rajesh / Priya Sharma"
                    className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                    Professional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@clinicgroup.com"
                    className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                    Clinic / Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Apex Health Network / Skyline Inspectors"
                    className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                    Partner Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Clinic / Healthcare Group">Clinic / Healthcare Group</option>
                    <option value="Commercial Property Inspection Firm">Commercial Property Inspection Firm</option>
                    <option value="Legal & Advisory Practice">Legal & Advisory Practice</option>
                    <option value="Software / EHR Reseller">Software / EHR Reseller</option>
                    <option value="Independent Medical Consultant">Independent Medical Consultant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">
                  Estimated Monthly Volume & Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your provider count, estimated documentation volume, or integration goals..."
                  className="w-full bg-[#131314] border border-[#3c4043] focus:border-[#4e8cff] rounded-xl p-3 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#9aa0a6]">
                  Stored safely in Firestore <span className="font-mono text-slate-300">partnerLeads</span>
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs text-white font-medium shadow-lg transition cursor-pointer"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Partner Inquiry'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
