import React, { useState, useEffect, useRef } from 'react';
import { 
  FlowProject, 
  FlowNode, 
  FlowNodeType, 
  FlowConnection, 
  FlowCollaborator, 
  UserProfile, 
  UserUsageState, 
  SubscriptionPlan, 
  AttachedFile,
  TransformedReport,
  FeatureSettingsDoc,
  UserFirestoreData,
  PulseNotePlan
} from './types';
import { 
  UploadCloud, 
  Sparkles, 
  Search, 
  Code, 
  Lightbulb, 
  Image as ImageIcon, 
  LayoutGrid, 
  MessageSquare, 
  Gem, 
  Menu,
  ChevronDown,
  Settings,
  Key,
  Film,
  Layers,
  Lock,
  Plus
} from 'lucide-react';
import Sidebar, { AppActiveView } from './components/Sidebar';
import PromptBar, { GeminiToolMode } from './components/PromptBar';
import { SettingsModal } from './components/SettingsModal';
import { ChatMessageBubble, ChatMessage } from './components/ChatMessageBubble';
import { FlowCanvas } from './components/flow/FlowCanvas';
import { FlowProjectHeader } from './components/flow/FlowProjectHeader';
import { FlowCommandBar } from './components/flow/FlowCommandBar';
import { FlowNodeVersionModal } from './components/flow/FlowNodeVersionModal';
import { FlowNodeCommentDrawer } from './components/flow/FlowNodeCommentDrawer';
import { PricingModal } from './components/PricingModal';
import { OnboardingLegalModal } from './components/OnboardingLegalModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ClientBillingModal } from './components/ClientBillingModal';
import { GeminiStudioModal } from './components/GeminiStudioModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { MarketingSite } from './components/marketing/MarketingSite';
import { ImageStudio } from './components/ImageStudio';
import { VideoStudio } from './components/VideoStudio';
import { AdminPage } from './components/AdminPage';
import { TeamDashboard } from './components/TeamDashboard';
import { PartnersPage } from './components/PartnersPage';
import { TemplateBuilderModal } from './components/TemplateBuilderModal';
import { LegalTrustModal } from './components/LegalTrustModal';
import { generateImageWithImagen, generateVideoWithVeo as generateVeo3Video } from './services/mediaService';
import { 
  auth, 
  onAuthStateChanged, 
  logOut, 
  saveThreadToFirestore, 
  loadUserThreadsFromFirestore, 
  deleteThreadFromFirestore, 
  saveDocumentToFirestore,
  subscribeToFeatureSettings,
  subscribeToUserProfile,
  isPulseNoteAdmin
} from './lib/firebase';
import {
  chatCompletion,
  streamChatCompletion,
  understandImageWithOpenRouter,
  generateAnimationWithOpenRouter,
  getOpenRouterApiKey,
  setAdminEmail,
  OPENROUTER_MODELS,
  SYSTEM_PROMPT,
  precheck_prompt,
  generateVideoWithVeo,
} from './services/openrouter';
import { generateVideoFromPrompt, downloadVideo } from './lib/videoGenerator';

const IMAGE_KEYWORDS = /\b(create|generate|make|draw|design|illustrate)\b.*\b(image|picture|photo|art|illustration|drawing)\b/i;
const VIDEO_KEYWORDS = /\b(create|generate|make|produce|animate|render)\b.*\b(video|clip|movie|animation|scene)\b/i;

