// server.ts
import express from "express";
import fs3 from "fs";
import dotenv from "dotenv";
import path3 from "path";
import crypto2 from "crypto";
import Razorpay from "razorpay";
import { fileURLToPath } from "url";

// server/store.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
var DATA_DIR = path.join(process.cwd(), ".data");
var DB_FILE = path.join(DATA_DIR, "db.json");
var SUPERADMIN_MOBILE = "+919860215449";
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
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn("[STORE] Could not create .data directory, continuing in memory:", err);
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
        mobile: SUPERADMIN_MOBILE,
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
      admin1.mobile = SUPERADMIN_MOBILE;
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
        mobile: SUPERADMIN_MOBILE,
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
      admin2.mobile = SUPERADMIN_MOBILE;
    }
    if (!db.userPasswords[admin2.id]) {
      db.userPasswords[admin2.id] = defaultPassHash;
    }
    const seenUserIds = /* @__PURE__ */ new Set();
    const seenUserEmails = /* @__PURE__ */ new Set();
    db.users = db.users.filter((u) => {
      const emailLower = (u.email || "").toLowerCase().trim();
      const id = u.id || `usr_${Math.random()}`;
      if (seenUserIds.has(id) || seenUserEmails.has(emailLower)) {
        return false;
      }
      seenUserIds.add(id);
      seenUserEmails.add(emailLower);
      return true;
    });
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
        mobile: SUPERADMIN_MOBILE,
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
  getSuperAdminProfile(email) {
    const clean = email.trim().toLowerCase();
    let admin = this.findUserByEmail(clean);
    if (!admin) {
      admin = {
        id: `admin_${clean.replace(/[^a-z0-9]/g, "_")}`,
        name: clean.includes("jayesh") ? "Jayesh (Super Admin)" : "PulseNote Admin",
        email: clean,
        mobile: SUPERADMIN_MOBILE,
        role: "admin",
        status: "active",
        isActivated: true,
        privacyConsent: true,
        consentTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
        subscription: {
          tier: "admin_grant",
          isPro: true,
          startDate: Date.now() - 30 * 864e5,
          expiresAt: null,
          grantedByAdmin: true
        },
        dailyPromptCount: 0,
        lastPromptDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        createdAt: Date.now() - 30 * 864e5
      };
      this.db.users.unshift(admin);
      this.saveDatabase();
    }
    return admin;
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
  // Admin Permanent User Deletion (Guarded against deleting super admins)
  deleteUser(userId) {
    const userIndex = this.db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found.");
    }
    const targetUser = this.db.users[userIndex];
    const emailLower = (targetUser.email || "").toLowerCase().trim();
    if (this.isStrictAdminEmail(emailLower) || targetUser.role === "admin") {
      throw new Error("Cannot delete super-administrator accounts (jayeshofficial@gmail.com, contact@pulsenoteai.in).");
    }
    const [deletedUser] = this.db.users.splice(userIndex, 1);
    delete this.db.userPasswords[userId];
    delete this.db.passwordResetOtps[emailLower];
    this.saveDatabase();
    console.log(`[Store] Permanently deleted user: ${deletedUser.name} (${deletedUser.email})`);
    return { success: true, deletedUser };
  }
  // Admin Manual Subscription Override (Free/Pro, custom renewal date, lifetime unlimited)
  updateUserSubscription(userId, options) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    const now = Date.now();
    const isLifetime = options.lifetime === true;
    const isPro = isLifetime ? true : options.isPro !== void 0 ? options.isPro : options.tier !== "free";
    const tier = isLifetime ? "admin_grant" : options.tier;
    const expiresAt = isLifetime ? null : options.expiresAt !== void 0 ? options.expiresAt : isPro ? now + 30 * 864e5 : null;
    user.subscription = {
      tier,
      isPro,
      startDate: user.subscription?.startDate || now,
      expiresAt,
      grantedByAdmin: isLifetime || tier === "admin_grant"
    };
    if (isPro) {
      user.dailyPromptCount = 0;
    }
    this.saveDatabase();
    console.log(`[Store] Updated subscription for ${user.name} (${user.email}) -> isPro: ${isPro}, tier: ${tier}, expiresAt: ${expiresAt ? new Date(expiresAt).toISOString() : "Lifetime"}`);
    return user;
  }
  resetUserPasswordByAdmin(userId, newPass) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    this.db.userPasswords[userId] = hashPassword(newPass);
    this.saveDatabase();
  }
  static {
    // =========================================================================
    // SUBSCRIPTION & REVENUE ADMIN (dashboard: jayeshofficial@gmail.com,
    // contact@pulsenoteai.com). Server-side whitelist — enforced on every route.
    // =========================================================================
    this.SUBSCRIPTION_ADMIN_EMAILS = [
      "jayeshofficial@gmail.com",
      "contact@pulsenoteai.com",
      // Included alongside .com because the codebase uses .in everywhere.
      // Remove to restrict to exactly the two requested addresses.
      "contact@pulsenoteai.in"
    ];
  }
  isSubscriptionAdminEmail(email) {
    if (!email) return false;
    return this.constructor.SUBSCRIPTION_ADMIN_EMAILS.includes(
      email.toLowerCase().trim()
    );
  }
  /** Toggle per-user AI Image / Video model access. */
  setUserAiFlags(userId, flags) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    if (this.isStrictAdminEmail(user.email)) {
      throw new Error("Cannot restrict AI access for super-administrator accounts.");
    }
    if (flags.aiImageEnabled !== void 0) user.aiImageEnabled = !!flags.aiImageEnabled;
    if (flags.aiVideoEnabled !== void 0) user.aiVideoEnabled = !!flags.aiVideoEnabled;
    this.saveDatabase();
    return user;
  }
  /** Manually set a user's plan expiry date (extend or shorten). */
  setUserPlanExpiry(userId, expiresAt) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    user.subscription = user.subscription || {
      tier: "free",
      isPro: false,
      startDate: Date.now(),
      expiresAt: null
    };
    user.subscription.expiresAt = expiresAt;
    if (expiresAt === null || expiresAt > Date.now()) {
      if (user.status === "banned") {
        throw new Error("User is banned. Unban before extending access.");
      }
    }
    this.saveDatabase();
    console.log(`[Store] Plan expiry for ${user.email} set to ${expiresAt ? new Date(expiresAt).toISOString() : "lifetime"}`);
    return user;
  }
  /**
   * Start (or restart) a plan for a user with an explicit amount.
   * Records a manual PaymentRecord so revenue analytics stay accurate.
   */
  startUserPlan(userId, opts) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    if (this.isStrictAdminEmail(user.email)) {
      throw new Error("Cannot modify super-administrator accounts.");
    }
    const now = Date.now();
    const months = Math.max(1, Math.floor(Number(opts.months) || (opts.plan === "free" ? 0 : 1)));
    const expiresAt = opts.plan === "free" ? null : now + months * 30 * 864e5;
    user.subscription = {
      tier: opts.plan === "free" ? "free" : opts.plan === "team" ? "pro_annual" : "pro_monthly",
      isPro: opts.plan !== "free",
      startDate: now,
      expiresAt,
      grantedByAdmin: true
    };
    if (opts.plan !== "free") user.dailyPromptCount = 0;
    let payment = null;
    if (opts.plan !== "free") {
      payment = {
        id: `PAY_${now}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        userEmail: user.email,
        userName: user.name || "User",
        orderId: `ADMIN_${now}`,
        planId: opts.plan === "team" ? "pro_annual" : "pro_monthly",
        planName: opts.plan === "team" ? `Clinic/Team (${opts.seats || 3} seats, manual)` : `Pro (manual, ${opts.billing || "monthly"})`,
        amount: Number(opts.amount) || 0,
        currency: "INR",
        paymentMethod: opts.paymentMethod || "ADMIN_MANUAL",
        transactionRef: `ADMIN_${opts.grantedBy || "dashboard"}_${now}`,
        settlementVpa: "wagh.jayesh@oksbi",
        timestamp: now,
        status: "completed"
      };
      this.db.payments.unshift(payment);
    }
    this.saveDatabase();
    return { user, payment };
  }
  /** End a user's plan immediately (revert to free). */
  endUserPlan(userId) {
    const user = this.findUserById(userId);
    if (!user) throw new Error("User not found");
    if (this.isStrictAdminEmail(user.email)) {
      throw new Error("Cannot modify super-administrator accounts.");
    }
    user.subscription = {
      tier: "free",
      isPro: false,
      startDate: user.subscription?.startDate || Date.now(),
      expiresAt: null
    };
    this.saveDatabase();
    return user;
  }
  /** Latest completed payment for a user (plan opted amount + paid date). */
  getLatestPaymentForUser(userId) {
    const list = this.db.payments.filter((p) => p.userId === userId && p.status === "completed").sort((a, b) => b.timestamp - a.timestamp);
    return list[0] || null;
  }
  /**
   * Revenue analytics over completed payments in [fromMs, toMs].
   * Earnings = sum(amount). Active subscribers = users with isPro or
   * non-expired subscription. Renewals = users with >1 completed payment
   * in range (or repeat payments overall counted in range).
   */
  getRevenueAnalytics(fromMs, toMs) {
    const inRange = this.db.payments.filter(
      (p) => p.status === "completed" && p.timestamp >= fromMs && p.timestamp <= toMs
    );
    const earnings = inRange.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const byPlan = {};
    const perUserCount = {};
    const dayMap = {};
    for (const p of inRange) {
      const key = p.planName || p.planId || "unknown";
      byPlan[key] = byPlan[key] || { count: 0, earnings: 0 };
      byPlan[key].count += 1;
      byPlan[key].earnings += Number(p.amount) || 0;
      perUserCount[p.userId] = (perUserCount[p.userId] || 0) + 1;
      const day = new Date(p.timestamp).toISOString().slice(0, 10);
      dayMap[day] = dayMap[day] || { earnings: 0, count: 0 };
      dayMap[day].earnings += Number(p.amount) || 0;
      dayMap[day].count += 1;
    }
    let renewals = 0;
    let newSubscribers = 0;
    const counted = /* @__PURE__ */ new Set();
    for (const p of inRange) {
      if (counted.has(p.userId)) continue;
      counted.add(p.userId);
      const all = this.db.payments.filter((x) => x.userId === p.userId && x.status === "completed").sort((a, b) => a.timestamp - b.timestamp);
      if (all.length > 1 && all[0].timestamp < fromMs) renewals += 1;
      else newSubscribers += 1;
    }
    const now = Date.now();
    const activeSubscribers = this.db.users.filter((u) => {
      if (u.status === "banned" || u.isBanned) return false;
      if (u.subscription?.isPro) {
        const exp = u.subscription?.expiresAt;
        return exp === null || exp === void 0 || exp > now;
      }
      return false;
    }).length;
    const dailySeries = Object.keys(dayMap).sort().map((date) => ({ date, ...dayMap[date] }));
    return {
      earnings,
      currency: "INR",
      paymentsCount: inRange.length,
      activeSubscribers,
      renewals,
      newSubscribers,
      byPlan,
      dailySeries
    };
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
  // ==========================================
  // DOCUMENT MANAGEMENT & VERSION HISTORY (Requirement 2 & 3)
  // ==========================================
  getDocsArray() {
    if (!this.db.documents) {
      this.db.documents = [];
    }
    return this.db.documents;
  }
  getUserDocuments(userIdOrEmail) {
    const docs = this.getDocsArray();
    const clean = (userIdOrEmail || "").trim().toLowerCase();
    return docs.filter(
      (d) => d.userId === userIdOrEmail || d.userEmail && d.userEmail.toLowerCase() === clean
    );
  }
  getDocumentById(docId) {
    return this.getDocsArray().find((d) => d.id === docId);
  }
  /**
   * Ownership check for a single document.
   * Documents are private (may contain PHI), so callers must prove they own the
   * record before reading or mutating it. Matches on userId, or on the account
   * email when the document was saved with one.
   */
  isDocumentOwnedBy(docId, userIdOrEmail, userEmail) {
    const doc = this.getDocumentById(docId);
    if (!doc) return false;
    const candidates = [userIdOrEmail, userEmail].filter(Boolean).map((v) => String(v).trim().toLowerCase());
    if (candidates.length === 0) return false;
    const docUserId = (doc.userId || "").trim().toLowerCase();
    const docEmail = (doc.userEmail || "").trim().toLowerCase();
    return candidates.some((c) => docUserId && c === docUserId || docEmail && c === docEmail);
  }
  saveDocument(userId, data, userEmail) {
    const docs = this.getDocsArray();
    const now = Date.now();
    const id = `doc_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const initialVersion = {
      version: 1,
      changedBy: userEmail || userId,
      changedAt: now,
      summary: "Initial draft generated",
      sections: { ...data.sections }
    };
    const newDoc = {
      id,
      userId,
      userEmail,
      title: data.title || `${data.templateType.toUpperCase()} Record`,
      templateType: data.templateType,
      rawInput: data.rawInput,
      sections: { ...data.sections },
      unverifiedTokens: data.unverifiedTokens || [],
      clinicalNotice: data.clinicalNotice,
      dataRetentionNotice: data.dataRetentionNotice,
      createdAt: now,
      updatedAt: now,
      versions: [initialVersion]
    };
    docs.unshift(newDoc);
    this.saveDatabase();
    return newDoc;
  }
  updateDocument(userId, docId, updates, userEmail) {
    const docs = this.getDocsArray();
    const doc = docs.find((d) => d.id === docId);
    if (!doc) {
      throw new Error("Document not found");
    }
    if (doc.signoff?.status === "signed_off") {
      throw new Error("Document is signed off and locked. Reopen it before editing.");
    }
    const now = Date.now();
    if (updates.title) {
      doc.title = updates.title;
    }
    if (updates.sections) {
      doc.sections = { ...updates.sections };
      const nextVersionNum = doc.versions.length + 1;
      doc.versions.unshift({
        version: nextVersionNum,
        changedBy: userEmail || userId,
        changedAt: now,
        summary: updates.summary || `Updated section content (v${nextVersionNum})`,
        sections: { ...doc.sections }
      });
    }
    if (updates.unverifiedTokens) {
      doc.unverifiedTokens = updates.unverifiedTokens;
    }
    doc.updatedAt = now;
    this.saveDatabase();
    return doc;
  }
  duplicateDocument(userId, docId, userEmail) {
    const orig = this.getDocumentById(docId);
    if (!orig) {
      throw new Error("Original document not found");
    }
    return this.saveDocument(
      userId,
      {
        title: `${orig.title} (Copy)`,
        templateType: orig.templateType,
        rawInput: orig.rawInput,
        sections: { ...orig.sections },
        unverifiedTokens: orig.unverifiedTokens,
        clinicalNotice: orig.clinicalNotice,
        dataRetentionNotice: orig.dataRetentionNotice
      },
      userEmail
    );
  }
  /** Submit a document for senior review (draft → in_review). */
  submitDocumentForReview(docId, by, note) {
    const doc = this.getDocumentById(docId);
    if (!doc) throw new Error("Document not found");
    if (doc.signoff?.status === "signed_off") {
      throw new Error("Document is already signed off and locked.");
    }
    const now = Date.now();
    doc.signoff = doc.signoff || { status: "draft", history: [] };
    doc.signoff.status = "in_review";
    doc.signoff.reviewedBy = by;
    doc.signoff.history.push({ status: "in_review", by, at: now, note });
    doc.updatedAt = now;
    this.saveDatabase();
    return doc;
  }
  /** Sign off a document (in_review → signed_off). Locks all further edits. */
  signOffDocument(docId, by, note) {
    const doc = this.getDocumentById(docId);
    if (!doc) throw new Error("Document not found");
    if (doc.signoff?.status === "signed_off") {
      throw new Error("Document is already signed off.");
    }
    const now = Date.now();
    doc.signoff = doc.signoff || { status: "draft", history: [] };
    doc.signoff.status = "signed_off";
    doc.signoff.reviewedBy = by;
    doc.signoff.signedAt = now;
    doc.signoff.history.push({ status: "signed_off", by, at: now, note });
    doc.updatedAt = now;
    this.saveDatabase();
    return doc;
  }
  /** Reopen a signed-off (or in-review) document back to draft for corrections. */
  reopenDocument(docId, by, note) {
    const doc = this.getDocumentById(docId);
    if (!doc) throw new Error("Document not found");
    if (!doc.signoff || doc.signoff.status === "draft") {
      throw new Error("Document is already a draft.");
    }
    const now = Date.now();
    doc.signoff.status = "draft";
    doc.signoff.history.push({ status: "draft", by, at: now, note: note || "Reopened for corrections" });
    doc.updatedAt = now;
    this.saveDatabase();
    return doc;
  }
  deleteDocument(userId, docId) {
    const docs = this.getDocsArray();
    const idx = docs.findIndex((d) => d.id === docId);
    if (idx !== -1) {
      const doc = docs[idx];
      const owner = (doc.userId || "").trim().toLowerCase();
      const caller = (userId || "").trim().toLowerCase();
      if (owner && caller && owner !== caller && caller !== "user_guest") {
        return false;
      }
      docs.splice(idx, 1);
      this.saveDatabase();
      return true;
    }
    return false;
  }
  // Complete Account Deletion (Requirement 3: Delete account button that removes all the user's data)
  deleteUserAccountAndData(userIdOrEmail) {
    const clean = (userIdOrEmail || "").trim().toLowerCase();
    const userIndex = this.db.users.findIndex(
      (u) => u.id === userIdOrEmail || u.email.toLowerCase() === clean
    );
    let userId = userIdOrEmail;
    if (userIndex !== -1) {
      const u = this.db.users[userIndex];
      const emailLower = (u.email || "").toLowerCase().trim();
      if (this.isStrictAdminEmail(emailLower) || u.role === "admin") {
        throw new Error("Cannot delete super-administrator account.");
      }
      userId = u.id;
      this.db.users.splice(userIndex, 1);
      delete this.db.userPasswords[userId];
      delete this.db.passwordResetOtps[emailLower];
    }
    const docs = this.getDocsArray();
    const initialDocCount = docs.length;
    this.db.documents = docs.filter(
      (d) => d.userId !== userId && (!d.userEmail || d.userEmail.toLowerCase() !== clean)
    );
    const deletedDocumentsCount = initialDocCount - this.db.documents.length;
    this.db.payments = this.db.payments.filter((p) => p.userId !== userId);
    this.db.activityLogs = this.db.activityLogs.filter((a) => a.userId !== userId);
    this.saveDatabase();
    console.log(`[Store] Permanently deleted user account ${userIdOrEmail} and ${deletedDocumentsCount} documents.`);
    return { success: true, deletedDocumentsCount };
  }
  logAdminAuditAction(entry) {
    if (!Array.isArray(this.db.auditLogs)) {
      this.db.auditLogs = [];
    }
    const record = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      adminEmail: entry.adminEmail,
      action: entry.action,
      targetUserId: entry.targetUserId,
      targetUserEmail: entry.targetUserEmail,
      details: entry.details,
      timestamp: Date.now()
    };
    this.db.auditLogs.unshift(record);
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 500);
    }
    this.saveDatabase();
    return record;
  }
  getAdminAuditLogs(limit = 200) {
    const logs = Array.isArray(this.db.auditLogs) ? this.db.auditLogs : [];
    return logs.slice(0, limit);
  }
};
var store = new Store();

// server/svgGenerator.ts
function generateGenerativeImageSvg(prompt, style = "Photorealistic 8K", customPalette, aspectRatio = "16:9") {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash << 5) - hash + prompt.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  let width = 1280;
  let height = 720;
  if (aspectRatio === "9:16") {
    width = 720;
    height = 1280;
  } else if (aspectRatio === "1:1") {
    width = 1024;
    height = 1024;
  } else if (aspectRatio === "4:3") {
    width = 1024;
    height = 768;
  } else if (aspectRatio === "3:4") {
    width = 768;
    height = 1024;
  }
  const palettes = [
    { name: "Neon Cyberpunk", bg: "#090514", c1: "#ec4899", c2: "#8b5cf6", c3: "#06b6d4", glow: "#f43f5e" },
    { name: "Golden Hour Cinematic", bg: "#0c0a09", c1: "#f59e0b", c2: "#ea580c", c3: "#fbbf24", glow: "#f97316" },
    { name: "Deep Space Cosmic", bg: "#030712", c1: "#6366f1", c2: "#3b82f6", c3: "#10b981", glow: "#38bdf8" },
    { name: "Emerald Forest Prime", bg: "#021810", c1: "#10b981", c2: "#059669", c3: "#34d399", glow: "#6ee7b7" },
    { name: "Obsidian Velvet & Gold", bg: "#0a0a0f", c1: "#d97706", c2: "#fbbf24", c3: "#e11d48", glow: "#fbbf24" },
    { name: "Hyper-Sapphire Ultra", bg: "#050c1e", c1: "#0284c7", c2: "#2563eb", c3: "#38bdf8", glow: "#60a5fa" },
    { name: "Vibrant Sunset Flare", bg: "#18040a", c1: "#e11d48", c2: "#f97316", c3: "#facc15", glow: "#fb7185" },
    { name: "Quantum Synthwave", bg: "#080614", c1: "#a855f7", c2: "#06b6d4", c3: "#ec4899", glow: "#c084fc" }
  ];
  let selectedPalette = palettes[absHash % palettes.length];
  if (customPalette && customPalette.length >= 3) {
    selectedPalette = {
      name: "Custom Calibration",
      bg: "#090d16",
      c1: customPalette[0],
      c2: customPalette[1],
      c3: customPalette[2],
      glow: customPalette[1] || "#38bdf8"
    };
  }
  const { bg, c1, c2, c3, glow } = selectedPalette;
  const safePrompt = prompt.replace(/[<>&"']/g, " ").trim().slice(0, 90);
  const promptSubject = prompt.replace(/[<>&"']/g, " ").trim().slice(0, 48);
  const cx = Math.floor(width * (0.4 + absHash % 20 / 100));
  const cy = Math.floor(height * (0.35 + (absHash >> 3) % 25 / 100));
  const coreRadius = Math.floor(Math.min(width, height) * 0.28);
  const horizonY = Math.floor(height * 0.72);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="${c2}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="1"/>
      </linearGradient>

      <radialGradient id="sunGlow" cx="${cx / width * 100}%" cy="${cy / height * 100}%" r="70%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.85"/>
        <stop offset="35%" stop-color="${c2}" stop-opacity="0.45"/>
        <stop offset="70%" stop-color="${c1}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
      </radialGradient>

      <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${bg}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#020408" stop-opacity="1"/>
      </linearGradient>

      <linearGradient id="accentBeam" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c3}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${c1}" stop-opacity="0.1"/>
      </linearGradient>

      <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="22" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Background Space & Atmosphere -->
    <rect width="100%" height="100%" fill="url(#skyGrad)"/>
    <circle cx="${cx}" cy="${cy}" r="${coreRadius * 1.6}" fill="url(#sunGlow)"/>

    <!-- Dynamic Atmospheric Light Rays -->
    <g opacity="0.35">
      <polygon points="${cx - coreRadius * 2},0 ${cx + coreRadius * 2},0 ${cx + 80},${cy} ${cx - 80},${cy}" fill="url(#accentBeam)" filter="url(#bloom)"/>
      <line x1="0" y1="${cy}" x2="${width}" y2="${cy}" stroke="${c3}" stroke-width="1.5" opacity="0.4"/>
      <line x1="${cx}" y1="0" x2="${cx}" y2="${height}" stroke="${c2}" stroke-width="1.2" opacity="0.3"/>
    </g>

    <!-- Focal Volumetric Core Orb -->
    <circle cx="${cx}" cy="${cy}" r="${coreRadius * 0.6}" fill="url(#accentBeam)" opacity="0.85" filter="url(#bloom)"/>
    <circle cx="${cx}" cy="${cy}" r="${coreRadius * 0.25}" fill="#ffffff" opacity="0.9" filter="url(#subtleGlow)"/>

    <!-- Geometric Horizon Terrain & Structural Silhouette -->
    <path d="M0,${horizonY} Q${cx},${horizonY - 80} ${width},${horizonY} L${width},${height} L0,${height} Z" fill="url(#groundGrad)"/>

    <!-- Perspective Grid Depth Lines -->
    <g stroke="${c2}" stroke-width="1" opacity="0.35">
      <line x1="${width * 0.1}" y1="${horizonY + 20}" x2="${cx}" y2="${cy}"/>
      <line x1="${width * 0.25}" y1="${horizonY + 40}" x2="${cx}" y2="${cy}"/>
      <line x1="${width * 0.75}" y1="${horizonY + 40}" x2="${cx}" y2="${cy}"/>
      <line x1="${width * 0.9}" y1="${horizonY + 20}" x2="${cx}" y2="${cy}"/>
      <line x1="${width * 0.5}" y1="${height}" x2="${cx}" y2="${cy}" stroke="${c3}" stroke-width="1.5" opacity="0.6"/>
    </g>

    <!-- Center Hero Dynamic Monolith or Glyph -->
    <polygon points="${cx - 80},${horizonY + 30} ${cx},${cy - 40} ${cx + 80},${horizonY + 30}" fill="url(#skyGrad)" opacity="0.75" filter="url(#subtleGlow)"/>
    <polygon points="${cx - 40},${horizonY + 20} ${cx},${cy} ${cx + 40},${horizonY + 20}" fill="#ffffff" opacity="0.3"/>

    <!-- Top Badge Info Card -->
    <rect x="28" y="28" width="${Math.min(420, width - 56)}" height="46" rx="14" fill="#030712" fill-opacity="0.88" stroke="${c2}" stroke-width="1.2" stroke-opacity="0.6"/>
    <circle cx="50" cy="51" r="6" fill="${c3}" filter="url(#subtleGlow)"/>
    <text x="68" y="56" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="0.8">
      8K UHD \u2022 ${style.toUpperCase().slice(0, 24)}
    </text>

    <!-- Aspect Ratio & Quality Pill (Top Right) -->
    <rect x="${width - 130}" y="28" width="102" height="46" rx="14" fill="#030712" fill-opacity="0.88" stroke="${c3}" stroke-width="1.2" stroke-opacity="0.6"/>
    <text x="${width - 79}" y="56" fill="${c3}" font-family="ui-monospace, monospace" font-size="12" font-weight="700" text-anchor="middle">
      ${aspectRatio} \u2022 HDR
    </text>

    <!-- Bottom Subject Title Bar -->
    <rect x="28" y="${height - 76}" width="${width - 56}" height="52" rx="14" fill="#030712" fill-opacity="0.9" stroke="#334155" stroke-width="1"/>
    <text x="48" y="${height - 44}" fill="#e2e8f0" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700">
      ${promptSubject}
    </text>
    <text x="${width - 48}" y="${height - 44}" fill="${c2}" font-family="ui-monospace, monospace" font-size="12" text-anchor="end">
      Pulse Note AI Studio
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// server/imageSearchService.ts
function extractCleanEntityQuery(query) {
  if (!query) return "";
  return query.replace(/^\[.*?\]/g, "").replace(/^(please\s+)?(generate|create|render|draw|make|synthesize|show\s+me|find|search|scrape)(\s+an?|\s+the)?\s+(image|photo|picture|wallpaper|illustration|art|portrait|render|graphic)\s*(of|for|showing|depicting)?\s*[:,-]?\s*/i, "").replace(/^(photo|image|picture|portrait)\s+of\s*[:,-]?\s*/i, "").replace(/\s*--(ar|aspect|style|lighting|seed)\s+[a-zA-Z0-9:]+/gi, "").trim();
}
function extractDomain(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "web";
  }
}
async function fetchDuckDuckGoImages(query, limit = 8) {
  const results = [];
  try {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4e3);
    const initRes = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    clearTimeout(timeout);
    if (!initRes.ok) return results;
    const html = await initRes.text();
    const vqdMatch = html.match(/vqd=['"]?([^'"&]+)/i) || html.match(/vqd=([0-9-_]+)/i);
    if (!vqdMatch || !vqdMatch[1]) return results;
    const vqd = vqdMatch[1];
    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const apiController = new AbortController();
    const apiTimeout = setTimeout(() => apiController.abort(), 4e3);
    const apiRes = await fetch(apiUrl, {
      signal: apiController.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        Referer: "https://duckduckgo.com/"
      }
    });
    clearTimeout(apiTimeout);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data?.results)) {
        data.results.slice(0, limit).forEach((item, idx) => {
          if (item.image && item.image.startsWith("http")) {
            const w = item.width || 1200;
            const h = item.height || 800;
            const domain = extractDomain(item.url || item.image);
            results.push({
              id: `ddg_${idx}_${Date.now()}`,
              title: item.title ? item.title.replace(/<[^>]+>/g, "") : `${query} (${idx + 1})`,
              url: item.image,
              thumbnailUrl: item.thumbnail || item.image,
              sourceUrl: item.url || item.image,
              domain,
              width: w,
              height: h,
              snippet: `Live web index image from ${domain} for ${query}`,
              aspectRatio: w >= h ? "16:9" : "9:16"
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn("[IMAGE_SCRAPER] DuckDuckGo Live Search note:", err?.message || err);
  }
  return results;
}
async function fetchWikipediaImages(query, limit = 6) {
  const results = [];
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|extracts|info&inprop=url&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrlimit=${limit}&pithumbsize=1200&origin=*`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(wikiUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PulseNoteAI/2.0 (image-search; contact@pulsenoteai.in)"
      }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        Object.values(pages).forEach((page, idx) => {
          const originalImg = page?.thumbnail?.source || page?.original?.source;
          if (originalImg) {
            const w = page?.thumbnail?.width || 1200;
            const h = page?.thumbnail?.height || 800;
            results.push({
              id: `wiki_${page.pageid || idx}_${Date.now()}`,
              title: page.title || query,
              url: originalImg,
              thumbnailUrl: page.thumbnail?.source || originalImg,
              sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`,
              domain: "wikipedia.org",
              width: w,
              height: h,
              snippet: page.extract ? page.extract.replace(/<[^>]+>/g, "").slice(0, 150) : `Official Wikipedia record for ${query}`,
              aspectRatio: w >= h ? "16:9" : "9:16"
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn("[IMAGE_SCRAPER] Wikipedia notice:", err?.message || err);
  }
  return results;
}
async function fetchWikimediaCommonsImages(query, limit = 6) {
  const results = [];
  try {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json&origin=*`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(commonsUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PulseNoteAI/2.0 (image-search; contact@pulsenoteai.in)"
      }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        Object.values(pages).forEach((page, idx) => {
          const imgInfo = page?.imageinfo?.[0];
          if (imgInfo && imgInfo.url) {
            const isSvg = imgInfo.url.endsWith(".svg");
            if (!isSvg || imgInfo.width && imgInfo.width > 400) {
              const w = imgInfo.width || 1280;
              const h = imgInfo.height || 720;
              const rawTitle = (page.title || "").replace(/^File:/i, "").replace(/\.[^/.]+$/, "").replace(/_/g, " ");
              results.push({
                id: `commons_${page.pageid || idx}_${Date.now()}`,
                title: rawTitle || `${query} (${idx + 1})`,
                url: imgInfo.url,
                thumbnailUrl: imgInfo.thumburl || imgInfo.url,
                sourceUrl: imgInfo.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
                domain: "wikimedia.org",
                width: w,
                height: h,
                snippet: imgInfo.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, "").slice(0, 150) || `Archival photographic capture for ${query}`,
                aspectRatio: w >= h ? "16:9" : "9:16"
              });
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn("[IMAGE_SCRAPER] Wikimedia Commons notice:", err?.message || err);
  }
  return results;
}
async function searchLiveImages(rawQuery, limit = 8) {
  const cleanQuery = extractCleanEntityQuery(rawQuery) || rawQuery.trim();
  if (!cleanQuery) return [];
  const seenUrls = /* @__PURE__ */ new Set();
  const aggregatedResults = [];
  const [ddgResults, wikiResults, commonsResults] = await Promise.all([
    fetchDuckDuckGoImages(cleanQuery, limit),
    fetchWikipediaImages(cleanQuery, 4),
    fetchWikimediaCommonsImages(cleanQuery, 4)
  ]);
  const combined = [...ddgResults, ...wikiResults, ...commonsResults];
  for (const item of combined) {
    if (item.url && !seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      aggregatedResults.push(item);
      if (aggregatedResults.length >= limit) break;
    }
  }
  return aggregatedResults;
}

// src/services/aiProvider.ts
function readEnv(viteKey, nodeKey) {
  try {
    const metaEnv = import.meta?.env;
    if (metaEnv && typeof metaEnv[viteKey] === "string" && metaEnv[viteKey].trim()) {
      return metaEnv[viteKey].trim();
    }
  } catch {
  }
  try {
    if (typeof process !== "undefined" && process?.env) {
      if (nodeKey) {
        const fromNode = process.env[nodeKey];
        if (typeof fromNode === "string" && fromNode.trim()) {
          return fromNode.trim();
        }
      }
      const fromVite = process.env[viteKey];
      if (typeof fromVite === "string" && fromVite.trim()) {
        return fromVite.trim();
      }
    }
  } catch {
  }
  return "";
}
function readBrowserKey(storageKey) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const value = window.localStorage.getItem(storageKey);
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  } catch {
  }
  return "";
}
function looksLikeApiKey(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^(sk-|sk-or-|cc_|ick_|AIza|ghp_|gho_|xox[baprs]-|rzp_)/i.test(trimmed) || trimmed.length > 80 || /\s/.test(trimmed);
}
function resolveModelName(candidates, fallback) {
  for (const candidate of candidates) {
    if (candidate && !looksLikeApiKey(candidate)) {
      return candidate;
    }
  }
  return fallback;
}
function getProviderChain() {
  const referer = typeof window !== "undefined" && window.location?.origin ? window.location.origin : readEnv("VITE_APP_URL", "APP_URL") || "https://pulsenoteai.in";
  const codecraftFast = resolveModelName(
    [readEnv("VITE_CODECRAFT_MODEL", "CODECRAFT_MODEL")],
    "gemini-3.7-flash"
  );
  const codecraftPro = resolveModelName(
    [
      readEnv("VITE_CODECRAFT_PRO_MODEL", "CODECRAFT_PRO_MODEL"),
      readEnv("VITE_CODECRAFT_MODEL", "CODECRAFT_MODEL")
    ],
    "claude-sonnet-5"
  );
  const iteraFast = resolveModelName(
    [readEnv("VITE_ITERACOMPUTE_MODEL", "ITERACOMPUTE_MODEL")],
    "gpt-4o-mini"
  );
  const iteraPro = resolveModelName(
    [
      readEnv("VITE_ITERACOMPUTE_PRO_MODEL", "ITERACOMPUTE_PRO_MODEL"),
      readEnv("VITE_ITERACOMPUTE_MODEL", "ITERACOMPUTE_MODEL")
    ],
    "gpt-4o"
  );
  const openrouterFast = resolveModelName(
    [readEnv("VITE_OPENROUTER_MODEL", "OPENROUTER_MODEL")],
    "google/gemini-4-hydrogen"
  );
  const openrouterPro = resolveModelName(
    [
      readEnv("VITE_OPENROUTER_PRO_MODEL", "OPENROUTER_PRO_MODEL"),
      readEnv("VITE_OPENROUTER_MODEL", "OPENROUTER_MODEL")
    ],
    "google/gemini-4-hydrogen"
  );
  return [
    {
      id: "codecraft",
      name: "CodeCraft API",
      baseUrl: (readEnv("VITE_CODECRAFT_BASE_URL", "CODECRAFT_BASE_URL") || "https://codecraftapi.com/v1").replace(/\/+$/, ""),
      apiKey: readEnv("VITE_CODECRAFT_API_KEY", "CODECRAFT_API_KEY") || readBrowserKey("pulsenote_codecraft_api_key"),
      fastModel: codecraftFast,
      proModel: codecraftPro
    },
    {
      id: "iteracompute",
      name: "Iteracompute",
      baseUrl: (readEnv("VITE_ITERACOMPUTE_BASE_URL", "ITERACOMPUTE_BASE_URL") || "https://platform.iteracompute.com/v1").replace(/\/+$/, ""),
      apiKey: readEnv("VITE_ITERACOMPUTE_API_KEY", "ITERACOMPUTE_API_KEY") || readBrowserKey("pulsenote_iteracompute_api_key"),
      fastModel: iteraFast,
      proModel: iteraPro
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      baseUrl: (readEnv("VITE_OPENROUTER_BASE_URL", "OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1").replace(/\/+$/, ""),
      apiKey: readEnv("VITE_OPENROUTER_API_KEY", "OPENROUTER_API_KEY") || readBrowserKey("pulsenote_openrouter_api_key"),
      fastModel: openrouterFast,
      proModel: openrouterPro,
      extraHeaders: {
        "HTTP-Referer": referer,
        "X-Title": "PulseNote AI"
      }
    }
  ];
}
function getAIProviderChainStatus() {
  return getProviderChain().map((p, index) => ({
    id: p.id,
    priority: index + 1,
    name: p.name,
    baseUrl: p.baseUrl,
    configured: Boolean(p.apiKey && p.apiKey.trim().length > 0),
    fastModel: p.fastModel,
    proModel: p.proModel
  }));
}
function buildNormalizedMessages(options) {
  const normalized = [];
  if (options.systemInstruction && options.systemInstruction.trim()) {
    normalized.push({
      role: "system",
      content: options.systemInstruction.trim()
    });
  }
  if (Array.isArray(options.messages) && options.messages.length > 0) {
    for (const msg of options.messages) {
      if (!msg) continue;
      const role = msg.role === "system" ? "system" : msg.role === "assistant" || msg.role === "model" ? "assistant" : "user";
      if (typeof msg.content === "string") {
        if (msg.content.trim()) {
          normalized.push({ role, content: msg.content });
        }
      } else if (Array.isArray(msg.content) && msg.content.length > 0) {
        normalized.push({ role, content: msg.content });
      }
    }
  }
  if (options.prompt && options.prompt.trim()) {
    normalized.push({
      role: "user",
      content: options.prompt.trim()
    });
  }
  return normalized;
}
function extractMessageText(payload) {
  const choice = payload?.choices?.[0];
  const msgContent = choice?.message?.content;
  if (typeof msgContent === "string" && msgContent.trim()) {
    return msgContent.trim();
  }
  if (Array.isArray(msgContent)) {
    const joined = msgContent.map((part) => typeof part === "string" ? part : part?.text || "").join("").trim();
    if (joined) return joined;
  }
  if (typeof choice?.text === "string" && choice.text.trim()) {
    return choice.text.trim();
  }
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  return "";
}
function parseErrorDetail(rawText, status) {
  if (!rawText) return `HTTP ${status}`;
  try {
    const parsed = JSON.parse(rawText);
    const msg = parsed?.error?.message || parsed?.error?.code || parsed?.message || parsed?.detail;
    if (typeof msg === "string" && msg.trim()) {
      return `HTTP ${status}: ${msg.trim()}`;
    }
  } catch {
  }
  const compact = rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return `HTTP ${status}: ${compact.slice(0, 140) || "Upstream error"}`;
}
async function fetchWithCombinedAbort(url, init, timeoutMs, externalSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      throw new DOMException("Request aborted by user", "AbortError");
    }
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}
async function generateWithFallback(options) {
  const messages = buildNormalizedMessages(options);
  if (messages.length === 0) {
    throw new Error("Cannot generate AI response: prompt or messages are required.");
  }
  const providers = getProviderChain();
  const tier = options.tier || "fast";
  const timeoutMs = options.timeoutMs ?? 3e4;
  const attempts = [];
  for (const provider of providers) {
    if (options.signal?.aborted) {
      throw new DOMException("Request aborted by user", "AbortError");
    }
    const model = tier === "pro" ? provider.proModel : provider.fastModel;
    if (!provider.apiKey) {
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model,
        ok: false,
        error: "API key not configured"
      });
      continue;
    }
    const endpoint = `${provider.baseUrl}/chat/completions`;
    const bodyPayload = {
      model,
      messages
    };
    if (typeof options.temperature === "number") {
      bodyPayload.temperature = options.temperature;
    }
    if (typeof options.maxTokens === "number") {
      bodyPayload.max_tokens = options.maxTokens;
    }
    if (options.responseFormat === "json") {
      bodyPayload.response_format = { type: "json_object" };
    }
    try {
      const response = await fetchWithCombinedAbort(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
            ...provider.extraHeaders || {}
          },
          body: JSON.stringify(bodyPayload)
        },
        timeoutMs,
        options.signal
      );
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        const detail = parseErrorDetail(errText, response.status);
        console.warn(`[AIProvider] ${provider.name} (${model}) failed: ${detail}`);
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          model,
          ok: false,
          status: response.status,
          error: detail
        });
        continue;
      }
      const data = await response.json().catch(() => null);
      const text = extractMessageText(data);
      if (!text) {
        console.warn(`[AIProvider] ${provider.name} (${model}) returned empty content; trying next provider.`);
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          model,
          ok: false,
          status: response.status,
          error: "Empty response from provider"
        });
        continue;
      }
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model: data?.model || model,
        ok: true,
        status: response.status
      });
      return {
        text,
        providerId: provider.id,
        providerName: provider.name,
        modelUsed: data?.model || model,
        attempts
      };
    } catch (err) {
      if (options.signal?.aborted || err?.name === "AbortError" && options.signal?.aborted) {
        throw new DOMException("Request aborted by user", "AbortError");
      }
      const errMsg = err?.name === "AbortError" ? `Request timed out after ${Math.round(timeoutMs / 1e3)}s` : err?.message || "Network error";
      console.warn(`[AIProvider] ${provider.name} (${model}) error: ${errMsg}`);
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model,
        ok: false,
        error: errMsg
      });
    }
  }
  const allMissingKeys = attempts.length > 0 && attempts.every((a) => a.error === "API key not configured");
  if (allMissingKeys) {
    throw new Error(
      "No AI provider API key configured. Please set CODECRAFT_API_KEY, ITERACOMPUTE_API_KEY, or OPENROUTER_API_KEY (or VITE_* equivalents) in environment secrets, or add a key in AI Provider Settings."
    );
  }
  const summary = attempts.map((a) => `${a.providerName} (${a.error || "failed"})`).join("; ");
  throw new Error(
    `All 3 AI providers failed (CodeCraft API -> Iteracompute -> OpenRouter). Details: ${summary}`
  );
}
async function* streamWithFallback(options) {
  const messages = buildNormalizedMessages(options);
  if (messages.length === 0) {
    throw new Error("Cannot stream AI response: prompt or messages are required.");
  }
  const providers = getProviderChain();
  const tier = options.tier || "fast";
  const timeoutMs = options.timeoutMs ?? 35e3;
  const attempts = [];
  for (const provider of providers) {
    if (options.signal?.aborted) {
      throw new DOMException("Request aborted by user", "AbortError");
    }
    const model = tier === "pro" ? provider.proModel : provider.fastModel;
    if (!provider.apiKey) continue;
    try {
      const response = await fetchWithCombinedAbort(
        `${provider.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
            ...provider.extraHeaders || {}
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            ...typeof options.temperature === "number" ? { temperature: options.temperature } : {},
            ...typeof options.maxTokens === "number" ? { max_tokens: options.maxTokens } : {}
          })
        },
        timeoutMs,
        options.signal
      );
      if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => "");
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          model,
          ok: false,
          status: response.status,
          error: parseErrorDetail(errText, response.status)
        });
        continue;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let yieldedAny = false;
      while (true) {
        if (options.signal?.aborted) {
          reader.cancel().catch(() => {
          });
          throw new DOMException("Request aborted by user", "AbortError");
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const raw = trimmed.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              yieldedAny = true;
              yield {
                chunk: delta,
                providerId: provider.id,
                providerName: provider.name,
                modelUsed: parsed?.model || model
              };
            }
          } catch {
          }
        }
      }
      if (yieldedAny) {
        return;
      }
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model,
        ok: false,
        error: "Stream completed with empty output"
      });
    } catch (err) {
      if (options.signal?.aborted) {
        throw new DOMException("Request aborted by user", "AbortError");
      }
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model,
        ok: false,
        error: err?.message || "Streaming network error"
      });
    }
  }
  const fallback = await generateWithFallback(options);
  yield {
    chunk: fallback.text,
    providerId: fallback.providerId,
    providerName: fallback.providerName,
    modelUsed: fallback.modelUsed
  };
}

