export interface BlogPostSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: {
    label: string;
    text: string;
  };
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  metaDescription: string;
  category: 'Clinical Templates' | 'Documentation Guide' | 'Best Practices';
  publishedAt: string;
  readTime: string;
  author: string;
  keywords: string[];
  sections: BlogPostSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'soap-note-templates-primary-care',
    title: 'SOAP Note Templates for Primary Care',
    excerpt:
      'Practical, deterministic SOAP note structures for primary care clinicians—covering chronic disease follow-ups, acute visits, and preventative exams without charting bloat.',
    metaDescription:
      'Explore structured SOAP note templates for primary care clinics. Learn how fixed section schemas and explicit missing-data markers eliminate clinical documentation errors.',
    category: 'Clinical Templates',
    publishedAt: '2026-10-12',
    readTime: '6 min read',
    author: 'PulseNote AI Editorial',
    keywords: [
      'SOAP note templates',
      'primary care documentation',
      'clinical SOAP format',
      'medical charting template',
    ],
    sections: [
      {
        heading: 'Why Primary Care Needs Rigid SOAP Structure',
        paragraphs: [
          'Primary care physicians move rapidly between acute upper respiratory visits, multi-morbidity chronic care reviews, and preventative physicals. When note layouts drift from patient to patient, handoffs slow down and billing audits flag missing documentation.',
          'A deterministic SOAP template keeps every encounter predictable: Subjective, Objective, Assessment, and Plan always appear in the same order, and omitted details are explicitly labeled "Not specified in transcript" rather than filled in by guesswork.',
        ],
      },
      {
        heading: 'Core Sections of a High-Signal Primary Care SOAP Note',
        paragraphs: [
          'Whether charting an annual hypertension check or an acute urgent visit, each of the four SOAP blocks should carry strictly verifiable encounter facts:',
        ],
        bullets: [
          'Subjective (S): Chief complaint, OLDCARTS history of present illness, relevant review of systems, active medications, and allergies as stated by the patient.',
          'Objective (O): Recorded vital signs (BP, HR, Temp, SpO2, BMI), physical exam findings by system, and point-of-care or lab diagnostics.',
          'Assessment (A): Primary working impression and differential diagnoses directly supported by Subjective and Objective findings, paired with ICD-10-CM code review.',
          'Plan (P): Medication initiations or adjustments with exact doses, diagnostic orders, patient education, red-flag return precautions, and follow-up interval.',
        ],
      },
      {
        heading: 'Sample Primary Care Encounter Template',
        paragraphs: [
          'A concise chronic care follow-up (for example, Type 2 Diabetes with blood pressure monitoring) can be captured in 60 seconds of raw dictation and structured into clean EHR-ready sections immediately after the patient leaves the room.',
        ],
        callout: {
          label: 'Verification Standard',
          text: 'Never invent normal physical exam findings or negative review-of-systems items that were not performed. Always mark unstated sections as "Not specified in transcript" for attending review.',
        },
      },
    ],
  },
  {
    slug: 'how-to-write-discharge-summary',
    title: 'How to Write a Discharge Summary',
    excerpt:
      'A step-by-step clinical framework for writing clear, safe hospital discharge summaries that reduce readmissions and keep outpatient primary care teams aligned.',
    metaDescription:
      'Learn how to write a complete hospital discharge summary with admission/discharge diagnoses, reconciled medications, hospital course, and red-flag follow-up instructions.',
    category: 'Documentation Guide',
    publishedAt: '2026-10-18',
    readTime: '7 min read',
    author: 'PulseNote AI Editorial',
    keywords: [
      'how to write a discharge summary',
      'hospital discharge summary template',
      'care transition documentation',
      'medication reconciliation',
    ],
    sections: [
      {
        heading: 'The Discharge Summary Is a Care-Transition Safety Document',
        paragraphs: [
          'The transition from inpatient care back to primary care is one of the highest-risk handoffs in medicine. A clear discharge summary answers four questions for the receiving clinician in under two minutes: why the patient was admitted, what changed during hospitalization, what medications they are going home on, and what needs follow-up.',
        ],
      },
      {
        heading: 'Mandatory Fields Every Discharge Summary Should Include',
        paragraphs: [
          'Standardizing your discharge summary template ensures critical details never get buried in narrative prose:',
        ],
        bullets: [
          'Admission & Discharge Dates plus primary attending service.',
          'Admission Diagnosis and Final Discharge Diagnosis (including secondary active problems).',
          'Concise Hospital Course organized by problem—highlighting key imaging, cultures, procedures, and clinical stability at discharge.',
          'Reconciled Discharge Medications clearly distinguishing new prescriptions, dose changes, and held/discontinued home medications.',
          'Pending Results (such as final cultures or pathology) with the clinician responsible for follow-up.',
          'Follow-Up Appointments and explicit Red-Flag Return Precautions written in plain language.',
        ],
      },
      {
        heading: 'Preventing Medication Discrepancies',
        paragraphs: [
          'Medication errors account for a large share of preventable 30-day readmissions. When using PulseNote AI to draft a discharge summary from rounds notes, every medication name and dosage is cross-checked against your raw input transcript so unverified drug names or doses are flagged for clinician review before sign-off.',
        ],
        callout: {
          label: 'Clinical Reminder',
          text: 'All AI-assisted discharge summaries are drafts. A licensed clinician must review medication reconciliation, pending labs, and follow-up dates prior to release.',
        },
      },
    ],
  },
  {
    slug: 'clinical-documentation-best-practices',
    title: 'Clinical Documentation Best Practices',
    excerpt:
      'Seven field-tested clinical documentation habits that protect patient safety, prevent hallucinated chart entries, and cut after-hours pajama time for clinicians.',
    metaDescription:
      'Adopt clinical documentation best practices for accuracy, audit readiness, and clinician time savings using deterministic schemas and transcript fact-checking.',
    category: 'Best Practices',
    publishedAt: '2026-10-24',
    readTime: '5 min read',
    author: 'PulseNote AI Editorial',
    keywords: [
      'clinical documentation best practices',
      'medical charting accuracy',
      'reduce EHR burnout',
      'clinical note audit readiness',
    ],
    sections: [
      {
        heading: '1. Ground Every Claim in Observed Encounter Facts',
        paragraphs: [
          'Copy-forward habits and generic AI auto-completions introduce subtle chart inaccuracies—such as documenting a normal cranial nerve exam that was never performed. High-integrity documentation records only what was actually reported, measured, or ordered during the visit.',
        ],
      },
      {
        heading: '2. Use Deterministic Templates Over Freeform Prose',
        paragraphs: [
          'Freeform paragraphs force colleagues, coders, and consultants to hunt for key values. Fixed schemas—whether SOAP notes, specialist referral letters, or progress notes—ensure vital signs, assessments, and medication plans live in the exact same place every time.',
        ],
      },
      {
        heading: '3. Verify Numbers, Dosages, and Dates Before Sign-Off',
        paragraphs: [
          'Numeric transcription slips (for example, 50mg vs 500mg or HbA1c 6.8% vs 8.6%) carry real clinical risk. Build a two-step review habit:',
        ],
        bullets: [
          'Review highlighted fact-check warnings comparing generated dosages, vitals, and dates against the raw dictation.',
          'Confirm every section labeled "Not specified in transcript" is either intentionally omitted or completed from your direct clinical observation.',
          'Validate suggested ICD-10-CM codes for clinical specificity (laterality, acuity, and complications) before finalizing the encounter.',
        ],
      },
      {
        heading: '4. Protect Patient Privacy During Drafting',
        paragraphs: [
          'Keep direct patient-identifying information out of external drafting fields whenever possible, use secure authenticated sessions, and maintain clear deletion control over stored drafts.',
        ],
        callout: {
          label: 'Zero-Fabrication Principle',
          text: 'Same input, same output. Predictable clinical documentation restores physician focus while keeping licensed clinicians in complete control of the medical record.',
        },
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
