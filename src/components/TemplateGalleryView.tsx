import React, { useState } from 'react';
import {
  FileText,
  Stethoscope,
  Briefcase,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Sparkles,
  Search,
} from 'lucide-react';

interface TemplateGalleryViewProps {
  onSelectTemplate: (templateType: string, sampleInput: string) => void;
  onBack: () => void;
}

interface GalleryTemplate {
  slug: string;
  id: string;
  title: string;
  category: 'clinical' | 'enterprise';
  description: string;
  sections: string[];
  rawInput: string;
  structuredOutput: Record<string, string>;
}

export const TEMPLATE_GALLERY_DATA: GalleryTemplate[] = [
  {
    slug: 'soap-note',
    id: 'soap',
    title: 'Clinical SOAP Note',
    category: 'clinical',
    description: 'Standard clinical note for outpatient encounters, primary care, and specialty visits.',
    sections: ['Subjective', 'Objective', 'Assessment', 'Plan'],
    rawInput: '45M, chest pain 2 days, worse on exertion. BP 150/95, HR 92. ECG normal. Started aspirin 75mg. Review in 1 week.',
    structuredOutput: {
      Subjective: '45-year-old male presenting with chest pain of 2 days duration, described as worse on physical exertion.',
      Objective: 'Vital Signs: Blood Pressure 150/95 mmHg, Heart Rate 92 bpm. Diagnostics: ECG performed and reported normal.',
      Assessment: 'Not documented',
      Plan: 'Initiated Aspirin 75mg daily. Scheduled clinical review in 1 week.',
    },
  },
  {
    slug: 'rfc',
    id: 'rfc',
    title: 'Engineering RFC (Request for Comments)',
    category: 'enterprise',
    description: 'Architectural decision record and technical change proposal for engineering and product teams.',
    sections: ['Title', 'Summary', 'Motivation', 'Proposal', 'Alternatives', 'Risks', 'Rollout', 'Open Questions'],
    rawInput: 'Move login to Google sign-in to cut password resets. Risk: users without Google. Rollout in 2 weeks.',
    structuredOutput: {
      Title: 'Transition Authentication to Google Sign-In',
      Summary: 'Proposal to deprecate local passwords in favor of Google OAuth single sign-on.',
      Motivation: 'Eliminate password reset support tickets and reduce authentication friction.',
      Proposal: 'Integrate Google Sign-In SDK across web and mobile client applications.',
      Alternatives: 'Not documented',
      Risks: 'Impact on users without active Google accounts.',
      Rollout: 'Targeted rollout schedule over the next 2 weeks.',
      'Open Questions': 'Not documented',
    },
  },
  {
    slug: 'memo',
    id: 'memo',
    title: 'Executive Memo',
    category: 'enterprise',
    description: 'Internal corporate communication for announcements, operational policies, and policy changes.',
    sections: ['To', 'From', 'Date', 'Subject', 'Purpose', 'Background', 'Recommendation', 'Next Steps'],
    rawInput: 'From Ops to all staff: office closed Friday for maintenance. Work from home.',
    structuredOutput: {
      To: 'All Staff',
      From: 'Ops',
      Date: 'Not documented',
      Subject: 'Office Closure for Scheduled Maintenance',
      Purpose: 'Notify employees regarding physical facility maintenance.',
      Background: 'Scheduled facility maintenance operations on Friday.',
      Recommendation: 'All personnel to work remotely from home on Friday.',
      'Next Steps': 'Not documented',
    },
  },
  {
    slug: 'discharge-summary',
    id: 'discharge_summary',
    title: 'Hospital Discharge Summary',
    category: 'clinical',
    description: 'Inpatient discharge document summarizing hospital course, discharge medications, and follow-up care.',
    sections: ['Patient Name / ID', 'Admission Date', 'Discharge Date', 'Diagnosis', 'Course in Hospital', 'Discharge Medications', 'Follow-up Plan'],
    rawInput: 'Pt John Doe ID 9821. Adm 10 Oct, Disch 14 Oct. Acute appendicitis. Laparoscopic appendectomy without complications. Discharged on Amoxicillin 500mg. Follow up in 10 days.',
    structuredOutput: {
      'Patient Name / ID': 'John Doe (ID 9821)',
      'Admission Date': '10 Oct',
      'Discharge Date': '14 Oct',
      Diagnosis: 'Acute appendicitis',
      'Course in Hospital': 'Underwent laparoscopic appendectomy without procedural or postoperative complications.',
      'Discharge Medications': 'Amoxicillin 500mg',
      'Follow-up Plan': 'Surgical clinic follow-up in 10 days.',
    },
  },
  {
    slug: 'referral-letter',
    id: 'referral_letter',
    title: 'Clinical Referral Letter',
    category: 'clinical',
    description: 'Inter-specialty referral letter providing clinical context and requested consult.',
    sections: ['To', 'From', 'Date', 'Patient Name', 'Reason for Referral', 'Clinical Summary', 'Requested Action'],
    rawInput: 'To Cardiology Dr. Smith from Dr. Patel on 12 Oct. Ref Jane Miller for persistent palpitations and PVCs on Holter. Please evaluate for electrophysiology study.',
    structuredOutput: {
      To: 'Dr. Smith (Cardiology)',
      From: 'Dr. Patel',
      Date: '12 Oct',
      'Patient Name': 'Jane Miller',
      'Reason for Referral': 'Persistent palpitations and premature ventricular contractions (PVCs) documented on Holter monitor.',
      'Clinical Summary': 'Patient presents with ongoing cardiac palpitations with Holter monitoring demonstrating frequent PVCs.',
      'Requested Action': 'Cardiology evaluation and opinion regarding electrophysiology study.',
    },
  },
  {
    slug: 'progress-note',
    id: 'progress_note',
    title: 'Inpatient / Outpatient Progress Note',
    category: 'clinical',
    description: 'Daily clinical progress evaluation for hospitalized or returning outpatient visits.',
    sections: ['Patient Name / ID', 'Date', 'Subjective Update', 'Objective Findings', 'Current Assessment', 'Updated Plan'],
    rawInput: 'Pt Mary Lawson Day 3 post-hip surgery. Pain controlled 3/10. Afebrile, BP 122/78. Wound clean. Continue physical therapy.',
    structuredOutput: {
      'Patient Name / ID': 'Mary Lawson',
      Date: 'Day 3 post-hip surgery',
      'Subjective Update': 'Patient reports pain is well controlled, rated 3/10.',
      'Objective Findings': 'Afebrile, Blood Pressure 122/78 mmHg. Surgical wound appears clean.',
      'Current Assessment': 'Stable postoperative status following hip surgery.',
      'Updated Plan': 'Continue prescribed physical therapy regimen.',
    },
  },
  {
    slug: 'incident-report',
    id: 'incident_report',
    title: 'Enterprise Incident Report',
    category: 'enterprise',
    description: 'Post-incident analysis for IT outages, workplace safety, or security breaches.',
    sections: ['Date / Time', 'Location & Personnel', 'Incident Description', 'Immediate Action Taken', 'Root Cause Analysis', 'Corrective Actions'],
    rawInput: 'Inc 14 Oct 03:00. DB server outage in EU region. Lead engineer Sarah. Restarted cluster. Unindexed query flooded memory. Added database index and rate limiting.',
    structuredOutput: {
      'Date / Time': '14 Oct 03:00',
      'Location & Personnel': 'EU region database server. Lead engineer: Sarah.',
      'Incident Description': 'Database server outage in EU region.',
      'Immediate Action Taken': 'Database cluster restarted.',
      'Root Cause Analysis': 'Unindexed database query flooded server memory capacity.',
      'Corrective Actions': 'Implemented database index and added API rate limiting.',
    },
  },
  {
    slug: 'meeting-minutes',
    id: 'meeting_minutes',
    title: 'Executive Meeting Minutes',
    category: 'enterprise',
    description: 'Structured record of discussions, decisions, and assigned action items from leadership meetings.',
    sections: ['Date & Location', 'Attendees', 'Agenda Items', 'Key Decisions', 'Action Items & Owners'],
    rawInput: 'Product sync Oct 14 via Zoom. CEO Jayesh, CTO Alex. Approved Q4 roadmap. Alex to hire 2 senior frontend devs by Nov 1.',
    structuredOutput: {
      'Date & Location': 'Oct 14 via Zoom',
      Attendees: 'CEO Jayesh, CTO Alex',
      'Agenda Items': 'Product synchronization and Q4 roadmap planning.',
      'Key Decisions': 'Approved Q4 product roadmap.',
      'Action Items & Owners': 'Alex to hire 2 senior frontend developers by Nov 1.',
    },
  },
  {
    slug: 'sop',
    id: 'sop',
    title: 'Standard Operating Procedure (SOP)',
    category: 'enterprise',
    description: 'Step-by-step procedural guidelines for quality control, compliance, and onboarding.',
    sections: ['Title', 'Purpose', 'Scope', 'Responsibilities', 'Step-by-Step Procedure', 'Quality Checks'],
    rawInput: 'SOP for Daily EMR Backup. Ensure patient records backed up nightly at 23:00. Sysadmin responsible. Run backup script, verify checksum, log completion.',
    structuredOutput: {
      Title: 'SOP for Daily EMR Backup',
      Purpose: 'Ensure patient records are securely backed up nightly at 23:00.',
      Scope: 'Electronic Medical Record system databases.',
      Responsibilities: 'System Administrator',
      'Step-by-Step Procedure': '1. Execute backup script nightly at 23:00.\n2. Verify backup file checksum.\n3. Log successful completion in operational ledger.',
      'Quality Checks': 'Not documented',
    },
  },
];

