import { TargetIndustry } from '../types';

export interface PresetSample {
  id: string;
  title: string;
  industry: TargetIndustry;
  preview: string;
  rawText: string;
}

export const PRESET_SAMPLES: PresetSample[] = [
  {
    id: 'univ-1',
    industry: 'general',
    title: 'Deep Search: Solid-State Battery Supply Chains',
    preview: 'Open-domain inquiry into lithium-sulfur battery bottlenecks and scaling roadmap...',
    rawText: `We need an authoritative strategic evaluation of current commercial bottlenecks in scaling solid-state lithium-sulfur battery manufacturing. Analyze lithium sourcing constraints, electrolyte membrane degradation issues, and cost parity targets vs LFP cells. Provide immediate solution steps and online industry benchmark standards.`,
  },
  {
    id: 'img-1',
    industry: 'general',
    title: 'Multi-Modal: Cyberpunk Neon Metropolis (Image Prompt)',
    preview: 'Generate an ultra-detailed cinematic photograph of a rain-soaked futuristic metropolis...',
    rawText: `Create a cinematic photograph of a futuristic cyberpunk metropolis in heavy rain at night. Neon signs reflecting off wet asphalt streets, flying vehicles weaving between holographic skyscrapers, atmospheric fog and volumetric steam vents, shot on 35mm lens with shallow depth of field.`,
  },
  {
    id: 'vid-1',
    industry: 'general',
    title: 'Multi-Modal: Autonomous Drone Delivery (Video Storyboard)',
    preview: 'Generate a video scene of a sleek delivery drone navigating city canyons at sunset...',
    rawText: `Generate a video scene of an aerodynamic high-tech delivery drone flying through a sunset city canyon. Establish shot with drone taking off, medium tracking shot following its flight path past glass high-rises, and final hero close-up as it delivers package onto a rooftop landing pad with warm golden hour lighting and lens flares.`,
  },
  {
    id: 'med-1',
    industry: 'medical',
    title: 'Dr. Exam Memo: Adult Asthma Exacerbation',
    preview: 'Patient John Miller, 44yo, presenting with worsening dyspnea and nighttime wheezing...',
    rawText: `Dr. Ramirez dictating... uh patient is John Miller, 44 year old male, came in complaining of like severe shortness of breath especially at night for the past four days. He says his rescue albuterol inhaler barely gives him two hours of relief now. Um, on physical exam, BP is 142 over 88, heart rate 94, respiratory rate is 22, O2 saturation on room air is 93%. Lungs reveal bilateral expiratory wheezing, pretty diffuse throughout the lower and middle lobes, no stridor. No peripheral edema noted. 
Assessment is moderate persistent asthma with acute exacerbation, likely triggered by recent viral URI. 
So plan: we're gonna put him on a 5-day oral Prednisone burst 40 milligrams daily every morning with food. Step up his maintenance to Budesonide/Formoterol 160/4.5 mcg two puffs twice daily. Instructed him on peak flow monitoring and gave him an updated Asthma Action Plan. Follow up in clinic with me in 7 to 10 days or go to ER immediately if peak flow drops below 50% or if severe chest tightness develops. Nurse Sarah will schedule the follow up by tomorrow afternoon.`,
  },
  {
    id: 'med-2',
    industry: 'medical',
    title: 'Post-Op Knee Arthroscopy Rounding',
    preview: 'Status post right knee partial meniscectomy, Day 1 post-op notes...',
    rawText: `Hey dictating post op rounds for Sarah Higgins, age 32, status post right knee arthroscopic partial medial meniscectomy performed yesterday morning. Patient is resting in bed, reports pain is controlled at 3 out of 10 with oral oxycodone 5mg PRN and scheduled Tylenol 1000mg q8h. 
Exam: Right knee dressing is clean, intact, minimal serosanguinous strike-through. Distal pedal pulses 2+ symmetric, capillary refill under 2 seconds, sensation intact in deep and superficial peroneal distributions. Passive range of motion 0 to 60 degrees tolerated well. 
Plan: Discontinue IV fluids. Physical therapy consult today for crutch gait training and initial quad-set home exercises. Prescribe DVT prophylaxis with enteric coated Aspirin 81mg twice daily for 2 weeks. Discharge home this afternoon once cleared by PT. Follow up with Dr. Chen at sports medicine clinic in 12 days for suture removal.`,
  },
  {
    id: 're-1',
    industry: 'real_estate',
    title: 'Basement & HVAC Walkthrough (42 Elm St)',
    preview: 'Inspector audio log: Northwest foundation wall, efflorescence, 18-year furnace...',
    rawText: `Recording notes at 42 Elm Street, in the unfinished basement area. Okay, looking at the northwest foundation poured concrete wall, I'm seeing significant efflorescence and active moisture staining along the lower 18 inches. There's also a diagonal hairline step crack measuring roughly 1/16 inch starting near the window well down to the footing. 
Next, moving over to the mechanical room. The heating system is an original Carrier gas-fired forced air unit, data plate indicates manufactured in 2006, so it's about 18 to 19 years old which exceeds typical 15-year design life expectancy. Heavy surface corrosion on the heat exchanger jacket and burner draft hood. Filter is completely clogged with drywall dust. 
Also noticed the main electrical subpanel right here has two double-tapped 20-amp tandem breakers without proper manufacturer clip.
Remediation: Northwest wall needs sealing and grading inspection by a licensed foundation specialist. Recommend immediate HVAC evaluation and replacement budgeting by certified technician. Double-tapped breakers must be corrected by licensed electrician prior to closing.`,
  },
  {
    id: 're-2',
    industry: 'real_estate',
    title: 'Commercial Roof & Drainage Audit',
    preview: 'Flat TPO membrane roof, standing water ponds, flashing failure at parapet...',
    rawText: `Inspection memo for 880 Industrial Parkway, commercial building flat roof. Inspected the 15,000 sq ft white TPO single-ply roof. 
First observation: North-central quadrant has substantial ponding water approximately 1.5 inches deep over an area of roughly 300 square feet, which indicates sagging decking or clogged internal roof drains. 
Second issue: Along the south parapet wall, the counter-flashing is loose and pulling away from the masonry mortar joints in at least three places, leaving exposed gaps where driving rain can penetrate the building envelope. Severity is high due to imminent leak risk to warehouse inventory below.
Third: The rooftop condenser unit RTU-2 is missing its service access panel cover, leaving electrical wiring exposed to weather elements. 
Action required: Clean and scope internal roof drain lines within 48 hours. Roofing contractor must re-anchor and reseal parapet counter-flashing before next rainfall. HVAC technician to reinstall weatherproof service cover.`,
  },
  {
    id: 'tech-1',
    industry: 'software',
    title: 'Sprint 42 Auth & Caching Standup / Post-Mortem',
    preview: 'Redis cluster latency spikes, JWT token refresh race condition, PR 402 blocked...',
    rawText: `Quick standup notes from team sync this morning. So we had that P1 incident yesterday with the auth-service where Redis cluster nodes were hitting 99% CPU because of uncached user session lookups. Alex investigated and found the JWT refresh token rotation had a race condition causing infinite retry loops from the mobile client. 
We made a temporary decision to increase the Redis connection pool size from 50 to 200 connections and added a 500ms jitter to the client retry interceptor. 
Blockers: We are completely blocked on shipping the payment migration in PR #402 because the staging database migration failed on Postgres 16 foreign key validation. Marcus needs help from DB admin Priya to debug the lock contention.
Action items: Alex to submit hotfix PR for JWT race condition by 2 PM today. Marcus and Priya will run the migration test in staging sandboxed environment by end of day. Elena needs to update the Datadog alert threshold for Redis CPU to 80% with an on-call PagerDuty trigger by tomorrow morning.`,
  },
  {
    id: 'tech-2',
    industry: 'software',
    title: 'Database Sharding Architecture Review',
    preview: 'Customer tenancy partitioning, read-replicas, Vitess vs Citus evaluation...',
    rawText: `Architecture review meeting notes for Core Platform. Problem: Our single primary PostgreSQL cluster is at 78% storage capacity and write IOPS are peaking at 12,000 during US market open. 
Decisions agreed upon: We will adopt application-level hash sharding by organization_id across 8 shards instead of Citus extension to avoid proprietary vendor lock-in. All analytics queries must be routed strictly to asynchronous read-replicas with maximum 2-second replication lag tolerance. 
Blockers: Currently our ORM models lack tenant_id in 14 join tables, which blocks shard routing without full cross-table scans. 
Jira items: Dave to write ADR (Architectural Decision Record) 089 for the hashing algorithm by Wednesday. Sofia to audit and draft PRs adding tenant_id to the 14 unpartitioned tables by Friday sprint cut. Liam to benchmark connection pool memory usage with PgBouncer vs Supavisor by next Monday.`,
  },
  {
    id: 'exec-1',
    industry: 'executive',
    title: 'Q3 Board Expansion & Headcount Strategy',
    preview: 'EU market entry delayed, 14% customer CAC increase, strategic hiring freeze...',
    rawText: `Executive debrief from quarterly strategy meeting with CEO, CFO, and VP Sales. 
Key decisions: We decided to delay the Munich office opening and European localized roll-out from Q3 to Q1 of next year due to regulatory compliance delays with EU AI Act filings. We are freezing all non-engineering headcount for the next two quarters to protect our 18-month cash runway.
Strategic takeaways: Enterprise customer acquisition cost went up 14% year over year, but net revenue retention remains healthy at 118%. Sales cycle for enterprise deals lengthened from 45 days to 78 days.
Risks: High risk of enterprise churn in the logistics vertical if the SAP API connector is not completed before October renewals. Macro supply chain tariffs could impact hardware gross margins by 350 basis points.
Action register: CFO Carlos to present revised 2027 burn-rate model to the Board by September 30. VP Product Maya will personally meet with the top 5 at-risk logistics accounts by Friday. Legal team (Rachel) must complete the German entity corporate structure by October 15.`,
  },
  {
    id: 'vague-test',
    industry: 'software',
    title: 'Guardrail Test: Vague Input',
    preview: 'Testing the system guardrail with ambiguous/contextless notes...',
    rawText: `stuff broke today. need to fix things soon. someone talk to Bob.`,
  },
];

