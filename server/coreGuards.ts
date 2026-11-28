import crypto from 'crypto';

export const NOT_SPECIFIED_PHRASE = 'Not specified in transcript';
export const FREE_MONTHLY_NOTE_LIMIT = 5;
export const REFERRAL_BONUS_NOTES = 5;

export interface NoteLimitCheckInput {
  plan: 'free' | 'pro' | 'team';
  notesUsedThisMonth: number;
  bonusNotes?: number;
  isAdmin?: boolean;
  isGuest?: boolean;
  guestIpNotesThisMonth?: number;
}

export interface NoteLimitCheckResult {
  allowed: boolean;
  status: number;
  error?: 'NOTE_LIMIT_REACHED';
  message?: string;
  limit: number;
  used: number;
  remaining: number;
}

/**
 * Enforces the free-tier monthly note limit (5 notes/month + referral bonus notes for signed-in users,
 * and 5 notes/month per IP for guest users). Pro, Team, and Admin accounts have unlimited notes.
 */
export function checkFreeTierNoteLimit(input: NoteLimitCheckInput): NoteLimitCheckResult {
  if (input.isAdmin || input.plan === 'pro' || input.plan === 'team') {
    return {
      allowed: true,
      status: 200,
      limit: Number.POSITIVE_INFINITY,
      used: input.notesUsedThisMonth,
      remaining: Number.POSITIVE_INFINITY,
    };
  }

  const bonus = Math.max(0, Number(input.bonusNotes || 0));
  const limit = input.isGuest ? FREE_MONTHLY_NOTE_LIMIT : FREE_MONTHLY_NOTE_LIMIT + bonus;
  const effectiveUsed = input.isGuest
    ? Math.max(input.notesUsedThisMonth, input.guestIpNotesThisMonth || 0)
    : input.notesUsedThisMonth;

  if (effectiveUsed >= limit) {
    return {
      allowed: false,
      status: 403,
      error: 'NOTE_LIMIT_REACHED',
      message: input.isGuest
        ? `Guest free limit reached (${FREE_MONTHLY_NOTE_LIMIT}/${FREE_MONTHLY_NOTE_LIMIT} notes this month). Sign in or upgrade to Pro for unlimited notes.`
        : `You have reached your ${limit} free notes limit for this month. Upgrade to Pro or refer a colleague for +${REFERRAL_BONUS_NOTES} extra notes.`,
      limit,
      used: effectiveUsed,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    status: 200,
    limit,
    used: effectiveUsed,
    remaining: Math.max(0, limit - effectiveUsed),
  };
}

/**
 * Verifies a Razorpay webhook payload using timing-safe HMAC-SHA256 comparison.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | undefined,
  webhookSecret: string | undefined
): boolean {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(signature.trim(), 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Normalizes a string section value, replacing empty/legacy "Not documented" placeholders
 * with the softened "Not specified in transcript" phrase.
 */
export function normalizeSectionValue(value: unknown): string {
  if (typeof value !== 'string') return NOT_SPECIFIED_PHRASE;
  const trimmed = value.trim();
  if (!trimmed) return NOT_SPECIFIED_PHRASE;
  if (/^not documented\.?$/i.test(trimmed)) {
    return NOT_SPECIFIED_PHRASE;
  }
  return trimmed;
}

export interface SoapNotePayload {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * Validates and normalizes an AI-generated SOAP note object into the strict 4-section schema.
 */
export function validateAndNormalizeSoapNote(parsed: unknown): SoapNotePayload | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const obj = parsed as Record<string, unknown>;
  const hasAnySoapKey =
    'subjective' in obj ||
    'objective' in obj ||
    'assessment' in obj ||
    'plan' in obj;

  if (!hasAnySoapKey) {
    return null;
  }

  return {
    subjective: normalizeSectionValue(obj.subjective),
    objective: normalizeSectionValue(obj.objective),
    assessment: normalizeSectionValue(obj.assessment),
    plan: normalizeSectionValue(obj.plan),
  };
}

/**
 * Normalizes any structured document object to guarantee all required keys are populated
 * with either verified content or "Not specified in transcript".
 */
export function normalizeStructuredSections(
  parsed: Record<string, unknown>,
  requiredKeys: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    result[k] = normalizeSectionValue(v);
  }
  for (const key of requiredKeys) {
    result[key] = normalizeSectionValue(parsed[key]);
  }
  return result;
}

export interface GeminiFeatureGateConfig {
  geminiEnabledDefault?: boolean;
  geminiAllowedEmails?: string[];
  geminiDisabledEmails?: string[];
}

/**
 * Evaluates whether the Gemini AI feature is enabled for a specific user.
 * - Explicit deny list takes precedence.
 * - Explicit allow list enables for that user even if default is off.
 * - Otherwise falls back to geminiEnabledDefault (defaults to false if unset).
 */
export function isGeminiFeatureEnabledForUser(
  settings: GeminiFeatureGateConfig | null | undefined,
  userEmail?: string | null
): boolean {
  if (!settings) return false;
  const normalizedEmail = (userEmail || '').toLowerCase().trim();
  const denied = (settings.geminiDisabledEmails || []).map((e) => e.toLowerCase().trim()).filter(Boolean);
  const allowed = (settings.geminiAllowedEmails || []).map((e) => e.toLowerCase().trim()).filter(Boolean);

  if (normalizedEmail && denied.includes(normalizedEmail)) {
    return false;
  }
  if (normalizedEmail && allowed.includes(normalizedEmail)) {
    return true;
  }
  return Boolean(settings.geminiEnabledDefault);
}

/**
 * Extract canonical client IP from Express request headers / socket for guest rate limiting.
 */
export function extractClientIp(headers: Record<string, string | string[] | undefined>, fallbackIp?: string): string {
  const xff = headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff[0]) {
    return xff[0].split(',')[0].trim();
  }
  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return (fallbackIp || 'unknown_ip').replace(/^::ffff:/, '');
}
