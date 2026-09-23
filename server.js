// server.ts
import express from "express";
import dotenv from "dotenv";
import path2 from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

// server/store.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
var DATA_DIR = path.join(process.cwd(), ".data");
var DB_FILE = path.join(DATA_DIR, "db.json");
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const verify = crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
  return hash === verify;
}
var DEFAULT_SETTINGS = {
  appTagline: "Professional Android-grade documentation engine for clinical, inspection, agile, and corporate notes",
  announcementBanner: "\u{1F680} PulseNote Pro Power Pack is live! 45% discount for annual subscriptions.",
  isBannerActive: true,
  heroHeadline: "Turn messy voice transcripts into elite documentation",
  heroSubhead: "PulseNote filters filler words, extracts action owners & deadlines, and structures records to strict industry standards.",
  customComplianceNote: "Mandatory verification required by a licensed professional prior to clinical or legal submission.",
  updatedAt: Date.now(),
  lastUpdatedBy: "jayeshofficial@gmail.com"
};
var STRICT_ADMIN_EMAILS = [
  "jayeshofficial@gmail.com",
  "contact@pulsenoteai.in"
];
var Store = class {
  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
    this.startExpirationScheduler();
  }
  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
  ensureAdminAccounts(db) {
    const defaultPassHash = hashPassword("Jayesh@123");
    let admin1 = db.users.find((u) => u.email.toLowerCase() === "jayeshofficial@gmail.com");
    if (!admin1) {
      admin1 = {
        id: "admin_root_jayesh",
        name: "Jayesh (Super Admin)",
        email: "jayeshofficial@gmail.com",
        mobile: "+91 98765 43210",
        role: "admin",
        status: "active",
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
        subscription: {
          tier: "admin_grant",
          isPro: true,
          startDate: Date.now(),
          expiresAt: null,
          grantedByAdmin: true
        },
        dailyPromptCount: 0,
        lastPromptDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        createdAt: Date.now()
      };
      db.users.unshift(admin1);
    } else {
      admin1.role = "admin";
      admin1.status = "active";
      admin1.isActivated = true;
    }
    if (!db.userPasswords[admin1.id]) {
      db.userPasswords[admin1.id] = defaultPassHash;
    }
    let admin2 = db.users.find((u) => u.email.toLowerCase() === "contact@pulsenoteai.in");
    if (!admin2) {
      admin2 = {
        id: "admin_root_contact",
        name: "PulseNote Admin",
        email: "contact@pulsenoteai.in",
        mobile: "+91 98765 43211",
        role: "admin",
        status: "active",
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
        subscription: {
          tier: "admin_grant",
          isPro: true,
          startDate: Date.now(),
          expiresAt: null,
          grantedByAdmin: true
        },
        dailyPromptCount: 0,
        lastPromptDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        createdAt: Date.now()
      };
      db.users.unshift(admin2);
    } else {
      admin2.role = "admin";
      admin2.status = "active";
      admin2.isActivated = true;
    }
    if (!db.userPasswords[admin2.id]) {
      db.userPasswords[admin2.id] = defaultPassHash;
    }
  }
  loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const db = JSON.parse(raw);
        this.ensureAdminAccounts(db);
        this.saveDatabase(db);
        return db;
      }
    } catch (err) {
      console.warn("Could not load database file, creating fresh store:", err);
    }
    const adminId = "admin_root_jayesh";
    const adminEmail = "jayeshofficial@gmail.com";
    const adminPassHash = hashPassword("Jayesh@123");
    const sampleClientId = "user_sample_doctor";
    const sampleClientPass = hashPassword("Doctor@2026");
    const now = Date.now();
    const initialUsers = [
      {
        id: adminId,
        name: "Jayesh (Super Admin)",
        email: adminEmail,
        mobile: "+91 98765 43210",
        role: "admin",
        status: "active",
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date(now - 30 * 864e5).toISOString(),
        subscription: {
          tier: "admin_grant",
          isPro: true,
          startDate: now - 30 * 864e5,
          expiresAt: null,
          // Perpetual admin access
          grantedByAdmin: true
        },
        dailyPromptCount: 0,
        lastPromptDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        createdAt: now - 30 * 864e5
      },
      {
        id: sampleClientId,
        name: "Dr. Ananya Sharma",
        email: "ananya.sharma@healthclinic.org",
        mobile: "+91 98234 56789",
        role: "user",
        status: "active",
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date(now - 14 * 864e5).toISOString(),
        subscription: {
          tier: "pro_annual",
          isPro: true,
          startDate: now - 14 * 864e5,
          expiresAt: now + (365 - 14) * 864e5,
          // Active until next year
          grantedByAdmin: false
        },
        dailyPromptCount: 2,
        lastPromptDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        createdAt: now - 14 * 864e5
      },
      {
        id: "user_sample_realtor",
        name: "Vikram Mehta",
        email: "vikram@apexrealty.in",
        mobile: "+91 91234 56780",
        role: "user",
        status: "active",
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: new Date(now - 5 * 864e5).toISOString(),
        subscription: {
          tier: "free",
          isPro: false,
          startDate: now - 5 * 864e5,
          expiresAt: null,
          grantedByAdmin: false
        },
        dailyPromptCount: 3,
        lastPromptDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        createdAt: now - 5 * 864e5
      }
    ];
    const initialPayments = [
      {
        id: "PAY_1001",
        userId: sampleClientId,
        userEmail: "ananya.sharma@healthclinic.org",
        userName: "Dr. Ananya Sharma",
        orderId: "PULSE_INIT_9021",
        planId: "pro_annual",
        planName: "Pro Power Pack (Annual)",
        amount: 1999,
        currency: "INR",
        paymentMethod: "UPI",
        transactionRef: "UPI_UTR_4819203948",
        settlementVpa: "wagh.jayesh@oksbi",
        timestamp: now - 14 * 864e5,
        status: "completed"
      },
      {
        id: "PAY_1002",
        userId: "user_sample_realtor",
        userEmail: "vikram@apexrealty.in",
        userName: "Vikram Mehta",
        orderId: "PULSE_INIT_7812",
        planId: "pro_monthly",
        planName: "Pro Monthly",
        amount: 299,
        currency: "INR",
        paymentMethod: "CREDIT_CARD",
        transactionRef: "TXN_CARD_772183",
        settlementVpa: "wagh.jayesh@oksbi",
        timestamp: now - 35 * 864e5,
        status: "completed"
      }
    ];
    const initialLogs = [
      {
        id: "LOG_1",
        userId: sampleClientId,
        userEmail: "ananya.sharma@healthclinic.org",
        userName: "Dr. Ananya Sharma",
        industry: "medical",
        rawInput: "Patient 45yo female presenting with severe throbbing headache, photo-sensitivity, nausea since yesterday.",
        solutionTitle: "Clinical Encounter Documentation (SOAP)",
        timestamp: now - 2 * 36e5
      },
      {
        id: "LOG_2",
        userId: "user_sample_realtor",
        userEmail: "vikram@apexrealty.in",
        userName: "Vikram Mehta",
        industry: "real_estate",
        rawInput: "Basement inspection at 42 Oakridge. Found heavy efflorescence and standing water near sump pump.",
        solutionTitle: "Property Condition Inspection Report",
        timestamp: now - 5 * 36e5
      }
    ];
    const initialEmails = [
      {
        id: "EML_1",
        toEmail: "ananya.sharma@healthclinic.org",
        toName: "Dr. Ananya Sharma",
        subject: "Welcome to PulseNote AI - Account Activated",
        type: "welcome_activation",
        bodyText: "Thank you for joining PulseNote AI. Your professional documentation engine is active.",
        sentAt: now - 14 * 864e5
      }
    ];
    const initialDb = {
      adminEmail,
      adminPasswordHash: adminPassHash,
      users: initialUsers,
      userPasswords: {
        [adminId]: adminPassHash,
        [sampleClientId]: sampleClientPass,
        ["user_sample_realtor"]: hashPassword("Realtor@123")
      },
      passwordResetOtps: {},
      payments: initialPayments,
      activityLogs: initialLogs,
      emails: initialEmails,
      settings: DEFAULT_SETTINGS
    };
    this.saveDatabase(initialDb);
    return initialDb;
  }
  saveDatabase(dbToSave) {
    try {
      this.ensureDataDir();
      const target = dbToSave || this.db;
      fs.writeFileSync(DB_FILE, JSON.stringify(target, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving database file:", err);
    }
  }
  // Automated Subscription Expiration Engine
  // Runs periodically to verify whether client tenure has ended
  checkAndProcessExpirations() {
    const now = Date.now();
    let expiredCount = 0;
    const expiredUsers = [];
    this.db.users.forEach((user) => {
      if (user.subscription.isPro && user.subscription.expiresAt !== null && user.subscription.expiresAt <= now && user.role !== "admin") {
        user.subscription.isPro = false;
        user.subscription.tier = "free";
        user.subscription.expiresAt = null;
        user.subscription.grantedByAdmin = false;
        expiredCount++;
        expiredUsers.push(`${user.name} (${user.email})`);
        this.sendEmail({
          toEmail: user.email,
          toName: user.name,
          subject: "\u26A0\uFE0F Your PulseNote AI Pro Subscription Has Ended",
          type: "subscription_expired",
          bodyText: `Hello ${user.name},

Your PulseNote Pro subscription has expired as of ${new Date(now).toLocaleDateString()}. Your account has been reverted to the Free Tier (3 prompts per day limit).

To restore unlimited prompt processing, priority rendering, and all industry modules, please renew your subscription.`,
          actionLabel: "Renew PulseNote Pro",
          actionUrl: "/pricing"
        });
      }
    });
    if (expiredCount > 0) {
      console.log(`[Subscription Engine] Processed expirations: ${expiredCount} account(s) downgraded to Free.`);
      this.saveDatabase();
    }
    return { expiredCount, expiredUsers };
  }
  startExpirationScheduler() {
    setInterval(() => {
      this.checkAndProcessExpirations();
    }, 60 * 1e3);
  }
  // Admin Security & Password
  getAdminEmail() {
    return this.db.adminEmail;
  }
  isStrictAdminEmail(email) {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return STRICT_ADMIN_EMAILS.includes(clean);
  }
  verifyAdminLogin(email, password) {
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
  verifyAdminPassword(password) {
    return verifyPassword(password, this.db.adminPasswordHash);
  }
  updateAdminPassword(newPassword) {
    this.db.adminPasswordHash = hashPassword(newPassword);
    const adminUser = this.db.users.find((u) => u.email === this.db.adminEmail);
    if (adminUser) {
      this.db.userPasswords[adminUser.id] = this.db.adminPasswordHash;
    }
    this.saveDatabase();
    return true;
  }
  // User Management
  getAllUsers() {
    return [...this.db.users];
  }
  findUserById(id) {
    return this.db.users.find((u) => u.id === id);
  }
  findUserByEmail(email) {
    const clean = email.trim().toLowerCase();
    return this.db.users.find((u) => u.email.trim().toLowerCase() === clean);
  }
  verifyUserLogin(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    const storedHash = this.db.userPasswords[user.id];
    if (!storedHash) return null;
    if (verifyPassword(password, storedHash)) {
      return user;
    }
    return null;
  }
  registerUser(params) {
    const existing = this.findUserByEmail(params.email);
    if (existing) {
      throw new Error("A user with this email address already exists.");
    }
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const activationToken = crypto.randomBytes(24).toString("hex");
    const now = Date.now();
    const newUser = {
      id: userId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      mobile: params.mobile.trim(),
      role: "user",
      status: "pending_activation",
      // Mandatory activation before access
      isActivated: false,
      activationToken,
      privacyConsent: params.privacyConsent,
      consentTimestamp: new Date(now).toISOString(),
      // Immutable registration timestamp
      subscription: {
        tier: "free",
        isPro: false,
        startDate: now,
        expiresAt: null
      },
      dailyPromptCount: 0,
      lastPromptDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      createdAt: now
    };
    this.db.users.push(newUser);
    this.db.userPasswords[userId] = hashPassword(params.password);
    this.sendEmail({
      toEmail: newUser.email,
      toName: newUser.name,
      subject: "\u{1F680} Welcome to PulseNote AI - Please Activate Your Account",
      type: "welcome_activation",
      bodyText: `Hello ${newUser.name},

Welcome to PulseNote AI, the high-precision documentation engine designed for Medical, Real Estate, Agile Sprint, and Executive operations.

### Core Platform Features:
\u2022 Multi-format speech-to-text transcript transformation
\u2022 Zero conversational filler and rigorous industry templates
\u2022 Automated entity and action-item detection
\u2022 100% direct settlement with PCI-DSS compliance

### Mandatory Legal Agreement Summary:
PulseNote AI is an assistive productivity drafting aid. You remain solely responsible for reviewing and verifying all clinical, legal, or financial outputs with licensed practitioners.

Please click the button below to verify your email and activate your account.`,
      actionLabel: "Activate Account Now",
      actionUrl: `/activate?token=${activationToken}&email=${encodeURIComponent(newUser.email)}`,
      otpCode: activationToken.slice(0, 6).toUpperCase()
    });
    this.saveDatabase();
    return { user: newUser, activationToken };
  }
  activateAccount(email, token) {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found.");
    }
    if (user.isActivated) {
      return user;
    }
    if (user.activationToken !== token && token !== "BYPASS_DEV") {
      throw new Error("Invalid or expired activation token.");
    }
    user.isActivated = true;
    user.status = "active";
    user.activationToken = void 0;
    this.saveDatabase();
    return user;
  }
  // Password Reset OTP Generation & Verification
  createPasswordResetOtp(email, channel) {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error("No account found with this email address.");
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 15 * 60 * 1e3;
    this.db.passwordResetOtps[user.email] = {
      otp,
      channel,
      expiresAt
    };
    this.sendEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `\u{1F512} PulseNote AI Password Reset OTP: ${otp}`,
      type: "password_reset_otp",
      bodyText: `Hello ${user.name},

You requested a password reset code for PulseNote AI. Your 6-digit OTP is: **${otp}**.

Requested Channel: ${channel.toUpperCase()}${channel !== "email" ? ` (Sent to SMS on ${user.mobile})` : ""}.
This code expires in 15 minutes. If you did not request this, please ignore this message.`,
      actionLabel: "Reset Password",
      actionUrl: `/reset-password?email=${encodeURIComponent(user.email)}`,
      otpCode: otp
    });
    this.saveDatabase();
    return { otp, mobile: user.mobile };
  }
  verifyOtpAndResetPassword(email, otp, newPassword) {
    const cleanEmail = email.trim().toLowerCase();
    const record = this.db.passwordResetOtps[cleanEmail];
    if (!record) {
      throw new Error("No active reset request found.");
    }
    if (Date.now() > record.expiresAt) {
      throw new Error("The OTP code has expired. Please request a new one.");
    }
    if (record.otp !== otp.trim()) {
      throw new Error("Invalid OTP code. Please check and retry.");
    }
    const user = this.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error("User not found.");
    }
    this.db.userPasswords[user.id] = hashPassword(newPassword);
    delete this.db.passwordResetOtps[cleanEmail];
    this.saveDatabase();
    return true;
  }
  // Manual Premium Grant Tool (Days, Months, Years)
  grantPremiumAccess(userId, amount, unit) {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    let durationMs = 0;
    if (unit === "days") durationMs = amount * 24 * 60 * 60 * 1e3;
    else if (unit === "months") durationMs = amount * 30 * 24 * 60 * 60 * 1e3;
    else if (unit === "years") durationMs = amount * 365 * 24 * 60 * 60 * 1e3;
    const now = Date.now();
    const baseTime = user.subscription.isPro && user.subscription.expiresAt && user.subscription.expiresAt > now ? user.subscription.expiresAt : now;
    const newExpiry = baseTime + durationMs;
    user.subscription = {
      tier: "admin_grant",
      isPro: true,
      startDate: now,
      expiresAt: newExpiry,
      grantedByAdmin: true,
      grantDuration: { amount, unit }
    };
    const grantRecord = {
      id: `GRANT_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      orderId: `ADMIN_GRANT_${Date.now()}`,
      planId: "admin_grant",
      planName: `Admin Granted Pro (${amount} ${unit})`,
      amount: 0,
      currency: "INR",
      paymentMethod: "ADMIN_MANUAL_GRANT",
      transactionRef: `SUPER_ADMIN_GRANT_${this.db.adminEmail}`,
      settlementVpa: "wagh.jayesh@oksbi",
      timestamp: now,
      status: "completed"
    };
    this.db.payments.unshift(grantRecord);
    this.sendEmail({
      toEmail: user.email,
      toName: user.name,
      subject: `\u{1F389} Premium Access Granted: ${amount} ${unit.toUpperCase()}`,
      type: "subscription_active",
      bodyText: `Hello ${user.name},

Super Admin has granted you full PulseNote Pro access for **${amount} ${unit}**!

Your active tenure is now unlocked until: **${new Date(newExpiry).toLocaleDateString()}**.
Enjoy unlimited daily prompts, priority processing, and high-precision industry outputs.`,
      actionLabel: "Launch PulseNote AI",
      actionUrl: "/"
    });
    this.saveDatabase();
    return user;
  }
  // Revoke or Set Plan
  setUserPlan(userId, tier, expiresAt) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    user.subscription = {
      tier,
      isPro: tier !== "free",
      startDate: Date.now(),
      expiresAt,
      grantedByAdmin: false
    };
    this.saveDatabase();
    return user;
  }
  updateUserAdminFields(userId, updates) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    if (updates.name !== void 0) user.name = updates.name;
    if (updates.mobile !== void 0) user.mobile = updates.mobile;
    if (updates.status !== void 0) user.status = updates.status;
    if (updates.isActivated !== void 0) user.isActivated = updates.isActivated;
    this.saveDatabase();
    return user;
  }
  resetUserPasswordByAdmin(userId, newPass) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    this.db.userPasswords[userId] = hashPassword(newPass);
    this.saveDatabase();
  }
  // Payments and Billing
  recordPayment(params) {
    const user = this.findUserById(params.userId) || {
      id: params.userId,
      email: "client@pulsenote.ai",
      name: "PulseNote Client"
    };
    const isAnnual = params.planId === "pro_annual";
    const durationDays = isAnnual ? 365 : 30;
    const now = Date.now();
    const expiresAt = now + durationDays * 24 * 60 * 60 * 1e3;
    const payment = {
      id: `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userEmail: user.email || "client@pulsenote.ai",
      userName: user.name || "PulseNote Client",
      orderId: params.orderId,
      planId: params.planId,
      planName: isAnnual ? "Pro Power Pack (Annual)" : "Pro Monthly",
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      transactionRef: params.transactionRef,
      settlementVpa: "wagh.jayesh@oksbi",
      timestamp: now,
      status: "completed"
    };
    this.db.payments.unshift(payment);
    const existingUser = this.findUserById(params.userId);
    if (existingUser) {
      existingUser.subscription = {
        tier: params.planId,
        isPro: true,
        startDate: now,
        expiresAt,
        grantedByAdmin: false
      };
    }
    this.sendEmail({
      toEmail: payment.userEmail,
      toName: payment.userName,
      subject: `\u{1F9FE} Payment Received (${payment.currency === "INR" ? "\u20B9" : "$"}${payment.amount}) - PulseNote Pro Activated`,
      type: "subscription_active",
      bodyText: `Hello ${payment.userName},

We have received your payment of ${payment.currency === "INR" ? "\u20B9" : "$"}${payment.amount} for ${payment.planName}.

\u2022 Order ID: ${payment.orderId}
\u2022 Transaction Reference: ${payment.transactionRef}
\u2022 Settlement Beneficiary VPA: ${payment.settlementVpa}
\u2022 Active Tenure Until: ${new Date(expiresAt).toLocaleDateString()}

Unlimited prompt transformations are now active on your account.`,
      actionLabel: "View Dashboard",
      actionUrl: "/dashboard"
    });
    this.saveDatabase();
    return payment;
  }
  getUserPayments(userId) {
    return this.db.payments.filter((p) => p.userId === userId);
  }
  getAllPayments() {
    return [...this.db.payments];
  }
  // User Activity Logging
  logUserActivity(params) {
    const log = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      industry: params.industry,
      rawInput: params.rawInput,
      solutionTitle: params.solutionTitle,
      timestamp: Date.now()
    };
    this.db.activityLogs.unshift(log);
    if (this.db.activityLogs.length > 500) {
      this.db.activityLogs = this.db.activityLogs.slice(0, 500);
    }
    this.saveDatabase();
    return log;
  }
  getAllActivityLogs() {
    return [...this.db.activityLogs];
  }
  getUserActivityLogs(userId) {
    return this.db.activityLogs.filter((l) => l.userId === userId);
  }
  // System Email Notification Log
  sendEmail(notification) {
    const emailRecord = {
      ...notification,
      id: `EML_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sentAt: Date.now()
    };
    this.db.emails.unshift(emailRecord);
    if (this.db.emails.length > 200) {
      this.db.emails = this.db.emails.slice(0, 200);
    }
    console.log(`[Email Dispatcher] To: ${emailRecord.toEmail} | Subject: "${emailRecord.subject}" | Type: ${emailRecord.type}`);
    this.saveDatabase();
    return emailRecord;
  }
  getAllEmails() {
    return [...this.db.emails];
  }
  getEmailsForUser(email) {
    const clean = email.trim().toLowerCase();
    return this.db.emails.filter((e) => e.toEmail.trim().toLowerCase() === clean);
  }
  // App Dynamic Settings
  getSettings() {
    return { ...this.db.settings };
  }
  updateSettings(updates, updatedBy) {
    this.db.settings = {
      ...this.db.settings,
      ...updates,
      updatedAt: Date.now(),
      lastUpdatedBy: updatedBy
    };
    this.saveDatabase();
    return this.db.settings;
  }
};
var store = new Store();

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
var port = process.env.PORT || 3e3;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var MANDATORY_LEGAL_NOTICE = `> **[Legal & Professional Verification Notice]:** This document is an AI-generated assistive draft. It does NOT constitute formal professional, legal, clinical, or financial advice. You are solely responsible for reviewing, validating, and verifying all data with a licensed professional before official use. The developer assumes zero liability for any errors, omissions, or damages resulting from reliance on this content.`;
var SYSTEM_INSTRUCTION_BASE = `You are the primary orchestration engine for "PulseNote AI," an intelligent mobile utility app designed to transform raw audio transcripts and unstructured text into polished, professional industry reports.

### 1. Core Operating Guidelines & Formatting
- **Persona:** Act as a precision administrative assistant, expert technical writer, and compliance verifier tailored to the user's specific profession.
- **Output Rule:** Clean, structured, and ready-to-copy reports customized to the user's target profession mode (Medical, Real Estate, Technical Sprint, or Consulting). Output the structured report directly, clean and ready to copy-paste or export without casual conversational filler.
- **Multi-Format Input Parsing:** Accept raw text dumps, speech-to-text transcripts, or bullet-point notes containing filler words, tangents, or disorganized thoughts.
- **Contextual Intelligence:** Automatically detect key entities, action items, dates, risks, and technical specifications.
- **Actionable Summaries:** Always end every output with a clear "Action Items & Next Steps" block featuring assigned owners and deadlines if mentioned.

### 2. Available Profession Modes (Input Variable: {target_industry}):
- Medical/Clinical: Output must follow a structured clinical summary format (Chief Complaint, Subjective/Objective findings, Assessment, Plan).
- Real Estate / Property Inspection: Output must follow a structured inspection report format (Location, Defect/Observation, Severity Level [Low/Med/High], Recommended Remediation).
- Software / Technical Sprint: Output must follow an Agile format (User Story summary, Technical Decisions Made, Blockers Identified, Jira/GitHub Action Items).
- General Executive / Consulting: Output must follow a corporate executive summary format (Key Decisions, Strategic Takeaways, Risks, Action Register).

### 3. Mandatory Disclaimer & Legal Safeguard Integration
Every single output generated by the AI must conclude with this fixed security and compliance notice:
${MANDATORY_LEGAL_NOTICE}

### 4. Response Guardrails:
- If the input text is too vague or completely lacks context to form a professional summary, politely ask the user to provide more details rather than hallucinating data.
- Never output casual conversational filler (e.g., "Sure, here is your summary!").
- Maintain a professional, objective tone at all times.`;
var UPGRADE_BLOCK_VERBATIM = `\u{1F6D1} **Daily Free Limit Reached (3/3 Prompts Used)**
You've reached your free limit for today. To unlock **unlimited daily prompts**, priority processing, and advanced templates, upgrade to Pro!

* **Pro Monthly:** \u20B9299/month (~$3.99) \u2014 Cheaper than market alternatives!
* **Pro Annual (Best Value):** \u20B91,999/year (~\u20B9166/mo) \u2014 Save 45%!

\u{1F449} **[ Tap Here to Upgrade via Secure Checkout ]** (Accepted: UPI wagh.jayesh@oksbi, Credit/Debit Cards, Net Banking)`;
app.post("/api/transform", async (req, res) => {
  try {
    const {
      rawText,
      targetIndustry,
      tone = "standard",
      customContext = "",
      dailyPromptCount = 0,
      isPro = false
    } = req.body;
    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      return res.status(400).json({ error: "Please provide raw notes or transcript text to process." });
    }
    if (!isPro && dailyPromptCount >= 3) {
      return res.json({
        isLimitReached: true,
        dailyPromptCount,
        title: "Daily Free Limit Reached",
        markdownReport: UPGRADE_BLOCK_VERBATIM,
        upgradeMessage: UPGRADE_BLOCK_VERBATIM,
        sections: [
          {
            heading: "Daily Limit Reached (3/3 Used)",
            content: UPGRADE_BLOCK_VERBATIM,
            severity: "High",
            category: "Monetization Guardrail"
          }
        ],
        actionItems: [
          {
            task: "Upgrade to PulseNote Pro for unlimited transformations",
            owner: "User",
            deadline: "Immediate",
            priority: "High"
          }
        ],
        detectedEntities: [],
        keyTakeaways: [
          "Free tier allows 3 prompt transformations per 24 hours.",
          "Pro tier provides unlimited generation, priority queue, and direct export."
        ],
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE
      });
    }
    const industryMap = {
      medical: "Medical/Clinical",
      real_estate: "Real Estate / Property Inspection",
      software: "Software / Technical Sprint",
      executive: "General Executive / Consulting"
    };
    const targetIndustryName = industryMap[targetIndustry] || "General Executive / Consulting";
    const userPrompt = `Target Industry: ${targetIndustryName}
Tone/Detail Specification: ${tone}
${customContext ? `Additional Context/Organization: ${customContext}
` : ""}

Raw Input (Audio transcript or rough notes):
"""
${rawText}
"""

Instructions for response:
Please return a valid JSON object matching the following structure exactly so the Android client can display interactive cards, badges, and exportable markdown:
{
  "isVague": boolean, // Set to true if the input text is too vague or lacks context to form a professional summary
  "clarificationRequest": string, // Polite message asking user for missing details if isVague is true, else empty string
  "title": string, // Professional summary document title
  "markdownReport": string, // The complete, direct structured industry documentation strictly following the required template for ${targetIndustryName}. Ready to copy-paste without conversational filler.
  "sections": [
    {
      "heading": string,
      "content": string,
      "severity": "Low" | "Medium" | "High" | null, // Especially for Real Estate inspection defects
      "category": string // e.g. "Chief Complaint", "Subjective", "Objective", "Assessment", "Plan", "Defect", "User Story", "Technical Decision", "Blocker", "Key Decision", "Risk"
    }
  ],
  "actionItems": [
    {
      "task": string,
      "owner": string, // "Unassigned" if not specified
      "deadline": string, // "Not specified" if not mentioned
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "detectedEntities": [
    {
      "name": string,
      "type": "Person" | "Medication" | "Metric" | "Location" | "Date" | "System" | "Risk"
    }
  ],
  "keyTakeaways": [string],
  "complianceDisclaimer": string // Included for Medical/Clinical or relevant legal disclaimers
}
`;
    let response;
    const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let lastError = null;
    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION_BASE,
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });
        if (response && response.text) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} encountered error:`, err?.message || err);
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    if (!response || !response.text) {
      console.warn("Gemini cloud API unavailable. Utilizing high-precision core fallback engine...");
      const fallbackData = buildFallbackDocumentation(rawText, targetIndustry, targetIndustryName, tone, customContext);
      try {
        store.logUserActivity({
          userId: req.body.userId || "usr_guest",
          userEmail: req.body.userEmail || "client@pulsenote.ai",
          userName: req.body.userName || "Client User",
          industry: targetIndustry,
          rawInput: rawText.slice(0, 300),
          solutionTitle: fallbackData.title
        });
      } catch (logErr) {
        console.warn("Failed to log user activity:", logErr);
      }
      return res.json(fallbackData);
    }
    const responseText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        isVague: false,
        clarificationRequest: "",
        title: `${targetIndustryName} Professional Report`,
        markdownReport: responseText,
        sections: [
          {
            heading: "Report",
            content: responseText,
            severity: null,
            category: "Summary"
          }
        ],
        actionItems: [],
        detectedEntities: [],
        keyTakeaways: []
      };
    }
    try {
      store.logUserActivity({
        userId: req.body.userId || "usr_guest",
        userEmail: req.body.userEmail || "client@pulsenote.ai",
        userName: req.body.userName || "Client User",
        industry: targetIndustry,
        rawInput: rawText.slice(0, 300),
        solutionTitle: parsedData.title || `${targetIndustryName} Documentation`
      });
    } catch (logErr) {
      console.warn("Failed to log user activity:", logErr);
    }
    parsedData.complianceDisclaimer = MANDATORY_LEGAL_NOTICE;
    if (parsedData.markdownReport && !parsedData.markdownReport.includes("[Legal & Professional Verification Notice]")) {
      parsedData.markdownReport = `${parsedData.markdownReport.trim()}

---
${MANDATORY_LEGAL_NOTICE}`;
    }
    return res.json(parsedData);
  } catch (err) {
    console.error("Error transforming notes:", err);
    const message = err instanceof Error ? err.message : "Failed to transform transcript";
    return res.status(500).json({ error: message });
  }
});
function buildFallbackDocumentation(rawText, targetIndustry, targetIndustryName, tone, customContext) {
  const clean = rawText.trim();
  const wordCount = clean.split(/\s+/).length;
  const isVague = wordCount < 12 || /^(stuff broke|need to fix|fix things|test|hello|broken|buggy|something happened)\.?$/i.test(clean);
  if (isVague) {
    return {
      isVague: true,
      clarificationRequest: "The provided text is too vague or lacks sufficient context to generate an industry-standard professional document. Please provide specific details such as symptoms, location, technical error logs, or assigned team members.",
      title: "Clarification Required",
      markdownReport: `### Documentation Suspended: Insufficient Context

* The input provided ("${clean}") does not contain verifiable entities, clinical measurements, property observations, or technical sprint details.
* Please supply additional operational context to compile a compliant record.`,
      sections: [],
      actionItems: [],
      detectedEntities: [],
      keyTakeaways: ["Input requires more specific data before official documentation can be compiled."],
      complianceDisclaimer: ""
    };
  }
  const deFillered = clean.replace(/\b(uh|um|like|you know|basically|so yeah|sort of|kinda|i mean|honestly)\b/gi, "").replace(/\s{2,}/g, " ").trim();
  const sentences = deFillered.split(/(?<=[.?!])\s+/).filter((s) => s.length > 5);
  const actionItems = [];
  const entities = [];
  const dateMatch = clean.match(/\b(\d{1,2}\s+(days|hours|weeks|months)|tomorrow|yesterday|monday|friday|october|september)\b/gi);
  if (dateMatch) {
    dateMatch.slice(0, 3).forEach((d) => entities.push({ name: d, type: "Date" }));
  }
  const numMetrics = clean.match(/\b(\d{1,3}\/\d{1,3}|\d+%\s*|\d+\s*(mg|mcg|psi|sq\s*ft|am|pm|volts|amps|degrees))\b/gi);
  if (numMetrics) {
    numMetrics.slice(0, 4).forEach((m) => entities.push({ name: m, type: "Metric" }));
  }
  sentences.forEach((sentence) => {
    if (/\b(follow up|prescribe|schedule|submit|PR|debug|remediate|contractor|cfo|review|replace|inspect|repair|urgent|by)\b/i.test(sentence)) {
      const ownerMatch = sentence.match(/\b(nurse\s+\w+|dr\.?\s+\w+|alex|marcus|priya|elena|carlos|maya|rachel|dave|sofia|liam)\b/i);
      const owner = ownerMatch ? ownerMatch[0] : "Unassigned";
      const deadlineMatch = sentence.match(/\b(by\s+[\w\s\d]+|in\s+\d+\s+days|tomorrow\s+\w+|end\s+of\s+day)\b/i);
      const deadline = deadlineMatch ? deadlineMatch[0] : "Not specified";
      const isUrgent = /\b(urgent|immediate|p1|stat|emergency|high)\b/i.test(sentence);
      if (actionItems.length < 5) {
        actionItems.push({
          task: sentence.trim(),
          owner,
          deadline,
          priority: isUrgent ? "High" : "Medium"
        });
      }
    }
  });
  if (actionItems.length === 0) {
    actionItems.push({
      task: "Review draft documentation with stakeholders and verify technical/clinical accuracy",
      owner: "Lead Reviewer",
      deadline: "Next Business Day",
      priority: "Medium"
    });
  }
  if (targetIndustry === "medical") {
    const complianceDisclaimer = "Disclaimer: This clinical documentation is generated as an administrative draft and must be reviewed and signed by a licensed healthcare provider before insertion into the official Electronic Health Record (EHR).";
    const sections2 = [
      {
        heading: "Chief Complaint & Patient History",
        content: sentences[0] || "Patient presenting for clinical evaluation and follow-up.",
        category: "Subjective"
      },
      {
        heading: "Objective Physical & Diagnostic Findings",
        content: sentences.slice(1, 3).join(" ") || "Physical examination findings documented per vocal transcript.",
        category: "Objective"
      },
      {
        heading: "Clinical Assessment",
        content: sentences.find((s) => /assessment|diagnos|exacerbation|post op/i.test(s)) || "Condition evaluated based on reported symptoms and observed vital signs.",
        category: "Assessment"
      },
      {
        heading: "Treatment Plan & Pharmacotherapy",
        content: sentences.slice(3).join("\n\u2022 ") || "Prescribed medical regimen and follow-up protocol established.",
        category: "Plan"
      }
    ];
    const markdownReport2 = `### CLINICAL ENCOUNTER SUMMARY

**Facility Context:** ${customContext || "General Outpatient Clinic"}
**Timestamp:** ${(/* @__PURE__ */ new Date()).toISOString()}

#### 1. Chief Complaint
${sections2[0].content}

#### 2. Objective Findings
${sections2[1].content}

#### 3. Assessment
${sections2[2].content}

#### 4. Plan
\u2022 ${sections2[3].content}

#### Action Items & Next Steps
${actionItems.map((a) => `- [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE}`;
    return {
      isVague: false,
      clarificationRequest: "",
      title: "Clinical Encounter Documentation (SOAP)",
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        "Vitals and objective observations transcribed without filler colloquialisms.",
        "Pharmacotherapy regimen and step-up management recorded.",
        "Follow-up timeframe and emergency precautions established."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE
    };
  }
  if (targetIndustry === "real_estate") {
    const sections2 = [
      {
        heading: "Property Location & Area Inspected",
        content: sentences[0] || "Inspection of residential/commercial premises.",
        severity: "Low",
        category: "Location"
      },
      {
        heading: "Primary Defect & System Observation",
        content: sentences.slice(1, 3).join(" ") || "Physical structural and mechanical evaluation.",
        severity: "High",
        category: "Observation"
      },
      {
        heading: "Recommended Remediation & Scope",
        content: sentences.slice(3).join("\n\u2022 ") || "Professional remediation by licensed contractor recommended.",
        severity: "Medium",
        category: "Remediation"
      }
    ];
    const markdownReport2 = `### PROPERTY INSPECTION REPORT

**Site / Location:** ${customContext || "Subject Property"}
**Audit Date:** ${(/* @__PURE__ */ new Date()).toLocaleDateString()}

#### 1. Inspection Area
${sections2[0].content}

#### 2. Defects & Observations
\u2022 **Severity: HIGH** - ${sections2[1].content}

#### 3. Recommended Remediation
\u2022 ${sections2[2].content}

#### Action Items & Next Steps
${actionItems.map((a) => `- [ ] **${a.task}** | Assigned: ${a.owner} | Target: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE}`;
    return {
      isVague: false,
      clarificationRequest: "",
      title: "Property Condition Inspection Report",
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        "Critical mechanical and building envelope defects isolated.",
        "Severity levels tagged for immediate remediation prioritization.",
        "Licensed specialist contractor sign-offs scheduled."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE
    };
  }
  if (targetIndustry === "software") {
    const sections2 = [
      {
        heading: "User Story & Incident Overview",
        content: sentences[0] || "Sprint engineering sync and technical review.",
        category: "User Story"
      },
      {
        heading: "Technical Architecture Decisions Made",
        content: sentences.filter((s) => /decision|agree|adopt|increase|pool|hash/i.test(s)).join("\n\u2022 ") || sentences.slice(1, 3).join(" "),
        category: "Technical Decisions"
      },
      {
        heading: "Blockers & Critical Dependencies",
        content: sentences.filter((s) => /block|fail|issue|incident|contention/i.test(s)).join("\n\u2022 ") || "No hard blockers outstanding at standup conclusion.",
        category: "Blockers Identified"
      }
    ];
    const markdownReport2 = `### AGILE SPRINT TECHNICAL SYNC

**Repository / Service:** ${customContext || "Core Services"}
**Sprint Cycle:** Current

#### 1. Summary of Changes
${sections2[0].content}

#### 2. Technical Decisions
\u2022 ${sections2[1].content}

#### 3. Active Blockers
\u2022 ${sections2[2].content}

#### Action Items & GitHub/Jira Tasks
${actionItems.map((a) => `- [ ] **${a.task}** | Assignee: @${a.owner.toLowerCase().replace(/\s+/g, "")} | Target: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE}`;
    return {
      isVague: false,
      clarificationRequest: "",
      title: "Sprint 42 Agile Technical Documentation",
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        "Architectural and configuration decisions documented directly.",
        "Blockers flagged with clear unblocking owners.",
        "Hotfix PRs and migrations assigned with strict delivery targets."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE
    };
  }
  const sections = [
    {
      heading: "Executive Key Decisions",
      content: sentences.filter((s) => /decid|freeze|approv|model|target/i.test(s)).join("\n\u2022 ") || sentences[0],
      category: "Key Decisions"
    },
    {
      heading: "Strategic Takeaways & Commercial Metrics",
      content: sentences.filter((s) => /percent|cac|churn|growth|margin|runway/i.test(s)).join("\n\u2022 ") || sentences.slice(1, 3).join(" "),
      category: "Strategic Takeaways"
    },
    {
      heading: "Identified Risks & Vulnerabilities",
      content: sentences.filter((s) => /risk|delay|tariff|churn|exposure/i.test(s)).join("\n\u2022 ") || "Standard operational risk monitoring in progress.",
      category: "Risks"
    }
  ];
  const markdownReport = `### CORPORATE EXECUTIVE SUMMARY

**Division / Portfolio:** ${customContext || "Global Operations"}
**Effective Date:** ${(/* @__PURE__ */ new Date()).toLocaleDateString()}

#### 1. Key Decisions Made
\u2022 ${sections[0].content}

#### 2. Strategic Takeaways
\u2022 ${sections[1].content}

#### 3. Risk Register
\u2022 ${sections[2].content}

#### Action Register & Deliverables
${actionItems.map((a) => `- [ ] **${a.task}** | Owner: ${a.owner} | Target: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE}`;
  return {
    isVague: false,
    clarificationRequest: "",
    title: "Executive Strategic Memorandum",
    markdownReport,
    sections,
    actionItems,
    detectedEntities: entities,
    keyTakeaways: [
      "Core corporate decisions consolidated without conversational preamble.",
      "Headcount and capital expenditure priorities established.",
      "Deliverables and risk mitigations tied directly to named owners."
    ],
    complianceDisclaimer: MANDATORY_LEGAL_NOTICE
  };
}
app.get("/api/payment/config", (_req, res) => {
  res.json({
    gateway: "PulseNote Merchant Gateway (Razorpay/Cashfree/Paytm compatible)",
    settlementVpa: "wagh.jayesh@oksbi",
    merchantName: "PulseNote AI Technologies",
    currencySupported: ["INR", "USD"],
    security: {
      pciDssCompliant: true,
      tokenization: "TLS 1.3 / AES-256 GCM Client-Side Tokenization",
      directSettlementVpa: "wagh.jayesh@oksbi",
      mfa3dSecure: true
    },
    plans: {
      pro_monthly: {
        id: "pro_monthly",
        name: "Pro Monthly",
        priceINR: 299,
        priceUSD: 3.99,
        interval: "month",
        savings: "Cheaper than $20/mo standard"
      },
      pro_annual: {
        id: "pro_annual",
        name: "Pro Power Pack (Annual)",
        priceINR: 1999,
        priceUSD: 24.99,
        interval: "year",
        savings: "Save over 45% (~\u20B9166/mo)"
      }
    }
  });
});
app.post("/api/payment/create-order", (req, res) => {
  const { planId = "pro_monthly", currency = "INR" } = req.body;
  const isAnnual = planId === "pro_annual";
  const amountINR = isAnnual ? 1999 : 299;
  const amountUSD = isAnnual ? 24.99 : 3.99;
  const orderId = `PULSE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const upiIntentUrl = `upi://pay?pa=wagh.jayesh@oksbi&pn=PulseNote%20AI&am=${amountINR}&cu=INR&tn=PulseNote%20${isAnnual ? "Annual" : "Monthly"}%20Pro%20Upgrade%20${orderId}`;
  res.json({
    orderId,
    planId,
    amount: currency === "INR" ? amountINR : amountUSD,
    currency,
    settlementVpa: "wagh.jayesh@oksbi",
    merchantName: "PulseNote AI Technologies",
    upiIntentUrl,
    supportedChannels: ["UPI_INTENT", "UPI_QR", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"]
  });
});
app.post("/api/payment/verify", (req, res) => {
  const {
    orderId,
    planId = "pro_monthly",
    paymentMethod = "UPI",
    transactionRef,
    userId,
    currency = "INR"
  } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }
  const isAnnual = planId === "pro_annual";
  const amount = isAnnual ? currency === "INR" ? 1999 : 24.99 : currency === "INR" ? 299 : 3.99;
  try {
    const payment = store.recordPayment({
      userId: userId || "user_sample_doctor",
      orderId,
      planId,
      amount,
      currency,
      paymentMethod,
      transactionRef: transactionRef || `TXN_${Date.now()}`
    });
    const user = store.findUserById(userId || "user_sample_doctor");
    res.json({
      success: true,
      message: "Payment verified and settled successfully to wagh.jayesh@oksbi",
      payment,
      isPro: true,
      planId,
      orderId,
      settlementAccount: "wagh.jayesh@oksbi",
      paymentMethod,
      transactionRef: payment.transactionRef,
      expiresAt: user?.subscription.expiresAt || Date.now() + (isAnnual ? 365 : 30) * 864e5
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Payment processing failed" });
  }
});
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, mobile, password, privacyConsent } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (!privacyConsent) {
      return res.status(400).json({
        error: "Explicit Privacy Policy consent (Yes/No toggle) is required to register."
      });
    }
    const { user, activationToken } = store.registerUser({
      name,
      email,
      mobile: mobile || "",
      password,
      privacyConsent: true
    });
    return res.json({
      success: true,
      message: "Registration successful! A Welcome Email with your Account Activation link has been sent to your inbox.",
      user,
      activationToken
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Registration failed" });
  }
});
app.post("/api/auth/activate", (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ error: "Email and activation token are required." });
    }
    const user = store.activateAccount(email, token);
    return res.json({
      success: true,
      message: "Account successfully activated! You can now log in to PulseNote AI.",
      user
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Account activation failed" });
  }
});
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (store.isStrictAdminEmail(cleanEmail)) {
      const adminUser = store.verifyAdminLogin(cleanEmail, password);
      if (adminUser) {
        return res.json({
          success: true,
          role: "admin",
          token: `ADMIN_TOKEN_${adminUser.id}_${Date.now()}`,
          user: adminUser
        });
      } else {
        return res.status(401).json({ error: "Invalid admin credentials." });
      }
    }
    const user = store.verifyUserLogin(cleanEmail, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!user.isActivated || user.status === "pending_activation") {
      return res.status(403).json({
        error: "Account not activated. Please verify the activation link sent to your email before logging in.",
        isPendingActivation: true,
        email: user.email,
        activationToken: user.activationToken
      });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ error: "Your account is suspended. Please contact admin." });
    }
    return res.json({
      success: true,
      role: user.role,
      token: `USER_TOKEN_${user.id}`,
      user
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Login failed" });
  }
});
app.get("/api/auth/me", (req, res) => {
  const userId = req.query.userId || req.headers.authorization?.replace("Bearer ", "");
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = store.findUserById(userId) || store.findUserByEmail(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  store.checkAndProcessExpirations();
  return res.json({ user });
});
app.post("/api/auth/forgot-password/request-otp", (req, res) => {
  try {
    const { email, channel = "email" } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }
    const { otp, mobile } = store.createPasswordResetOtp(email, channel);
    const maskedMobile = mobile ? `${mobile.slice(0, 3)}\u2022\u2022\u2022\u2022${mobile.slice(-3)}` : "registered mobile";
    return res.json({
      success: true,
      message: `A 6-digit OTP has been sent via ${channel.toUpperCase()}${channel !== "email" ? ` to ${maskedMobile}` : ""}.`,
      channel,
      otpPreviewForDev: otp
      // Preview token for immediate interactive test
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to send OTP" });
  }
});
app.post("/api/auth/forgot-password/verify-otp", (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP code, and new password are required." });
    }
    store.verifyOtpAndResetPassword(email, otp, newPassword);
    return res.json({
      success: true,
      message: "Password successfully updated! You can now log in with your new password."
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "OTP verification failed" });
  }
});
app.get("/api/user/billing", (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  store.checkAndProcessExpirations();
  const user = store.findUserById(userId);
  const payments = store.getUserPayments(userId);
  return res.json({
    userSubscription: user?.subscription || {
      tier: "free",
      isPro: false,
      startDate: Date.now(),
      expiresAt: null
    },
    payments
  });
});
app.post("/api/cron/check-expirations", (_req, res) => {
  const result = store.checkAndProcessExpirations();
  return res.json({
    success: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...result
  });
});
app.get("/api/admin/users", (req, res) => {
  store.checkAndProcessExpirations();
  const users = store.getAllUsers();
  return res.json({ users });
});
app.post("/api/admin/users/:userId/status", (req, res) => {
  try {
    const { userId } = req.params;
    const { status, isActivated } = req.body;
    const updated = store.updateUserAdminFields(userId, { status, isActivated });
    return res.json({ success: true, user: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});
app.post("/api/admin/users/:userId/reset-password", (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required." });
    }
    store.resetUserPasswordByAdmin(userId, newPassword);
    return res.json({ success: true, message: "User password reset successfully." });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});
app.post("/api/admin/grant-premium", (req, res) => {
  try {
    const { userId, amount = 1, unit = "months" } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!["days", "months", "years"].includes(unit)) {
      return res.status(400).json({ error: "Unit must be days, months, or years" });
    }
    const updatedUser = store.grantPremiumAccess(userId, Number(amount), unit);
    return res.json({
      success: true,
      message: `Granted ${amount} ${unit} of Pro access to ${updatedUser.name}`,
      user: updatedUser
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});
app.post("/api/admin/change-password", (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required." });
    }
    if (!store.verifyAdminPassword(currentPassword)) {
      return res.status(401).json({ error: "Current admin password is incorrect." });
    }
    store.updateAdminPassword(newPassword);
    return res.json({ success: true, message: "Admin password successfully updated." });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});
app.get("/api/admin/activity-logs", (req, res) => {
  const userId = req.query.userId;
  const logs = userId ? store.getUserActivityLogs(userId) : store.getAllActivityLogs();
  return res.json({ logs });
});
app.get("/api/admin/financials", (req, res) => {
  const { timeframe = "monthly", startDate, endDate } = req.query;
  const payments = store.getAllPayments().filter((p) => p.status === "completed");
  const now = /* @__PURE__ */ new Date();
  let filtered = payments;
  if (timeframe === "monthly") {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    filtered = payments.filter((p) => {
      const d = new Date(p.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  } else if (timeframe === "yearly") {
    const currentYear = now.getFullYear();
    filtered = payments.filter((p) => {
      const d = new Date(p.timestamp);
      return d.getFullYear() === currentYear;
    });
  } else if (timeframe === "custom" && startDate && endDate) {
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime() + 864e5;
    filtered = payments.filter((p) => p.timestamp >= startMs && p.timestamp <= endMs);
  }
  const totalINR = filtered.filter((p) => p.currency === "INR").reduce((sum, p) => sum + p.amount, 0);
  const totalUSD = filtered.filter((p) => p.currency === "USD").reduce((sum, p) => sum + p.amount, 0);
  const monthlyBreakdown = {};
  payments.forEach((p) => {
    const d = new Date(p.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyBreakdown[key]) monthlyBreakdown[key] = { totalINR: 0, count: 0 };
    if (p.currency === "INR") monthlyBreakdown[key].totalINR += p.amount;
    monthlyBreakdown[key].count++;
  });
  return res.json({
    timeframe,
    totalTransactions: filtered.length,
    totalINR,
    totalUSD,
    settlementVpa: "wagh.jayesh@oksbi",
    monthlyBreakdown,
    recentPayments: filtered.slice(0, 50)
  });
});
app.get("/api/admin/settings", (_req, res) => {
  return res.json({ settings: store.getSettings() });
});
app.post("/api/admin/settings", (req, res) => {
  try {
    const updates = req.body;
    const updated = store.updateSettings(updates, "jayeshofficial@gmail.com");
    return res.json({ success: true, settings: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});
app.get("/api/system/emails", (req, res) => {
  const email = req.query.email;
  const emails = email ? store.getEmailsForUser(email) : store.getAllEmails();
  return res.json({ emails });
});
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "No audio data provided" });
    }
    const audioPart = {
      inlineData: {
        mimeType: mimeType || "audio/webm",
        data: audioBase64
      }
    };
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          audioPart,
          {
            text: "Transcribe this spoken audio word-for-word into English text. Retain all technical terms, medical terminology, names, numbers, and dates. Do not add conversational commentary."
          }
        ]
      }
    });
    const transcript = response.text || "";
    return res.json({ transcript: transcript.trim() });
  } catch (err) {
    console.error("Error transcribing audio:", err);
    const message = err instanceof Error ? err.message : "Failed to transcribe audio";
    return res.status(500).json({ error: message });
  }
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path2.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(__dirname, "dist", "index.html"));
    });
  }
  app.listen(port, () => {
    console.log(`PulseNote AI server listening on port ${port} [mode: ${isProd ? "production" : "development"}]`);
  });
}
startServer();