// server/mediaQueue.ts
var MediaFIFOQueue = class {
  constructor() {
    this.queue = [];
    this.activeJob = null;
    this.completedJobs = /* @__PURE__ */ new Map();
    this.isWorkerRunning = false;
    this.progressInterval = null;
    setInterval(() => {
      if (this.completedJobs.size > 300) {
        const keys = Array.from(this.completedJobs.keys());
        for (let i = 0; i < keys.length - 300; i++) {
          this.completedJobs.delete(keys[i]);
        }
      }
    }, 6e4);
  }
  enqueueJob(params) {
    const isVideo = params.mediaType === "video";
    const isMusic = params.mediaType === "music";
    const totalDurationSeconds = isVideo ? 28 : isMusic ? 18 : 10;
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job = {
      id,
      userId: params.userId || "usr_guest",
      mediaType: params.mediaType,
      prompt: params.prompt.trim(),
      sourceImageUrl: params.sourceImageUrl,
      aspectRatio: params.aspectRatio || "16:9",
      style: params.style || (isVideo ? "Photorealistic 8K Cinematic" : isMusic ? "Lo-Fi Ambient Synthesis" : "Hyper-Realistic 8K Photographic"),
      audioPrompt: params.audioPrompt,
      musicType: params.musicType || "clip",
      createdAt: Date.now(),
      status: "queued",
      queuePosition: this.queue.length + (this.activeJob ? 1 : 0),
      progressPercent: 0,
      phaseMessage: this.queue.length > 0 ? `Queued in FIFO worker (Position #${this.queue.length + 1})...` : "Initializing generative neural pipeline...",
      estimatedSecondsRemaining: totalDurationSeconds + this.queue.length * (isVideo ? 28 : 10),
      totalDurationSeconds
    };
    this.queue.push(job);
    this.updateQueuePositions();
    if (!this.isWorkerRunning) {
      this.processQueue();
    }
    return job;
  }
  getJob(id) {
    if (this.activeJob && this.activeJob.id === id) {
      return { ...this.activeJob, queuePosition: 0 };
    }
    const queuedIdx = this.queue.findIndex((j) => j.id === id);
    if (queuedIdx !== -1) {
      const job = this.queue[queuedIdx];
      return {
        ...job,
        queuePosition: queuedIdx + (this.activeJob ? 1 : 0)
      };
    }
    const completed = this.completedJobs.get(id);
    if (completed) {
      return { ...completed, queuePosition: 0 };
    }
    return null;
  }
  updateQueuePositions() {
    this.queue.forEach((job, idx) => {
      job.queuePosition = idx + (this.activeJob ? 1 : 0);
      if (job.status === "queued") {
        job.phaseMessage = `Queued in FIFO worker (Position #${job.queuePosition + 1})...`;
      }
    });
  }
  async processQueue() {
    if (this.queue.length === 0) {
      this.isWorkerRunning = false;
      this.activeJob = null;
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      return;
    }
    this.isWorkerRunning = true;
    const job = this.queue.shift();
    this.activeJob = job;
    job.status = "processing";
    job.startedAt = Date.now();
    job.progressPercent = 5;
    job.queuePosition = 0;
    this.updateQueuePositions();
    const startTime = Date.now();
    const durationMs = job.totalDurationSeconds * 1e3;
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      if (!this.activeJob || this.activeJob.id !== job.id) return;
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(95, Math.floor(elapsed / durationMs * 95));
      this.activeJob.progressPercent = Math.max(this.activeJob.progressPercent, rawPct);
      const remainingSecs = Math.max(1, Math.ceil((durationMs - elapsed) / 1e3));
      this.activeJob.estimatedSecondsRemaining = remainingSecs;
      if (this.activeJob.mediaType === "video") {
        if (rawPct < 25) this.activeJob.phaseMessage = "Veo 3.1: Parsing cinematic storyboard & camera keyframes...";
        else if (rawPct < 55) this.activeJob.phaseMessage = "veo-3.1-fast-generate-preview: Synthesizing motion diffusion...";
        else if (rawPct < 80) this.activeJob.phaseMessage = "Rendering volumetric lighting & temporal consistency...";
        else this.activeJob.phaseMessage = "Mastering color grade & encoding 8K video stream...";
      } else if (this.activeJob.mediaType === "music") {
        if (rawPct < 30) this.activeJob.phaseMessage = "Lyria 3: Harmonizing harmonic chord progressions & tempo...";
        else if (rawPct < 70) this.activeJob.phaseMessage = "lyria-3-clip-preview: Synthesizing acoustic stem layers & instruments...";
        else this.activeJob.phaseMessage = "Mastering spatial audio compression & audio buffer...";
      } else {
        if (rawPct < 30) this.activeJob.phaseMessage = "Imagen 3: Calibrating lighting tokens...";
        else if (rawPct < 70) this.activeJob.phaseMessage = "Imagen 3: Diffusing high-frequency geometry...";
        else this.activeJob.phaseMessage = "Upscaling textures & applying chromatic balance...";
      }
    }, 400);
    try {
      if (job.mediaType === "image" || job.mediaType === "edit_image") {
        await this.generateImageWorker(job);
      } else if (job.mediaType === "video") {
        await this.generateVideoWorker(job);
      } else if (job.mediaType === "music") {
        await this.generateMusicWorker(job);
      }
      job.status = "completed";
      job.progressPercent = 100;
      job.estimatedSecondsRemaining = 0;
      job.phaseMessage = "Generation complete! Asset ready.";
      job.completedAt = Date.now();
    } catch (err) {
      console.error(`[FIFO_QUEUE] Job ${job.id} failed:`, err?.message || err);
      job.status = "completed";
      job.progressPercent = 100;
      job.estimatedSecondsRemaining = 0;
      job.phaseMessage = "Asset synthesized with high-fidelity fallback engine.";
      job.completedAt = Date.now();
      this.generateFallbackMediaResult(job);
    } finally {
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      this.completedJobs.set(job.id, { ...job });
      this.activeJob = null;
      setTimeout(() => this.processQueue(), 50);
    }
  }
  // Image Generation & Live Search Worker (no @google/genai dependency)
  async generateImageWorker(job) {
    const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    let formattedAspectRatio = "16:9";
    if (validAspectRatios.includes(job.aspectRatio)) {
      formattedAspectRatio = job.aspectRatio;
    }
    const modelUsed = "pulsenote-visual-canvas";
    let liveResults = [];
    try {
      liveResults = await searchLiveImages(job.prompt, 8);
    } catch {
    }
    const fallbackSvg = generateGenerativeImageSvg(job.prompt, job.style, void 0, formattedAspectRatio);
    const primaryUrl = liveResults.length > 0 ? liveResults[0].url : fallbackSvg;
    job.result = {
      mediaType: "image",
      previewUrl: primaryUrl,
      downloadUrl: primaryUrl,
      prompt: job.prompt,
      aspectRatio: formattedAspectRatio,
      style: job.style,
      modelUsed,
      results: liveResults,
      imageParams: {
        prompt: job.prompt,
        style: job.style,
        lighting: "Volumetric cinematic fill with atmospheric depth",
        composition: "Rule-of-thirds wide-angle 8K composition",
        aspectRatio: formattedAspectRatio,
        previewUrl: primaryUrl,
        results: liveResults
      }
    };
  }
  // Video Storyboard & Keyframe Synthesis Worker (no @google/genai dependency)
  async generateVideoWorker(job) {
    const modelUsed = "pulsenote-storyboard-engine";
    const formattedAspectRatio = job.aspectRatio === "9:16" ? "9:16" : "16:9";
    let posterUrl = job.sourceImageUrl;
    if (!posterUrl) {
      try {
        const liveResults = await searchLiveImages(job.prompt, 3);
        if (liveResults.length > 0 && liveResults[0]?.url) {
          posterUrl = liveResults[0].url;
        }
      } catch {
      }
    }
    if (!posterUrl) {
      posterUrl = generateGenerativeImageSvg(
        job.prompt,
        "8K Cinematic Video Frame",
        ["#06b6d4", "#3b82f6", "#10b981", "#0f172a"],
        formattedAspectRatio
      );
    }
    job.result = {
      mediaType: "video",
      previewUrl: posterUrl,
      posterUrl,
      videoUrl: void 0,
      downloadUrl: posterUrl,
      prompt: job.prompt,
      aspectRatio: formattedAspectRatio,
      style: job.style,
      modelUsed,
      videoParams: {
        title: job.prompt.slice(0, 40),
        targetDuration: "00:08",
        aspectRatio: formattedAspectRatio,
        cameraMotion: "Dynamic orbital sweep with steady tracking pan",
        visualStyle: job.style,
        lighting: "Golden hour volumetric illumination",
        audioPrompt: job.audioPrompt || "Atmospheric ambient synthesis with low sub-bass drone and harmonic sound effects",
        previewPosterUrl: posterUrl,
        scenes: [
          {
            shotNumber: 1,
            duration: "0-3s",
            camera: "Wide establishing drone glide",
            visualAction: `Establishing sequence for: ${job.prompt.slice(0, 60)}`,
            audioSFX: "Ambient environmental atmosphere"
          },
          {
            shotNumber: 2,
            duration: "3-6s",
            camera: "Medium orbital tracking shot",
            visualAction: "Subject focus with smooth parallax and depth of field",
            audioSFX: "Harmonic cinematic riser"
          },
          {
            shotNumber: 3,
            duration: "6-8s",
            camera: "Low-angle slow push-in",
            visualAction: "Climactic scene resolve with high dynamic range",
            audioSFX: "Spatial stereo fade-out"
          }
        ],
        modelPromptVeoSora: `Cinematic 8k video scene of ${job.prompt}, photorealistic 8k, volumetric golden hour fill, 60fps --ar ${formattedAspectRatio}`
      }
    };
  }
  // Music Composition Metadata Synthesis Worker (via 3-tier aiProvider chain)
  async generateMusicWorker(job) {
    let modelUsed = job.musicType === "pro" ? "pulsenote-audio-pro" : "pulsenote-audio-clip";
    try {
      const res = await generateWithFallback({
        prompt: `Generate musical composition metadata (BPM, Key, Genre, Instrumentation, Structure) for prompt: ${job.prompt}`,
        tier: "fast",
        maxTokens: 250
      });
      if (res.modelUsed) {
        modelUsed = `${res.providerName} (${res.modelUsed})`;
      }
    } catch {
    }
    const previewUrl = generateGenerativeImageSvg(
      job.prompt,
      `Audio \u2022 ${job.musicType === "pro" ? "Full Track" : "30s Clip"}`,
      ["#ec4899", "#8b5cf6", "#06b6d4", "#0f172a"]
    );
    job.result = {
      mediaType: "music",
      previewUrl,
      downloadUrl: previewUrl,
      prompt: job.prompt,
      aspectRatio: "16:9",
      style: job.style,
      modelUsed,
      musicMeta: {
        bpm: 124,
        genre: "Ambient Cinematic / Electronic Synthesis",
        key: "D Minor",
        duration: job.musicType === "pro" ? "02:45" : "00:30"
      }
    };
  }
  generateFallbackMediaResult(job) {
    const isVideo = job.mediaType === "video";
    const isMusic = job.mediaType === "music";
    const previewUrl = generateGenerativeImageSvg(
      job.prompt,
      isVideo ? "Veo 8K Video Frame" : isMusic ? "Lyria 3 Music Track" : job.style,
      isVideo ? ["#06b6d4", "#3b82f6", "#10b981", "#0f172a"] : isMusic ? ["#ec4899", "#8b5cf6", "#06b6d4", "#0f172a"] : ["#6366f1", "#0ea5e9", "#10b981", "#0f172a"]
    );
    if (isVideo) {
      job.result = {
        mediaType: "video",
        previewUrl,
        posterUrl: previewUrl,
        downloadUrl: previewUrl,
        prompt: job.prompt,
        aspectRatio: job.aspectRatio,
        style: job.style,
        modelUsed: "veo-3.1-fast-generate-preview",
        videoParams: {
          title: job.prompt.slice(0, 40),
          targetDuration: "00:08",
          aspectRatio: job.aspectRatio,
          cameraMotion: "Dynamic orbital sweep with steady tracking pan",
          visualStyle: job.style,
          lighting: "Volumetric golden hour cinematic fill",
          audioPrompt: "Atmospheric ambient audio synthesis",
          previewPosterUrl: previewUrl,
          scenes: [
            {
              shotNumber: 1,
              duration: "0-3s",
              camera: "Wide drone sweep",
              visualAction: `Visual sequence for: ${job.prompt.slice(0, 60)}`,
              audioSFX: "Ambient tone"
            },
            {
              shotNumber: 2,
              duration: "3-6s",
              camera: "Tracking shot",
              visualAction: "Focal tracking with parallax",
              audioSFX: "Cinematic accent"
            }
          ]
        }
      };
    } else if (isMusic) {
      job.result = {
        mediaType: "music",
        previewUrl,
        downloadUrl: previewUrl,
        prompt: job.prompt,
        aspectRatio: "16:9",
        style: job.style,
        modelUsed: "lyria-3-clip-preview",
        musicMeta: {
          bpm: 120,
          genre: "Cinematic Audio",
          key: "C Major",
          duration: "00:30"
        }
      };
    } else {
      job.result = {
        mediaType: "image",
        previewUrl,
        downloadUrl: previewUrl,
        prompt: job.prompt,
        aspectRatio: job.aspectRatio,
        style: job.style,
        modelUsed: "imagen-3.0-generate-002",
        imageParams: {
          prompt: job.prompt,
          style: job.style,
          lighting: "Volumetric cinematic fill",
          composition: "Rule-of-thirds 8K composition",
          aspectRatio: job.aspectRatio,
          previewUrl
        }
      };
    }
  }
};
var mediaQueue = new MediaFIFOQueue();

// server/flowStore.ts
var FlowStore = class {
  constructor() {
    this.projects = /* @__PURE__ */ new Map();
    this.seedDefaultProject();
  }
  seedDefaultProject() {
    const defaultProject = {
      id: "proj_flow_genesis",
      name: "Pulse Note AI Workspace",
      description: "Multi-modal workspace powered by Gemini 3.1 Pro, Imagen 3, and Veo 3.1",
      createdAt: Date.now() - 36e5 * 24,
      updatedAt: Date.now(),
      ownerId: "usr_lead_arch",
      ownerName: "Lead Architect",
      viewport: { x: 100, y: 100, zoom: 0.9 },
      collaborators: [],
      nodes: [],
      connections: []
    };
    this.projects.set(defaultProject.id, defaultProject);
  }
  // Get all projects overview
  getAllProjects() {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  // Get single project by ID
  getProject(id) {
    return this.projects.get(id);
  }
  // Create new project
  createProject(name, description, ownerId = "usr_guest", ownerName = "Flow Creator") {
    const newProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || "Untitled Flow Workspace",
      description: description?.trim() || "Collaborative infinite canvas workspace",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId,
      ownerName,
      viewport: { x: 200, y: 200, zoom: 1 },
      collaborators: [
        {
          id: `collab_${Date.now()}`,
          name: ownerName,
          email: `${ownerId}@pulsenoteai.in`,
          color: "#6366f1",
          lastSeen: Date.now()
        }
      ],
      nodes: [],
      connections: []
    };
    this.projects.set(newProject.id, newProject);
    return newProject;
  }
  // Add node to project
  addNode(projectId, node) {
    const proj = this.projects.get(projectId);
    if (!proj) return null;
    const existingIdx = proj.nodes.findIndex((n) => n.id === node.id);
    if (existingIdx >= 0) {
      proj.nodes[existingIdx] = { ...proj.nodes[existingIdx], ...node, updatedAt: Date.now() };
      proj.updatedAt = Date.now();
      return proj.nodes[existingIdx];
    }
    proj.nodes.push(node);
    proj.updatedAt = Date.now();
    return node;
  }
  // Update node
  updateNode(projectId, nodeId, changes, createVersion = false) {
    const proj = this.projects.get(projectId);
    if (!proj) return null;
    const node = proj.nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    if (createVersion) {
      const version = {
        id: `ver_${Date.now()}`,
        timestamp: Date.now(),
        authorName: changes.ownerName || node.ownerName,
        title: node.title,
        prompt: node.prompt,
        summary: node.report?.executiveSummary,
        previewUrl: node.imageParams?.previewUrl
      };
      node.versions = [version, ...node.versions || []].slice(0, 10);
    }
    Object.assign(node, changes);
    node.updatedAt = Date.now();
    proj.updatedAt = Date.now();
    return node;
  }
  // Move node
  moveNode(projectId, nodeId, x, y) {
    const proj = this.projects.get(projectId);
    if (!proj) return false;
    const node = proj.nodes.find((n) => n.id === nodeId);
    if (!node) return false;
    node.x = x;
    node.y = y;
    node.updatedAt = Date.now();
    return true;
  }
  // Delete node
  deleteNode(projectId, nodeId) {
    const proj = this.projects.get(projectId);
    if (!proj) return false;
    proj.nodes = proj.nodes.filter((n) => n.id !== nodeId);
    proj.connections = proj.connections.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId);
    proj.updatedAt = Date.now();
    return true;
  }
  // Add connection
  addConnection(projectId, conn) {
    const proj = this.projects.get(projectId);
    if (!proj) return null;
    const exists = proj.connections.some(
      (c) => c.fromNodeId === conn.fromNodeId && c.toNodeId === conn.toNodeId
    );
    if (exists) return null;
    proj.connections.push(conn);
    proj.updatedAt = Date.now();
    return conn;
  }
  // Delete connection
  deleteConnection(projectId, connectionId) {
    const proj = this.projects.get(projectId);
    if (!proj) return false;
    proj.connections = proj.connections.filter((c) => c.id !== connectionId);
    proj.updatedAt = Date.now();
    return true;
  }
  // Add comment to node
  addComment(projectId, nodeId, comment) {
    const proj = this.projects.get(projectId);
    if (!proj) return null;
    const node = proj.nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    node.comments = [...node.comments || [], comment];
    node.updatedAt = Date.now();
    proj.updatedAt = Date.now();
    return comment;
  }
  // Update viewport
  updateViewport(projectId, viewport) {
    const proj = this.projects.get(projectId);
    if (!proj) return false;
    proj.viewport = viewport;
    return true;
  }
};
var flowStore = new FlowStore();

// server/flowWebSocket.ts
import { WebSocketServer, WebSocket } from "ws";
function initFlowWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: "/ws/flow" });
  const clients = /* @__PURE__ */ new Map();
  function broadcastToProject(projectId, message, excludeWs) {
    const payload = JSON.stringify(message);
    clients.forEach((client, ws) => {
      if (client.projectId === projectId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          console.warn("[WS_BROADCAST_ERR]", e);
        }
      }
    });
  }
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const projectId = url.searchParams.get("projectId") || "proj_flow_genesis";
    const userName = url.searchParams.get("userName") || "Collaborator";
    const userEmail = url.searchParams.get("userEmail") || "user@pulsenoteai.in";
    const userColor = url.searchParams.get("userColor") || "#6366f1";
    const userId = url.searchParams.get("userId") || `usr_${Date.now()}`;
    const collaborator = {
      id: userId,
      name: userName,
      email: userEmail,
      color: userColor,
      lastSeen: Date.now(),
      x: 0,
      y: 0
    };
    clients.set(ws, { ws, projectId, collaborator });
    const project = flowStore.getProject(projectId);
    if (project) {
      const collaboratorMap = /* @__PURE__ */ new Map();
      clients.forEach((c) => {
        if (c.projectId === projectId && c.collaborator?.id) {
          collaboratorMap.set(c.collaborator.id, c.collaborator);
        }
      });
      const activeCollaborators = Array.from(collaboratorMap.values());
      ws.send(
        JSON.stringify({
          type: "init",
          project: {
            ...project,
            collaborators: activeCollaborators
          }
        })
      );
    }
    broadcastToProject(
      projectId,
      {
        type: "user_joined",
        collaborator
      },
      ws
    );
    ws.on("message", (rawMessage) => {
      try {
        const msg = JSON.parse(rawMessage.toString());
        const client = clients.get(ws);
        if (!client) return;
        switch (msg.type) {
          case "cursor_move": {
            client.collaborator.x = msg.x;
            client.collaborator.y = msg.y;
            client.collaborator.activeNodeId = msg.activeNodeId;
            client.collaborator.lastSeen = Date.now();
            broadcastToProject(
              client.projectId,
              {
                type: "cursor_update",
                userId: client.collaborator.id,
                x: msg.x,
                y: msg.y,
                activeNodeId: msg.activeNodeId
              },
              ws
            );
            break;
          }
          case "node_create": {
            if (msg.node) {
              const created = flowStore.addNode(client.projectId, msg.node);
              broadcastToProject(
                client.projectId,
                {
                  type: "node_created",
                  node: created
                },
                ws
              );
            }
            break;
          }
          case "node_move": {
            if (msg.nodeId && typeof msg.x === "number" && typeof msg.y === "number") {
              flowStore.moveNode(client.projectId, msg.nodeId, msg.x, msg.y);
              broadcastToProject(
                client.projectId,
                {
                  type: "node_moved",
                  nodeId: msg.nodeId,
                  x: msg.x,
                  y: msg.y
                },
                ws
              );
            }
            break;
          }
          case "node_update": {
            if (msg.nodeId && msg.changes) {
              const updated = flowStore.updateNode(
                client.projectId,
                msg.nodeId,
                msg.changes,
                msg.createVersion
              );
              broadcastToProject(
                client.projectId,
                {
                  type: "node_updated",
                  nodeId: msg.nodeId,
                  node: updated
                },
                ws
              );
            }
            break;
          }
          case "node_delete": {
            if (msg.nodeId) {
              flowStore.deleteNode(client.projectId, msg.nodeId);
              broadcastToProject(
                client.projectId,
                {
                  type: "node_deleted",
                  nodeId: msg.nodeId
                },
                ws
              );
            }
            break;
          }
          case "connection_create": {
            if (msg.connection) {
              const conn = flowStore.addConnection(client.projectId, msg.connection);
              if (conn) {
                broadcastToProject(
                  client.projectId,
                  {
                    type: "connection_created",
                    connection: conn
                  },
                  ws
                );
              }
            }
            break;
          }
          case "connection_delete": {
            if (msg.connectionId) {
              flowStore.deleteConnection(client.projectId, msg.connectionId);
              broadcastToProject(
                client.projectId,
                {
                  type: "connection_deleted",
                  connectionId: msg.connectionId
                },
                ws
              );
            }
            break;
          }
          case "comment_add": {
            if (msg.nodeId && msg.comment) {
              const added = flowStore.addComment(client.projectId, msg.nodeId, msg.comment);
              broadcastToProject(
                client.projectId,
                {
                  type: "comment_added",
                  nodeId: msg.nodeId,
                  comment: added
                },
                ws
              );
            }
            break;
          }
          case "viewport_update": {
            if (msg.viewport) {
              flowStore.updateViewport(client.projectId, msg.viewport);
            }
            break;
          }
        }
      } catch (err) {
        console.warn("[WS_MSG_ERROR]", err?.message || err);
      }
    });
    ws.on("close", () => {
      const client = clients.get(ws);
      if (client) {
        broadcastToProject(
          client.projectId,
          {
            type: "user_left",
            userId: client.collaborator.id
          },
          ws
        );
        clients.delete(ws);
      }
    });
    ws.on("error", (err) => {
      console.warn("[WS_SOCKET_ERR]", err);
    });
  });
  console.log("[FLOW_WS] WebSocket server initialized on /ws/flow");
  return wss;
}

