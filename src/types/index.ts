export type TargetIndustry = 'general' | 'medical' | 'real_estate' | 'software' | 'executive';

export type SearchFormatLens =
  | 'deep_research'
  | 'creative_writing'
  | 'code_generation'
  | 'business_strategy'
  | 'general_assistant';

export type FormatLensId = SearchFormatLens;
export type ResponseMode = 'research' | 'productivity' | 'problem_solving';

export interface FormatLensOption {
  id: SearchFormatLens;
  label: string;
  shortLabel: string;
  tagline: string;
  iconName: 'Search' | 'Sparkles' | 'PenTool' | 'Code' | 'TrendingUp';
  badgeColor: string;
  bgGlow: string;
}

export const FORMAT_LENSES: FormatLensOption[] = [
  {
    id: 'deep_research',
    label: 'Deep Research',
    shortLabel: 'Research',
    tagline: 'Comprehensive synthesis, source citations & evidence analysis',
    iconName: 'Search',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    bgGlow: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: 'creative_writing',
    label: 'Creative Writing',
    shortLabel: 'Creative',
    tagline: 'Narrative storytelling, scripts, marketing copy & worldbuilding',
    iconName: 'PenTool',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    bgGlow: 'from-purple-500/20 to-pink-500/20',
  },
  {
    id: 'code_generation',
    label: 'Code Generation',
    shortLabel: 'Coding',
    tagline: 'Clean system architecture, algorithms, unit tests & debugging',
    iconName: 'Code',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    bgGlow: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'business_strategy',
    label: 'Business Strategy',
    shortLabel: 'Strategy',
    tagline: 'Executive briefs, KPI frameworks, risk modeling & roadmaps',
    iconName: 'TrendingUp',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    bgGlow: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: 'general_assistant',
    label: 'General Assistant',
    shortLabel: 'Assistant',
    tagline: 'Instant balanced answers, multi-modal synthesis & task execution',
    iconName: 'Sparkles',
    badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    bgGlow: 'from-teal-500/20 to-cyan-500/20',
  },
];

export type ToneSetting = 'concise' | 'standard' | 'detailed';

export type DynamicResponseMode = 'auto' | 'research' | 'productivity' | 'problem_solving';

export interface ActionItem {
  task: string;
  owner: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  completed?: boolean;
}

export interface DetectedEntity {
  name: string;
  type: 'Person' | 'Medication' | 'Metric' | 'Location' | 'Date' | 'System' | 'Risk';
}

export interface DocumentSection {
  heading: string;
  content: string;
  severity?: 'Low' | 'Medium' | 'High' | null;
  category?: string;
}

export interface SearchSource {
  title: string;
  url?: string;
  snippet?: string;
}

export interface ImageSearchResult {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  sourceUrl?: string;
  domain: string;
  width?: number;
  height?: number;
  snippet?: string;
  aspectRatio?: string;
}

export interface ImageGenerationParams {
  prompt: string;
  style: string;
  lighting: string;
  composition: string;
  aspectRatio: string;
  colorPalette?: string[];
  seed?: number;
  previewUrl?: string;
  results?: ImageSearchResult[];
}

export interface VideoStoryboardScene {
  shotNumber: number;
  duration: string;
  camera: string;
  visualAction: string;
  audioSFX: string;
}

export interface VideoGenerationParams {
  title: string;
  targetDuration: string;
  aspectRatio: string;
  cameraMotion: string;
  visualStyle: string;
  lighting: string;
  audioPrompt: string;
  scenes: VideoStoryboardScene[];
  modelPromptVeoSora: string;
  previewPosterUrl?: string;
  videoUrl?: string;
  audioTrackUrl?: string;
}

export interface TransformedReport {
  id: string;
  timestamp: number;
  industry: TargetIndustry;
  title: string;
  rawInput: string;
  markdownReport: string;
  mediaType?: 'text' | 'image' | 'video';
  jobId?: string;
  queuePosition?: number;
  estimatedCountdownSeconds?: number;
  imageParams?: ImageGenerationParams;
  imageResults?: ImageSearchResult[];
  videoParams?: VideoGenerationParams;
  executiveSummary?: string; // 1-2 sentence direct answer or synthesis right at the top
  responseMode?: 'research' | 'productivity' | 'problem_solving';
  immediateSolution?: string;
  bestOnlinePractices?: string;
  actionableStrategicPlan?: string;
  searchSources?: SearchSource[];
  sections: DocumentSection[];
  actionItems: ActionItem[];
  detectedEntities: DetectedEntity[];
  keyTakeaways: string[];
  complianceDisclaimer?: string;
  isVague?: boolean;
  clarificationRequest?: string;
  clarifyingQuestions?: string[];
  defaultWorkingDraft?: string;
}

export type ChatbotRole =
  | 'general'
  | 'executive'
  | 'code_architect'
  | 'deep_research'
  | 'creative_producer'
  | 'medical_expert';

export interface MusicGenerationParams {
  prompt: string;
  genre?: string;
  bpm?: number;
  key?: string;
  duration?: string;
  audioUrl?: string;
  previewUrl?: string;
  modelUsed?: string;
}

