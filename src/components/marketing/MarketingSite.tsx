import React, { useState } from 'react';
import { 
  Sparkles, 
  Stethoscope, 
  Briefcase, 
  Cpu, 
  Building2, 
  ArrowRight, 
  Check, 
  Copy, 
  Download, 
  ShieldCheck, 
  Lock, 
  Zap, 
  FileText, 
  Play, 
  ChevronDown, 
  Search, 
  Globe, 
  Layers, 
  Activity, 
  CheckCircle2, 
  ExternalLink,
  RefreshCw,
  Sliders,
  Award,
  Users,
  Compass,
  X,
  Quote
} from 'lucide-react';
import { CEOSection } from '../CEOSection';
import { UserUsageState, UserProfile } from '../../types';
import { TESTIMONIALS, VERIFIED_CLINICS_COUNT, hasRealTestimonials } from '../../data/testimonials';

interface MarketingSiteProps {
  onLaunchApp: () => void;
  onOpenPricing: () => void;
  onOpenBlog?: (slug?: string | null) => void;
  usageState?: UserUsageState;
  currentUser?: UserProfile | null;
}

// -------------------------------------------------------------
// Audience Showcase Data (Clinics & Companies) - Requirement 1
// -------------------------------------------------------------
export const DEMO_LINK = 'https://cal.com/pulsenote-demo';

export const CLINIC_AUDIENCE_SAMPLES = [
  {
    id: 'soap',
    title: 'SOAP Note',
    subtitle: 'Standardized clinical outpatient note',
    badge: 'Outpatient Encounter',
    before: '45M, acute onset substernal chest pain 2 days, worse on exertion. BP 150/95, HR 92. ECG normal. Started aspirin 75mg. Review in 1 week.',
    sections: [
      { label: 'Subjective', text: '45-year-old male presents with acute onset substernal chest pain for 2 days, worse on exertion. No other symptoms reported.' },
      { label: 'Objective', text: 'Blood pressure: 150/95 mmHg, heart rate: 92 bpm. Electrocardiogram (ECG): normal.' },
      { label: 'Assessment', text: 'Not specified in transcript' },
      { label: 'Plan', text: 'Started aspirin 75mg orally. Review in 1 week.' },
    ],
    isClinical: true,
  },
  {
    id: 'discharge',
    title: 'Discharge Summary',
    subtitle: 'Inpatient hospital course & care transition',
    badge: 'Inpatient Medicine',
    before: 'Adm: 10-Oct, Disch: 14-Oct. 62F acute bacterial pneumonia. Sputum Strep pneumoniae. IV Ceftriaxone switched to oral Augmentin. Afebrile 48h, SpO2 98%. Meds: Augmentin 875/125 BID x 5d. F/u pulmonology in 3 weeks.',
    sections: [
      { label: 'Patient Demographics', text: '62-year-old female' },
      { label: 'Admission Date', text: '10-Oct' },
      { label: 'Discharge Date', text: '14-Oct' },
      { label: 'Admission Diagnosis', text: 'Acute bacterial pneumonia' },
      { label: 'Discharge Diagnosis', text: 'Resolved Streptococcus pneumoniae bacterial pneumonia' },
      { label: 'Hospital Course', text: 'Treated with IV Ceftriaxone, transitioned to oral amoxicillin-clavulanate. Afebrile for 48 hours with ambient oxygen saturation 98%.' },
      { label: 'Discharge Medications', text: 'Amoxicillin-clavulanate 875/125mg twice daily for 5 days.' },
      { label: 'Follow-up Instructions', text: 'Follow up with pulmonology clinic in 3 weeks.' },
    ],
    isClinical: true,
  },
  {
    id: 'referral',
    title: 'Referral Letter',
    subtitle: 'Specialist consultation transfer',
    badge: 'Specialist Referral',
    before: 'Ref from Dr. Jayesh to Dr. Sharma (Endocrinology). 58M Ramesh Patel. Type 2 diabetes HbA1c 9.4% on Metformin 1000 BID, Glimepiride 4mg daily. Burning feet 3 months. Requesting evaluation for GLP-1 and neuropathy.',
    sections: [
      { label: 'Referring Provider', text: 'Dr. Jayesh, Internal Medicine' },
      { label: 'Receiving Specialist', text: 'Dr. Sharma, Endocrinology' },
      { label: 'Patient Information', text: 'Ramesh Patel, 58-year-old male' },
      { label: 'Reason for Referral', text: 'Uncontrolled Type 2 Diabetes Mellitus with neuropathic symptoms' },
      { label: 'Clinical Summary', text: '58yo male with poorly controlled T2DM (HbA1c 9.4%) and bilateral lower extremity neuropathic burning for 3 months.' },
      { label: 'Current Medications', text: 'Metformin 1000mg twice daily, Glimepiride 4mg daily.' },
      { label: 'Requested Action', text: 'Specialist consultation for GLP-1 receptor agonist therapy and peripheral neuropathy management.' },
    ],
    isClinical: true,
  },
];

export const COMPANY_AUDIENCE_SAMPLES = [
  {
    id: 'rfc',
    title: 'Engineering RFC',
    subtitle: 'Architecture request for comments',
    badge: 'Engineering & Tech',
    before: 'Move login to Google sign-in to cut password resets. Risk: users without Google. Rollout in 2 weeks.',
    sections: [
      { label: 'Title', text: 'Migrate Primary Login Flow to Google Sign-In' },
      { label: 'Summary', text: 'Move login to Google sign-in to cut password resets.' },
      { label: 'Motivation', text: 'Cut password resets and streamline employee access.' },
      { label: 'Proposal', text: 'Move login to Google sign-in as primary identity provider.' },
      { label: 'Alternatives', text: 'Not specified in transcript' },
      { label: 'Risks', text: 'Users without Google accounts may be unable to authenticate.' },
      { label: 'Rollout', text: 'Rollout in 2 weeks.' },
      { label: 'Open Questions', text: 'Not specified in transcript' },
    ],
    isClinical: false,
  },
  {
    id: 'memo',
    title: 'Executive Decision Memo',
    subtitle: 'Leadership decision & alignment brief',
    badge: 'Operations & Strategy',
    before: 'From Ops to all staff: office closed Friday for maintenance. Work from home.',
    sections: [
      { label: 'To', text: 'All staff' },
      { label: 'From', text: 'Ops' },
      { label: 'Date', text: 'Not specified in transcript' },
      { label: 'Subject', text: 'Office closed Friday for maintenance' },
      { label: 'Purpose', text: 'Office closed Friday for scheduled maintenance' },
      { label: 'Background', text: 'Not specified in transcript' },
      { label: 'Recommendation', text: 'Work from home' },
      { label: 'Next Steps', text: 'Not specified in transcript' },
    ],
    isClinical: false,
  },
  {
    id: 'incident',
    title: 'Incident Report',
    subtitle: 'Outage post-mortem & root cause record',
    badge: 'DevOps & SRE',
    before: 'Incident on 14-Oct 14:15 UTC. DB CPU 100%, 504 errors for 18 mins. On-call switched read replica, killed slow query. Restored 14:33. Root cause: unindexed query on orders table from manual export. Action: add index, lint in CI.',
    sections: [
      { label: 'Date & Time of Incident', text: '14-Oct, 14:15 UTC to 14:33 UTC (18 minutes total)' },
      { label: 'Location & Parties Involved', text: 'Production Database Cluster, On-call engineer' },
      { label: 'Description of Incident', text: 'Production database CPU reached 100%, causing 504 gateway timeout errors for 18 minutes.' },
      { label: 'Immediate Actions Taken', text: 'On-call engineer switched read traffic to replica and terminated long-running blocking query.' },
      { label: 'Root Cause / Findings', text: 'Unindexed query executed on orders table triggered by manual export script.' },
      { label: 'Corrective & Preventive Actions', text: 'Add composite index on orders table; enforce SQL query index linting in CI pipeline.' },
    ],
    isClinical: false,
  },
];

type ClinicalSpecialty = 'Primary Care' | 'Endocrinology' | 'Cardiology' | 'Urgent Care' | 'General';

const CLINICAL_SPECIALTIES: ClinicalSpecialty[] = [
  'Primary Care',
  'Endocrinology',
  'Cardiology',
  'Urgent Care',
  'General',
];

