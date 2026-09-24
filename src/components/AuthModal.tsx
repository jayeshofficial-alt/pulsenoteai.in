import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Smartphone, 
  Send, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, token: string) => void;
  initialTab?: 'login' | 'register' | 'forgot';
  onOpenSystemEmails?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login',
  onOpenSystemEmails,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'activate'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(true);

  // Forgot Password / OTP Flow
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpChannel, setOtpChannel] = useState<'sms' | 'email' | 'both'>('both');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devOtpPreview, setDevOtpPreview] = useState<string | null>(null);

  // Activation Flow
  const [activateEmail, setActivateEmail] = useState('');
  const [activateToken, setActivateToken] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isPendingActivation) {
          setActivateEmail(data.email || loginEmail);
          setActivateToken(data.activationToken || '');
          setTab('activate');
          throw new Error('Account pending activation. Please verify your activation token below.');
        }
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!privacyConsent) {
      setError('You must explicitly consent to the Privacy Policy to create an account.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          mobile: regMobile,
          password: regPassword,
          privacyConsent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setActivateEmail(data.user.email);
      setActivateToken(data.activationToken);
      setSuccessMsg('Account created! Welcome Email triggered with your activation link.');
      setTab('activate');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, channel: otpChannel }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');

      setOtpSent(true);
      setDevOtpPreview(data.otpPreviewForDev || null);
      setSuccessMsg(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otp: otpCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed.');

      setSuccessMsg('Password updated successfully! You can now log in.');
      setLoginEmail(forgotEmail);
      setLoginPassword(newPassword);
      setTab('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activateEmail, token: activateToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed.');

      setSuccessMsg('🎉 Account activated successfully! You can now sign in.');
      setLoginEmail(activateEmail);
      setTab('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {tab === 'login' && 'Client & Admin Authentication'}
                {tab === 'register' && 'Create PulseNote Account'}
                {tab === 'forgot' && 'Reset Password (OTP Verification)'}
                {tab === 'activate' && 'Activate Your Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {tab === 'login' && 'Sign in to access your reports and subscription'}
                {tab === 'register' && 'Includes Welcome Email with activation verification'}
                {tab === 'forgot' && 'Choose Mobile SMS, Email ID, or Both'}
                {tab === 'activate' && 'Mandatory activation required before platform access'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 text-xs font-semibold p-1">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setTab('forgot'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${
              tab === 'forgot'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OTP Reset
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* GOOGLE SIGN-IN VIA FIREBASE AUTH */}
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const { signInWithGoogle } = await import('../lib/firebase');
                const firebaseUser = await signInWithGoogle();
                if (firebaseUser && firebaseUser.email) {
                  // Resolve profile authoritatively from backend
                  const res = await fetch('/api/auth/resolve-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: firebaseUser.email,
                      name: firebaseUser.displayName || firebaseUser.email.split('@')[0] || 'User',
                      avatarUrl: firebaseUser.photoURL || '',
                    }),
                  });

                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to authenticate.');

                  onLoginSuccess(data.user, data.token || `USER_TOKEN_${data.user.id}`);
                  onClose();
                }
              } catch (authErr: any) {
                console.error('Firebase Auth error:', authErr);
                setError(authErr?.message || 'Google sign-in could not be completed.');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700/80 text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm hover:border-slate-600 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google (Firebase)</span>
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-widest font-mono shrink-0">
              or continue with email
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* TAB 1: SIGN IN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setTab('forgot');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to PulseNote'}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Dr. Jayesh Wagh"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Email ID</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@work.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Create Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Privacy Policy Consent with Yes/No toggle and timestamp capture */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacyConsentCheck"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-1 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer w-4 h-4"
                />
                <label htmlFor="privacyConsentCheck" className="text-[11px] text-slate-300 leading-normal select-none cursor-pointer">
                  <strong>Explicit Privacy Policy & Terms Consent:</strong> I agree to the processing of raw transcripts, secure server logging, and data policies. An immutable timestamp is stored with this registration.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !privacyConsent}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Sign Up & Trigger Welcome Email'}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD / FLEXIBLE OTP */}
          {tab === 'forgot' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Registered Email ID</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Flexible Channel Picker: SMS, Email, Both */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Where would you like to receive your 6-digit OTP?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpChannel('sms')}
                        className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                          otpChannel === 'sms'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile SMS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOtpChannel('email')}
                        className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                          otpChannel === 'email'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email ID</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOtpChannel('both')}
                        className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                          otpChannel === 'both'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        <span>Both (SMS + Email)</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Dispatching OTP...' : 'Send 6-Digit OTP Code'}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter OTP & New Password */
                <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div>OTP dispatched to <strong className="text-emerald-400">{forgotEmail}</strong> via <strong>{otpChannel.toUpperCase()}</strong>.</div>
                    {devOtpPreview && (
                      <div className="text-emerald-300 font-mono text-[11px]">
                        Preview OTP Code: <strong>{devOtpPreview}</strong>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-mono text-center tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Set New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                    >
                      Resend / Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Reset & Save Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: ACCOUNT ACTIVATION GATEWAY */}
          {tab === 'activate' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <div className="font-bold flex items-center gap-2 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  Account Activation Required
                </div>
                <p className="leading-relaxed">
                  A <strong>Welcome Email</strong> detailing the full app features and legal terms has been dispatched to <strong>{activateEmail}</strong>. You must activate your account before accessing the platform.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Activation Token</label>
                <input
                  type="text"
                  value={activateToken}
                  onChange={(e) => setActivateToken(e.target.value)}
                  placeholder="Activation token from email"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleActivateAccount()}
                  disabled={loading || !activateToken}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Activating...' : 'Activate Account Now'}
                </button>

                {onOpenSystemEmails && (
                  <button
                    type="button"
                    onClick={onOpenSystemEmails}
                    className="w-full py-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open In-App Email Viewer to view Welcome Email
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
