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
import { SubscriptionPlan, UserUsageState, UserProfile } from '../../types';

interface MarketingSiteProps {
  onLaunchApp: () => void;
  onOpenPricing: () => void;
  usageState?: UserUsageState;
  currentUser?: UserProfile | null;
}

// -------------------------------------------------------------
// Industry Modes Metadata & Realistic Sample Transformations
// -------------------------------------------------------------
const INDUSTRY_SHOWCASE = [
  {
    id: 'medical',
    name: 'Clinical & Medical',
    shortName: 'SOAP Notes',
    icon: Stethoscope,
    tagline: 'Transform messy doctor-patient dictations into structured, HIPAA-compliant SOAP documentation in seconds.',
    accentColor: '#10b981',
    badge: 'Healthcare & EHR',
    sampleInput: `Doctor: Patient is 58yo male presenting for follow-up of type 2 diabetes and hypertension. Reports mild bilateral lower extremity tingling over the past 2 months, worse at night. Taking Metformin 1000mg BID and Lisinopril 20mg daily. Admits he missed evening doses several times this month. No chest pain, SOB, or dizziness. Vitals today: BP 138/86, HR 74, BMI 29.4, SpO2 98%. Fasting fingerstick blood glucose is 168. Last HbA1c from 3 weeks ago was 8.2%. Monofilament exam reveals decreased sensation over 1st and 5th metatarsal heads bilaterally. Peripheral pulses 2+ intact.`,
    outputSections: [
      { label: 'Subjective', text: '58yo male with T2DM and HTN presenting for routine follow-up. Reports new-onset bilateral lower extremity paresthesias (tingling) over 2 months, nocturnally predominant. Medication adherence suboptimal (misses evening Metformin). Denies chest pain, dyspnea, or presyncope.' },
      { label: 'Objective', text: 'BP 138/86 mmHg | HR 74 bpm | BMI 29.4 | SpO2 98% on room air. Point-of-care fasting glucose: 168 mg/dL. Recent HbA1c: 8.2%. Neuro: Decreased light-touch and 10g monofilament sensation over 1st & 5th metatarsal heads bilaterally. Vascular: Dorsalis pedis and posterior tibial pulses 2+ bilaterally.' },
      { label: 'Assessment', text: '1. Type 2 diabetes mellitus with diabetic polyneuropathy, uncontrolled (ICD-10: E11.42).\n2. Essential hypertension, suboptimally controlled (ICD-10: I10).\n3. Medication non-compliance secondary to missed evening dosing.' },
      { label: 'Plan', text: '1. Titrate Metformin to ER formulation 2000mg with breakfast to enhance adherence.\n2. Initiate Gabapentin 300mg QHS for neuropathic discomfort.\n3. Order comprehensive metabolic panel, urine microalbumin-to-creatinine ratio, and repeat HbA1c in 3 months.\n4. Diabetic foot care education provided; refer to podiatry and certified diabetes care educator.\n5. Follow-up clinic encounter in 6 weeks with home blood sugar log.' }
    ],
    features: ['ICD-10 code extraction', 'Vitals auto-flagging', 'EMR/EHR export format', 'Zero-PHI retention policy']
  },
  {
    id: 'executive',
    name: 'Executive & Strategy',
    shortName: 'C-Suite Memos',
    icon: Briefcase,
    tagline: 'Synthesize complex corporate debates and stakeholder deliberations into high-stakes decision memos and risk matrices.',
    accentColor: '#0ea5e9',
    badge: 'Leadership & Board',
    sampleInput: `Board Meeting Audio Transcript: We reviewed the Q3 enterprise expansion strategy. ARR is tracking at $14.2M, up 28% YoY, but CAC increased by 42% in EMEA. Sarah proposed pausing APAC go-to-market until the regional compliance audit concludes. Marcus raised concerns that our gross margin could dip from 78% to 71% if cloud compute costs aren't optimized before the LLM inference migration. Decision reached: allocate $450k towards GPU reserved instances, delay APAC hiring by one quarter, and mandate weekly burn reviews with the VP Finance.`,
    outputSections: [
      { label: 'Executive Summary', text: 'The executive committee resolved to prioritize unit economics over geographic expansion, maintaining gross margin targets >75% prior to the Q1 LLM infrastructure rollout while deferring APAC hiring.' },
      { label: 'Key Decisions & Mandates', text: '• Approved $450,000 capital commitment for 1-year GPU reserved instances to stabilize gross margins.\n• Suspended APAC regional expansion pending ISO/SOC-2 compliance certification completion.\n• Instituted weekly executive burn-rate review led by VP Finance.' },
      { label: 'Risk & Vulnerability Matrix', text: '• CAC Inflation (High Impact, Medium Likelihood): EMEA sales efficiency declining due to elongated 90-day sales cycles.\n• Cloud Compute Volatility (High Impact, High Likelihood): Model inference cost surge threatening gross margin cushion.' },
      { label: 'Action Register & Deliverables', text: '1. Infrastructure Lead: Execute GPU reservation agreement by Friday (Target: $450k cap).\n2. VP Sales: Implement updated EMEA enterprise qualification framework by Oct 15.\n3. Legal Counsel: Finalize APAC jurisdictional compliance audit report by Nov 1.' }
    ],
    features: ['Board-ready memo generation', 'Dynamic risk prioritization matrix', 'Owner-tagged action register', 'ROI & margin impact summaries']
  },
  {
    id: 'software',
    name: 'Software & Engineering',
    shortName: 'Architecture RFCs',
    icon: Cpu,
    tagline: 'Condense rapid engineering standups and architectural syncs into structured RFCs, Jira stories, and blocker registers.',
    accentColor: '#6366f1',
    badge: 'Tech & Architecture',
    sampleInput: `Sprint Sync: Backend team discussion on migrating from polling to WebSockets for real-time collaboration. Dave flagged that redis pub/sub backplane will require Redis 7 cluster with TLS in Europe-West1. Maya is concerned about mobile battery drain with persistent sockets; recommended a fallback to HTTP long-polling with exponential backoff on backgrounding. We agreed to implement the WebSocket gateway using Node.js tsx with a 30s heartbeat ping. Jira tickets needed for cluster provisioning, client SDK reconnection logic, and stress tests for 50k concurrent rooms.`,
    outputSections: [
      { label: 'Architecture Decision Record (ADR)', text: 'Context: Real-time multi-user document collaboration requires sub-100ms synchronization across concurrent clients.\nDecision: Implement dedicated WebSocket gateway backed by Redis Cluster Pub/Sub (TLS enabled in europe-west1) with client heartbeat pings at 30-second intervals.' },
      { label: 'Technical Specifications', text: '• Protocol: WSS with bi-directional JSON frame protocol\n• Fallback Strategy: Mobile clients fall back to HTTP long-polling with exponential backoff upon background suspension\n• Backplane: Redis 7 Cluster with TLS encryption in-transit\n• Concurrency Target: 50,000 simultaneous active rooms' },
      { label: 'Identified Blockers & Mitigations', text: '• Mobile Battery Drain: Resolved via automatic socket termination after 180s in background with push wakeup.\n• Cold Start Latency: Pre-warmed connection pool in primary cloud region.' },
      { label: 'Sprint Backlog & Jira Epics', text: '1. [INFRA-402] Provision Redis 7 TLS Cluster in europe-west1\n2. [GATE-108] Build WebSocket server with 30s heartbeat & auth handshake\n3. [SDK-215] Implement exponential backoff reconnection & mobile background handler\n4. [QA-331] Run 50k concurrent room load test via k6' }
    ],
    features: ['ADR template compliance', 'Instant Jira/Linear story drafting', 'Security & latency edge analysis', 'Markdown & GitHub issue format']
  },
  {
    id: 'real_estate',
    name: 'Real Estate & Property',
    shortName: 'Property Inspection',
    icon: Building2,
    tagline: 'Convert on-site voice walk-throughs into standardized property condition reports with defect grading and remediation scopes.',
    accentColor: '#f59e0b',
    badge: 'Commercial & Appraisal',
    sampleInput: `Inspector Audio: Commercial warehouse inspection, Building B, North elevation. Foundation perimeter shows step-cracking approximately 3mm width along the northwest corner, likely caused by poor gutter drainage from the adjacent downspout. Roof membrane on the south corner has minor ponding water and granule loss over an area of roughly 120 sq ft. HVAC unit 3 on the rooftop has heavy corrosion on the compressor coils and emits abnormal vibration during startup. Electrical main panel has two double-tapped 20-amp breakers in subpanel C. Recommended urgent remediation on electrical and structural drainage.`,
    outputSections: [
      { label: 'Property Overview', text: 'Asset: Commercial Warehouse, Building B. Location Inspected: Northwest foundation, South roof elevation, Rooftop mechanical platform, Electrical subpanel C.' },
      { label: 'Defect Register & Severity Grading', text: '1. Northwest Foundation Step-Cracking (Severity: High)\n   • Finding: 3mm continuous stair-step foundation crack along grade beam.\n   • Root Cause: Inadequate stormwater redirection from gutter downspout.\n   • Remediation: Extend downspout discharge 10ft from foundation; structural engineer review.\n\n2. Electrical Subpanel C Double-Taps (Severity: High / Life Safety)\n   • Finding: Two double-tapped 20-amp breakers observed.\n   • Remediation: Install approved tandem breakers or auxiliary junction box by licensed electrician.\n\n3. Mechanical HVAC Unit 3 Vibration (Severity: Medium)\n   • Finding: Compressor coil corrosion and abnormal bearing vibration.\n   • Remediation: HVAC technician servicing and vibration dampener replacement.' },
      { label: 'Remediation Budget Estimate', text: '• Urgent (Life Safety & Water Intrusion): $4,200 – $6,500\n• Mechanical & Deferred Maintenance: $3,000 – $5,200\n• Estimated Total Capital Expenditure: $7,200 – $11,700' }
    ],
    features: ['Defect severity classification (Low/Med/High)', 'Cost estimation scaffolding', 'Location tag grouping', 'Lender & insurance ready formatting']
  },
  {
    id: 'general',
    name: 'Universal Multimodal',
    shortName: 'Multimodal Research',
    icon: Sparkles,
    tagline: 'Open-domain intelligence synthesizing complex queries with live web grounding, high-res visual generation, and video planning.',
    accentColor: '#8b5cf6',
    badge: 'Enterprise Intelligence',
    sampleInput: `Research prompt: Evaluate current commercial bottlenecks in scaling solid-state lithium-sulfur battery manufacturing. Analyze lithium dendrite growth across solid electrolyte membranes, cost parity versus LFP chemistry, and projected automotive adoption timelines through 2030. Provide an immediate strategic executive plan.`,
    outputSections: [
      { label: 'Direct Executive Synthesis', text: 'Solid-state lithium-sulfur (Li-S) cells offer 2.5x energy density (400-500 Wh/kg) over commercial LFP cells, but commercialization before 2028 is bottlenecked by polysulfide dissolution, dendrite-induced ceramic separator cracking, and low volumetric efficiency.' },
      { label: 'Technical & Commercial Bottlenecks', text: '• Membrane Degradation: Sulfide-based solid electrolytes suffer severe interfacial resistance and volumetric expansion up to 80% during cycling.\n• Cost Parity vs LFP: LFP sits at ~$65-75/kWh pack level; Li-S prototyping remains above $280/kWh due to low-yield dry electrode coating processes.\n• Supply Chain Readiness: Lack of continuous roll-to-roll ultra-thin lithium foil manufacturing (<20 microns).' },
      { label: 'Actionable Strategic Roadmap (2026-2030)', text: '1. Phase 1 (2026-2027): Focus on high-value niche segments (drones, stratospheric UAVs, eVTOL) tolerant of higher cost thresholds.\n2. Phase 2 (2028-2029): Pilot roll-to-roll sulfide composite electrolytes with hybrid polymer interlayers to suppress dendrites.\n3. Phase 3 (2030): Achieve automotive cell pack pilot qualification with target cost parity of $90/kWh.' }
    ],
    features: ['Live web-grounded insights', 'Structured markdown outputs', 'Text-to-Image & Veo video integration', 'Zero-slop executive summaries']
  }
];

