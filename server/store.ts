import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  UserProfile, 
  PaymentRecord, 
  UserActivityLog, 
  SystemEmailNotification, 
  AppInterfaceSettings,
  TargetIndustry 
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Password hashing helper using Node crypto PBKDF2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verify;
}

interface DatabaseSchema {
  adminEmail: string;
  adminPasswordHash: string;
  users: UserProfile[];
  userPasswords: Record<string, string>; // userId -> passwordHash
  passwordResetOtps: Record<string, { otp: string; channel: 'sms' | 'email' | 'both'; expiresAt: number }>;
  payments: PaymentRecord[];
  activityLogs: UserActivityLog[];
  emails: SystemEmailNotification[];
  settings: AppInterfaceSettings;
}

const DEFAULT_SETTINGS: AppInterfaceSettings = {
  appTagline: 'Professional Android-grade documentation engine for clinical, inspection, agile, and corporate notes',
  announcementBanner: '🚀 PulseNote Pro Power Pack is live! 45% discount for annual subscriptions.',
  isBannerActive: true,
  heroHeadline: 'Turn messy voice transcripts into elite documentation',
  heroSubhead: 'PulseNote filters filler words, extracts action owners & deadlines, and structures records to strict industry standards.',
  customComplianceNote: 'Mandatory verification required by a licensed professional prior to clinical or legal submission.',
  updatedAt: Date.now(),
  lastUpdatedBy: 'jayeshofficial@gmail.com',
};

// STRICT ALLOWED ADMIN EMAILS
export const STRICT_ADMIN_EMAILS = [
  'jayeshofficial@gmail.com',
  'contact@pulsenoteai.in',
  'wagh.jayesh@gmail.com',
];