export interface MediaJobStatus {
  id: string;
  mediaType: 'image' | 'video' | 'music' | 'edit_image';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  queuePosition: number;
  progressPercent: number;
  phaseMessage: string;
  estimatedSecondsRemaining: number;
  totalDurationSeconds: number;
  result?: {
    mediaType: 'image' | 'video' | 'music';
    previewUrl: string;
    downloadUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    posterUrl?: string;
    prompt: string;
    aspectRatio: string;
    style: string;
    modelUsed?: string;
    musicMeta?: {
      bpm?: number;
      genre?: string;
      key?: string;
      duration?: string;
    };
    imageParams?: ImageGenerationParams;
    videoParams?: VideoGenerationParams;
  };
  error?: string;
}

export interface IndustryConfig {
  id: TargetIndustry;
  name: string;
  shortName: string;
  tagline: string;
  icon: string;
  color: string;
  bgGlow: string;
  badgeBg: string;
  badgeText: string;
  templateFormat: string;
  keyFields: string[];
}

export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_annual' | 'admin_grant';

export interface UserUsageState {
  dailyPromptCount: number;
  lastResetDate: string; // YYYY-MM-DD
  isPro: boolean;
  activePlan: SubscriptionPlan;
  subscribedAt?: number;
  expiresAt?: number | null;
  transactionRef?: string;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  priceINR: number;
  priceUSD: number;
  billingPeriod: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  savingsBadge?: string;
}

export type UserRole = 'admin' | 'user' | 'client';
export type UserStatus = 'pending_activation' | 'active' | 'suspended';

export interface UserSubscriptionInfo {
  tier: 'free' | 'pro_monthly' | 'pro_annual' | 'admin_grant';
  isPro: boolean;
  startDate: number;
  expiresAt: number | null; // null for perpetual/free
  grantedByAdmin?: boolean;
  grantDuration?: {
    amount: number;
    unit: 'days' | 'months' | 'years';
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isActivated: boolean;
  activationToken?: string;
  privacyConsent: boolean;
  consentTimestamp: string;
  subscription: UserSubscriptionInfo;
  dailyPromptCount: number;
  lastPromptDate: string;
  createdAt: number;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  orderId: string;
  planId: SubscriptionPlan | 'admin_grant';
  planName: string;
  amount: number;
  currency: 'INR' | 'USD';
  paymentMethod: string;
  transactionRef: string;
  settlementVpa: string;
  timestamp: number;
  status: 'completed' | 'failed' | 'refunded';
}

export interface UserActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  industry: TargetIndustry;
  rawInput: string;
  solutionTitle: string;
  timestamp: number;
}

export interface SystemEmailNotification {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  type: 'welcome_activation' | 'password_reset_otp' | 'subscription_active' | 'subscription_expired';
  bodyText: string;
  actionUrl?: string;
  actionLabel?: string;
  sentAt: number;
  otpCode?: string;
}

export interface AppInterfaceSettings {
  appTagline: string;
  announcementBanner: string;
  isBannerActive: boolean;
  heroHeadline: string;
  heroSubhead: string;
  customComplianceNote: string;
  updatedAt: number;
  lastUpdatedBy: string;
}

export interface ChatMessageAttachment {
  name: string;
  size: number;
  type: string;
  base64?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  report?: TransformedReport;
  attachments?: ChatMessageAttachment[];
  feedback?: 'like' | 'dislike' | null;
  creativeMode?: 'text' | 'image' | 'video' | 'music' | 'live_voice' | 'maps_query';
  modelUsed?: string;
  groundingSources?: { title?: string; url?: string; snippet?: string }[];
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  currentReport?: TransformedReport;
  industry?: TargetIndustry;
}

// =========================================================================
// GOOGLE FLOW ENGINE: Multi-Modal Infinite Canvas Types
// =========================================================================
export type FlowNodeType = 'research' | 'image' | 'video' | 'code' | 'document' | 'audio' | 'prompt';
export type FlowNodeStatus = 'idle' | 'generating' | 'completed' | 'error';

export interface FlowNodeVersion {
  id: string;
  timestamp: number;
  authorName: string;
  authorEmail?: string;
  title: string;
  prompt?: string;
  previewUrl?: string;
  summary?: string;
}

export interface FlowNodeComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorEmail?: string;
  text: string;
  timestamp: number;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: 'image' | 'video' | 'document' | 'other';
  previewUrl?: string;
  data?: string;
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  title: string;
  prompt: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  status: FlowNodeStatus;
  progress?: number;
  attachment?: AttachedFile;
  report?: TransformedReport;
  imageParams?: ImageGenerationParams;
  imageResults?: ImageSearchResult[];
  videoParams?: VideoGenerationParams;
  codeSnippet?: {
    language: string;
    code: string;
    output?: string;
  };
  audioParams?: {
    prompt: string;
    audioUrl?: string;
    bpm?: number;
    genre?: string;
  };
  ownerId?: string;
  ownerName: string;
  ownerEmail?: string;
  ownerAvatar?: string;
  createdAt: number;
  updatedAt: number;
  versions: FlowNodeVersion[];
  comments: FlowNodeComment[];
  colorAccent?: string;
  tags?: string[];
}

export interface FlowConnection {
  id: string;
  fromNodeId?: string;
  toNodeId?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  label?: string;
  type?: 'derivation' | 'reference' | 'pipeline' | 'parent_child';
  style?: string;
  color?: string;
  createdAt?: number;
}

export interface FlowCollaborator {
  id: string;
  name: string;
  email: string;
  color: string;
  avatarUrl?: string;
  x?: number;
  y?: number;
  activeNodeId?: string;
  lastSeen: number;
}

export interface FlowProject {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  ownerId: string;
  ownerName: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  collaborators: FlowCollaborator[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  thumbnail?: string;
}