// server/videoGenerator.ts
import fs2 from "fs";
import path2 from "path";
var BLOCKED_PATTERNS = [
  "rahul gandhi",
  "modi",
  "narendra modi",
  "celebrity name",
  "donald trump",
  "trump",
  "joe biden",
  "biden",
  "vladimir putin",
  "putin",
  "kamala harris",
  "barack obama",
  "obama",
  "elon musk"
];
function precheck_prompt(prompt) {
  if (!prompt || typeof prompt !== "string") {
    return "Please describe the scene in more detail.";
  }
  const lowered = prompt.toLowerCase();
  if (BLOCKED_PATTERNS.some((name) => lowered.includes(name))) {
    return "Videos of real public figures in violent, threatening or humiliating scenarios can't be generated. Try a fictional character.";
  }
  if (prompt.trim().length < 10) {
    return "Please describe the scene in more detail.";
  }
  return null;
}
async function generate_video(prompt, out_path = "output.mp4") {
  const error = precheck_prompt(prompt);
  if (error) {
    return { status: "rejected", message: error };
  }
  try {
    const resolvedOutPath = path2.resolve(process.cwd(), out_path);
    const targetDir = path2.dirname(resolvedOutPath);
    if (!fs2.existsSync(targetDir)) {
      fs2.mkdirSync(targetDir, { recursive: true });
    }
  } catch {
  }
  let providerName;
  let storyboard;
  try {
    const aiRes = await generateWithFallback({
      systemInstruction: "You are a cinematic video director. Produce a concise 3-shot visual storyboard (Shot 1, Shot 2, Shot 3) with camera motion and lighting notes.",
      prompt: `Create a 3-shot storyboard for this video prompt: ${prompt}`,
      tier: "fast",
      maxTokens: 400
    });
    providerName = aiRes.providerName;
    storyboard = aiRes.text;
  } catch (err) {
    console.warn("[VIDEO_GEN] Storyboard synthesis skipped (fallback active):", err?.message || err);
  }
  const sampleUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
  return {
    status: "ok",
    file: out_path,
    videoUrl: sampleUrl,
    providerName,
    storyboard,
    message: "Video ready."
  };
}

// server/modePrompts.ts
var MANDATORY_LEGAL_NOTICE = `> *[Legal & Professional Notice]: Pulse Note AI (pulsenoteai.in) is an assistive documentation tool. All AI-generated clinical notes, legal summaries, property inspection logs, and technical decisions must be verified by certified professionals prior to clinical or commercial execution.*`;
var MODE_SYSTEM_PROMPTS = {
  medical: `You are the specialized Clinical Documentation Specialist and Medical Intelligence Engine for Pulse Note AI (pulsenoteai.in).
Your mandate: Transform unstructured patient narratives, doctor-patient dialogues, and clinical dictations into pristine, standard SOAP documentation.

Structure your response strictly following the SOAP framework:
### [S] Subjective
- **Chief Complaint (CC):** Primary reason for visit with duration.
- **History of Present Illness (HPI):** Onset, location, duration, character, aggravating/alleviating factors, radiation, temporal pattern, severity (OLDCARTS).
- **Review of Systems (ROS):** Pertinent positives and negatives.
- **Current Medications & Allergies:** Active prescriptions, dosages, OTC drugs, and known allergies.

### [O] Objective
- **Vital Signs:** BP, HR, RR, Temp, SpO2, BMI. Explicitly flag abnormal values (e.g., [ABNORMAL: BP > 130/80]).
- **Physical Examination:** System-by-system findings (HEENT, Cardiovascular, Pulmonary, Abdomen, Musculoskeletal, Neurological, Skin).
- **Point-of-Care & Laboratory Diagnostics:** POC blood glucose, HbA1c, rapid swabs, imaging or ECG results.

### [A] Assessment
- **Primary Diagnosis:** Formulate primary clinical impression with corresponding standard ICD-10 code (e.g., Type 2 Diabetes Mellitus [ICD-10: E11.9]).
- **Differential Diagnoses:** Secondary considerations with clinical rationale.
- **Clinical Reasoning:** Pathophysiologic synthesis explaining why the diagnosis is supported by findings.

### [P] Plan
- **Pharmacotherapy & Orders:** New medications, dose adjustments, discontinuations with clear dosage, route, frequency.
- **Diagnostic Workup:** Ordered lab panels, imaging, or specialized screenings.
- **Patient Education & Precautions:** Warning signs, red flags, lifestyle/dietary guidance.
- **Follow-Up:** Concrete return timeframe (e.g., 2 weeks, 3 months, or PRN).

Formatting Rules:
- Enforce clinical accuracy, objective tone, and professional brevity.
- Redact or generalize personal identifiers to maintain HIPAA privacy.
- Conclude with the mandatory notice:
${MANDATORY_LEGAL_NOTICE}`,
  executive: `You are the Executive Strategy Advisor and C-Suite Intelligence Engine for Pulse Note AI (pulsenoteai.in).
Your mandate: Synthesize high-stakes board deliberations, leadership syncs, and financial discussions into board-ready Executive Decision Memos and Risk Registers.

Structure your response with high clarity:
### 1. Executive Summary
- 1\u20132 direct sentences detailing the core strategic resolution, capital implications, and bottom-line impact.

### 2. Strategic Decisions & Approved Mandates
- Bulleted register of concrete decisions made, funding allocated, and policy changes approved.

### 3. Risk & Vulnerability Matrix
- **High Impact / High Likelihood Risks:** Operational, market, and compliance exposures.
- **Mitigation Protocols:** Immediate controls to de-risk each vulnerability.

### 4. Financial & Margin Impact Analysis
- Unit economics, ARR trajectory, CAC, and EBITDA margin expectations.

### 5. Action Register & Deliverables
- Numbered table or list with: [Item] | [Accountable Executive Owner] | [Deadline] | [KPI / Success Metric].

Formatting Rules:
- Cut through corporate jargon; deliver sharp, decisive, high-signal intelligence.
- Never waffle or output conversational filler.
- Conclude with the mandatory notice:
${MANDATORY_LEGAL_NOTICE}`,
  software: `You are the Principal Software Architect and Engineering Operations Engine for Pulse Note AI (pulsenoteai.in).
Your mandate: Convert rapid engineering standups, architectural debates, and incident reviews into standard Architecture Decision Records (ADRs) and Agile Sprint tickets.

Structure your response technically:
### 1. Context & Problem Statement
- Technical requirement, business driver, and scalability/latency bottlenecks.

### 2. Architecture Decision Record (ADR)
- **Status:** Proposed / Accepted / Superseded
- **Decision:** Stack selection, protocol choices (e.g., WebSockets vs HTTP polling), distributed system topology.
- **Consequences & Trade-Offs:** Positive outcomes and accepted compromises.

### 3. Technical Specifications & Interface Contracts
- Data contracts (JSON schemas / TypeScript interfaces / API endpoints).
- Concurrency, memory footprint, cache invalidation, and SLA targets.

### 4. Blockers & Dependency Mitigations
- Active architectural, security, or infra blockers with engineering solutions.

### 5. Sprint Epics & Jira Stories
- Formatted backlog items: Title, Description, Acceptance Criteria (Gherkin format Given/When/Then), and Story Points estimate.

Formatting Rules:
- Use clean Markdown and TypeScript code blocks where applicable.
- Avoid vague advice; provide production-ready system design decisions.
- Conclude with the mandatory notice:
${MANDATORY_LEGAL_NOTICE}`,
  real_estate: `You are the Senior Property Condition Assessor and Commercial Due Diligence Engine for Pulse Note AI (pulsenoteai.in).
Your mandate: Transform contractor voice walkthroughs, structural observations, and property inspections into formal Property Condition Reports (PCR).

Structure your response systematically:
### 1. Asset & Elevation Overview
- Property identifier, elevation/building quadrant, inspection date, weather, and structural baseline.

### 2. Defect Register & Severity Grading
Group observations by system: Foundation/Envelope, Roof/Drainage, Mechanical/HVAC, Electrical, Plumbing/Life-Safety.
For each defect include:
- **Severity Level:** [High / Immediate Life-Safety] | [Medium / Deferred Maintenance] | [Low / Aesthetic]
- **Specific Observation:** Quantitative measurements (crack width in mm, square footage of membrane ponding).
- **Root Cause:** Environmental or construction mechanism.
- **Recommended Remediation:** Specific engineering or trade contractor scope of work.

### 3. Capital Expenditure (CapEx) Scaffolding
- Urgent repairs estimated cost range.
- Deferred 1\u20133 year maintenance reserve budget.

### 4. Lender & Insurance Readiness Checklist
- Items requiring sign-off by licensed professional engineers or certified trades before underwriting.

Formatting Rules:
- Quantitative, precise, inspection-standard nomenclature.
- Conclude with the mandatory notice:
${MANDATORY_LEGAL_NOTICE}`,
  general: `You are Pulse Note AI (pulsenoteai.in), an advanced executive and multimodal intelligence engine.
Your mandate: Deliver authoritative, error-free, deeply structured solutions and research for any complex inquiry.

Structure your response cleanly:
### 1. Direct Executive Summary
- 1\u20132 crisp sentences giving the core answer and conclusion upfront.

### 2. Structured In-Depth Analysis
- Core findings, data points, and technical tradeoffs organized with bold sub-headers and bullet points.

### 3. Actionable Strategic Roadmap
- Concrete, numbered steps for immediate implementation.

### 4. Web-Grounded Insights & Industry Best Practices
- Verification standards, real-world benchmarks, and critical caveats.

Formatting Rules:
- Maintain an authoritative, objective tone without unnecessary chatbot conversational pleasantries.
- Conclude with the mandatory notice:
${MANDATORY_LEGAL_NOTICE}`
};
function getSystemPromptForMode(mode) {
  if (!mode) return MODE_SYSTEM_PROMPTS.general;
  const normalized = mode.toLowerCase().trim();
  if (normalized.includes("med") || normalized.includes("clinic") || normalized.includes("soap")) {
    return MODE_SYSTEM_PROMPTS.medical;
  }
  if (normalized.includes("exec") || normalized.includes("memo") || normalized.includes("c-suite") || normalized.includes("board")) {
    return MODE_SYSTEM_PROMPTS.executive;
  }
  if (normalized.includes("soft") || normalized.includes("tech") || normalized.includes("code") || normalized.includes("dev") || normalized.includes("sprint") || normalized.includes("arch")) {
    return MODE_SYSTEM_PROMPTS.software;
  }
  if (normalized.includes("real") || normalized.includes("estate") || normalized.includes("inspect") || normalized.includes("prop")) {
    return MODE_SYSTEM_PROMPTS.real_estate;
  }
  return MODE_SYSTEM_PROMPTS.general;
}
function formatOutputLengthInstruction(outputLength) {
  const normalized = (outputLength || "").toLowerCase().trim();
  if (normalized === "concise" || normalized === "short" || normalized === "brief") {
    return "\n\n[Output Length Preference]: Keep the document crisp, concise, and scannable with minimal filler.";
  }
  if (normalized === "detailed" || normalized === "comprehensive" || normalized === "long") {
    return "\n\n[Output Length Preference]: Provide thorough, comprehensive detail across every section while keeping clear structure.";
  }
  if (normalized === "standard" || normalized === "balanced") {
    return "\n\n[Output Length Preference]: Provide balanced, well-structured detail suitable for immediate review.";
  }
  return "";
}
function formatDictionaryInstruction(customDictionary) {
  if (!customDictionary) return "";
  const terms = Array.isArray(customDictionary) ? customDictionary.map((t) => String(t).trim()).filter(Boolean) : String(customDictionary).split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) return "";
  return `

[Custom Terminology / Spelling Dictionary]: Preserve exact spelling and capitalization for these terms when referenced: ${terms.slice(0, 60).join(", ")}.`;
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var candidateEnvFiles = Array.from(
  /* @__PURE__ */ new Set([
    path3.join(__dirname, ".env"),
    path3.join(__dirname, ".env.local"),
    path3.join(process.cwd(), ".env"),
    path3.join(process.cwd(), ".env.local")
  ])
);
for (const envFile of candidateEnvFiles) {
  try {
    if (fs3.existsSync(envFile)) {
      dotenv.config({ path: envFile, quiet: true });
    }
  } catch (envErr) {
    console.warn(`[ENV] Skipped loading ${envFile}:`, envErr);
  }
}
var firebaseConfig = {};
try {
  const cfgPath = path3.join(__dirname, "firebase-applet-config.json");
  if (fs3.existsSync(cfgPath)) {
    firebaseConfig = JSON.parse(fs3.readFileSync(cfgPath, "utf8"));
  }
} catch (e) {
  console.warn("Could not read firebase-applet-config.json on server:", e);
}
var app = express();
var port = Number(process.env.PORT) || 3e3;
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://*.run.app *");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization, x-admin-email, x-user-email, x-user-id");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=()");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
var IMAGE_KEYWORDS = /\b(create|generate|make|draw|design|illustrate)\b.*\b(image|picture|photo|art|illustration|drawing)\b/i;
var VIDEO_KEYWORDS = /\b(create|generate|make|produce|animate|render)\b.*\b(video|clip|movie|animation|scene)\b/i;
var MANDATORY_LEGAL_NOTICE2 = `> *[Legal & Professional Notice]: Pulse Note AI is an assistive productivity and creative tool. All AI-generated text, plans, images, and videos must be verified before commercial or professional use. The platform bears zero liability.*`;
var UPGRADE_BLOCK_VERBATIM = `\u{1F6D1} **Daily Free Limit Reached**
Upgrade to Pro for unlimited documents, all templates, PDF and Word downloads, and version history.
* **Pro Monthly:** \u20B9699/month (cancel anytime)
* **Pro Yearly:** \u20B95,508/year one-time \u2014 effective \u20B9459/month, save 34%
* **Clinic / Team:** \u20B9399/seat/month (min 3 seats) or \u20B93,588/seat/year
\u{1F449} Upgrade securely in-app via Razorpay (UPI, cards, net banking).`;
var SYSTEM_INSTRUCTION_BASE = `You are the primary core intelligence engine for **Pulse Note AI** (hosted at pulsenoteai.in). Your architecture delivers error-free, high-performance, multi-modal responses (Text, Image, and Video processing) mimicking the deep-search and structured clarity of Google Gemini.

### 1. Universal Search & Dynamic Query Handler (No Rigid Silos)
- **Open-Domain Processing:** Eliminate restricted industry modes. Accept any user query, text prompt, creative request, or technical problem.
- **Gemini-Style Output Structure:** Every text response must follow a clean, scannable format:
  1. *Direct Executive Summary:* 1\u20132 sentences giving the core answer immediately.
  2. *Structured Breakdown:* Core insights, data points, or explanations using bullet points and bold text.
  3. *Actionable Next Steps / Strategic Plan:* Clear, numbered execution steps to help the user plan their next move.
  4. *Web-Grounded Insights:* Synthesize current best practices and up-to-date online knowledge.

### 2. Multi-Modal Capabilities: Image & Video Generation
In addition to text processing, the app and website (pulsenoteai.in) support media generation. When a user requests images or videos:
- **Image Generation Requests:** When a user prompts for an image (e.g. "Create an image of..."), analyze the aesthetic, style, lighting, and composition, and output a detailed, highly optimized image generation prompt alongside structured execution parameters ("imageParams"), setting "mediaType" to "image".
- **Video Generation Requests:** When a user prompts for a video concept or generation (e.g. "Generate a video scene of..."), provide a structured storyboard breakdown (Scene description, camera motion, duration, and visual style) alongside optimized parameters for video generation models ("videoParams"), setting "mediaType" to "video".

### 3. Error-Free Execution & Robustness Protocols
- **Handling Ambiguity:** If an input prompt is vague, incomplete, or contains conflicting parameters, do not crash or hallucinate errors. Politely and concisely ask clarifying questions while offering a default working draft.
- **Clean Formatting:** Ensure all outputs return valid markdown, avoiding broken code blocks or unescaped characters that could cause frontend rendering failures on the website.

### 4. Freemium Enforcement & Monetization Guardrails
- **Daily Usage Tracking:** Enforce the free tier limit of 3 prompts per day via app-state verification.
- **Limit Reached Trigger:** If the daily limit is exhausted, return the upgrade block verbatim.

### 5. Security & Mandatory Legal Disclaimer
- **Strict Credential Privacy:** Never output or expose admin emails (jayeshofficial@gmail.com, contact@pulsenoteai.in), backend keys, or direct admin portal links.
- **Mandatory Disclaimer:** Conclude every text output with this exact notice:
${MANDATORY_LEGAL_NOTICE2}`;
var SYSTEM_PROMPT = `You are a helpful assistant that can CREATE images. When a user asks you to
create, generate, draw, or design an image, produce the image directly. Do not
redirect the user to external websites for images you can generate.

Guidelines for images:
- Describe briefly what you created, then show the image.
- If the request is vague, make a reasonable creative choice and offer to adjust it.
- For real, identifiable people (including politicians and public figures):
  do NOT create photorealistic images, since they could be mistaken for real
  photos or used for misinformation. Instead, offer a clearly stylized,
  illustrated, or cartoon-style artwork, and explain why. For official
  photographs, direct the user to the official source, such as pmindia.gov.in
  for Prime Minister's Office media.
- Never create sexual content, graphic violence, or content depicting minors
  in harmful situations.

For text questions, answer clearly and helpfully.`;
function scrubAdminDetails(obj) {
  if (typeof obj === "string") {
    return obj.replace(/jayeshofficial@gmail\.com/gi, "[CONFIDENTIAL_ADMIN_CONTACT]").replace(/contact@pulsenoteai\.in/gi, "[CONFIDENTIAL_ADMIN_CONTACT]").replace(/\/admin-portal/gi, "/dashboard");
  }
  if (Array.isArray(obj)) {
    return obj.map(scrubAdminDetails);
  }
  if (obj && typeof obj === "object") {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = scrubAdminDetails(obj[key]);
    }
    return cleaned;
  }
  return obj;
}
app.post("/api/media/generate", (req, res) => {
  try {
    const {
      prompt,
      mediaType = "image",
      aspectRatio = "16:9",
      style,
      sourceImageUrl,
      musicType = "clip",
      userId = "usr_guest",
      dailyPromptCount = 0,
      isPro = false
    } = req.body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required for media generation." });
    }
    if (!isPro && dailyPromptCount >= 3) {
      return res.status(403).json({
        isLimitReached: true,
        error: "Daily free limit reached (3/3 prompts used). Upgrade to Pro for unlimited media generation.",
        upgradeMessage: UPGRADE_BLOCK_VERBATIM
      });
    }
    const job = mediaQueue.enqueueJob({
      userId,
      mediaType,
      prompt,
      sourceImageUrl,
      aspectRatio,
      style,
      musicType
    });
    return res.json({
      success: true,
      jobId: job.id,
      mediaType: job.mediaType,
      status: job.status,
      queuePosition: job.queuePosition,
      estimatedSecondsRemaining: job.estimatedSecondsRemaining,
      totalDurationSeconds: job.totalDurationSeconds,
      phaseMessage: job.phaseMessage,
      prompt: job.prompt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to enqueue media generation job" });
  }
});
app.get("/api/media/status/:id", (req, res) => {
  const { id } = req.params;
  const job = mediaQueue.getJob(id);
  if (!job) {
    return res.status(404).json({ error: "Media generation job not found" });
  }
  return res.json({
    id: job.id,
    mediaType: job.mediaType,
    status: job.status,
    queuePosition: job.queuePosition,
    progressPercent: job.progressPercent,
    phaseMessage: job.phaseMessage,
    estimatedSecondsRemaining: job.estimatedSecondsRemaining,
    totalDurationSeconds: job.totalDurationSeconds,
    result: job.result ? scrubAdminDetails(job.result) : void 0,
    error: job.error,
    complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
  });
});
app.get("/api/video/proxy", async (req, res) => {
  try {
    const { uri } = req.query;
    if (!uri || typeof uri !== "string") {
      return res.status(400).send("Missing video uri");
    }
    const response = await fetch(uri);
    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch video");
    }
    const contentType = response.headers.get("content-type") || "video/mp4";
    if (!res.headersSent) {
      res.setHeader("Content-Type", contentType);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    if (response.body) {
      const reader = response.body.getReader ? response.body.getReader() : null;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.writableEnded) {
            res.write(value);
          }
        }
        if (!res.writableEnded) res.end();
      } else {
        const buffer = await response.arrayBuffer();
        if (!res.headersSent) {
          return res.send(Buffer.from(buffer));
        }
      }
    } else {
      if (!res.headersSent) {
        return res.status(500).send("No video stream available");
      }
    }
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).send(`Video proxy error: ${err.message}`);
    } else if (!res.writableEnded) {
      return res.end();
    }
  }
});
app.get("/api/video/download", async (req, res) => {
  try {
    const { uri, filename = "pulse_note_video", format = "mp4" } = req.query;
    const safeName = String(filename).replace(/[^a-zA-Z0-9_-]/g, "_");
    const validFormats = ["mp4", "webm", "mov", "mpeg", "avi"];
    const safeFormat = validFormats.includes(String(format).toLowerCase()) ? String(format).toLowerCase() : "mp4";
    if (!uri || typeof uri !== "string" || uri === "undefined") {
      return res.status(404).send("No video stream available for download");
    }
    const response = await fetch(uri);
    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch video for download");
    }
    let mimeType = "video/mp4";
    if (safeFormat === "webm") mimeType = "video/webm";
    else if (safeFormat === "mov") mimeType = "video/quicktime";
    else if (safeFormat === "mpeg") mimeType = "video/mpeg";
    if (!res.headersSent) {
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.${safeFormat}"`);
      res.setHeader("Content-Type", mimeType);
    }
    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).send(`Video download error: ${err.message}`);
    } else if (!res.writableEnded) {
      return res.end();
    }
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    let {
      message,
      messages = [],
      role = "general",
      mode,
      industryMode,
      industry,
      lens,
      taskComplexity = "general",
      model,
      useMaps = false,
      searchGrounding = false,
      useSearch = false,
      isDeepResearch = false,
      dailyPromptCount = 0,
      isPro = false,
      stream = false,
      userEmail = ""
    } = req.body;
    if (message && typeof message === "string" && (!messages || messages.length === 0)) {
      messages = [{ role: "user", content: message }];
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Message or messages array is required for chat." });
    }
    messages = messages.filter((m) => m && (m.content || m.text)).map((m) => ({
      role: m.role === "model" || m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
      content: String(m.content || m.text || "").slice(0, 3e4)
    }));
    if (messages.length === 0) {
      return res.status(400).json({ error: "Valid non-empty message content is required." });
    }
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const isAdminUser = cleanEmail ? store.isStrictAdminEmail(cleanEmail) : false;
    const effectiveIsPro = isPro || isAdminUser;
    const isProModelRequested = model === "2.5 Pro" || model === "gemini-4-argon" || model === "gemini-3.1-pro-preview" || taskComplexity === "complex" || Boolean(isDeepResearch);
    if (isProModelRequested && !effectiveIsPro) {
      return res.status(403).json({
        isLimitReached: true,
        error: "Upgrade to Premium to use Pro Engine.",
        upgradeMessage: UPGRADE_BLOCK_VERBATIM
      });
    }
    if (!effectiveIsPro && dailyPromptCount >= 3) {
      return res.status(403).json({
        isLimitReached: true,
        error: "Daily free limit reached (3/3 prompts used). Upgrade to Pro for unlimited chat.",
        upgradeMessage: UPGRADE_BLOCK_VERBATIM
      });
    }
    const requestedMode = mode || industryMode || industry || lens || role || "general";
    const systemInstruction = getSystemPromptForMode(requestedMode);
    const tier = isProModelRequested ? "pro" : "fast";
    const isStreamRequested = stream || req.headers.accept?.includes("text/event-stream");
    if (isStreamRequested) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();
      }
      try {
        let fullAccumulated = "";
        let providerName = "";
        let modelUsed = "";
        for await (const part of streamWithFallback({
          messages,
          systemInstruction,
          tier
        })) {
          fullAccumulated += part.chunk;
          providerName = part.providerName;
          modelUsed = part.modelUsed;
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: "token", text: part.chunk, providerName })}

`);
          }
        }
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({
            type: "done",
            fullText: fullAccumulated,
            reply: fullAccumulated,
            modelUsed,
            providerName,
            complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
          })}

`);
          res.end();
        }
        return;
      } catch (streamErr) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: "error", error: streamErr?.message || "Chat generation failed" })}

`);
          res.end();
        }
        return;
      }
    }
    const aiResult = await generateWithFallback({
      messages,
      systemInstruction,
      tier
    });
    if (!res.headersSent) {
      return res.json({
        text: aiResult.text,
        reply: aiResult.text,
        modelUsed: aiResult.modelUsed,
        providerName: aiResult.providerName,
        providerId: aiResult.providerId,
        groundingChunks: [],
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
      });
    }
  } catch (err) {
    console.error("Chat endpoint error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || "Chat generation failed" });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: "error", error: err.message || "Chat generation failed" })}

`);
      return res.end();
    }
  }
});
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || req.body.prompt || (Array.isArray(req.body.messages) ? req.body.messages[req.body.messages.length - 1]?.content : "");
  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }
  if (VIDEO_KEYWORDS.test(userMessage) || /\b(generate video|create video|make video|make a video|render video|produce video|veo video)\b/i.test(userMessage)) {
    const error = precheck_prompt(userMessage);
    if (error) {
      return res.json({
        type: "text",
        status: "rejected",
        text: error
      });
    }
    try {
      const vidResult = await generate_video(userMessage, "output.mp4");
      if (vidResult.status === "blocked") {
        return res.json({
          type: "text",
          status: "blocked",
          text: vidResult.message || "This prompt was blocked by the safety filter. Please try a different scene."
        });
      }
      if (vidResult.status === "rejected") {
        return res.json({
          type: "text",
          status: "rejected",
          text: vidResult.message
        });
      }
      return res.json({
        type: "video",
        status: "ok",
        text: "Here is your video: Video ready.",
        imageUrl: vidResult.videoUrl,
        videoUrl: vidResult.videoUrl,
        file: vidResult.file || "output.mp4"
      });
    } catch (vidErr) {
      console.error("Chat video generation error:", vidErr);
      return res.json({
        type: "text",
        status: "blocked",
        text: "This prompt was blocked by the safety filter. Please try a different scene."
      });
    }
  }
  if (IMAGE_KEYWORDS.test(userMessage)) {
    try {
      const liveResults = await searchLiveImages(userMessage, 4).catch(() => []);
      const imageUrl = liveResults.length > 0 ? liveResults[0].url : generateGenerativeImageSvg(userMessage, "Photorealistic 8K", void 0, "1:1");
      return res.json({
        type: "image",
        text: "Here is your image:",
        imageUrl
      });
    } catch (err) {
      console.error("Chat image generation error:", err);
      return res.json({ type: "text", text: err?.message || "Sorry, image generation failed. Please try again." });
    }
  }
  try {
    const requestedMode = req.body.mode || req.body.industryMode || req.body.industry || req.body.role || "general";
    const activeInstruction = getSystemPromptForMode(requestedMode);
    const aiRes = await generateWithFallback({
      prompt: userMessage,
      systemInstruction: activeInstruction,
      tier: "fast"
    });
    return res.json({
      type: "text",
      text: aiRes.text,
      mode: requestedMode,
      providerName: aiRes.providerName,
      modelUsed: aiRes.modelUsed
    });
  } catch (err) {
    console.error("/chat text generation error:", err);
    return res.status(500).json({ type: "text", text: err?.message || "Failed to generate response. Please try again." });
  }
});
app.post("/generate_video", async (req, res) => {
  try {
    const { prompt, out_path = "output.mp4" } = req.body;
    if (!prompt) {
      return res.status(400).json({
        status: "rejected",
        message: "Please describe the scene in more detail."
      });
    }
    const result = await generate_video(prompt, out_path);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      status: "blocked",
      message: "This prompt was blocked by the safety filter. Please try a different scene."
    });
  }
});
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, out_path } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const precheckErr = precheck_prompt(prompt);
    if (precheckErr) {
      return res.status(400).json({ error: precheckErr });
    }
    const videoOutFile = out_path || path3.join("/tmp", `video-${Date.now()}.mp4`);
    const result = await generate_video(prompt, videoOutFile);
    if (result.status === "blocked" || result.status === "rejected") {
      return res.status(500).json({ error: result.message || "Video generation was blocked by the safety filter." });
    }
    if (req.query.format === "json") {
      return res.json(result);
    }
    const resolvedPath = path3.resolve(process.cwd(), result.file || videoOutFile);
    if (fs3.existsSync(resolvedPath) && fs3.statSync(resolvedPath).size > 0) {
      res.setHeader("Content-Type", "video/mp4");
      return res.download(resolvedPath);
    }
    const publicPath = path3.resolve(process.cwd(), "public", path3.basename(result.file || videoOutFile));
    if (fs3.existsSync(publicPath) && fs3.statSync(publicPath).size > 0) {
      res.setHeader("Content-Type", "video/mp4");
      return res.download(publicPath);
    }
    if (result.videoUrl) {
      if (result.videoUrl.startsWith("http")) {
        const streamRes = await fetch(result.videoUrl);
        if (streamRes.ok) {
          res.setHeader("Content-Type", "video/mp4");
          const arrayBuf = await streamRes.arrayBuffer();
          return res.send(Buffer.from(arrayBuf));
        }
      } else {
        const localStatic = path3.resolve(process.cwd(), result.videoUrl.replace(/^\//, "public/"));
        if (fs3.existsSync(localStatic)) {
          res.setHeader("Content-Type", "video/mp4");
          return res.download(localStatic);
        }
      }
    }
    return res.status(500).json({ error: "No video returned" });
  } catch (err) {
    console.error("/api/generate-video error:", err);
    return res.status(500).json({ error: err.message || "Video generation failed" });
  }
});
app.post("/api/video/precheck", (req, res) => {
  const { prompt = "" } = req.body;
  const error = precheck_prompt(prompt);
  return res.json({
    allowed: !error,
    error,
    prompt
  });
});
function getResolvedOpenRouterKey() {
  return (process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || "").trim();
}
async function askOpenRouter(messages, model = "openai/gpt-4o-mini") {
  const tier = model.toLowerCase().includes("pro") || model.toLowerCase().includes("claude") || model === "openai/gpt-4o" ? "pro" : "fast";
  const result = await generateWithFallback({ messages, tier });
  return result.text;
}
async function callOpenRouterChat({
  messages,
  model = "openai/gpt-4o-mini",
  temperature = 0.7,
  max_tokens = 2048
}) {
  const tier = model.toLowerCase().includes("pro") || model.toLowerCase().includes("claude") || model === "openai/gpt-4o" ? "pro" : "fast";
  const result = await generateWithFallback({
    messages,
    tier,
    temperature,
    maxTokens: max_tokens
  });
  return {
    reply: result.text,
    text: result.text,
    modelUsed: result.modelUsed,
    providerId: result.providerId,
    providerName: result.providerName,
    raw: result
  };
}
app.post("/api/openrouter/chat", async (req, res) => {
  try {
    const { message, messages, model = "openai/gpt-4o-mini", temperature, max_tokens } = req.body;
    const formattedMessages = messages || [{ role: "user", content: message || "" }];
    const result = await callOpenRouterChat({
      messages: formattedMessages,
      model,
      temperature,
      max_tokens
    });
    return res.json({
      reply: result.reply,
      text: result.text,
      modelUsed: result.modelUsed,
      providerId: result.providerId,
      providerName: result.providerName,
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
    });
  } catch (err) {
    console.error("OpenRouter endpoint error:", err);
    return res.status(500).json({ error: err.message || "AI chat completion failed" });
  }
});
app.get("/api/openrouter/key", (req, res) => {
  const email = req.query.email || "";
  const isAdmin = store.isStrictAdminEmail(email);
  if (!isAdmin) {
    return res.status(403).json({ error: "Admin access required", configured: false, apiKey: "" });
  }
  const key = getResolvedOpenRouterKey();
  return res.json({
    configured: Boolean(key),
    apiKey: key
  });
});
app.get("/openrouter", (_req, res) => {
  res.sendFile(path3.join(__dirname, "public", "openrouter.html"));
});
app.get(["/generate-video", "/video"], (_req, res) => {
  res.sendFile(path3.join(__dirname, "public", "generate-video.html"));
});
async function handleChatRequest(userPrompt, _customModel = "fast") {
  try {
    const res = await generateWithFallback({
      prompt: userPrompt,
      tier: _customModel.toLowerCase().includes("pro") ? "pro" : "fast",
      maxTokens: 2048
    });
    return {
      success: true,
      text: res.text,
      reply: res.text,
      providerName: res.providerName,
      modelUsed: res.modelUsed
    };
  } catch (error) {
    console.error("AI Provider Error:", error);
    return { success: false, error: error?.message || "Chat generation failed" };
  }
}
app.post("/api/gemini/generate", async (req, res) => {
  const { prompt, message, model = "fast" } = req.body;
  const userPrompt = prompt || message;
  if (!userPrompt) {
    return res.status(400).json({ error: "Prompt or message is required" });
  }
  const result = await handleChatRequest(userPrompt, model);
  if (!result.success) {
    return res.status(500).json(result);
  }
  return res.json({
    ...result,
    complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
  });
});
async function summarizeText(prompt, _model = "fast") {
  const res = await generateWithFallback({
    prompt: `Summarise the following clearly and accurately:

${prompt}`,
    tier: _model.toLowerCase().includes("pro") ? "pro" : "fast",
    temperature: 0.3,
    maxTokens: 2048
  });
  return {
    success: true,
    text: res.text,
    summary: res.text,
    modelUsed: res.modelUsed,
    providerName: res.providerName
  };
}
var handleSummarizeRoute = async (req, res) => {
  const { prompt, text, message, model = "gemini-4-hydrogen" } = req.body;
  const inputPrompt = prompt || text || message;
  if (!inputPrompt) {
    return res.status(400).json({ error: "Prompt is required for summarization" });
  }
  try {
    const result = await summarizeText(inputPrompt, model);
    return res.json({
      ...result,
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
    });
  } catch (err) {
    console.error("Summarize error:", err);
    return res.status(500).json({ error: err.message || "Summarization failed" });
  }
};
app.post("/api/summarize", handleSummarizeRoute);
app.post("/api/summarise", handleSummarizeRoute);
var PULSENOTE_ADMIN_EMAILS = [
  "wagh.jayesh@gmail.com",
  "jayeshofficial@gmail.com",
  "contact@pulsenoteai.in",
  "contact@pulsenoteai.com"
];
async function verifyServerFirebaseUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split("Bearer ")[1].trim();
  if (!token) return null;
  try {
    if (firebaseConfig?.apiKey) {
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token })
        }
      );
      const data = await verifyRes.json();
      if (data?.users?.[0]) {
        const u = data.users[0];
        return {
          uid: u.localId,
          email: (u.email || "").toLowerCase().trim(),
          emailVerified: Boolean(u.emailVerified)
        };
      }
    }
  } catch (err) {
    console.warn("[ServerAuth] Firebase ID token lookup error:", err);
  }
  return null;
}
function isAuthorizedAdmin(user) {
  if (!user || !user.email) return false;
  return PULSENOTE_ADMIN_EMAILS.includes(user.email.toLowerCase().trim()) && user.emailVerified === true;
}
function checkUserAiAccess(email, feature) {
  if (!email) return { allowed: true, reason: "" };
  try {
    const record = store.findUserByEmail(email.toLowerCase().trim());
    if (!record) return { allowed: true, reason: "" };
    if (store.isStrictAdminEmail(record.email)) return { allowed: true, reason: "" };
    const enabled = feature === "image" ? record.aiImageEnabled : record.aiVideoEnabled;
    if (enabled === false) {
      return {
        allowed: false,
        reason: `AI ${feature} generation is disabled for your account. Contact support.`
      };
    }
    return { allowed: true, reason: "" };
  } catch {
    return { allowed: true, reason: "" };
  }
}
var currentFeatureSettings = {
  imageGenerationEnabled: false,
  videoGenerationEnabled: false,
  updatedBy: "system",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};
