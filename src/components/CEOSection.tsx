import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Quote,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Award,
  FileText,
  X,
  Mail,
  Globe,
  CheckCircle2,
  Cpu,
  Layers,
  HeartHandshake
} from 'lucide-react';

// ============================================================================
// CEO_PROFILE CONFIGURATION
// Edit this object to update executive content and facts site-wide.
// ============================================================================
export const CEO_PROFILE = {
  name: 'Jayesh Wagh',
  role: 'Founder & CEO',
  company: 'PulseNote AI',
  domain: 'pulsenoteai.in',
  siteUrl: 'https://pulsenoteai.in',
  githubHandle: '@jayeshwagh',
  githubUrl: 'https://github.com/jayeshwagh',
  email: 'contact@pulsenoteai.in',
  upiHandle: 'wagh.jayesh@oksbi',
  initials: 'JW',
  
  tagline: 'Full-stack AI architect and engineer pioneering deterministic clinical synthesis and multimodal workflow engines.',

  quote: 
    'Clinicians and technical leaders should never have to fight software just to record what happened in the room. When you replace administrative friction with deterministic intelligence, you don\'t just save hours—you restore human focus and empathy.',

  shortBio: 
    'Jayesh Wagh is the Founder & CEO of PulseNote AI (pulsenoteai.in), an intelligent clinical documentation and multimodal synthesis platform. An engineer and systems architect, Jayesh specializes in deterministic AI pipelines, zero-retention healthcare workflows, and multi-rail LLM infrastructure designed to eliminate administrative fatigue for medical and enterprise leaders.',

  longBio: [
    'Jayesh Wagh is the Founder and Chief Executive Officer of PulseNote AI (pulsenoteai.in). Combining deep technical acumen in full-stack architecture, distributed systems, and modern generative AI APIs, Jayesh founded PulseNote AI with a mission to liberate high-consequence practitioners from clerical burnout.',
    'Under Jayesh\'s leadership, PulseNote AI developed a proprietary multi-rail processing architecture integrating Google Gemini reasoning with OpenRouter failover, providing 5 distinct industry modes—ranging from HIPAA-oriented SOAP clinical dictation to software RFC generation and commercial property defect grading. Jayesh is a staunch advocate for zero-retention data privacy in AI, ensuring that patient conversations and executive strategies remain completely confidential.',
    'An active open-source contributor and technical builder (GitHub: @jayeshwagh), Jayesh frequently explores the frontiers of edge AI, real-time audio orchestration, and video generation models like Veo, continuously pushing the boundaries of what assistive generative software can achieve.'
  ],

  welcomeMessage: {
    greeting: 'Dear Innovator, Physician, and Builder,',
    p1: 'Every great product begins with a point of unbearable friction. For me, that friction was watching brilliant clinicians and technical founders spend half their waking hours trapped in electronic paperwork instead of doing the work that matters.',
    p2: 'We didn\'t build PulseNote AI to be another conversational novelty that writes rambling paragraphs. We built it as an uncompromising, deterministic intelligence rail—one that transforms chaotic voice dictations and high-stakes meetings into rigorous, structured documentation instantly, while honoring zero-retention privacy.',
    p3: 'Whether you\'re charting your 30th patient encounter of the day or documenting a pivotal architecture decision, PulseNote AI is engineered to give you your time and presence back. Thank you for trusting our platform. Let\'s build a future where software serves you, not the other way around.',
    signature: 'Jayesh Wagh\nFounder & CEO, PulseNote AI'
  },

  headshotPrompt: 
    'Editorial executive studio headshot of Jayesh Wagh, Founder and CEO of PulseNote AI. Confident, charismatic, and visionary Indian tech entrepreneur in his early 30s. Warm, intelligent, focused direct eye contact with the camera, subtle natural smile. Wearing a tailored midnight-navy blazer over a minimal dark charcoal crewneck. Modern high-tech executive office backdrop with soft bokeh, subtle slate-gray ambient lighting and subtle cyan (#4e8cff) and crimson (#ff5757) rim light accents reflecting the brand tones. Shot on Hasselblad H6D-100c with 85mm f/1.4 lens, natural cinematic rim lighting, ultra-sharp skin textures, magazine cover editorial photography for Forbes 30 Under 30 or Bloomberg Businessweek, photorealistic 8k resolution, perfectly color-graded --ar 1:1 --v 6.0',

  fastFacts: [
    { label: 'Executive', value: 'Jayesh Wagh', highlight: false },
    { label: 'Role', value: 'Founder & CEO', highlight: true, color: 'text-[#4e8cff]' },
    { label: 'GitHub', value: '@jayeshwagh', link: 'https://github.com/jayeshwagh', highlight: true, color: 'text-[#ff5757]' },
    { label: 'Official Domain', value: 'pulsenoteai.in', link: 'https://pulsenoteai.in', highlight: false },
    { label: 'Core Architecture', value: 'Dual-Rail Gemini + OpenRouter', highlight: false },
    { label: 'Compliance Standard', value: 'Zero Data Retention (ZDR)', highlight: true, color: 'text-[#10b981]' },
    { label: 'Industry Modes', value: '5 Domain Lenses (Clinical, Exec, Dev, RE, Multimodal)', highlight: false },
    { label: 'Direct Press Desk', value: 'contact@pulsenoteai.in', link: 'mailto:contact@pulsenoteai.in', highlight: false }
  ],

  pillars: [
    {
      icon: ShieldCheck,
      title: 'Zero Data Retention',
      description: 'Zero audio or transcript persistence. In-memory execution only.',
      accent: '#10b981'
    },
    {
      icon: Cpu,
      title: 'Deterministic Schemas',
      description: 'Structured JSON output with ICD-10 codings, eliminating hallucinated text.',
      accent: '#4e8cff'
    },
    {
      icon: Layers,
      title: 'Dual-Rail Resilience',
      description: 'Google Gemini 2.5 Pro primary engine with high-throughput OpenRouter failover.',
      accent: '#ff5757'
    }
  ]
};