export const TemplateGalleryView: React.FC<TemplateGalleryViewProps> = ({
  onSelectTemplate,
  onBack,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string>('soap-note');
  const [searchQuery, setSearchQuery] = useState('');

  const currentTemplate =
    TEMPLATE_GALLERY_DATA.find((t) => t.slug === selectedSlug) || TEMPLATE_GALLERY_DATA[0];

  const filteredTemplates = TEMPLATE_GALLERY_DATA.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2d2e30] pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white transition"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Layers size={22} className="text-[#4e8cff]" />
                <h1 className="text-2xl font-bold text-white">Public Template Gallery</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e1f20] text-[#10b981] border border-[#10b981]/30 font-mono">
                  Fixed Schemas
                </span>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Deterministic, fixed-order templates for clinical encounters and enterprise documentation. Same input, same output.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Template List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates (SOAP, RFC, SOP...)"
                className="w-full bg-[#1e1f20] border border-[#3c4043]/50 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#4e8cff]"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredTemplates.map((tpl) => {
                const isSelected = tpl.slug === currentTemplate.slug;
                return (
                  <button
                    key={tpl.slug}
                    onClick={() => setSelectedSlug(tpl.slug)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-[#2d2e30] border-[#4e8cff] shadow-md'
                        : 'bg-[#1e1f20] border-[#3c4043]/40 hover:border-[#3c4043]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tpl.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          tpl.category === 'clinical'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9aa0a6] line-clamp-2">{tpl.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Template Example Preview & "Try it free" Button */}
          <div className="lg:col-span-8 bg-[#1e1f20] border border-[#3c4043]/50 rounded-2xl p-6 space-y-6 shadow-2xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3c4043]/50 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4e8cff] mb-1">
                  {currentTemplate.category === 'clinical' ? (
                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Briefcase className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="capitalize">{currentTemplate.category} Template Spec</span>
                </div>
                <h2 className="text-xl font-bold text-white">{currentTemplate.title}</h2>
                <p className="text-xs text-[#9aa0a6] mt-1">{currentTemplate.description}</p>
              </div>

              <button
                onClick={() => onSelectTemplate(currentTemplate.id, currentTemplate.rawInput)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#4e8cff]/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Try it free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Template Fixed Section Order Pills */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#9aa0a6] uppercase tracking-wider block">
                Fixed Section Order ({currentTemplate.sections.length} sections)
              </span>
              <div className="flex flex-wrap gap-2">
                {currentTemplate.sections.map((sec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-[#131314] border border-[#3c4043]/50 text-xs font-semibold text-[#e3e3e3] flex items-center gap-1.5"
                  >
                    <span className="text-[10px] text-[#4e8cff] font-mono">{idx + 1}.</span>
                    <span>{sec}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Before vs After Side-by-Side Example */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Before: Raw Input */}
              <div className="p-4 rounded-xl bg-[#131314] border border-[#3c4043]/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>BEFORE: Raw Input</span>
                  <span className="text-[10px] font-mono text-[#9aa0a6]">Unstructured</span>
                </div>
                <p className="text-xs text-[#c4c7c5] font-mono leading-relaxed bg-[#1a1b1e] p-3 rounded-lg border border-[#2d2e30]">
                  "{currentTemplate.rawInput}"
                </p>
              </div>

              {/* After: Structured Output */}
              <div className="p-4 rounded-xl bg-[#131314] border border-[#10b981]/40 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>AFTER: Structured Output</span>
                  <span className="text-[10px] font-mono text-emerald-300">Deterministic JSON</span>
                </div>

                <div className="space-y-2 text-xs">
                  {Object.entries(currentTemplate.structuredOutput).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded-lg bg-[#1a1b1e] border border-[#2d2e30]">
                      <span className="text-[10px] font-bold text-[#4e8cff] uppercase block mb-0.5">
                        {k}
                      </span>
                      <span className="text-[#e3e3e3] leading-relaxed">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom CTA */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#1e1f20] via-[#28292c] to-[#1e1f20] border border-[#3c4043]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#c4c7c5]">
                <span className="font-bold text-white">Need a custom EMR or enterprise template?</span>
                <span className="block text-[11px] text-[#9aa0a6]">
                  Order a custom template build for a one-time fee of ₹2,999 per schema.
                </span>
              </div>
              <button
                onClick={() => onSelectTemplate(currentTemplate.id, currentTemplate.rawInput)}
                className="px-4 py-2 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] text-white font-bold text-xs transition cursor-pointer shrink-0"
              >
                Use Template Now
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