export const INDUSTRY_CONFIGS = [
  {
    id: 'general',
    name: 'Universal Search & Multimodal',
    shortName: 'Universal Intelligence',
    tagline: 'Open-domain reasoning, multimodal image & video generation, deep search',
    icon: 'Sparkles',
    color: '#8b5cf6',
    bgGlow: 'rgba(139, 92, 246, 0.15)',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    badgeText: 'text-purple-400',
    templateFormat: 'Executive Summary • Structured Breakdown • Strategic Roadmap • Web Insights',
    keyFields: ['Executive Summary', 'Core Insights', 'Execution Roadmap', 'Web Grounding', 'Action Register'],
  },
  {
    id: 'medical',
    name: 'Medical / Clinical',
    shortName: 'Clinical SOAP',
    tagline: 'Compliant clinical summaries, SOAP notes & treatment plans',
    icon: 'Stethoscope',
    color: '#10b981',
    bgGlow: 'rgba(16, 185, 129, 0.15)',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    badgeText: 'text-emerald-400',
    templateFormat: 'Chief Complaint • Subjective • Objective • Assessment • Plan',
    keyFields: ['Chief Complaint', 'Subjective & Objective', 'Clinical Assessment', 'Plan & Rx', 'Compliance Disclaimer'],
  },
  {
    id: 'real_estate',
    name: 'Real Estate / Property Inspection',
    shortName: 'Property Inspection',
    tagline: 'Location-tagged defect observations, severity ratings & remediations',
    icon: 'Building2',
    color: '#f59e0b',
    bgGlow: 'rgba(245, 158, 11, 0.15)',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    badgeText: 'text-amber-400',
    templateFormat: 'Location • Observation • Severity (Low/Med/High) • Remediation',
    keyFields: ['Location', 'Defect Observation', 'Severity Level', 'Recommended Remediation', 'Action Items'],
  },
  {
    id: 'software',
    name: 'Software / Technical Sprint',
    shortName: 'Agile Sprint Sync',
    tagline: 'User story synopses, architectural decisions, blockers & Jira tickets',
    icon: 'Cpu',
    color: '#6366f1',
    bgGlow: 'rgba(99, 102, 241, 0.15)',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    badgeText: 'text-indigo-400',
    templateFormat: 'User Stories • Tech Decisions • Blockers Identified • Jira Tasks',
    keyFields: ['User Story Summary', 'Technical Decisions', 'Active Blockers', 'Action Items & PRs'],
  },
  {
    id: 'executive',
    name: 'General Executive / Consulting',
    shortName: 'Executive Memo',
    tagline: 'High-level decisions, strategic takeaways, risk matrices & deliverables',
    icon: 'Briefcase',
    color: '#0ea5e9',
    bgGlow: 'rgba(14, 165, 233, 0.15)',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    badgeText: 'text-sky-400',
    templateFormat: 'Key Decisions • Strategic Takeaways • Risks • Action Register',
    keyFields: ['Key Decisions', 'Strategic Takeaways', 'Identified Risks', 'Action Register & Owners'],
  },
] as const;
