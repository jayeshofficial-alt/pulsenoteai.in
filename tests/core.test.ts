import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  FREE_MONTHLY_NOTE_LIMIT,
  NOT_SPECIFIED_PHRASE,
  REFERRAL_BONUS_NOTES,
  checkFreeTierNoteLimit,
  verifyRazorpayWebhookSignature,
  validateAndNormalizeSoapNote,
  isGeminiFeatureEnabledForUser,
  extractClientIp,
} from '../server/coreGuards.js';

test('Free-tier note limit allows 5 notes and blocks 6th with HTTP 403 NOTE_LIMIT_REACHED', () => {
  for (let used = 0; used < FREE_MONTHLY_NOTE_LIMIT; used++) {
    const res = checkFreeTierNoteLimit({ plan: 'free', notesUsedThisMonth: used });
    assert.equal(res.allowed, true);
    assert.equal(res.remaining, FREE_MONTHLY_NOTE_LIMIT - used);
  }

  const blocked = checkFreeTierNoteLimit({ plan: 'free', notesUsedThisMonth: 5 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.error, 'NOTE_LIMIT_REACHED');
  assert.equal(blocked.remaining, 0);
});

test('Guest IP rate limit blocks 6th free note even when account count is 0', () => {
  const blockedByIp = checkFreeTierNoteLimit({
    plan: 'free',
    notesUsedThisMonth: 0,
    guestIpNotesThisMonth: 5,
    isGuest: true,
  });
  assert.equal(blockedByIp.allowed, false);
  assert.equal(blockedByIp.status, 403);
  assert.equal(blockedByIp.error, 'NOTE_LIMIT_REACHED');
});

test('Referral bonus notes extend free monthly limit by +5 and paid plans are unlimited', () => {
  const withBonus = checkFreeTierNoteLimit({
    plan: 'free',
    notesUsedThisMonth: 7,
    bonusNotes: REFERRAL_BONUS_NOTES,
  });
  assert.equal(withBonus.allowed, true);
  assert.equal(withBonus.limit, 10);
  assert.equal(withBonus.remaining, 3);

  const proUser = checkFreeTierNoteLimit({ plan: 'pro', notesUsedThisMonth: 500 });
  assert.equal(proUser.allowed, true);
  assert.equal(proUser.limit, Infinity);

  const adminUser = checkFreeTierNoteLimit({ plan: 'free', notesUsedThisMonth: 99, isAdmin: true });
  assert.equal(adminUser.allowed, true);
});

test('Razorpay webhook HMAC-SHA256 signature verification', () => {
  const secret = 'rzp_webhook_test_secret_123';
  const payload = JSON.stringify({
    event: 'subscription.activated',
    payload: { subscription: { entity: { id: 'sub_test_001', notes: { uid: 'u1', plan: 'pro' } } } },
  });

  const validSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  assert.equal(verifyRazorpayWebhookSignature(payload, validSig, secret), true);
  assert.equal(verifyRazorpayWebhookSignature(payload + ' ', validSig, secret), false);
  assert.equal(verifyRazorpayWebhookSignature(payload, validSig, 'wrong_secret'), false);
  assert.equal(verifyRazorpayWebhookSignature(payload, undefined, secret), false);
  assert.equal(verifyRazorpayWebhookSignature(payload, 'invalid_hex_sig', secret), false);
});

test('SOAP note JSON schema validation normalizes missing or legacy fields to "Not specified in transcript"', () => {
  const valid = validateAndNormalizeSoapNote({
    subjective: '45M with 2 days of substernal chest pain.',
    objective: 'BP 150/95, HR 92, ECG normal.',
    assessment: 'Not documented',
    plan: '',
  });

  assert.ok(valid);
  assert.equal(valid.subjective, '45M with 2 days of substernal chest pain.');
  assert.equal(valid.objective, 'BP 150/95, HR 92, ECG normal.');
  assert.equal(valid.assessment, NOT_SPECIFIED_PHRASE);
  assert.equal(valid.plan, NOT_SPECIFIED_PHRASE);

  const invalid = validateAndNormalizeSoapNote({ summary: 'Not a SOAP note' });
  assert.equal(invalid, null);

  const nonObject = validateAndNormalizeSoapNote('raw string');
  assert.equal(nonObject, null);
});

test('Per-user Gemini feature gating respects default, allowlist, and denylist precedence', () => {
  // Default enabled, but explicitly disabled for one user
  const defaultOn = {
    geminiEnabledDefault: true,
    geminiAllowedEmails: ['vip@clinic.org'],
    geminiDisabledEmails: ['blocked@clinic.org'],
  };
  assert.equal(isGeminiFeatureEnabledForUser(defaultOn, 'anyone@clinic.org'), true);
  assert.equal(isGeminiFeatureEnabledForUser(defaultOn, 'BLOCKED@clinic.org'), false);

  // Default disabled, enabled strictly for allowlisted user
  const defaultOff = {
    geminiEnabledDefault: false,
    geminiAllowedEmails: ['dr.patel@clinic.org'],
    geminiDisabledEmails: [],
  };
  assert.equal(isGeminiFeatureEnabledForUser(defaultOff, 'guest@clinic.org'), false);
  assert.equal(isGeminiFeatureEnabledForUser(defaultOff, 'dr.patel@clinic.org'), true);
  assert.equal(isGeminiFeatureEnabledForUser(defaultOff, null), false);

  // Explicit denylist takes precedence over allowlist
  const conflict = {
    geminiEnabledDefault: true,
    geminiAllowedEmails: ['dual@clinic.org'],
    geminiDisabledEmails: ['dual@clinic.org'],
  };
  assert.equal(isGeminiFeatureEnabledForUser(conflict, 'dual@clinic.org'), false);
});

test('extractClientIp parses x-forwarded-for safely', () => {
  assert.equal(
    extractClientIp({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' }, '127.0.0.1'),
    '203.0.113.10'
  );
  assert.equal(extractClientIp({}, '::ffff:198.51.100.7'), '198.51.100.7');
});