// ============================================================================
// CEOSection Component
// ============================================================================
export const CEOSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [showPressKitModal, setShowPressKitModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'shortBio' | 'longBio' | 'facts' | 'prompt'>('welcome');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section id="leadership" className={`relative py-20 px-6 overflow-hidden ${className}`}>
      
      {/* Background ambient glow matching brand tokens (#4e8cff -> #ff5757) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-[#4e8cff]/10 via-[#6366f1]/5 to-[#ff5757]/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1f20] border border-[#3c4043]/50 text-xs font-semibold text-[#4e8cff]"
          >
            <Award className="w-3.5 h-3.5 text-[#ff5757]" />
            <span>Executive Leadership & Vision</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
          >
            Built by Engineers. Trusted by Clinicians.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-[#9aa0a6] leading-relaxed"
          >
            PulseNote AI is architected from the ground up to solve administrative cognitive fatigue. Founded by Jayesh Wagh to bring deterministic accuracy to high-consequence industries.
          </motion.p>
        </div>

        {/* Main Founder Showcase Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-[#1e1f20]/90 backdrop-blur-md border border-[#3c4043]/60 p-8 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle accent border line on top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4e8cff] via-[#6366f1] to-[#ff5757]" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Avatar & Executive Badges (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-5">
              
              <div className="flex items-center gap-4">
                {/* Executive Avatar Container */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#4e8cff] via-[#6366f1] to-[#ff5757] p-[2.5px] shadow-xl shadow-[#4e8cff]/20 transition-transform group-hover:scale-105 duration-300">
                    <div className="w-full h-full rounded-[14px] bg-[#131314] flex flex-col items-center justify-center text-white">
                      <span className="font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-[#c4c7c5]">
                        {CEO_PROFILE.initials}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10b981] border-2 border-[#131314] rounded-full flex items-center justify-center shadow" title="Active Founder">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-2xl font-bold text-white tracking-tight">{CEO_PROFILE.name}</h3>
                  </div>
                  <div className="text-xs font-semibold text-[#4e8cff] mt-0.5 flex items-center gap-1.5">
                    <span>{CEO_PROFILE.role}</span>
                    <span className="text-[#3c4043]">•</span>
                    <span className="text-[#9aa0a6]">{CEO_PROFILE.company}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px]">
                    <a 
                      href={CEO_PROFILE.githubUrl}
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#131314] border border-[#3c4043]/50 text-[#ff5757] font-mono hover:border-[#ff5757] transition-colors"
                    >
                      <span>{CEO_PROFILE.githubHandle}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span className="text-[#3c4043]">•</span>
                    <span className="text-[#9aa0a6] font-mono text-[11px]">{CEO_PROFILE.domain}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#9aa0a6] leading-relaxed">
                {CEO_PROFILE.tagline}
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => setShowPressKitModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-[#4e8cff]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Press Kit & Dossier</span>
                </button>

                <a
                  href={`mailto:${CEO_PROFILE.email}`}
                  className="px-3.5 py-2 rounded-xl bg-[#131314] hover:bg-[#202124] border border-[#3c4043]/60 text-xs font-medium text-[#c4c7c5] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#4e8cff]" />
                  <span>Contact Desk</span>
                </a>
              </div>

            </div>

            {/* Right Column: Signature Quote & Principles (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Quote Card */}
              <div className="p-5 rounded-xl bg-[#131314] border border-[#3c4043]/50 relative shadow-inner">
                <Quote className="w-7 h-7 text-[#4e8cff]/30 absolute top-4 right-4" />
                <p className="text-xs sm:text-sm text-[#e3e3e3] italic font-medium leading-relaxed pr-8">
                  "{CEO_PROFILE.quote}"
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#9aa0a6] border-t border-[#3c4043]/30 pt-2.5">
                  <span className="font-semibold text-white">— {CEO_PROFILE.name}, Founder & CEO</span>
                  <button
                    onClick={() => handleCopy('quote-card', `"${CEO_PROFILE.quote}" — ${CEO_PROFILE.name}`)}
                    className="hover:text-white transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    {copiedKey === 'quote-card' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'quote-card' ? 'Copied' : 'Copy Quote'}</span>
                  </button>
                </div>
              </div>

              {/* Founder Principles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CEO_PROFILE.pillars.map((pillar, i) => {
                  const Icon = pillar.icon;
                  return (
                    <div 
                      key={i} 
                      className="p-3.5 rounded-xl bg-[#18191a] border border-[#3c4043]/40 space-y-1.5 hover:border-[#4e8cff]/40 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" style={{ color: pillar.accent }} />
                        <span className="text-[11px] font-bold text-white">{pillar.title}</span>
                      </div>
                      <p className="text-[10px] text-[#9aa0a6] leading-normal">
                        {pillar.description}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </motion.div>

      </div>

      {/* ===================================================================== */}
      {/* Comprehensive Press Kit & Executive Modal */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {showPressKitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setShowPressKitModal(false)} />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-[#18191a] border border-[#3c4043] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
            >
              
              {/* Modal Top Bar */}
              <div className="p-5 sm:p-6 border-b border-[#3c4043]/60 flex items-center justify-between bg-[#1e1f20]/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4e8cff] to-[#ff5757] p-0.5 shadow-md shadow-[#4e8cff]/20">
                    <div className="w-full h-full rounded-[10px] bg-[#131314] flex items-center justify-center text-white font-extrabold text-sm">
                      {CEO_PROFILE.initials}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">{CEO_PROFILE.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[10px] font-semibold">
                        Press Kit
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9aa0a6]">
                      Official Dossier & Media Kit • {CEO_PROFILE.domain}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPressKitModal(false)}
                  className="w-8 h-8 rounded-lg bg-[#242528] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#3c4043]/40 bg-[#151617] overflow-x-auto text-xs">
                {[
                  { id: 'welcome', label: 'Welcome Letter' },
                  { id: 'shortBio', label: 'Short Bio' },
                  { id: 'longBio', label: 'Full Bio' },
                  { id: 'facts', label: 'Fast Facts' },
                  { id: 'prompt', label: 'Headshot Prompt' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-2 font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id 
                        ? 'border-[#4e8cff] text-white font-semibold' 
                        : 'border-transparent text-[#9aa0a6] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content Scroll Area */}
              <div className="p-6 space-y-6 overflow-y-auto text-xs text-[#c4c7c5] leading-relaxed custom-scrollbar flex-1">
                
                {/* TAB 1: Welcome Message */}
                {activeTab === 'welcome' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#4e8cff] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Executive Welcome Message</span>
                      </span>
                      <button
                        onClick={() => handleCopy('welcome', `${CEO_PROFILE.welcomeMessage.greeting}\n\n${CEO_PROFILE.welcomeMessage.p1}\n\n${CEO_PROFILE.welcomeMessage.p2}\n\n${CEO_PROFILE.welcomeMessage.p3}\n\n${CEO_PROFILE.welcomeMessage.signature}`)}
                        className="text-[11px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'welcome' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'welcome' ? 'Copied' : 'Copy Letter'}</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-xl bg-[#131314] border border-[#3c4043]/50 space-y-3 font-normal">
                      <p className="font-semibold text-white">{CEO_PROFILE.welcomeMessage.greeting}</p>
                      <p className="text-[#e3e3e3]">{CEO_PROFILE.welcomeMessage.p1}</p>
                      <p className="text-[#c4c7c5]">{CEO_PROFILE.welcomeMessage.p2}</p>
                      <p className="text-[#c4c7c5]">{CEO_PROFILE.welcomeMessage.p3}</p>
                      <div className="pt-2 text-white font-semibold whitespace-pre-line border-t border-[#3c4043]/30">
                        {CEO_PROFILE.welcomeMessage.signature}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Short Bio */}
                {activeTab === 'shortBio' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#4e8cff]">
                        Short Bio (Speaker Intro & Social Profiles)
                      </span>
                      <button
                        onClick={() => handleCopy('shortBio', CEO_PROFILE.shortBio)}
                        className="text-[11px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'shortBio' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'shortBio' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-xl bg-[#131314] border border-[#3c4043]/50 space-y-3">
                      <p className="text-sm text-[#e3e3e3] leading-relaxed">
                        {CEO_PROFILE.shortBio}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1e1f20] border border-[#3c4043]/40 space-y-1.5">
                      <div className="text-[11px] font-bold text-white uppercase tracking-wider">Suggested Usage</div>
                      <p className="text-[11px] text-[#9aa0a6]">
                        Ideal for Twitter/X bio, GitHub README intro, podcast/conference program guides, and partner one-pagers.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: Long Bio */}
                {activeTab === 'longBio' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#4e8cff]">
                        Full Narrative Bio (Media & Press Kits)
                      </span>
                      <button
                        onClick={() => handleCopy('longBio', CEO_PROFILE.longBio.join('\n\n'))}
                        className="text-[11px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'longBio' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'longBio' ? 'Copied' : 'Copy Full Bio'}</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-xl bg-[#131314] border border-[#3c4043]/50 space-y-3.5">
                      {CEO_PROFILE.longBio.map((paragraph, idx) => (
                        <p key={idx} className="text-xs sm:text-sm text-[#c4c7c5] leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: Fast Facts */}
                {activeTab === 'facts' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#4e8cff]">
                        Executive & Organization Fact Sheet
                      </span>
                      <button
                        onClick={() => handleCopy('facts', CEO_PROFILE.fastFacts.map(f => `${f.label}: ${f.value}`).join('\n'))}
                        className="text-[11px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'facts' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'facts' ? 'Copied' : 'Copy All Facts'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CEO_PROFILE.fastFacts.map((fact, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-[#131314] border border-[#3c4043]/40 flex flex-col justify-between">
                          <span className="text-[10px] text-[#9aa0a6] uppercase tracking-wider">{fact.label}</span>
                          {fact.link ? (
                            <a 
                              href={fact.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className={`text-xs font-semibold hover:underline flex items-center gap-1 mt-0.5 ${fact.color || 'text-white'}`}
                            >
                              <span>{fact.value}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className={`text-xs font-semibold mt-0.5 ${fact.color || 'text-white'}`}>
                              {fact.value}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: Headshot Generation Prompt */}
                {activeTab === 'prompt' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff5757] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>AI Executive Portrait Prompt</span>
                      </span>
                      <button
                        onClick={() => handleCopy('prompt', CEO_PROFILE.headshotPrompt)}
                        className="text-[11px] text-[#9aa0a6] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'prompt' ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'prompt' ? 'Copied' : 'Copy Prompt'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-[#131314] font-mono text-[11px] text-[#e3e3e3] border border-[#3c4043]/50 leading-relaxed select-all">
                      {CEO_PROFILE.headshotPrompt}
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#1e1f20] border border-[#3c4043]/40 text-[11px] text-[#9aa0a6] space-y-1">
                      <div className="font-semibold text-white">Generation Parameters:</div>
                      <div>• Compatible with: Midjourney v6, FLUX.1 Pro, DALL-E 3, and Google Imagen 3</div>
                      <div>• Recommended aspect ratio: 1:1 (Profile Avatar) or 3:4 (Executive Editorial)</div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Bottom Footer */}
              <div className="p-4 border-t border-[#3c4043]/50 bg-[#1e1f20]/70 flex items-center justify-between text-xs">
                <span className="text-[#9aa0a6] text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Authorized Press Dossier</span>
                </span>
                <button
                  onClick={() => setShowPressKitModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default CEOSection;