// -------------------------------------------------------------
// Interactive Clinical SOAP Note Demo Presets
// -------------------------------------------------------------
const CLINICAL_SOAP_PRESETS = [
  {
    title: 'Type 2 Diabetes & Neuropathy',
    badge: 'Endocrine & Chronic Care',
    transcript: `Doctor note: 62-year-old female presents for scheduled 6-month diabetic follow-up. States her feet have been burning and 'prickly' at night for 3 months. Fasting blood sugars at home running 160 to 195. She takes Metformin 1000mg twice daily and Glipizide 5mg daily. Vitals: BP 142/88 mmHg, HR 78, Weight 184 lbs, BMI 31.2. Point of care HbA1c is 8.6% today (up from 7.4% 6 months ago). Foot inspection: No open ulcerations or calluses, but bilateral loss of protective sensation to 10g Semmes-Weinstein monofilament on plantar surfaces. DP pulses 2+ palpable bilaterally. Plan discussed: Add SGLT2 inhibitor (Empagliflozin 10mg daily), start Gabapentin 100mg TID for neuropathic burning, order microalbumin and lipid panel, and refer to diabetic educator.`
  },
  {
    title: 'Urgent Care: Acute Bronchitis',
    badge: 'Pulmonary & Acute Care',
    transcript: `Patient is a 34yo non-smoker female with a 5-day history of worsening dry hacking cough, low-grade subjective fever, and anterior chest soreness with coughing. Denies dyspnea at rest, hemoptysis, or calf pain. Vitals: Temp 99.8 F, BP 118/76, HR 82, RR 16, SpO2 99% on room air. Exam: Pharynx clear without exudate. Lungs show diffuse coarse rhonchi bilaterally that clear partially with coughing. No focal wheezes or rales. Heart sounds regular S1/S2. Rapid COVID/Flu PCR swab negative. Assessment: Acute viral bronchitis. Plan: Symptomatic treatment with benzonatate 200mg TID PRN cough, albuterol inhaler 2 puffs Q4-6H PRN wheeze, push oral fluids, avoid antibiotics as etiology is viral. Return precautions given for fever >101 or dyspnea.`
  },
  {
    title: 'Cardiology: Post-Infarction Follow-up',
    badge: 'Cardiovascular Care',
    transcript: `Cardiology follow-up for 67yo male, 8 weeks status-post drug-eluting stent to proximal LAD for STEMI. Patient reports good exercise tolerance; walking 30 minutes daily without angina, palpitations, or orthopnea. Current medications: Aspirin 81mg, Ticagrelor 90mg BID, Atorvastatin 80mg, Metoprolol succinate 50mg, Ramipril 5mg. Vitals: BP 112/68, HR 58 regular, SpO2 98%. Exam: JVP flat. Normal S1/S2 without murmurs or gallops. Lungs clear to auscultation bilaterally. No peripheral lower extremity edema. Echo from last month: LVEF 48%, mild anterior hypokinesis. Assessment: Stable post-PCI on optimal guideline-directed medical therapy (GDMT). Plan: Continue dual antiplatelet therapy for 12 months minimum. Recheck lipid profile and liver enzymes in 4 weeks. Cardiac rehab progression endorsed.`
  }
];