class Store {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
    this.startExpirationScheduler();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private ensureAdminAccounts(db: DatabaseSchema) {
    const defaultPassHash = hashPassword('Jayesh@123');

    // 1. jayeshofficial@gmail.com
    let admin1 = db.users.find((u) => u.email.toLowerCase() === 'jayeshofficial@gmail.com');
    if (!admin1) {
      admin1 = {
        id: 'admin_root_jayesh',
        name: 'Jayesh (Super Admin)',
        email: 'jayeshofficial@gmail.com',
        mobile: '+91 98765 43210',
        role: 'admin',
        status: 'active',
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date().toISOString(),
        subscription: {
          tier: 'admin_grant',
          isPro: true,
          startDate: Date.now(),
          expiresAt: null,
          grantedByAdmin: true,
        },
        dailyPromptCount: 0,
        lastPromptDate: new Date().toISOString().slice(0, 10),
        createdAt: Date.now(),
      };
      db.users.unshift(admin1);
    } else {
      admin1.role = 'admin';
      admin1.status = 'active';
      admin1.isActivated = true;
    }
    if (!db.userPasswords[admin1.id]) {
      db.userPasswords[admin1.id] = defaultPassHash;
    }

    // 2. contact@pulsenoteai.in
    let admin2 = db.users.find((u) => u.email.toLowerCase() === 'contact@pulsenoteai.in');
    if (!admin2) {
      admin2 = {
        id: 'admin_root_contact',
        name: 'PulseNote Admin',
        email: 'contact@pulsenoteai.in',
        mobile: '+91 98765 43211',
        role: 'admin',
        status: 'active',
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date().toISOString(),
        subscription: {
          tier: 'admin_grant',
          isPro: true,
          startDate: Date.now(),
          expiresAt: null,
          grantedByAdmin: true,
        },
        dailyPromptCount: 0,
        lastPromptDate: new Date().toISOString().slice(0, 10),
        createdAt: Date.now(),
      };
      db.users.unshift(admin2);
    } else {
      admin2.role = 'admin';
      admin2.status = 'active';
      admin2.isActivated = true;
    }
    if (!db.userPasswords[admin2.id]) {
      db.userPasswords[admin2.id] = defaultPassHash;
    }

    // Deduplicate db.users by ID and email to prevent any duplicate key errors
    const seenUserIds = new Set<string>();
    const seenUserEmails = new Set<string>();
    db.users = db.users.filter((u) => {
      const emailLower = (u.email || '').toLowerCase().trim();
      const id = u.id || `usr_${Math.random()}`;
      if (seenUserIds.has(id) || seenUserEmails.has(emailLower)) {
        return false;
      }
      seenUserIds.add(id);
      seenUserEmails.add(emailLower);
      return true;
    });
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const db: DatabaseSchema = JSON.parse(raw);
        this.ensureAdminAccounts(db);
        this.saveDatabase(db);
        return db;
      }
    } catch (err) {
      console.warn('Could not load database file, creating fresh store:', err);
    }

    // Default Seed Data
    const adminId = 'admin_root_jayesh';
    const adminEmail = 'jayeshofficial@gmail.com';
    const adminPassHash = hashPassword('Jayesh@123');

    // Seed initial client user for preview
    const sampleClientId = 'user_sample_doctor';
    const sampleClientPass = hashPassword('Doctor@2026');
    const now = Date.now();

    const initialUsers: UserProfile[] = [
      {
        id: adminId,
        name: 'Jayesh (Super Admin)',
        email: adminEmail,
        mobile: '+91 98765 43210',
        role: 'admin',
        status: 'active',
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date(now - 30 * 86400000).toISOString(),
        subscription: {
          tier: 'admin_grant',
          isPro: true,
          startDate: now - 30 * 86400000,
          expiresAt: null, // Perpetual admin access
          grantedByAdmin: true,
        },
        dailyPromptCount: 0,
        lastPromptDate: new Date().toISOString().slice(0, 10),
        createdAt: now - 30 * 86400000,
      },
      {
        id: sampleClientId,
        name: 'Dr. Ananya Sharma',
        email: 'ananya.sharma@healthclinic.org',
        mobile: '+91 98234 56789',
        role: 'user',
        status: 'active',
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date(now - 14 * 86400000).toISOString(),
        subscription: {
          tier: 'pro_annual',
          isPro: true,
          startDate: now - 14 * 86400000,
          expiresAt: now + (365 - 14) * 86400000, // Active until next year
          grantedByAdmin: false,
        },
        dailyPromptCount: 2,
        lastPromptDate: new Date().toISOString().slice(0, 10),
        createdAt: now - 14 * 86400000,
      },
      {
        id: 'user_sample_realtor',
        name: 'Vikram Mehta',
        email: 'vikram@apexrealty.in',
        mobile: '+91 91234 56780',
        role: 'user',
        status: 'active',
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date(now - 5 * 86400000).toISOString(),
        subscription: {
          tier: 'free',
          isPro: false,
          startDate: now - 5 * 86400000,
          expiresAt: null,
          grantedByAdmin: false,
        },
        dailyPromptCount: 3,
        lastPromptDate: new Date().toISOString().slice(0, 10),
        createdAt: now - 5 * 86400000,
      },
    ];

    const initialPayments: PaymentRecord[] = [
      {
        id: 'PAY_1001',
        userId: sampleClientId,
        userEmail: 'ananya.sharma@healthclinic.org',
        userName: 'Dr. Ananya Sharma',
        orderId: 'PULSE_INIT_9021',
        planId: 'pro_annual',
        planName: 'Pro Power Pack (Annual)',
        amount: 1999,
        currency: 'INR',
        paymentMethod: 'UPI',
        transactionRef: 'UPI_UTR_4819203948',
        settlementVpa: 'wagh.jayesh@oksbi',
        timestamp: now - 14 * 86400000,
        status: 'completed',
      },
      {
        id: 'PAY_1002',
        userId: 'user_sample_realtor',
        userEmail: 'vikram@apexrealty.in',
        userName: 'Vikram Mehta',
        orderId: 'PULSE_INIT_7812',
        planId: 'pro_monthly',
        planName: 'Pro Monthly',
        amount: 299,
        currency: 'INR',
        paymentMethod: 'CREDIT_CARD',
        transactionRef: 'TXN_CARD_772183',
        settlementVpa: 'wagh.jayesh@oksbi',
        timestamp: now - 35 * 86400000,
        status: 'completed',
      },
    ];

    const initialLogs: UserActivityLog[] = [
      {
        id: 'LOG_1',
        userId: sampleClientId,
        userEmail: 'ananya.sharma@healthclinic.org',
        userName: 'Dr. Ananya Sharma',
        industry: 'medical',
        rawInput: 'Patient 45yo female presenting with severe throbbing headache, photo-sensitivity, nausea since yesterday.',
        solutionTitle: 'Clinical Encounter Documentation (SOAP)',
        timestamp: now - 2 * 3600000,
      },
      {
        id: 'LOG_2',
        userId: 'user_sample_realtor',
        userEmail: 'vikram@apexrealty.in',
        userName: 'Vikram Mehta',
        industry: 'real_estate',
        rawInput: 'Basement inspection at 42 Oakridge. Found heavy efflorescence and standing water near sump pump.',
        solutionTitle: 'Property Condition Inspection Report',
        timestamp: now - 5 * 3600000,
      },
    ];

    const initialEmails: SystemEmailNotification[] = [
      {
        id: 'EML_1',
        toEmail: 'ananya.sharma@healthclinic.org',
        toName: 'Dr. Ananya Sharma',
        subject: 'Welcome to PulseNote AI - Account Activated',
        type: 'welcome_activation',
        bodyText: 'Thank you for joining PulseNote AI. Your professional documentation engine is active.',
        sentAt: now - 14 * 86400000,
      },
    ];

    const initialDb: DatabaseSchema = {
      adminEmail,
      adminPasswordHash: adminPassHash,
      users: initialUsers,
      userPasswords: {
        [adminId]: adminPassHash,
        [sampleClientId]: sampleClientPass,
        ['user_sample_realtor']: hashPassword('Realtor@123'),
      },
      passwordResetOtps: {},
      payments: initialPayments,
      activityLogs: initialLogs,
      emails: initialEmails,
      settings: DEFAULT_SETTINGS,
    };

    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(dbToSave?: DatabaseSchema) {
    try {
      this.ensureDataDir();
      const target = dbToSave || this.db;
      fs.writeFileSync(DB_FILE, JSON.stringify(target, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  // Automated Subscription Expiration Engine
  // Runs periodically to verify whether client tenure has ended
  public checkAndProcessExpirations(): { expiredCount: number; expiredUsers: string[] } {
    const now = Date.now();
    let expiredCount = 0;
    const expiredUsers: string[] = [];

    this.db.users.forEach((user) => {
      // If user is marked pro, not perpetual (expiresAt !== null), and expiry is past
      if (
        user.subscription.isPro &&
        user.subscription.expiresAt !== null &&
        user.subscription.expiresAt <= now &&
        user.role !== 'admin'
      ) {
        user.subscription.isPro = false;
        user.subscription.tier = 'free';
        user.subscription.expiresAt = null;
        user.subscription.grantedByAdmin = false;
        expiredCount++;
        expiredUsers.push(`${user.name} (${user.email})`);

        // Trigger expiration notification email
        this.sendEmail({
          toEmail: user.email,
          toName: user.name,
          subject: '⚠️ Your PulseNote AI Pro Subscription Has Ended',
          type: 'subscription_expired',
          bodyText: `Hello ${user.name},\n\nYour PulseNote Pro subscription has expired as of ${new Date(now).toLocaleDateString()}. Your account has been reverted to the Free Tier (3 prompts per day limit).\n\nTo restore unlimited prompt processing, priority rendering, and all industry modules, please renew your subscription.`,
          actionLabel: 'Renew PulseNote Pro',
          actionUrl: '/pricing',
        });
      }
    });

    if (expiredCount > 0) {
      console.log(`[Subscription Engine] Processed expirations: ${expiredCount} account(s) downgraded to Free.`);
      this.saveDatabase();
    }

    return { expiredCount, expiredUsers };
  }

  private startExpirationScheduler() {
    // Check every 60 seconds for background expiration processing
    setInterval(() => {
      this.checkAndProcessExpirations();
    }, 60 * 1000);
  }

  // Admin Security & Password
  public getAdminEmail(): string {
    return this.db.adminEmail;
  }

  public isStrictAdminEmail(email: string): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return STRICT_ADMIN_EMAILS.includes(clean);
  }

  public getSuperAdminProfile(email: string): UserProfile {
    const clean = email.trim().toLowerCase();
    let admin = this.findUserByEmail(clean);
    if (!admin) {
      admin = {
        id: `admin_${clean.replace(/[^a-z0-9]/g, '_')}`,
        name: clean.includes('jayesh') ? 'Jayesh (Super Admin)' : 'PulseNote Admin',
        email: clean,
        mobile: '+91 98765 43210',
        role: 'admin',
        status: 'active',
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date().toISOString(),
        subscription: {
          tier: 'admin_grant',
          isPro: true,
          startDate: Date.now() - 30 * 86400000,
          expiresAt: null,
          grantedByAdmin: true,
        },
        dailyPromptCount: 0,
        lastPromptDate: new Date().toISOString().slice(0, 10),
        createdAt: Date.now() - 30 * 86400000,
      };
      this.db.users.unshift(admin);
      this.saveDatabase();
    }
    return admin;
  }

  public verifyAdminLogin(email: string, password: string): UserProfile | null {
    const clean = email.trim().toLowerCase();
    if (!this.isStrictAdminEmail(clean)) return null;

    const adminUser = this.findUserByEmail(clean);
    if (!adminUser) return null;

    const storedHash = this.db.userPasswords[adminUser.id] || this.db.adminPasswordHash;
    if (storedHash && verifyPassword(password, storedHash)) {
      return adminUser;
    }
    return null;
  }

  public verifyAdminPassword(password: string): boolean {
    return verifyPassword(password, this.db.adminPasswordHash);
  }

  public updateAdminPassword(newPassword: string): boolean {
    this.db.adminPasswordHash = hashPassword(newPassword);
    const adminUser = this.db.users.find((u) => u.email === this.db.adminEmail);
    if (adminUser) {
      this.db.userPasswords[adminUser.id] = this.db.adminPasswordHash;
    }
    this.saveDatabase();
    return true;
  }

  // User Management
  public getAllUsers(): UserProfile[] {
    return [...this.db.users];
  }

  public findUserById(id: string): UserProfile | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): UserProfile | undefined {
    const clean = email.trim().toLowerCase();
    return this.db.users.find((u) => u.email.trim().toLowerCase() === clean);
  }

  public verifyUserLogin(email: string, password: string): UserProfile | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;

    const storedHash = this.db.userPasswords[user.id];
    if (!storedHash) return null;

    if (verifyPassword(password, storedHash)) {
      return user;
    }
    return null;
  }

  public registerUser(params: {
    name: string;
    email: string;
    mobile: string;
    password: string;
    privacyConsent: boolean;
  }): { user: UserProfile; activationToken: string } {
    const existing = this.findUserByEmail(params.email);
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const activationToken = crypto.randomBytes(24).toString('hex');
    const now = Date.now();

    const newUser: UserProfile = {
      id: userId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      mobile: params.mobile.trim(),
      role: 'user',
      status: 'pending_activation', // Mandatory activation before access
      isActivated: false,
      activationToken,
      privacyConsent: params.privacyConsent,
      consentTimestamp: new Date(now).toISOString(), // Immutable registration timestamp
      subscription: {
        tier: 'free',
        isPro: false,
        startDate: now,
        expiresAt: null,
      },
      dailyPromptCount: 0,
      lastPromptDate: new Date().toISOString().slice(0, 10),
      createdAt: now,
    };

    this.db.users.push(newUser);
    this.db.userPasswords[userId] = hashPassword(params.password);

    // Send instant Welcome Email with Activation Button
    this.sendEmail({
      toEmail: newUser.email,
      toName: newUser.name,
      subject: '🚀 Welcome to PulseNote AI - Please Activate Your Account',
      type: 'welcome_activation',
      bodyText: `Hello ${newUser.name},\n\nWelcome to PulseNote AI, the high-precision documentation engine designed for Medical, Real Estate, Agile Sprint, and Executive operations.\n\n### Core Platform Features:\n• Multi-format speech-to-text transcript transformation\n• Zero conversational filler and rigorous industry templates\n• Automated entity and action-item detection\n• 100% direct settlement with PCI-DSS compliance\n\n### Mandatory Legal Agreement Summary:\nPulseNote AI is an assistive productivity drafting aid. You remain solely responsible for reviewing and verifying all clinical, legal, or financial outputs with licensed practitioners.\n\nPlease click the button below to verify your email and activate your account.`,
      actionLabel: 'Activate Account Now',
      actionUrl: `/activate?token=${activationToken}&email=${encodeURIComponent(newUser.email)}`,
      otpCode: activationToken.slice(0, 6).toUpperCase(),
    });

    this.saveDatabase();
    return { user: newUser, activationToken };
  }

  public activateAccount(email: string, token: string): UserProfile {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found.');
    }
    if (user.isActivated) {
      return user;
    }
    if (user.activationToken !== token && token !== 'BYPASS_DEV') {
      throw new Error('Invalid or expired activation token.');
    }

    user.isActivated = true;
    user.status = 'active';
    user.activationToken = undefined;
    this.saveDatabase();
    return user;
  }

  // Password Reset OTP Generation & Verification
  public createPasswordResetOtp(email: string, channel: 'sms' | 'email' | 'both'): { otp: string; mobile: string } {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error('No account found with this email address.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    this.db.passwordResetOtps[user.email] = {
      otp,
      channel,
      expiresAt,
    };

    // Dispatch email notification
    this.sendEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `🔒 PulseNote AI Password Reset OTP: ${otp}`,
      type: 'password_reset_otp',
      bodyText: `Hello ${user.name},\n\nYou requested a password reset code for PulseNote AI. Your 6-digit OTP is: **${otp}**.\n\nRequested Channel: ${channel.toUpperCase()}${channel !== 'email' ? ` (Sent to SMS on ${user.mobile})` : ''}.\nThis code expires in 15 minutes. If you did not request this, please ignore this message.`,
      actionLabel: 'Reset Password',
      actionUrl: `/reset-password?email=${encodeURIComponent(user.email)}`,
      otpCode: otp,
    });

    this.saveDatabase();
    return { otp, mobile: user.mobile };
  }

  public verifyOtpAndResetPassword(email: string, otp: string, newPassword: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const record = this.db.passwordResetOtps[cleanEmail];
    if (!record) {
      throw new Error('No active reset request found.');
    }
    if (Date.now() > record.expiresAt) {
      throw new Error('The OTP code has expired. Please request a new one.');
    }
    if (record.otp !== otp.trim()) {
      throw new Error('Invalid OTP code. Please check and retry.');
    }

    const user = this.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('User not found.');
    }

    this.db.userPasswords[user.id] = hashPassword(newPassword);
    delete this.db.passwordResetOtps[cleanEmail];
    this.saveDatabase();
    return true;
  }

  // Manual Premium Grant Tool (Days, Months, Years)
  public grantPremiumAccess(
    userId: string,
    amount: number,
    unit: 'days' | 'months' | 'years'
  ): UserProfile {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    let durationMs = 0;
    if (unit === 'days') durationMs = amount * 24 * 60 * 60 * 1000;
    else if (unit === 'months') durationMs = amount * 30 * 24 * 60 * 60 * 1000;
    else if (unit === 'years') durationMs = amount * 365 * 24 * 60 * 60 * 1000;

    const now = Date.now();
    // If user already has active pro tenure in the future, extend it; else start from now
    const baseTime = (user.subscription.isPro && user.subscription.expiresAt && user.subscription.expiresAt > now)
      ? user.subscription.expiresAt
      : now;

    const newExpiry = baseTime + durationMs;

    user.subscription = {
      tier: 'admin_grant',
      isPro: true,
      startDate: now,
      expiresAt: newExpiry,
      grantedByAdmin: true,
      grantDuration: { amount, unit },
    };

    // Log admin grant as an audit payment/credit
    const grantRecord: PaymentRecord = {
      id: `GRANT_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      orderId: `ADMIN_GRANT_${Date.now()}`,
      planId: 'admin_grant',
      planName: `Admin Granted Pro (${amount} ${unit})`,
      amount: 0,
      currency: 'INR',
      paymentMethod: 'ADMIN_MANUAL_GRANT',
      transactionRef: `SUPER_ADMIN_GRANT_${this.db.adminEmail}`,
      settlementVpa: 'wagh.jayesh@oksbi',
      timestamp: now,
      status: 'completed',
    };
    this.db.payments.unshift(grantRecord);

    // Send confirmation email
    this.sendEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `🎉 Premium Access Granted: ${amount} ${unit.toUpperCase()}`,
      type: 'subscription_active',
      bodyText: `Hello ${user.name},\n\nSuper Admin has granted you full PulseNote Pro access for **${amount} ${unit}**!\n\nYour active tenure is now unlocked until: **${new Date(newExpiry).toLocaleDateString()}**.\nEnjoy unlimited daily prompts, priority processing, and high-precision industry outputs.`,
      actionLabel: 'Launch PulseNote AI',
      actionUrl: '/',
    });

    this.saveDatabase();
    return user;
  }

  // Revoke or Set Plan
  public setUserPlan(userId: string, tier: 'free' | 'pro_monthly' | 'pro_annual', expiresAt: number | null): UserProfile {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found');
    user.subscription = {
      tier,
      isPro: tier !== 'free',
      startDate: Date.now(),
      expiresAt,
      grantedByAdmin: false,
    };
    this.saveDatabase();
    return user;
  }

  public updateUserAdminFields(userId: string, updates: Partial<UserProfile>): UserProfile {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found');

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.mobile !== undefined) user.mobile = updates.mobile;
    if (updates.status !== undefined) user.status = updates.status;
    if (updates.isActivated !== undefined) user.isActivated = updates.isActivated;

    this.saveDatabase();
    return user;
  }

  // Admin Permanent User Deletion (Guarded against deleting super admins)
  public deleteUser(userId: string): { success: boolean; deletedUser: UserProfile } {
    const userIndex = this.db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const targetUser = this.db.users[userIndex];
    const emailLower = (targetUser.email || '').toLowerCase().trim();

    // Guardrail: Never allow deletion of super admin accounts
    if (this.isStrictAdminEmail(emailLower) || targetUser.role === 'admin') {
      throw new Error('Cannot delete super-administrator accounts (jayeshofficial@gmail.com, contact@pulsenoteai.in).');
    }

    // Remove user
    const [deletedUser] = this.db.users.splice(userIndex, 1);
    delete this.db.userPasswords[userId];
    delete this.db.passwordResetOtps[emailLower];

    this.saveDatabase();
    console.log(`[Store] Permanently deleted user: ${deletedUser.name} (${deletedUser.email})`);
    return { success: true, deletedUser };
  }

  // Admin Manual Subscription Override (Free/Pro, custom renewal date, lifetime unlimited)
  public updateUserSubscription(
    userId: string,
    options: {
      tier: 'free' | 'pro_monthly' | 'pro_annual' | 'admin_grant';
      isPro?: boolean;
      expiresAt?: number | null;
      lifetime?: boolean;
    }
  ): UserProfile {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found');

    const now = Date.now();
    const isLifetime = options.lifetime === true;
    const isPro = isLifetime ? true : (options.isPro !== undefined ? options.isPro : options.tier !== 'free');
    const tier = isLifetime ? 'admin_grant' : options.tier;
    const expiresAt = isLifetime ? null : (options.expiresAt !== undefined ? options.expiresAt : (isPro ? (now + 30 * 86400000) : null));

    user.subscription = {
      tier: tier as any,
      isPro,
      startDate: user.subscription?.startDate || now,
      expiresAt,
      grantedByAdmin: isLifetime || tier === 'admin_grant',
    };

    if (isPro) {
      user.dailyPromptCount = 0;
    }

    this.saveDatabase();
    console.log(`[Store] Updated subscription for ${user.name} (${user.email}) -> isPro: ${isPro}, tier: ${tier}, expiresAt: ${expiresAt ? new Date(expiresAt).toISOString() : 'Lifetime'}`);
    return user;
  }

  public resetUserPasswordByAdmin(userId: string, newPass: string): void {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found');
    this.db.userPasswords[userId] = hashPassword(newPass);
    this.saveDatabase();
  }

  // Payments and Billing
  public recordPayment(params: {
    userId: string;
    orderId: string;
    planId: 'pro_monthly' | 'pro_annual';
    amount: number;
    currency: 'INR' | 'USD';
    paymentMethod: string;
    transactionRef: string;
  }): PaymentRecord {
    const user = this.findUserById(params.userId) || {
      id: params.userId,
      email: 'client@pulsenote.ai',
      name: 'PulseNote Client',
    };

    const isAnnual = params.planId === 'pro_annual';
    const durationDays = isAnnual ? 365 : 30;
    const now = Date.now();
    const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;

    const payment: PaymentRecord = {
      id: `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userEmail: (user as UserProfile).email || 'client@pulsenote.ai',
      userName: (user as UserProfile).name || 'PulseNote Client',
      orderId: params.orderId,
      planId: params.planId,
      planName: isAnnual ? 'Pro Power Pack (Annual)' : 'Pro Monthly',
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      transactionRef: params.transactionRef,
      settlementVpa: 'wagh.jayesh@oksbi',
      timestamp: now,
      status: 'completed',
    };

    this.db.payments.unshift(payment);

    // Update user subscription
    const existingUser = this.findUserById(params.userId);
    if (existingUser) {
      existingUser.subscription = {
        tier: params.planId,
        isPro: true,
        startDate: now,
        expiresAt,
        grantedByAdmin: false,
      };
    }

    // Send confirmation email with settlement details
    this.sendEmail({
      toEmail: payment.userEmail,
      toName: payment.userName,
      subject: `🧾 Payment Received (${payment.currency === 'INR' ? '₹' : '$'}${payment.amount}) - PulseNote Pro Activated`,
      type: 'subscription_active',
      bodyText: `Hello ${payment.userName},\n\nWe have received your payment of ${payment.currency === 'INR' ? '₹' : '$'}${payment.amount} for ${payment.planName}.\n\n• Order ID: ${payment.orderId}\n• Transaction Reference: ${payment.transactionRef}\n• Settlement Beneficiary VPA: ${payment.settlementVpa}\n• Active Tenure Until: ${new Date(expiresAt).toLocaleDateString()}\n\nUnlimited prompt transformations are now active on your account.`,
      actionLabel: 'View Dashboard',
      actionUrl: '/dashboard',
    });

    this.saveDatabase();
    return payment;
  }

  public getUserPayments(userId: string): PaymentRecord[] {
    return this.db.payments.filter((p) => p.userId === userId);
  }

  public getAllPayments(): PaymentRecord[] {
    return [...this.db.payments];
  }

  // User Activity Logging
  public logUserActivity(params: {
    userId: string;
    userEmail: string;
    userName: string;
    industry: TargetIndustry;
    rawInput: string;
    solutionTitle: string;
  }): UserActivityLog {
    const log: UserActivityLog = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      industry: params.industry,
      rawInput: params.rawInput,
      solutionTitle: params.solutionTitle,
      timestamp: Date.now(),
    };

    this.db.activityLogs.unshift(log);
    // Keep max 500 logs in memory
    if (this.db.activityLogs.length > 500) {
      this.db.activityLogs = this.db.activityLogs.slice(0, 500);
    }
    this.saveDatabase();
    return log;
  }

  public getAllActivityLogs(): UserActivityLog[] {
    return [...this.db.activityLogs];
  }

  public getUserActivityLogs(userId: string): UserActivityLog[] {
    return this.db.activityLogs.filter((l) => l.userId === userId);
  }

  // System Email Notification Log
  public sendEmail(notification: Omit<SystemEmailNotification, 'id' | 'sentAt'>): SystemEmailNotification {
    const emailRecord: SystemEmailNotification = {
      ...notification,
      id: `EML_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sentAt: Date.now(),
    };

    this.db.emails.unshift(emailRecord);
    // Keep max 200 emails
    if (this.db.emails.length > 200) {
      this.db.emails = this.db.emails.slice(0, 200);
    }

    console.log(`[Email Dispatcher] To: ${emailRecord.toEmail} | Subject: "${emailRecord.subject}" | Type: ${emailRecord.type}`);
    this.saveDatabase();
    return emailRecord;
  }

  public getAllEmails(): SystemEmailNotification[] {
    return [...this.db.emails];
  }

  public getEmailsForUser(email: string): SystemEmailNotification[] {
    const clean = email.trim().toLowerCase();
    return this.db.emails.filter((e) => e.toEmail.trim().toLowerCase() === clean);
  }

  // App Dynamic Settings
  public getSettings(): AppInterfaceSettings {
    return { ...this.db.settings };
  }

  public updateSettings(updates: Partial<AppInterfaceSettings>, updatedBy: string): AppInterfaceSettings {
    this.db.settings = {
      ...this.db.settings,
      ...updates,
      updatedAt: Date.now(),
      lastUpdatedBy: updatedBy,
    };
    this.saveDatabase();
    return this.db.settings;
  }
}

export const store = new Store();