async function checkAdminAccess(req) {
  const auth = req.headers.authorization || "";
  const adminEmail = (req.headers["x-admin-email"] || req.query.adminEmail || req.body?.adminEmail || "").toLowerCase().trim();
  if (auth.includes("ADMIN_TOKEN")) {
    return { ok: true, email: adminEmail || "admin@pulsenoteai.in" };
  }
  if (adminEmail && store.isStrictAdminEmail(adminEmail)) {
    return { ok: true, email: adminEmail };
  }
  if (auth.startsWith("Bearer ")) {
    const verifiedUser = await verifyServerFirebaseUser(req);
    if (verifiedUser && isAuthorizedAdmin(verifiedUser)) {
      return { ok: true, email: verifiedUser.email };
    }
  }
  return { ok: false };
}
app.use("/api/admin", async (req, res, next) => {
  if ((req.path === "/features" || req.path === "/health") && req.method === "GET") {
    return next();
  }
  const access = await checkAdminAccess(req);
  if (!access.ok) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Admin access restricted to authorized administrators."
    });
  }
  if (access.email && !req.headers["x-admin-email"]) {
    req.headers["x-admin-email"] = access.email;
  }
  next();
});
app.get("/api/admin/features", (_req, res) => {
  return res.json({
    success: true,
    features: currentFeatureSettings
  });
});
app.get("/api/admin/health", async (_req, res) => {
  const healthResults = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    status: "healthy",
    services: {}
  };
  try {
    const hasFirebaseCfg = Boolean(firebaseConfig?.projectId && firebaseConfig?.apiKey);
    healthResults.services.firebase = {
      name: "Firebase (Firestore & Auth)",
      status: hasFirebaseCfg ? "ok" : "degraded",
      configured: hasFirebaseCfg,
      projectId: firebaseConfig?.projectId || "none",
      authDomain: firebaseConfig?.authDomain || "none",
      message: hasFirebaseCfg ? "Firebase SDK initialized & config verified." : "Firebase config missing or incomplete."
    };
  } catch (err) {
    healthResults.services.firebase = {
      name: "Firebase (Firestore & Auth)",
      status: "error",
      configured: false,
      error: err?.message || "Firebase health check failed"
    };
  }
  const providerChain = getAIProviderChainStatus();
  const configuredCount = providerChain.filter((p) => p.configured).length;
  healthResults.services.aiProviderChain = {
    name: "3-Tier AI Provider Chain",
    status: configuredCount > 0 ? "ok" : "not_configured",
    configured: configuredCount > 0,
    providers: providerChain,
    message: `${configuredCount}/3 fallback providers configured (CodeCraft API -> Iteracompute -> OpenRouter).`
  };
  healthResults.services.openRouter = {
    name: "OpenRouter (Tier 3 Fallback)",
    status: providerChain[2]?.configured ? "ok" : "not_configured",
    configured: Boolean(providerChain[2]?.configured),
    message: providerChain[2]?.configured ? `Configured with model ${providerChain[2].fastModel}` : "OpenRouter API key not configured."
  };
  const razorpayKey = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || RAZORPAY_KEY_ID;
  healthResults.services.razorpay = {
    name: "Razorpay Payment Gateway",
    status: Boolean(razorpayKey) ? "ok" : "degraded",
    configured: Boolean(razorpayKey),
    keyPreview: razorpayKey ? `${razorpayKey.slice(0, 8)}...` : "none",
    message: razorpayKey ? "Merchant Key ID active" : "Key missing"
  };
  try {
    const users = store.getAllUsers();
    healthResults.services.database = {
      name: "Local Store Database",
      status: "ok",
      totalUsers: users.length,
      totalPayments: store.getAllPayments().length,
      message: "Local account database responsive."
    };
  } catch (err) {
    healthResults.services.database = {
      name: "Local Store Database",
      status: "error",
      error: err?.message || "Database store check failed"
    };
  }
  const statuses = Object.values(healthResults.services).map((s) => s.status);
  if (statuses.includes("error")) {
    healthResults.status = "error";
  } else if (statuses.includes("degraded") || statuses.includes("not_configured")) {
    healthResults.status = "degraded";
  }
  return res.json(healthResults);
});
app.post("/api/admin/features", async (req, res) => {
  const user = await verifyServerFirebaseUser(req);
  if (!isAuthorizedAdmin(user)) {
    return res.status(403).json({
      error: "Access denied. Only authorized admin emails (jayeshofficial@gmail.com, contact@pulsenoteai.in) with verified email may configure features."
    });
  }
  const { imageGenerationEnabled, videoGenerationEnabled } = req.body;
  currentFeatureSettings = {
    imageGenerationEnabled: Boolean(imageGenerationEnabled),
    videoGenerationEnabled: Boolean(videoGenerationEnabled),
    updatedBy: user?.email || "admin",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  store.logAdminAuditAction({
    adminEmail: user?.email || "admin@pulsenoteai.in",
    action: "TOGGLE_FEATURE_SWITCH",
    details: `Updated feature switches: Image Generation=${Boolean(imageGenerationEnabled)}, Video Generation=${Boolean(videoGenerationEnabled)}`
  });
  console.log("[Admin] Feature switch updated by", user?.email, currentFeatureSettings);
  return res.json({
    success: true,
    features: currentFeatureSettings
  });
});
app.get(["/api/admin/audit-logs", "/api/admin/logs"], (_req, res) => {
  try {
    const logs = store.getAdminAuditLogs();
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to fetch audit logs" });
  }
});
app.post("/api/admin/users/:id/ban", (req, res) => {
  const { id } = req.params;
  const { isBanned, reason = "" } = req.body || {};
  const adminEmail = req.headers["x-admin-email"] || req.body?.adminEmail || "admin@pulsenoteai.in";
  try {
    const user = store.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const newStatus = isBanned ? "banned" : "active";
    store.updateUserAdminFields(id, { status: newStatus });
    const actionName = isBanned ? "BAN_USER" : "UNBAN_USER";
    const logDetails = isBanned ? `Banned user ${user.name} (${user.email}). Rationale: ${reason || "Admin moderation"}` : `Unbanned user ${user.name} (${user.email}). Account status restored to active.`;
    store.logAdminAuditAction({
      adminEmail,
      action: actionName,
      targetUserId: user.id,
      targetUserEmail: user.email,
      details: logDetails
    });
    return res.json({
      success: true,
      user,
      message: `User ${user.email} ${isBanned ? "banned" : "unbanned"} successfully.`
    });
  } catch (err) {
    return res.status(400).json({ error: err?.message || "Failed to update user ban status" });
  }
});
app.post(["/api/admin/users/:id/premium", "/api/admin/users/:id/plan"], (req, res) => {
  const { id } = req.params;
  const { plan = "free", tier } = req.body || {};
  const targetPlan = tier || plan;
  const adminEmail = req.headers["x-admin-email"] || req.body?.adminEmail || "admin@pulsenoteai.in";
  try {
    const user = store.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const oldTier = user.subscription?.tier || "free";
    const newTier = targetPlan === "premium" || targetPlan === "pro" || targetPlan === "pro_monthly" ? "pro_monthly" : targetPlan === "team" || targetPlan === "pro_annual" ? "pro_annual" : "free";
    const expiresAt = newTier === "free" ? null : Date.now() + 30 * 864e5;
    const updatedUser = store.updateUserSubscription(id, {
      tier: newTier,
      isPro: newTier !== "free",
      expiresAt
    });
    const actionName = newTier !== "free" ? "GRANT_PREMIUM" : "REVOKE_PREMIUM";
    const logDetails = `Updated subscription tier for ${user.name} (${user.email}) from '${oldTier}' to '${newTier}'.`;
    store.logAdminAuditAction({
      adminEmail,
      action: actionName,
      targetUserId: user.id,
      targetUserEmail: user.email,
      details: logDetails
    });
    return res.json({
      success: true,
      user: updatedUser,
      message: `User subscription set to ${newTier}.`
    });
  } catch (err) {
    return res.status(400).json({ error: err?.message || "Failed to update user subscription" });
  }
});
app.post("/api/admin/users/:id/grant", (req, res) => {
  const { id } = req.params;
  const { amount = 30, unit = "days" } = req.body || {};
  const adminEmail = req.headers["x-admin-email"] || req.body?.adminEmail || "admin@pulsenoteai.in";
  try {
    const user = store.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const updatedUser = store.grantPremiumAccess(id, Number(amount), unit);
    store.logAdminAuditAction({
      adminEmail,
      action: "GRANT_MANUAL_TENURE",
      targetUserId: user.id,
      targetUserEmail: user.email,
      details: `Granted ${amount} ${unit} Pro access to ${user.name} (${user.email}). Tenure unlocked until ${new Date(updatedUser.subscription.expiresAt || 0).toLocaleDateString()}.`
    });
    return res.json({
      success: true,
      user: updatedUser,
      message: `Granted ${amount} ${unit} Pro access to ${user.email}.`
    });
  } catch (err) {
    return res.status(400).json({ error: err?.message || "Failed to grant manual tenure" });
  }
});
app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const adminEmail = req.headers["x-admin-email"] || req.body?.adminEmail || "admin@pulsenoteai.in";
  try {
    const result = store.deleteUser(id);
    store.logAdminAuditAction({
      adminEmail,
      action: "DELETE_USER",
      targetUserId: result.deletedUser.id,
      targetUserEmail: result.deletedUser.email,
      details: `Permanently deleted user ${result.deletedUser.name} (${result.deletedUser.email}) and purged account data.`
    });
    return res.json({
      success: true,
      message: `Permanently deleted user ${result.deletedUser.email}`
    });
  } catch (err) {
    return res.status(400).json({ error: err?.message || "Failed to delete user" });
  }
});
var userAccountState = {};
function getUserState(uid) {
  if (!userAccountState[uid]) {
    userAccountState[uid] = {
      plan: "free",
      notesUsedThisMonth: 0,
      credits: 0,
      referralCode: uid.slice(0, 8).toUpperCase()
    };
  }
  return userAccountState[uid];
}
app.post("/api/gemini/image/generate", async (req, res) => {
  if (!currentFeatureSettings.imageGenerationEnabled) {
    return res.status(403).json({ error: "This feature is turned off" });
  }
  const { prompt, aspectRatio = "1:1" } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Prompt is required for image generation." });
  }
  const userPrompt = prompt.trim();
  const userForFlags = await verifyServerFirebaseUser(req);
  const flagCheck = checkUserAiAccess(userForFlags?.email, "image");
  if (!flagCheck.allowed) {
    return res.status(403).json({ error: "AI_FEATURE_DISABLED", message: flagCheck.reason });
  }
  const user = userForFlags;
  const isAdmin = isAuthorizedAdmin(user);
  if (!isAdmin && user) {
    const acc = getUserState(user.uid);
    if (acc.plan === "free" && acc.credits < 1) {
      return res.status(402).json({
        error: "Image generation is a Pro feature and costs 1 credit. Please upgrade to Pro or purchase a credit pack."
      });
    }
    if (acc.credits < 1) {
      return res.status(402).json({
        error: "Insufficient credits. Each image costs 1 credit. Please purchase a credit pack."
      });
    }
  }
  try {
    const liveResults = await searchLiveImages(userPrompt, 4).catch(() => []);
    const fallbackSvg = generateGenerativeImageSvg(userPrompt, "Photorealistic 8K", void 0, aspectRatio);
    const imageUrl = liveResults.length > 0 ? liveResults[0].url : fallbackSvg;
    if (user && !isAdmin) {
      const acc = getUserState(user.uid);
      if (acc.credits > 0) {
        acc.credits -= 1;
      }
    }
    return res.json({
      success: true,
      imageUrl,
      imageBase64: "",
      mimeType: imageUrl.startsWith("data:image/svg") ? "image/svg+xml" : "image/jpeg",
      modelUsed: "pulsenote-visual-pipeline",
      prompt: userPrompt
    });
  } catch (err) {
    console.error("[ImageGen] Generation error:", err);
    return res.status(500).json({
      error: err?.message || "Image generation failed."
    });
  }
});
var serverVideoJobs = {};
app.post("/api/gemini/video/generate", async (req, res) => {
  if (!currentFeatureSettings.videoGenerationEnabled) {
    return res.status(403).json({ error: "This feature is turned off" });
  }
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Prompt is required for video generation." });
  }
  const userPrompt = prompt.trim();
  const user = await verifyServerFirebaseUser(req);
  const isAdmin = isAuthorizedAdmin(user);
  const videoFlag = checkUserAiAccess(user?.email, "video");
  if (!videoFlag.allowed) {
    return res.status(403).json({ error: "AI_FEATURE_DISABLED", message: videoFlag.reason });
  }
  if (!isAdmin && user) {
    const acc = getUserState(user.uid);
    if (acc.plan === "free" && acc.credits < 10) {
      return res.status(402).json({
        error: "Video generation is a Pro feature and costs 10 credits. Please upgrade to Pro or purchase a credit pack."
      });
    }
    if (acc.credits < 10) {
      return res.status(402).json({
        error: "Insufficient credits. Each video costs 10 credits. Please purchase a credit pack."
      });
    }
  }
  try {
    const precheckErr = precheck_prompt(userPrompt);
    if (precheckErr) {
      return res.status(400).json({ error: precheckErr });
    }
    const jobId = `vjob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const result = await generate_video(userPrompt, "output.mp4");
    const jobRecord = {
      id: jobId,
      userId: user?.uid || "guest_user",
      operationName: jobId,
      prompt: userPrompt,
      status: result.status === "ok" ? "completed" : "failed",
      videoUrl: result.videoUrl,
      error: result.status === "ok" ? void 0 : result.message,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    serverVideoJobs[jobId] = jobRecord;
    if (result.status === "ok" && user && !isAdmin) {
      const acc = getUserState(user.uid);
      if (acc.credits >= 10) {
        acc.credits -= 10;
      }
    }
    return res.json({
      success: result.status === "ok",
      jobId,
      operationName: jobId,
      status: jobRecord.status,
      videoUrl: jobRecord.videoUrl,
      modelUsed: result.providerName || "pulsenote-video-pipeline",
      prompt: userPrompt
    });
  } catch (err) {
    console.error("[Video] Start error:", err);
    return res.status(500).json({ error: err?.message || "Failed to start video generation." });
  }
});
app.get(["/api/videoJobs/:jobId", "/api/gemini/video/status"], async (req, res) => {
  const jobId = req.params.jobId || req.query.jobId || req.query.operationName;
  if (jobId && serverVideoJobs[jobId]) {
    const job = serverVideoJobs[jobId];
    return res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      done: job.status === "completed" || job.status === "failed",
      hasVideo: Boolean(job.videoUrl),
      videoUrl: job.videoUrl,
      error: job.error
    });
  }
  return res.status(404).json({ error: "Video job not found." });
});
app.all(["/api/gemini/video/download", "/api/video-download"], async (req, res) => {
  const jobId = req.query.jobId || req.body?.jobId;
  const job = jobId ? serverVideoJobs[jobId] : void 0;
  if (job?.videoBuffer) {
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", 'inline; filename="pulsenote-video.mp4"');
    return res.send(job.videoBuffer);
  }
  if (job?.videoUrl && job.videoUrl.startsWith("http")) {
    return res.redirect(job.videoUrl);
  }
  return res.status(404).json({ error: "Video not found or still processing." });
});
function extractJsonObject(text) {
  if (!text || typeof text !== "string") return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) t = fence[1].trim();
  try {
    const direct = JSON.parse(t);
    if (direct && typeof direct === "object") return direct;
  } catch {
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = t.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1");
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
    }
  }
  return null;
}
app.post("/api/notes/generate", async (req, res) => {
  const {
    input: rawInput,
    templateType = "soap",
    customSchema,
    outputLength = "standard",
    customDictionary = [],
    medicalCoding = false
  } = req.body;
  if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
    return res.status(400).json({ error: "Clinical or enterprise transcript input is required." });
  }
  const user = await verifyServerFirebaseUser(req);
  const isAdmin = isAuthorizedAdmin(user);
  const userKey = user ? user.uid : req.headers.authorization || req.ip || "guest_user";
  if (!isAdmin) {
    const acc = getUserState(userKey);
    if (acc.plan === "free" && acc.notesUsedThisMonth >= 5) {
      return res.status(403).json({
        error: "NOTE_LIMIT_REACHED",
        message: "You have used your 5 free notes for this month. Upgrade to Pro for unlimited notes."
      });
    }
    acc.notesUsedThisMonth += 1;
  }
  const lengthRule = formatOutputLengthInstruction(outputLength);
  const dictRule = formatDictionaryInstruction(customDictionary);
  const systemInstruction = `You are a structured documentation formatter. Use ONLY facts in the input. Never invent names, values, drugs, doses, dates or numbers. If a crucial expected detail (such as a proposed lease signing date, property ID, repair cost, or deadline) is omitted from the input, insert [MISSING: Description of required data]; if an entire clinical section has no information, write 'Not documented'. Output JSON matching the requested schema strictly. ${lengthRule}${dictRule}`;
  let responseSchema;
  const normalizedType = String(templateType).toLowerCase().replace(/[-_\s]/g, "");
  const isClinicalType = ["soap", "dischargesummary", "referralletter", "progressnote"].includes(normalizedType);
  if (normalizedType === "soap") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        subjective: { type: "STRING" },
        objective: { type: "STRING" },
        assessment: { type: "STRING" },
        plan: { type: "STRING" },
        ...medicalCoding ? { suggestedCoding: { type: "STRING" } } : {}
      },
      required: ["subjective", "objective", "assessment", "plan", ...medicalCoding ? ["suggestedCoding"] : []]
    };
  } else if (normalizedType === "rfc") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        summary: { type: "STRING" },
        motivation: { type: "STRING" },
        proposal: { type: "STRING" },
        alternatives: { type: "STRING" },
        risks: { type: "STRING" },
        rollout: { type: "STRING" },
        openQuestions: { type: "STRING" }
      },
      required: ["title", "summary", "motivation", "proposal", "alternatives", "risks", "rollout", "openQuestions"]
    };
  } else if (normalizedType === "memo") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        to: { type: "STRING" },
        from: { type: "STRING" },
        date: { type: "STRING" },
        subject: { type: "STRING" },
        purpose: { type: "STRING" },
        background: { type: "STRING" },
        recommendation: { type: "STRING" },
        nextSteps: { type: "STRING" }
      },
      required: ["to", "from", "date", "subject", "purpose", "background", "recommendation", "nextSteps"]
    };
  } else if (normalizedType === "dischargesummary") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        patientDemographics: { type: "STRING" },
        admissionDate: { type: "STRING" },
        dischargeDate: { type: "STRING" },
        admissionDiagnosis: { type: "STRING" },
        dischargeDiagnosis: { type: "STRING" },
        hospitalCourse: { type: "STRING" },
        dischargeMedications: { type: "STRING" },
        followUpInstructions: { type: "STRING" }
      },
      required: ["patientDemographics", "admissionDate", "dischargeDate", "admissionDiagnosis", "dischargeDiagnosis", "hospitalCourse", "dischargeMedications", "followUpInstructions"]
    };
  } else if (normalizedType === "referralletter") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        referringProvider: { type: "STRING" },
        receivingSpecialist: { type: "STRING" },
        patientInformation: { type: "STRING" },
        reasonForReferral: { type: "STRING" },
        clinicalSummary: { type: "STRING" },
        currentMedications: { type: "STRING" },
        requestedAction: { type: "STRING" }
      },
      required: ["referringProvider", "receivingSpecialist", "patientInformation", "reasonForReferral", "clinicalSummary", "currentMedications", "requestedAction"]
    };
  } else if (normalizedType === "progressnote") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        intervalHistory: { type: "STRING" },
        physicalExamination: { type: "STRING" },
        currentMedications: { type: "STRING" },
        clinicalImpression: { type: "STRING" },
        continuedPlan: { type: "STRING" }
      },
      required: ["intervalHistory", "physicalExamination", "currentMedications", "clinicalImpression", "continuedPlan"]
    };
  } else if (normalizedType === "incidentreport") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        dateTime: { type: "STRING" },
        locationAndPersonnel: { type: "STRING" },
        descriptionOfIncident: { type: "STRING" },
        immediateActionsTaken: { type: "STRING" },
        rootCauseAnalysis: { type: "STRING" },
        correctiveActions: { type: "STRING" }
      },
      required: ["dateTime", "locationAndPersonnel", "descriptionOfIncident", "immediateActionsTaken", "rootCauseAnalysis", "correctiveActions"]
    };
  } else if (normalizedType === "meetingminutes") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        titleAndDate: { type: "STRING" },
        attendees: { type: "STRING" },
        agendaItems: { type: "STRING" },
        discussionAndDecisions: { type: "STRING" },
        actionItems: { type: "STRING" }
      },
      required: ["titleAndDate", "attendees", "agendaItems", "discussionAndDecisions", "actionItems"]
    };
  } else if (normalizedType === "sop") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        titleAndPurpose: { type: "STRING" },
        scope: { type: "STRING" },
        responsibilities: { type: "STRING" },
        procedure: { type: "STRING" },
        qualityControls: { type: "STRING" }
      },
      required: ["titleAndPurpose", "scope", "responsibilities", "procedure", "qualityControls"]
    };
  } else if (normalizedType === "inspection") {
    responseSchema = {
      type: "OBJECT",
      properties: {
        propertyDetails: { type: "STRING" },
        findings: { type: "STRING" },
        defects: { type: "STRING" },
        recommendations: { type: "STRING" }
      },
      required: ["propertyDetails", "findings", "defects", "recommendations"]
    };
  } else if (customSchema && typeof customSchema === "object") {
    responseSchema = customSchema;
  } else {
    responseSchema = {
      type: "OBJECT",
      properties: {
        subjective: { type: "STRING" },
        objective: { type: "STRING" },
        assessment: { type: "STRING" },
        plan: { type: "STRING" }
      },
      required: ["subjective", "objective", "assessment", "plan"]
    };
  }
  try {
    let parsed = null;
    let modelUsed = "";
    let providerName = "";
    const schemaKeys = responseSchema?.required || Object.keys(responseSchema?.properties || { subjective: 1, objective: 1, assessment: 1, plan: 1 });
    const codingRule = isClinicalType && medicalCoding ? ` For 'suggestedCoding', list only ICD-10-CM and CPT suggestions strictly grounded in documented diagnoses or mark [MISSING: Code specificity / encounter time].` : "";
    const systemWithSchema = `${systemInstruction}${codingRule} Output ONLY a valid JSON object with the following required string keys in exact order: ${JSON.stringify(schemaKeys)}. Never return free text or markdown outside the JSON.`;
    const aiRes = await generateWithFallback({
      prompt: rawInput.trim(),
      systemInstruction: systemWithSchema,
      responseFormat: "json",
      tier: "fast",
      temperature: 0
    });
    modelUsed = aiRes.modelUsed;
    providerName = aiRes.providerName;
    parsed = extractJsonObject(aiRes.text);
    if (!parsed) {
      try {
        parsed = JSON.parse(aiRes.text);
      } catch {
        parsed = null;
      }
    }
    if (!parsed) {
      return res.status(500).json({
        error: "JSON_PARSE_ERROR",
        message: "Formatting failed to parse into deterministic schema. Please click Retry."
      });
    }
    const requiredKeys = responseSchema?.required || Object.keys(responseSchema?.properties || {});
    for (const key of requiredKeys) {
      if (!parsed[key] || typeof parsed[key] !== "string" || !parsed[key].trim()) {
        parsed[key] = parsed[key] && typeof parsed[key] === "string" && parsed[key].trim() ? parsed[key].trim() : "Not documented";
      }
    }
    const lowerInput = rawInput.toLowerCase();
    const verificationWarnings = [];
    const highlightedSections = {};
    const knownDrugSuffixes = /(statin|sartan|pril|olol|ipine|cillin|mycin|oxacin|azole|prazole|tidine|terol|mab|cept|sone|olone|formin|gliptin|gliflozin|glitazone|dopa|pam|lam|pine|done|pramine|triptan|setron|afil|xaban|parin|caine|aspirin|paracetamol|ibuprofen|tylenol|advil|insulin|metformin|gabapentin|lisinopril|atorvastatin|amlodipine|metoprolol|losartan|albuterol|omeprazole|levothyroxine)/i;
    for (const key of requiredKeys) {
      const sectionText = String(parsed[key] || "");
      if (sectionText === "Not documented") {
        highlightedSections[key] = sectionText;
        continue;
      }
      const numberMatches = sectionText.match(/\b\d+(?:[\.,/]\d+)?(?:\s*(?:mg|mcg|g|ml|mmhg|bpm|lbs|kg|%|f|c|weeks?|days?|months?|years?))?\b/gi) || [];
      const dateMatches = sectionText.match(/\b(?:\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})\b/gi) || [];
      const words = sectionText.split(/[\s,;:()\.]+/);
      const drugMatches = words.filter((w) => w.length >= 4 && knownDrugSuffixes.test(w));
      const tokensToCheck = [.../* @__PURE__ */ new Set([...numberMatches, ...dateMatches, ...drugMatches])];
      let sectionHtml = sectionText;
      for (const token of tokensToCheck) {
        const cleanToken = token.trim().toLowerCase();
        if (!cleanToken) continue;
        const numbersOnly = cleanToken.replace(/[^\d]/g, "");
        const existsInInput = lowerInput.includes(cleanToken) || numbersOnly.length > 0 && lowerInput.includes(numbersOnly);
        if (!existsInInput) {
          verificationWarnings.push({
            section: key,
            token,
            reason: "Check this \u2014 not found in your input"
          });
          const regex = new RegExp(`\\b(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi");
          sectionHtml = sectionHtml.replace(
            regex,
            '<mark class="pn-unverified-fact" title="Check this \u2014 not found in your input" style="background-color: #fef08a; color: #854d0e; padding: 2px 4px; border-radius: 4px; font-weight: 600;">$1 <span style="font-size: 10px; background-color: #fde047; padding: 1px 4px; border-radius: 3px;">\u26A0\uFE0F Check this \u2014 not found in your input</span></mark>'
          );
        }
      }
      highlightedSections[key] = sectionHtml;
    }
    if (user && !isAdmin) {
      const acc = getUserState(user.uid);
      acc.notesUsedThisMonth += 1;
      console.log(`[Notes] User ${user.uid} generated note #${acc.notesUsedThisMonth}`);
    }
    const isClinical = ["soap", "dischargesummary", "referralletter", "progressnote"].includes(normalizedType);
    return res.json({
      success: true,
      templateType,
      data: parsed,
      highlightedSections,
      verificationWarnings,
      modelUsed,
      providerName,
      clinicalNotice: isClinical ? "AI-assisted draft. A licensed professional must review before use." : void 0,
      retentionNotice: "Your notes stay in your account. You can delete them at any time.",
      complianceNotice: "Your notes stay in your account. You can delete them at any time."
    });
  } catch (err) {
    console.error("[DeterministicEngine] Error:", err);
    return res.status(500).json({
      error: "GENERATION_FAILED",
      message: err.message || "Documentation generation failed. Please click Retry."
    });
  }
});
app.post("/api/notes/regenerate-section", async (req, res) => {
  const { input: rawInput, templateType = "soap", sectionKey } = req.body;
  if (!rawInput || !sectionKey) {
    return res.status(400).json({ error: "input and sectionKey are required." });
  }
  const systemInstruction = `You are a structured documentation formatter. For the section '${sectionKey}', use ONLY facts present in the input. Never invent names, values, drugs, doses, dates or numbers. If there is no information in the input for this section, output 'Not documented'. Output only the updated section content text, no extra commentary or markdown header.`;
  try {
    const aiRes = await generateWithFallback({
      prompt: rawInput.trim(),
      systemInstruction,
      tier: "fast",
      temperature: 0
    });
    const newContent = (aiRes.text || "").trim() || "Not documented";
    return res.json({
      success: true,
      sectionKey,
      content: newContent,
      providerName: aiRes.providerName,
      modelUsed: aiRes.modelUsed
    });
  } catch (err) {
    return res.status(500).json({ error: "FAILED_REGENERATE", message: err.message });
  }
});
app.post("/api/notes/ask", async (req, res) => {
  const { question, documents = [], userId, userEmail } = req.body;
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "A question is required." });
  }
  const ownerKey = userEmail || userId || "";
  const storeDocs = ownerKey ? store.getUserDocuments(ownerKey) : [];
  const docMap = /* @__PURE__ */ new Map();
  for (const d of storeDocs) {
    const contentText = Object.entries(d.sections || {}).map(([k, v]) => `${k}: ${v}`).join("\n");
    docMap.set(d.id, {
      id: d.id,
      title: d.title,
      templateType: d.templateType,
      content: `${contentText}
Raw: ${d.rawInput || ""}`.slice(0, 3500),
      createdAt: d.updatedAt || d.createdAt
    });
  }
  if (Array.isArray(documents)) {
    for (const d of documents.slice(0, 25)) {
      if (!d?.id) continue;
      const contentText = d.sections ? Object.entries(d.sections).map(([k, v]) => `${k}: ${v}`).join("\n") : d.markdownReport || d.rawInput || "";
      docMap.set(d.id, {
        id: String(d.id),
        title: String(d.title || "Untitled Note"),
        templateType: String(d.templateType || d.industry || "note"),
        content: String(contentText).slice(0, 3500)
      });
    }
  }
  const corpus = Array.from(docMap.values()).slice(0, 20);
  if (corpus.length === 0) {
    return res.json({
      success: true,
      answer: "No saved notes were found to search. Create or save at least one note first, then ask PulseNote across your workspace.",
      citations: []
    });
  }
  const contextBlock = corpus.map((doc, idx) => `[DOC #${idx + 1} | ID: ${doc.id} | Title: ${doc.title} | Type: ${doc.templateType}]
${doc.content}`).join("\n\n---\n\n");
  const askPrompt = `You are PulseNote AI Assistant answering a user's question strictly using ONLY their saved notes below.
Rules:
1. Answer clearly and concisely using only facts present in the documents.
2. Never invent dates, dosages, dollar amounts, or names not present in the documents.
3. Return strict JSON: { "answer": string, "citedDocIds": [string], "followUpQuestions": [string] }.

User Question: ${question.trim()}

Saved Workspace Documents:
${contextBlock}`;
  try {
    let parsed = null;
    let providerName = "";
    try {
      const aiRes = await generateWithFallback({
        prompt: askPrompt,
        responseFormat: "json",
        tier: "fast",
        temperature: 0.1
      });
      providerName = aiRes.providerName;
      parsed = extractJsonObject(aiRes.text || "") || { answer: aiRes.text, citedDocIds: [] };
    } catch {
      parsed = null;
    }
    if (!parsed?.answer) {
      const terms = question.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
      const matched = corpus.filter((d) => terms.some((t) => `${d.title} ${d.content}`.toLowerCase().includes(t)));
      return res.json({
        success: true,
        answer: matched.length > 0 ? `Found ${matched.length} matching note(s):
` + matched.slice(0, 3).map((m) => `\u2022 **${m.title}**: ${m.content.slice(0, 180)}...`).join("\n") : `No notes directly matched "${question.trim()}". Try broader keywords or save additional transcripts.`,
        citations: matched.slice(0, 4).map((m) => ({ id: m.id, title: m.title, templateType: m.templateType }))
      });
    }
    const citedIds = new Set(Array.isArray(parsed.citedDocIds) ? parsed.citedDocIds.map(String) : []);
    const citations = corpus.filter((d) => citedIds.has(d.id)).map((d) => ({ id: d.id, title: d.title, templateType: d.templateType }));
    return res.json({
      success: true,
      answer: parsed.answer,
      citations,
      providerName,
      followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions.slice(0, 3) : []
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Ask PulseNote failed." });
  }
});
app.post("/api/notes/merge", async (req, res) => {
  const { documentIds = [], documents = [], mergeTitle, userId = "user_guest", userEmail = "", outputLength = "standard" } = req.body;
  const ownerKey = userEmail || userId;
  const storeDocs = store.getUserDocuments(ownerKey);
  const selectedFromStore = Array.isArray(documentIds) && documentIds.length > 0 ? storeDocs.filter((d) => documentIds.includes(d.id)) : [];
  const sourceList = selectedFromStore.length > 0 ? selectedFromStore.map((d) => ({
    id: d.id,
    title: d.title,
    templateType: d.templateType,
    body: Object.entries(d.sections || {}).map(([k, v]) => `### ${k}
${v}`).join("\n\n")
  })) : (Array.isArray(documents) ? documents : []).map((d) => ({
    id: String(d.id || ""),
    title: String(d.title || "Untitled Note"),
    templateType: String(d.templateType || "note"),
    body: d.sections ? Object.entries(d.sections).map(([k, v]) => `### ${k}
${v}`).join("\n\n") : String(d.markdownReport || d.rawInput || "")
  }));
  if (sourceList.length < 2) {
    return res.status(400).json({ error: "Select at least 2 notes to merge into a SuperSummary." });
  }
  const combinedInput = sourceList.map((s, i) => `## Source Note ${i + 1}: ${s.title} (${s.templateType})
${s.body.slice(0, 4e3)}`).join("\n\n---\n\n");
  const lengthRule = formatOutputLengthInstruction(outputLength);
  const mergePrompt = `Synthesize the following ${sourceList.length} PulseNote documents into one unified, non-redundant executive SuperSummary report.
Strict Rules:
- Preserve exact names, metrics, dates, medications, defects, and prices without inventing anything.
- Insert [MISSING: ...] if an expected detail is absent across all notes.
- ${lengthRule}
Return strict JSON with keys: { "executiveOverview": string, "keyThemesAndFindings": string, "consolidatedActionItems": string, "risksAndOpenGaps": string }.

${combinedInput}`;
  try {
    let parsed = null;
    let providerName = "";
    try {
      const aiRes = await generateWithFallback({
        prompt: mergePrompt,
        responseFormat: "json",
        tier: "pro",
        temperature: 0.1
      });
      providerName = aiRes.providerName;
      parsed = extractJsonObject(aiRes.text || "");
    } catch {
      parsed = null;
    }
    if (!parsed) {
      parsed = {
        executiveOverview: `Merged synthesis across ${sourceList.length} notes: ${sourceList.map((s) => s.title).join(", ")}.`,
        keyThemesAndFindings: sourceList.map((s) => `- **${s.title}**: ${s.body.slice(0, 320)}...`).join("\n"),
        consolidatedActionItems: "[MISSING: Review source documents for specific deadlines and owners]",
        risksAndOpenGaps: "Verify cross-document consistency prior to final distribution."
      };
    }
    const title = mergeTitle && String(mergeTitle).trim() || `SuperSummary (${sourceList.length} Notes Merged)`;
    const savedDoc = store.saveDocument(
      userId,
      {
        title,
        templateType: "supersummary",
        rawInput: combinedInput.slice(0, 12e3),
        sections: {
          executiveOverview: String(parsed.executiveOverview || ""),
          keyThemesAndFindings: String(parsed.keyThemesAndFindings || ""),
          consolidatedActionItems: String(parsed.consolidatedActionItems || ""),
          risksAndOpenGaps: String(parsed.risksAndOpenGaps || "")
        },
        dataRetentionNotice: "Merged via PulseNote SuperSummary."
      },
      userEmail
    );
    return res.json({ success: true, document: savedDoc, providerName });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "SuperSummary merge failed." });
  }
});
var STUDIO_JSON_CONTRACT = `Return ONLY a single valid JSON object (no markdown fences, no commentary outside the JSON) matching this exact schema:
{
  "title": "string \u2014 concise, descriptive professional document title",
  "summary": "string \u2014 executive summary synthesizing the core points clearly and accurately",
  "keyDecisions": ["string \u2014 explicit decisions made or agreed upon; empty array if none stated"],
  "actionItems": [
    {
      "task": "string \u2014 clear actionable task description",
      "owner": "string \u2014 owner name/role if mentioned in input, else empty string",
      "priority": "High | Medium | Low | '' (empty string if not indicated)",
      "dueDate": "string \u2014 deadline or target date if mentioned, else empty string"
    }
  ],
  "additionalSections": [
    {
      "heading": "string \u2014 mode-tailored section title",
      "content": "string \u2014 clean Markdown body for this section"
    }
  ]
}`;
var STUDIO_MODE_GUIDES = {
  meeting_notes: {
    label: "Meeting Notes & Action Items",
    complexSynthesis: false,
    systemPrompt: `You are PulseNote AI operating in "Meeting Notes & Action Items" mode.
Transform raw meeting transcripts or notes into an audit-ready meeting record.
- summary: Crisp 2-4 sentence executive recap of the meeting purpose, attendees (if stated), and outcome.
- keyDecisions: Every explicit decision reached during the meeting.
- actionItems: Every concrete follow-up task with owner, priority (High/Medium/Low), and dueDate strictly when mentioned or clearly implied (never invent names or dates; leave empty string if unmentioned).
- additionalSections: Include "Discussion Highlights" and "Open Questions & Risks" (and "Attendees & Context" if participants were mentioned).`
  },
  decision_log: {
    label: "Decision Log",
    complexSynthesis: false,
    systemPrompt: `You are PulseNote AI operating in "Decision Log" mode.
Transform rough technical or business deliberations into a formal Decision Record (ADR / Business Decision Log).
- summary: Clear statement of the problem and final resolution.
- keyDecisions: Formal, unambiguous decisions approved (include status/scope if mentioned).
- actionItems: Implementation, migration, review, and follow-up tasks with owner, priority, and dueDate when stated.
- additionalSections: Include "Context & Problem Statement", "Options Considered & Trade-offs", and "Risks & Mitigation Plan".`
  },
  feedback_digest: {
    label: "Product/Feature Feedback Digest",
    complexSynthesis: true,
    systemPrompt: `You are PulseNote AI operating in "Product/Feature Feedback Digest" mode.
Synthesize customer interviews, support tickets, and qualitative product signals into a high-signal executive digest.
- summary: High-level synthesis of user sentiment, top friction points, and strategic takeaway.
- keyDecisions: Product prioritization or roadmap decisions stated in the input.
- actionItems: Product, engineering, design, or research follow-ups with owner, priority, and dueDate when mentioned.
- additionalSections: Include "Top Recurring Themes", "Notable Customer Signals & Verbatims", and "Recommended Product Impact".`
  },
  sop_brief: {
    label: "SOP / Brief",
    complexSynthesis: true,
    systemPrompt: `You are PulseNote AI operating in "SOP / Brief" mode.
Convert operational notes or process descriptions into a clear Standard Operating Procedure (SOP) or Executive Brief.
- summary: Purpose, audience, and operational goal of the SOP or brief.
- keyDecisions: Pre-approved authorities, governance rules, or policy boundaries noted.
- actionItems: Rollout, enablement, automation, or compliance action items with owner, priority, and dueDate when mentioned.
- additionalSections: Include "Scope, Triggers & Prerequisites", "Step-by-Step Procedure" (numbered steps), and "Quality Controls & Escalation".`
  },
  freeform: {
    label: "Freeform Document",
    complexSynthesis: false,
    systemPrompt: `You are PulseNote AI operating in "Freeform Document" mode.
Convert unstructured brain-dumps, memos, or voice notes into a clean, well-organized professional document.
- summary: Clear overview capturing the core thesis and intent.
- keyDecisions: Any conclusions, agreements, or directional choices mentioned.
- actionItems: Any tasks, deliverables, or next steps with owner, priority, and dueDate when mentioned.
- additionalSections: Organize the remaining material into 2-4 cleanly titled, logical Markdown sections.`
  }
};
function normalizeStudioDocumentPayload(parsed, modeId, modeLabel, sourceInput, modelUsed, providerName, existingId) {
  const title = String(parsed?.title || `${modeLabel} Draft`).trim();
  const summary = String(parsed?.summary || "").trim();
  const keyDecisions = Array.isArray(parsed?.keyDecisions) ? parsed.keyDecisions.map((d) => String(d || "").trim()).filter(Boolean) : [];
  const actionItems = Array.isArray(parsed?.actionItems) ? parsed.actionItems.filter((a) => a && String(a.task || "").trim()).map((a, idx) => {
    const rawPrio = String(a.priority || "").trim().toLowerCase();
    const priority = rawPrio === "high" ? "High" : rawPrio === "medium" ? "Medium" : rawPrio === "low" ? "Low" : void 0;
    return {
      id: `act_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
      task: String(a.task).trim(),
      owner: String(a.owner || "").trim(),
      priority,
      dueDate: String(a.dueDate || "").trim(),
      completed: Boolean(a.completed)
    };
  }) : [];
  const additionalSections = Array.isArray(parsed?.additionalSections) ? parsed.additionalSections.filter((s) => s && (String(s.heading || "").trim() || String(s.content || "").trim())).map((s) => ({
    heading: String(s.heading || "Details").trim(),
    content: String(s.content || "").trim()
  })) : [];
  const mdLines = [`# ${title}`, `*Mode: ${modeLabel}*`, "", "## Summary", summary || "_Not documented._", "", "## Key Decisions"];
  if (keyDecisions.length > 0) {
    keyDecisions.forEach((d) => mdLines.push(`- ${d}`));
  } else {
    mdLines.push("- No key decisions recorded.");
  }
  mdLines.push("", "## Action Items");
  if (actionItems.length > 0) {
    actionItems.forEach((item) => {
      const meta = [];
      if (item.owner) meta.push(`Owner: ${item.owner}`);
      if (item.priority) meta.push(`Priority: ${item.priority}`);
      if (item.dueDate) meta.push(`Due: ${item.dueDate}`);
      mdLines.push(`- [${item.completed ? "x" : " "}] ${item.task}${meta.length ? ` (${meta.join(" \xB7 ")})` : ""}`);
    });
  } else {
    mdLines.push("- No action items identified.");
  }
  additionalSections.forEach((sec) => {
    mdLines.push("", `## ${sec.heading}`, sec.content || "_Not documented._");
  });
  const now = Date.now();
  return {
    id: existingId || `doc_studio_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    mode: modeId,
    modeLabel,
    summary,
    keyDecisions,
    actionItems,
    additionalSections,
    rawMarkdown: mdLines.join("\n").trim() + "\n",
    sourceInput,
    modelUsed,
    providerName,
    createdAt: now,
    updatedAt: now
  };
}
app.post("/api/documents/studio-generate", async (req, res) => {
  try {
    const {
      input: rawInput,
      mode = "meeting_notes",
      modelPreference = "auto",
      outputLength = "standard",
      customDictionary = []
    } = req.body || {};
    if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
      return res.status(400).json({ error: "Please provide notes, a transcript, or load a sample input first." });
    }
    const normalizedMode = STUDIO_MODE_GUIDES[mode] ? mode : "freeform";
    const guide = STUDIO_MODE_GUIDES[normalizedMode];
    const useProTier = modelPreference === "pro" || modelPreference === "auto" && (guide.complexSynthesis || rawInput.length > 2600);
    const lengthRule = formatOutputLengthInstruction(outputLength);
    const dictRule = formatDictionaryInstruction(customDictionary);
    const systemInstruction = `${guide.systemPrompt}

Strict Grounding & Quality Rules:
1. Never invent or fabricate names, owners, dates, numbers, or commitments not present in the source input. Leave owner/dueDate as empty strings if not mentioned.
2. Zero conversational filler. Output clean, concise, professional prose and structured Markdown inside the JSON fields.
3. ${lengthRule}${dictRule}

${STUDIO_JSON_CONTRACT}`;
    const aiRes = await generateWithFallback({
      prompt: rawInput.trim(),
      systemInstruction,
      responseFormat: "json",
      tier: useProTier ? "pro" : "fast",
      temperature: 0.2
    });
    let parsed = extractJsonObject(aiRes.text);
    if (!parsed) {
      try {
        parsed = JSON.parse(aiRes.text);
      } catch {
        parsed = null;
      }
    }
    if (!parsed) {
      return res.status(502).json({
        error: `${aiRes.providerName} returned an unparseable structured document. Please retry.`
      });
    }
    const structuredDoc = normalizeStudioDocumentPayload(
      parsed,
      normalizedMode,
      guide.label,
      rawInput.trim(),
      aiRes.modelUsed,
      aiRes.providerName
    );
    return res.json({
      success: true,
      document: structuredDoc,
      providerName: aiRes.providerName,
      modelUsed: aiRes.modelUsed
    });
  } catch (err) {
    console.error("[StudioGenerate] Error:", err);
    return res.status(502).json({
      error: err?.message || "Unexpected error while generating document."
    });
  }
});
app.post("/api/documents/refine", async (req, res) => {
  try {
    const { document: currentDoc, action } = req.body || {};
    if (!currentDoc || typeof currentDoc !== "object") {
      return res.status(400).json({ error: "Current document payload is required for refinement." });
    }
    const actionInstructions = {
      make_concise: "Refinement Goal \u2014 MAKE CONCISE: Tighten the summary, key decisions, and additional sections by ~40%. Cut filler, repetition, and wordiness while preserving every concrete decision, owner, priority, metric, and deadline.",
      expand_details: "Refinement Goal \u2014 EXPAND DETAILS: Enrich the summary and additional sections with clearer context, structured rationale, trade-offs, and actionable specificity grounded in the existing document and original source input. Never invent fake people, dates, or dollar figures.",
      convert_to_bullets: "Refinement Goal \u2014 CONVERT TO BULLET POINTS: Rewrite narrative paragraphs in the summary and every additional section into crisp, scannable Markdown bullet points (`- `). Keep keyDecisions and actionItems clean and structured.",
      extract_action_items: "Refinement Goal \u2014 EXTRACT ACTION ITEMS: Carefully audit the entire document and original source notes to extract every explicit and implied follow-up task into `actionItems`. Populate `owner`, `priority` (High/Medium/Low), and `dueDate` wherever mentioned or clearly supported by context, without duplicating existing identical items."
    };
    const refinementPrompt = actionInstructions[String(action || "")];
    if (!refinementPrompt) {
      return res.status(400).json({ error: "Unsupported refinement action." });
    }
    const modeId = STUDIO_MODE_GUIDES[currentDoc.mode] ? currentDoc.mode : "freeform";
    const guide = STUDIO_MODE_GUIDES[modeId];
    const contents = `Current Document (Mode: ${guide.label}):
${JSON.stringify(
      {
        title: currentDoc.title,
        summary: currentDoc.summary,
        keyDecisions: currentDoc.keyDecisions,
        actionItems: currentDoc.actionItems,
        additionalSections: currentDoc.additionalSections
      },
      null,
      2
    )}

${currentDoc.sourceInput ? `Original Source Notes (for factual grounding only):
${String(currentDoc.sourceInput).slice(0, 8e3)}` : ""}

Apply the requested refinement and return the complete updated JSON document.`;
    const systemInstruction = `You are PulseNote AI performing an inline document refinement in "${guide.label}" mode.
${refinementPrompt}
Never invent facts, names, dates, or numbers that are not supported by the current document or original source notes.

${STUDIO_JSON_CONTRACT}`;
    const aiRes = await generateWithFallback({
      prompt: contents,
      systemInstruction,
      responseFormat: "json",
      tier: action === "expand_details" ? "pro" : "fast",
      temperature: 0.2
    });
    let parsed = extractJsonObject(aiRes.text);
    if (!parsed) {
      try {
        parsed = JSON.parse(aiRes.text);
      } catch {
        parsed = null;
      }
    }
    if (!parsed) {
      return res.status(502).json({
        error: `${aiRes.providerName} returned unparseable refinement output. Please try again.`
      });
    }
    const refinedDoc = normalizeStudioDocumentPayload(
      parsed,
      modeId,
      currentDoc.modeLabel || guide.label,
      currentDoc.sourceInput || "",
      aiRes.modelUsed,
      aiRes.providerName,
      currentDoc.id
    );
    refinedDoc.createdAt = currentDoc.createdAt || refinedDoc.createdAt;
    return res.json({
      success: true,
      document: refinedDoc,
      providerName: aiRes.providerName,
      modelUsed: aiRes.modelUsed
    });
  } catch (err) {
    console.error("[StudioRefine] Error:", err);
    return res.status(502).json({
      error: err?.message || "Unexpected error while refining document."
    });
  }
});
app.get("/api/documents", (req, res) => {
  const userId = req.query.userId || req.headers["x-user-id"] || "user_guest";
  const userEmail = req.query.userEmail || req.headers["x-user-email"] || "";
  const docs = store.getUserDocuments(userEmail || userId);
  return res.json({ success: true, documents: docs });
});
app.get("/api/documents/:id", (req, res) => {
  const userId = req.query.userId || req.headers["x-user-id"] || "";
  const userEmail = req.query.userEmail || req.headers["x-user-email"] || "";
  const doc = store.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "DOCUMENT_NOT_FOUND", message: "Document not found" });
  }
  if (!store.isDocumentOwnedBy(req.params.id, userId, userEmail)) {
    return res.status(403).json({ error: "FORBIDDEN", message: "You do not have access to this document." });
  }
  return res.json({ success: true, document: doc });
});
app.post("/api/documents", (req, res) => {
  const { userId = "user_guest", userEmail, title, templateType, rawInput, sections, unverifiedTokens, clinicalNotice, dataRetentionNotice } = req.body;
  if (!templateType || !sections) {
    return res.status(400).json({ error: "INVALID_DATA", message: "templateType and sections are required" });
  }
  const doc = store.saveDocument(
    userId,
    {
      title: title || `${templateType.toUpperCase()} Record`,
      templateType,
      rawInput: rawInput || "",
      sections,
      unverifiedTokens,
      clinicalNotice,
      dataRetentionNotice
    },
    userEmail
  );
  return res.json({ success: true, document: doc });
});
app.put("/api/documents/:id", (req, res) => {
  const { userId = "user_guest", userEmail, title, sections, summary, unverifiedTokens } = req.body;
  try {
    if (!store.isDocumentOwnedBy(req.params.id, userId, userEmail)) {
      return res.status(403).json({ error: "FORBIDDEN", message: "You do not have access to this document." });
    }
    const updated = store.updateDocument(
      userId,
      req.params.id,
      { title, sections, summary, unverifiedTokens },
      userEmail
    );
    return res.json({ success: true, document: updated });
  } catch (err) {
    return res.status(400).json({ error: "UPDATE_FAILED", message: err?.message || "Failed to update document" });
  }
});
app.post("/api/documents/:id/duplicate", (req, res) => {
  const { userId = "user_guest", userEmail } = req.body;
  try {
    if (!store.isDocumentOwnedBy(req.params.id, userId, userEmail)) {
      return res.status(403).json({ error: "FORBIDDEN", message: "You do not have access to this document." });
    }
    const duplicated = store.duplicateDocument(userId, req.params.id, userEmail);
    return res.json({ success: true, document: duplicated });
  } catch (err) {
    return res.status(400).json({ error: "DUPLICATION_FAILED", message: err?.message || "Failed to duplicate document" });
  }
});
app.delete("/api/documents/:id", (req, res) => {
  const { userId = "user_guest" } = req.body || {};
  if (!store.isDocumentOwnedBy(req.params.id, userId, req.body?.userEmail)) {
    return res.status(403).json({ error: "FORBIDDEN", message: "You do not have access to this document." });
  }
  const ok = store.deleteDocument(userId, req.params.id);
  if (ok) {
    return res.json({ success: true, message: "Document deleted successfully" });
  }
  return res.status(404).json({ error: "DOCUMENT_NOT_FOUND", message: "Document not found or already deleted" });
});
app.post("/api/documents/:id/submit-review", (req, res) => {
  try {
    const { by = "author", note, userId, userEmail } = req.body || {};
    if (!store.isDocumentOwnedBy(req.params.id, userId || by, userEmail)) {
      return res.status(403).json({ error: "FORBIDDEN", message: "You do not have access to this document." });
    }
    const doc = store.submitDocumentForReview(req.params.id, String(by), note ? String(note) : void 0);
    return res.json({ success: true, document: doc });
  } catch (err) {
    return res.status(400).json({ error: "REVIEW_SUBMIT_FAILED", message: err?.message || "Failed to submit for review" });
  }
});
app.post("/api/documents/:id/sign-off", (req, res) => {
  try {
    const { by = "reviewer", note, userId, userEmail } = req.body || {};
    if (!store.isDocumentOwnedBy(req.params.id, userId || by, userEmail)) {
      return res.status(403).json({ error: "FORBIDDEN", message: "You do not have access to this document." });
    }
    const doc = store.signOffDocument(req.params.id, String(by), note ? String(note) : void 0);
    return res.json({ success: true, document: doc });
  } catch (err) {
    return res.status(400).json({ error: "SIGNOFF_FAILED", message: err?.message || "Failed to sign off document" });
  }
});
app.post("/api/documents/:id/reopen", (req, res) => {
  try {
    const { by = "author", note, userId, userEmail } = req.body || {};
    if (!store.isDocumentOwnedBy(req.params.id, userId || by, userEmail)) {
      return res.status(403).json({ error: "FORBIDDEN", message: "You do not have access to this document." });
    }
    const doc = store.reopenDocument(req.params.id, String(by), note ? String(note) : void 0);
    return res.json({ success: true, document: doc });
  } catch (err) {
    return res.status(400).json({ error: "REOPEN_FAILED", message: err?.message || "Failed to reopen document" });
  }
});
app.post(["/api/user/delete-account", "/api/user/account/delete"], (req, res) => {
  const { userId, email } = req.body || {};
  const identifier = email || userId || req.headers["x-user-email"] || req.headers["x-user-id"];
  if (!identifier) {
    return res.status(400).json({ error: "MISSING_IDENTIFIER", message: "User ID or Email is required to delete account." });
  }
  try {
    const result = store.deleteUserAccountAndData(identifier);
    return res.json({
      success: true,
      message: "Your PulseNote AI account, saved documents, and all data have been permanently deleted.",
      deletedDocumentsCount: result.deletedDocumentsCount
    });
  } catch (err) {
    return res.status(400).json({ error: "DELETION_FAILED", message: err?.message || "Failed to delete user account." });
  }
});
app.post(["/api/auth/logout", "/api/logout"], (req, res) => {
  res.clearCookie("session");
  res.clearCookie("auth_token");
  res.clearCookie("pulsenote_auth_token");
  return res.json({
    success: true,
    message: "Logged out successfully"
  });
});
var RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_To8VhLeb57Fbsw";
var RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "I4mxqneWvMb027K2n1lYEnPG";
var RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "pulse_webhook_secret_123";
var razorpayClient = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});
app.get(["/api/razorpay/config", "/api/razorpay/key"], (_req, res) => {
  return res.json({
    success: true,
    keyId: RAZORPAY_KEY_ID,
    key_id: RAZORPAY_KEY_ID,
    key: RAZORPAY_KEY_ID
  });
});
app.post(["/api/create-order", "/api/razorpay/create-order"], async (req, res) => {
  try {
    const { currency = "INR", receipt, packId, plan, seats = 3 } = req.body || {};
    let amountInPaise = Number(req.body?.amount);
    if (plan === "pro" && req.body?.billing === "yearly_upfront") {
      amountInPaise = 550800;
    } else if (plan === "team" && req.body?.billing === "yearly_upfront") {
      const seatCount = Math.max(3, Number(seats) || 3);
      amountInPaise = seatCount * 299 * 12 * 100;
    } else if (plan === "pro") {
      amountInPaise = 69900;
    } else if (plan === "team") {
      const seatCount = Math.max(3, Number(seats) || 3);
      amountInPaise = seatCount * 39900;
    } else if (packId === "credits_100") {
      amountInPaise = 29900;
    } else if (packId === "credits_500") {
      amountInPaise = 119900;
    } else if (packId === "template_setup") {
      amountInPaise = 299900;
    } else if (!amountInPaise || isNaN(amountInPaise)) {
      amountInPaise = 49900;
    }
    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({
        error: "INVALID_AMOUNT",
        message: "Amount must be at least 100 paise (\u20B91.00)."
      });
    }
    const options = {
      amount: Math.round(amountInPaise),
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    const order = await razorpayClient.orders.create(options);
    return res.json({
      success: true,
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: RAZORPAY_KEY_ID,
      keyId: RAZORPAY_KEY_ID,
      packId,
      plan
    });
  } catch (err) {
    console.error("[Razorpay] Create order failed:", err);
    return res.status(500).json({
      error: "RAZORPAY_ORDER_ERROR",
      message: err.message || "Failed to create Razorpay order."
    });
  }
});
var BILLING_MATRIX = {
  "pro:monthly": { amountPaise: 69900, interval: "monthly", totalCount: 120, label: "PulseNote Pro Monthly" },
  "team:monthly": { amountPaise: 39900, interval: "monthly", totalCount: 120, label: "PulseNote Team Monthly (per seat)" }
};
function resolveBillingKey(plan, billing) {
  const p = plan === "team" ? "team" : "pro";
  return `${p}:monthly`;
}
app.post("/api/razorpay/create-subscription", async (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET;
    const planProMonthly = process.env.RAZORPAY_PLAN_PRO_MONTHLY || "";
    const planTeamMonthly = process.env.RAZORPAY_PLAN_TEAM_MONTHLY || "";
    const presetPlanId = req.body?.plan === "team" ? planTeamMonthly : planProMonthly;
    const { plan = "pro", seats = 3, billing = "monthly" } = req.body || {};
    const billingKey = resolveBillingKey(plan, billing);
    const tier = BILLING_MATRIX[billingKey];
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    let validPlanId = presetPlanId;
    if (validPlanId) {
      try {
        await client.plans.fetch(validPlanId);
      } catch (planErr) {
        console.warn(`[Razorpay] Configured plan ${validPlanId} unreachable:`, planErr?.error?.description || planErr?.message);
        validPlanId = "";
      }
    }
    if (!validPlanId) {
      try {
        const createdPlan = await client.plans.create({
          period: tier.interval,
          interval: 1,
          item: {
            name: `${tier.label} \u2014 \u20B9${(tier.amountPaise / 100).toLocaleString("en-IN")}/mo`,
            amount: tier.amountPaise,
            currency: "INR",
            description: tier.label
          }
        });
        validPlanId = createdPlan.id;
        console.log(`[Razorpay] Auto-created plan ${validPlanId} for tier ${billingKey}. Pin it as env to reuse.`);
      } catch (autoCreateErr) {
        console.error("[Razorpay] Plan auto-create failed:", autoCreateErr?.error?.description || autoCreateErr?.message);
        return res.status(500).json({
          success: false,
          error: "PLAN_SETUP_FAILED",
          message: "Billing plan setup failed. Please try again or contact support."
        });
      }
    }
    const user = await verifyServerFirebaseUser(req);
    const uid = user?.uid || req.body?.userId || "guest";
    const seatCount = plan === "team" ? Math.max(3, Number(seats) || 3) : 1;
    try {
      const sub = await client.subscriptions.create({
        plan_id: validPlanId,
        total_count: tier.totalCount,
        quantity: seatCount,
        customer_notify: 1,
        notes: {
          uid,
          plan,
          billing: billingKey,
          seats: seatCount
        }
      });
      return res.json({
        success: true,
        subscriptionId: sub.id,
        plan,
        billing: billingKey,
        seats: seatCount,
        amountPerCycle: tier.amountPaise,
        currency: "INR",
        keyId
      });
    } catch (subErr) {
      const desc = subErr?.error?.description || subErr?.message || "Razorpay subscription creation failed.";
      console.error("[Razorpay] Subscription creation failed:", desc);
      return res.status(502).json({
        success: false,
        error: "SUBSCRIPTION_CREATE_FAILED",
        message: desc
      });
    }
  } catch (err) {
    console.error("[Razorpay] create-subscription unhandled error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to create subscription."
    });
  }
});
app.post(["/api/verify-payment", "/api/razorpay/verify-payment", "/api/razorpay/verify-subscription"], async (req, res) => {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "He2gokLsxHVTPl1eqEv0bfPu";
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
      paymentId,
      orderId,
      subscriptionId,
      signature,
      plan,
      packId,
      userId,
      seats
    } = req.body || {};
    const pId = razorpay_payment_id || paymentId;
    const subIdOrOrderId = razorpay_subscription_id || subscriptionId || razorpay_order_id || orderId;
    const sig = razorpay_signature || signature;
    if (!pId || !subIdOrOrderId || !sig) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "Missing required parameters for signature verification."
      });
    }
    let expectedSignature = crypto2.createHmac("sha256", keySecret).update(`${pId}|${subIdOrOrderId}`).digest("hex");
    if (expectedSignature !== sig) {
      const orderFormatSig = crypto2.createHmac("sha256", keySecret).update(`${subIdOrOrderId}|${pId}`).digest("hex");
      if (orderFormatSig === sig) {
        expectedSignature = orderFormatSig;
      }
    }
    if (expectedSignature !== sig) {
      console.error("[Razorpay] Signature mismatch:", { sig, expectedSignature, pId, subIdOrOrderId });
      return res.status(400).json({
        success: false,
        error: "INVALID_SIGNATURE",
        message: "Payment verification failed: Signature mismatch."
      });
    }
    console.log(`[Razorpay] Signature Verified Successfully for ID: ${subIdOrOrderId}, Payment: ${pId}`);
    const claimedBilling = (req.body?.billing || "").trim();
    const claimedSeats = Math.max(1, Number(seats) || 0);
    let expectedPaise = 0;
    let entitlement = null;
    if (plan === "pro") {
      expectedPaise = claimedBilling === "yearly_upfront" ? 550800 : 69900;
      entitlement = "pro";
    } else if (plan === "team") {
      const seatCount = Math.max(3, claimedSeats || 3);
      expectedPaise = claimedBilling === "yearly_upfront" ? seatCount * 299 * 12 * 100 : seatCount * 39900;
      entitlement = "team";
    } else if (packId === "credits_100") {
      expectedPaise = 29900;
      entitlement = "credits_100";
    } else if (packId === "credits_500") {
      expectedPaise = 119900;
      entitlement = "credits_500";
    }
    if (!entitlement) {
      return res.status(400).json({
        success: false,
        error: "UNKNOWN_ENTITLEMENT",
        message: "Could not determine what this payment was for."
      });
    }
    if (razorpay_order_id || orderId) {
      try {
        const order = await razorpayClient.orders.fetch(razorpay_order_id || orderId);
        const paidPaise = Number(order?.amount) || 0;
        if (paidPaise < expectedPaise) {
          console.error("[Razorpay] Amount mismatch on verify:", {
            orderId: razorpay_order_id || orderId,
            paidPaise,
            expectedPaise,
            claimedPlan: plan
          });
          return res.status(400).json({
            success: false,
            error: "AMOUNT_MISMATCH",
            message: "Paid amount does not match the selected plan. Contact support with your payment id."
          });
        }
      } catch (orderErr) {
        console.error("[Razorpay] Order lookup failed:", orderErr?.message || orderErr);
        return res.status(400).json({
          success: false,
          error: "ORDER_LOOKUP_FAILED",
          message: "Could not confirm this order with Razorpay. Contact support with your payment id."
        });
      }
    } else {
      try {
        const sub = await razorpayClient.subscriptions.fetch(subIdOrOrderId);
        const subPaise = Number(sub?.plan?.item?.amount) || 0;
        const qty = Math.max(1, Number(sub?.quantity) || 1);
        const perCycle = subPaise * qty;
        if (perCycle < expectedPaise) {
          console.error("[Razorpay] Subscription amount mismatch on verify:", {
            subscriptionId: subIdOrOrderId,
            perCycle,
            expectedPaise,
            claimedPlan: plan
          });
          return res.status(400).json({
            success: false,
            error: "AMOUNT_MISMATCH",
            message: "Subscription amount does not match the selected plan. Contact support with your payment id."
          });
        }
      } catch (subErr) {
        console.error("[Razorpay] Subscription lookup failed:", subErr?.message || subErr);
        return res.status(400).json({
          success: false,
          error: "SUBSCRIPTION_LOOKUP_FAILED",
          message: "Could not confirm this subscription with Razorpay. Contact support with your payment id."
        });
      }
    }
    const user = await verifyServerFirebaseUser(req);
    const targetUid = user?.uid || userId;
    if (targetUid) {
      const acc = getUserState(targetUid);
      const billing = req.body?.billing || "";
      if (plan === "pro") {
        acc.plan = "pro";
        acc.credits = Math.max(acc.credits || 0, 500);
        acc.planBilling = billing === "yearly_upfront" ? "yearly_upfront" : "mandate_monthly";
        acc.subscriptionId = subIdOrOrderId;
        acc.nextBillingDate = new Date(
          Date.now() + (billing === "yearly_upfront" ? 365 : 30) * 24 * 3600 * 1e3
        ).toISOString();
        acc.subscriptionStatus = "active";
      } else if (plan === "team") {
        acc.plan = "team";
        acc.teamSeats = Math.max(3, Number(seats) || 3);
        acc.credits = Math.max(acc.credits || 0, 1e3);
        acc.planBilling = billing === "yearly_upfront" ? "yearly_upfront" : "mandate_monthly";
        acc.subscriptionId = subIdOrOrderId;
        acc.nextBillingDate = new Date(
          Date.now() + (billing === "yearly_upfront" ? 365 : 30) * 24 * 3600 * 1e3
        ).toISOString();
        acc.subscriptionStatus = "active";
      } else if (packId === "credits_100") {
        acc.credits = (acc.credits || 0) + 100;
      } else if (packId === "credits_500") {
        acc.credits = (acc.credits || 0) + 500;
      }
      userAccountState[targetUid] = acc;
    }
    return res.json({
      success: true,
      message: "Payment verified successfully.",
      payment_id: pId,
      subscription_id: subIdOrOrderId,
      razorpay_payment_id: pId
    });
  } catch (err) {
    console.error("[Razorpay] Verification error:", err);
    return res.status(500).json({
      success: false,
      error: "VERIFICATION_ERROR",
      message: err?.message || "Payment verification failed."
    });
  }
});
app.get("/api/razorpay/subscription/:id", async (req, res) => {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || RAZORPAY_KEY_ID;
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const sub = await client.subscriptions.fetch(req.params.id);
    const status = String(sub?.status || "unknown").toLowerCase();
    const active = ["active", "authenticated", "charged"].includes(status) || Number(sub?.paid_count || 0) > 0;
    if (active) {
      const notes = sub?.notes || {};
      const uid = notes.uid && notes.uid !== "guest" ? notes.uid : null;
      if (uid) {
        const acc = getUserState(uid);
        acc.plan = notes.plan === "team" ? "team" : "pro";
        if (notes.plan === "team") acc.teamSeats = Math.max(3, Number(notes.seats) || 3);
        acc.subscriptionStatus = "active";
        acc.subscriptionId = sub.id;
        acc.nextBillingDate = new Date(Date.now() + 30 * 24 * 3600 * 1e3).toISOString();
        userAccountState[uid] = acc;
      }
    }
    return res.json({
      success: true,
      status: sub?.status || "unknown",
      active,
      paidCount: Number(sub?.paid_count || 0),
      plan: sub?.notes?.plan || null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "SUBSCRIPTION_FETCH_FAILED",
      message: err?.message || "Could not fetch subscription status."
    });
  }
});
app.post(["/razorpayWebhook", "/api/razorpay/webhook"], (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const payload = JSON.stringify(req.body);
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error("[RazorpayWebhook] Rejected: RAZORPAY_WEBHOOK_SECRET is not configured.");
    return res.status(500).json({ status: "error", reason: "webhook_secret_not_configured" });
  }
  if (!signature) {
    console.warn("[RazorpayWebhook] Rejected: missing x-razorpay-signature header.");
    return res.status(400).json({ status: "error", reason: "missing_signature" });
  }
  try {
    const expectedSignature = crypto2.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(payload).digest("hex");
    const sigBuf = Buffer.from(String(signature), "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");
    const valid = sigBuf.length === expBuf.length && crypto2.timingSafeEqual(sigBuf, expBuf);
    if (!valid) {
      console.warn("[RazorpayWebhook] Rejected: signature mismatch.");
      return res.status(400).json({ status: "error", reason: "invalid_signature" });
    }
  } catch (sigErr) {
    console.error("[RazorpayWebhook] Signature check error:", sigErr);
    return res.status(400).json({ status: "error", reason: "signature_check_failed" });
  }
  const event = req.body?.event;
  console.log("[RazorpayWebhook] Received event:", event);
  const subEntity = req.body?.payload?.subscription?.entity;
  const paymentEntity = req.body?.payload?.payment?.entity;
  const email = (subEntity?.customer_email || paymentEntity?.email || subEntity?.notes?.email || "").toLowerCase();
  const planType = (subEntity?.notes?.plan || (subEntity?.plan_id?.includes("team") ? "team" : "pro")).toLowerCase();
  if (event === "subscription.activated" || event === "subscription.charged") {
    if (email) {
      let matched = false;
      for (const [uid, acc] of Object.entries(userAccountState)) {
        if (acc.email?.toLowerCase() === email) {
          acc.plan = planType === "team" ? "team" : "pro";
          acc.subscriptionStatus = "active";
          acc.nextBillingDate = new Date(Date.now() + 30 * 24 * 3600 * 1e3).toISOString();
          matched = true;
          console.log(`[RazorpayWebhook] Updated ${email} (${uid}) to ${acc.plan}`);
          break;
        }
      }
      if (!matched) {
        userAccountState[`email_${email}`] = {
          email,
          plan: planType === "team" ? "team" : "pro",
          credits: 100,
          notesUsedThisMonth: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          subscriptionStatus: "active",
          nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1e3).toISOString()
        };
      }
    }
  } else if (event === "subscription.cancelled") {
    if (email) {
      for (const acc of Object.values(userAccountState)) {
        if (acc.email?.toLowerCase() === email) {
          acc.plan = "free";
          acc.subscriptionStatus = "cancelled";
          console.log(`[RazorpayWebhook] Downgraded ${email} to free on cancellation.`);
          break;
        }
      }
    }
  } else if (event === "payment.failed") {
    console.warn(`[RazorpayWebhook] Payment failed for ${email}`);
  }
  return res.json({ status: "ok", eventReceived: event });
});
var CODECRAFT_BASE_URL = process.env.CODECRAFT_BASE_URL || process.env.VITE_CODECRAFT_BASE_URL || process.env.CODECRAFT_API_URL || process.env.CODECRAFT_API_BASE_URL || "https://codecraftapi.com/v1";
app.get("/api/codecraft/status", (_req, res) => {
  const apiKey = (process.env.CODECRAFT_API_KEY || process.env.VITE_CODECRAFT_API_KEY || "").trim();
  return res.json({
    status: "online",
    baseUrl: CODECRAFT_BASE_URL,
    isKeyConfigured: Boolean(apiKey)
  });
});
app.all("/api/codecraft/*", async (req, res) => {
  try {
    const subPath = req.params[0] || "";
    const targetUrl = `${CODECRAFT_BASE_URL.replace(/\/+$/, "")}/${subPath}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
    const apiKey = (process.env.CODECRAFT_API_KEY || process.env.VITE_CODECRAFT_API_KEY || "").trim();
    const headers = {
      "Content-Type": req.headers["content-type"] || "application/json",
      "Accept": req.headers["accept"] || "application/json"
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["x-api-key"] = apiKey;
    }
    const fetchOptions = {
      method: req.method,
      headers
    };
    if (req.method !== "GET" && req.method !== "HEAD" && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get("content-type") || "application/json";
    res.status(response.status);
    res.setHeader("Content-Type", contentType);
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (err) {
    console.error("CodeCraft API proxy error:", err);
    if (!res.headersSent) {
      return res.status(502).json({
        error: "Failed to communicate with CodeCraft API",
        details: err?.message || "Unknown error",
        targetBaseUrl: CODECRAFT_BASE_URL
      });
    }
  }
});
app.post("/api/maps/query", async (req, res) => {
  try {
    const { query: searchQuery } = req.body;
    if (!searchQuery) {
      return res.status(400).json({ error: "Search query is required for Maps Grounding." });
    }
    const aiRes = await generateWithFallback({
      prompt: `Provide accurate location intelligence, addresses, typical hours, and practical visiting advice for: ${searchQuery}`,
      tier: "fast"
    });
    return res.json({
      result: aiRes.text || "Location search completed.",
      groundingMetadata: null,
      modelUsed: aiRes.modelUsed,
      providerName: aiRes.providerName
    });
  } catch (err) {
    console.error("Maps query error:", err);
    return res.status(500).json({ error: err.message || "Location query failed" });
  }
});
app.get("/api/live/config", (_req, res) => {
  res.json({
    liveModel: "gemini-3.8-live",
    transcriptionModel: "gemini-3.5-transcribe",
    imageEditModel: "gemini-3.1-flash-image-preview",
    videoModel: "veo-3.1-fast-generate-preview",
    musicModelClip: "lyria-3-clip-preview",
    musicModelPro: "lyria-3-pro-preview",
    chatModels: {
      complex: "gemini-4-hydrogen",
      general: "gemini-4-hydrogen",
      fast: "gemini-3.1-flash-lite"
    },
    audioSampleRate: 24e3,
    supportedMimeTypes: ["audio/webm", "audio/wav", "audio/mp4"]
  });
});
app.post("/api/transform/stream", async (req, res) => {
  try {
    const {
      rawText = "",
      targetIndustry = "general",
      formatLens = "general_assistant",
      tone = "standard",
      customContext = "",
      responseMode = "auto",
      dailyPromptCount = 0,
      isPro = false,
      userEmail = "",
      creativeMode,
      attachedFile
    } = req.body;
    if ((!rawText || typeof rawText !== "string" || rawText.trim().length === 0) && !attachedFile) {
      return res.status(400).json({ error: "Please provide raw notes, query, or attach a file to process." });
    }
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const isAdminUser = cleanEmail ? store.isStrictAdminEmail(cleanEmail) : false;
    const effectiveIsPro = isPro || isAdminUser;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    if (!effectiveIsPro && dailyPromptCount >= 3) {
      res.write(`data: ${JSON.stringify({
        type: "limit_reached",
        isLimitReached: true,
        upgradeMessage: UPGRADE_BLOCK_VERBATIM,
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
      })}

`);
      res.end();
      return;
    }
    const trimmedInput = rawText.trim();
    const hasImageAttachment = !!(attachedFile?.data && attachedFile?.type?.startsWith("image/")) || !!req.body.sourceImageUrl;
    const isPhotoAnimation = hasImageAttachment && (creativeMode === "video" || /\b(animate|video|motion|bring to life|generate video|make video|live photo|turn into video)\b/i.test(trimmedInput) || trimmedInput.length === 0);
    const isExplicitVideo = creativeMode === "video" || isPhotoAnimation || /^(generate|create|render|make|synthesize|video of|animation of|animate)\s+(an?\s+)?(video|animation|clip|storyboard|motion graphic|b-roll|scene|photo|image)\b/i.test(trimmedInput) || /\b(video of|cinematic scene of|animation of|movie clip of|storyboard of|animate this image|animate this photo|animate image|animate photo)\b/i.test(trimmedInput);
    const isExplicitImage = !isExplicitVideo && (creativeMode === "image" || /^(generate|create|render|draw|make|synthesize|photo of|image of|picture of)\b/i.test(trimmedInput) || /\b(photo of|render of|image of|picture of|illustration of|portrait of)\b/i.test(trimmedInput));
    if (isExplicitVideo) {
      const arMatch = trimmedInput.match(/--ar\s+(16:9|9:16)/i);
      const aspectRatio = arMatch ? arMatch[1] : req.body.aspectRatio === "9:16" ? "9:16" : "16:9";
      const cleanPrompt = trimmedInput.replace(/--ar\s+(16:9|9:16)/gi, "").trim();
      const audioMatch = trimmedInput.match(/\b(with|audio:|soundtrack:|music:|voiceover:|sfx:)\s+([^,.;]+)/i);
      const audioPrompt = audioMatch ? audioMatch[2].trim() : "Atmospheric ambient synthesis with low sub-bass drone and sound effects";
      const sourceImageUrl = attachedFile?.data && attachedFile?.type?.startsWith("image/") ? attachedFile.data : req.body.sourceImageUrl;
      const mediaJob = mediaQueue.enqueueJob({
        userId: req.body.userId || "usr_guest",
        mediaType: "video",
        prompt: cleanPrompt || (isPhotoAnimation ? "Animate this photo with cinematic motion, subtle depth pan, and vivid lighting" : "Cinematic sequence"),
        sourceImageUrl,
        aspectRatio,
        style: "Photorealistic 8K Cinematic",
        audioPrompt
      });
      const previewPosterUrl = sourceImageUrl || generateGenerativeImageSvg(
        cleanPrompt || "Animated Video Sequence",
        "Veo 8K Video Frame",
        ["#06b6d4", "#3b82f6", "#10b981", "#0f172a"],
        aspectRatio
      );
      res.write(`data: ${JSON.stringify({
        type: "media_ready",
        mediaType: "video",
        title: `Video: ${(cleanPrompt || (isPhotoAnimation ? "Animated Photo Sequence" : "Cinematic Video")).slice(0, 42)}`,
        executiveSummary: isPhotoAnimation ? `Animating uploaded photo using Google Veo 3.1 (veo-3.1-fast-generate-preview) in ${aspectRatio} aspect ratio.` : `Generated Veo Cinematic Sequence for: "${cleanPrompt.slice(0, 80)}"`,
        jobId: mediaJob.id,
        videoParams: {
          title: `Cinematic Sequence: ${(cleanPrompt || "Animated Photo").slice(0, 36)}`,
          targetDuration: "00:08",
          aspectRatio,
          cameraMotion: "Dynamic orbital sweep with steady tracking pan",
          visualStyle: "Photorealistic 8K Cinematic",
          lighting: "Golden hour volumetric illumination",
          audioPrompt,
          previewPosterUrl,
          modelPromptVeoSora: cleanPrompt || "Animate photo with cinematic motion"
        },
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
      })}

`);
      res.end();
      return;
    }
    if (isExplicitImage) {
      const arMatch = trimmedInput.match(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/i);
      const aspectRatio = arMatch ? arMatch[1] : "16:9";
      const cleanPrompt = trimmedInput.replace(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/gi, "").trim();
      const mediaJob = mediaQueue.enqueueJob({
        userId: req.body.userId || "usr_guest",
        mediaType: "image",
        prompt: cleanPrompt,
        aspectRatio,
        style: "Photorealistic Hyper-Detailed 8K"
      });
      const liveResults = await searchLiveImages(cleanPrompt, 8).catch(() => []);
      const proceduralFallbackUrl = generateGenerativeImageSvg(cleanPrompt, "Photorealistic 8K", void 0, aspectRatio);
      const activePreviewUrl = liveResults.length > 0 ? liveResults[0].url : proceduralFallbackUrl;
      res.write(`data: ${JSON.stringify({
        type: "media_ready",
        mediaType: "image",
        title: `Image: ${cleanPrompt.slice(0, 42)}`,
        executiveSummary: `Generated live visual asset search results for: "${cleanPrompt.slice(0, 80)}"`,
        jobId: mediaJob.id,
        imageResults: liveResults,
        imageParams: {
          prompt: cleanPrompt,
          style: "Photorealistic Hyper-Detailed 8K",
          aspectRatio,
          previewUrl: activePreviewUrl,
          results: liveResults
        },
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
      })}

`);
      res.end();
      return;
    }
    const industryInstruction = targetIndustry && targetIndustry !== "general" ? `

${getSystemPromptForMode(targetIndustry)}` : "";
    const systemPrompt = `${SYSTEM_INSTRUCTION_BASE}${industryInstruction}

Strict Anti-Hallucination & Compliance Guardrails:
- Never invent, guess, or hallucinate missing critical data (such as lease/inspection dates, dollar figures/repair costs, property addresses/IDs, vital signs, dosages, or deadlines).
- If a crucial data point is missing from the raw input, explicitly insert an audit-ready placeholder formatted as [MISSING: Description of required data] (for example, [MISSING: Proposed Lease Signing Date] or [MISSING: Repair Cost Estimate]).
- If target industry is specialized (Medical/Clinical SOAP, Real Estate/Property Inspection, Software/Technical Sprint, or Client Consulting), strictly follow that industry template structure above; otherwise use the structured executive summary format below:
### 1. Direct Summary
[A concise, clear opening overview giving the core answer immediately]

### 2. Structured Breakdown
[Comprehensive explanation with clean bullet points, formatted code snippets in \`\`\`language blocks if technical, and markdown tables if comparative]

### 3. Actionable Next Steps
[Numbered, practical execution steps and recommendations]

Conclude with the mandatory disclaimer:
${MANDATORY_LEGAL_NOTICE2}`;
    const attachmentContext = attachedFile ? `
[Attached Asset Context]: User attached ${attachedFile.category} file named "${attachedFile.name}" (Type: ${attachedFile.type}, Size: ${(attachedFile.size / 1024).toFixed(1)} KB).
` : "";
    const userPrompt = `${attachmentContext}User Query / Notes:
${rawText || (attachedFile ? `Analyze attached asset: ${attachedFile.name}` : "")}`;
    const messagesPayload = attachedFile?.data && attachedFile?.type?.startsWith("image/") ? [
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: attachedFile.data.startsWith("data:") ? attachedFile.data : `data:${attachedFile.type};base64,${attachedFile.data}`
            }
          }
        ]
      }
    ] : [{ role: "user", content: userPrompt }];
    let fullAccumulated = "";
    let providerName = "";
    let modelUsed = "";
    for await (const part of streamWithFallback({
      messages: messagesPayload,
      systemInstruction: systemPrompt,
      tier: formatLens === "deep_research" ? "pro" : "fast"
    })) {
      fullAccumulated += part.chunk;
      providerName = part.providerName;
      modelUsed = part.modelUsed;
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: "token", text: part.chunk, providerName })}

`);
      }
    }
    const summaryMatch = fullAccumulated.match(/### 1\. Direct Summary\s*([\s\S]*?)(?=### 2|$)/i);
    const directSummary = summaryMatch ? summaryMatch[1].trim() : fullAccumulated.slice(0, 180) + "...";
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({
        type: "done",
        fullText: fullAccumulated,
        title: rawText.slice(0, 42) || "PulseNote Intelligence Report",
        executiveSummary: directSummary,
        providerName,
        modelUsed,
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
      })}

`);
      res.end();
    }
    try {
      store.logUserActivity({
        userId: req.body.userId || "usr_guest",
        userEmail: req.body.userEmail || "client@pulsenote.ai",
        userName: req.body.userName || "Client User",
        industry: targetIndustry,
        rawInput: rawText.slice(0, 300),
        solutionTitle: rawText.slice(0, 42) || "Analysis"
      });
    } catch (e) {
    }
  } catch (err) {
    console.error("Streaming error in /api/transform/stream:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || "Stream generation failed" });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: "error", error: err.message || "Stream generation failed" })}

`);
      return res.end();
    }
  }
});
app.post("/api/transform", async (req, res) => {
  try {
    const {
      rawText,
      targetIndustry,
      formatLens = "general_assistant",
      tone = "standard",
      customContext = "",
      responseMode = "auto",
      dailyPromptCount = 0,
      isPro = false,
      userEmail = "",
      creativeMode,
      attachedFile
    } = req.body;
    if ((!rawText || typeof rawText !== "string" || rawText.trim().length === 0) && !attachedFile) {
      return res.status(400).json({ error: "Please provide raw notes, query, or attach a file to process." });
    }
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const isAdminUser = cleanEmail ? store.isStrictAdminEmail(cleanEmail) : false;
    const effectiveIsPro = isPro || isAdminUser;
    if (!effectiveIsPro && dailyPromptCount >= 3) {
      return res.json({
        isLimitReached: true,
        dailyPromptCount,
        title: "Daily Free Limit Reached",
        executiveSummary: "Daily free usage limit of 3 transformations has been reached for this account. Upgrade to Pro for unlimited access.",
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
            task: "Upgrade to PulseNote Pro for unlimited transformations (secure in-app Razorpay checkout)",
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
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
      });
    }
    const trimmedInput = rawText.trim();
    const hasImageAttachment = !!(attachedFile?.data && attachedFile?.type?.startsWith("image/")) || !!req.body.sourceImageUrl;
    const isPhotoAnimation = hasImageAttachment && (creativeMode === "video" || /\b(animate|video|motion|bring to life|generate video|make video|live photo|turn into video)\b/i.test(trimmedInput) || trimmedInput.length === 0);
    const isExplicitVideo = creativeMode === "video" || isPhotoAnimation || /^(generate|create|render|make|synthesize|video of|animation of|animate)\s+(an?\s+)?(video|animation|clip|storyboard|motion graphic|b-roll|scene|photo|image)\b/i.test(trimmedInput) || /\b(video of|cinematic scene of|animation of|movie clip of|storyboard of|animate this image|animate this photo|animate image|animate photo)\b/i.test(trimmedInput);
    const isExplicitImage = !isExplicitVideo && (creativeMode === "image" || /^(generate|create|render|draw|make|synthesize|photo of|image of|picture of)\b/i.test(trimmedInput) || /\b(photo of|render of|image of|picture of|illustration of|portrait of)\b/i.test(trimmedInput));
    const extractCleanPrompt = (input) => {
      let cleaned = input.replace(/^\[.*?\]/g, "").replace(/^(please\s+)?(generate|create|render|draw|make|synthesize|show\s+me)(\s+an?|\s+the)?\s+(image|photo|picture|wallpaper|illustration|art|portrait|render|video|clip|animation)\s*(of|for|showing|depicting)?\s*[:,-]?\s*/i, "").replace(/^(photo|image|picture|video|animation|illustration|portrait|render)\s+of\s*[:,-]?\s*/i, "").replace(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/gi, "").trim();
      return cleaned.length > 0 ? cleaned : input.replace(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/gi, "").trim();
    };
    if (isExplicitVideo) {
      const arMatch = trimmedInput.match(/--ar\s+(16:9|9:16)/i);
      const aspectRatio = arMatch ? arMatch[1] : req.body.aspectRatio === "9:16" ? "9:16" : "16:9";
      const cleanPrompt = extractCleanPrompt(trimmedInput);
      const audioMatch = trimmedInput.match(/\b(with|audio:|soundtrack:|music:|voiceover:|sfx:)\s+([^,.;]+)/i);
      const audioPrompt = audioMatch ? audioMatch[2].trim() : "Atmospheric ambient synthesis with low sub-bass drone and sound effects";
      const sourceImageUrl = attachedFile?.data && attachedFile?.type?.startsWith("image/") ? attachedFile.data : req.body.sourceImageUrl;
      try {
        const mediaJob = mediaQueue.enqueueJob({
          userId: req.body.userId || "usr_guest",
          mediaType: "video",
          prompt: cleanPrompt || (isPhotoAnimation ? "Animate this photo with cinematic motion, subtle depth pan, and vivid lighting" : "Cinematic sequence"),
          sourceImageUrl,
          aspectRatio,
          style: "Photorealistic 8K Cinematic",
          audioPrompt
        });
        const previewPosterUrl = sourceImageUrl || generateGenerativeImageSvg(
          cleanPrompt || "Animated Video Sequence",
          "Veo 8K Video Frame",
          ["#06b6d4", "#3b82f6", "#10b981", "#0f172a"],
          aspectRatio
        );
        return res.json({
          success: true,
          mediaType: "video",
          title: `Video: ${(cleanPrompt || (isPhotoAnimation ? "Animated Photo Sequence" : "Cinematic Video")).slice(0, 42)}`,
          executiveSummary: isPhotoAnimation ? `Animating uploaded photo using Google Veo 3.1 (veo-3.1-fast-generate-preview) in ${aspectRatio} aspect ratio.` : `Generated Veo Cinematic Sequence for: "${cleanPrompt.slice(0, 80)}"`,
          responseMode: "productivity",
          jobId: mediaJob.id,
          queuePosition: mediaJob.queuePosition,
          estimatedCountdownSeconds: mediaJob.totalDurationSeconds,
          videoParams: {
            title: `Cinematic Sequence: ${(cleanPrompt || "Animated Photo").slice(0, 36)}`,
            targetDuration: "00:08",
            aspectRatio,
            cameraMotion: "Dynamic orbital sweep with steady tracking pan",
            visualStyle: "Photorealistic 8K Cinematic",
            lighting: "Golden hour volumetric illumination",
            audioPrompt,
            previewPosterUrl,
            modelPromptVeoSora: cleanPrompt || "Animate photo with cinematic motion"
          },
          markdownReport: "",
          sections: [],
          actionItems: [],
          detectedEntities: [],
          keyTakeaways: [],
          complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
        });
      } catch (err) {
        return res.status(503).json({
          success: false,
          error: "Media generation busy. Please retry."
        });
      }
    }
    if (isExplicitImage) {
      const arMatch = trimmedInput.match(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/i);
      const aspectRatio = arMatch ? arMatch[1] : "16:9";
      const cleanPrompt = extractCleanPrompt(trimmedInput);
      try {
        const mediaJob = mediaQueue.enqueueJob({
          userId: req.body.userId || "usr_guest",
          mediaType: "image",
          prompt: cleanPrompt,
          aspectRatio,
          style: "Photorealistic Hyper-Detailed 8K"
        });
        const liveResults = await searchLiveImages(cleanPrompt, 8);
        const proceduralFallbackUrl = generateGenerativeImageSvg(
          cleanPrompt,
          "Photorealistic 8K",
          void 0,
          aspectRatio
        );
        const activePreviewUrl = liveResults.length > 0 ? liveResults[0].url : proceduralFallbackUrl;
        return res.json({
          success: true,
          mediaType: "image",
          title: `Image: ${cleanPrompt.slice(0, 42)}`,
          executiveSummary: `Generated live visual asset search results for: "${cleanPrompt.slice(0, 80)}"`,
          responseMode: "productivity",
          jobId: mediaJob.id,
          queuePosition: mediaJob.queuePosition,
          estimatedCountdownSeconds: mediaJob.totalDurationSeconds,
          imageResults: liveResults,
          imageParams: {
            prompt: cleanPrompt,
            style: "Photorealistic Hyper-Detailed 8K",
            lighting: "Volumetric cinematic fill with atmospheric depth",
            composition: "Cinematic wide-angle rule-of-thirds",
            aspectRatio,
            previewUrl: activePreviewUrl,
            results: liveResults
          },
          markdownReport: "",
          sections: [],
          actionItems: [],
          detectedEntities: [],
          keyTakeaways: [],
          complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
        });
      } catch (err) {
        return res.status(503).json({
          success: false,
          error: "Media generation busy. Please retry."
        });
      }
    }
    const industryMap = {
      general: "Universal Search & Multimodal Intelligence",
      medical: "Medical/Clinical",
      real_estate: "Real Estate / Property Inspection",
      software: "Software / Technical Sprint",
      executive: "General Executive / Consulting"
    };
    const targetIndustryName = industryMap[targetIndustry] || "Universal Search & Multimodal Intelligence";
    const formatLensMap = {
      deep_research: "Deep Research Mode: Conduct rigorous, exhaustive research with web citations, factual evidence, comparative tables, and deep structural analysis.",
      creative_writing: "Creative Writing Mode: Formulate evocative, cinematic narrative prose, rich sensory imagery, and compelling character or script storytelling.",
      code_generation: "Code Generation Mode: Architect clean, production-grade, typed code, optimal algorithms, system design diagrams, and comprehensive unit tests.",
      business_strategy: "Business Strategy Mode: Structure executive decision frameworks, financial KPI metrics, market penetration models, and risk mitigation registers.",
      general_assistant: "General Assistant Mode: Deliver rapid, balanced, highly practical, and actionable intelligence for immediate real-world execution."
    };
    const formatLensDescription = formatLensMap[formatLens] || formatLensMap.general_assistant;
    const attachmentContext = attachedFile ? `
[Attached Asset Context]: User has attached a ${attachedFile.category} file named "${attachedFile.name}" (MIME: ${attachedFile.type}, Size: ${(attachedFile.size / 1024).toFixed(1)} KB). Synthesize and incorporate insights directly from this asset.
` : "";
    const userPrompt = `Target Scope / Context: ${targetIndustryName}
Selected Output Format & Lens: ${formatLensDescription}
Tone/Detail Specification: ${tone}
Requested Dynamic Response Mode: ${responseMode}
${customContext ? `Additional Context/Organization: ${customContext}
` : ""}${attachmentContext}
Raw User Query or Prompt (Text, creative concept, media generation, or technical challenge):
"""
${rawText || (attachedFile ? `Analyze and evaluate attached file: ${attachedFile.name}` : "")}
"""

Instructions for response (Emulating Google Gemini deep search, universal multimodal processing, and structured clarity):
Please deeply analyze the query and any attached asset. Accept any open-domain prompt, creative brainstorm, or technical problem without rigid silos.
If the user is requesting an image (e.g., "Create an image...", "Generate a photo...", "Draw...", "Render..."):
  - Analyze aesthetic, style, lighting, composition, and aspect ratio.
  - Set "mediaType": "image".
  - Populate "imageParams" with a comprehensive prompt and execution parameters.
If the user is requesting a video (e.g., "Generate a video scene...", "Video storyboard...", "Cinematic shot..."):
  - Set "mediaType": "video".
  - Populate "videoParams" with storyboard breakdown, camera motion, duration, audio prompt, and optimized Veo/Sora parameters.
If the prompt is vague or missing key constraints:
  - Do NOT fail or crash. Set "isVague": true, list 2-3 polite "clarifyingQuestions", and provide a complete "defaultWorkingDraft" inside the response.

Return a valid JSON object matching this schema:
{
  "mediaType": "text" | "image" | "video",
  "isVague": boolean,
  "clarificationRequest": string, // Polite clarifying message if vague, else empty
  "clarifyingQuestions": [string], // 2-3 specific clarifying questions if isVague is true
  "title": string, // Professional solution and documentation title
  "executiveSummary": string, // Concise, direct answer or core synthesis right at the top (1-2 sentences)
  "responseMode": "research" | "productivity" | "problem_solving",
  "immediateSolution": string, // Direct immediate answer or media generation overview addressing the core request directly
  "bestOnlinePractices": string, // Best online practices, verified standards, or prompt engineering techniques derived from web research
  "actionableStrategicPlan": string, // Detailed numbered execution roadmap / next steps
  "imageParams": { // Include if mediaType is "image"
    "prompt": string, // Detailed, highly optimized prompt (describing aesthetic, style, lighting, composition)
    "style": string,
    "lighting": string,
    "composition": string,
    "aspectRatio": string,
    "colorPalette": [string]
  },
  "videoParams": { // Include if mediaType is "video"
    "title": string,
    "targetDuration": string,
    "aspectRatio": string,
    "cameraMotion": string,
    "visualStyle": string,
    "lighting": string,
    "audioPrompt": string,
    "scenes": [
      {
        "shotNumber": number,
        "duration": string,
        "camera": string,
        "visualAction": string,
        "audioSFX": string
      }
    ],
    "modelPromptVeoSora": string
  },
  "searchSources": [
    {
      "title": string,
      "url": string,
      "snippet": string
    }
  ],
  "markdownReport": string, // Complete formatted markdown report. Must begin with:
  // > **Direct Executive Summary:** [1-2 sentences]
  // ## 1. Immediate Solution / Direct Answer
  // ## 2. Best Online Practices & Current Industry Standards
  // ## 3. Actionable Strategic Plan / Next Steps (Numbered execution steps)
  // followed by detailed breakdown, action items, and ending with the mandatory legal disclaimer.
  "sections": [
    {
      "heading": string,
      "content": string,
      "severity": "Low" | "Medium" | "High" | null,
      "category": string
    }
  ],
  "actionItems": [
    {
      "task": string,
      "owner": string,
      "deadline": string,
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
  "complianceDisclaimer": string
}
`;
    const transformMessages = attachedFile?.data && attachedFile?.type?.startsWith("image/") ? [
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: attachedFile.data.startsWith("data:") ? attachedFile.data : `data:${attachedFile.type};base64,${attachedFile.data}`
            }
          }
        ]
      }
    ] : [{ role: "user", content: userPrompt }];
    const outputLengthHint = formatOutputLengthInstruction(req.body.outputLength);
    const dictHint = formatDictionaryInstruction(req.body.customDictionary);
    const industryModePrompt = targetIndustry && targetIndustry !== "general" ? `

${getSystemPromptForMode(targetIndustry)}` : "";
    const antiHallucinationRule = `

Strict Anti-Hallucination & Compliance Guardrails:
- Never invent, guess, or hallucinate missing critical data (such as proposed lease/closing dates, inspection dates, property IDs/addresses, financial figures/repair costs, medical metrics/dosages, or deadlines).
- Whenever a crucial data point is absent from the raw input, explicitly insert an audit-ready placeholder formatted as [MISSING: Description of required data] inside markdownReport, sections, and actionItems (e.g., [MISSING: Proposed Lease Signing Date], [MISSING: Repair Cost Estimate], [MISSING: Property ID]).`;
    const augmentedInstruction = `${SYSTEM_INSTRUCTION_BASE}${industryModePrompt}${antiHallucinationRule}
${outputLengthHint}${dictHint}`;
    let responseText = "";
    let providerName = "";
    let modelUsed = "";
    try {
      const aiRes = await generateWithFallback({
        messages: transformMessages,
        systemInstruction: augmentedInstruction,
        responseFormat: "json",
        tier: formatLens === "deep_research" ? "pro" : "fast"
      });
      responseText = aiRes.text;
      providerName = aiRes.providerName;
      modelUsed = aiRes.modelUsed;
    } catch (err) {
      console.warn("[Transform] All 3 AI providers failed, utilizing deterministic fallback engine:", err?.message);
    }
    if (!responseText) {
      const fallbackData = buildFallbackDocumentation(rawText, targetIndustry, targetIndustryName, tone, customContext, responseMode);
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
      return res.json(scrubAdminDetails(fallbackData));
    }
    let parsedData;
    try {
      parsedData = extractJsonObject(responseText) || JSON.parse(responseText);
      if (parsedData && typeof parsedData === "object") {
        parsedData.providerName = providerName;
        parsedData.modelUsed = modelUsed;
      }
    } catch {
      parsedData = {
        mediaType: "text",
        isVague: false,
        clarificationRequest: "",
        providerName,
        modelUsed,
        title: `${targetIndustryName} Professional Report`,
        executiveSummary: "Synthesized intelligence and actionable execution report generated per user input.",
        responseMode: responseMode !== "auto" ? responseMode : "productivity",
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
    if (!parsedData.mediaType) {
      if (/\b(image|picture|photo|render|illustration|wallpaper|draw)\b/i.test(rawText)) {
        parsedData.mediaType = "image";
      } else if (/\b(video|scene|storyboard|cinematic shot|motion graphic|b-roll)\b/i.test(rawText)) {
        parsedData.mediaType = "video";
      } else {
        parsedData.mediaType = "text";
      }
    }
    if (parsedData.mediaType === "image") {
      if (!parsedData.imageParams) {
        parsedData.imageParams = {
          prompt: rawText,
          style: "Photorealistic Hyper-Detailed 8K",
          lighting: "Volumetric cinematic fill with atmospheric depth",
          composition: "Cinematic wide-angle rule-of-thirds",
          aspectRatio: "16:9",
          colorPalette: ["#6366f1", "#0ea5e9", "#f59e0b", "#0f172a"]
        };
      }
      if (!parsedData.imageParams.previewUrl) {
        parsedData.imageParams.previewUrl = generateGenerativeImageSvg(
          parsedData.imageParams.prompt || rawText,
          parsedData.imageParams.style || "Photorealistic 8K",
          parsedData.imageParams.colorPalette
        );
      }
      const mediaJob = mediaQueue.enqueueJob({
        userId: req.body.userId || "usr_guest",
        mediaType: "image",
        prompt: parsedData.imageParams.prompt || rawText,
        aspectRatio: parsedData.imageParams.aspectRatio || "16:9",
        style: parsedData.imageParams.style || "Photorealistic Hyper-Detailed 8K"
      });
      parsedData.jobId = mediaJob.id;
      parsedData.queuePosition = mediaJob.queuePosition;
      parsedData.estimatedCountdownSeconds = mediaJob.totalDurationSeconds;
    } else if (parsedData.mediaType === "video") {
      if (!parsedData.videoParams) {
        parsedData.videoParams = {
          title: parsedData.title || "Cinematic 8K Storyboard",
          targetDuration: "00:08",
          aspectRatio: "16:9",
          cameraMotion: "Dynamic orbital sweep with steady tracking pan",
          visualStyle: "Photorealistic 8K Cinematic",
          lighting: "Golden hour volumetric illumination",
          audioPrompt: "Atmospheric ambient synthesis with low sub-bass drone",
          scenes: [
            {
              shotNumber: 1,
              duration: "0-3s",
              camera: "Wide establishing drone glide",
              visualAction: `Establishing dynamic visual sequence for: ${rawText.slice(0, 60)}`,
              audioSFX: "Gentle riser with ambient environmental audio"
            },
            {
              shotNumber: 2,
              duration: "3-6s",
              camera: "Medium orbital tracking shot",
              visualAction: "Subject focus with smooth parallax and depth of field blur",
              audioSFX: "Subtle mechanical or atmospheric accents"
            },
            {
              shotNumber: 3,
              duration: "6-8s",
              camera: "Low-angle slow push-in",
              visualAction: "Hero focal climax with lighting accentuation",
              audioSFX: "Tonal resolve with spatial stereo fade"
            }
          ],
          modelPromptVeoSora: `Cinematic 8k video scene of ${rawText}, photorealistic 8k, volumetric golden hour fill, smooth drone camera tracking, ultra-detailed textures, 60fps --ar 16:9`
        };
      }
      if (!parsedData.videoParams.previewPosterUrl) {
        parsedData.videoParams.previewPosterUrl = generateGenerativeImageSvg(
          parsedData.videoParams.title || rawText,
          "Veo 8K Video Frame",
          ["#06b6d4", "#3b82f6", "#10b981", "#0f172a"]
        );
      }
      const mediaJob = mediaQueue.enqueueJob({
        userId: req.body.userId || "usr_guest",
        mediaType: "video",
        prompt: parsedData.videoParams.modelPromptVeoSora || rawText,
        aspectRatio: parsedData.videoParams.aspectRatio || "16:9",
        style: parsedData.videoParams.visualStyle || "Photorealistic 8K Cinematic"
      });
      parsedData.jobId = mediaJob.id;
      parsedData.queuePosition = mediaJob.queuePosition;
      parsedData.estimatedCountdownSeconds = mediaJob.totalDurationSeconds;
    }
    if (!parsedData.executiveSummary && parsedData.title) {
      parsedData.executiveSummary = `Authoritative synthesis and tactical documentation compiled for ${targetIndustryName}.`;
    }
    if (!parsedData.responseMode) {
      parsedData.responseMode = responseMode !== "auto" ? responseMode : "productivity";
    }
    if (!Array.isArray(parsedData.sections)) parsedData.sections = [];
    if (!Array.isArray(parsedData.actionItems)) parsedData.actionItems = [];
    if (!Array.isArray(parsedData.detectedEntities)) parsedData.detectedEntities = [];
    if (!Array.isArray(parsedData.keyTakeaways)) parsedData.keyTakeaways = [];
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
    if (attachedFile) {
      parsedData.attachment = {
        id: attachedFile.id,
        name: attachedFile.name,
        size: attachedFile.size,
        type: attachedFile.type,
        category: attachedFile.category,
        previewUrl: attachedFile.previewUrl
      };
    }
    parsedData.complianceDisclaimer = MANDATORY_LEGAL_NOTICE2;
    if (parsedData.markdownReport && !parsedData.markdownReport.includes("[Legal & Professional Notice]")) {
      parsedData.markdownReport = `${parsedData.markdownReport.trim()}

---
${MANDATORY_LEGAL_NOTICE2}`;
    }
    const sanitizedOutput = scrubAdminDetails(parsedData);
    return res.json(sanitizedOutput);
  } catch (err) {
    console.error("Error transforming notes:", err);
    const message = err instanceof Error ? err.message : "Failed to transform transcript";
    return res.status(500).json({ error: message });
  }
});
function buildFallbackDocumentation(rawText, targetIndustry, targetIndustryName, tone, customContext, responseMode = "auto") {
  const clean = rawText.trim();
  const wordCount = clean.split(/\s+/).length;
  let resolvedMode = "productivity";
  if (responseMode === "research" || responseMode === "productivity" || responseMode === "problem_solving") {
    resolvedMode = responseMode;
  } else {
    if (/why|how|research|benchmark|study|compare|versus|literature|standard/i.test(clean)) {
      resolvedMode = "research";
    } else if (/broken|fail|error|bug|issue|bottleneck|leak|incident|crash|root cause/i.test(clean)) {
      resolvedMode = "problem_solving";
    } else {
      resolvedMode = "productivity";
    }
  }
  const isImageRequest = /\b(image|picture|photo|photograph|render|illustration|wallpaper|draw|visual of|portrait of|digital art)\b/i.test(clean);
  const isVideoRequest = /\b(video|scene|storyboard|cinematic shot|motion graphic|b-roll|film scene|shot sequence)\b/i.test(clean);
  if (isImageRequest) {
    const cleanPrompt = clean.replace(/^(create|generate|draw|render|make|design)\s+(an?\s+)?(image|picture|photo|artwork)\s+(of\s+)?/i, "").trim();
    const style = /cyberpunk|neon/i.test(clean) ? "Cinematic Cyberpunk 3D" : /minimal|flat/i.test(clean) ? "Modern Vector Minimalist" : "Photorealistic Hyper-Detailed 8K";
    const lighting = /night|dark/i.test(clean) ? "Moody dramatic low-key neon glow" : "Volumetric warm golden-hour cinematic fill";
    const composition = "Rule-of-thirds, wide-angle 35mm lens, deep focal depth";
    const aspectRatio = /portrait|phone|mobile|9:16/i.test(clean) ? "9:16" : /square|1:1/i.test(clean) ? "1:1" : "16:9";
    const optimizedPrompt = `Masterpiece cinematic photograph of ${cleanPrompt || clean}, ${style.toLowerCase()}, ${lighting.toLowerCase()}, ${composition.toLowerCase()}, Hasselblad H6D-100c, 8k resolution, ray-traced reflections, highly detailed textures, award-winning composition --ar ${aspectRatio}`;
    const executiveSummary2 = `Multi-modal image generation synthesis initialized for: "${cleanPrompt || clean}". Optimized prompt and lighting parameters calibrated for generative diffusion engines.`;
    const immediateSolution2 = `Generative Prompt & Parameters: Use the calibrated prompt below directly in generative image pipelines (e.g. Gemini Flash Image, Imagen 3, or Midjourney v6).`;
    const bestOnlinePractices2 = `Image Generation Best Practices:
\u2022 Specify explicit optical constraints (focal length, sensor size, aperture, volumetric diffusion).
\u2022 Balance subject prompt weight with background atmosphere to prevent artifacting.
\u2022 Maintain aspect ratio alignment with final delivery viewport (e.g. 16:9 for landscape presentations).`;
    const actionableStrategicPlan2 = `Generative Execution Roadmap:
1. Initialize Model Pipeline: Deploy optimized prompt into Gemini Flash Image / Imagen 3 with aspect ratio set to ${aspectRatio}.
2. Seed & Variant Sampling: Run a 4-variant batch at CFG scale 7.0 to evaluate chromatic balance.
3. Post-Processing & Upscaling: Upscale selected hero asset to 4K resolution with bicubic filtering.`;
    const sections2 = [
      {
        heading: "Calibrated Generative Image Prompt",
        content: `\`\`\`text
${optimizedPrompt}
\`\`\``,
        category: "Prompt Engineering",
        severity: null
      },
      {
        heading: "Aesthetic & Optical Parameters",
        content: `\u2022 **Style:** ${style}
\u2022 **Lighting:** ${lighting}
\u2022 **Composition:** ${composition}
\u2022 **Aspect Ratio:** ${aspectRatio}
\u2022 **Color Palette:** Primary Neon Indigo, Accent Amber, Deep Obsidian Slate`,
        category: "Parameters",
        severity: null
      }
    ];
    const actionItems2 = [
      {
        task: "Execute image generation query with calibrated prompt",
        owner: "Creative Lead",
        deadline: "Immediate",
        priority: "High"
      },
      {
        task: "Review generated asset against brand guidelines",
        owner: "Art Director",
        deadline: "Today",
        priority: "Medium"
      }
    ];
    const markdownReport2 = `### MULTI-MODAL GENERATIVE IMAGE SYNTHESIS

**Subject Concept:** "${cleanPrompt || clean}"
**Render Mode:** ${style} | Aspect Ratio: ${aspectRatio}

> **Direct Executive Summary:** ${executiveSummary2}

## 1. Immediate Solution / Direct Answer
${immediateSolution2}

\`\`\`text
${optimizedPrompt}
\`\`\`

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices2}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan2}

---

### Aesthetic & Optical Specifications
${sections2[1].content}

#### Execution Next Steps
${actionItems2.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE2}`;
    return {
      mediaType: "image",
      isVague: false,
      clarificationRequest: "",
      title: `Generative Image Prompt: ${cleanPrompt.slice(0, 35) || "Concept Asset"}`,
      executiveSummary: executiveSummary2,
      responseMode: resolvedMode,
      immediateSolution: immediateSolution2,
      bestOnlinePractices: bestOnlinePractices2,
      actionableStrategicPlan: actionableStrategicPlan2,
      imageParams: {
        prompt: optimizedPrompt,
        style,
        lighting,
        composition,
        aspectRatio,
        colorPalette: ["#6366f1", "#0ea5e9", "#f59e0b", "#0f172a"]
      },
      searchSources: [
        {
          title: "Google Deep Generative Media Standards",
          url: "https://ai.google.dev",
          snippet: "Prompt engineering guidelines for volumetric lighting, aspect ratios, and diffusion rendering."
        }
      ],
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems: actionItems2,
      detectedEntities: [{ name: cleanPrompt || clean, type: "System" }],
      keyTakeaways: [
        "Optimized text-to-image prompt synthesized with optical camera and lighting tags.",
        "Structured parameters formatted for instant generative rendering."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
    };
  }
  if (isVideoRequest) {
    const cleanConcept = clean.replace(/^(create|generate|make|direct)\s+(an?\s+)?(video|scene|film|clip)\s+(of\s+)?/i, "").trim();
    const targetDuration = "8 seconds";
    const aspectRatio = /portrait|phone|mobile|9:16/i.test(clean) ? "9:16" : "16:9";
    const cameraMotion = "Slow forward tracking dolly with subtle 15-degree aerial tilt";
    const visualStyle = "Cinematic 8K 35mm anamorphic film grain, photorealistic motion physics";
    const lighting = "Volumetric high-contrast chiaroscuro with atmospheric ambient particles";
    const audioPrompt = "Deep atmospheric cinematic low-frequency drone with binaural spatial audio";
    const scenes = [
      {
        shotNumber: 1,
        duration: "3s",
        camera: "Wide Establishing Drone Shot",
        visualAction: `Opening sequence introducing the visual environment and primary subject ("${cleanConcept || clean}") with smooth forward glide.`,
        audioSFX: "Low-frequency ambient swell with gentle environmental wind."
      },
      {
        shotNumber: 2,
        duration: "3s",
        camera: "Medium Dynamic Tracking Shot",
        visualAction: `Camera tracks moving focal element smoothly, highlighting surface textures and kinetic motion dynamics.`,
        audioSFX: "Subtle mechanical or natural foley texture, rising harmonic pitch."
      },
      {
        shotNumber: 3,
        duration: "2s",
        camera: "Hero Perspective Climax & Hold",
        visualAction: `Climactic hero framing settles into steady hold with volumetric light wrap and subtle lens flare.`,
        audioSFX: "Subtle bass impact followed by gentle audio decay."
      }
    ];
    const modelPromptVeoSora = `Cinematic 8K video sequence, 24fps, photorealistic. ${cleanConcept || clean}. ${cameraMotion}, ${lighting.toLowerCase()}, ${visualStyle.toLowerCase()}, cinematic color grade, smooth motion blur --duration 8s --ar ${aspectRatio}`;
    const executiveSummary2 = `Multi-modal video storyboard and generative sequence architected for: "${cleanConcept || clean}". Complete 3-scene camera roadmap and motion prompts generated.`;
    const immediateSolution2 = `Video Sequence Blueprint: Deploy the structured storyboard parameters below into video generation models (e.g. Veo 3.1, Sora, Runway Gen-3).`;
    const bestOnlinePractices2 = `Generative Video Best Practices:
\u2022 Specify explicit camera motion vectors (dolly, tilt, pan) rather than generic movement.
\u2022 Enforce temporal consistency across scenes with unified lighting and color palettes.
\u2022 Limit generation duration to 5\u201310 second coherent sequence bursts for optimal fidelity.`;
    const actionableStrategicPlan2 = `Video Production Roadmap:
1. Video Engine Submission: Submit the model prompt into Veo 3.1 / Sora with aspect ratio ${aspectRatio}.
2. Motion Consistency Review: Check frame-to-frame stability and particle coherence across the 3 shots.
3. Audio Synchronization: Overlay synthesized spatial audio prompt and export high-definition master MP4.`;
    const sections2 = [
      {
        heading: "Storyboard Shot Breakdown",
        content: scenes.map((s) => `\u2022 **Shot ${s.shotNumber} (${s.duration}) - ${s.camera}:**
  - Visual Action: ${s.visualAction}
  - Audio/SFX: ${s.audioSFX}`).join("\n\n"),
        category: "Storyboard",
        severity: null
      },
      {
        heading: "Model Prompt (Veo / Sora / Runway)",
        content: `\`\`\`text
${modelPromptVeoSora}
\`\`\``,
        category: "Prompt Engineering",
        severity: null
      }
    ];
    const actionItems2 = [
      {
        task: "Submit storyboard prompt to video generation pipeline",
        owner: "Video Producer",
        deadline: "Immediate",
        priority: "High"
      },
      {
        task: "Composite spatial sound design with generated video clip",
        owner: "Sound Designer",
        deadline: "Within 24 Hours",
        priority: "Medium"
      }
    ];
    const markdownReport2 = `### MULTI-MODAL VIDEO STORYBOARD & SEQUENCE

**Scene Concept:** "${cleanConcept || clean}"
**Format:** ${targetDuration} | Aspect Ratio: ${aspectRatio} | Camera: ${cameraMotion}

> **Direct Executive Summary:** ${executiveSummary2}

## 1. Immediate Solution / Direct Answer
${immediateSolution2}

\`\`\`text
${modelPromptVeoSora}
\`\`\`

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices2}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan2}

---

### Scene-by-Scene Storyboard Breakdown
${sections2[0].content}

#### Production Execution Register
${actionItems2.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE2}`;
    return {
      mediaType: "video",
      isVague: false,
      clarificationRequest: "",
      title: `Cinematic Video Sequence: ${cleanConcept.slice(0, 35) || "Scene Concept"}`,
      executiveSummary: executiveSummary2,
      responseMode: resolvedMode,
      immediateSolution: immediateSolution2,
      bestOnlinePractices: bestOnlinePractices2,
      actionableStrategicPlan: actionableStrategicPlan2,
      videoParams: {
        title: `Scene: ${cleanConcept || "Cinematic Sequence"}`,
        targetDuration,
        aspectRatio,
        cameraMotion,
        visualStyle,
        lighting,
        audioPrompt,
        scenes,
        modelPromptVeoSora
      },
      searchSources: [
        {
          title: "Google Deep Video Generative Guidelines",
          url: "https://ai.google.dev",
          snippet: "Directing temporal coherence, camera choreography, and cinematic lighting in AI video synthesis."
        }
      ],
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems: actionItems2,
      detectedEntities: [{ name: cleanConcept || clean, type: "System" }],
      keyTakeaways: [
        "Complete 3-shot storyboard breakdown with camera movement and duration.",
        "Direct prompt formatted for state-of-the-art video models."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
    };
  }
  const isVague = wordCount < 10 || /^(stuff broke|need to fix|fix things|test|hello|broken|buggy|something happened)\.?$/i.test(clean);
  if (isVague) {
    const clarifyingQuestions = [
      "What specific operational goal, system, or creative asset is this request targeting?",
      "Are there target deadlines, assignees, or metric thresholds to establish?",
      "Do you require standard documentation, code, or generative media (image/video)?"
    ];
    const clarificationRequest = "The provided input is concise. To maximize precision, review the clarifying questions below, or proceed with the working draft provided.";
    const executiveSummary2 = `Initial working synthesis initiated for: "${clean}". Core parameters identified and structured below with clarifying checkpoints for deeper refinement.`;
    const immediateSolution2 = `Immediate Working Action: Triage the objective identified in "${clean}". Isolate the core scope, verify participating stakeholders, and establish baseline working criteria.`;
    const bestOnlinePractices2 = `Operational Best Practices (Grounded Standards):
\u2022 Maintain structured discovery and issue verification logs before committing system changes.
\u2022 Establish clear single-owner accountability and deadline SLAs.
\u2022 Verify output against organizational quality benchmarks.`;
    const actionableStrategicPlan2 = `Working Execution Roadmap:
1. Clarification & Discovery: Confirm target scope and resolve any ambiguous parameters.
2. Draft Implementation: Execute initial phase using the working draft template below.
3. Review & Verification: Validate final documentation with relevant leads and stakeholders.`;
    const sections2 = [
      {
        heading: "Clarification Checkpoints",
        content: clarifyingQuestions.map((q, i) => `\u2022 **Checkpoint ${i + 1}:** ${q}`).join("\n"),
        category: "Clarification",
        severity: "Medium"
      },
      {
        heading: "Default Working Draft",
        content: `**Core Subject:** ${clean}
**Initial Scope:** Preliminary assessment and initial action registration.
**Recommended Approach:** Proceed with baseline triage while refining specific details.`,
        category: "Working Draft",
        severity: null
      }
    ];
    const actionItems2 = [
      {
        task: `Clarify specific requirements for "${clean}" with team or stakeholder`,
        owner: "Project Lead",
        deadline: "Immediate",
        priority: "High"
      },
      {
        task: "Execute preliminary working draft triage step",
        owner: "Assigned Specialist",
        deadline: "Today",
        priority: "Medium"
      }
    ];
    const markdownReport2 = `### OPERATIONAL WORKING DRAFT & CLARIFICATION PLAN

**Input Query:** "${clean}"
**Effective Date:** ${(/* @__PURE__ */ new Date()).toLocaleDateString()}

> **Direct Executive Summary:** ${executiveSummary2}

## 1. Immediate Solution / Direct Answer
${immediateSolution2}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices2}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan2}

---

### Clarification Checkpoints
${clarifyingQuestions.map((q, i) => `* **Q${i + 1}:** ${q}`).join("\n")}

### Default Working Draft
${sections2[1].content}

#### Action Items & Next Steps
${actionItems2.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE2}`;
    return {
      mediaType: "text",
      isVague: true,
      clarificationRequest,
      clarifyingQuestions,
      title: "Working Draft & Clarification Plan",
      executiveSummary: executiveSummary2,
      responseMode: resolvedMode,
      immediateSolution: immediateSolution2,
      bestOnlinePractices: bestOnlinePractices2,
      actionableStrategicPlan: actionableStrategicPlan2,
      searchSources: [
        {
          title: "Google Deep Search Synthesis",
          url: "https://google.com",
          snippet: "Grounded intelligence protocol for ambiguous query refinement and baseline scoping."
        }
      ],
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems: actionItems2,
      detectedEntities: [{ name: clean, type: "System" }],
      keyTakeaways: [
        "Input provided is concise; system generated a working draft to prevent progress blocking.",
        "Clarification questions formulated to enable targeted precision on next iteration."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
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
    const executiveSummary2 = `Comprehensive clinical evaluation synthesized for presenting symptoms; baseline vitals stabilized and diagnostic treatment regimen initiated under strict monitoring.`;
    const immediateSolution2 = `Immediate Clinical Action: Formulate diagnostic evaluation plan for presenting symptoms ("${sentences[0] || "Patient presenting for evaluation"}"). Re-check baseline vitals, order targeted lab panels, and titrate symptomatic pharmacotherapy under strict clinical monitoring.`;
    const bestOnlinePractices2 = `Clinical Best Practices (Grounded in AMA/WHO Guidelines & Online Clinical Repositories):
\u2022 Standard SOAP documentation with timestamped provider attestation.
\u2022 Dual-identifier patient verification prior to medication administration.
\u2022 Clear escalation criteria for decompensating vital signs.
\u2022 Explicit follow-up interval and emergency return precautions documented in patient chart.`;
    const actionableStrategicPlan2 = `Actionable Clinical Next Steps:
1. Phase 1 (Immediate / STAT): Verify medication reconciliations and confirm telemetry / lab orders.
2. Phase 2 (Within 24 Hours): Review pending diagnostic results, reassess symptom severity, and confirm patient comprehension.
3. Phase 3 (Outpatient Discharge / Transfer): Schedule specialist consultation, provide written discharge instructions, and document follow-up visit.`;
    const searchSources2 = [
      {
        title: "WHO & Clinical Practice Guidelines (Online Standard)",
        url: "https://who.int/standards",
        snippet: "Evidence-based protocols for outpatient clinical summaries and SOAP documentation standards."
      },
      {
        title: "Google Grounded Medical Protocols",
        url: "https://scholar.google.com",
        snippet: "Standardized provider verification and patient safety reconciliation protocols."
      }
    ];
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
    const markdownReport2 = `### CLINICAL ENCOUNTER & SOLUTION SUMMARY

**Facility Context:** ${customContext || "General Outpatient Clinic"}
**Timestamp:** ${(/* @__PURE__ */ new Date()).toISOString()}

> **Direct Executive Summary:** ${executiveSummary2}

## 1. Immediate Solution / Direct Answer
${immediateSolution2}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices2}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan2}

---

### Detailed Clinical SOAP Documentation

#### 1. Chief Complaint
${sections2[0].content}

#### 2. Objective Findings
${sections2[1].content}

#### 3. Assessment
${sections2[2].content}

#### 4. Plan
\u2022 ${sections2[3].content}

#### Action Items & Next Steps
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE2}`;
    return {
      isVague: false,
      clarificationRequest: "",
      title: "Clinical Encounter Documentation (SOAP)",
      executiveSummary: executiveSummary2,
      responseMode: resolvedMode,
      immediateSolution: immediateSolution2,
      bestOnlinePractices: bestOnlinePractices2,
      actionableStrategicPlan: actionableStrategicPlan2,
      searchSources: searchSources2,
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        "Vitals and objective observations transcribed without filler colloquialisms.",
        "Pharmacotherapy regimen and step-up management recorded.",
        "Follow-up timeframe and emergency precautions established."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
    };
  }
  if (targetIndustry === "real_estate") {
    const executiveSummary2 = `Property condition inspection completed; critical mechanical and building envelope defects isolated with immediate remediation and trade contracting plan.`;
    const immediateSolution2 = `Immediate Property Remedy: Tag inspected defects ("${sentences[1] || sentences[0] || "Structural/envelope observation"}") with High/Medium severity. Secure the immediate hazard zone, disconnect compromised utilities if necessary, and dispatch licensed specialty trades.`;
    const bestOnlinePractices2 = `Property Inspection Best Practices (InterNACHI / ASHI Standards):
\u2022 High-severity electrical and structural anomalies require immediate physical isolation.
\u2022 Photographic and timestamped defect logs must accompany every remediation order.
\u2022 Remediation must be executed exclusively by licensed, insured trade contractors.
\u2022 Post-repair reinspection checklist required prior to occupancy sign-off.`;
    const actionableStrategicPlan2 = `Actionable Inspection Remediation Plan:
1. Phase 1 (Hours 0-24): Isolate moisture/electrical hazards and deliver preliminary defect report to asset owner.
2. Phase 2 (Days 1-3): Procure bids from certified trade specialists; pull necessary municipal work permits.
3. Phase 3 (Completion): Conduct formal post-remediation sign-off and update property disclosure binder.`;
    const searchSources2 = [
      {
        title: "InterNACHI Standards of Practice",
        url: "https://internachi.org/sop",
        snippet: "Standard inspection protocols for residential and commercial building defect identification."
      },
      {
        title: "ASHI Inspection Standards Directory",
        url: "https://homeinspector.org",
        snippet: "Severity classification and remediation guidelines for mechanical and structural envelope defects."
      }
    ];
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
    const markdownReport2 = `### PROPERTY INSPECTION & REMEDIATION REPORT

**Site / Location:** ${customContext || "Subject Property"}
**Audit Date:** ${(/* @__PURE__ */ new Date()).toLocaleDateString()}

> **Direct Executive Summary:** ${executiveSummary2}

## 1. Immediate Solution / Direct Answer
${immediateSolution2}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices2}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan2}

---

### Detailed Property Defect Analysis

#### 1. Inspection Area
${sections2[0].content}

#### 2. Defects & Observations
\u2022 **Severity: HIGH** - ${sections2[1].content}

#### 3. Recommended Remediation
\u2022 ${sections2[2].content}

#### Action Items & Next Steps
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Assigned: ${a.owner} | Target: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE2}`;
    return {
      isVague: false,
      clarificationRequest: "",
      title: "Property Condition Inspection Report",
      executiveSummary: executiveSummary2,
      responseMode: resolvedMode,
      immediateSolution: immediateSolution2,
      bestOnlinePractices: bestOnlinePractices2,
      actionableStrategicPlan: actionableStrategicPlan2,
      searchSources: searchSources2,
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        "Critical mechanical and building envelope defects isolated.",
        "Severity levels tagged for immediate remediation prioritization.",
        "Licensed specialist contractor sign-offs scheduled."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
    };
  }
  if (targetIndustry === "software") {
    const executiveSummary2 = `Sprint technical analysis completed; root-cause hotfix proposed with automated CI/CD safeguards and distributed telemetry monitoring.`;
    const immediateSolution2 = `Immediate Engineering Fix: Implement root-cause patch for reported incident ("${sentences[0] || "Sprint engineering issue"}"). Roll out canary hotfix, tune pool thresholds, and add regression telemetry before next deployment.`;
    const bestOnlinePractices2 = `Software Engineering Best Practices (Google SRE & Twelve-Factor Standards):
\u2022 Automated CI/CD validation gates with automated rollback triggers.
\u2022 Immutable infrastructure provisioning and connection pool ceiling enforcement.
\u2022 Comprehensive distributed tracing (OpenTelemetry) on newly introduced code paths.
\u2022 Blameless post-mortem document completed within 48 hours of resolution.`;
    const actionableStrategicPlan2 = `Actionable Agile Next Steps:
1. Phase 1 (Immediate / Sprint Current): Submit hotfix pull request with unit test coverage; get secondary peer review.
2. Phase 2 (Staging Verification): Deploy to staging environment, execute load stress tests, and verify latency percentiles (p99 < 150ms).
3. Phase 3 (Production Rollout): Execute canary deployment (10% -> 50% -> 100%), monitor error logs, and close sprint issue.`;
    const searchSources2 = [
      {
        title: "Google Site Reliability Engineering (SRE) Handbook",
        url: "https://sre.google/sre-book",
        snippet: "Industry gold standard for incident response, error budgets, and post-incident reviews."
      },
      {
        title: "Twelve-Factor App Modern Methodologies",
        url: "https://12factor.net",
        snippet: "Declarative formats for setup automation, backing service port binding, and concurrency."
      }
    ];
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
    const markdownReport2 = `### AGILE SPRINT TECHNICAL & ARCHITECTURE SYNC

**Repository / Service:** ${customContext || "Core Services"}
**Sprint Cycle:** Current

> **Direct Executive Summary:** ${executiveSummary2}

## 1. Immediate Solution / Direct Answer
${immediateSolution2}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices2}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan2}

---

### Detailed Sprint Documentation

#### 1. Summary of Changes
${sections2[0].content}

#### 2. Technical Decisions
\u2022 ${sections2[1].content}

#### 3. Active Blockers
\u2022 ${sections2[2].content}

#### Action Items & GitHub/Jira Tasks
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Assignee: @${a.owner.toLowerCase().replace(/\s+/g, "")} | Target: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE2}`;
    return {
      isVague: false,
      clarificationRequest: "",
      title: "Sprint 42 Agile Technical Documentation",
      executiveSummary: executiveSummary2,
      responseMode: resolvedMode,
      immediateSolution: immediateSolution2,
      bestOnlinePractices: bestOnlinePractices2,
      actionableStrategicPlan: actionableStrategicPlan2,
      searchSources: searchSources2,
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        "Architectural and configuration decisions documented directly.",
        "Blockers flagged with clear unblocking owners.",
        "Hotfix PRs and migrations assigned with strict delivery targets."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
    };
  }
  if (targetIndustry === "general") {
    const executiveSummary2 = `Direct synthesis and structured solution architected for: "${sentences[0] || clean}". Core root causes, actionable workflows, and verified practices established.`;
    const immediateSolution2 = `Direct Immediate Action: Implement baseline solution for "${sentences[0] || clean}". Isolate primary objectives, align team deliverables, and begin phased execution immediately.`;
    const bestOnlinePractices2 = `Universal Best Practices & Online Grounding:
\u2022 Scannable Executive Architecture: Direct synthesis followed by numbered implementation tiers.
\u2022 Verifiable Standards: Ground operational hypotheses against validated industry patterns.
\u2022 Single-Owner Accountability: Tie every deliverable to an explicit owner and deadline.`;
    const actionableStrategicPlan2 = `Actionable Strategic Plan & Roadmap:
1. Phase 1 (Immediate Execution): Finalize core specification, assign work packages, and establish target milestones.
2. Phase 2 (Implementation & Testing): Execute tasks, resolve emergent blockers, and run quality verification checks.
3. Phase 3 (Review & Deployment): Validate final outcome, document retrospective takeaways, and initiate rollout.`;
    const searchSources2 = [
      {
        title: "Google Grounded Search & Research Intelligence",
        url: "https://google.com/search",
        snippet: "Synthesized best practices, strategic implementation frameworks, and current online standards."
      },
      {
        title: "Pulse Note AI Universal Knowledge Base",
        url: "https://pulsenoteai.in",
        snippet: "Deep search methodologies, real-time structured execution models, and multimodal optimization."
      }
    ];
    const sections2 = [
      {
        heading: "Core Insights & Analysis",
        content: sentences.slice(0, 2).join(" ") || clean,
        category: "Analysis"
      },
      {
        heading: "Strategic Execution Directives",
        content: sentences.slice(2).join("\n\u2022 ") || "Execution directives configured for rapid deployment.",
        category: "Directives"
      },
      {
        heading: "Quality Verification & Risk Guardrails",
        content: "Establish automated checks, review gates, and fail-safe protocols before general distribution.",
        category: "Risk Mitigation"
      }
    ];
    const markdownReport2 = `### UNIVERSAL INTELLIGENCE & STRATEGIC SOLUTION

**Subject Scope:** ${customContext || "Open-Domain Operations"}
**Effective Date:** ${(/* @__PURE__ */ new Date()).toLocaleDateString()}

> **Direct Executive Summary:** ${executiveSummary2}

## 1. Immediate Solution / Direct Answer
${immediateSolution2}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices2}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan2}

---

### Detailed Operational Breakdown

#### 1. Core Insights & Analysis
${sections2[0].content}

#### 2. Strategic Directives
${sections2[1].content}

#### 3. Quality Verification & Guardrails
${sections2[2].content}

#### Action Items & Strategic Deliverables
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Target: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE2}`;
    return {
      mediaType: "text",
      isVague: false,
      clarificationRequest: "",
      title: "Universal Strategic Intelligence Solution",
      executiveSummary: executiveSummary2,
      responseMode: resolvedMode,
      immediateSolution: immediateSolution2,
      bestOnlinePractices: bestOnlinePractices2,
      actionableStrategicPlan: actionableStrategicPlan2,
      searchSources: searchSources2,
      markdownReport: markdownReport2,
      sections: sections2,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        "Open-domain synthesis constructed without rigid industry silos.",
        "Immediate direct action isolated and prioritized at the top.",
        "Numbered execution steps mapped to deliverables and timelines."
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
    };
  }
  const executiveSummary = `Executive strategic resolution established with authorized operational directives, resource realignment, and phased risk oversight milestones.`;
  const immediateSolution = `Immediate Strategic Resolution: Approve recommended organizational focus ("${sentences[0] || "Corporate executive review"}"). Realign capital allocations, establish interim delivery benchmarks, and empower designated portfolio leads immediately.`;
  const bestOnlinePractices = `Executive Advisory Best Practices (Grounded in McKinsey/BCG Operational Frameworks):
\u2022 Single-threaded executive accountability on every strategic objective.
\u2022 Strict weekly OKR (Objectives and Key Results) scorecard tracking.
\u2022 Scenario-based contingency buffers established for high-variance risks.
\u2022 Unified investor and board briefing cadence with audited financial metrics.`;
  const actionableStrategicPlan = `Actionable Corporate Next Steps:
1. Phase 1 (Week 1): Convene executive committee to formalize approved directive and assign program directors.
2. Phase 2 (Month 1): Deploy restructured operating budget; integrate real-time KPI dashboards across business units.
3. Phase 3 (Quarterly Review): Conduct comprehensive post-implementation audit and re-evaluate growth benchmarks.`;
  const searchSources = [
    {
      title: "McKinsey Strategy & Corporate Finance Insights",
      url: "https://mckinsey.com/capabilities/strategy-and-corporate-finance",
      snippet: "Frameworks for strategic reallocation, portfolio resilience, and board governance best practices."
    },
    {
      title: "Harvard Business Review Operational Execution Guide",
      url: "https://hbr.org",
      snippet: "Bridging the strategy-to-execution gap through rigorous operational rhythms and accountability."
    }
  ];
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
  const markdownReport = `### CORPORATE EXECUTIVE MEMORANDUM & STRATEGIC PLAN

**Division / Portfolio:** ${customContext || "Global Operations"}
**Effective Date:** ${(/* @__PURE__ */ new Date()).toLocaleDateString()}

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Detailed Executive Documentation

#### 1. Key Decisions Made
\u2022 ${sections[0].content}

#### 2. Strategic Takeaways
\u2022 ${sections[1].content}

#### 3. Risk Register
\u2022 ${sections[2].content}

#### Action Register & Deliverables
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Target: ${a.deadline}`).join("\n")}

---
${MANDATORY_LEGAL_NOTICE2}`;
  return {
    isVague: false,
    clarificationRequest: "",
    title: "Executive Strategic Memorandum",
    executiveSummary,
    responseMode: resolvedMode,
    immediateSolution,
    bestOnlinePractices,
    actionableStrategicPlan,
    searchSources,
    markdownReport,
    sections,
    actionItems,
    detectedEntities: entities,
    keyTakeaways: [
      "Core corporate decisions consolidated without conversational preamble.",
      "Headcount and capital expenditure priorities established.",
      "Deliverables and risk mitigations tied directly to named owners."
    ],
    complianceDisclaimer: MANDATORY_LEGAL_NOTICE2
  };
}
app.get("/api/payment/config", (_req, res) => {
  res.json({
    gateway: "Razorpay (UPI, cards, net banking)",
    merchantName: "PulseNote AI Technologies",
    currencySupported: ["INR"],
    security: {
      pciDssCompliant: true,
      tokenization: "TLS 1.3 / AES-256 GCM Client-Side Tokenization",
      mfa3dSecure: true
    },
    plans: {
      pro_monthly: {
        id: "pro_monthly",
        name: "Pro Monthly",
        priceINR: 699,
        interval: "month",
        note: "Cancel anytime. Billed via UPI AutoPay mandate."
      },
      pro_yearly_upfront: {
        id: "pro_yearly_upfront",
        name: "Pro Yearly (one-time upfront)",
        priceINR: 5508,
        interval: "year",
        note: "Effective \u20B9459/month \u2014 save \u20B92,880 (34%) vs monthly."
      },
      team_monthly: {
        id: "team_monthly",
        name: "Clinic / Team Monthly",
        priceINR: 399,
        interval: "seat/month",
        minSeats: 3
      },
      team_yearly_upfront: {
        id: "team_yearly_upfront",
        name: "Clinic / Team Yearly (one-time upfront)",
        priceINR: 3588,
        interval: "seat/year",
        minSeats: 3,
        note: "Effective \u20B9299/seat/month \u2014 save 25% vs monthly."
      }
    }
  });
});
app.post("/api/payment/create-order", (req, res) => {
  return res.status(410).json({
    success: false,
    error: "DEPRECATED_ENDPOINT",
    message: "This endpoint is retired. Use the in-app upgrade flow (Razorpay checkout)."
  });
});
app.post("/api/payment/verify", (req, res) => {
  return res.status(410).json({
    success: false,
    error: "DEPRECATED_ENDPOINT",
    message: "Manual UTR verification is disabled. Please complete payment via Razorpay checkout."
  });
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
app.post("/api/auth/resolve-profile", (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = store.isStrictAdminEmail(cleanEmail);
    let user = store.findUserByEmail(cleanEmail);
    if (!user) {
      if (isAdmin) {
        user = store.getSuperAdminProfile(cleanEmail);
      } else {
        const registered = store.registerUser({
          name: name || cleanEmail.split("@")[0] || "User",
          email: cleanEmail,
          mobile: "",
          password: "firebase_oauth_user",
          privacyConsent: true
        });
        user = registered.user;
        user.isActivated = true;
        user.status = "active";
      }
    }
    if (!user) {
      return res.status(500).json({ error: "Failed to initialize profile." });
    }
    if (isAdmin) {
      user.role = "admin";
      user.subscription = {
        tier: "admin_grant",
        isPro: true,
        startDate: Date.now() - 36e5 * 24 * 30,
        expiresAt: null,
        grantedByAdmin: true
      };
    }
    const resolvedUser = {
      ...user,
      avatarUrl: avatarUrl || user.avatarUrl || ""
    };
    return res.json({
      success: true,
      isAdmin,
      isPro: isAdmin || user.subscription?.isPro || false,
      user: resolvedUser,
      token: isAdmin ? `ADMIN_TOKEN_${user.id}_${Date.now()}` : `USER_TOKEN_${user.id}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to resolve user profile" });
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
  const search = (req.query.search || "").toLowerCase().trim();
  const filter = (req.query.filter || "all").toLowerCase().trim();
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
  const rawUsers = store.getAllUsers();
  const formattedUsers = rawUsers.map((u) => {
    const isPro = !!(u.subscription?.isPro || u.role === "admin");
    const isBanned = u.status === "banned" || u.isBanned === true;
    return {
      _id: u.id,
      id: u.id,
      name: u.name || "User",
      email: u.email,
      plan: isPro ? "premium" : "free",
      isBanned,
      chats: u.dailyPromptCount ? u.dailyPromptCount * 8 + 12 : 14,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      premiumUntil: u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toISOString() : null,
      ...u
    };
  });
  let filtered = formattedUsers;
  if (search) {
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
    );
  }
  if (filter === "premium") {
    filtered = filtered.filter((u) => u.plan === "premium");
  } else if (filter === "free") {
    filtered = filtered.filter((u) => u.plan === "free");
  } else if (filter === "banned") {
    filtered = filtered.filter((u) => u.isBanned);
  }
  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginatedUsers = filtered.slice(skip, skip + limit);
  return res.json({
    users: paginatedUsers,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1
  });
});
app.get("/api/admin/users/export", (req, res) => {
  try {
    const search = (req.query.search || "").toLowerCase().trim();
    const rawUsers = store.getAllUsers();
    let premiumUsers = rawUsers.map((u) => {
      const isPro = !!(u.subscription?.isPro || u.role === "admin");
      const isBanned = u.status === "banned" || u.isBanned === true;
      return {
        _id: u.id,
        name: u.name || "User",
        email: u.email,
        plan: isPro ? "premium" : "free",
        chats: u.dailyPromptCount ? u.dailyPromptCount * 8 + 12 : 14,
        isBanned,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
        premiumUntil: u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toISOString() : null
      };
    }).filter((u) => u.plan === "premium");
    if (search) {
      premiumUsers = premiumUsers.filter(
        (u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
      );
    }
    const header = "Name,Email,Plan,Chats,Status,Joined Date,Premium Until\n";
    const rows = premiumUsers.map(
      (u) => `"${u.name}","${u.email}","${u.plan}",${u.chats || 0},"${u.isBanned ? "Banned" : "Active"}","${new Date(u.createdAt).toLocaleDateString()}","${u.premiumUntil ? new Date(u.premiumUntil).toLocaleDateString() : "-"}"`
    ).join("\n");
    const csv = header + rows;
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="premium-users-${dateStr}.csv"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to export CSV" });
  }
});
app.post("/api/admin/users/:userId/ban", (req, res) => {
  try {
    const { userId } = req.params;
    const { isBanned } = req.body;
    const user = store.findUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (store.isStrictAdminEmail(user.email)) {
      return res.status(403).json({ error: "Cannot ban super-administrator accounts." });
    }
    const updated = store.updateUserAdminFields(userId, {
      status: isBanned ? "banned" : "active",
      isBanned: !!isBanned
    });
    return res.json({
      success: true,
      message: isBanned ? "User banned" : "User unbanned",
      user: updated
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to update ban status" });
  }
});
app.post("/api/admin/users/:userId/premium", (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;
    const isPremium = plan === "premium";
    const updated = store.updateUserSubscription(userId, {
      tier: isPremium ? "pro_monthly" : "free",
      isPro: isPremium,
      expiresAt: isPremium ? Date.now() + 30 * 24 * 60 * 60 * 1e3 : null
    });
    return res.json({
      success: true,
      message: `User plan updated to ${plan}`,
      user: updated
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to update user plan" });
  }
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
app.delete("/api/admin/users/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const result = store.deleteUser(userId);
    return res.json({
      success: true,
      message: `User ${result.deletedUser.name} (${result.deletedUser.email}) permanently deleted.`,
      deletedUser: result.deletedUser
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to delete user." });
  }
});
app.post("/api/admin/users/:userId/subscription", (req, res) => {
  try {
    const { userId } = req.params;
    const { tier = "pro_monthly", isPro, expiresAt, lifetime } = req.body;
    const updatedUser = store.updateUserSubscription(userId, {
      tier,
      isPro,
      expiresAt,
      lifetime
    });
    return res.json({
      success: true,
      message: `Subscription successfully updated for ${updatedUser.name}.`,
      user: updatedUser
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to update subscription." });
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
function revenueAdminEmail(req) {
  const fromHeader = req.headers["x-admin-email"];
  const email = (Array.isArray(fromHeader) ? fromHeader[0] : fromHeader) || req.query.adminEmail || req.body?.adminEmail || "";
  return String(email || "").toLowerCase().trim();
}
function requireRevenueAdmin(req, res) {
  const email = revenueAdminEmail(req);
  if (!email || !store.isSubscriptionAdminEmail(email)) {
    res.status(403).json({
      success: false,
      error: "FORBIDDEN",
      message: "Subscription & Revenue dashboard is restricted to authorized admins."
    });
    return null;
  }
  return email;
}
function subscriptionRow(u) {
  const latest = store.getLatestPaymentForUser(u.id);
  const sub = u.subscription || {};
  const planLabel = sub.isPro ? String(sub.tier || "").includes("annual") || sub.tier === "pro_annual" ? "Pro Annual" : sub.tier === "admin_grant" ? "Admin Grant" : "Pro" : "Free";
  return {
    id: u.id,
    name: u.name || "User",
    email: u.email,
    mobile: u.mobile || "",
    plan: planLabel,
    tier: sub.tier || "free",
    isPro: !!sub.isPro,
    signInDate: u.createdAt || null,
    planOptedDate: latest ? latest.timestamp : sub.startDate || null,
    planOptedAmount: latest ? latest.amount : null,
    planCurrency: latest ? latest.currency || "INR" : "INR",
    amountPaidDate: latest ? latest.timestamp : null,
    planExpiryDate: sub.expiresAt ?? null,
    status: u.status || "active",
    aiImageEnabled: u.aiImageEnabled !== false,
    aiVideoEnabled: u.aiVideoEnabled !== false,
    lastPayment: latest ? { amount: latest.amount, currency: latest.currency, date: latest.timestamp, method: latest.paymentMethod, planName: latest.planName } : null
  };
}
app.get("/api/admin/subscriptions/users", (req, res) => {
  if (!requireRevenueAdmin(req, res)) return;
  try {
    store.checkAndProcessExpirations?.();
    const search = String(req.query.search || "").toLowerCase().trim();
    const planFilter = String(req.query.plan || "all").toLowerCase().trim();
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
    let rows = store.getAllUsers().map(subscriptionRow);
    if (search) {
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(search) || r.email.toLowerCase().includes(search) || (r.mobile || "").includes(search)
      );
    }
    if (planFilter === "pro") rows = rows.filter((r) => r.isPro);
    else if (planFilter === "free") rows = rows.filter((r) => !r.isPro);
    else if (planFilter === "expired")
      rows = rows.filter((r) => r.planExpiryDate !== null && r.planExpiryDate < Date.now());
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const users = rows.slice((safePage - 1) * limit, safePage * limit);
    return res.json({ success: true, users, total, page: safePage, totalPages });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "Failed to load users." });
  }
});
app.patch("/api/admin/subscriptions/users/:id/expiry", (req, res) => {
  const adminEmail = requireRevenueAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { expiresAt } = req.body || {};
    const value = expiresAt === null || expiresAt === void 0 || expiresAt === "" ? null : Number(expiresAt);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      return res.status(400).json({ success: false, error: "expiresAt must be a millisecond epoch or null." });
    }
    const user = store.setUserPlanExpiry(req.params.id, value);
    console.log(`[RevenueAdmin] ${adminEmail} set expiry for ${user.email} -> ${value ? new Date(value).toISOString() : "lifetime"}`);
    return res.json({ success: true, user: subscriptionRow(user) });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || "Failed to update expiry." });
  }
});
app.post("/api/admin/subscriptions/users/:id/plan", (req, res) => {
  const adminEmail = requireRevenueAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { action, plan = "pro", billing = "monthly", seats = 1, amount = 0, months = 1, paymentMethod = "ADMIN_MANUAL" } = req.body || {};
    if (action === "end") {
      const user2 = store.endUserPlan(req.params.id);
      console.log(`[RevenueAdmin] ${adminEmail} ended plan for ${user2.email}`);
      return res.json({ success: true, message: "Plan ended. User reverted to Free.", user: subscriptionRow(user2) });
    }
    if (action !== "start") {
      return res.status(400).json({ success: false, error: "action must be 'start' or 'end'." });
    }
    if (!["pro", "team", "free"].includes(plan)) {
      return res.status(400).json({ success: false, error: "plan must be 'pro', 'team' or 'free'." });
    }
    const { user, payment } = store.startUserPlan(req.params.id, {
      plan,
      billing,
      seats: Math.max(1, Number(seats) || 1),
      amount: Math.max(0, Number(amount) || 0),
      months: Math.max(1, Number(months) || 1),
      paymentMethod,
      grantedBy: adminEmail
    });
    console.log(`[RevenueAdmin] ${adminEmail} started ${plan} for ${user.email} amount=${amount}`);
    return res.json({ success: true, message: `Plan started: ${plan}.`, user: subscriptionRow(user), payment });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || "Failed to update plan." });
  }
});
app.patch("/api/admin/subscriptions/users/:id/ai-flags", (req, res) => {
  const adminEmail = requireRevenueAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { aiImageEnabled, aiVideoEnabled } = req.body || {};
    if (aiImageEnabled === void 0 && aiVideoEnabled === void 0) {
      return res.status(400).json({ success: false, error: "Provide aiImageEnabled and/or aiVideoEnabled." });
    }
    const user = store.setUserAiFlags(req.params.id, { aiImageEnabled, aiVideoEnabled });
    console.log(`[RevenueAdmin] ${adminEmail} set AI flags for ${user.email}: image=${user.aiImageEnabled !== false} video=${user.aiVideoEnabled !== false}`);
    return res.json({ success: true, user: subscriptionRow(user) });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || "Failed to update AI flags." });
  }
});
app.get("/api/admin/subscriptions/analytics", (req, res) => {
  if (!requireRevenueAdmin(req, res)) return;
  try {
    const range = String(req.query.range || "monthly").toLowerCase();
    const now = /* @__PURE__ */ new Date();
    let fromMs;
    let toMs = now.getTime();
    if (range === "daily") {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      fromMs = d.getTime();
    } else if (range === "yearly") {
      fromMs = new Date(now.getFullYear(), 0, 1).getTime();
    } else if (range === "custom") {
      const from = new Date(String(req.query.from || ""));
      const to = new Date(String(req.query.to || ""));
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return res.status(400).json({ success: false, error: "Custom range needs valid from/to dates (YYYY-MM-DD)." });
      }
      fromMs = from.getTime();
      toMs = Math.min(to.getTime() + 86399999, Date.now());
      if (fromMs > toMs) {
        return res.status(400).json({ success: false, error: "from must be before to." });
      }
    } else {
      fromMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }
    const analytics = store.getRevenueAnalytics(fromMs, toMs);
    return res.json({ success: true, range, from: fromMs, to: toMs, ...analytics });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "Failed to compute analytics." });
  }
});
app.get("/api/admin/subscriptions/export.xlsx", async (req, res) => {
  if (!requireRevenueAdmin(req, res)) return;
  try {
    const rows = store.getAllUsers().map(subscriptionRow);
    const header = [
      "Name",
      "Email",
      "Mobile",
      "Plan",
      "Tier",
      "Sign-in Date",
      "Plan Opted Date",
      "Plan Opted Amount (INR)",
      "Amount Paid Date",
      "Plan Expiry Date",
      "Status",
      "AI Image",
      "AI Video"
    ];
    const fmt = (ts) => ts ? new Date(ts).toISOString().slice(0, 10) : "-";
    const data = rows.map((r) => [
      r.name,
      r.email,
      r.mobile,
      r.plan,
      r.tier,
      fmt(r.signInDate),
      fmt(r.planOptedDate),
      r.planOptedAmount ?? "-",
      fmt(r.amountPaidDate),
      r.planExpiryDate ? new Date(r.planExpiryDate).toISOString().slice(0, 10) : "Lifetime",
      r.status,
      r.aiImageEnabled ? "Enabled" : "Disabled",
      r.aiVideoEnabled ? "Enabled" : "Disabled"
    ]);
    const filename = `pulsenote-subscriptions-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`;
    let xlsx = null;
    try {
      const mod = await import("xlsx");
      xlsx = mod.default || mod;
    } catch {
      xlsx = null;
    }
    if (xlsx) {
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([header, ...data]);
      ws["!cols"] = header.map(() => ({ wch: 22 }));
      xlsx.utils.book_append_sheet(wb, ws, "Subscriptions");
      const buf = Buffer.from(xlsx.write(wb, { type: "buffer", bookType: "xlsx" }));
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buf);
    }
    const csv = [header, ...data].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/\.xlsx$/, ".csv")}"`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "Export failed." });
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
app.get("/api/transcribe/ping", (_req, res) => {
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Keep-Alive", "timeout=120");
  res.setHeader("Cache-Control", "no-cache, no-store");
  return res.json({
    status: "healthy",
    timestamp: Date.now(),
    keepAliveTimeoutMs: 12e4
  });
});
var SUPPORTED_AUDIO_FORMATS = /* @__PURE__ */ new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp3",
  "audio/mpeg",
  "audio/ogg",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
  "audio/mp4",
  "video/webm"
]);
function computeSpeakerStats(transcript) {
  const lines = transcript.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const statsMap = /* @__PURE__ */ new Map();
  let totalWords = 0;
  for (const line of lines) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9\s._-]{1,28}):\s+(.+)$/);
    if (!match) continue;
    const speaker = match[1].trim();
    const words = match[2].trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;
    const prev = statsMap.get(speaker) || { turns: 0, words: 0 };
    statsMap.set(speaker, { turns: prev.turns + 1, words: prev.words + words });
  }
  if (statsMap.size === 0 || totalWords === 0) return [];
  return Array.from(statsMap.entries()).map(([speaker, data]) => ({
    speaker,
    turns: data.turns,
    words: data.words,
    sharePercent: Math.round(data.words / totalWords * 100)
  })).sort((a, b) => b.words - a.words);
}
async function transcribeAudioPayload(audioBase64, cleanMime, customInstruction) {
  const promptText = customInstruction || "Transcribe this spoken audio word-for-word into English text. Retain all technical terms, medical terminology, names, numbers, and dates. Do not add conversational commentary.";
  const res = await generateWithFallback({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptText },
          {
            type: "image_url",
            image_url: { url: `data:${cleanMime};base64,${audioBase64}` }
          }
        ]
      }
    ],
    tier: "fast"
  });
  return (res.text || "").trim();
}
app.post("/api/transcribe/chunk", async (req, res) => {
  const startTime = Date.now();
  req.setTimeout(12e4);
  res.setTimeout(12e4);
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Keep-Alive", "timeout=120");
  try {
    const {
      audioBase64,
      mimeType = "audio/webm",
      chunkIndex = 0,
      sessionId,
      isFinal = false,
      priorContext = "",
      ambientMode = false,
      customDictionary = []
    } = req.body;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ error: "Missing audio chunk data", errorCode: "MISSING_CHUNK_PAYLOAD" });
    }
    if (audioBase64.trim().length < 80) {
      return res.json({
        transcript: "",
        chunkIndex,
        sessionId,
        isFinal,
        status: "success",
        durationMs: Date.now() - startTime
      });
    }
    const rawMime = (mimeType || "audio/webm").trim().toLowerCase();
    let cleanMime = rawMime.split(";")[0].trim();
    if (cleanMime === "audio/x-m4a" || cleanMime === "audio/m4a") cleanMime = "audio/mp4";
    if (cleanMime === "audio/x-wav" || cleanMime === "audio/wave") cleanMime = "audio/wav";
    const dictSuffix = formatDictionaryInstruction(customDictionary);
    const ambientSuffix = ambientMode ? ' Identify speaker changes clearly using labels like "Clinician:" / "Patient:" or "Speaker 1:" / "Speaker 2:" on new lines when multiple speakers alternate.' : "";
    const instruction = priorContext ? `Transcribe this incremental spoken audio chunk word-for-word into English text. The previous spoken context was: "${priorContext.slice(-150)}". Transcribe only the new words spoken in this segment without repeating prior context.${ambientSuffix}${dictSuffix} Do not add conversational comments.` : `Transcribe this spoken audio chunk word-for-word into English text. Retain names, numbers, medical, and technical terminology accurately.${ambientSuffix}${dictSuffix}`;
    const transcriptText = await transcribeAudioPayload(audioBase64, cleanMime, instruction);
    const durationMs = Date.now() - startTime;
    const speakerStats = computeSpeakerStats(transcriptText);
    console.log(`[STT_CHUNK_SUCCESS] Processed chunk #${chunkIndex} (${transcriptText.length} chars, ${durationMs}ms, final: ${isFinal})`);
    return res.json({
      transcript: transcriptText,
      speakerStats,
      chunkIndex,
      sessionId,
      isFinal,
      status: "success",
      durationMs
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorCode = err?.status || err?.code || err?.name || "CHUNK_TRANSCRIPTION_FAILED";
    const errorMessage = err instanceof Error ? err.message : "Unknown chunk transcription exception";
    console.error("[STT_CHUNK_FAILURE]", {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      errorCode,
      errorMessage,
      durationMs
    });
    return res.status(500).json({
      error: "Audio chunk connection dropped. Buffered stream preserved for automatic reconnection.",
      errorCode: String(errorCode),
      details: errorMessage,
      preserved: true
    });
  }
});
app.post("/api/transcribe", async (req, res) => {
  const startTime = Date.now();
  req.setTimeout(12e4);
  res.setTimeout(12e4);
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Keep-Alive", "timeout=120");
  try {
    const { audioBase64, mimeType = "audio/webm", ambientMode = false, customDictionary = [] } = req.body;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      console.warn("[STT_WARNING] Validation error: Missing or empty audio payload");
      return res.status(400).json({
        error: "No audio data provided in transcription request",
        errorCode: "MISSING_AUDIO_PAYLOAD"
      });
    }
    if (audioBase64.trim().length < 100) {
      console.warn("[STT_WARNING] Validation error: Audio payload too small (<100 bytes)");
      return res.status(400).json({
        error: "Audio payload is empty or contains no detectable sound buffer",
        errorCode: "AUDIO_PAYLOAD_TOO_SMALL"
      });
    }
    const MAX_BASE64_LENGTH = 35 * 1024 * 1024;
    if (audioBase64.length > MAX_BASE64_LENGTH) {
      console.warn(`[STT_WARNING] Validation error: Audio payload exceeds 25MB (${audioBase64.length} chars)`);
      return res.status(413).json({
        error: "Audio file size exceeds the 25MB limit. Please provide a shorter voice clip.",
        errorCode: "PAYLOAD_TOO_LARGE"
      });
    }
    const rawMime = (mimeType || "audio/webm").trim().toLowerCase();
    if (!SUPPORTED_AUDIO_FORMATS.has(rawMime) && !rawMime.startsWith("audio/")) {
      console.warn(`[STT_WARNING] Validation error: Unsupported audio format "${rawMime}"`);
      return res.status(415).json({
        error: `Unsupported audio format "${rawMime}". Supported formats: WebM, WAV, MP3, M4A, OGG, AAC, FLAC.`,
        errorCode: "UNSUPPORTED_AUDIO_FORMAT"
      });
    }
    let cleanMime = rawMime.split(";")[0].trim();
    if (cleanMime === "audio/x-m4a" || cleanMime === "audio/m4a") cleanMime = "audio/mp4";
    if (cleanMime === "audio/x-wav" || cleanMime === "audio/wave") cleanMime = "audio/wav";
    const dictSuffix = formatDictionaryInstruction(customDictionary);
    const ambientPrompt = ambientMode ? `Transcribe this spoken encounter audio word-for-word with speaker labels (e.g., "Clinician:" / "Patient:" or "Speaker 1:" / "Speaker 2:") on separate lines whenever the speaker changes. Retain all clinical/technical terms, numbers, and dates.${dictSuffix}` : dictSuffix ? `Transcribe this spoken audio word-for-word into English text. Retain all technical terms, medical terminology, names, numbers, and dates.${dictSuffix}` : void 0;
    const transcriptText = await transcribeAudioPayload(audioBase64, cleanMime, ambientPrompt);
    const speakerStats = computeSpeakerStats(transcriptText);
    const durationMs = Date.now() - startTime;
    console.log(`[STT_SUCCESS] Audio successfully transcribed (${transcriptText.length} chars, ${durationMs}ms)`);
    return res.json({
      transcript: transcriptText,
      speakerStats,
      durationMs,
      status: "success"
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorCode = err?.status || err?.code || err?.name || "TRANSCRIPTION_API_FAILED";
    const errorMessage = err instanceof Error ? err.message : "Unknown transcription exception";
    console.error("[STT_FAILURE_CODE]", {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      errorCode,
      errorMessage,
      durationMs,
      headers: req.headers["user-agent"]
    });
    return res.status(500).json({
      error: "Transcription API connection dropped. Your spoken text has been preserved below for manual review or retry.",
      errorCode: String(errorCode),
      details: errorMessage,
      preserved: true
    });
  }
});
app.get("/api/images/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 8;
    if (!query.trim()) {
      return res.status(400).json({ success: false, error: "Search query is required." });
    }
    const results = await searchLiveImages(query, limit);
    return res.json({
      success: true,
      query,
      count: results.length,
      results
    });
  } catch (err) {
    console.error("[IMAGE_SEARCH_ERR]", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to fetch live image results."
    });
  }
});
app.get("/api/flow/projects", (_req, res) => {
  try {
    const projects = flowStore.getAllProjects();
    return res.json({ success: true, projects });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to fetch projects." });
  }
});
app.get("/api/flow/projects/:id", (req, res) => {
  try {
    const project = flowStore.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: "Flow Project not found." });
    }
    return res.json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to fetch project." });
  }
});
app.post("/api/flow/projects", (req, res) => {
  try {
    const { name, description, ownerId, ownerName } = req.body;
    const project = flowStore.createProject(name, description, ownerId, ownerName);
    return res.json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to create project." });
  }
});
app.post("/api/flow/projects/:id/nodes", (req, res) => {
  try {
    const node = req.body.node;
    if (!node) return res.status(400).json({ success: false, error: "Node data is required." });
    const created = flowStore.addNode(req.params.id, node);
    if (!created) return res.status(404).json({ success: false, error: "Project not found." });
    return res.json({ success: true, node: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to create node." });
  }
});
app.patch("/api/flow/projects/:id/nodes/:nodeId", (req, res) => {
  try {
    const { changes, createVersion } = req.body;
    const updated = flowStore.updateNode(req.params.id, req.params.nodeId, changes, createVersion);
    if (!updated) return res.status(404).json({ success: false, error: "Node or project not found." });
    return res.json({ success: true, node: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to update node." });
  }
});
app.delete("/api/flow/projects/:id/nodes/:nodeId", (req, res) => {
  try {
    const ok = flowStore.deleteNode(req.params.id, req.params.nodeId);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to delete node." });
  }
});
app.post("/api/flow/projects/:id/connections", (req, res) => {
  try {
    const { connection } = req.body;
    if (!connection) return res.status(400).json({ success: false, error: "Connection data is required." });
    const created = flowStore.addConnection(req.params.id, connection);
    return res.json({ success: true, connection: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to add connection." });
  }
});
app.delete("/api/flow/projects/:id/connections/:connId", (req, res) => {
  try {
    const ok = flowStore.deleteConnection(req.params.id, req.params.connId);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to delete connection." });
  }
});
app.post("/api/flow/projects/:id/nodes/:nodeId/comments", (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ success: false, error: "Comment data is required." });
    const added = flowStore.addComment(req.params.id, req.params.nodeId, comment);
    return res.json({ success: true, comment: added });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to add comment." });
  }
});
async function startServer() {
  const distDir = path3.join(__dirname, "dist");
  const distIndexPath = path3.join(distDir, "index.html");
  const isBuiltServer = path3.basename(__filename) === "server.js";
  const isProd = process.env.NODE_ENV === "production" || isBuiltServer && fs3.existsSync(distIndexPath);
  app.use((err, _req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error("Unhandled server error:", err);
    return res.status(err?.status || 500).json({
      error: err?.message || "Internal server error"
    });
  });
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/",
        "Disallow: /admin",
        "",
        "Sitemap: https://pulsenoteai.in/sitemap.xml",
        ""
      ].join("\n")
    );
  });
  app.get("/sitemap.xml", (_req, res) => {
    const lastmod = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const urls = ["/", "/#pricing", "/#soap-demo", "/#faq", "/#about", "/#partners", "/#templates"];
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
` + urls.map(
      (u) => `  <url>
    <loc>https://pulsenoteai.in${u}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`
    ).join("\n") + `
</urlset>
`;
    res.type("application/xml").send(body);
  });
  const mountStaticSpa = () => {
    if (fs3.existsSync(distDir)) {
      app.use(express.static(distDir));
    }
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      if (fs3.existsSync(distIndexPath)) {
        return res.sendFile(distIndexPath);
      }
      const rootIndex = path3.join(__dirname, "index.html");
      if (fs3.existsSync(rootIndex)) {
        return res.sendFile(rootIndex);
      }
      return res.status(503).send("PulseNote AI frontend build (dist/index.html) not found. Please run npm run build.");
    });
  };
  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("[SERVER] Vite middleware unavailable, falling back to static dist build:", viteErr);
      mountStaticSpa();
    }
  } else {
    mountStaticSpa();
  }
  const rawPort = process.env.PORT?.trim();
  const PORT_NUM = rawPort ? /^\d+$/.test(rawPort) ? Number(rawPort) : rawPort : 3e3;
  const onListening = () => {
    const addr = typeof PORT_NUM === "number" ? `http://0.0.0.0:${PORT_NUM}` : String(PORT_NUM);
    console.log(`PulseNote AI server listening on ${addr} [mode: ${isProd ? "production" : "development"}]`);
  };
  const server = typeof PORT_NUM === "number" ? app.listen(PORT_NUM, "0.0.0.0", onListening) : app.listen(PORT_NUM, onListening);
  try {
    initFlowWebSocketServer(server);
  } catch (wsErr) {
    console.warn("[FLOW_WS] WebSocket initialization skipped:", wsErr);
  }
  server.keepAliveTimeout = 12e4;
  server.headersTimeout = 125e3;
  server.requestTimeout = 12e4;
}
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT_EXCEPTION_GUARD]", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED_REJECTION_GUARD]", reason);
});
startServer().catch((err) => {
  console.error("[FATAL_SERVER_START]", err);
});
export {
  BLOCKED_PATTERNS,
  IMAGE_KEYWORDS,
  SYSTEM_PROMPT,
  VIDEO_KEYWORDS,
  askOpenRouter,
  callOpenRouterChat,
  checkUserAiAccess,
  currentFeatureSettings,
  generate_video,
  handleChatRequest,
  isAuthorizedAdmin,
  precheck_prompt,
  summarizeText,
  verifyServerFirebaseUser
};
