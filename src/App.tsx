import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  UserUsageState,
  AttachedFile,
  FeatureSettingsDoc,
  UserFirestoreData,
  PulseNotePlan,
} from './types';
import {
  UploadCloud,
  Menu,
  Layers,
  Stethoscope,
  FileText,
  Send,
  Code2,
  Gift,
  Copy,
  Check,
  X,
} from 'lucide-react';
import Sidebar, { AppActiveView } from './components/Sidebar';
import PromptBar, { GeminiToolMode } from './components/PromptBar';
import { SettingsModal } from './components/SettingsModal';
import { ChatMessageBubble, ChatMessage } from './components/ChatMessageBubble';
import { PricingModal } from './components/PricingModal';
import { OnboardingLegalModal } from './components/OnboardingLegalModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ClientBillingModal } from './components/ClientBillingModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { MarketingSite } from './components/marketing/MarketingSite';
import { BlogView } from './components/marketing/BlogView';
import { AdminPage } from './components/AdminPage';
import { TeamDashboard } from './components/TeamDashboard';
import { PartnersPage } from './components/PartnersPage';
import { MyDocumentsView } from './components/MyDocumentsView';
import { TemplateGalleryView } from './components/TemplateGalleryView';
import { TemplateBuilderModal } from './components/TemplateBuilderModal';
import { LegalTrustModal } from './components/LegalTrustModal';
import { RevenueAdminDashboard } from './components/RevenueAdminDashboard';
import {
  auth,
  onAuthStateChanged,
  logOut,
  saveThreadToFirestore,
  loadUserThreadsFromFirestore,
  deleteThreadFromFirestore,
  subscribeToFeatureSettings,
  subscribeToUserProfile,
  isPulseNoteAdmin,
  isGeminiEnabledForUser,
  recordReferralInFirestore,
} from './lib/firebase';
import { understandImageWithOpenRouter } from './services/openrouter';

const TODAY_DATE_STR = () => new Date().toISOString().slice(0, 10);

function parseBlogRouteFromPath(pathname: string): { isBlog: boolean; slug: string | null } {
  if (pathname === '/blog' || pathname === '/blog/') {
    return { isBlog: true, slug: null };
  }
  if (pathname.startsWith('/blog/')) {
    const slug = pathname.slice('/blog/'.length).replace(/\/+$/, '').trim();
    return { isBlog: true, slug: slug || null };
  }
  return { isBlog: false, slug: null };
}

