import React from 'react';
import { X, Shield, FileText, Star, Calendar, Mail, ExternalLink, Lock } from 'lucide-react';

export const DEMO_BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/pulsenoteai-demo';

interface LegalTrustModalProps {
  type: 'privacy' | 'terms' | 'testimonials' | 'demo' | null;
  onClose: () => void;
}

export function LegalTrustModal({ type, onClose }: LegalTrustModalProps) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[85vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2d2e30] pb-4">
          <div className="flex items-center gap-2.5">
            {type === 'privacy' && <Shield className="text-[#10b981]" size={22} />}
            {type === 'terms' && <FileText className="text-[#4e8cff]" size={22} />}
            {type === 'testimonials' && <Star className="text-amber-400" size={22} />}
            {type === 'demo' && <Calendar className="text-purple-400" size={22} />}
            <h2 className="text-lg font-bold text-white capitalize">
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'terms' && 'Terms of Service'}
              {type === 'testimonials' && 'Customer Testimonials & Case Studies'}
              {type === 'demo' && 'Book a Live Enterprise Demo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9aa0a6] hover:text-white hover:bg-[#2d2e30] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {type === 'privacy' && (
          <div className="space-y-4 text-xs text-[#c4c7c5] leading-relaxed">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200">
              <strong>Core Privacy Notice:</strong> Built on Google Cloud. Do not enter patient-identifying information.
            </div>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">1. What Data Is Stored</h3>
              <p>
                PulseNote AI stores your registered account email, subscription status, note counts, and saved documentation records in your private account workspace.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">2. Where Data Is Stored & Processed</h3>
              <p>
                All account data, Firestore records, and secure rules are hosted on <strong>Google Cloud Platform & Firebase</strong> data centers.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">3. Payment Processing by Razorpay</h3>
              <p>
                Subscription billing and credit orders are processed directly through <strong>Razorpay</strong>. PulseNote AI never sees or stores full credit card numbers or banking passwords.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">4. AI Processing by Google Gemini</h3>
              <p>
                Deterministic note extraction is executed by Google Gemini models via the official Google GenAI API. Prompts are processed strictly to populate requested document schemas.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">5. User Responsibility For Patient Identifiers</h3>
              <p className="text-amber-300 font-medium">
                The user is solely responsible for ensuring no direct patient identifiers (such as patient full names, social security numbers, or government IDs) are entered into the prompts or transcripts.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">6. Requesting Data Deletion</h3>
              <p>
                You may request complete account and document deletion at any time by contacting our privacy desk at{' '}
                <a href="mailto:contact@pulsenoteai.in" className="text-[#4e8cff] underline font-mono">
                  contact@pulsenoteai.in
                </a>
                .
              </p>
            </section>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4 text-xs text-[#c4c7c5] leading-relaxed">
            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">1. Terms of Use</h3>
              <p>
                By using PulseNote AI (pulsenoteai.in), you agree to these Terms. PulseNote AI is a documentation formatting and synthesis tool designed to assist licensed professionals.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">2. Deterministic Restatement Only</h3>
              <p>
                PulseNote AI documentation engines operate strictly on facts supplied in the input. The tool does not provide independent medical diagnoses or legal counsel. Professional clinician review is mandatory prior to signing or charting.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">3. Plans & Credits</h3>
              <p>
                Free users receive 5 notes per month. Pro and Team subscriptions provide unlimited notes and monthly credit allowances for multimedia features. Credit packs are non-refundable once consumed.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold text-white text-sm">4. Contact Desk</h3>
              <p>
                For legal or enterprise licensing inquiries, write to{' '}
                <span className="font-mono text-white">contact@pulsenoteai.in</span>.
              </p>
            </section>
          </div>
        )}

        {type === 'testimonials' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200">
              <strong>Notice:</strong> The testimonials below are sample reviews clearly marked for demonstration until replaced by verified enterprise case studies.
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Dr. A. Sharma, Cardiologist</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    SAMPLE REVIEW
                  </span>
                </div>
                <p className="text-[#9aa0a6] italic">
                  "PulseNote AI cut my charting time in half while keeping every SOAP fact 100% accurate. The deterministic schema eliminates hallucinations."
                </p>
                <span className="text-[10px] text-slate-500 block">Apollo Specialty Clinic Network</span>
              </div>

              <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">R. Patel, Lead Systems Architect</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    SAMPLE REVIEW
                  </span>
                </div>
                <p className="text-[#9aa0a6] italic">
                  "The RFC formatting is crisp, deterministic, and board-ready. No AI fluff—just pure motivation, risks, and timeline extraction."
                </p>
                <span className="text-[10px] text-slate-500 block">Fintech Infrastructure Group</span>
              </div>

              <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">S. Desai, Senior Property Inspector</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    SAMPLE REVIEW
                  </span>
                </div>
                <p className="text-[#9aa0a6] italic">
                  "Commercial inspection registers generate on-site from raw voice dictation effortlessly. The structured findings save our team 15 hours every week."
                </p>
                <span className="text-[10px] text-slate-500 block">Metro Commercial Inspections</span>
              </div>
            </div>
          </div>
        )}

        {type === 'demo' && (
          <div className="space-y-4 text-xs text-[#c4c7c5]">
            <p>
              Schedule a personalized 20-minute walkthrough with our founding engineering team. We'll demonstrate deterministic SOAP notes, custom template setup, and team workspace deployment.
            </p>
            <div className="p-4 rounded-xl bg-[#131314] border border-[#2d2e30] flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Google Calendar / Calendly Booking</span>
                <span className="text-[11px] text-[#9aa0a6] font-mono">{DEMO_BOOKING_URL}</span>
              </div>
              <a
                href={DEMO_BOOKING_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition cursor-pointer"
              >
                <span>Open Calendar</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
