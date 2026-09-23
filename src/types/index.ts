export type TargetIndustry = 'general' | 'medical' | 'real_estate' | 'software' | 'executive';

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

export interface ImageGenerationParams {
  prompt: string;
  style: string;
  lighting: string;
  composition: string;
  aspectRatio: string;
  colorPalette?: string[];
  seed?: number;
  previewUrl?: string;
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
}

export interface TransformedReport {
  id: string;
  timestamp: number;
  industry: TargetIndustry;
  title: string;
  rawInput: string;
  markdownReport: string;
  mediaType?: 'text' | 'image' | 'video';
  imageParams?: ImageGenerationParams;
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

export type UserRole = 'admin' | 'user';
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