export function App() {
  // Global Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals & Authentication
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isClientBillingOpen, setIsClientBillingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'testimonials' | 'demo' | null>(null);
  const [toolMode, setToolMode] = useState<GeminiToolMode>('chat');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [authModalTab] = useState<'login' | 'register'>('login');
  const [, setHasAcceptedLegalOnboarding] = useState(true);

  // Feature Switches Doc & Firestore User Subscription
  const [features, setFeatures] = useState<FeatureSettingsDoc>({
    imageGenerationEnabled: false,
    videoGenerationEnabled: false,
    geminiEnabledDefault: true,
    geminiAllowedEmails: [],
    geminiDisabledEmails: [],
    updatedBy: 'system',
    updatedAt: '',
  });

  const [userFirestore, setUserFirestore] = useState<UserFirestoreData>({
    plan: 'free',
    notesUsedThisMonth: 0,
    monthResetAt: new Date().toISOString(),
    credits: 0,
    bonusNotes: 0,
    referralsCount: 0,
  });

  // Referral state
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralShareUrl, setReferralShareUrl] = useState<string>('https://pulsenoteai.in/');
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Authenticated User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('pulsenote_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Blog route slug
  const [blogSlug, setBlogSlug] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return parseBlogRouteFromPath(window.location.pathname).slug;
  });

  // Layout & Chat State
  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('pulsenote_current_chat');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [model] = useState<'2.5 Flash' | '2.5 Pro'>('2.5 Flash');
  const [activeView, setActiveView] = useState<AppActiveView>(() => {
    try {
      if (typeof window !== 'undefined') {
        if (parseBlogRouteFromPath(window.location.pathname).isBlog) return 'blog';
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'chat') return 'chat';
        if (window.location.hash.includes('chat') || window.location.hash.includes('app')) return 'chat';
        if (window.location.hash.includes('documents')) return 'documents';
        if (window.location.hash.includes('templates')) return 'gallery';
        if (window.location.hash.includes('team')) return 'team';
        if (window.location.hash.includes('partners')) return 'partners';
        if (window.location.hash.includes('revenue')) return 'revenue';
      }
    } catch {
      // ignore URL parsing errors
    }
    return 'marketing';
  });

  // Recent chats stored in localStorage
  const [recentChats, setRecentChats] = useState<Array<{ id: string; title: string; timestamp: number }>>(() => {
    try {
      const stored = localStorage.getItem('pulsenote_recent_chats');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [currentChatId, setCurrentChatId] = useState<string>('rec-current');

  // Staged File Attachment
  const [stagedAttachment, setStagedAttachment] = useState<AttachedFile | null>(null);
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // User Usage State
  const [usageState, setUsageState] = useState<UserUsageState>(() => {
    try {
      const stored = localStorage.getItem('pulsenote_user_usage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lastResetDate !== TODAY_DATE_STR()) {
          return { ...parsed, dailyPromptCount: 0, lastResetDate: TODAY_DATE_STR() };
        }
        return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return {
      dailyPromptCount: 0,
      lastResetDate: TODAY_DATE_STR(),
      isPro: false,
      activePlan: 'free',
    };
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigate to blog or specific post and keep browser URL in sync
  const navigateToBlog = (slug: string | null = null) => {
    setBlogSlug(slug);
    setActiveView('blog');
    if (typeof window !== 'undefined') {
      const targetPath = slug ? `/blog/${slug}` : '/blog';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  const navigateHome = () => {
    setBlogSlug(null);
    setActiveView('marketing');
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  // Sync / Verify User Profile Authoritatively with Backend
  const syncAuthoritativeProfile = async (email: string, name?: string, avatarUrl?: string) => {
    try {
      const res = await fetch('/api/auth/resolve-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatarUrl }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        try {
          localStorage.setItem('pulsenote_user_profile', JSON.stringify(data.user));
          if (data.token) localStorage.setItem('pulsenote_auth_token', data.token);
        } catch {
          // ignore
        }

        if (data.isAdmin || data.isPro) {
          setUsageState((prev) => {
            const updated: UserUsageState = {
              ...prev,
              isPro: true,
              activePlan: data.isAdmin ? 'admin_grant' : (data.user.subscription?.tier || 'pro_monthly'),
              dailyPromptCount: 0,
            };
            try {
              localStorage.setItem('pulsenote_user_usage', JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
        }
      }
    } catch (e) {
      console.warn('Profile sync notice:', e);
    }
  };

  // 1. Initial Load & Firebase Auth Lifecycle
  useEffect(() => {
    try {
      const accepted = localStorage.getItem('pulsenote_legal_accepted_v1');
      if (!accepted) {
        setHasAcceptedLegalOnboarding(false);
        setIsLegalModalOpen(true);
      }
    } catch {
      // ignore
    }

    if (currentUser?.email) {
      syncAuthoritativeProfile(currentUser.email, currentUser.name, currentUser.avatarUrl);
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null } | null) => {
      if (fbUser && fbUser.email) {
        syncAuthoritativeProfile(
          fbUser.email,
          fbUser.displayName || fbUser.email.split('@')[0],
          fbUser.photoURL || ''
        );

        try {
          const userThreads = await loadUserThreadsFromFirestore(fbUser.uid);
          if (userThreads && userThreads.length > 0) {
            setRecentChats(
              userThreads.map((t: { id: string; title?: string; updatedAt?: string; createdAt?: string }) => ({
                id: t.id,
                title: t.title || 'Untitled Session',
                timestamp: new Date(t.updatedAt || t.createdAt || Date.now()).getTime(),
              }))
            );
          }
        } catch (err) {
          console.warn('Firestore load notice:', err);
        }
      }
    });

    const handlePopState = () => {
      const parsed = parseBlogRouteFromPath(window.location.pathname);
      if (parsed.isBlog) {
        setBlogSlug(parsed.slug);
        setActiveView('blog');
      } else if (window.location.pathname === '/') {
        setBlogSlug(null);
        setActiveView('marketing');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Save current messages to localStorage and Firestore
  useEffect(() => {
    try {
      localStorage.setItem('pulsenote_current_chat', JSON.stringify(messages));
    } catch {
      // ignore
    }

    if (currentUser?.id && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === 'user')?.content || 'New Clinical Note';
      saveThreadToFirestore(currentUser.id, {
        id: currentChatId,
        title: firstUserMsg.slice(0, 45),
        messages,
        modelRole: model,
      });
    }
  }, [messages, currentUser?.id, currentChatId, model]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeView === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, activeView]);

  // Real-time subscribe to Firestore settings/features
  useEffect(() => {
    const unsub = subscribeToFeatureSettings((f) => {
      setFeatures(f);
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Real-time subscribe to user's plan and credits in Firestore users/{uid}
  useEffect(() => {
    const uid = currentUser?.id || (currentUser as { uid?: string } | null)?.uid || auth.currentUser?.uid;
    if (!uid) return;
    const unsub = subscribeToUserProfile(uid, (data) => {
      setUserFirestore(data);
    });
    return () => unsub();
  }, [currentUser?.id, auth.currentUser?.uid]);

  // Load user's referral code and auto-redeem any stored ?ref=CODE once signed in
  useEffect(() => {
    const uid = currentUser?.id || (currentUser as { uid?: string } | null)?.uid || auth.currentUser?.uid;
    const email = currentUser?.email || auth.currentUser?.email;
    if (!uid && !email) return;

    const query = new URLSearchParams();
    if (uid) query.set('userId', uid);
    if (email) query.set('email', email);

    fetch(`/api/referrals/me?${query.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.referralCode) {
          setReferralCode(data.referralCode);
          setReferralShareUrl(data.shareUrl || `https://pulsenoteai.in/?ref=${data.referralCode}`);
          setUserFirestore((prev) => ({
            ...prev,
            referralCode: data.referralCode,
            bonusNotes: Math.max(prev.bonusNotes || 0, Number(data.bonusNotes) || 0),
            referralsCount: Math.max(prev.referralsCount || 0, Number(data.referralsCount) || 0),
          }));
        }
      })
      .catch(() => {});

    let storedRef: string | null = null;
    try {
      storedRef = localStorage.getItem('pulsenote_referrer_code');
    } catch {
      storedRef = null;
    }

    if (storedRef && (uid || email)) {
      fetch('/api/referrals/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: storedRef, userId: uid, email }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.success) {
            try {
              localStorage.removeItem('pulsenote_referrer_code');
            } catch {
              // ignore
            }
            if (uid) {
              recordReferralInFirestore(uid, storedRef!);
            }
            if (!data.alreadyRedeemed) {
              addToast('success', data.message || 'Referral applied! Both you and your colleague received 5 extra notes.');
              setUserFirestore((prev) => ({
                ...prev,
                bonusNotes: Math.max(prev.bonusNotes || 0, Number(data.bonusNotes) || 5),
              }));
            }
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.id, currentUser?.email]);

  // URL routes & referral parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    const ref = params.get('ref');
    if (ref) {
      try {
        localStorage.setItem('pulsenote_referrer_code', ref);
      } catch {
        // ignore
      }
    }

    const blogMatch = parseBlogRouteFromPath(path);
    if (blogMatch.isBlog) {
      setBlogSlug(blogMatch.slug);
      setActiveView('blog');
    } else if (path === '/admin') {
      setActiveView('admin');
    } else if (path === '/team') {
      setActiveView('team');
    } else if (path === '/partners') {
      setActiveView('partners');
    } else if (path === '/documents' || path === '/my-documents') {
      setActiveView('documents');
    } else if (path.startsWith('/templates')) {
      setActiveView('gallery');
    } else if (path === '/pricing') {
      setIsPricingModalOpen(true);
    } else if (path === '/privacy') {
      setLegalModalType('privacy');
    } else if (path === '/terms') {
      setLegalModalType('terms');
    } else if (path === '/testimonials') {
      setLegalModalType('testimonials');
    }
  }, []);

  // Strict Admin & Per-User Gemini Feature Gating (Task 2.5)
  const isSuperAdmin = isPulseNoteAdmin(currentUser?.email, (currentUser as { emailVerified?: boolean } | null)?.emailVerified);
  const isGeminiEnabled = isSuperAdmin || isGeminiEnabledForUser(features, currentUser?.email);
  const isPaidPlan = userFirestore.plan === 'pro' || userFirestore.plan === 'team' || isSuperAdmin;
  const effectiveIsPro = isPaidPlan || usageState.isPro;
  const monthlyFreeAllowance = 5 + (userFirestore.bonusNotes || 0);

  // If Gemini is disabled for this user and they are on the 'chat' view, redirect seamlessly to My Documents
  useEffect(() => {
    if (!isGeminiEnabled && activeView === 'chat') {
      setActiveView('documents');
    }
  }, [isGeminiEnabled, activeView]);

  const handleLaunchWorkspace = () => {
    setActiveView(isGeminiEnabled ? 'chat' : 'documents');
  };

  // Start a new note
  const handleNewChat = () => {
    if (!isGeminiEnabled) return;
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 32) : 'Untitled Note';
      const newEntry = { id: `chat_${Date.now()}`, title, timestamp: Date.now() };
      const updatedRecent = [newEntry, ...recentChats.filter((c) => c.title !== title)].slice(0, 15);
      setRecentChats(updatedRecent);
      try {
        localStorage.setItem('pulsenote_recent_chats', JSON.stringify(updatedRecent));
      } catch {
        // ignore
      }
    }
    setMessages([]);
    setInput('');
    setStagedAttachment(null);
    setCurrentChatId(`chat_${Date.now()}`);
    setActiveView('chat');
  };

  // Delete a recent chat
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentChats.filter((c) => c.id !== id);
    setRecentChats(updated);
    try {
      localStorage.setItem('pulsenote_recent_chats', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (currentUser?.id) {
      deleteThreadFromFirestore(currentUser.id, id);
    }
    if (currentChatId === id) {
      setMessages([]);
    }
  };

  // Stop streaming generation handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setMessages((prev) => prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)));
    addToast('info', 'Generation stopped by user');
  };

  // Retry failed message handler
  const handleRetry = (failedMsg: ChatMessage) => {
    const idx = messages.findIndex((m) => m.id === failedMsg.id);
    const userMsg = idx > 0 ? messages[idx - 1] : null;
    if (userMsg) {
      setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
      handleSend(userMsg.content);
    }
  };

  // Main Send Action (Focused Clinical & Enterprise Documentation)
  const handleSend = async (overridePrompt?: string, overrideAttachment?: AttachedFile | null) => {
    if (!isGeminiEnabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const rawUserPrompt = overridePrompt !== undefined ? overridePrompt : input;
    const currentAttachment = overrideAttachment !== undefined ? overrideAttachment : stagedAttachment;
    const trimmedInput = typeof rawUserPrompt === 'string' ? rawUserPrompt.trim() : '';

    if (!trimmedInput && !currentAttachment) {
      addToast('error', 'Please paste a transcript or enter a prompt before sending.');
      return;
    }

    const userPrompt = trimmedInput || (currentAttachment ? `Structure clinical/enterprise document from ${currentAttachment.name}` : '');
    const userMessageId = `msg_u_${Date.now()}`;
    const assistantMsgId = `msg_a_${Date.now()}`;

    const isUnderstandingMode =
      toolMode === 'understanding' || (currentAttachment && currentAttachment.category === 'image');

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
      userAttachment:
        currentAttachment?.category === 'image'
          ? {
              previewUrl: currentAttachment.previewUrl,
              name: currentAttachment.name,
              category: currentAttachment.category,
            }
          : undefined,
    };

    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      mediaType: 'text',
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setInput('');
    setStagedAttachment(null);
    setIsGenerating(true);

    if (messages.length === 0) {
      const newRecent = [
        { id: currentChatId, title: userPrompt.slice(0, 36), timestamp: Date.now() },
        ...recentChats,
      ].slice(0, 15);
      setRecentChats(newRecent);
      try {
        localStorage.setItem('pulsenote_recent_chats', JSON.stringify(newRecent));
      } catch {
        // ignore
      }
    }

    try {
      // 1. Document / Scanned Note Image Analysis
      if (isUnderstandingMode && currentAttachment?.data) {
        const analysis = await understandImageWithOpenRouter(
          userPrompt,
          currentAttachment.data,
          currentAttachment.type || 'image/jpeg',
          'openai/gpt-4o-mini'
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: analysis, isStreaming: false } : m
          )
        );
      } else {
        // 2. Deterministic Clinical & Enterprise Documentation
        if (!isPaidPlan && userFirestore.notesUsedThisMonth >= monthlyFreeAllowance) {
          const limitMsg = `You have used all ${monthlyFreeAllowance} free notes for this month. Upgrade to Pro for unlimited notes, or share with a colleague for 5 extra notes.`;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: limitMsg, error: limitMsg, isStreaming: false }
                : m
            )
          );
          setIsPricingModalOpen(true);
          addToast('info', limitMsg);
          setIsGenerating(false);
          return;
        }

        let detectedTemplate: 'soap' | 'discharge_summary' | 'referral_letter' | 'rfc' | 'memo' | 'inspection' = 'soap';
        if (/\b(discharge summary|admission date|hospital course|discharge diagnosis)\b/i.test(userPrompt)) {
          detectedTemplate = 'discharge_summary';
        } else if (/\b(referral|referring provider|specialist consultation)\b/i.test(userPrompt)) {
          detectedTemplate = 'referral_letter';
        } else if (/\b(rfc|proposal|request for comment|oauth|architecture|migration)\b/i.test(userPrompt)) {
          detectedTemplate = 'rfc';
        } else if (/\b(memo|decision|offsite|executive|action items|stakeholders)\b/i.test(userPrompt)) {
          detectedTemplate = 'memo';
        } else if (/\b(inspection|defect|property|foundation|roof|cracks|plumbing)\b/i.test(userPrompt)) {
          detectedTemplate = 'inspection';
        }

        try {
          let token = '';
          if (auth.currentUser) {
            try {
              token = await auth.currentUser.getIdToken();
            } catch {
              // ignore
            }
          }

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;
          if (currentUser?.email) headers['x-user-email'] = currentUser.email;

          const res = await fetch('/api/notes/generate', {
            method: 'POST',
            headers,
            signal: controller.signal,
            body: JSON.stringify({
              input: userPrompt,
              templateType: detectedTemplate,
            }),
          });

          const noteData = await res.json();
          if (!res.ok) {
            if (noteData.error === 'NOTE_LIMIT_REACHED') {
              setIsPricingModalOpen(true);
              throw new Error(noteData.message || 'Free monthly note limit reached.');
            }
            throw new Error(
              noteData.message || 'Formatting failed to parse into deterministic schema. Please click Retry.'
            );
          }

          const sectionsObj: Record<string, string> = noteData.data || {};
          const fallbackPhrase = 'Not specified in transcript';
          let formattedText = '';

          if (noteData.templateType === 'soap') {
            formattedText = `### Subjective\n${sectionsObj.subjective || fallbackPhrase}\n\n### Objective\n${sectionsObj.objective || fallbackPhrase}\n\n### Assessment\n${sectionsObj.assessment || fallbackPhrase}\n\n### Plan\n${sectionsObj.plan || fallbackPhrase}`;
          } else if (noteData.templateType === 'rfc') {
            formattedText = `### Summary\n${sectionsObj.summary || fallbackPhrase}\n\n### Motivation\n${sectionsObj.motivation || fallbackPhrase}\n\n### Proposal\n${sectionsObj.proposal || fallbackPhrase}\n\n### Risks\n${sectionsObj.risks || fallbackPhrase}\n\n### Timeline\n${sectionsObj.timeline || fallbackPhrase}`;
          } else if (noteData.templateType === 'memo') {
            formattedText = `### Context\n${sectionsObj.context || fallbackPhrase}\n\n### Decision\n${sectionsObj.decision || fallbackPhrase}\n\n### Rationale\n${sectionsObj.rationale || fallbackPhrase}\n\n### Action Items\n${sectionsObj.actionItems || fallbackPhrase}`;
          } else if (noteData.templateType === 'inspection') {
            formattedText = `### Property Details\n${sectionsObj.propertyDetails || fallbackPhrase}\n\n### Findings\n${sectionsObj.findings || fallbackPhrase}\n\n### Defects\n${sectionsObj.defects || fallbackPhrase}\n\n### Recommendations\n${sectionsObj.recommendations || fallbackPhrase}`;
          } else {
            formattedText = Object.entries(sectionsObj)
              .map(([k, v]) => `### ${k.replace(/_/g, ' ').toUpperCase()}\n${v || fallbackPhrase}`)
              .join('\n\n');
          }

          // Auto-save generated document to server store
          fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: (currentUser as { uid?: string } | null)?.uid || currentUser?.id || 'user_guest',
              userEmail: currentUser?.email || 'guest@pulsenoteai.in',
              title: `${detectedTemplate.toUpperCase()} - ${userPrompt.slice(0, 30)}...`,
              templateType: detectedTemplate,
              rawInput: userPrompt,
              sections: sectionsObj,
              unverifiedTokens: noteData.verification?.unverifiedTokens || [],
              clinicalNotice: noteData.clinicalNotice,
              dataRetentionNotice: noteData.dataRetentionNotice,
            }),
          }).catch((e) => console.warn('Auto-save document failed:', e));

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: formattedText,
                    structuredNote: sectionsObj,
                    isStreaming: false,
                    error: undefined,
                  }
                : m
            )
          );

          setUserFirestore((prev) => ({
            ...prev,
            notesUsedThisMonth: prev.notesUsedThisMonth + 1,
          }));
        } catch (noteErr: unknown) {
          if (noteErr instanceof Error && noteErr.name === 'AbortError') return;
          console.error('[NoteGenerationError]', noteErr);
          const errorMsg =
            noteErr instanceof Error
              ? noteErr.message
              : 'Formatting failed to parse into deterministic schema. Please click Retry.';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: '', error: errorMsg, isStreaming: false }
                : m
            )
          );
          addToast('error', errorMsg);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errMsg = err instanceof Error ? err.message : 'Unable to generate document. Please retry.';
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false, error: errMsg } : m))
      );
      addToast('error', errMsg);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Quick Clinical & Enterprise Document Starters
  const handleQuickAction = (actionTitle: string) => {
    if (actionTitle === 'SOAP Note') {
      const p =
        '62F primary care follow-up for Type 2 diabetes and burning feet at night x 3 months. Home fasting glucose 160-195. Meds: Metformin 1000mg BID, Glipizide 5mg daily. BP 142/88, HR 78, BMI 31.2, POC HbA1c 8.6%. Decreased monofilament sensation bilaterally. Plan: add Empagliflozin 10mg daily, start Gabapentin 100mg TID, repeat labs in 12 weeks.';
      setInput(p);
      handleSend(p, null);
    } else if (actionTitle === 'Discharge Summary') {
      const p =
        'Discharge summary: Admitted 10-Oct, discharged 14-Oct. 62F acute bacterial pneumonia (Strep pneumoniae). Treated with IV Ceftriaxone then oral Augmentin 875/125 BID x 5d. Afebrile 48h, SpO2 98% RA. Follow up pulmonology in 3 weeks.';
      setInput(p);
      handleSend(p, null);
    } else if (actionTitle === 'Referral Letter') {
      const p =
        'Referral letter from Dr. Rao (Primary Care) to Dr. Sharma (Endocrinology) for 58M with T2DM HbA1c 9.4% on Metformin 1000mg BID and Glimepiride 4mg daily, progressive peripheral neuropathy x 3 months. Requesting GLP-1 evaluation.';
      setInput(p);
      handleSend(p, null);
    } else if (actionTitle === 'Engineering RFC') {
      const p =
        'Engineering RFC: Migrate primary workspace login to OAuth SSO to reduce password reset tickets by 70%. Risks: legacy service accounts need fallback token flow. Rollout in 2 weeks across staging and production.';
      setInput(p);
      handleSend(p, null);
    }
  };

  // Global Drag & Drop Attachment Handling
  const handleGlobalDragEnter = (e: React.DragEvent) => {
    if (!isGeminiEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsGlobalDragOver(true);
    }
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    if (!isGeminiEnabled) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    if (!isGeminiEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setIsGlobalDragOver(false);
      dragCounterRef.current = 0;
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    if (!isGeminiEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragOver(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isImage = file.type.startsWith('image/');
      const maxSizeBytes = 20 * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        addToast('error', `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is 20MB.`);
        return;
      }

      let category: 'image' | 'video' | 'document' | 'other' = 'other';
      if (isImage) category = 'image';
      else if (file.name.match(/\.(pdf|txt|docx|doc|csv|json|md)$/i)) category = 'document';

      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setStagedAttachment({
          id: `att_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          category,
          previewUrl: category === 'image' ? data : undefined,
          data,
        });
        addToast('success', `Attached "${file.name}"`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      localStorage.removeItem('pulsenote_user_profile');
      localStorage.removeItem('pulsenote_auth_token');
      addToast('info', 'Logged out successfully');
    } catch {
      // ignore
    }
  };

  const handleCopyReferralLink = () => {
    const url = referralShareUrl || 'https://pulsenoteai.in/';
    navigator.clipboard.writeText(url);
    setCopiedReferral(true);
    addToast('success', 'Referral link copied! Share with a colleague — both get 5 extra notes.');
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  // Public Blog Route (standalone full-screen view)
  if (activeView === 'blog') {
    return (
      <div className="h-screen w-screen overflow-y-auto scrollbar-thin bg-[#0c0e14] text-[#e3e3e3] font-sans antialiased">
        <BlogView
          slug={blogSlug}
          onSelectPost={(nextSlug) => navigateToBlog(nextSlug)}
          onBackHome={navigateHome}
          onStartWorkspace={handleLaunchWorkspace}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // Public Marketing Site (standalone full-screen view)
  if (activeView === 'marketing') {
    return (
      <div className="h-screen w-screen overflow-y-auto scrollbar-thin bg-[#131314] text-[#e3e3e3] font-sans antialiased">
        <MarketingSite
          onLaunchApp={handleLaunchWorkspace}
          onOpenPricing={() => setIsPricingModalOpen(true)}
          onOpenBlog={(slug) => navigateToBlog(slug ?? null)}
          usageState={usageState}
          currentUser={currentUser}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        {isPricingModalOpen && (
          <PricingModal
            isOpen={isPricingModalOpen}
            onClose={() => setIsPricingModalOpen(false)}
            currentUser={currentUser}
            currentPlan={userFirestore.plan}
            onShowToast={addToast}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#131314] text-[#e3e3e3] font-sans antialiased relative"
      onDragEnter={handleGlobalDragEnter}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Global Drag Overlay */}
      {isGeminiEnabled && isGlobalDragOver && (
        <div className="fixed inset-0 z-50 bg-[#131314]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 pointer-events-none">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#1e1f20] border-2 border-dashed border-[#4e8cff] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-2xl bg-[#4e8cff]/20 text-[#4e8cff]">
              <UploadCloud size={40} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Drop files here to attach to PulseNote AI
              </h3>
              <p className="text-xs text-[#9aa0a6]">
                Supports clinical notes, PDFs, DOCX, TXT, and scanned images (up to 20MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Collapsible Left Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        recentChats={recentChats}
        currentChatId={currentChatId}
        onSelectChat={(id) => {
          setCurrentChatId(id);
          if (isGeminiEnabled) setActiveView('chat');
        }}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenUpgrade={() => setIsPricingModalOpen(true)}
        onOpenSettings={() => {
          if (isSuperAdmin) setActiveView('admin');
          else setIsSettingsOpen(true);
        }}
        activeView={activeView}
        onToggleView={(view) => {
          if (view === 'blog') {
            navigateToBlog(null);
            return;
          }
          if (view === 'marketing') {
            navigateHome();
            return;
          }
          if (view === 'chat' && !isGeminiEnabled) {
            setActiveView('documents');
            return;
          }
          setActiveView(view);
        }}
        geminiEnabled={isGeminiEnabled}
        isAdmin={isSuperAdmin}
        onOpenTemplates={() => setIsTemplateBuilderOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Main Center Body */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#131314] relative">
        {/* Top Header */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-[#3c4043]/30 bg-[#131314] z-20 shrink-0">
          <div className="flex items-center gap-3">
            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="p-2 hover:bg-[#2d2e30] rounded-full text-[#c4c7c5] hover:text-white transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <Menu size={18} />
              </button>
            )}
            <h1 className="text-xl font-medium tracking-tight text-[#e3e3e3]">PulseNote AI</h1>

            {/* Note usage counter in header */}
            <div className="hidden lg:flex items-center gap-2 ml-2">
              <button
                type="button"
                onClick={() => setIsPricingModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043] text-xs font-mono text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                title={`Monthly note usage (Free allowance: ${monthlyFreeAllowance} notes/month)`}
              >
                <span>
                  {userFirestore.plan === 'free' && !isPaidPlan
                    ? `${userFirestore.notesUsedThisMonth} of ${monthlyFreeAllowance} notes used`
                    : 'Unlimited notes'}
                </span>
              </button>

              {/* Referral Trigger */}
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium text-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
                title="Share with a colleague — both get 5 extra notes"
              >
                <Gift size={13} />
                <span>+5 Free Notes</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Focused View Switcher */}
            <div className="hidden sm:flex bg-[#1e1f20] p-0.5 rounded-full border border-[#3c4043]/40 text-xs">
              {isGeminiEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveView('chat')}
                  className={`px-3 py-1 rounded-full transition-colors font-medium cursor-pointer ${
                    activeView === 'chat'
                      ? 'bg-[#2d2e30] text-white shadow-sm'
                      : 'text-[#9aa0a6] hover:text-white'
                  }`}
                >
                  Notes
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveView('documents')}
                className={`px-3 py-1 rounded-full transition-colors font-medium cursor-pointer ${
                  activeView === 'documents'
                    ? 'bg-[#2d2e30] text-white shadow-sm'
                    : 'text-[#9aa0a6] hover:text-white'
                }`}
              >
                My Documents
              </button>
              <button
                type="button"
                onClick={() => setActiveView('gallery')}
                className={`px-3 py-1 rounded-full transition-colors font-medium cursor-pointer ${
                  activeView === 'gallery'
                    ? 'bg-[#2d2e30] text-white shadow-sm'
                    : 'text-[#9aa0a6] hover:text-white'
                }`}
              >
                Templates
              </button>
            </div>

            {/* Custom Templates Quick Button */}
            <button
              type="button"
              onClick={() => setIsTemplateBuilderOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043] text-xs font-medium text-[#c4c7c5] hover:text-white transition-all cursor-pointer shadow-sm"
              title="Custom template builder"
            >
              <Layers size={13} className="text-amber-400" />
              <span>Custom</span>
            </button>

            {/* Admin Switch Quick Button: strictly for verified admins */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  activeView === 'admin'
                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                    : 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border-red-500/30'
                }`}
                title="Admin Feature Gating Portal (/admin)"
              >
                <span>Admin</span>
              </button>
            )}

            {/* Profile Avatar / Trigger */}
            <button
              type="button"
              onClick={() => {
                if (currentUser) setIsClientBillingOpen(true);
                else setIsAuthModalOpen(true);
              }}
              className="relative p-0.5 rounded-full hover:ring-2 hover:ring-[#4e8cff] transition-all cursor-pointer"
              title={currentUser ? `${currentUser.name} (${currentUser.email})` : 'Sign In'}
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4e8cff] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold border border-[#3c4043]">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <span className="text-[10px]">?</span>}
                </div>
              )}
              {effectiveIsPro && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4e8cff] border-2 border-[#131314]" />
              )}
            </button>
          </div>
        </header>

        {/* 3. Active Workspace View */}
        {activeView === 'admin' ? (
          <AdminPage
            currentUser={currentUser}
            features={features}
            onBack={() => setActiveView(isGeminiEnabled ? 'chat' : 'documents')}
            onShowToast={addToast}
          />
        ) : activeView === 'team' ? (
          <TeamDashboard
            currentUser={currentUser as never}
            teamId={userFirestore.teamId}
            onBack={() => setActiveView(isGeminiEnabled ? 'chat' : 'documents')}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onShowToast={addToast}
          />
        ) : activeView === 'partners' ? (
          <PartnersPage
            onBack={() => setActiveView(isGeminiEnabled ? 'chat' : 'documents')}
            onShowToast={addToast}
          />
        ) : activeView === 'gallery' ? (
          <TemplateGalleryView
            onSelectTemplate={(_templateType, rawInput) => {
              if (isGeminiEnabled) {
                setInput(rawInput);
                setActiveView('chat');
              } else {
                setActiveView('documents');
              }
            }}
            onBack={() => setActiveView(isGeminiEnabled ? 'chat' : 'documents')}
          />
        ) : activeView === 'revenue' ? (
          <RevenueAdminDashboard
            currentUser={currentUser as never}
            onBack={() => setActiveView(isGeminiEnabled ? 'chat' : 'documents')}
            onShowToast={addToast}
          />
        ) : activeView === 'chat' && isGeminiEnabled ? (
          <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 py-4 scrollbar-thin">
            {messages.length === 0 ? (
              /* Focused Clinical & Enterprise Documentation Empty State */
              <div className="max-w-[800px] w-full mx-auto mt-[6vh] flex-1 flex flex-col justify-start">
                <h1 className="text-3xl md:text-4xl font-semibold mb-2 tracking-tight text-white">
                  Hello, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Clinician'}
                </h1>
                <p className="text-sm text-[#9aa0a6] mb-8">
                  Paste an encounter dictation or choose a deterministic clinical or enterprise template below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  <button
                    type="button"
                    onClick={() => handleQuickAction('SOAP Note')}
                    className="text-left bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/40 p-4 rounded-2xl cursor-pointer transition-all shadow-sm flex flex-col justify-between h-[120px]"
                  >
                    <span className="text-sm font-medium text-[#e3e3e3]">SOAP Note</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center self-end">
                      <Stethoscope size={17} />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction('Discharge Summary')}
                    className="text-left bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/40 p-4 rounded-2xl cursor-pointer transition-all shadow-sm flex flex-col justify-between h-[120px]"
                  >
                    <span className="text-sm font-medium text-[#e3e3e3]">Discharge Summary</span>
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center self-end">
                      <FileText size={17} />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction('Referral Letter')}
                    className="text-left bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/40 p-4 rounded-2xl cursor-pointer transition-all shadow-sm flex flex-col justify-between h-[120px]"
                  >
                    <span className="text-sm font-medium text-[#e3e3e3]">Referral Letter</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center self-end">
                      <Send size={17} />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction('Engineering RFC')}
                    className="text-left bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/40 p-4 rounded-2xl cursor-pointer transition-all shadow-sm flex flex-col justify-between h-[120px]"
                  >
                    <span className="text-sm font-medium text-[#e3e3e3]">Engineering RFC</span>
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center self-end">
                      <Code2 size={17} />
                    </div>
                  </button>
                </div>

                {/* Guest Sign-In & Referral Prompt */}
                {!currentUser && (
                  <div className="p-4 rounded-2xl bg-[#1a1d26] border border-[#3c4043]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-[#c4c7c5]">
                      <span className="font-semibold text-white">Guest trial active (5 free notes/month).</span>{' '}
                      Sign in to sync documents across devices and earn +5 bonus notes per colleague referral.
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] text-white font-semibold shrink-0 cursor-pointer transition"
                    >
                      Sign In / Save Notes
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Structured Document Output Feed */
              <div className="max-w-[800px] w-full mx-auto space-y-6 flex-1 py-4">
                {messages.map((m) => (
                  <ChatMessageBubble
                    key={m.id}
                    message={m}
                    isPaidPlan={isPaidPlan}
                    onOpenPricing={() => setIsPricingModalOpen(true)}
                    onShowToast={addToast}
                    onRetry={handleRetry}
                  />
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}

            {/* Sticky PromptBar — strictly inside isGeminiEnabled branch */}
            <div className="max-w-[800px] w-full mx-auto mt-auto pt-4 sticky bottom-4 z-20">
              <PromptBar
                input={input}
                setInput={setInput}
                onSend={handleSend}
                onStop={handleStopGeneration}
                isGenerating={isGenerating}
                attachedFile={stagedAttachment}
                onSetAttachedFile={setStagedAttachment}
                toolMode={toolMode}
                onSetToolMode={setToolMode}
                onStartVoice={() => addToast('info', 'Voice dictation active. Speak into your microphone.')}
                onShowToast={addToast}
              />
              <p className="text-[11px] text-center text-[#9aa0a6] mt-2.5">
                AI-assisted draft. Do not enter patient-identifying information.
              </p>
            </div>
          </div>
        ) : (
          /* Default non-AI workspace view: My Documents */
          <MyDocumentsView
            currentUser={currentUser as never}
            isPaidPlan={isPaidPlan}
            onBack={() => setActiveView(isGeminiEnabled ? 'chat' : 'marketing')}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onShowToast={addToast}
            onSignOut={handleLogout}
          />
        )}
      </div>

      {/* 4. Modals */}
      {/* Referral Loop Modal */}
      {isReferralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e1f20] border border-[#3c4043] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Gift size={20} />
                <h3 className="text-base font-bold text-white">Share with a colleague</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#c4c7c5] leading-relaxed">
              Share your unique link with a clinician or teammate. When they sign in with your link, <span className="text-white font-semibold">both of you get 5 extra notes</span> added to your monthly allowance.
            </p>

            {currentUser ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#131314] border border-[#3c4043] flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-emerald-300 truncate">{referralShareUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyReferralLink}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedReferral ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedReferral ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#9aa0a6]">
                  <span>Your code: <strong className="text-white font-mono">{referralCode || 'Generating...'}</strong></span>
                  <span>Bonus notes earned: <strong className="text-emerald-400">+{userFirestore.bonusNotes || 0}</strong></span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-amber-300">
                  Sign in to generate your unique referral code and track bonus notes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsReferralModalOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] text-white text-xs font-semibold cursor-pointer"
                >
                  Sign In to Get Your Referral Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing / Premium Upgrade Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentPlan={userFirestore.plan}
        currentCredits={userFirestore.credits}
        notesUsedThisMonth={userFirestore.notesUsedThisMonth}
        onUpgradeSuccess={(newPlan: PulseNotePlan) => {
          setUserFirestore((prev) => ({ ...prev, plan: newPlan }));
          setUsageState((prev) => {
            const updated: UserUsageState = { ...prev, isPro: true, activePlan: newPlan as UserUsageState['activePlan'] };
            try {
              localStorage.setItem('pulsenote_user_usage', JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          setIsPricingModalOpen(false);
          addToast('success', `Upgraded to PulseNote AI ${newPlan.toUpperCase()}! Unlimited notes active.`);
        }}
        onShowToast={addToast}
      />

      {/* Custom Template Builder Modal */}
      <TemplateBuilderModal
        isOpen={isTemplateBuilderOpen}
        onClose={() => setIsTemplateBuilderOpen(false)}
        userId={currentUser?.id || ''}
        userPlan={userFirestore.plan}
        customTemplatesCount={0}
        teamId={userFirestore.teamId}
        onOpenPricing={() => {
          setIsTemplateBuilderOpen(false);
          setIsPricingModalOpen(true);
        }}
        onShowToast={addToast}
      />

      {/* Legal & Trust Modal */}
      <LegalTrustModal type={legalModalType} onClose={() => setLegalModalType(null)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user: UserProfile) => {
          setCurrentUser(user);
          try {
            localStorage.setItem('pulsenote_user_profile', JSON.stringify(user));
          } catch {
            // ignore
          }
          if (user.role === 'admin' || isPulseNoteAdmin(user.email, (user as { emailVerified?: boolean }).emailVerified)) {
            setUsageState((prev) => ({
              ...prev,
              isPro: true,
              activePlan: 'admin_grant',
              dailyPromptCount: 0,
            }));
            addToast('success', `Welcome Super Admin, ${user.name}!`);
          } else {
            addToast('success', `Welcome back, ${user.name}!`);
          }
          setIsAuthModalOpen(false);
        }}
      />

      {/* Admin Panel Modal */}
      {isAdminPanelOpen && (
        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Client Billing Modal */}
      {isClientBillingOpen && (
        <ClientBillingModal
          isOpen={isClientBillingOpen}
          onClose={() => setIsClientBillingOpen(false)}
          currentUser={currentUser}
          onOpenPricing={() => {
            setIsClientBillingOpen(false);
            setIsPricingModalOpen(true);
          }}
          onRefreshUser={() => {
            if (currentUser?.email) {
              syncAuthoritativeProfile(currentUser.email, currentUser.name, currentUser.avatarUrl);
            }
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Settings & Help Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        usageState={usageState}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenApiKey={() => addToast('info', 'API provider keys are managed securely on the server.')}
      />

      {/* Legal Onboarding Modal */}
      <OnboardingLegalModal
        isOpen={isLegalModalOpen}
        onAccept={() => {
          try {
            localStorage.setItem('pulsenote_legal_accepted_v1', 'true');
          } catch {
            // ignore
          }
          setHasAcceptedLegalOnboarding(true);
          setIsLegalModalOpen(false);
        }}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
