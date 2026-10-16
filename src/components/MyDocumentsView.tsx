import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Copy,
  Edit3,
  RefreshCw,
  Clock,
  History,
  Check,
  X,
  AlertTriangle,
  Download,
  FileDown,
  Lock,
  Plus,
  ArrowLeft,
  UserX,
  ShieldAlert,
  Save,
  Stamp,
  Send,
  LockOpen,
  FileCheck,
} from 'lucide-react';
import { exportNoteToPdf, exportNoteToDocx } from '../lib/exportUtils';

export interface DocumentVersion {
  version: number;
  changedBy: string;
  changedAt: number;
  summary: string;
  sections: Record<string, string>;
}

export interface DocumentSignoff {
  status: 'draft' | 'in_review' | 'signed_off';
  reviewedBy?: string;
  signedAt?: number;
  history: Array<{ status: 'draft' | 'in_review' | 'signed_off'; by: string; at: number; note?: string }>;
}

export interface StoredDocument {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  templateType: string;
  rawInput: string;
  sections: Record<string, string>;
  unverifiedTokens: string[];
  clinicalNotice?: string;
  dataRetentionNotice?: string;
  createdAt: number;
  updatedAt: number;
  versions: DocumentVersion[];
  signoff?: DocumentSignoff;
}

interface MyDocumentsViewProps {
  currentUser: { uid: string; email?: string | null; displayName?: string } | null;
  isPaidPlan?: boolean;
  onBack: () => void;
  onOpenPricing?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onSignOut?: () => void;
}

const TEMPLATE_LABELS: Record<string, string> = {
  soap: 'SOAP Note',
  rfc: 'Engineering RFC',
  memo: 'Executive Memo',
  discharge_summary: 'Discharge Summary',
  referral_letter: 'Referral Letter',
  progress_note: 'Progress Note',
  incident_report: 'Incident Report',
  meeting_minutes: 'Meeting Minutes',
  sop: 'Standard Operating Procedure (SOP)',
};

