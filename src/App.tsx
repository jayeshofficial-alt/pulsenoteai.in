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
  TargetIndustry,
  FormatLensId,
  ResponseMode,
  AttachedFile
} from './types';
import { UploadCloud, Sparkles, File, Film, FileText, Image as ImageIcon } from 'lucide-react';
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
import { ToastContainer, ToastMessage } from './components/Toast';
import { auth, onAuthStateChanged, logOut } from './lib/firebase';

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
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [hasAcceptedLegalOnboarding, setHasAcceptedLegalOnboarding] = useState(true);

  // Authenticated User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('pulsenote_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Staged File Attachment for Prompt Input & Drag-and-Drop Pipeline
  const [stagedAttachment, setStagedAttachment] = useState<AttachedFile | null>(null);
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);
  const dragCounterRef = useRef(0);

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

    // If stored user exists, refresh authoritative role
    if (currentUser?.email) {
      syncAuthoritativeProfile(currentUser.email, currentUser.name, currentUser.avatarUrl);
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (fbUser: any) => {
      if (fbUser && fbUser.email) {
        syncAuthoritativeProfile(
          fbUser.email,
          fbUser.displayName || fbUser.email.split('@')[0],
          fbUser.photoURL || ''
        );
      }
    });

    // Load initial project list from backend
    fetch('/api/flow/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          setCurrentProject(data.projects[0]);
        }
      })
      .catch((e) => console.warn('Fetch projects notice:', e));

    return () => unsubscribe();
  }, []);

  // Update usage state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const isAdmin = currentUser.role === 'admin';
      const isPro = isAdmin || currentUser.subscription?.isPro;
      if (isPro) {
        setUsageState((prev) => ({
          ...prev,
          isPro: true,
          activePlan: isAdmin ? 'admin_grant' : (currentUser.subscription?.tier || 'pro_monthly'),
        }));
      }
    }
  }, [currentUser]);

  // Handle Log Out
  const handleLogout = async () => {
    try {
      await logOut();
    } catch (e) {
      console.warn('Firebase logout notice:', e);
    }
    localStorage.removeItem('pulsenote_user_profile');
    localStorage.removeItem('pulsenote_auth_token');
    setCurrentUser(null);
    setUsageState((prev) => {
      const reset: UserUsageState = {
        ...prev,
        isPro: false,
        activePlan: 'free',
      };
      try {
        localStorage.setItem('pulsenote_user_usage', JSON.stringify(reset));
      } catch {}
      return reset;
    });
    addToast('info', 'Logged out successfully.');
  };

  // 2. Real-Time WebSocket Connection for Google Flow
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const userName = currentUser?.name || 'Lead Architect';
    const userEmail = currentUser?.email || 'architect@pulsenoteai.in';
    const userId = currentUser?.id || `usr_${Date.now()}`;
    const userColor = currentUser?.role === 'admin' ? '#ec4899' : '#6366f1';

    const wsUrl = `${protocol}//${host}/ws/flow?projectId=${encodeURIComponent(
      currentProject.id
    )}&userName=${encodeURIComponent(userName)}&userEmail=${encodeURIComponent(
      userEmail
    )}&userId=${encodeURIComponent(userId)}&userColor=${encodeURIComponent(userColor)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[FLOW_WS] Connected to live project canvas room:', currentProject.id);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'init': {
            if (msg.project) {
              setCurrentProject(msg.project);
              const uniqueCollabs: FlowCollaborator[] = [];
              const seenIds = new Set<string>();
              for (const c of msg.project.collaborators || []) {
                if (c && c.id && !seenIds.has(c.id)) {
                  seenIds.add(c.id);
                  uniqueCollabs.push(c);
                }
              }
              setCollaborators(uniqueCollabs);
            }
            break;
          }
          case 'user_joined': {
            if (msg.collaborator) {
              setCollaborators((prev) => {
                const filtered = prev.filter((c) => c.id !== msg.collaborator.id);
                return [...filtered, msg.collaborator];
              });
              addToast('info', `${msg.collaborator.name} joined the Flow canvas`);
            }
            break;
          }
          case 'user_left': {
            if (msg.userId) {
              setCollaborators((prev) => prev.filter((c) => c.id !== msg.userId));
            }
            break;
          }
          case 'cursor_move': {
            if (msg.userId && msg.cursor) {
              setCollaborators((prev) =>
                prev.map((c) => (c.id === msg.userId ? { ...c, cursor: msg.cursor } : c))
              );
            }
            break;
          }
          case 'node_created': {
            if (msg.node) {
              setCurrentProject((prev) => ({
                ...prev,
                nodes: [...(prev.nodes || []).filter((n) => n.id !== msg.node.id), msg.node],
              }));
            }
            break;
          }
          case 'node_updated': {
            if (msg.node) {
              setCurrentProject((prev) => ({
                ...prev,
                nodes: (prev.nodes || []).map((n) => (n.id === msg.node.id ? { ...n, ...msg.node } : n)),
              }));
            }
            break;
          }
          case 'node_moved': {
            if (msg.nodeId) {
              setCurrentProject((prev) => ({
                ...prev,
                nodes: (prev.nodes || []).map((n) =>
                  n.id === msg.nodeId ? { ...n, x: msg.x, y: msg.y } : n
                ),
              }));
            }
            break;
          }
          case 'node_deleted': {
            if (msg.nodeId) {
              setCurrentProject((prev) => ({
                ...prev,
                nodes: (prev.nodes || []).filter((n) => n.id !== msg.nodeId),
                connections: (prev.connections || []).filter(
                  (conn) => conn.sourceNodeId !== msg.nodeId && conn.targetNodeId !== msg.nodeId
                ),
              }));
            }
            break;
          }
          case 'connection_created': {
            if (msg.connection) {
              setCurrentProject((prev) => ({
                ...prev,
                connections: [...(prev.connections || []), msg.connection],
              }));
            }
            break;
          }
          case 'connection_deleted': {
            if (msg.connectionId) {
              setCurrentProject((prev) => ({
                ...prev,
                connections: (prev.connections || []).filter((c) => c.id !== msg.connectionId),
              }));
            }
            break;
          }
          case 'comment_added': {
            if (msg.nodeId && msg.comment) {
              setCurrentProject((prev) => ({
                ...prev,
                nodes: (prev.nodes || []).map((n) =>
                  n.id === msg.nodeId
                    ? { ...n, comments: [...(n.comments || []), msg.comment] }
                    : n
                ),
              }));
            }
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onerror = (e) => {
      console.warn('[FLOW_WS] WebSocket notice:', e);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [currentProject.id, currentUser?.id]);

  // Broadcast cursor movement
  const handleCursorMove = (x: number, y: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'cursor_move',
          projectId: currentProject.id,
          cursor: { x, y },
        })
      );
    }
  };

  // Broadcast node move
  const handleUpdateNodePos = (nodeId: string, x: number, y: number) => {
    setCurrentProject((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'node_moved',
          projectId: currentProject.id,
          nodeId,
          x,
          y,
        })
      );
    }
  };

  // Node Deletion
  const handleDeleteNode = async (nodeId: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).filter((n) => n.id !== nodeId),
      connections: (prev.connections || []).filter(
        (c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
      ),
    }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'node_deleted',
          projectId: currentProject.id,
          nodeId,
        })
      );
    }
    addToast('info', 'Node deleted from canvas');
  };

  // Duplicate Node
  const handleDuplicateNode = (nodeId: string) => {
    const target = currentProject.nodes?.find((n) => n.id === nodeId);
    if (!target) return;

    const newNode: FlowNode = {
      ...target,
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${target.title} (Copy)`,
      x: target.x + 40,
      y: target.y + 40,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      comments: [],
    };

    setCurrentProject((prev) => ({
      ...prev,
      nodes: [...(prev.nodes || []), newNode],
    }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'node_created',
          projectId: currentProject.id,
          node: newNode,
        })
      );
    }
    addToast('success', 'Duplicated Flow Card');
  };

  // Create Connection between Nodes
  const handleCreateConnection = (sourceNodeId: string, targetNodeId: string) => {
    if (sourceNodeId === targetNodeId) return;

    const newConnection: FlowConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceNodeId,
      targetNodeId,
      label: 'Flow Vector',
      createdAt: Date.now(),
      style: 'bezier',
    };

    setCurrentProject((prev) => ({
      ...prev,
      connections: [...(prev.connections || []), newConnection],
    }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'connection_created',
          projectId: currentProject.id,
          connection: newConnection,
        })
      );
    }
    addToast('success', 'Connected Flow Nodes');
  };

  // Delete Connection
  const handleDeleteConnection = (connectionId: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      connections: (prev.connections || []).filter((c) => c.id !== connectionId),
    }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'connection_deleted',
          projectId: currentProject.id,
          connectionId,
        })
      );
    }
  };

  // Restore Node Version Snapshot
  const handleRestoreVersion = (nodeId: string, version: any) => {
    setCurrentProject((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            title: version.title,
            report: version.report || n.report,
            imageParams: version.imageParams || n.imageParams,
            videoParams: version.videoParams || n.videoParams,
            codeSnippet: version.codeSnippet || n.codeSnippet,
            updatedAt: Date.now(),
          };
        }
        return n;
      }),
    }));
    setActiveVersionNode(null);
    addToast('success', `Restored snapshot "${version.title}"`);
  };

  // Add Comment
  const handleAddComment = (nodeId: string, text: string) => {
    const newComment = {
      id: `com_${Date.now()}`,
      authorName: currentUser?.name || 'Lead Architect',
      authorAvatar: currentUser?.avatarUrl,
      text,
      timestamp: Date.now(),
    };

    setCurrentProject((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) =>
        n.id === nodeId ? { ...n, comments: [...(n.comments || []), newComment] } : n
      ),
    }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'comment_added',
          projectId: currentProject.id,
          nodeId,
          comment: newComment,
        })
      );
    }
  };

  // Handle Drag-and-Drop Ingestion on Global Window & Canvas
  const processDroppedFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const maxSizeBytes = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    const maxSizeLabel = isVideo ? '100MB' : '20MB';

    if (file.size > maxSizeBytes) {
      addToast(
        'error',
        `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed for ${isVideo ? 'video' : 'images/documents'} is ${maxSizeLabel}.`
      );
      return;
    }

    let category: 'image' | 'video' | 'document' | 'other' = 'other';
    if (isImage) category = 'image';
    else if (isVideo) category = 'video';
    else if (
      file.type.includes('pdf') ||
      file.type.includes('text') ||
      file.type.includes('document') ||
      file.name.match(/\.(pdf|txt|docx|doc|csv|json|md)$/i)
    ) {
      category = 'document';
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      const previewUrl = category === 'image' || category === 'video' ? data : undefined;
      const newAttachment: AttachedFile = {
        id: `att_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        category,
        previewUrl,
        data,
      };
      setStagedAttachment(newAttachment);
      addToast('success', `Attached "${file.name}" to prompt workspace`);
    };
    reader.onerror = () => {
      addToast('error', 'Failed to read dropped file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleGlobalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
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
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsGlobalDragOver(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsGlobalDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDroppedFile(e.dataTransfer.files[0]);
    }
  };

  // Generate new Google Flow Card on Infinite Canvas
  const handleGenerateOnCanvas = async (
    prompt: string,
    mode: FlowNodeType,
    options?: { aspectRatio?: string; attachedFile?: AttachedFile }
  ) => {
    const aspectRatio = options?.aspectRatio || '16:9';
    const attachedFile = options?.attachedFile;
    const isAdmin = currentUser?.role === 'admin';
    const effectiveIsPro = usageState.isPro || isAdmin;

    // Check freemium guardrails (3/day) for non-pro / non-admin users
    if (!effectiveIsPro && usageState.dailyPromptCount >= 3) {
      setIsPricingModalOpen(true);
      addToast('error', 'Daily free limit reached (3/3 prompts). Upgrade to Pro for unlimited generation.');
      return;
    }

    setIsGenerating(true);

    // Calculate dynamic node spawn coordinate on canvas near current center
    const existingCount = currentProject.nodes?.length || 0;
    const spawnX = 120 + (existingCount % 4) * 440;
    const spawnY = 120 + Math.floor(existingCount / 4) * 360;

    const tempNodeId = `node_${Date.now()}`;
    const initialNode: FlowNode = {
      id: tempNodeId,
      type: mode,
      title: `${(prompt || attachedFile?.name || 'Multi-modal Card').slice(0, 36)}...`,
      prompt: prompt || (attachedFile ? `Attached: ${attachedFile.name}` : ''),
      x: spawnX,
      y: spawnY,
      width: mode === 'research' || mode === 'video' ? 520 : 460,
      status: 'generating',
      attachment: attachedFile,
      ownerId: currentUser?.id || 'usr_lead',
      ownerName: currentUser?.name || 'Lead Architect',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [],
      comments: [],
    };

    // Optimistically place node on canvas
    setCurrentProject((prev) => ({
      ...prev,
      nodes: [...(prev.nodes || []), initialNode],
    }));

    try {
      const creativeMode = mode === 'image' ? 'image' : mode === 'video' ? 'video' : undefined;
      const formatLens: FormatLensId = mode === 'code' ? 'code_generation' : 'deep_research';

      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: prompt,
          targetIndustry: 'general',
          formatLens,
          responseMode: mode === 'research' ? 'research' : 'productivity',
          dailyPromptCount: usageState.dailyPromptCount,
          isPro: effectiveIsPro,
          userEmail: currentUser?.email || '',
          creativeMode,
          attachedFile: attachedFile ? {
            id: attachedFile.id,
            name: attachedFile.name,
            size: attachedFile.size,
            type: attachedFile.type,
            category: attachedFile.category,
            data: attachedFile.data,
            previewUrl: attachedFile.previewUrl,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (data.isLimitReached) {
        setIsPricingModalOpen(true);
        // Remove generating placeholder
        setCurrentProject((prev) => ({
          ...prev,
          nodes: (prev.nodes || []).filter((n) => n.id !== tempNodeId),
        }));
        return;
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

      // Populate resolved Flow Card data
      const completedNode: FlowNode = {
        ...initialNode,
        title: data.title || prompt.slice(0, 42) || attachedFile?.name || 'Flow Card',
        status: 'completed',
        attachment: data.attachment || attachedFile,
        report: data.markdownReport || data.executiveSummary ? {
          id: `rep_${Date.now()}`,
          timestamp: Date.now(),
          industry: 'general',
          rawInput: prompt,
          responseMode: data.responseMode || 'research',
          title: data.title || 'Analysis',
          executiveSummary: data.executiveSummary || '',
          markdownReport: data.markdownReport || '',
          sections: data.sections || [],
          actionItems: data.actionItems || [],
          detectedEntities: data.detectedEntities || [],
          keyTakeaways: data.keyTakeaways || [],
        } : undefined,
        imageResults: data.imageResults || data.imageParams?.results,
        imageParams: data.imageParams ? {
          ...data.imageParams,
          aspectRatio,
        } : undefined,
        videoParams: data.videoParams ? {
          ...data.videoParams,
          aspectRatio,
        } : undefined,
        codeSnippet: mode === 'code' ? {
          language: 'typescript',
          code: data.markdownReport || '// Synthesized architecture and logic',
        } : undefined,
        versions: [
          {
            id: `v_init_${Date.now()}`,
            timestamp: Date.now(),
            title: 'Initial Flow Synthesis',
            authorName: currentUser?.name || 'Lead Architect',
          },
        ],
      };

      setCurrentProject((prev) => ({
        ...prev,
        nodes: (prev.nodes || []).map((n) => (n.id === tempNodeId ? completedNode : n)),
      }));

      // Broadcast new node to collaborators
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'node_created',
            projectId: currentProject.id,
            node: completedNode,
          })
        );
      }

      addToast('success', `Generated ${mode.toUpperCase()} Flow Card`);
    } catch (err: any) {
      addToast('error', 'Generation encountered an error. Please retry.');
      setCurrentProject((prev) => ({
        ...prev,
        nodes: (prev.nodes || []).filter((n) => n.id !== tempNodeId),
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Create new Canvas Project
  const handleCreateProject = async (name: string) => {
    try {
      const res = await fetch('/api/flow/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ownerId: currentUser?.id || 'usr_guest',
          ownerName: currentUser?.name || 'Flow Architect',
        }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProjects((prev) => [data.project, ...prev]);
        setCurrentProject(data.project);
        addToast('success', `Created Project: ${data.project.name}`);
      }
    } catch (e: any) {
      addToast('error', 'Failed to create project');
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const effectiveIsPro = usageState.isPro || isAdmin;

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans"
      onDragEnter={handleGlobalDragEnter}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Global Drag-and-Drop Attachment Overlay */}
      {isGlobalDragOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-8 pointer-events-none animate-in fade-in duration-200">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/95 border-2 border-dashed border-indigo-500 shadow-2xl flex flex-col items-center text-center space-y-4 ring-8 ring-indigo-500/10">
            <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-bounce">
              <UploadCloud className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Drop files here to attach to Pulse Note AI
              </h3>
              <p className="text-xs text-slate-400">
                Supports images (.png, .jpg, .webp), videos (.mp4, .webm), PDFs, code & documents (up to 100MB)
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                Max 20MB Docs/Images
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                Max 100MB Videos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Google Flow Top Project Header */}
      <FlowProjectHeader
        currentProject={currentProject}
        projects={projects}
        collaborators={collaborators}
        currentUser={currentUser}
        isPro={effectiveIsPro}
        onSelectProject={(projId) => {
          const p = projects.find((x) => x.id === projId);
          if (p) setCurrentProject(p);
        }}
        onCreateProject={handleCreateProject}
        onOpenUpgradeModal={() => setIsPricingModalOpen(true)}
        onOpenAuthModal={(tab = 'login') => {
          setAuthModalTab(tab);
          setIsAuthModalOpen(true);
        }}
        onOpenAdminDashboard={() => setIsAdminPanelOpen(true)}
        onOpenBillingModal={() => setIsClientBillingOpen(true)}
        onLogout={handleLogout}
        onShowToast={addToast}
      />

      {/* 2. Google Flow Infinite Canvas */}
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
        onCursorMove={handleCursorMove}
        onShowToast={addToast}
      />

      {/* 3. Floating Bottom Command Generator Deck (Google Flow Prompt Engine) */}
      <FlowCommandBar
        onGenerate={handleGenerateOnCanvas}
        isGenerating={isGenerating}
        dailyPromptsRemaining={effectiveIsPro ? 999 : Math.max(0, 3 - usageState.dailyPromptCount)}
        isPro={effectiveIsPro}
        onOpenUpgradeModal={() => setIsPricingModalOpen(true)}
        attachedFile={stagedAttachment}
        onSetAttachedFile={setStagedAttachment}
        onShowToast={addToast}
      />

      {/* 4. Version History Modal */}
      {activeVersionNode && (
        <FlowNodeVersionModal
          node={activeVersionNode}
          onClose={() => setActiveVersionNode(null)}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      {/* 5. Live Comment Drawer */}
      {activeCommentNode && (
        <FlowNodeCommentDrawer
          node={activeCommentNode}
          onClose={() => setActiveCommentNode(null)}
          onAddComment={handleAddComment}
          currentUser={{
            name: currentUser?.name || 'Lead Architect',
            email: currentUser?.email || 'architect@pulsenoteai.in',
          }}
        />
      )}

      {/* 6. Pricing & Pro Upgrade Modal (₹499 UPI wagh.jayesh@oksbi) */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        usageState={usageState}
        currentUser={currentUser}
        onUpgradeSuccess={(plan: SubscriptionPlan) => {
          setUsageState((prev) => {
            const updated: UserUsageState = { ...prev, isPro: true, activePlan: plan };
            try {
              localStorage.setItem('pulsenote_user_usage', JSON.stringify(updated));
            } catch {}
            return updated;
          });
          setIsPricingModalOpen(false);
          addToast('success', `Upgraded to PulseNote AI ${plan.toUpperCase()}! Unlimited canvas generation active.`);
        }}
      />

      {/* 7. Legal Disclaimer Onboarding Modal */}
      <OnboardingLegalModal
        isOpen={isLegalModalOpen}
        onAccept={() => {
          try {
            localStorage.setItem('pulsenote_legal_accepted_v1', 'true');
          } catch {}
          setHasAcceptedLegalOnboarding(true);
          setIsLegalModalOpen(false);
          addToast('success', 'Terms accepted. Welcome to Pulse Note AI Flow Engine.');
        }}
      />

      {/* 8. Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user: UserProfile, token: string) => {
          setCurrentUser(user);
          try {
            localStorage.setItem('pulsenote_user_profile', JSON.stringify(user));
            localStorage.setItem('pulsenote_auth_token', token);
          } catch {}

          if (user.role === 'admin') {
            setUsageState((prev) => ({
              ...prev,
              isPro: true,
              activePlan: 'admin_grant',
              dailyPromptCount: 0,
            }));
            addToast('success', `Welcome Super Admin, ${user.name}! Admin Dashboard & Unlimited Flow unlocked.`);
          } else {
            addToast('success', `Welcome back, ${user.name}!`);
          }
          setIsAuthModalOpen(false);
        }}
      />

      {/* 9. Super Admin Control Center Modal */}
      {isAdminPanelOpen && (
        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* 10. Client Billing & Account Modal */}
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

      {/* 11. Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