const CLINICAL_SOAP_PRESETS: Array<{
  title: string;
  badge: string;
  specialty: ClinicalSpecialty;
  transcript: string;
}> = [
  {
    title: 'Primary Care: Hypertension & Annual Follow-Up',
    badge: 'Primary Care',
    specialty: 'Primary Care',
    transcript: `Primary care visit: 54-year-old male presents for 3-month hypertension follow-up and routine preventive review. Reports taking Amlodipine 5mg daily without side effects, occasional mild ankle swelling in the evening. Home BP readings average 134/84. Denies chest pain, dyspnea, headaches, or visual changes. Vitals today: BP 136/86 mmHg, HR 72, BMI 27.8. Exam: Heart regular rate and rhythm without murmurs, lungs clear bilaterally, trace bilateral pedal edema. Labs from last week: Creatinine 0.92, K+ 4.1, LDL 118. Plan: Continue Amlodipine 5mg daily, reinforce DASH diet and 150 min/week brisk walking, order fasting lipid panel and HbA1c screening, return in 3 months.`,
  },
  {
    title: 'Endocrinology: Type 2 Diabetes & Neuropathy',
    badge: 'Endocrinology',
    specialty: 'Endocrinology',
    transcript: `Endocrinology follow-up: 62-year-old female presents for 6-month diabetic evaluation. States her feet have been burning and prickly at night for 3 months. Fasting blood sugars at home running 160 to 195. Takes Metformin 1000mg twice daily and Glipizide 5mg daily. Vitals: BP 142/88 mmHg, HR 78, Weight 184 lbs, BMI 31.2. Point-of-care HbA1c is 8.6% today (up from 7.4% 6 months ago). Foot inspection: No open ulcerations or calluses, bilateral loss of protective sensation to 10g monofilament on plantar surfaces, DP pulses 2+ bilaterally. Plan: Add Empagliflozin 10mg daily, start Gabapentin 100mg TID for neuropathic burning, order urine microalbumin/creatinine ratio and lipid panel, follow up in 6 weeks.`,
  },
  {
    title: 'Urgent Care: Acute Bronchitis',
    badge: 'Urgent Care',
    specialty: 'Urgent Care',
    transcript: `Urgent care visit: 34yo non-smoker female with 5-day history of worsening dry hacking cough, low-grade subjective fever, and anterior chest soreness with coughing. Denies dyspnea at rest, hemoptysis, or calf pain. Vitals: Temp 99.8 F, BP 118/76, HR 82, RR 16, SpO2 99% on room air. Exam: Pharynx clear without exudate. Lungs show diffuse coarse rhonchi bilaterally clearing partially with coughing. Rapid COVID/Flu PCR negative. Assessment: Acute viral bronchitis. Plan: Benzonatate 200mg TID PRN cough, albuterol inhaler 2 puffs Q4-6H PRN wheeze, oral fluids, no antibiotics. Return precautions given for fever >101 F or dyspnea.`,
  },
  {
    title: 'Cardiology: Post-PCI Follow-Up',
    badge: 'Cardiology',
    specialty: 'Cardiology',
    transcript: `Cardiology follow-up for 67yo male, 8 weeks status-post drug-eluting stent to proximal LAD for STEMI. Walking 30 minutes daily without angina, palpitations, or orthopnea. Medications: Aspirin 81mg, Ticagrelor 90mg BID, Atorvastatin 80mg, Metoprolol succinate 50mg, Ramipril 5mg. Vitals: BP 112/68, HR 58 regular, SpO2 98%. Exam: JVP flat, normal S1/S2 without murmurs, lungs clear, no peripheral edema. Recent Echo: LVEF 48%, mild anterior hypokinesis. Assessment: Stable post-PCI on optimal GDMT. Plan: Continue DAPT for 12 months minimum, recheck lipid panel and LFTs in 4 weeks, continue cardiac rehab.`,
  },
];