export const MyDocumentsView: React.FC<MyDocumentsViewProps> = ({
  currentUser,
  isPaidPlan = false,
  onBack,
  onOpenPricing,
  onShowToast,
  onSignOut,
}) => {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);

  // Editor State
  const [editedSections, setEditedSections] = useState<Record<string, string>>({});
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);

  // Modals & Panels
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const userId = currentUser?.uid || 'user_guest';
  const userEmail = currentUser?.email || 'guest@pulsenoteai.in';

  useEffect(() => {
    loadDocuments();
  }, [userId, userEmail]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/documents?userId=${encodeURIComponent(userId)}&userEmail=${encodeURIComponent(userEmail)}`
      );
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to load user documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (doc: StoredDocument) => {
    setSelectedDoc(doc);
    setEditedSections({ ...doc.sections });
    setEditedTitle(doc.title);
    setIsEditingTitle(false);
    setShowVersionHistory(false);
  };

  const handleSaveDoc = async () => {
    if (!selectedDoc) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          title: editedTitle,
          sections: editedSections,
          summary: `Manual user edit by ${userEmail}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.document) {
        setSelectedDoc(data.document);
        setDocuments((prev) =>
          prev.map((d) => (d.id === data.document.id ? data.document : d))
        );
        onShowToast?.('success', 'Document changes saved & version history updated.');
      } else {
        throw new Error(data.message || 'Failed to save document.');
      }
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Error saving document.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSection = async (sectionKey: string) => {
    if (!selectedDoc) return;
    setRegeneratingKey(sectionKey);
    try {
      const res = await fetch('/api/notes/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: selectedDoc.rawInput,
          templateType: selectedDoc.templateType,
          sectionKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.content) {
        setEditedSections((prev) => ({
          ...prev,
          [sectionKey]: data.content,
        }));
        onShowToast?.('success', `Regenerated '${sectionKey}' section based strictly on input facts.`);
      } else {
        throw new Error(data.message || 'Failed to regenerate section.');
      }
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Error regenerating section.');
    } finally {
      setRegeneratingKey(null);
    }
  };

  const signoffStatus = selectedDoc?.signoff?.status || 'draft';
  const isLocked = signoffStatus === 'signed_off';

  const handleSignoffAction = async (action: 'submit-review' | 'sign-off' | 'reopen') => {
    if (!selectedDoc) return;
    if (action === 'sign-off' && !confirm('Sign off this document? It will be locked and require reopening for any further edits.')) return;
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ by: userEmail || 'author' }),
      });
      const data = await res.json();
      if (res.ok && data.document) {
        setSelectedDoc(data.document);
        setDocuments((prev) => prev.map((d) => (d.id === data.document.id ? data.document : d)));
        onShowToast?.(
          'success',
          action === 'submit-review'
            ? 'Submitted for senior review.'
            : action === 'sign-off'
              ? 'Signed off and locked.'
              : 'Reopened as draft.'
        );
      } else {
        throw new Error(data.message || 'Sign-off action failed.');
      }
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Sign-off action failed.');
    }
  };

  const handleDeleteDoc = async (docId: string, e?: React.MouseEvent) => {    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this document? Your notes stay in your account until you delete them.')) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (selectedDoc?.id === docId) {
          setSelectedDoc(null);
        }
        onShowToast?.('info', 'Document permanently deleted.');
      }
    } catch (err) {
      onShowToast?.('error', 'Failed to delete document.');
    }
  };

  const handleDuplicateDoc = async (docId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/documents/${docId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });

      const data = await res.json();
      if (res.ok && data.document) {
        setDocuments((prev) => [data.document, ...prev]);
        onShowToast?.('success', 'Document duplicated.');
      }
    } catch (err) {
      onShowToast?.('error', 'Failed to duplicate document.');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast?.('success', 'Your account and all associated documents have been permanently deleted.');
        setShowDeleteAccountModal(false);
        if (onSignOut) {
          onSignOut();
        } else {
          window.location.reload();
        }
      } else {
        throw new Error(data.message || 'Failed to delete account.');
      }
    } catch (err: any) {
      onShowToast?.('error', err?.message || 'Error deleting account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Helper to render section text with yellow warnings for unverified tokens
  const renderFactCheckedText = (text: string, unverifiedTokens: string[] = []) => {
    if (!unverifiedTokens || unverifiedTokens.length === 0) {
      return <span>{text}</span>;
    }

    // Check if any unverified token is present in the text
    const escapedTokens = unverifiedTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escapedTokens.length === 0) return <span>{text}</span>;

    const pattern = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
    const parts = text.split(pattern);

    return (
      <span>
        {parts.map((part, i) => {
          const isWarning = unverifiedTokens.some(
            (t) => t.toLowerCase() === part.toLowerCase()
          );

          if (isWarning) {
            return (
              <mark
                key={i}
                className="bg-amber-300/30 text-amber-200 border border-amber-400/50 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1 mx-0.5"
                title="Check this — not found in your input"
              >
                <span>{part}</span>
                <span className="text-[10px] text-amber-300 font-mono italic">
                  (Check this — not found in your input)
                </span>
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.rawInput.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(doc.sections).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || doc.templateType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2d2e30] pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white transition"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FileText size={22} className="text-[#4e8cff]" />
                <h1 className="text-2xl font-bold text-white">My Documents</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e1f20] text-[#9aa0a6] border border-[#3c4043]/50 font-mono">
                  {documents.length} saved
                </span>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Your notes stay in your account. You can edit, restore version history, export, or delete them at any time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserX size={14} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Interface: Document List (Left) & Document Editor (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Filter, Search & Document List */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, clinical keywords..."
                className="w-full bg-[#1e1f20] border border-[#3c4043]/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#4e8cff]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#4e8cff] text-white font-bold'
                    : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#3c4043]/40'
                }`}
              >
                All Types
              </button>
              {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                    filterType === key
                      ? 'bg-[#4e8cff] text-white font-bold'
                      : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border border-[#3c4043]/40'
                  }`}
                >
                  {label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Document Cards List */}
            <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1 scrollbar-thin">
              {loading ? (
                <div className="p-8 text-center text-xs text-[#9aa0a6]">Loading your saved notes...</div>
              ) : filteredDocs.length === 0 ? (
                <div className="p-8 bg-[#1e1f20] border border-[#3c4043]/40 rounded-2xl text-center space-y-2">
                  <FileText className="w-8 h-8 text-[#9aa0a6] mx-auto opacity-40" />
                  <p className="text-xs font-medium text-[#c4c7c5]">No documents match your filter.</p>
                  <p className="text-[11px] text-[#9aa0a6]">
                    Generate SOAP notes, RFCs, or memos to build your document library.
                  </p>
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  const warningCount = doc.unverifiedTokens?.length || 0;

                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 group ${
                        isSelected
                          ? 'bg-[#2d2e30] border-[#4e8cff] shadow-lg'
                          : 'bg-[#1e1f20] border-[#3c4043]/40 hover:border-[#3c4043]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#131314] text-[#4e8cff] border border-[#3c4043]/50">
                          {TEMPLATE_LABELS[doc.templateType] || doc.templateType.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDuplicateDoc(doc.id, e)}
                            className="p-1 hover:text-white text-[#9aa0a6] transition"
                            title="Duplicate Document"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteDoc(doc.id, e)}
                            className="p-1 hover:text-red-400 text-[#9aa0a6] transition"
                            title="Delete Document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-white truncate">{doc.title}</h3>

                      <div className="flex items-center justify-between text-[10px] text-[#9aa0a6] pt-1 border-t border-[#3c4043]/30 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          {warningCount > 0 ? (
                            <span className="text-amber-400 flex items-center gap-1 font-semibold">
                              <AlertTriangle size={11} />
                              {warningCount} flag{warningCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Check size={11} /> Verified
                            </span>
                          )}
                          <span>v{doc.versions?.length || 1}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Selected Document Editor & Viewer */}
          <div className="lg:col-span-8 bg-[#1e1f20] border border-[#3c4043]/50 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl">
            {!selectedDoc ? (
              <div className="py-24 text-center space-y-3">
                <FileText className="w-12 h-12 text-[#9aa0a6] mx-auto opacity-30" />
                <p className="text-sm font-semibold text-white">Select a document from the list to edit and view history</p>
                <p className="text-xs text-[#9aa0a6] max-w-sm mx-auto">
                  Every document features fixed section ordering, fact checking against input, section-level regeneration, and version history.
                </p>
              </div>
            ) : (
              <>
                {/* Document Title Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3c4043]/50 pb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                        {TEMPLATE_LABELS[selectedDoc.templateType] || selectedDoc.templateType.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-[#9aa0a6] font-mono">
                        Created {new Date(selectedDoc.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="bg-[#131314] border border-[#4e8cff] rounded-lg px-3 py-1 text-sm text-white font-bold w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => setIsEditingTitle(false)}
                          className="p-1.5 bg-[#4e8cff] text-white rounded-lg text-xs"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h2 className="text-lg font-bold text-white truncate">{editedTitle}</h2>
                        {!isLocked && (
                          <button
                            onClick={() => setIsEditingTitle(true)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#9aa0a6] hover:text-white transition"
                            title="Rename Document"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sign-off status badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                        signoffStatus === 'signed_off'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : signoffStatus === 'in_review'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                            : 'bg-slate-500/15 text-slate-300 border-slate-500/40'
                      }`}
                      title={
                        signoffStatus === 'signed_off' && selectedDoc?.signoff?.signedAt
                          ? `Signed off by ${selectedDoc.signoff.reviewedBy || 'reviewer'} on ${new Date(selectedDoc.signoff.signedAt).toLocaleString()}`
                          : signoffStatus === 'in_review'
                            ? 'Awaiting senior review'
                            : 'Editable draft'
                      }
                    >
                      {signoffStatus === 'signed_off' ? <Stamp size={12} /> : signoffStatus === 'in_review' ? <Send size={12} /> : <FileCheck size={12} />}
                      {signoffStatus === 'signed_off' ? 'Signed off · Locked' : signoffStatus === 'in_review' ? 'In review' : 'Draft'}
                    </span>

                    {/* Sign-off workflow buttons */}
                    {signoffStatus === 'draft' && (
                      <button
                        onClick={() => handleSignoffAction('submit-review')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Submit for senior review"
                      >
                        <Send size={14} />
                        <span>Submit for Review</span>
                      </button>
                    )}
                    {signoffStatus === 'in_review' && (
                      <button
                        onClick={() => handleSignoffAction('sign-off')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Approve and lock this document"
                      >
                        <Stamp size={14} />
                        <span>Sign Off & Lock</span>
                      </button>
                    )}
                    {isLocked && (
                      <button
                        onClick={() => handleSignoffAction('reopen')}
                        className="px-3 py-1.5 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] border border-[#3c4043] text-[#c4c7c5] hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Reopen as editable draft"
                      >
                        <LockOpen size={14} />
                        <span>Reopen</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowVersionHistory(!showVersionHistory)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        showVersionHistory
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-[#2d2e30] border-[#3c4043] text-[#c4c7c5] hover:text-white'
                      }`}
                    >
                      <History size={14} />
                      <span>History (v{selectedDoc.versions?.length || 1})</span>
                    </button>

                    <button
                      onClick={handleSaveDoc}
                      disabled={isSaving || isLocked}
                      title={isLocked ? 'Signed off documents are locked. Reopen to edit.' : 'Save a new version'}
                      className="px-3.5 py-1.5 rounded-xl bg-[#4e8cff] hover:bg-[#3b78e7] disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#4e8cff]/20"
                    >
                      <Save size={14} />
                      <span>{isSaving ? 'Saving...' : isLocked ? 'Locked' : 'Save Version'}</span>
                    </button>

                    {/* PDF Export */}
                    <button
                      onClick={() => {
                        if (!isPaidPlan) {
                          onShowToast?.('info', 'PDF export is available on Pro & Team plans.');
                          onOpenPricing?.();
                          return;
                        }
                        const sectionsList = Object.entries(editedSections).map(([k, v]) => ({
                          title: k.toUpperCase(),
                          content: v,
                        }));
                        exportNoteToPdf({ title: editedTitle, signoff: selectedDoc?.signoff }, sectionsList);
                        onShowToast?.('success', 'PDF exported successfully.');
                      }}
                      className="p-2 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-blue-400 border border-blue-500/30 transition cursor-pointer"
                      title="Export PDF"
                    >
                      {!isPaidPlan ? <Lock size={14} className="text-amber-400" /> : <FileDown size={14} />}
                    </button>

                    {/* Word Export */}
                    <button
                      onClick={async () => {
                        if (!isPaidPlan) {
                          onShowToast?.('info', 'Word (.docx) export is available on Pro & Team plans.');
                          onOpenPricing?.();
                          return;
                        }
                        const sectionsList = Object.entries(editedSections).map(([k, v]) => ({
                          title: k.toUpperCase(),
                          content: v,
                        }));
                        await exportNoteToDocx({ title: editedTitle, signoff: selectedDoc?.signoff }, sectionsList);
                        onShowToast?.('success', 'Word document exported successfully.');
                      }}
                      className="p-2 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-indigo-400 border border-indigo-500/30 transition cursor-pointer"
                      title="Export Word (.docx)"
                    >
                      {!isPaidPlan ? <Lock size={14} className="text-amber-400" /> : <FileText size={14} />}
                    </button>
                  </div>
                </div>

                {/* Fact Check Banner */}
                {selectedDoc.unverifiedTokens && selectedDoc.unverifiedTokens.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-300">Fact-Check Verification Warning</div>
                      <div className="mt-0.5 text-[11px] leading-relaxed">
                        The following items in the generated document were not found in your raw input and require professional verification:
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedDoc.unverifiedTokens.map((tok, idx) => (
                            <span key={idx} className="bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 rounded font-mono text-[10px] text-amber-300">
                              {tok}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Version History Drawer (When Toggled) */}
                {showVersionHistory && (
                  <div className="p-4 rounded-xl bg-[#131314] border border-purple-500/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs text-purple-300 font-bold border-b border-purple-500/20 pb-2">
                      <span className="flex items-center gap-1.5">
                        <History size={14} /> Version History Timeline
                      </span>
                      <button onClick={() => setShowVersionHistory(false)} className="text-[#9aa0a6] hover:text-white">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                      {(selectedDoc.versions || []).map((v) => (
                        <div key={v.version} className="p-2.5 rounded-lg bg-[#1e1f20] border border-[#3c4043]/40 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">Version {v.version}</span>
                            <span className="text-[11px] text-[#9aa0a6] block">{v.summary}</span>
                            <span className="text-[10px] text-purple-400 font-mono">
                              By {v.changedBy} on {new Date(v.changedAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setEditedSections({ ...v.sections });
                              onShowToast?.('info', `Restored section snapshot from Version ${v.version}.`);
                            }}
                            className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-[10px] font-semibold"
                          >
                            Restore Version
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections Editor List */}
                <div className="space-y-4">
                  {Object.entries(editedSections).map(([secKey, secValue]) => (
                    <div key={secKey} className="p-4 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4e8cff] uppercase tracking-wider">
                          {secKey.replace(/_/g, ' ')}
                        </span>

                        <button
                          onClick={() => handleRegenerateSection(secKey)}
                          disabled={regeneratingKey === secKey || isLocked}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2d2e30] hover:bg-[#3c4043] disabled:opacity-40 text-[11px] text-[#c4c7c5] hover:text-white transition cursor-pointer"
                          title={isLocked ? 'Signed off documents are locked' : 'Regenerate this section strictly from raw input facts'}
                        >
                          <RefreshCw size={12} className={regeneratingKey === secKey ? 'animate-spin text-[#4e8cff]' : ''} />
                          <span>{regeneratingKey === secKey ? 'Regenerating...' : 'Regenerate section'}</span>
                        </button>
                      </div>

                      {/* Fact Checked Preview */}
                      <div className="p-3 rounded-lg bg-[#1a1b1e] border border-[#2d2e30] text-xs text-[#e3e3e3] leading-relaxed">
                        {renderFactCheckedText(secValue, selectedDoc.unverifiedTokens)}
                      </div>

                      {/* Simple Editable Textarea (read-only when signed off) */}
                      <textarea
                        value={secValue}
                        onChange={(e) => setEditedSections((prev) => ({ ...prev, [secKey]: e.target.value }))}
                        rows={3}
                        disabled={isLocked}
                        className="w-full bg-[#1e1f20] border border-[#3c4043]/50 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#4e8cff] font-mono leading-relaxed disabled:opacity-70"
                        placeholder="Edit section text..."
                      />
                    </div>
                  ))}
                </div>

                {/* Mandatory Clinical Notice */}
                {selectedDoc.clinicalNotice && (
                  <div className="pt-2 text-center text-[11px] text-[#9aa0a6] italic border-t border-[#3c4043]/30">
                    {selectedDoc.clinicalNotice}
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </div>

      {/* Delete Account Modal (Requirement 3) */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e1f20] border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Delete PulseNote AI Account</h3>
                <p className="text-xs text-rose-300">Permanent data wipe requested</p>
              </div>
            </div>

            <p className="text-xs text-[#c4c7c5] leading-relaxed">
              Are you sure you want to delete your account? This action will permanently remove all your saved documents, version history, subscription records, and profile details from our servers.
            </p>

            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[11px] text-rose-200">
              <span className="font-bold">Guaranteed Data Deletion:</span> Your notes stay in your account. You can delete them at any time. Once deleted, data cannot be recovered.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#3c4043] text-xs text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20"
              >
                {isDeletingAccount ? 'Deleting All Data...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