export const MarketingSite: React.FC<MarketingSiteProps> = ({
  onLaunchApp,
  onOpenPricing,
  usageState,
  currentUser,
}) => {
  // Active industry tab
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRY_SHOWCASE[0]);

  // SOAP Demo interactive state
  const [activeSoapPreset, setActiveSoapPreset] = useState(0);
  const [soapInputText, setSoapInputText] = useState(CLINICAL_SOAP_PRESETS[0].transcript);
  const [isSoapGenerating, setIsSoapGenerating] = useState(false);
  const [soapCopied, setSoapCopied] = useState(false);
  const [soapViewMode, setSoapViewMode] = useState<'structured' | 'raw_emr'>('structured');

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

  // Handle preset selection in SOAP demo
  const handleSelectSoapPreset = (index: number) => {
    setActiveSoapPreset(index);
    setSoapInputText(CLINICAL_SOAP_PRESETS[index].transcript);
  };

  // Simulate or execute instant SOAP transformation
  const handleGenerateSoap = () => {
    setIsSoapGenerating(true);
    setTimeout(() => {
      setIsSoapGenerating(false);
    }, 600);
  };

  const handleCopySoap = (text: string) => {
    navigator.clipboard.writeText(text);
    setSoapCopied(true);
    setTimeout(() => setSoapCopied(false), 2000);
  };

  // Structured SOAP Output based on selected preset
  const currentSoapOutput = {
    subjective: [
      { field: 'Chief Complaint', value: activeSoapPreset === 0 ? 'Bilateral burning foot pain (3 mos); diabetic evaluation' : activeSoapPreset === 1 ? 'Worsening dry hacking cough & chest tightness (5 days)' : 'Routine 8-week post-STEMI / LAD stenting evaluation' },
      { field: 'History of Present Illness', value: activeSoapPreset === 0 ? '62yo female with T2DM reports progressive nocturnal burning and paresthesias in bilateral lower extremities. Home FSG running 160-195 mg/dL.' : activeSoapPreset === 1 ? '34yo female non-smoker with acute onset dry cough, low-grade fevers, and pleuritic substernal soreness after coughing.' : '67yo male s/p LAD stent 8 weeks ago. Walking 30 min/day with zero angina, dyspnea, or presyncope.' },
      { field: 'Current Medications', value: activeSoapPreset === 0 ? 'Metformin 1000mg PO BID, Glipizide 5mg PO daily' : activeSoapPreset === 1 ? 'No regular medications. Acetaminophen PRN.' : 'Aspirin 81mg, Ticagrelor 90mg BID, Atorvastatin 80mg, Metoprolol Succinate 50mg, Ramipril 5mg' },
      { field: 'Allergies', value: 'NKDA (No known drug allergies)' }
    ],
    objective: [
      { field: 'Vital Signs', value: activeSoapPreset === 0 ? 'BP: 142/88 mmHg | HR: 78 bpm | Wt: 184 lbs | BMI: 31.2' : activeSoapPreset === 1 ? 'Temp: 99.8°F | BP: 118/76 mmHg | HR: 82 bpm | SpO2: 99% RA' : 'BP: 112/68 mmHg | HR: 58 bpm (GDMT target) | SpO2: 98% RA' },
      { field: 'Diagnostics / Labs', value: activeSoapPreset === 0 ? 'POC HbA1c: 8.6% (Uncontrolled, target <7.0%)' : activeSoapPreset === 1 ? 'Rapid COVID-19 / Influenza A+B NAAT: Negative' : 'Recent 2D Echo: LVEF 48%, mild anterior hypokinesis' },
      { field: 'Physical Examination', value: activeSoapPreset === 0 ? 'Bilateral lower extremities: Intact skin, no ulcers. Decreased 10g monofilament sensation over bilateral 1st & 5th metatarsal heads. DP pulses 2+.' : activeSoapPreset === 1 ? 'Lungs: Coarse bilateral rhonchi clearing with cough. No focal consolidation, wheezes, or rales.' : 'Cardiovascular: JVP normal. Regular rate and rhythm, normal S1/S2. No peripheral edema.' }
    ],
    assessment: [
      { icd: activeSoapPreset === 0 ? 'E11.42' : activeSoapPreset === 1 ? 'J20.9' : 'I25.10', title: activeSoapPreset === 0 ? 'Type 2 Diabetes Mellitus with Diabetic Polyneuropathy' : activeSoapPreset === 1 ? 'Acute Bronchitis, unspecified organism' : 'Atherosclerotic Heart Disease with LAD Stent', notes: activeSoapPreset === 0 ? 'HbA1c elevated at 8.6% with characteristic distal sensory neuropathy.' : activeSoapPreset === 1 ? 'Viral presentation; no evidence of bacterial pneumonia or hypoxemia.' : 'Post-infarction status stable on guideline-directed medical therapy.' }
    ],
    plan: [
      { category: 'Pharmacotherapy', details: activeSoapPreset === 0 ? 'Initiate Empagliflozin 10mg daily. Start Gabapentin 100mg PO TID for neuropathic symptoms. Continue Metformin 1000mg BID.' : activeSoapPreset === 1 ? 'Benzonatate 200mg PO TID PRN cough. Albuterol MDI 2 puffs Q4-6H PRN wheezing. Antibiotics not indicated.' : 'Maintain dual antiplatelet therapy (Aspirin + Ticagrelor) for 12 months minimum. Continue high-intensity statin & beta blocker.' },
      { category: 'Diagnostics Ordered', details: activeSoapPreset === 0 ? 'Spot urine microalbumin/creatinine ratio, comprehensive metabolic panel, repeat HbA1c in 12 weeks.' : activeSoapPreset === 1 ? 'Chest X-ray if symptoms persist past day 14 or if fever escalates.' : 'Fasting lipid panel and comprehensive metabolic panel in 4 weeks.' },
      { category: 'Patient Education & Safety', details: 'Precautions given for worsening symptoms. Red flags reviewed with patient. Comprehensive documentation filed to electronic chart.' },
      { category: 'Follow-up Interval', details: activeSoapPreset === 0 ? 'Return encounter in 6 weeks with home blood sugar log.' : activeSoapPreset === 1 ? 'PRN if fever >101°F or dyspnea develops. Otherwise routine.' : 'Return to Cardiology clinic in 3 months.' }
    ]
  };

  // Full EMR Raw string for copy/export
  const rawEmrText = `=== PULSE NOTE AI CLINICAL SUMMARY ===
PATIENT ENCOUNTER: ${CLINICAL_SOAP_PRESETS[activeSoapPreset].title}
TIMESTAMP: ${new Date().toISOString()}
COMPLIANCE: HIPAA Edge-Sanitized (Zero Retention)

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
  const FAQ_LIST = [
    {
      category: 'clinical',
      question: 'How does Pulse Note AI guarantee HIPAA compliance and patient data privacy?',
      answer: 'Pulse Note AI operates on a zero-retention, edge-sanitized architecture. Clinical dictations and patient data are processed in memory and are never stored on public disks, used to train foundational AI models, or logged in permanent telemetry. We enforce strict client-side encryption and automated PHI redacting before model execution.'
    },
    {
      category: 'clinical',
      question: 'Can Pulse Note AI output into our clinic’s specific EHR or EMR templates?',
      answer: 'Yes. Pulse Note AI provides standardized SOAP exports formatted for direct copy-paste or API injection into Epic, Cerner, AthenaHealth, Elation, and NextGen. You can toggle between human-readable clinical notes, raw text, and structured JSON schemas.'
    },
    {
      category: 'models',
      question: 'Which AI foundation models power Pulse Note AI?',
      answer: 'Pulse Note AI utilizes a dual-engine architecture: Google Gemini 2.5/Pro via the official @google/genai SDK for real-time clinical reasoning, multimodality, and Veo video synthesis; coupled with OpenRouter API integration for high-throughput model flexibility including GPT-4o-mini and Claude 3.5.'
    },
    {
      category: 'models',
      question: 'How do the 5 industry-specific formatting modes work?',
      answer: 'Each industry mode (Clinical SOAP, C-Suite Executive Memos, Software Architecture RFCs, Real Estate Defect Inspections, and Universal Multimodal) uses tuned domain prompts and deterministic JSON output schemas. Rather than returning rambling chatbot text, Pulse Note AI guarantees structured, actionable sections with dedicated key registers.'
    },
    {
      category: 'security',
      question: 'Is my corporate or healthcare intellectual property retained or reused?',
      answer: 'Never. In accordance with enterprise terms on pulsenoteai.in, all enterprise inputs belong exclusively to your organization. Zero customer data is retained for training purposes. We adhere strictly to confidential data boundaries.'
    },
    {
      category: 'pricing',
      question: 'What is included in the Free tier versus the Pro subscription?',
      answer: 'The Free tier grants 3 full multimodal transformations per day with standard queue priority. Pro (₹299/mo or ₹1,999/yr) unlocks unlimited high-speed prompt transformations across all 5 industry modes, priority GPU queuing, multi-minute audio transcription, and Veo 3.1 video generation.'
    },
    {
      category: 'pricing',
      question: 'What payment methods do you support for Pro upgrades in India and globally?',
      answer: 'For users in India, we support instant zero-fee UPI payments via any UPI app (Google Pay, PhonePe, Paytm, BHIM) to our registered merchant VPA wagh.jayesh@oksbi, plus Net Banking and Rupay/Mastercard/Visa cards. For international users, we accept all major credit cards and PayPal in USD.'
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
            <a href="#industries" className="hover:text-white transition-colors">5 Industry Modes</a>
            <a href="#soap-demo" className="hover:text-white transition-colors">Clinical SOAP Demo</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPricing}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#3c4043] bg-[#1e1f20] hover:bg-[#2d2e30] text-xs font-medium text-white transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-[#ff5757]" />
              Upgrade to Pro
            </button>

            <button
              onClick={onLaunchApp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-xs font-semibold text-white shadow-lg shadow-[#4e8cff]/20 transition-all cursor-pointer"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. Hero Section */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#4e8cff]/15 via-[#ff5757]/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Top Kicker Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1f20] border border-[#3c4043]/50 text-xs text-[#c4c7c5] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>Next-Generation Intelligent Documentation Engine</span>
            <span className="text-[#9aa0a6]">·</span>
            <span className="text-white font-medium">pulsenoteai.in</span>
          </div>

          {/* High-Impact Main Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Turn Messy Conversation Into{' '}
            <span className="bg-gradient-to-r from-[#4e8cff] via-[#d96570] to-[#ff5757] bg-clip-text text-transparent">
              Mission-Critical Documentation
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#9aa0a6] max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Eliminate hours of manual note-taking. Pulse Note AI extracts structured SOAP notes, executive memos, engineering RFCs, and property defect registers with verified clinical and enterprise schemas.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-semibold text-sm shadow-xl shadow-[#4e8cff]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Try Live AI Studio Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#soap-demo"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-[#10b981]" />
              <span>Interactive SOAP Demo</span>
            </a>
          </div>

          {/* Trust Metric Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-[#3c4043]/30 text-left">
            <div className="p-4 rounded-xl bg-[#1e1f20]/50 border border-[#3c4043]/30">
              <div className="text-2xl font-bold text-white mb-0.5">85% Faster</div>
              <div className="text-xs text-[#9aa0a6]">Documentation turnover time</div>
            </div>
            <div className="p-4 rounded-xl bg-[#1e1f20]/50 border border-[#3c4043]/30">
              <div className="text-2xl font-bold text-[#10b981] mb-0.5">HIPAA Ready</div>
              <div className="text-xs text-[#9aa0a6]">Zero retention edge security</div>
            </div>
            <div className="p-4 rounded-xl bg-[#1e1f20]/50 border border-[#3c4043]/30">
              <div className="text-2xl font-bold text-[#4e8cff] mb-0.5">5 Modes</div>
              <div className="text-xs text-[#9aa0a6]">Tailored industry schemas</div>
            </div>
            <div className="p-4 rounded-xl bg-[#1e1f20]/50 border border-[#3c4043]/30">
              <div className="text-2xl font-bold text-[#ff5757] mb-0.5">&lt; 3.2s</div>
              <div className="text-xs text-[#9aa0a6]">Average turnaround per note</div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. The 5 Industry Modes Section */}
      {/* ------------------------------------------------------------- */}
      <section id="industries" className="py-24 px-6 bg-[#18191a]/60 border-y border-[#3c4043]/30">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4e8cff] uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Precision Schemas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              5 Tailored Industry Modes. Zero Generic Chatbot Slop.
            </h2>
            <p className="text-sm sm:text-base text-[#9aa0a6]">
              A doctor does not need a Jira ticket, and an architect does not need a medical diagnosis. Pulse Note AI activates deterministic documentation engines for each domain.
            </p>
          </div>

          {/* Interactive Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 p-1.5 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 max-w-3xl mx-auto">
            {INDUSTRY_SHOWCASE.map((mode) => {
              const Icon = mode.icon;
              const isActive = selectedIndustry.id === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedIndustry(mode)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2d2e30] text-white shadow-md border border-[#3c4043]'
                      : 'text-[#9aa0a6] hover:text-white hover:bg-[#282a2c]/50'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? mode.accentColor : undefined }} />
                  <span>{mode.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Showcase Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-[#1e1f20] border border-[#3c4043]/50 rounded-2xl p-6 sm:p-10 shadow-2xl">
            
            {/* Left Column: Context & Raw Input */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#9aa0a6] mb-2">
                  <span>Industry Engine</span>
                  <span>·</span>
                  <span className="text-white font-medium">{selectedIndustry.name}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2.5">
                  <selectedIndustry.icon className="w-6 h-6" style={{ color: selectedIndustry.accentColor }} />
                  {selectedIndustry.name}
                </h3>
                <p className="text-sm text-[#9aa0a6] leading-relaxed">
                  {selectedIndustry.tagline}
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#c4c7c5] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#4e8cff]" />
                  <span>Raw Audio / Dictation Input</span>
                </div>
                <div className="p-4 rounded-xl bg-[#131314] border border-[#3c4043]/40 text-xs text-[#c4c7c5] leading-relaxed font-mono max-h-56 overflow-y-auto">
                  {selectedIndustry.sampleInput}
                </div>
              </div>

              {/* Engine Highlights */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wider">Engine Highlights</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedIndustry.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-[#c4c7c5]">
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onLaunchApp}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-semibold text-xs transition-opacity flex items-center justify-center gap-2"
              >
                <span>Launch {selectedIndustry.shortName} in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Column: Structured Transformation Output */}
            <div className="lg:col-span-7 bg-[#131314] rounded-xl border border-[#3c4043]/40 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#3c4043]/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-xs font-semibold text-white">Automated Structured Synthesis</span>
                </div>
                <div className="text-[11px] text-[#9aa0a6]">
                  Turnaround: <span className="text-white font-medium">1.8s</span> · Deterministic
                </div>
              </div>

              <div className="space-y-3.5">
                {selectedIndustry.outputSections.map((sec, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-[#1e1f20]/60 border border-[#3c4043]/20">
                    <div className="text-xs font-semibold text-[#4e8cff] uppercase tracking-wider mb-1">
                      {sec.label}
                    </div>
                    <div className="text-xs text-[#e3e3e3] whitespace-pre-line leading-relaxed font-sans">
                      {sec.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

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

          {/* Interactive Preset Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {CLINICAL_SOAP_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSoapPreset(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSoapPreset === idx
                    ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40 shadow-sm'
                    : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#3c4043]/50'
                }`}
              >
                <span>{preset.title}</span>
                <span className="text-[10px] opacity-75">({preset.badge})</span>
              </button>
            ))}
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
                  <div className="w-3 h-3 rounded-full bg-[#10b981] animate-ping" />
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

              {soapViewMode === 'raw_emr' ? (
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
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Zero Data Retention</h3>
              <p className="text-xs sm:text-sm text-[#9aa0a6] leading-relaxed">
                Inputs and transcripts are processed Ephemerally in volatile memory. No audio waveforms or patient names ever persist on disk or train commercial models.
              </p>
              <div className="pt-2 text-xs font-medium text-[#4e8cff] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Stateless memory execution</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 space-y-4 hover:border-[#10b981]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Deterministic Clinical Schemas</h3>
              <p className="text-xs sm:text-sm text-[#9aa0a6] leading-relaxed">
                Unlike open-ended chatbots that hallucinate medical prescriptions, Pulse Note AI enforces rigid JSON schema validation for vital ranges and standard ICD-10 codings.
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
              <h3 className="text-xl font-bold text-white">Multi-Engine Redundancy</h3>
              <p className="text-xs sm:text-sm text-[#9aa0a6] leading-relaxed">
                Powered by dual-rail infrastructure combining Google Gemini 2.5 Pro with OpenRouter failover to ensure 99.9% uptime during peak clinical and trading hours.
              </p>
              <div className="pt-2 text-xs font-medium text-[#ff5757] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Dual-rail failover active</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. Pricing Section */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4e8cff] uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              <span>Transparent Plans</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing For Professionals
            </h2>
            <p className="text-sm sm:text-base text-[#9aa0a6]">
              Start completely free with 3 daily transformations. Upgrade anytime for unlimited high-priority intelligence and multimodal synthesis.
            </p>

            {/* Currency & Annual Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {/* Currency Toggle */}
              <div className="flex items-center bg-[#1e1f20] p-1 rounded-xl border border-[#3c4043]/50 text-xs font-medium">
                <button
                  onClick={() => setPricingCurrency('INR')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${pricingCurrency === 'INR' ? 'bg-[#2d2e30] text-white shadow-sm' : 'text-[#9aa0a6] hover:text-white'}`}
                >
                  ₹ INR (UPI / India)
                </button>
                <button
                  onClick={() => setPricingCurrency('USD')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${pricingCurrency === 'USD' ? 'bg-[#2d2e30] text-white shadow-sm' : 'text-[#9aa0a6] hover:text-white'}`}
                >
                  $ USD (Global Cards)
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
                  SAVE 45%
                </span>
              </div>
            </div>

          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Plan 1: Free Tier */}
            <div className="p-8 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#9aa0a6] uppercase tracking-wider mb-2">Free Starter</div>
                <div className="text-3xl font-extrabold text-white mb-2">
                  {pricingCurrency === 'INR' ? '₹0' : '$0'}
                  <span className="text-xs font-normal text-[#9aa0a6]"> / forever</span>
                </div>
                <p className="text-xs text-[#9aa0a6] mb-6">
                  For students, evaluators, and occasional medical note drafting.
                </p>

                <div className="space-y-3 pt-4 border-t border-[#3c4043]/30 text-xs text-[#c4c7c5]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>3 prompt transformations daily</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>All 5 industry formatting modes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Standard queue processing speed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Clipboard & PDF exports</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLaunchApp}
                className="mt-8 w-full py-3 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Start Free Now
              </button>
            </div>

            {/* Plan 2: Pro (Featured) */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#1e1f20] to-[#17181a] border-2 border-[#4e8cff] relative flex flex-col justify-between shadow-2xl shadow-[#4e8cff]/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#4e8cff] to-[#ff5757] text-white text-[10px] font-extrabold uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-bold text-[#4e8cff] uppercase tracking-wider mb-2">
                  Pro {pricingAnnual ? 'Annual' : 'Monthly'}
                </div>
                <div className="text-3xl font-extrabold text-white mb-2">
                  {pricingCurrency === 'INR' ? (pricingAnnual ? '₹1,999' : '₹299') : (pricingAnnual ? '$24.99' : '$3.99')}
                  <span className="text-xs font-normal text-[#9aa0a6]">{pricingAnnual ? ' / year' : ' / month'}</span>
                </div>
                <p className="text-xs text-[#9aa0a6] mb-6">
                  {pricingAnnual ? 'Equivalent to ~₹166/mo. Unlimited high-speed clinical & technical synthesis.' : 'Billed monthly. Cancel anytime.'}
                </p>

                <div className="space-y-3 pt-4 border-t border-[#3c4043]/30 text-xs text-[#c4c7c5]">
                  <div className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-[#4e8cff]" />
                    <span>Unlimited daily transformations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4e8cff]" />
                    <span>Priority high-speed queue execution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4e8cff]" />
                    <span>Full Google Veo 3.1 & Imagen generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4e8cff]" />
                    <span>Instant zero-fee UPI (wagh.jayesh@oksbi)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#4e8cff]" />
                    <span>Multi-minute voice recording & transcription</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenPricing}
                className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#4e8cff]/25 transition-all cursor-pointer"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Plan 3: Enterprise & Clinic */}
            <div className="p-8 rounded-2xl bg-[#1e1f20] border border-[#3c4043]/50 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#10b981] uppercase tracking-wider mb-2">Clinic & Enterprise</div>
                <div className="text-3xl font-extrabold text-white mb-2">
                  Custom
                  <span className="text-xs font-normal text-[#9aa0a6]"> / organization</span>
                </div>
                <p className="text-xs text-[#9aa0a6] mb-6">
                  For multi-provider clinics, hospital departments, and engineering teams.
                </p>

                <div className="space-y-3 pt-4 border-t border-[#3c4043]/30 text-xs text-[#c4c7c5]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Multi-seat provider management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Custom EHR & EMR API webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Dedicated Business Associate Agreement (BAA)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Dedicated account engineering support</span>
                  </div>
                </div>
              </div>

              <a
                href="mailto:contact@pulsenoteai.in?subject=Pulse%20Note%20AI%20Clinic%20Inquiry"
                className="mt-8 w-full py-3 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-white font-medium text-xs transition-colors text-center inline-block"
              >
                Contact Enterprise Sales
              </a>
            </div>

          </div>

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
              Everything you need to know about models, clinical HIPAA guarantees, pricing, and templates.
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
              <div className="pt-2 flex items-center gap-6 text-xs text-white">
                <div>
                  <div className="font-bold text-lg text-[#10b981]">100%</div>
                  <div className="text-[#9aa0a6] text-[11px]">Strict Privacy Guarantees</div>
                </div>
                <div>
                  <div className="font-bold text-lg text-[#4e8cff]">24/7</div>
                  <div className="text-[#9aa0a6] text-[11px]">Dual-Engine Uptime</div>
                </div>
                <div>
                  <div className="font-bold text-lg text-[#ff5757]">pulsenoteai.in</div>
                  <div className="text-[#9aa0a6] text-[11px]">Official Domain</div>
                </div>
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
                Full-stack AI architect and engineer pioneering deterministic clinical synthesis and multimodal engines. Leading PulseNote AI to eliminate hours of administrative drag for healthcare providers globally.
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
                Ready to Experience Next-Generation Documentation?
              </h3>
              <p className="text-xs sm:text-sm text-[#9aa0a6]">
                Launch the studio now. 3 free prompt transformations every single day with no credit card required.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onLaunchApp}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-[#4e8cff]/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Launch Live AI Studio</span>
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
                The intelligent documentation and multimodality engine for clinical, enterprise, and technical domains.
              </p>
              <div className="text-[11px] text-white">
                Domain: <span className="text-[#4e8cff]">pulsenoteai.in</span>
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">5 Industry Modes</div>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#industries" className="hover:text-white transition-colors">Clinical SOAP Notes</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Executive Decision Memos</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Software Architecture RFCs</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Property Defect Inspection</a></li>
                <li><a href="#industries" className="hover:text-white transition-colors">Universal Intelligence</a></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Product & Tools</div>
              <ul className="space-y-2 text-[11px]">
                <li><button onClick={onLaunchApp} className="hover:text-white transition-colors text-left cursor-pointer">Live AI Studio</button></li>
                <li><a href="#soap-demo" className="hover:text-white transition-colors">Interactive SOAP Demo</a></li>
                <li><a href="/video" target="_blank" className="hover:text-white transition-colors flex items-center gap-1">AI Video Generator <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="/openrouter" target="_blank" className="hover:text-white transition-colors flex items-center gap-1">OpenRouter Portal <ExternalLink className="w-3 h-3" /></a></li>
                <li><button onClick={onOpenPricing} className="hover:text-white transition-colors text-left cursor-pointer">Pro Upgrade (UPI & Card)</button></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">Compliance & Legal</div>
              <p className="text-[11px] leading-relaxed mb-3">
                Pulse Note AI is an assistive productivity tool. All clinical notes, legal contracts, and engineering documents must be reviewed by certified professionals prior to execution.
              </p>
              <div className="text-[11px]">
                UPI Settlement: <span className="font-mono text-[#10b981]">wagh.jayesh@oksbi</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#3c4043]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              © {new Date().getFullYear()} Pulse Note AI (pulsenoteai.in). All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#about" className="hover:text-white transition-colors">Security Architecture</a>
              <a href="#faq" className="hover:text-white transition-colors">HIPAA Policy</a>
              <a href="mailto:contact@pulsenoteai.in" className="hover:text-white transition-colors">Enterprise Support</a>
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
                    onClick={() => handleCopyText('welcome', `Dear Innovator, Physician, and Builder,\n\nWelcome to PulseNote AI (pulsenoteai.in)...\n\nEvery great product starts with a point of unbearable friction. For me, that friction was watching brilliant clinicians and technical founders spend half their waking hours trapped in electronic paperwork instead of doing the work that matters.\n\nWe didn't build PulseNote AI to be another conversational novelty. We built it as an uncompromising, deterministic intelligence rail—one that transforms chaotic voice dictations and high-stakes meetings into rigorous, structured documentation instantly, while honoring zero-retention privacy.\n\nWhether you're charting your 30th patient encounter of the day or documenting a pivotal board decision, PulseNote AI is engineered to give you your time and presence back.\n\nThank you for trusting our platform. Let's build a future where documentation works for you, not against you.\n\nWarmly,\nJayesh Wagh\nFounder & CEO, PulseNote AI\ngithub.com/jayeshwagh`)}
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
                  "We didn't build PulseNote AI to be another conversational novelty. We built it as an uncompromising, deterministic intelligence rail—one that transforms chaotic voice dictations and high-stakes meetings into rigorous, structured documentation instantly, while honoring zero-retention privacy. Welcome to next-generation documentation."
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
                      onClick={() => handleCopyText('shortBio', `Jayesh Wagh is the Founder & CEO of PulseNote AI (pulsenoteai.in), an intelligent clinical documentation and multimodal synthesis platform. An engineer and systems architect, Jayesh specializes in deterministic AI pipelines, zero-retention healthcare workflows, and multi-rail LLM infrastructure designed to eliminate administrative fatigue for medical and enterprise leaders.`)}
                      className="text-[10px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSection === 'shortBio' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'shortBio' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9aa0a6]">
                    Jayesh Wagh is the Founder & CEO of PulseNote AI (pulsenoteai.in), an intelligent clinical documentation and multimodal synthesis platform. An engineer and systems architect, Jayesh specializes in deterministic AI pipelines, zero-retention healthcare workflows, and multi-rail LLM infrastructure designed to eliminate administrative fatigue for medical and enterprise leaders.
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
                    onClick={() => handleCopyText('longBio', `Jayesh Wagh is the Founder and Chief Executive Officer of PulseNote AI (pulsenoteai.in). Combining deep technical acumen in full-stack architecture, distributed systems, and modern multimodal AI APIs, Jayesh founded PulseNote AI with a mission to liberate high-consequence practitioners from clerical burnout.\n\nUnder Jayesh's leadership, PulseNote AI developed a proprietary multi-rail processing architecture integrating Google Gemini reasoning with OpenRouter failover, providing 5 distinct industry modes—ranging from HIPAA-oriented SOAP clinical dictation to software RFC generation and commercial property defect grading. Jayesh is a staunch advocate for zero-retention data privacy in AI, ensuring that patient conversations and executive strategies remain completely confidential.\n\nAn active open-source contributor and technical builder (GitHub: @jayeshwagh), Jayesh frequently explores the frontiers of edge AI, real-time audio orchestration, and video generation models like Veo, continuously pushing the boundaries of what assistive generative software can achieve.`)}
                    className="text-[10px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'longBio' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'longBio' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="space-y-2 text-[11px] text-[#9aa0a6] leading-relaxed">
                  <p>
                    Jayesh Wagh is the Founder and Chief Executive Officer of PulseNote AI (pulsenoteai.in). Combining deep technical acumen in full-stack architecture, distributed systems, and modern multimodal AI APIs, Jayesh founded PulseNote AI with a mission to liberate high-consequence practitioners from clerical burnout.
                  </p>
                  <p>
                    Under Jayesh's leadership, PulseNote AI developed a proprietary multi-rail processing architecture integrating Google Gemini reasoning with OpenRouter failover, providing 5 distinct industry modes—ranging from HIPAA-oriented SOAP clinical dictation to software RFC generation and commercial property defect grading. Jayesh is a staunch advocate for zero-retention data privacy in AI, ensuring that patient conversations and executive strategies remain completely confidential.
                  </p>
                  <p>
                    An active open-source contributor and technical builder (GitHub: @jayeshwagh), Jayesh frequently explores the frontiers of edge AI, real-time audio orchestration, and generative video pipelines, continuously pushing the boundaries of what assistive generative software can achieve.
                  </p>
                </div>
              </div>

              {/* Press Kit Fast Facts Table */}
              <div className="p-5 rounded-xl bg-[#131314] border border-[#3c4043]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">Executive Fast Facts & Press Sheet</span>
                  <button
                    onClick={() => handleCopyText('facts', `Name: Jayesh Wagh\nTitle: Founder & CEO\nCompany: PulseNote AI\nDomain: pulsenoteai.in\nGitHub: https://github.com/jayeshwagh\nContact: contact@pulsenoteai.in\nCore Technology: Dual-rail Google Gemini 2.5 + OpenRouter, Node.js, React SPA, Vite, Tailwind CSS\nKey Products: PulseNote Clinical SOAP Studio, Veo AI Video Engine, OpenRouter Chat Portal\nPrivacy Standard: Zero Data Retention (Stateless volatile processing)\nTarget Industries: Healthcare, Executive Leadership, Software Engineering, Commercial Real Estate`)}
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
                    <span className="font-semibold text-white">Dual-Rail Gemini + OpenRouter</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1e1f20] border border-[#3c4043]/30">
                    <span className="text-[#9aa0a6] block text-[10px]">Compliance</span>
                    <span className="font-semibold text-[#10b981]">Zero Data Retention</span>
                  </div>
                </div>
              </div>

              {/* Headshot Image Prompt */}
              <div className="p-5 rounded-xl bg-[#1e1f20] border border-[#3c4043]/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#ff5757]" />
                    <span>Executive Headshot Generation Prompt</span>
                  </span>
                  <button
                    onClick={() => handleCopyText('headshotPrompt', `Editorial executive studio headshot of Jayesh Wagh, Founder and CEO of PulseNote AI. Confident, charismatic, and visionary Indian tech entrepreneur in his early 30s. Warm, intelligent, focused eye contact with the camera, soft natural smile. Wearing a tailored midnight-navy blazer over a minimal dark charcoal crewneck. Modern high-tech executive office backdrop with soft bokeh, subtle slate-gray ambient lighting and subtle neon cyan and crimson rim light accents reflecting the #4e8cff and #ff5757 brand tones. Shot on Hasselblad H6D-100c with 85mm f/1.4 lens, natural cinematic rim lighting, ultra-sharp skin textures, magazine cover editorial photography for Forbes 30 Under 30 or Bloomberg Businessweek, photorealistic 8k resolution, perfectly color-graded --ar 1:1 --v 6.0`)}
                    className="text-[10px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'headshotPrompt' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'headshotPrompt' ? 'Copied' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-[#131314] font-mono text-[11px] text-[#c4c7c5] border border-[#3c4043]/30 leading-relaxed select-all">
                  Editorial executive studio headshot of Jayesh Wagh, Founder and CEO of PulseNote AI. Confident, charismatic, and visionary Indian tech entrepreneur in his early 30s. Warm, intelligent, focused eye contact with the camera, soft natural smile. Wearing a tailored midnight-navy blazer over a minimal dark charcoal crewneck. Modern high-tech executive office backdrop with soft bokeh, subtle slate-gray ambient lighting and subtle neon cyan and crimson rim light accents reflecting the #4e8cff and #ff5757 brand tones. Shot on Hasselblad H6D-100c with 85mm f/1.4 lens, natural cinematic rim lighting, ultra-sharp skin textures, magazine cover editorial photography for Forbes or Bloomberg Businessweek, photorealistic 8k resolution, perfectly color-graded --ar 1:1
                </div>
                <p className="text-[10px] text-[#9aa0a6]">
                  Optimized for Midjourney v6, FLUX.1 Pro, DALL-E 3, and Google Imagen 3.
                </p>
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