const TODAY_DATE_STR = () => new Date().toISOString().slice(0, 10);

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
  const [isGeminiStudioOpen, setIsGeminiStudioOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'testimonials' | 'demo' | null>(null);
  const [toolMode, setToolMode] = useState<GeminiToolMode>('chat');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [hasAcceptedLegalOnboarding, setHasAcceptedLegalOnboarding] = useState(true);

  // Feature Switches Doc & Firestore User Subscription
  const [features, setFeatures] = useState<FeatureSettingsDoc>({
    imageGenerationEnabled: false,
    videoGenerationEnabled: false,
    updatedBy: 'system',
    updatedAt: '',
  });

  const [userFirestore, setUserFirestore] = useState<UserFirestoreData>({
    plan: 'free',
    notesUsedThisMonth: 0,
    monthResetAt: new Date().toISOString(),
    credits: 0,
  });

  // Authenticated User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('pulsenote_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Gemini Layout & Chat State
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
  const [model, setModel] = useState<'2.5 Flash' | '2.5 Pro'>('2.5 Flash');
  const [activeView, setActiveView] = useState<AppActiveView>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'chat') return 'chat';
        if (params.get('view') === 'image') return 'image';
        if (params.get('view') === 'video') return 'video';
        if (params.get('view') === 'canvas') return 'canvas';
        if (window.location.hash.includes('image')) return 'image';
        if (window.location.hash.includes('video')) return 'video';
        if (window.location.hash.includes('chat') || window.location.hash.includes('app')) return 'chat';
      }
    } catch {}
    return 'marketing';
  });
  const [isDeepResearch, setIsDeepResearch] = useState(false);

  // Recent chats stored in localStorage
  const [recentChats, setRecentChats] = useState<Array<{ id: string; title: string; timestamp: number }>>(() => {
    try {
      const stored = localStorage.getItem('pulsenote_recent_chats');
      return stored
        ? JSON.parse(stored)
        : [
            { id: 'rec-1', title: 'How to build Gemini clone', timestamp: Date.now() - 3600000 },
            { id: 'rec-2', title: 'Premium plan logic', timestamp: Date.now() - 7200000 },
          ];
    } catch {
      return [];
    }
  });
  const [currentChatId, setCurrentChatId] = useState<string>('rec-current');

  // Staged File Attachment for Prompt Input & Drag-and-Drop Pipeline
  const [stagedAttachment, setStagedAttachment] = useState<AttachedFile | null>(null);
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // User Usage State & Daily Monetization Tracking (3 Free Prompts / Day)
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
    } catch {}
    return {
      dailyPromptCount: 0,
      lastResetDate: TODAY_DATE_STR(),
      isPro: false,
      activePlan: 'free',
    };
  });

  // Google Flow Engine Projects & State
  const [projects, setProjects] = useState<FlowProject[]>([]);
  const [currentProject, setCurrentProject] = useState<FlowProject>({
    id: 'proj_flow_genesis',
    name: 'Autonomous Vision & Neural Launch',
    description: 'Multi-modal workspace exploring Imagen 3 generative pipelines and Deep Research',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now(),
    ownerId: 'usr_lead_arch',
    ownerName: 'Lead Architect',
    viewport: { x: 80, y: 80, zoom: 0.85 },
    collaborators: [],
    nodes: [],
    connections: [],
  });

  const [collaborators, setCollaborators] = useState<FlowCollaborator[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeVersionNode, setActiveVersionNode] = useState<FlowNode | null>(null);
  const [activeCommentNode, setActiveCommentNode] = useState<FlowNode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // WebSocket reference for live collaboration
  const wsRef = useRef<WebSocket | null>(null);

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
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
        } catch {}

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
            } catch {}
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
    } catch (e) {
      console.warn('Legal check notice:', e);
    }

    if (currentUser?.email) {
      syncAuthoritativeProfile(currentUser.email, currentUser.name, currentUser.avatarUrl);
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: any) => {
      if (fbUser && fbUser.email) {
        syncAuthoritativeProfile(
          fbUser.email,
          fbUser.displayName || fbUser.email.split('@')[0],
          fbUser.photoURL || ''
        );

        // Load persisted threads from Firestore
        try {
          const userThreads = await loadUserThreadsFromFirestore(fbUser.uid);
          if (userThreads && userThreads.length > 0) {
            setRecentChats(userThreads.map((t: any) => ({
              id: t.id,
              title: t.title || 'Untitled Session',
              timestamp: new Date(t.updatedAt || t.createdAt).getTime(),
            })));
          }
        } catch (err) {
          console.warn('Firestore load notice:', err);
        }
      }
    });

    fetch('/api/flow/projects')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.projects?.length > 0) {
          setProjects(data.projects);
          setCurrentProject(data.projects[0]);
        }
      })
      .catch(() => {});

    return () => unsubscribe();
  }, []);

  // Save current messages to localStorage and Firestore
  useEffect(() => {
    try {
      localStorage.setItem('pulsenote_current_chat', JSON.stringify(messages));
    } catch {}

    if (currentUser?.id && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === 'user')?.content || 'New Conversation';
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

  // Real-time subscribe to Firestore settings/features (Section 1)
  useEffect(() => {
    const unsub = subscribeToFeatureSettings((f) => {
      setFeatures(f);
    });
    return () => unsub();
  }, []);

  // Real-time subscribe to user's plan and credits in Firestore users/{uid} (Section 4)
  useEffect(() => {
    const uid = currentUser?.id || (currentUser as any)?.uid || auth.currentUser?.uid;
    if (!uid) return;
    const unsub = subscribeToUserProfile(uid, (data) => {
      setUserFirestore(data);
    });
    return () => unsub();
  }, [currentUser?.id, (currentUser as any)?.uid, auth.currentUser?.uid]);

  // URL routes & referral parameter (Section 8 & 9)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    const ref = params.get('ref');
    if (ref) {
      try {
        localStorage.setItem('pulsenote_referrer_code', ref);
      } catch {}
    }

    if (path === '/admin') {
      setActiveView('admin');
    } else if (path === '/team') {
      setActiveView('team');
    } else if (path === '/partners') {
      setActiveView('partners');
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

  // Strict Admin Email Verification (jayeshofficial@gmail.com, contact@pulsenoteai.in)
  const isSuperAdmin = isPulseNoteAdmin(currentUser?.email, (currentUser as any)?.emailVerified);
  const isPaidPlan = userFirestore.plan === 'pro' || userFirestore.plan === 'team' || isSuperAdmin;
  const effectiveIsPro = isPaidPlan || usageState.isPro;

  // Model switch with Premium logic check
  const handleModelChange = (newModel: '2.5 Flash' | '2.5 Pro') => {
    if (newModel === '2.5 Pro' && !effectiveIsPro) {
      addToast('info', 'Upgrade to Premium to use 2.5 Pro.');
      setIsPricingModalOpen(true);
      return;
    }
    setModel(newModel);
  };

  // Start a new chat
  const handleNewChat = () => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 32) : 'Untitled Chat';
      const newEntry = { id: `chat_${Date.now()}`, title, timestamp: Date.now() };
      const updatedRecent = [newEntry, ...recentChats.filter((c) => c.title !== title)].slice(0, 15);
      setRecentChats(updatedRecent);
      try {
        localStorage.setItem('pulsenote_recent_chats', JSON.stringify(updatedRecent));
      } catch {}
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
    } catch {}
    if (currentUser?.id) {
      deleteThreadFromFirestore(currentUser.id, id);
    }
    if (currentChatId === id) {
      setMessages([]);
    }
  };

  // Helper to construct type-safe TransformedReport for FlowNodes
  const createReportObject = (
    title: string,
    rawInput: string,
    text: string,
    mediaType: 'text' | 'image' | 'video' = 'text'
  ): TransformedReport => ({
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    industry: 'general',
    title: title || 'Intelligence Report',
    rawInput: rawInput || '',
    markdownReport: text,
    mediaType,
    executiveSummary: text.slice(0, 180) + '...',
    sections: [
      {
        heading: 'Synthesis',
        content: text,
      },
    ],
    actionItems: [],
    detectedEntities: [],
    keyTakeaways: [],
    complianceDisclaimer: '> *[Legal & Professional Notice]: Pulse Note AI is an assistive productivity and creative tool. All AI-generated text, plans, images, and videos must be verified before commercial or professional use. The platform bears zero liability.*',
  });

  // Stop streaming generation handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
    addToast('info', 'Generation stopped by user');
  };

  // Retry failed message handler
  const handleRetry = (failedMsg: ChatMessage) => {
    const idx = messages.findIndex((m) => m.id === failedMsg.id);
    const userMsg = idx > 0 ? messages[idx - 1] : null;
    if (userMsg) {
      setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
      handleSend(userMsg.content, undefined, failedMsg.mediaType as any);
    }
  };

  // Main Send Action (PulseNote AI Google Gemini Chat with Streaming, Media & Live Canvas Sync)
  const handleSend = async (
    overridePrompt?: string,
    overrideAttachment?: AttachedFile | null,
    overrideType?: FlowNodeType
  ) => {
    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Determine the raw prompt and attachment safely
    const rawUserPrompt = overridePrompt !== undefined ? overridePrompt : input;
    const currentAttachment = overrideAttachment !== undefined ? overrideAttachment : stagedAttachment;
    // Type-safe trim: never call .trim() on a non-string (prevents "(a || '').trim is not a function" crash)
    const trimmedInput = typeof rawUserPrompt === 'string' ? rawUserPrompt.trim() : '';

    if (!trimmedInput && !currentAttachment) {
      addToast('error', 'Please enter a message before sending.');
      return;
    }

    // Daily & Pro Limits
    if (!effectiveIsPro && model === '2.5 Pro') {
      addToast('info', 'Upgrade to Premium to use 2.5 Pro.');
      setIsPricingModalOpen(true);
      return;
    }

    if (!effectiveIsPro && usageState.dailyPromptCount >= 3) {
      addToast('error', 'Daily free limit reached (3/3 prompts used). Upgrade to Premium for unlimited queries.');
      setIsPricingModalOpen(true);
      return;
    }

    const userPrompt = trimmedInput || (currentAttachment ? `Analyze ${currentAttachment.name}` : '');
    const userMessageId = `msg_u_${Date.now()}`;
    const assistantMsgId = `msg_a_${Date.now()}`;
    const canvasNodeId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Mode determination
    const isVideoMode =
      toolMode === 'video' ||
      overrideType === 'video' ||
      VIDEO_KEYWORDS.test(userPrompt) ||
      /\b(generate video|create video|make video|make a video|veo|cinematic scene|video of)\b/i.test(userPrompt);

    const isImageMode =
      !isVideoMode &&
      (toolMode === 'image' ||
        overrideType === 'image' ||
        IMAGE_KEYWORDS.test(userPrompt) ||
        /\b(generate image|draw|create image|picture of|photo of|illustration of)\b/i.test(userPrompt));

    const isAnimationMode =
      !isImageMode &&
      !isVideoMode &&
      (toolMode === 'animation' ||
        /\b(generate animation|animate svg|canvas animation|css animation|live animation|interactive animation)\b/i.test(userPrompt));

    const isUnderstandingMode =
      !isImageMode &&
      !isVideoMode &&
      !isAnimationMode &&
      (toolMode === 'understanding' || (currentAttachment && currentAttachment.category === 'image'));

    const calculatedNodeType: FlowNodeType = isVideoMode
      ? 'video'
      : isImageMode
      ? 'image'
      : isAnimationMode
      ? 'code'
      : 'research';

    // Insert user and assistant messages
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
      userAttachment: currentAttachment?.category === 'image' ? {
        previewUrl: currentAttachment.previewUrl,
        name: currentAttachment.name,
        category: currentAttachment.category,
      } : undefined,
    };

    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      mediaType: isVideoMode ? 'video' : isImageMode ? 'image' : isAnimationMode ? 'animation' : 'text',
      statusMessage: isVideoMode ? 'Submitting prompt to Veo (veo-3.1-generate-preview)...' : undefined,
      progressPercent: isVideoMode ? 10 : undefined,
    };

    // Calculate canvas node position
    const existingNodes = currentProject.nodes || [];
    const nodeCount = existingNodes.length;
    const nodeX = 80 + (nodeCount % 3) * 440;
    const nodeY = 80 + Math.floor(nodeCount / 3) * 440;

    const initialCanvasNode: FlowNode = {
      id: canvasNodeId,
      type: calculatedNodeType,
      title: userPrompt.slice(0, 36) || 'Gemini Intelligence',
      prompt: userPrompt,
      x: nodeX,
      y: nodeY,
      status: 'generating',
      progress: 25,
      attachment: currentAttachment || undefined,
      ownerName: currentUser?.name || 'PulseNote User',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [],
      comments: [],
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setCurrentProject((prev) => ({
      ...prev,
      nodes: [...(prev.nodes || []), initialCanvasNode],
    }));

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
      } catch {}
    }

    try {
      // 1. IMAGE GENERATION (Imagen 4.0 "imagen-4.0-generate-001" via ai.models.generateImages)
      if (isImageMode) {
        // Enforce admin feature switch
        if (!features.imageGenerationEnabled) {
          const errorMsg = 'This feature is turned off by the platform administrator.';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: errorMsg, error: errorMsg, mediaType: 'text', isStreaming: false }
                : m
            )
          );
          addToast('error', errorMsg);
          setIsGenerating(false);
          return;
        }

        try {
          // Read from React state at submit time; prompt sent EXACTLY as typed
          const imageResult = await generateImageWithImagen(userPrompt, '1:1');

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `Here is your image: Generated with Google Imagen 4.0 (imagen-4.0-generate-001).`,
                    mediaType: 'image',
                    mediaUrl: imageResult.imageUrl, // data:image/png;base64,...
                    isStreaming: false,
                  }
                : m
            )
          );
          setCurrentProject((prev) => ({
            ...prev,
            nodes: (prev.nodes || []).map((n) =>
              n.id === canvasNodeId
                ? {
                    ...n,
                    status: 'completed',
                    progress: 100,
                    type: 'image',
                    report: createReportObject(n.title, userPrompt, 'Image generated successfully with Imagen 4.0', 'image'),
                  }
                : n
            ),
          }));
        } catch (imgErr: any) {
          console.error('Imagen generation error:', imgErr);
          const errorMsg = imgErr?.message || 'Image generation failed or was blocked by safety filters.';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: errorMsg,
                    error: errorMsg,
                    mediaType: 'text',
                    isStreaming: false,
                  }
                : m
            )
          );
          addToast('error', errorMsg);
          return;
        }
      }

      // 2. VIDEO GENERATION (Veo 3.0 "veo-3.0-generate-001" via ai.models.generateVideos)
      else if (isVideoMode) {
        // Enforce admin feature switch
        if (!features.videoGenerationEnabled) {
          const errorMsg = 'This feature is turned off by the platform administrator.';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: errorMsg, error: errorMsg, mediaType: 'text', isStreaming: false }
                : m
            )
          );
          addToast('error', errorMsg);
          setIsGenerating(false);
          return;
        }

        try {
          // Prompt sent EXACTLY as typed, long-running operation polled every 10s (max 6 mins)
          const videoResult = await generateVeo3Video(
            userPrompt,
            (status, percent) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        statusMessage: status,
                        progressPercent: percent,
                      }
                    : m
                )
              );
            },
            '16:9'
          );

          // Render video with server-downloaded blob/object URL in <video controls>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `Here is your video: Generated with Google Veo 3.0 (veo-3.0-generate-001).`,
                    mediaType: 'video',
                    mediaUrl: videoResult.blobUrl, // Blob URL (never raw storage URI)
                    videoBlob: videoResult.blob,
                    videoParams: {
                      videoUrl: videoResult.blobUrl,
                      title: userPrompt,
                      aspectRatio: '16:9',
                    } as any,
                    isStreaming: false,
                    statusMessage: undefined,
                    progressPercent: 100,
                  }
                : m
            )
          );

          setCurrentProject((prev) => ({
            ...prev,
            nodes: (prev.nodes || []).map((n) =>
              n.id === canvasNodeId
                ? {
                    ...n,
                    status: 'completed',
                    progress: 100,
                    type: 'video',
                    videoParams: {
                      videoUrl: videoResult.blobUrl,
                      title: userPrompt,
                      aspectRatio: '16:9',
                    } as any,
                    report: createReportObject(n.title, userPrompt, `Video ready: ${videoResult.blobUrl}`, 'video'),
                  }
                : n
            ),
          }));
        } catch (vidErr: any) {
          console.error('Veo video generation error:', vidErr);
          const errorMsg = vidErr?.message || 'Video generation failed or was blocked by safety filters.';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: errorMsg,
                    error: errorMsg,
                    mediaType: 'text',
                    isStreaming: false,
                    statusMessage: undefined,
                    progressPercent: undefined,
                  }
                : m
            )
          );
          addToast('error', errorMsg);
          return;
        }
      }

      // 3. LIVE ANIMATION (SVG, CSS, Canvas code inside Sandboxed Iframe via OpenRouter)
      else if (isAnimationMode) {
        const animResult = await generateAnimationWithOpenRouter(userPrompt, 'openai/gpt-4o-mini');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `Live interactive animation rendered for: "${userPrompt}"`,
                  mediaType: 'animation',
                  animationCode: animResult.code,
                  isStreaming: false,
                }
              : m
          )
        );
        setCurrentProject((prev) => ({
          ...prev,
          nodes: (prev.nodes || []).map((n) =>
            n.id === canvasNodeId
              ? {
                  ...n,
                  status: 'completed',
                  progress: 100,
                  type: 'code',
                  report: createReportObject(n.title, userPrompt, animResult.code, 'text'),
                }
              : n
          ),
        }));
      }

      // 4. IMAGE UNDERSTANDING (User uploads an image plus a question via OpenRouter Vision)
      else if (isUnderstandingMode && currentAttachment?.data) {
        const analysis = await understandImageWithOpenRouter(
          userPrompt,
          currentAttachment.data,
          currentAttachment.type || 'image/jpeg',
          'openai/gpt-4o-mini'
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: analysis,
                  isStreaming: false,
                }
              : m
          )
        );
        setCurrentProject((prev) => ({
          ...prev,
          nodes: (prev.nodes || []).map((n) =>
            n.id === canvasNodeId
              ? {
                  ...n,
                  status: 'completed',
                  progress: 100,
                  report: createReportObject(n.title, userPrompt, analysis, 'text'),
                }
              : n
          ),
        }));
      }

      // 5. DETERMINISTIC CLINICAL & ENTERPRISE DOCUMENTATION (Section 10)
      else {
        // Enforce Free user limit: 5 notes per month
        if (!isPaidPlan && userFirestore.notesUsedThisMonth >= 5) {
          const limitMsg = 'You have used all 5 free notes for this month. Upgrade to Pro for unlimited notes.';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: limitMsg,
                    error: limitMsg,
                    isStreaming: false,
                  }
                : m
            )
          );
          setIsPricingModalOpen(true);
          addToast('info', limitMsg);
          setIsGenerating(false);
          return;
        }

        // Detect appropriate template type based on prompt semantics
        let detectedTemplate: 'soap' | 'rfc' | 'memo' | 'inspection' = 'soap';
        if (/\b(rfc|proposal|request for comment|auth2|oauth|architecture|migration)\b/i.test(userPrompt)) {
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
            } catch {}
          }

          const res = await fetch('/api/notes/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
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
            throw new Error(noteData.message || 'Formatting failed to parse into deterministic schema. Please click Retry.');
          }

          const sectionsObj = noteData.data || {};
          let formattedText = '';

          if (noteData.templateType === 'soap') {
            formattedText = `### Subjective\n${sectionsObj.subjective || 'Not documented'}\n\n### Objective\n${sectionsObj.objective || 'Not documented'}\n\n### Assessment\n${sectionsObj.assessment || 'Not documented'}\n\n### Plan\n${sectionsObj.plan || 'Not documented'}`;
          } else if (noteData.templateType === 'rfc') {
            formattedText = `### Summary\n${sectionsObj.summary || 'Not documented'}\n\n### Motivation\n${sectionsObj.motivation || 'Not documented'}\n\n### Proposal\n${sectionsObj.proposal || 'Not documented'}\n\n### Risks\n${sectionsObj.risks || 'Not documented'}\n\n### Timeline\n${sectionsObj.timeline || 'Not documented'}`;
          } else if (noteData.templateType === 'memo') {
            formattedText = `### Context\n${sectionsObj.context || 'Not documented'}\n\n### Decision\n${sectionsObj.decision || 'Not documented'}\n\n### Rationale\n${sectionsObj.rationale || 'Not documented'}\n\n### Action Items\n${sectionsObj.actionItems || 'Not documented'}`;
          } else if (noteData.templateType === 'inspection') {
            formattedText = `### Property Details\n${sectionsObj.propertyDetails || 'Not documented'}\n\n### Findings\n${sectionsObj.findings || 'Not documented'}\n\n### Defects\n${sectionsObj.defects || 'Not documented'}\n\n### Recommendations\n${sectionsObj.recommendations || 'Not documented'}`;
          } else {
            formattedText = Object.entries(sectionsObj)
              .map(([k, v]) => `### ${k.toUpperCase()}\n${v}`)
              .join('\n\n');
          }

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

          setCurrentProject((prev) => ({
            ...prev,
            nodes: (prev.nodes || []).map((n) =>
              n.id === canvasNodeId
                ? {
                    ...n,
                    status: 'completed',
                    progress: 100,
                    report: createReportObject(n.title, userPrompt, formattedText, 'text'),
                  }
                : n
            ),
          }));
        } catch (noteErr: any) {
          console.error('[NoteGenerationError]', noteErr);
          const errorMsg = noteErr?.message || 'Formatting failed to parse into deterministic schema. Please click Retry.';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: '',
                    error: errorMsg,
                    isStreaming: false,
                  }
                : m
            )
          );
          addToast('error', errorMsg);
        }
      }

      // Increment daily prompt count if free tier
      if (!effectiveIsPro) {
        setUsageState((prev) => {
          const updated: UserUsageState = {
            ...prev,
            dailyPromptCount: prev.dailyPromptCount + 1,
            lastResetDate: TODAY_DATE_STR(),
          };
          try {
            localStorage.setItem('pulsenote_user_usage', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Normal abort by stop button
      }
      console.error('Gemini Generation Error:', err);
      const errMsg = err?.message || 'Gemini encountered an issue generating a response.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, isStreaming: false, error: errMsg }
            : m
        )
      );
      setCurrentProject((prev) => ({
        ...prev,
        nodes: (prev.nodes || []).map((n) =>
          n.id === canvasNodeId ? { ...n, status: 'error', progress: 0 } : n
        ),
      }));
      addToast('error', `⚠️ ${errMsg}`);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Handle Photo Animation into Veo 3.1 Video
  const handleAnimateImage = (imageUrl: string, title?: string) => {
    const promptText = `Animate "${title || 'image'}" with cinematic motion and dynamic lighting`;
    const attachmentObj: AttachedFile = {
      id: `att_${Date.now()}`,
      name: `${(title || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20)}.jpg`,
      size: 1024 * 60,
      type: 'image/jpeg',
      category: 'image',
      data: imageUrl,
      previewUrl: imageUrl,
    };
    setInput(promptText);
    setStagedAttachment(attachmentObj);
    addToast('info', 'Loaded photo into Veo 3.1 video animation pipeline');
    handleSend(promptText, attachmentObj, 'video');
  };

  // Quick Action Card click handler
  const handleQuickAction = (actionTitle: string) => {
    if (actionTitle === 'Create image') {
      const p = 'Create a photorealistic 8K image of a serene futuristic laboratory with holographic glass interfaces';
      setInput(p);
      handleSend(p, null, 'image');
    } else if (actionTitle === 'Deep Research') {
      setIsDeepResearch(true);
      const p = 'Conduct deep research on quantum computing hardware architectures and commercial scalability in 2026';
      setInput(p);
      handleSend(p, null, 'research');
    } else if (actionTitle === 'Write code') {
      const p = 'Write a high-performance TypeScript WebSocket state synchronization manager for multi-user collaboration';
      setInput(p);
      handleSend(p, null, 'code');
    } else if (actionTitle === 'Brainstorm') {
      const p = 'Brainstorm 5 innovative viral AI micro-SaaS product concepts with immediate monetization potential';
      setInput(p);
      handleSend(p, null, 'research');
    }
  };

  // Global Drag & Drop Attachment Handling
  const handleGlobalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsGlobalDragOver(true);
    }
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setIsGlobalDragOver(false);
      dragCounterRef.current = 0;
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragOver(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const maxSizeBytes = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        addToast(
          'error',
          `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is ${
            isVideo ? '100MB' : '20MB'
          }.`
        );
        return;
      }

      let category: 'image' | 'video' | 'document' | 'other' = 'other';
      if (isImage) category = 'image';
      else if (isVideo) category = 'video';
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
          previewUrl: category === 'image' || category === 'video' ? data : undefined,
          data,
        });
        addToast('success', `Attached "${file.name}"`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas Actions
  const handleUpdateNodePos = (nodeId: string, x: number, y: number) => {
    setCurrentProject((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).filter((n) => n.id !== nodeId),
      connections: (prev.connections || []).filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId),
    }));
  };

  const handleDuplicateNode = (nodeId: string) => {
    const node = currentProject.nodes?.find((n) => n.id === nodeId);
    if (!node) return;
    const newNode: FlowNode = {
      ...node,
      id: `node_${Date.now()}`,
      title: `${node.title} (Copy)`,
      x: node.x + 40,
      y: node.y + 40,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentProject((prev) => ({
      ...prev,
      nodes: [...(prev.nodes || []), newNode],
    }));
  };

  const handleCreateConnection = (fromId: string, toId: string) => {
    const newConn: FlowConnection = {
      id: `conn_${Date.now()}`,
      fromNodeId: fromId,
      toNodeId: toId,
      label: 'Generative Pipeline',
    };
    setCurrentProject((prev) => ({
      ...prev,
      connections: [...(prev.connections || []), newConn],
    }));
  };

  const handleDeleteConnection = (connId: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      connections: (prev.connections || []).filter((c) => c.id !== connId),
    }));
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      localStorage.removeItem('pulsenote_user_profile');
      localStorage.removeItem('pulsenote_auth_token');
      addToast('info', 'Logged out successfully');
    } catch {}
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#131314] text-[#e3e3e3] font-sans antialiased relative"
      onDragEnter={handleGlobalDragEnter}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Global Drag Overlay */}
      {isGlobalDragOver && (
        <div className="fixed inset-0 z-50 bg-[#131314]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 pointer-events-none animate-in fade-in duration-200">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#1e1f20] border-2 border-dashed border-[#4e8cff] shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-2xl bg-[#4e8cff]/20 text-[#4e8cff] animate-bounce">
              <UploadCloud size={40} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Drop files here to attach to PulseNote AI
              </h3>
              <p className="text-xs text-[#9aa0a6]">
                Supports images (.png, .jpg), videos (.mp4), PDFs & documents (up to 100MB)
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
          setActiveView('chat');
        }}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenUpgrade={() => setIsPricingModalOpen(true)}
        onOpenSettings={() => {
          if (isSuperAdmin) setActiveView('admin');
          else setIsSettingsOpen(true);
        }}
        activeView={activeView}
        onToggleView={setActiveView}
        imageGenerationEnabled={features.imageGenerationEnabled}
        videoGenerationEnabled={features.videoGenerationEnabled}
        isAdmin={isSuperAdmin}
        onOpenTemplates={() => setIsTemplateBuilderOpen(true)}
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

            {/* Note usage counter & credits badge in header (Section 4) */}
            <div className="hidden lg:flex items-center gap-2 ml-2">
              <button
                type="button"
                onClick={() => setIsPricingModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043] text-xs font-mono text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                title="Notes usage count this month (Free limit: 5 notes / month)"
              >
                <span className={`w-2 h-2 rounded-full ${userFirestore.notesUsedThisMonth >= 5 && !isPaidPlan ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span>
                  {userFirestore.plan === 'free'
                    ? `${userFirestore.notesUsedThisMonth} of 5 notes used`
                    : 'Unlimited notes'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsPricingModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                title="Multimedia credits balance (Click to top up)"
              >
                <span>🪙 {userFirestore.credits} credits</span>
                <span className="text-[10px] text-amber-400 font-bold">+</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switch Pill with image and video tabs strictly hidden when disabled */}
            <div className="hidden sm:flex bg-[#1e1f20] p-0.5 rounded-full border border-[#3c4043]/40 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('marketing')}
                className={`px-3 py-1 rounded-full transition-colors font-medium cursor-pointer ${
                  activeView === 'marketing'
                    ? 'bg-[#2d2e30] text-white shadow-sm'
                    : 'text-[#9aa0a6] hover:text-white'
                }`}
              >
                Home
              </button>
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

              {/* Real-time feature switch: ONLY show Image tab when enabled */}
              {features.imageGenerationEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveView('image')}
                  className={`px-3 py-1 rounded-full transition-colors font-medium cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'image'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-[#9aa0a6] hover:text-amber-300'
                  }`}
                  title="Imagen 4.0 Studio"
                >
                  <ImageIcon size={13} className="text-amber-400" />
                  <span>Image</span>
                </button>
              )}

              {/* Real-time feature switch: ONLY show Video tab when enabled */}
              {features.videoGenerationEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveView('video')}
                  className={`px-3 py-1 rounded-full transition-colors font-medium cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'video'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-[#9aa0a6] hover:text-purple-300'
                  }`}
                  title="Veo 3.0 Video Studio"
                >
                  <Film size={13} className="text-purple-400" />
                  <span>Video</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveView('canvas')}
                className={`px-3 py-1 rounded-full transition-colors font-medium cursor-pointer ${
                  activeView === 'canvas'
                    ? 'bg-[#2d2e30] text-white shadow-sm'
                    : 'text-[#9aa0a6] hover:text-white'
                }`}
              >
                Canvas
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
              <span>Templates</span>
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
                title="Admin Feature Switch Portal (/admin)"
              >
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
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

        {/* 3. View Switch: Marketing vs Admin vs Team vs Partners vs Image vs Video vs Chat vs Infinite Flow Canvas */}
        {activeView === 'admin' ? (
          <AdminPage
            currentUser={currentUser as any}
            features={features}
            onBack={() => setActiveView('chat')}
            onShowToast={addToast}
          />
        ) : activeView === 'team' ? (
          <TeamDashboard
            currentUser={currentUser as any}
            teamId={userFirestore.teamId}
            onBack={() => setActiveView('chat')}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onShowToast={addToast}
          />
        ) : activeView === 'partners' ? (
          <PartnersPage
            onBack={() => setActiveView('chat')}
            onShowToast={addToast}
          />
        ) : activeView === 'marketing' ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <MarketingSite
              onLaunchApp={() => setActiveView('chat')}
              onOpenPricing={() => setIsPricingModalOpen(true)}
              usageState={usageState}
              currentUser={currentUser}
            />
          </div>
        ) : activeView === 'image' ? (
          features.imageGenerationEnabled ? (
            <ImageStudio onShowToast={addToast} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Lock size={24} />
              </div>
              <h2 className="text-lg font-bold text-white">Image Generation Is Currently Disabled</h2>
              <p className="text-xs text-[#9aa0a6] max-w-sm">
                This feature has been switched off by the platform administrator.
              </p>
              <button
                onClick={() => setActiveView('chat')}
                className="px-4 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-xs font-semibold text-white transition cursor-pointer"
              >
                Return to Notes
              </button>
            </div>
          )
        ) : activeView === 'video' ? (
          features.videoGenerationEnabled ? (
            <VideoStudio onShowToast={addToast} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Lock size={24} />
              </div>
              <h2 className="text-lg font-bold text-white">Video Generation Is Currently Disabled</h2>
              <p className="text-xs text-[#9aa0a6] max-w-sm">
                This feature has been switched off by the platform administrator.
              </p>
              <button
                onClick={() => setActiveView('chat')}
                className="px-4 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-xs font-semibold text-white transition cursor-pointer"
              >
                Return to Notes
              </button>
            </div>
          )
        ) : activeView === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 py-4 scrollbar-thin">
            {messages.length === 0 ? (
              /* Gemini Welcome Empty State */
              <div className="max-w-[800px] w-full mx-auto mt-[8vh] flex-1 flex flex-col justify-start">
                <h1 className="text-4xl md:text-5xl font-medium mb-8 tracking-tight">
                  <span className="bg-gradient-to-r from-[#4e8cff] via-[#b066ff] to-[#ff5757] bg-clip-text text-transparent">
                    Hello, {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
                  </span>
                </h1>

                {/* Gemini Suggestion Cards (Strictly hide Image/Video when turned off) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {features.imageGenerationEnabled && (
                    <div
                      onClick={() => setActiveView('image')}
                      className="bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/30 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between h-[120px]"
                    >
                      <span className="text-sm font-medium text-[#e3e3e3]">Create image</span>
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center self-end">
                        <ImageIcon size={18} />
                      </div>
                    </div>
                  )}

                  {features.videoGenerationEnabled && (
                    <div
                      onClick={() => setActiveView('video')}
                      className="bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/30 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between h-[120px]"
                    >
                      <span className="text-sm font-medium text-[#e3e3e3]">Veo Video</span>
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center self-end">
                        <Film size={18} />
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => handleQuickAction('Deep Research')}
                    className="bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/30 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between h-[120px]"
                  >
                    <span className="text-sm font-medium text-[#e3e3e3]">Deep Research</span>
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center self-end">
                      <Search size={18} />
                    </div>
                  </div>

                  <div
                    onClick={() => handleQuickAction('Write code')}
                    className="bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/30 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between h-[120px]"
                  >
                    <span className="text-sm font-medium text-[#e3e3e3]">Write code</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center self-end">
                      <Code size={18} />
                    </div>
                  </div>

                  <div
                    onClick={() => handleQuickAction('Brainstorm')}
                    className="bg-[#1e1f20] hover:bg-[#2d2e30] border border-[#3c4043]/30 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between h-[120px]"
                  >
                    <span className="text-sm font-medium text-[#e3e3e3]">Brainstorm</span>
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center self-end">
                      <Lightbulb size={18} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Conversation Messages with Paywalled Downloads */
              <div className="max-w-[800px] w-full mx-auto space-y-6 flex-1 py-4">
                {messages.map((m) => (
                  <ChatMessageBubble
                    key={m.id}
                    message={m}
                    isPaidPlan={isPaidPlan}
                    onOpenPricing={() => setIsPricingModalOpen(true)}
                    onAnimateImage={handleAnimateImage}
                    onShowToast={addToast}
                    onRetry={handleRetry}
                  />
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}

            {/* Sticky PromptBar at Bottom */}
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
                isDeepResearch={isDeepResearch}
                onToggleDeepResearch={() => setIsDeepResearch(!isDeepResearch)}
                onToggleCanvas={() => setActiveView('canvas')}
                onStartVoice={() => addToast('info', 'Voice dictation active. Speak into your microphone.')}
                onShowToast={addToast}
              />
              <p className="text-[11px] text-center text-[#9aa0a6] mt-2.5">
                Built on Google Cloud. Do not enter patient-identifying information.
              </p>
            </div>
          </div>
        ) : (
          /* Infinite Flow Canvas View */
          <div className="flex-1 relative w-full h-full overflow-hidden">
            <FlowCanvas
              project={currentProject}
              collaborators={collaborators}
              onUpdateNodePos={handleUpdateNodePos}
              onSelectNode={setSelectedNodeId}
              selectedNodeId={selectedNodeId}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
              onCreateConnection={handleCreateConnection}
              onDeleteConnection={handleDeleteConnection}
              onOpenVersions={setActiveVersionNode}
              onOpenComments={setActiveCommentNode}
              onCursorMove={() => {}}
              onAnimateImage={handleAnimateImage}
              onShowToast={addToast}
            />

            <FlowCommandBar
              onGenerate={(p, type, opt) => {
                if (opt?.attachedFile) setStagedAttachment(opt.attachedFile);
                handleSend(p, opt?.attachedFile, type);
              }}
              isGenerating={isGenerating}
              dailyPromptsRemaining={effectiveIsPro ? 999 : Math.max(0, 3 - usageState.dailyPromptCount)}
              isPro={effectiveIsPro}
              onOpenUpgradeModal={() => setIsPricingModalOpen(true)}
              attachedFile={stagedAttachment}
              onSetAttachedFile={setStagedAttachment}
              onShowToast={addToast}
            />
          </div>
        )}
      </div>

      {/* 4. Modals */}
      {/* Pricing / Premium Upgrade Modal (Section 4 & 9) */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentPlan={userFirestore.plan}
        currentCredits={userFirestore.credits}
        notesUsedThisMonth={userFirestore.notesUsedThisMonth}
        onUpgradeSuccess={(newPlan: PulseNotePlan) => {
          setUserFirestore((prev) => ({ ...prev, plan: newPlan }));
          setUsageState((prev) => {
            const updated: UserUsageState = { ...prev, isPro: true, activePlan: newPlan as any };
            try {
              localStorage.setItem('pulsenote_user_usage', JSON.stringify(updated));
            } catch {}
            return updated;
          });
          setIsPricingModalOpen(false);
          addToast('success', `Upgraded to PulseNote AI ${newPlan.toUpperCase()}! Unlimited notes active.`);
        }}
        onShowToast={addToast}
      />

      {/* Custom Template Builder Modal (Section 7) */}
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

      {/* Legal & Trust Modal: Privacy, Terms, Testimonials, Demo (Section 9) */}
      <LegalTrustModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user: UserProfile) => {
          setCurrentUser(user);
          try {
            localStorage.setItem('pulsenote_user_profile', JSON.stringify(user));
          } catch {}
          if (user.role === 'admin' || isPulseNoteAdmin(user.email, (user as any).emailVerified)) {
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
        />
      )}

      {/* Settings & Help Modal (non-admin) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        usageState={usageState}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
      />

      {/* Legal Onboarding Modal */}
      <OnboardingLegalModal
        isOpen={isLegalModalOpen}
        onAccept={() => {
          try {
            localStorage.setItem('pulsenote_legal_accepted_v1', 'true');
          } catch {}
          setHasAcceptedLegalOnboarding(true);
          setIsLegalModalOpen(false);
        }}
      />

      {/* Gemini Studio Multi-Modal Modal */}
      <GeminiStudioModal
        isOpen={isGeminiStudioOpen}
        onClose={() => setIsGeminiStudioOpen(false)}
        onInsertToChat={(text) => {
          setInput(text);
          setIsGeminiStudioOpen(false);
          addToast('info', 'Loaded into prompt bar');
        }}
      />

      {/* Standalone Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={(key) => addToast('success', key ? 'Gemini API key updated' : 'Key removed')}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