export const MarketingSite: React.FC<MarketingSiteProps> = ({
  onLaunchApp,
  onOpenPricing,
  onOpenBlog,
  usageState: _usageState,
  currentUser: _currentUser,
}) => {
  // Audience tabs (For Clinics & For Companies)
  const [audienceTab, setAudienceTab] = useState<'clinics' | 'companies'>('clinics');
  const [activeClinicSample, setActiveClinicSample] = useState(0);
  const [activeCompanySample, setActiveCompanySample] = useState(0);

  // Specialty filter + SOAP Demo interactive state
  const [selectedSpecialty, setSelectedSpecialty] = useState<ClinicalSpecialty>('Primary Care');
  const [activeSoapPreset, setActiveSoapPreset] = useState(0);
  const [soapInputText, setSoapInputText] = useState(CLINICAL_SOAP_PRESETS[0].transcript);
  const [isSoapGenerating, setIsSoapGenerating] = useState(false);
  const [soapCopied, setSoapCopied] = useState(false);
  const [soapViewMode, setSoapViewMode] = useState<'structured' | 'raw_emr'>('structured');
  const [soapLiveOutput, setSoapLiveOutput] = useState<string | null>(null);
  const [soapError, setSoapError] = useState<string | null>(null);

  // FAQ interactive state
  const [faqCategory, setFaqCategory] = useState<'all' | 'clinical' | 'models' | 'security' | 'pricing'>('all');
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Pricing currency state
  const [pricingCurrency, setPricingCurrency] = useState<'INR' | 'USD'>('INR');
  const [pricingAnnual, setPricingAnnual] = useState(true);

  // CEO Persona & Press Kit Modal state
  const [showCeoModal, setShowCeoModal] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Handle specialty filter change
  const handleSelectSpecialty = (specialty: ClinicalSpecialty) => {
    setSelectedSpecialty(specialty);
    const matchIndex = CLINICAL_SOAP_PRESETS.findIndex((p) => p.specialty === specialty);
    const nextIndex = matchIndex >= 0 ? matchIndex : 0;
    setActiveSoapPreset(nextIndex);
    setSoapInputText(CLINICAL_SOAP_PRESETS[nextIndex].transcript);
    setSoapLiveOutput(null);
    setSoapError(null);
  };

  // Handle preset selection in SOAP demo
  const handleSelectSoapPreset = (index: number) => {
    setActiveSoapPreset(index);
    setSelectedSpecialty(CLINICAL_SOAP_PRESETS[index].specialty);
    setSoapInputText(CLINICAL_SOAP_PRESETS[index].transcript);
    setSoapLiveOutput(null);
    setSoapError(null);
  };

  // Generate a live Clinical SOAP note from the textarea via the real /api/chat engine
  const handleGenerateSoap = async () => {
    const rawText = typeof soapInputText === 'string' ? soapInputText.trim() : '';
    if (!rawText) {
      setSoapError('Please enter a clinical dictation or transcript first.');
      return;
    }
    setIsSoapGenerating(true);
    setSoapError(null);
    setSoapLiveOutput(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: rawText,
          role: 'medical',
          industryMode: 'medical',
          model: '2.5 Flash',
          stream: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `SOAP generation failed (${res.status})`);
      }
      const reply = data.reply || data.text || '';
      if (!reply) {
        throw new Error('Empty response from the clinical engine.');
      }
      setSoapLiveOutput(reply);
    } catch (err: any) {
      setSoapError(err?.message || 'Clinical SOAP generation failed. Please try again.');
    } finally {
      setIsSoapGenerating(false);
    }
  };

  const handleCopySoap = (text: string) => {
    navigator.clipboard.writeText(text);
    setSoapCopied(true);
    setTimeout(() => setSoapCopied(false), 2000);
  };

  // Structured SOAP Output based on selected preset
  const currentSoapOutput = {
    subjective: [
      {
        field: 'Chief Complaint',
        value:
          activeSoapPreset === 0
            ? '3-month hypertension follow-up and preventive review'
            : activeSoapPreset === 1
              ? 'Bilateral burning foot pain (3 mos); diabetic evaluation'
              : activeSoapPreset === 2
                ? 'Worsening dry hacking cough & chest tightness (5 days)'
                : 'Routine 8-week post-STEMI / LAD stenting evaluation',
      },
      {
        field: 'History of Present Illness',
        value:
          activeSoapPreset === 0
            ? '54yo male taking Amlodipine 5mg daily with average home BP 134/84 and mild evening ankle swelling. Denies chest pain, dyspnea, headaches, or visual changes.'
            : activeSoapPreset === 1
              ? '62yo female with T2DM reports progressive nocturnal burning and paresthesias in bilateral lower extremities. Home FSG running 160-195 mg/dL.'
              : activeSoapPreset === 2
                ? '34yo female non-smoker with acute onset dry cough, low-grade fevers, and anterior chest soreness with coughing.'
                : '67yo male s/p LAD stent 8 weeks ago. Walking 30 min/day with zero angina, dyspnea, or presyncope.',
      },
      {
        field: 'Current Medications',
        value:
          activeSoapPreset === 0
            ? 'Amlodipine 5mg PO daily'
            : activeSoapPreset === 1
              ? 'Metformin 1000mg PO BID, Glipizide 5mg PO daily'
              : activeSoapPreset === 2
                ? 'Not specified in transcript'
                : 'Aspirin 81mg, Ticagrelor 90mg BID, Atorvastatin 80mg, Metoprolol Succinate 50mg, Ramipril 5mg',
      },
      { field: 'Allergies', value: 'Not specified in transcript' },
    ],
    objective: [
      {
        field: 'Vital Signs',
        value:
          activeSoapPreset === 0
            ? 'BP: 136/86 mmHg | HR: 72 bpm | BMI: 27.8'
            : activeSoapPreset === 1
              ? 'BP: 142/88 mmHg | HR: 78 bpm | Wt: 184 lbs | BMI: 31.2'
              : activeSoapPreset === 2
                ? 'Temp: 99.8°F | BP: 118/76 mmHg | HR: 82 bpm | SpO2: 99% RA'
                : 'BP: 112/68 mmHg | HR: 58 bpm | SpO2: 98% RA',
      },
      {
        field: 'Diagnostics / Labs',
        value:
          activeSoapPreset === 0
            ? 'Creatinine: 0.92 | K+: 4.1 | LDL: 118'
            : activeSoapPreset === 1
              ? 'POC HbA1c: 8.6% (up from 7.4% 6 months ago)'
              : activeSoapPreset === 2
                ? 'Rapid COVID-19 / Influenza PCR: Negative'
                : 'Recent Echo: LVEF 48%, mild anterior hypokinesis',
      },
      {
        field: 'Physical Examination',
        value:
          activeSoapPreset === 0
            ? 'Heart RRR without murmurs, lungs clear bilaterally, trace bilateral pedal edema.'
            : activeSoapPreset === 1
              ? 'Intact skin, no ulcers. Decreased 10g monofilament sensation bilaterally. DP pulses 2+.'
              : activeSoapPreset === 2
                ? 'Pharynx clear. Diffuse coarse bilateral rhonchi clearing partially with cough.'
                : 'JVP flat. Normal S1/S2 without murmurs, lungs clear, no peripheral edema.',
      },
    ],
    assessment: [
      {
        icd: activeSoapPreset === 0 ? 'I10' : activeSoapPreset === 1 ? 'E11.42' : activeSoapPreset === 2 ? 'J20.9' : 'I25.10',
        title:
          activeSoapPreset === 0
            ? 'Essential (Primary) Hypertension'
            : activeSoapPreset === 1
              ? 'Type 2 Diabetes Mellitus with Diabetic Polyneuropathy'
              : activeSoapPreset === 2
                ? 'Acute Viral Bronchitis'
                : 'Atherosclerotic Heart Disease s/p LAD Stent',
        notes:
          activeSoapPreset === 0
            ? 'Mildly elevated office BP (136/86) with home average 134/84 on Amlodipine 5mg.'
            : activeSoapPreset === 1
              ? 'HbA1c elevated at 8.6% with characteristic distal sensory neuropathy.'
              : activeSoapPreset === 2
                ? 'Viral presentation; rapid COVID/Flu negative.'
                : 'Post-infarction status stable on guideline-directed medical therapy.',
      },
    ],
    plan: [
      {
        category: 'Pharmacotherapy',
        details:
          activeSoapPreset === 0
            ? 'Continue Amlodipine 5mg daily.'
            : activeSoapPreset === 1
              ? 'Add Empagliflozin 10mg daily. Start Gabapentin 100mg PO TID for neuropathic symptoms.'
              : activeSoapPreset === 2
                ? 'Benzonatate 200mg PO TID PRN cough, albuterol inhaler 2 puffs Q4-6H PRN wheeze. No antibiotics.'
                : 'Continue DAPT (Aspirin + Ticagrelor) for 12 months minimum.',
      },
      {
        category: 'Diagnostics Ordered',
        details:
          activeSoapPreset === 0
            ? 'Order fasting lipid panel and HbA1c screening.'
            : activeSoapPreset === 1
              ? 'Order urine microalbumin/creatinine ratio and lipid panel.'
              : activeSoapPreset === 2
                ? 'Not specified in transcript'
                : 'Recheck lipid panel and LFTs in 4 weeks.',
      },
      {
        category: 'Follow-up Interval',
        details:
          activeSoapPreset === 0
            ? 'Return in 3 months; reinforce DASH diet and 150 min/week brisk walking.'
            : activeSoapPreset === 1
              ? 'Follow up in 6 weeks.'
              : activeSoapPreset === 2
                ? 'Return precautions for fever >101°F or dyspnea.'
                : 'Continue cardiac rehab.',
      },
    ],
  };

  // Full EMR Raw string for copy/export — prefers the live API output
  const rawEmrText = soapLiveOutput
    ? `=== PULSE NOTE AI CLINICAL SUMMARY ===\nPATIENT ENCOUNTER: ${CLINICAL_SOAP_PRESETS[activeSoapPreset].title}\nTIMESTAMP: ${new Date().toISOString()}\nNOTICE: AI-assisted draft. Do not enter patient-identifying information.\n\n${soapLiveOutput}\n=======================================`
    : `=== PULSE NOTE AI CLINICAL SUMMARY ===
PATIENT ENCOUNTER: ${CLINICAL_SOAP_PRESETS[activeSoapPreset].title}
TIMESTAMP: ${new Date().toISOString()}
NOTICE: AI-assisted draft. Do not enter patient-identifying information.

[SUBJECTIVE]
${currentSoapOutput.subjective.map(s => `• ${s.field}: ${s.value}`).join('\n')}

[OBJECTIVE]
${currentSoapOutput.objective.map(o => `• ${o.field}: ${o.value}`).join('\n')}

[ASSESSMENT]
${currentSoapOutput.assessment.map(a => `• Primary Diagnosis: ${a.title} [ICD-10: ${a.icd}]\n  Clinical Context: ${a.notes}`).join('\n')}

[PLAN]
${currentSoapOutput.plan.map(p => `• ${p.category}: ${p.details}`).join('\n')}
=======================================`;

  // FAQs Data
  // FAQs Data (Requirement 7)
  const FAQ_LIST = [
    {
      category: 'clinical',
      question: 'Is it a medical device?',
      answer: 'No — documentation aid only. Pulse Note AI is an administrative transcription and formatting aid. It does not diagnose, provide treatment plans, or dispense clinical advice. All generated documents are AI-assisted drafts that a licensed professional must review before use.'
    },
    {
      category: 'security',
      question: 'Who owns my notes?',
      answer: 'Your notes stay in your account. You can delete them at any time. You retain 100% intellectual property ownership over your raw transcripts, formatted notes, and exports. We never sell your data or train foundation models on private customer notes.'
    },
    {
      category: 'pricing',
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel anytime. There are no long-term lock-ins or cancellation fees. You can manage or cancel your subscription directly from your Billing settings, and your plan features will remain active until the end of your billing cycle.'
    },
    {
      category: 'clinical',
      question: 'How does Pulse Note AI handle patient data privacy?',
      answer: 'Your notes stay in your account and you can delete them at any time. All transmission is encrypted via HTTPS/TLS. As a best practice, do not enter direct patient-identifying information into dictation fields.'
    },
    {
      category: 'clinical',
      question: 'Can Pulse Note AI output into our clinic’s specific EHR or EMR templates?',
      answer: 'Yes. Pulse Note AI provides standardized SOAP, Discharge Summary, and Referral Letter formats designed for quick copy-paste or PDF/Word download. You can also order custom template builds matching your exact clinic workflow.'
    },
    {
      category: 'pricing',
      question: 'What is included in the Free tier versus the Pro and Team subscriptions?',
      answer: 'The Free tier includes 5 documents a month with 3 basic templates and watermark. Pro (₹699/mo or ₹5,508/yr one-time, save 34%) unlocks unlimited documents, all templates, PDF and Word downloads without watermarks, and version history. Clinic / Team (₹399/seat/mo or ₹3,588/seat/yr, min 3 seats) adds shared team templates, team admin dashboard, member roles, and clinic logo letterheads.'
    },
    {
      category: 'pricing',
      question: 'What payment methods do you support for Pro and Team upgrades?',
      answer: 'We accept all major payment methods via Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking, RuPay, Visa, Mastercard, and international credit cards. GST invoices are automatically generated and emailed after each payment.'
    }
  ];

  const filteredFaqs = FAQ_LIST.filter(f => {
    const matchesCategory = faqCategory === 'all' || f.category === faqCategory;
    const matchesSearch = f.question.toLowerCase().includes(faqSearch.toLowerCase()) || 
                          f.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#131314] text-[#e3e3e3] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#4e8cff]/30 selection:text-white">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. Global Sticky Navigation Bar */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full bg-[#131314]/90 backdrop-blur-md border-b border-[#3c4043]/30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4e8cff] to-[#ff5757] flex items-center justify-center shadow-lg shadow-[#4e8cff]/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">PulseNote</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gradient-to-r from-[#4e8cff]/20 to-[#ff5757]/20 border border-[#4e8cff]/30 text-white">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-[#9aa0a6] tracking-wide">pulsenoteai.in</p>
            </div>
          </div>

          {/* Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#c4c7c5]">
            <a href="#audiences" className="hover:text-white transition-colors">Audiences</a>
            <a href="#soap-demo" className="hover:text-white transition-colors">Clinical SOAP Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <button
              type="button"
              onClick={() => onOpenBlog?.(null)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Blog
            </button>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-3">
            <a
              href={DEMO_LINK}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#3c4043] bg-[#1e1f20] hover:bg-[#2d2e30] text-xs font-medium text-white transition-colors"
            >
              <span>Book a demo</span>
            </a>

            <button
              onClick={onLaunchApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-xs font-semibold text-white shadow-lg shadow-[#4e8cff]/20 transition-all cursor-pointer"
            >
              <span>Start free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. Hero Section (Requirement 1) */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#4e8cff]/15 via-[#ff5757]/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Top Kicker Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1f20] border border-[#3c4043]/50 text-xs text-[#c4c7c5] mb-8">
            <span>Deterministic Clinical & Enterprise Documentation</span>
            {VERIFIED_CLINICS_COUNT !== null && VERIFIED_CLINICS_COUNT > 0 && (
              <>
                <span className="text-[#9aa0a6]">·</span>
                <span className="text-emerald-400 font-medium">Trusted by {VERIFIED_CLINICS_COUNT} clinics</span>
              </>
            )}
          </div>

          {/* Exact User Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Structured clinical and enterprise documents in seconds —{' '}
            <span className="bg-gradient-to-r from-[#4e8cff] via-[#d96570] to-[#ff5757] bg-clip-text text-transparent">
              same input, same output.
            </span>
          </h1>

          {/* Exact User Sub-headline */}
          <p className="text-lg sm:text-xl text-[#9aa0a6] max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            SOAP notes, RFCs, memos, discharge summaries and incident reports. Fixed templates, no made-up details.
          </p>

          {/* Main buttons: Start free & Book a demo */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-[#4e8cff]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={DEMO_LINK}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-[#4e8cff]" />
              <span>Book a demo</span>
            </a>
          </div>

          {/* Verified Trust Statements */}
          <div className="p-4 rounded-2xl bg-[#1e1f20]/60 border border-[#3c4043]/40 max-w-2xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm text-[#10b981]">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="font-medium text-[#e3e3e3]">
              Your notes stay in your account. You can delete them at any time.
            </span>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. Two Clear Audience Tabs: For Clinics & For Companies */}
      {/* ------------------------------------------------------------- */}
      <section id="audiences" className="py-20 px-6 bg-[#18191a]/60 border-y border-[#3c4043]/30">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4e8cff] uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Two Clear Audiences</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Designed For Clinics. Built For Companies.
            </h2>
            <p className="text-sm sm:text-base text-[#9aa0a6]">
              Compare raw unstructured input against the verified, structured output across 3 sample documents each.
            </p>
          </div>

          {/* Two Audience Main Switcher Tabs */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => {
                setAudienceTab('clinics');
                setActiveClinicSample(0);
              }}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer border ${
                audienceTab === 'clinics'
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-[#1e1f20] border-[#3c4043]/60 text-[#9aa0a6] hover:text-white'
              }`}
            >
              <Stethoscope className={`w-4 h-4 ${audienceTab === 'clinics' ? 'text-emerald-400' : 'text-[#9aa0a6]'}`} />
              <span>For Clinics</span>
            </button>

            <button
              onClick={() => {
                setAudienceTab('companies');
                setActiveCompanySample(0);
              }}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer border ${
                audienceTab === 'companies'
                  ? 'bg-blue-500/15 border-blue-500/60 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-[#1e1f20] border-[#3c4043]/60 text-[#9aa0a6] hover:text-white'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${audienceTab === 'companies' ? 'text-blue-400' : 'text-[#9aa0a6]'}`} />
              <span>For Companies</span>
            </button>
          </div>

          {/* 3 Sample Document Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-2xl mx-auto">
            {(audienceTab === 'clinics' ? CLINIC_AUDIENCE_SAMPLES : COMPANY_AUDIENCE_SAMPLES).map((doc, idx) => {
              const isSelected = (audienceTab === 'clinics' ? activeClinicSample : activeCompanySample) === idx;
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (audienceTab === 'clinics') {
                      setActiveClinicSample(idx);
                    } else {
                      setActiveCompanySample(idx);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#2d2e30] text-white border-[#4e8cff]/60 shadow-md'
                      : 'bg-[#1e1f20] text-[#9aa0a6] border-[#3c4043]/40 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#4e8cff]" />
                  <span>{doc.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#9aa0a6]">
                    {doc.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Sample Before vs After Card */}
          {(() => {
            const currentSample = audienceTab === 'clinics' 
              ? CLINIC_AUDIENCE_SAMPLES[activeClinicSample]
              : COMPANY_AUDIENCE_SAMPLES[activeCompanySample];

            return (
              <div className="bg-[#1e1f20] border border-[#3c4043]/60 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3c4043]/40 pb-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#9aa0a6] mb-1">
                      <span>{audienceTab === 'clinics' ? 'Clinical Document' : 'Enterprise Document'}</span>
                      <span>•</span>
                      <span className="text-[#4e8cff] font-semibold">{currentSample.badge}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <span>{currentSample.title}</span>
                      <span className="text-xs font-normal text-[#9aa0a6]">— {currentSample.subtitle}</span>
                    </h3>
                  </div>

                  <button
                    onClick={onLaunchApp}
                    className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-[#4e8cff]/20"
                  >
                    <span>Try this template free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Split: Before (Raw Notes) vs After (Structured Output) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: Before = Raw Notes */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Before: Raw Notes / Dictation</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#9aa0a6]">Unstructured Input</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-[#131314] border border-[#3c4043]/50 text-xs sm:text-sm text-[#c4c7c5] leading-relaxed font-mono whitespace-pre-wrap">
                      {currentSample.before}
                    </div>
                    <p className="text-[11px] text-[#9aa0a6]">
                      Notice: Grammatically rough, fragmented speech, non-standard abbreviations, unorganized observations.
                    </p>
                  </div>

                  {/* Right: After = Structured Output */}
                  <div className="lg:col-span-7 bg-[#131314] rounded-2xl border border-[#3c4043]/60 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#3c4043]/40 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">After: Structured Output</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400">
                        Fixed Order · No Hallucinations
                      </span>
                    </div>

                    <div className="space-y-3">
                      {currentSample.sections.map((sec, sIdx) => {
                        const isNotSpecified = /^(Not specified in transcript\.?|Not documented\.?)$/i.test(sec.text.trim());
                        return (
                          <div key={sIdx} className="p-3.5 rounded-xl bg-[#1e1f20]/70 border border-[#3c4043]/30 space-y-1">
                            <div className="text-[11px] font-bold text-[#4e8cff] uppercase tracking-wider">
                              {sec.label}
                            </div>
                            <div
                              className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans ${
                                isNotSpecified ? 'text-[#9aa0a6] italic' : 'text-[#e3e3e3]'
                              }`}
                            >
                              {isNotSpecified ? 'Not specified in transcript' : sec.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Short line under every generated clinical document */}
                    {currentSample.isClinical && (
                      <div className="pt-3 border-t border-[#3c4043]/40 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>AI-assisted draft. A licensed professional must review before use.</span>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })()}

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. Live Interactive SOAP-Note Demo Section */}
      {/* ------------------------------------------------------------- */}
      <section id="soap-demo" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#10b981] uppercase tracking-wider mb-2">
              <Stethoscope className="w-4 h-4" />
              <span>Interactive Clinical Sandbox</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Try the Clinical SOAP Engine Live
            </h2>
            <p className="text-sm sm:text-base text-[#9aa0a6]">
              Choose a real patient clinical dictation below or write your own. Watch how Pulse Note AI parses subjective narratives, extracts objective metrics, computes ICD-10 diagnoses, and plans pharmacotherapy.
            </p>
          </div>

          {/* Specialty Selector (Built for Primary Care / Endocrinology / Cardiology / Urgent Care / General) */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-[#9aa0a6] mr-1">Built for:</span>
              {CLINICAL_SPECIALTIES.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => handleSelectSpecialty(specialty)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedSpecialty === specialty
                      ? 'bg-[#4e8cff]/20 text-white border-[#4e8cff] shadow-sm'
                      : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border-[#3c4043]/50'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>

            {/* Interactive Preset Chips filtered by specialty (shows all when General is chosen) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {CLINICAL_SOAP_PRESETS.map((preset, idx) => {
                if (selectedSpecialty !== 'General' && preset.specialty !== selectedSpecialty) {
                  return null;
                }
                return (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handleSelectSoapPreset(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      activeSoapPreset === idx
                        ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40 shadow-sm'
                        : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#3c4043]/50'
                    }`}
                  >
                    <span>{preset.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Workspace Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-[#1e1f20] border border-[#3c4043]/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
            
            {/* Left: Input Dictation Editor */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#10b981]" />
                  <span>Doctor Voice Dictation / Transcript</span>
                </span>
                <span className="text-[11px] text-[#9aa0a6]">Live Editable</span>
              </div>

              <textarea
                value={soapInputText}
                onChange={(e) => setSoapInputText(e.target.value)}
                rows={14}
                className="w-full bg-[#131314] border border-[#3c4043]/60 rounded-xl p-4 text-xs text-[#e3e3e3] font-mono leading-relaxed focus:outline-none focus:border-[#10b981] transition-colors resize-none"
                placeholder="Type or paste doctor-patient conversation here..."
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#9aa0a6]">
                  {soapInputText.split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  onClick={handleGenerateSoap}
                  disabled={isSoapGenerating}
                  className="px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-[#10b981]/20 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSoapGenerating ? 'animate-spin' : ''}`} />
                  <span>{isSoapGenerating ? 'Parsing Vitals & S/O/A/P...' : 'Generate Clinical SOAP Note'}</span>
                </button>
              </div>

              {/* Compliance Pill */}
              <div className="p-3 rounded-lg bg-[#131314]/70 border border-[#3c4043]/30 text-[11px] text-[#9aa0a6] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>Encrypted on client. Direct transmission with zero patient record telemetry.</span>
              </div>
            </div>

            {/* Right: Generated SOAP Note Output */}
            <div className="lg:col-span-7 bg-[#131314] border border-[#3c4043]/50 rounded-xl p-6 space-y-5">
              
              {/* Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3c4043]/40 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide">CLINICAL DOCUMENTATION RECORD</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#1e1f20] p-1 rounded-lg border border-[#3c4043]/40 text-[11px]">
                    <button
                      onClick={() => setSoapViewMode('structured')}
                      className={`px-2.5 py-1 rounded transition-colors ${soapViewMode === 'structured' ? 'bg-[#2d2e30] text-white font-medium' : 'text-[#9aa0a6] hover:text-white'}`}
                    >
                      Doctor View
                    </button>
                    <button
                      onClick={() => setSoapViewMode('raw_emr')}
                      className={`px-2.5 py-1 rounded transition-colors ${soapViewMode === 'raw_emr' ? 'bg-[#2d2e30] text-white font-medium' : 'text-[#9aa0a6] hover:text-white'}`}
                    >
                      Raw EMR Format
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopySoap(rawEmrText)}
                    className="p-1.5 rounded-lg bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043] text-xs text-[#c4c7c5] hover:text-white transition-colors"
                    title="Copy full note"
                  >
                    {soapCopied ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {soapError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {soapError}
                </div>
              )}

              {soapLiveOutput && !soapError ? (
                /* Live AI-generated output */
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-[11px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Live AI output generated from your dictation</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0a0a0a] text-xs font-mono text-[#a3e635] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[480px]">
                    {soapLiveOutput}
                  </pre>
                </div>
              ) : soapViewMode === 'raw_emr' ? (
                /* Raw EMR Text Mode */
                <pre className="p-4 rounded-xl bg-[#0a0a0a] text-xs font-mono text-[#a3e635] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[480px]">
                  {rawEmrText}
                </pre>
              ) : (
                /* Structured Clean Doctor View */
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  
                  {/* S - Subjective */}
                  <div className="p-3.5 rounded-xl bg-[#1e1f20]/50 border border-[#3c4043]/30">
                    <div className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>[S] Subjective Findings</span>
                      <span className="text-[10px] text-[#9aa0a6] font-normal">Patient History & Symptoms</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-[#e3e3e3]">
                      {currentSoapOutput.subjective.map((item, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="font-semibold text-[#c4c7c5] shrink-0 sm:w-40">{item.field}:</span>
                          <span className="text-[#e3e3e3]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* O - Objective */}
                  <div className="p-3.5 rounded-xl bg-[#1e1f20]/50 border border-[#3c4043]/30">
                    <div className="text-xs font-bold text-[#10b981] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>[O] Objective Findings</span>
                      <span className="text-[10px] text-[#9aa0a6] font-normal">Vitals, Physical Exam & Diagnostics</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-[#e3e3e3]">
                      {currentSoapOutput.objective.map((item, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="font-semibold text-[#c4c7c5] shrink-0 sm:w-40">{item.field}:</span>
                          <span className="text-[#e3e3e3]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* A - Assessment */}
                  <div className="p-3.5 rounded-xl bg-[#1e1f20]/50 border border-[#3c4043]/30">
                    <div className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>[A] Assessment & ICD-10 Diagnoses</span>
                      <span className="text-[10px] text-[#9aa0a6] font-normal">Clinical Impressions</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {currentSoapOutput.assessment.map((item, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-[#131314] border border-[#3c4043]/40">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-white">{item.title}</span>
                            <span className="px-2 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 text-[10px] font-mono">
                              ICD-10: {item.icd}
                            </span>
                          </div>
                          <p className="text-[#9aa0a6] text-[11px]">{item.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* P - Plan */}
                  <div className="p-3.5 rounded-xl bg-[#1e1f20]/50 border border-[#3c4043]/30">
                    <div className="text-xs font-bold text-[#a855f7] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>[P] Treatment & Medication Plan</span>
                      <span className="text-[10px] text-[#9aa0a6] font-normal">Rx, Diagnostics & Follow-up</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-[#e3e3e3]">
                      {currentSoapOutput.plan.map((item, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="font-semibold text-[#c4c7c5] shrink-0 sm:w-40">{item.category}:</span>
                          <span className="text-[#e3e3e3]">{item.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. Enterprise Architecture & Security Pillars */}
      {/* ------------------------------------------------------------- */}
      <section id="architecture" className="py-24 px-6 bg-[#18191a]/60 border-y border-[#3c4043]/30">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#ff5757] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Vulnerability Foundations</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Engineered For Regulated Workflows
            </h2>
            <p className="text-sm sm:text-base text-[#9aa0a6]">
              Built with hardened boundaries ensuring compliance across clinical healthcare, financial consulting, and defense-adjacent systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="p-8 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 space-y-4 hover:border-[#4e8cff]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#4e8cff]/15 text-[#4e8cff] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Fact-Checking Against Input</h3>
              <p className="text-xs sm:text-sm text-[#9aa0a6] leading-relaxed">
                Every numeric vital, dosage, and clinical term is cross-checked against your source transcript. Unverified tokens are flagged inline and missing fields display "Not specified in transcript".
              </p>
              <div className="pt-2 text-xs font-medium text-[#4e8cff] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Source-grounded verification</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 space-y-4 hover:border-[#10b981]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Deterministic Clinical Schemas</h3>
              <p className="text-xs sm:text-sm text-[#9aa0a6] leading-relaxed">
                Unlike open-ended chatbots that invent sections or prescriptions, PulseNote AI enforces fixed JSON schemas for SOAP notes, discharge summaries, referrals, memos, and RFCs — plus optional ICD-10-CM suggestions on Pro.
              </p>
              <div className="pt-2 text-xs font-medium text-[#10b981] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Deterministic JSON validation</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 space-y-4 hover:border-[#ff5757]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#ff5757]/15 text-[#ff5757] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Single-Provider with Fallback Model</h3>
              <p className="text-xs sm:text-sm text-[#9aa0a6] leading-relaxed">
                Streamlined single-provider OpenRouter gateway with automatic fallback model routing so your documentation stays fast, consistent, and dependable during busy clinic hours.
              </p>
              <div className="pt-2 text-xs font-medium text-[#ff5757] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Automatic model fallback</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. Pricing Section */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4e8cff] uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              <span>Transparent Plans</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Predictable Pricing For Clinicians & Enterprises
            </h2>
            <p className="text-sm sm:text-base font-semibold text-emerald-400 mb-3">
              Competitors charge $100–300/clinician/month. PulseNote starts free.
            </p>
            <p className="text-sm sm:text-base text-[#9aa0a6]">
              Start free with 5 documents a month. Upgrade to Pro or Team for unlimited documents, watermark-free PDF and Word exports, ICD-10 code suggestions, version history, and custom clinic letterheads.
            </p>

            {/* Currency & Annual Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {/* Currency Toggle */}
              <div className="flex items-center bg-[#1e1f20] p-1 rounded-xl border border-[#3c4043]/50 text-xs font-medium">
                <button
                  onClick={() => setPricingCurrency('INR')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${pricingCurrency === 'INR' ? 'bg-[#2d2e30] text-white shadow-sm' : 'text-[#9aa0a6] hover:text-white'}`}
                >
                  ₹ INR (India)
                </button>
                <button
                  onClick={() => setPricingCurrency('USD')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${pricingCurrency === 'USD' ? 'bg-[#2d2e30] text-white shadow-sm' : 'text-[#9aa0a6] hover:text-white'}`}
                >
                  $ USD (Overseas)
                </button>
              </div>

              {/* Annual Savings Toggle */}
              <div className="flex items-center gap-2 bg-[#1e1f20] px-3.5 py-1.5 rounded-xl border border-[#3c4043]/50 text-xs">
                <button
                  onClick={() => setPricingAnnual(!pricingAnnual)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${pricingAnnual ? 'bg-[#10b981]' : 'bg-[#3c4043]'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${pricingAnnual ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-[#e3e3e3] font-medium">Annual Billing</span>
                <span className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30">
                  SAVE UP TO 34%
                </span>
              </div>
            </div>

          </div>

          {/* Pricing Cards Grid (4 Plans) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Plan 1: Free */}
            <div className="p-6 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider mb-2">Free</div>
                <div className="text-3xl font-extrabold text-white mb-1">
                  {pricingCurrency === 'INR' ? '₹0' : '$0'}
                  <span className="text-xs font-normal text-[#9aa0a6]"> / month</span>
                </div>
                <p className="text-xs text-[#9aa0a6] mb-6">
                  For individual testing and light personal documentation.
                </p>

                <div className="space-y-3 pt-4 border-t border-[#3c4043]/30 text-xs text-[#c4c7c5]">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>5 documents a month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>3 basic templates (SOAP, RFC, Memo)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>PDF & Word export (with watermark)</span>
                  </div>
                  <div className="flex items-start gap-2 text-[#9aa0a6]">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Watermark "Made with PulseNote AI"</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLaunchApp}
                className="mt-8 w-full py-2.5 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Start free
              </button>
            </div>

            {/* Plan 2: Pro (Featured) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1e1f20] to-[#17181a] border-2 border-[#4e8cff] relative flex flex-col justify-between shadow-xl shadow-[#4e8cff]/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#4e8cff] to-[#ff5757] text-white text-[10px] font-extrabold uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-bold text-[#4e8cff] uppercase tracking-wider mb-2">Pro</div>
                <div className="text-3xl font-extrabold text-white mb-1">
                  {pricingCurrency === 'INR' 
                    ? (pricingAnnual ? '₹5,508' : '₹699')
                    : (pricingAnnual ? '$79.00' : '$9.99')}
                  <span className="text-xs font-normal text-[#9aa0a6]">{pricingAnnual ? ' / year' : ' / month'}</span>
                </div>
                <p className="text-xs text-[#9aa0a6] mb-6">
                  {pricingAnnual ? 'One-time yearly payment — effective ~₹459/mo, save ₹2,880 (34%). Unlimited documents.' : 'Billed monthly via UPI AutoPay. Cancel anytime.'}
                </p>

                <div className="space-y-3 pt-4 border-t border-[#3c4043]/30 text-xs text-[#c4c7c5]">
                  <div className="flex items-start gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-[#4e8cff] shrink-0 mt-0.5" />
                    <span>Unlimited documents</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#4e8cff] shrink-0 mt-0.5" />
                    <span>All templates unlocked</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#4e8cff] shrink-0 mt-0.5" />
                    <span>PDF and Word (.docx) download (no watermark)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#4e8cff] shrink-0 mt-0.5" />
                    <span>ICD-10-CM code suggestions for SOAP notes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#4e8cff] shrink-0 mt-0.5" />
                    <span>Complete version history</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenPricing}
                className="mt-8 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#4e8cff]/25 transition-all cursor-pointer"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Plan 3: Clinic / Team */}
            <div className="p-6 rounded-2xl bg-[#1e1f20] border border-[#10b981]/50 relative flex flex-col justify-between shadow-xl shadow-[#10b981]/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#10b981] text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                For Teams & Clinics
              </div>

              <div>
                <div className="text-xs font-bold text-[#10b981] uppercase tracking-wider mb-2">Clinic / Team</div>
                <div className="text-3xl font-extrabold text-white mb-1">
                  {pricingCurrency === 'INR' 
                    ? (pricingAnnual ? '₹3,588' : '₹399')
                    : (pricingAnnual ? '$43.99' : '$5.49')}
                  <span className="text-xs font-normal text-[#9aa0a6]">{pricingAnnual ? ' / seat / year' : ' / seat / mo'}</span>
                </div>
                <p className="text-xs text-[#9aa0a6] mb-6">
                  Minimum 3 seats ({pricingCurrency === 'INR' ? (pricingAnnual ? '₹10,764/yr one-time, save 25%' : '₹1,197/mo') : (pricingAnnual ? '$131.97/yr' : '$16.47/mo')}). Full clinic administration.
                </p>

                <div className="space-y-3 pt-4 border-t border-[#3c4043]/30 text-xs text-[#c4c7c5]">
                  <div className="flex items-start gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>Everything in Pro</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>Shared template library (admin locked)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>Team admin dashboard & member invites</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>Weekly documents usage reports</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>Clinic logo and letterhead on PDFs</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenPricing}
                className="mt-8 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Get Clinic / Team
              </button>
            </div>

            {/* Plan 4: Enterprise */}
            <div className="p-6 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider mb-2">Enterprise</div>
                <div className="text-3xl font-extrabold text-white mb-1">
                  Contact us
                </div>
                <p className="text-xs text-[#9aa0a6] mb-6">
                  For multi-hospital networks, health systems, and high-concurrency enterprises.
                </p>

                <div className="space-y-3 pt-4 border-t border-[#3c4043]/30 text-xs text-[#c4c7c5]">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9aa0a6] shrink-0 mt-0.5" />
                    <span>Custom templates built for your workflows</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9aa0a6] shrink-0 mt-0.5" />
                    <span>Dedicated onboarding and staff training</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9aa0a6] shrink-0 mt-0.5" />
                    <span>GST-compliant invoice billing with purchase orders</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9aa0a6] shrink-0 mt-0.5" />
                    <span>SLA guarantees & dedicated account manager</span>
                  </div>
                </div>
              </div>

              <a
                href={DEMO_LINK}
                target="_blank"
                rel="noreferrer"
                className="mt-8 w-full py-2.5 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-white font-medium text-xs transition-colors text-center inline-block cursor-pointer"
              >
                Contact us
              </a>
            </div>

          </div>

          {/* Add-on Banner: Custom Template Build (Requirement 4) */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1e1f20] via-[#242528] to-[#1e1f20] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Professional Service Add-On</span>
              </div>
              <h4 className="text-lg font-bold text-white">Custom Template Build</h4>
              <p className="text-xs text-[#c4c7c5]">
                Have a specialized EMR or corporate form? Our engineering team builds a deterministic JSON schema matching your exact section order and verification rules.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-xl font-extrabold text-white">
                  {pricingCurrency === 'INR' ? '₹2,999' : '$39'}
                </div>
                <div className="text-[10px] text-[#9aa0a6]">One-time per template</div>
              </div>
              <button
                onClick={onOpenPricing}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition cursor-pointer"
              >
                Order Custom Build
              </button>
            </div>
          </div>

          {/* Plan Comparison Table (Requirement 7) */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white">Detailed Plan Comparison</h3>
              <p className="text-xs text-[#9aa0a6] mt-1">Everything you need to select the right tier for your clinical or enterprise team.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#3c4043]/50 bg-[#1e1f20]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#3c4043]/50 bg-[#131314]/80 text-[#9aa0a6]">
                    <th className="p-4 font-semibold">Features</th>
                    <th className="p-4 font-semibold text-white">Free</th>
                    <th className="p-4 font-semibold text-[#4e8cff]">Pro</th>
                    <th className="p-4 font-semibold text-[#10b981]">Clinic / Team</th>
                    <th className="p-4 font-semibold text-white">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c4043]/30 text-[#c4c7c5]">
                  <tr>
                    <td className="p-4 font-medium text-white">Monthly Documents</td>
                    <td className="p-4">5 docs / month</td>
                    <td className="p-4 text-emerald-400 font-semibold">Unlimited</td>
                    <td className="p-4 text-emerald-400 font-semibold">Unlimited</td>
                    <td className="p-4 text-emerald-400 font-semibold">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Template Access</td>
                    <td className="p-4">3 basic templates</td>
                    <td className="p-4">All standard templates</td>
                    <td className="p-4">All templates + Shared team library</td>
                    <td className="p-4">Custom bespoke schemas</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Export Formats</td>
                    <td className="p-4">PDF & Word (with watermark)</td>
                    <td className="p-4">Clean PDF, Word & FHIR JSON</td>
                    <td className="p-4">PDF & Word with Letterhead</td>
                    <td className="p-4">PDF, Word, EHR API</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">ICD-10-CM Suggestions</td>
                    <td className="p-4 text-[#9aa0a6]">—</td>
                    <td className="p-4 text-emerald-400 font-semibold">Included</td>
                    <td className="p-4 text-emerald-400 font-semibold">Included</td>
                    <td className="p-4 text-emerald-400 font-semibold">Included</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Watermark</td>
                    <td className="p-4 text-amber-300">Made with PulseNote AI</td>
                    <td className="p-4 text-emerald-400">None</td>
                    <td className="p-4 text-emerald-400">None (Clinic Logo)</td>
                    <td className="p-4 text-emerald-400">None (Custom Branding)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Version History</td>
                    <td className="p-4 text-[#9aa0a6]">—</td>
                    <td className="p-4 text-emerald-400 font-semibold">Included</td>
                    <td className="p-4 text-emerald-400 font-semibold">Included</td>
                    <td className="p-4 text-emerald-400 font-semibold">Audit logs included</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Fact-Checking Against Input</td>
                    <td className="p-4 text-emerald-400">Included</td>
                    <td className="p-4 text-emerald-400">Included</td>
                    <td className="p-4 text-emerald-400">Included</td>
                    <td className="p-4 text-emerald-400">Included</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Team Admin Dashboard</td>
                    <td className="p-4 text-[#9aa0a6]">—</td>
                    <td className="p-4 text-[#9aa0a6]">—</td>
                    <td className="p-4 text-emerald-400 font-semibold">Included (Min 3 seats)</td>
                    <td className="p-4 text-emerald-400 font-semibold">Multi-clinic admin</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-white">Clinic Letterhead & Logo</td>
                    <td className="p-4 text-[#9aa0a6]">—</td>
                    <td className="p-4 text-[#9aa0a6]">—</td>
                    <td className="p-4 text-emerald-400 font-semibold">Included</td>
                    <td className="p-4 text-emerald-400 font-semibold">Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Testimonials Section — hidden completely until at least 2 real beta-user quotes exist in src/data/testimonials.ts */}
          {hasRealTestimonials() && (
            <div className="space-y-6 pt-8 border-t border-[#3c4043]/30">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-white">What Early Teams Are Saying</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((item) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/40 space-y-3">
                    {item.specialty && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {item.specialty}
                      </span>
                    )}
                    <p className="text-xs text-[#c4c7c5] italic leading-relaxed">"{item.quote}"</p>
                    <div className="pt-2 border-t border-[#3c4043]/20">
                      <div className="text-xs font-bold text-white">{item.authorName}</div>
                      <div className="text-[11px] text-[#9aa0a6]">
                        {item.authorRole}
                        {item.organization ? `, ${item.organization}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. Comprehensive FAQ Section */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-24 px-6 bg-[#18191a]/60 border-y border-[#3c4043]/30">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4e8cff] uppercase tracking-wider mb-2">
              <Compass className="w-4 h-4" />
              <span>Questions & Answers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#9aa0a6]">
              Everything you need to know about templates, privacy guidelines, pricing, and exports. Do not enter patient-identifying information.
            </p>
          </div>

          {/* FAQ Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-8">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full bg-[#1e1f20] border border-[#3c4043]/50 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#4e8cff]"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#1e1f20] p-1 rounded-xl border border-[#3c4043]/50 text-xs">
              <button
                onClick={() => setFaqCategory('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${faqCategory === 'all' ? 'bg-[#2d2e30] text-white' : 'text-[#9aa0a6] hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFaqCategory('clinical')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${faqCategory === 'clinical' ? 'bg-[#2d2e30] text-white' : 'text-[#9aa0a6] hover:text-white'}`}
              >
                Clinical
              </button>
              <button
                onClick={() => setFaqCategory('models')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${faqCategory === 'models' ? 'bg-[#2d2e30] text-white' : 'text-[#9aa0a6] hover:text-white'}`}
              >
                Models
              </button>
              <button
                onClick={() => setFaqCategory('pricing')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${faqCategory === 'pricing' ? 'bg-[#2d2e30] text-white' : 'text-[#9aa0a6] hover:text-white'}`}
              >
                Billing
              </button>
            </div>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-[#1e1f20] border border-[#3c4043]/40 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-white hover:text-[#4e8cff] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-[#9aa0a6] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#c4c7c5] leading-relaxed border-t border-[#3c4043]/20 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. About pulsenoteai.in Page & Founders Section */}
      {/* ------------------------------------------------------------- */}
      <section id="about" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#ff5757] uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              <span>About pulsenoteai.in</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Restoring Time to Healthcare and High-Stakes Teams
            </h2>
            <p className="text-sm sm:text-base text-[#9aa0a6] leading-relaxed">
              We started Pulse Note AI because physicians spend 2 hours documenting for every 1 hour spent with patients, and engineering leaders lose entire afternoons formatting status updates.
            </p>
          </div>

          {/* Core Vision Story Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#1e1f20] border border-[#3c4043]/50 rounded-2xl p-8 sm:p-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">Our Core Mission</h3>
              <p className="text-xs sm:text-sm text-[#c4c7c5] leading-relaxed">
                Traditional chatbots output sprawling paragraphs that require continuous editing. Pulse Note AI was engineered to do the exact opposite: take noisy, disorganized spoken dialogue and distill it directly into structured, standard formats.
              </p>
              <p className="text-xs sm:text-sm text-[#9aa0a6] leading-relaxed">
                Whether you are charting an emergency room patient encounter, conducting a real estate foundation walk-through, or summarizing a board decision, our schemas deliver immediate, actionable clarity.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-white">
                <div>
                  <div className="font-bold text-lg text-[#10b981]">Fixed</div>
                  <div className="text-[#9aa0a6] text-[11px]">Deterministic Schemas</div>
                </div>
                <div>
                  <div className="font-bold text-lg text-[#4e8cff]">Verified</div>
                  <div className="text-[#9aa0a6] text-[11px]">Fact-Checked Against Input</div>
                </div>
                <div>
                  <div className="font-bold text-lg text-[#ff5757]">pulsenoteai.in</div>
                  <div className="text-[#9aa0a6] text-[11px]">Official Domain</div>
                </div>
              </div>

              {/* Launch Prep: Product Hunt Badge Placeholder & LinkedIn Share Button */}
              <div className="pt-4 border-t border-[#3c4043]/40 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.producthunt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#131314] border border-[#da552f]/40 hover:border-[#da552f] text-xs font-semibold text-white transition-colors"
                  title="Product Hunt launch badge placeholder — replace href with live launch URL"
                >
                  <span className="w-5 h-5 rounded-full bg-[#da552f] text-white font-bold flex items-center justify-center text-[11px]">
                    P
                  </span>
                  <span>Launching Soon on Product Hunt</span>
                </a>

                <a
                  href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fpulsenoteai.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a66c2]/15 hover:bg-[#0a66c2]/25 border border-[#0a66c2]/40 text-xs font-semibold text-[#70b5f9] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Share on LinkedIn</span>
                </a>
              </div>
            </div>

            {/* Founder & CEO Persona Card */}
            <div className="p-6 rounded-xl bg-[#131314] border border-[#3c4043]/50 space-y-4 relative overflow-hidden group hover:border-[#4e8cff]/50 transition-all shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4e8cff]/10 to-[#ff5757]/10 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#4e8cff] via-[#6366f1] to-[#ff5757] p-0.5 shadow-md shadow-[#4e8cff]/20">
                      <div className="w-full h-full rounded-full bg-[#1e1f20] flex items-center justify-center text-white font-bold text-base tracking-wider">
                        JW
                      </div>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#10b981] border-2 border-[#131314] rounded-full" title="Active Founder" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-base font-bold text-white">Jayesh Wagh</div>
                      <span className="px-1.5 py-0.5 rounded bg-[#4e8cff]/15 text-[#4e8cff] text-[10px] font-semibold border border-[#4e8cff]/30">
                        Founder & CEO
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9aa0a6] flex items-center gap-2 mt-0.5">
                      <a 
                        href="https://github.com/jayeshwagh" 
                        target="_blank" 
                        rel="noreferrer"
                        className="hover:text-white transition-colors flex items-center gap-1 font-mono text-[10px] text-[#4e8cff]"
                      >
                        github.com/jayeshwagh <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span>•</span>
                      <span>pulsenoteai.in</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowCeoModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#242528] hover:bg-[#2d2e30] border border-[#3c4043] text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer hover:border-[#4e8cff]"
                >
                  <FileText className="w-3.5 h-3.5 text-[#4e8cff]" />
                  <span>Press Kit</span>
                </button>
              </div>

              <blockquote className="text-xs text-[#e3e3e3] italic border-l-2 border-gradient-to-b border-[#4e8cff] pl-3 py-1 leading-relaxed bg-[#18191a]/50 rounded-r-lg">
                "Our guiding principle is simple: clinicians and technical leaders should never have to fight software just to record what happened in the room. Accuracy and dignity in workflow are non-negotiable."
              </blockquote>

              <p className="text-[11px] text-[#9aa0a6] leading-relaxed">
                Full-stack AI architect and engineer building deterministic clinical and enterprise documentation workflows for healthcare providers and technical teams.
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-[#3c4043]/30 text-[11px]">
                <div className="flex items-center gap-2 text-[#c4c7c5]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Verified Executive Profile</span>
                </div>
                <button
                  onClick={() => setShowCeoModal(true)}
                  className="text-[#4e8cff] hover:underline font-medium text-[11px] cursor-pointer flex items-center gap-1"
                >
                  Read CEO Welcome Letter & Bio →
                </button>
              </div>
            </div>
          </div>

          {/* Action Final Banner */}
          <div className="rounded-2xl p-8 sm:p-12 bg-gradient-to-r from-[#1e1f20] via-[#242528] to-[#1e1f20] border border-[#3c4043]/60 text-center space-y-6 relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-3 relative z-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Ready to Experience Deterministic Documentation?
              </h3>
              <p className="text-xs sm:text-sm text-[#9aa0a6]">
                Start free with 5 structured documents every month — no credit card required.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onLaunchApp}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-[#4e8cff]/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Start Free Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenPricing}
                  className="px-8 py-3.5 rounded-xl bg-[#131314] hover:bg-[#202124] border border-[#3c4043] text-white font-semibold text-xs transition-colors"
                >
                  View Pro Pricing
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8b. Executive Leadership & CEO Profile Section */}
      {/* ------------------------------------------------------------- */}
      <CEOSection />

      {/* ------------------------------------------------------------- */}
      {/* 9. Global Marketing Footer */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-[#3c4043]/30 bg-[#0f0f10] py-14 px-6 text-xs text-[#9aa0a6]">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#4e8cff] to-[#ff5757] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">PulseNote AI</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Deterministic clinical and enterprise documentation engine for SOAP notes, discharge summaries, referrals, memos, and RFCs.
              </p>
              <div className="text-[11px] text-white">
                Domain: <span className="text-[#4e8cff]">pulsenoteai.in</span>
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Document Templates</div>
              <ul className="space-y-2 text-[11px]">
                <li><button onClick={onLaunchApp} className="hover:text-white transition-colors text-left cursor-pointer">Clinical SOAP Notes</button></li>
                <li><button onClick={onLaunchApp} className="hover:text-white transition-colors text-left cursor-pointer">Discharge Summaries</button></li>
                <li><button onClick={onLaunchApp} className="hover:text-white transition-colors text-left cursor-pointer">Referral Letters</button></li>
                <li><button onClick={onLaunchApp} className="hover:text-white transition-colors text-left cursor-pointer">Engineering RFCs</button></li>
                <li><button onClick={onLaunchApp} className="hover:text-white transition-colors text-left cursor-pointer">Executive Decision Memos</button></li>
                <li><button onClick={onLaunchApp} className="hover:text-white transition-colors text-left cursor-pointer">Incident Reports</button></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Product & Resources</div>
              <ul className="space-y-2 text-[11px]">
                <li><button onClick={onLaunchApp} className="hover:text-white transition-colors text-left cursor-pointer">Start Free (5 Docs/Mo)</button></li>
                <li><button onClick={() => onOpenBlog?.(null)} className="hover:text-white transition-colors text-left cursor-pointer">Clinical Documentation Blog</button></li>
                <li><a href="#soap-demo" className="hover:text-white transition-colors">Interactive SOAP Demo</a></li>
                <li><button onClick={onOpenPricing} className="hover:text-white transition-colors text-left cursor-pointer">Pro Plan (₹699/mo)</button></li>
                <li><button onClick={onOpenPricing} className="hover:text-white transition-colors text-left cursor-pointer">Clinic / Team (₹399/seat)</button></li>
                <li><a href={DEMO_LINK} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Book a Demo</a></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Compliance & Security</div>
              <p className="text-[11px] leading-relaxed mb-3">
                Your notes stay in your account. You can delete them at any time. AI-assisted draft — a licensed professional must review before use.
              </p>
              <div className="text-[11px] text-[#c4c7c5]">
                Contact: <a href="mailto:contact@pulsenoteai.in" className="text-[#4e8cff] hover:underline">contact@pulsenoteai.in</a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#3c4043]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              © {new Date().getFullYear()} Pulse Note AI (pulsenoteai.in). All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Use</a>
              <a href="#refund" className="hover:text-white transition-colors">Refund Policy</a>
              <a href="#about" className="hover:text-white transition-colors">Security</a>
              <a href="mailto:contact@pulsenoteai.in" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>

        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* CEO Persona & Official Press Kit Modal */}
      {/* ------------------------------------------------------------- */}
      {showCeoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#18191a] border border-[#3c4043] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#3c4043]/50 flex items-center justify-between bg-[#1e1f20]/60">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#4e8cff] via-[#6366f1] to-[#ff5757] p-0.5 shadow-lg shadow-[#4e8cff]/20">
                  <div className="w-full h-full rounded-[10px] bg-[#131314] flex items-center justify-center text-white font-extrabold text-lg">
                    JW
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">Jayesh Wagh</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[10px] font-semibold">
                      Founder & CEO
                    </span>
                  </div>
                  <p className="text-xs text-[#9aa0a6]">
                    Executive Dossier & Press Kit • pulsenoteai.in
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCeoModal(false)}
                className="w-8 h-8 rounded-lg bg-[#242528] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-[#c4c7c5] leading-relaxed custom-scrollbar">
              
              {/* Executive Welcome Letter */}
              <div className="p-5 rounded-xl bg-[#131314] border border-[#3c4043]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4e8cff] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Welcome Message From The CEO</span>
                  </span>
                  <button
                    onClick={() => handleCopyText('welcome', `Dear Innovator, Physician, and Builder,\n\nWelcome to PulseNote AI (pulsenoteai.in).\n\nEvery great product starts with a point of friction. For me, that friction was watching clinicians and technical leaders spend hours formatting paperwork instead of doing high-leverage work.\n\nWe built PulseNote AI as a deterministic documentation engine that turns raw transcripts into structured, fact-checked records in seconds.\n\nWarmly,\nJayesh Wagh\nFounder & CEO, PulseNote AI\ngithub.com/jayeshwagh`)}
                    className="text-[11px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedSection === 'welcome' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'welcome' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[#e3e3e3] font-medium text-xs">
                  "Every great product begins with a point of unbearable friction. For me, that friction was watching brilliant clinicians and technical leaders spend half their waking hours trapped in electronic paperwork instead of doing the work that matters."
                </p>
                <p className="text-[11px] text-[#9aa0a6]">
                  "We built PulseNote AI as a deterministic documentation engine—turning raw encounter transcripts and technical notes into structured, fact-checked records in seconds."
                </p>
                <div className="text-[11px] text-[#e3e3e3] font-semibold pt-1">
                  — Jayesh Wagh, Founder & CEO
                </div>
              </div>

              {/* Short & Long Bios Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Short Bio */}
                <div className="p-4 rounded-xl bg-[#1e1f20] border border-[#3c4043]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">Short Bio (Conferences & X)</span>
                    <button
                      onClick={() => handleCopyText('shortBio', `Jayesh Wagh is the Founder & CEO of PulseNote AI (pulsenoteai.in), a deterministic clinical and enterprise documentation platform built to help clinicians and teams produce structured SOAP notes, discharge summaries, referrals, memos, and RFCs in seconds.`)}
                      className="text-[10px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSection === 'shortBio' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'shortBio' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9aa0a6]">
                    Jayesh Wagh is the Founder & CEO of PulseNote AI (pulsenoteai.in), a deterministic clinical and enterprise documentation platform built to help clinicians and teams produce structured SOAP notes, discharge summaries, referrals, memos, and RFCs in seconds.
                  </p>
                </div>

                {/* Signature Quote */}
                <div className="p-4 rounded-xl bg-[#1e1f20] border border-[#3c4043]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">Signature Quote</span>
                    <button
                      onClick={() => handleCopyText('quote', `"Clinicians and technical leaders should never have to fight software just to record what happened in the room. When you replace administrative friction with deterministic intelligence, you don't just save hours—you restore human focus and empathy." — Jayesh Wagh`)}
                      className="text-[10px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSection === 'quote' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'quote' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <blockquote className="text-[11px] text-[#4e8cff] italic border-l-2 border-[#4e8cff] pl-2.5 py-0.5">
                    "Clinicians and technical leaders should never have to fight software just to record what happened in the room. When you replace administrative friction with deterministic intelligence, you don't just save hours—you restore human focus and empathy."
                  </blockquote>
                </div>

              </div>

              {/* Long Bio */}
              <div className="p-5 rounded-xl bg-[#1e1f20] border border-[#3c4043]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">Full Executive Bio (Press Kit & Media)</span>
                  <button
                    onClick={() => handleCopyText('longBio', `Jayesh Wagh is the Founder and Chief Executive Officer of PulseNote AI (pulsenoteai.in). Combining full-stack engineering and structured AI pipelines, Jayesh founded PulseNote AI to cut clerical burnout for clinicians and technical teams.\n\nUnder Jayesh's leadership, PulseNote AI built deterministic JSON schemas for SOAP notes, discharge summaries, referrals, engineering RFCs, and decision memos—backed by fact-checking against input transcripts and a single-provider API architecture with fallback model routing.`)}
                    className="text-[10px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'longBio' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'longBio' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="space-y-2 text-[11px] text-[#9aa0a6] leading-relaxed">
                  <p>
                    Jayesh Wagh is the Founder and Chief Executive Officer of PulseNote AI (pulsenoteai.in). Combining full-stack engineering and structured AI pipelines, Jayesh founded PulseNote AI to cut clerical burnout for clinicians and technical teams.
                  </p>
                  <p>
                    Under Jayesh's leadership, PulseNote AI built deterministic JSON schemas for SOAP notes, discharge summaries, referrals, engineering RFCs, and decision memos—backed by fact-checking against input transcripts and a single-provider API architecture with fallback model routing.
                  </p>
                </div>
              </div>

              {/* Press Kit Fast Facts Table */}
              <div className="p-5 rounded-xl bg-[#131314] border border-[#3c4043]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">Executive Fast Facts & Press Sheet</span>
                  <button
                    onClick={() => handleCopyText('facts', `Name: Jayesh Wagh\nTitle: Founder & CEO\nCompany: PulseNote AI\nDomain: pulsenoteai.in\nGitHub: https://github.com/jayeshwagh\nContact: contact@pulsenoteai.in\nCore Technology: Single-provider OpenRouter gateway with fallback model, Node.js, React SPA, Vite, Tailwind CSS\nKey Products: Clinical SOAP Notes, Discharge Summaries, Referral Letters, Engineering RFCs, Executive Memos\nData Practice: Do not enter patient-identifying information.`)}
                    className="text-[10px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'facts' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'facts' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-[#1e1f20] border border-[#3c4043]/30">
                    <span className="text-[#9aa0a6] block text-[10px]">Executive</span>
                    <span className="font-semibold text-white">Jayesh Wagh</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1e1f20] border border-[#3c4043]/30">
                    <span className="text-[#9aa0a6] block text-[10px]">Role</span>
                    <span className="font-semibold text-[#4e8cff]">Founder & CEO</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1e1f20] border border-[#3c4043]/30">
                    <span className="text-[#9aa0a6] block text-[10px]">GitHub</span>
                    <a href="https://github.com/jayeshwagh" target="_blank" rel="noreferrer" className="font-mono text-[#ff5757] hover:underline">
                      @jayeshwagh
                    </a>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1e1f20] border border-[#3c4043]/30">
                    <span className="text-[#9aa0a6] block text-[10px]">Official Domain</span>
                    <span className="font-mono text-white">pulsenoteai.in</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1e1f20] border border-[#3c4043]/30">
                    <span className="text-[#9aa0a6] block text-[10px]">Core Architecture</span>
                    <span className="font-semibold text-white">Single-Provider + Fallback</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1e1f20] border border-[#3c4043]/30">
                    <span className="text-[#9aa0a6] block text-[10px]">Verification</span>
                    <span className="font-semibold text-[#10b981]">Fact-Checked Schemas</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#3c4043]/50 bg-[#1e1f20]/60 flex items-center justify-between text-xs">
              <span className="text-[#9aa0a6] text-[11px]">
                PulseNote AI Press Office • <a href="mailto:contact@pulsenoteai.in" className="text-[#4e8cff] hover:underline">contact@pulsenoteai.in</a>
              </span>
              <button
                onClick={() => setShowCeoModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
