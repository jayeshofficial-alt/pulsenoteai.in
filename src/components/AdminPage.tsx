import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  Film,
  Image as ImageIcon,
  ArrowLeft,
  Activity,
  Server,
  Globe,
  Database,
  CreditCard,
  FileText,
  Search,
  Shield,
  Filter,
  UserX,
  Crown,
  Trash2,
  Sliders,
  Calendar,
  X,
  Download,
  TrendingUp,
  BarChart3,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { FeatureSettingsDoc } from '../types';
import { updateFeatureSettings, isPulseNoteAdmin, ADMIN_EMAILS } from '../lib/firebase';

interface AuditLogItem {
  id: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  targetUserEmail?: string;
  details: string;
  timestamp: number;
}

interface HealthResponse {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'error';
  services: Record<
    string,
    {
      name: string;
      status: 'ok' | 'degraded' | 'error' | 'not_configured';
      configured?: boolean;
      latencyMs?: number;
      message?: string;
      error?: string;
      projectId?: string;
      totalUsers?: number;
      totalPayments?: number;
      keyPreview?: string;
    }
  >;
}

interface AdminPageProps {
  currentUser: { email?: string | null; emailVerified?: boolean } | null;
  features: FeatureSettingsDoc;
  onBack: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function AdminPage({
  currentUser,
  features,
  onBack,
  onShowToast,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'controls' | 'audit'>('controls');
  const [isUpdating, setIsUpdating] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'BAN' | 'PREMIUM' | 'SWITCH' | 'DELETE'>('ALL');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
  const [chartViewMode, setChartViewMode] = useState<'stacked' | 'total'>('stacked');
  const isAdmin = isPulseNoteAdmin(currentUser?.email, currentUser?.emailVerified);

  const auditChartData = useMemo(() => {
    const days: {
      date: string;
      fullDate: string;
      total: number;
      bans: number;
      premium: number;
      switches: number;
      deletions: number;
      other: number;
    }[] = [];

    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const fullDate = `${year}-${month}-${day}`;
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      days.push({
        date: dateLabel,
        fullDate,
        total: 0,
        bans: 0,
        premium: 0,
        switches: 0,
        deletions: 0,
        other: 0,
      });
    }

    const dayMap = new Map(days.map((item) => [item.fullDate, item]));

    auditLogs.forEach((log) => {
      const d = new Date(log.timestamp);
      if (isNaN(d.getTime())) return;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const fullDate = `${year}-${month}-${day}`;

      const targetDay = dayMap.get(fullDate);
      if (targetDay) {
        targetDay.total += 1;
        if (log.action.includes('BAN')) {
          targetDay.bans += 1;
        } else if (log.action.includes('PREMIUM') || log.action.includes('TENURE')) {
          targetDay.premium += 1;
        } else if (log.action.includes('SWITCH') || log.action.includes('FEATURE')) {
          targetDay.switches += 1;
        } else if (log.action.includes('DELETE')) {
          targetDay.deletions += 1;
        } else {
          targetDay.other += 1;
        }
      }
    });

    return days;
  }, [auditLogs]);

  const total30DayActions = useMemo(() => auditChartData.reduce((acc, curr) => acc + curr.total, 0), [auditChartData]);
  const total30DayBans = useMemo(() => auditChartData.reduce((acc, curr) => acc + curr.bans, 0), [auditChartData]);
  const total30DayPremium = useMemo(() => auditChartData.reduce((acc, curr) => acc + curr.premium, 0), [auditChartData]);
  const total30DaySwitches = useMemo(() => auditChartData.reduce((acc, curr) => acc + curr.switches, 0), [auditChartData]);

  const setQuickDatePreset = (preset: 'ALL' | 'TODAY' | '7DAYS' | '30DAYS') => {
    const now = new Date();
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'ALL') {
      setAuditStartDate('');
      setAuditEndDate('');
      return;
    }

    const endDateStr = formatDateStr(now);

    if (preset === 'TODAY') {
      setAuditStartDate(endDateStr);
      setAuditEndDate(endDateStr);
    } else if (preset === '7DAYS') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setAuditStartDate(formatDateStr(past7));
      setAuditEndDate(endDateStr);
    } else if (preset === '30DAYS') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      setAuditStartDate(formatDateStr(past30));
      setAuditEndDate(endDateStr);
    }
  };

  const uniqueUsers = Array.from(
    new Set(
      auditLogs
        .flatMap((log) => [log.adminEmail, log.targetUserEmail, log.targetUserId])
        .filter((val): val is string => Boolean(val && val.trim()))
    )
  ).sort();

  const getFilteredAuditLogs = (): AuditLogItem[] => {
    return auditLogs.filter((log) => {
      const query = auditSearch.toLowerCase().trim();
      const matchesQuery =
        !query ||
        log.adminEmail.toLowerCase().includes(query) ||
        (log.targetUserEmail && log.targetUserEmail.toLowerCase().includes(query)) ||
        (log.targetUserId && log.targetUserId.toLowerCase().includes(query)) ||
        log.action.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query);

      if (!matchesQuery) return false;

      if (auditFilter === 'BAN' && !log.action.includes('BAN')) return false;
      if (auditFilter === 'PREMIUM' && !(log.action.includes('PREMIUM') || log.action.includes('TENURE'))) return false;
      if (auditFilter === 'SWITCH' && !(log.action.includes('SWITCH') || log.action.includes('FEATURE'))) return false;
      if (auditFilter === 'DELETE' && !log.action.includes('DELETE')) return false;

      if (selectedUserFilter !== 'ALL') {
        const userLower = selectedUserFilter.toLowerCase();
        const userMatch =
          log.adminEmail.toLowerCase() === userLower ||
          (log.targetUserEmail && log.targetUserEmail.toLowerCase() === userLower) ||
          (log.targetUserId && log.targetUserId.toLowerCase() === userLower);
        if (!userMatch) return false;
      }

      if (auditStartDate) {
        const startMs = new Date(`${auditStartDate}T00:00:00`).getTime();
        if (!isNaN(startMs) && log.timestamp < startMs) return false;
      }

      if (auditEndDate) {
        const endMs = new Date(`${auditEndDate}T23:59:59.999`).getTime();
        if (!isNaN(endMs) && log.timestamp > endMs) return false;
      }

      return true;
    });
  };

  const handleDownloadCSV = () => {
    const logsToExport = getFilteredAuditLogs();

    if (!logsToExport || logsToExport.length === 0) {
      onShowToast?.('info', 'No audit logs available to export for the current filter.');
      return;
    }

    const headers = [
      'Log ID',
      'Timestamp (ISO)',
      'Formatted Date',
      'Admin Email',
      'Action',
      'Target User Email',
      'Target User ID',
      'Details',
    ];

    const escapeCSV = (field: string | number | undefined | null) => {
      if (field === undefined || field === null) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = logsToExport.map((log) => {
      const isoDate = new Date(log.timestamp).toISOString();
      const formattedDateStr = new Date(log.timestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      return [
        escapeCSV(log.id),
        escapeCSV(isoDate),
        escapeCSV(formattedDateStr),
        escapeCSV(log.adminEmail),
        escapeCSV(log.action),
        escapeCSV(log.targetUserEmail || ''),
        escapeCSV(log.targetUserId || ''),
        escapeCSV(log.details),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const dateTag = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pulsenote_audit_logs_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast?.('success', `Exported ${logsToExport.length} audit log entries to CSV.`);
  };

  const fetchHealthStatus = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/admin/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (e) {
      console.warn('Failed to fetch admin health status:', e);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: {
          'x-admin-email': currentUser?.email || 'jayeshofficial@gmail.com',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setAuditLogs(data.logs);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch admin audit logs:', e);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchHealthStatus();
      fetchAuditLogs();
    }
  }, [isAdmin]);

  const handleToggle = async (key: 'image' | 'video') => {
    if (!isAdmin) {
      onShowToast?.('error', 'Unauthorized: Admin privileges required.');
      return;
    }

    setIsUpdating(true);
    const newImage = key === 'image' ? !features.imageGenerationEnabled : features.imageGenerationEnabled;
    const newVideo = key === 'video' ? !features.videoGenerationEnabled : features.videoGenerationEnabled;

    try {
      await updateFeatureSettings(newImage, newVideo, currentUser?.email || 'admin');
      onShowToast?.('success', `${key === 'image' ? 'Image' : 'Video'} generation switch updated.`);
    } catch (err: any) {
      console.error('Failed to update feature settings:', err);
      onShowToast?.('error', err?.message || 'Failed to update feature switch.');
    } finally {
      setIsUpdating(false);
    }
  };

  // If not signed in as one of the two admin emails, show Access Denied
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#131314] text-[#e3e3e3]">
        <div className="max-w-md w-full bg-[#1e1f20] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <Lock size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-xs text-[#9aa0a6] mt-1.5 leading-relaxed">
              The <span className="font-mono text-red-300">/admin</span> control portal is strictly restricted to authorized platform administrators:
            </p>
            <div className="mt-3 p-2.5 rounded-lg bg-[#131314] border border-[#2d2e30] font-mono text-[11px] text-slate-300 space-y-1">
              {ADMIN_EMAILS.map((em) => (
                <div key={em} className="text-amber-300/90">• {em}</div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Current account: <span className="text-white font-mono">{currentUser?.email || 'Signed out'}</span>
          </p>
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-sm text-white font-medium transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = features.updatedAt
    ? new Date(features.updatedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'System Initial';

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3] p-4 sm:p-6 lg:p-8 scrollbar-thin printable-admin-container">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Dedicated Print-Only Professional PDF Header */}
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">PulseNote AI — Admin Operations & Audit Trail Report</h1>
              <p className="text-xs text-slate-600 mt-1">
                Generated: {new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' })} | Domain: pulsenoteai.in
              </p>
            </div>
            <div className="text-right text-xs text-slate-800">
              <span className="font-semibold block">Authorized Admin:</span>
              <span className="font-mono text-indigo-900 font-bold">{currentUser?.email || 'Administrator'}</span>
            </div>
          </div>
        </div>

        {/* Navigation & Title (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-[#2d2e30] pb-5 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white transition cursor-pointer"
              title="Return"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Admin Control & Audit Portal
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Admin
                </span>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">
                Authoritative Firestore <span className="font-mono text-slate-300">settings/features</span> switches & immutable action logs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-xs font-semibold text-white flex items-center gap-2 transition cursor-pointer shadow-md border border-[#3c4043]"
              title="Print user management & audit log report to PDF"
            >
              <Printer size={15} className="text-[#4e8cff]" />
              <span>Print / Export PDF</span>
            </button>

            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-[#9aa0a6] block">Authenticated Admin</span>
              <span className="text-xs font-mono text-emerald-400 font-medium">{currentUser?.email}</span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Tabs (Hidden during print) */}
        <div className="flex items-center gap-2 border-b border-[#2d2e30] pb-3 no-print">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] text-white shadow-md'
                : 'bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white border border-[#2d2e30]'
            }`}
          >
            <Sliders size={15} />
            <span>Switches & Health</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audit');
              fetchAuditLogs();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-[#4e8cff] to-[#8b5cf6] text-white shadow-md'
                : 'bg-[#1e1f20] hover:bg-[#2d2e30] text-[#9aa0a6] hover:text-white border border-[#2d2e30]'
            }`}
          >
            <FileText size={15} />
            <span>Audit Log</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {activeTab === 'controls' ? (
          <>
            {/* System & External Services Health Status (/api/admin/health) */}
            <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2d2e30] pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[#4e8cff]" />
                  <h3 className="text-base font-semibold text-white">External Services & Platform Health</h3>
                  {healthData?.status === 'healthy' ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Systems Operational
                    </span>
                  ) : healthData?.status === 'degraded' ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <AlertCircle size={12} /> Partial Degraded
                    </span>
                  ) : healthData?.status === 'error' ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                      <XCircle size={12} /> Attention Needed
                    </span>
                  ) : null}
                </div>

                <button
                  onClick={fetchHealthStatus}
                  disabled={healthLoading}
                  className="px-3 py-1.5 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-xs text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw size={13} className={healthLoading ? 'animate-spin' : ''} />
                  <span>{healthLoading ? 'Checking...' : 'Refresh Health'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Firebase Health */}
                <div className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Server size={14} className="text-[#4e8cff]" /> Firebase
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        healthData?.services?.firebase?.status === 'ok'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {healthData?.services?.firebase?.status === 'ok' ? 'CONNECTED' : 'DEGRADED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9aa0a6] leading-tight">
                    {healthData?.services?.firebase?.message || 'Checking Firebase...'}
                  </p>
                  {healthData?.services?.firebase?.projectId && (
                    <span className="text-[10px] font-mono text-slate-400 block truncate">
                      Project: {healthData.services.firebase.projectId}
                    </span>
                  )}
                </div>

                {/* OpenRouter Health */}
                <div className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Globe size={14} className="text-purple-400" /> OpenRouter
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        healthData?.services?.openRouter?.status === 'ok'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : healthData?.services?.openRouter?.status === 'not_configured'
                          ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {healthData?.services?.openRouter?.status === 'ok'
                        ? 'CONNECTED'
                        : healthData?.services?.openRouter?.status === 'not_configured'
                        ? 'NOT SET'
                        : 'DEGRADED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9aa0a6] leading-tight">
                    {healthData?.services?.openRouter?.message || 'Checking OpenRouter...'}
                  </p>
                  {typeof healthData?.services?.openRouter?.latencyMs === 'number' && (
                    <span className="text-[10px] font-mono text-emerald-400 block">
                      Latency: {healthData.services.openRouter.latencyMs}ms
                    </span>
                  )}
                </div>

                {/* Google Gemini Health */}
                <div className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" /> Gemini Models
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        healthData?.services?.gemini?.status === 'ok'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {healthData?.services?.gemini?.status === 'ok' ? 'CONFIGURED' : 'NOT SET'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9aa0a6] leading-tight">
                    {healthData?.services?.gemini?.message || 'Checking Gemini API...'}
                  </p>
                </div>

                {/* Razorpay Health */}
                <div className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <CreditCard size={14} className="text-emerald-400" /> Razorpay
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        healthData?.services?.razorpay?.status === 'ok'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {healthData?.services?.razorpay?.status === 'ok' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9aa0a6] leading-tight">
                    {healthData?.services?.razorpay?.message || 'Checking Razorpay...'}
                  </p>
                  {healthData?.services?.razorpay?.keyPreview && (
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Key: {healthData.services.razorpay.keyPreview}
                    </span>
                  )}
                </div>

                {/* Local Store Health */}
                <div className="p-3.5 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-2 sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Database size={14} className="text-indigo-400" /> Database & Store
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      HEALTHY
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[#9aa0a6]">
                    <span>Registered Users: <strong className="text-white">{healthData?.services?.database?.totalUsers ?? 0}</strong></span>
                    <span>Settled Payments: <strong className="text-white">{healthData?.services?.database?.totalPayments ?? 0}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice Banner */}
            <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#c4c7c5]">
              <ShieldCheck size={20} className="text-[#4e8cff] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-white">Cryptographic Server & Firestore Security Rule Enforcement</p>
                <p className="text-[#9aa0a6] leading-relaxed">
                  When toggled off, image and video prompt boxes, navigation tabs, and output areas are immediately removed from client views. In addition, Cloud Functions return HTTP 403 "This feature is turned off", preventing API bypass.
                </p>
              </div>
            </div>

            {/* Switches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Generation Toggle */}
              <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <ImageIcon size={22} />
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border ${
                        features.imageGenerationEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {features.imageGenerationEnabled ? 'ONLINE / ENABLED' : 'OFFLINE / DISABLED'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white">Image Generation</h3>
                  <p className="text-xs text-[#9aa0a6] leading-relaxed">
                    Controls Imagen 4.0 (<span className="font-mono text-amber-300">imagen-4.0-generate-001</span>) creation pipeline across the workspace and Imagen Studio.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#2d2e30] flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    {features.imageGenerationEnabled ? 'Currently enabled' : 'Currently disabled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggle('image')}
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md ${
                      features.imageGenerationEnabled
                        ? 'bg-red-600/80 hover:bg-red-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isUpdating ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : features.imageGenerationEnabled ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                    <span>{features.imageGenerationEnabled ? 'Turn Off' : 'Turn On'}</span>
                  </button>
                </div>
              </div>

              {/* Video Generation Toggle */}
              <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Film size={22} />
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border ${
                        features.videoGenerationEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {features.videoGenerationEnabled ? 'ONLINE / ENABLED' : 'OFFLINE / DISABLED'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white">Video Generation</h3>
                  <p className="text-xs text-[#9aa0a6] leading-relaxed">
                    Controls Veo 3.0 (<span className="font-mono text-purple-300">veo-3.0-fast-generate-001</span>) video rendering engine across workspace and Video Studio.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#2d2e30] flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    {features.videoGenerationEnabled ? 'Currently enabled' : 'Currently disabled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggle('video')}
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md ${
                      features.videoGenerationEnabled
                        ? 'bg-red-600/80 hover:bg-red-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isUpdating ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : features.videoGenerationEnabled ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                    <span>{features.videoGenerationEnabled ? 'Turn Off' : 'Turn On'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Metadata Card */}
            <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-[#4e8cff]" />
                Audit Trail & Last Change Metadata
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-1">
                  <span className="text-[#9aa0a6] flex items-center gap-1.5 text-[11px]">
                    <User size={12} /> Changed Last By
                  </span>
                  <span className="font-mono text-white font-medium block truncate">
                    {features.updatedBy || 'system'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#131314] border border-[#2d2e30] space-y-1">
                  <span className="text-[#9aa0a6] flex items-center gap-1.5 text-[11px]">
                    <Clock size={12} /> Timestamp
                  </span>
                  <span className="font-mono text-emerald-400 font-medium block">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Audit Log Tab View */
          <div className="bg-[#1e1f20] border border-[#2d2e30] rounded-2xl p-5 space-y-5 shadow-xl">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2d2e30] pb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Shield size={18} className="text-[#4e8cff]" />
                  Administrator Action Audit Log
                </h3>
                <p className="text-xs text-[#9aa0a6] mt-0.5">
                  Immutable record of moderation events, user bans, premium tier updates, and system configuration changes.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 no-print">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-3.5 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-xs font-semibold text-white flex items-center gap-2 transition cursor-pointer border border-[#3c4043]"
                  title="Print audit log table to PDF"
                >
                  <Printer size={14} className="text-[#4e8cff]" />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  disabled={auditLoading || auditLogs.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white flex items-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download audit log entries as CSV file"
                >
                  <Download size={14} />
                  <span>Download CSV</span>
                </button>

                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  disabled={auditLoading}
                  className="px-3.5 py-2 rounded-xl bg-[#2d2e30] hover:bg-[#35363a] text-xs text-white flex items-center gap-2 transition cursor-pointer shrink-0"
                >
                  <RefreshCw size={14} className={auditLoading ? 'animate-spin' : ''} />
                  <span>{auditLoading ? 'Refreshing...' : 'Refresh Logs'}</span>
                </button>
              </div>
            </div>

            {/* 30-Day Audit Log Activity Visualization Chart (Recharts) */}
            <div className="bg-[#131314] border border-[#2d2e30] rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2d2e30] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#4e8cff]" />
                    <h4 className="text-sm font-bold text-white">30-Day Audit Activity Timeline</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Recharts Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9aa0a6]">
                    Daily action trends for bans, premium plan changes, feature toggles, and deletions over the last 30 days.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('stacked')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer border ${
                      chartViewMode === 'stacked'
                        ? 'bg-[#4e8cff]/20 text-[#4e8cff] border-[#4e8cff]/40'
                        : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border-[#2d2e30]'
                    }`}
                  >
                    Action Breakdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('total')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer border ${
                      chartViewMode === 'total'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border-[#2d2e30]'
                    }`}
                  >
                    Total Volume
                  </button>
                </div>
              </div>

              {/* Stat Metric Summary Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#1e1f20] border border-[#2d2e30]">
                  <span className="text-[10px] text-[#9aa0a6] block uppercase tracking-wider font-semibold">30-Day Volume</span>
                  <span className="text-lg font-bold font-mono text-white mt-0.5 block">{total30DayActions}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1e1f20] border border-red-500/20">
                  <span className="text-[10px] text-red-400 block uppercase tracking-wider font-semibold">User Bans</span>
                  <span className="text-lg font-bold font-mono text-red-300 mt-0.5 block">{total30DayBans}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1e1f20] border border-purple-500/20">
                  <span className="text-[10px] text-purple-400 block uppercase tracking-wider font-semibold">Premium Updates</span>
                  <span className="text-lg font-bold font-mono text-purple-300 mt-0.5 block">{total30DayPremium}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1e1f20] border border-blue-500/20">
                  <span className="text-[10px] text-blue-400 block uppercase tracking-wider font-semibold">Feature Switches</span>
                  <span className="text-lg font-bold font-mono text-blue-300 mt-0.5 block">{total30DaySwitches}</span>
                </div>
              </div>

              {/* Chart Canvas Container */}
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartViewMode === 'stacked' ? (
                    <AreaChart data={auditChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorSwitches" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorDeletions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2e30" vertical={false} />
                      <XAxis dataKey="date" stroke="#9aa0a6" tick={{ fill: '#9aa0a6', fontSize: 10 }} tickLine={false} />
                      <YAxis stroke="#9aa0a6" tick={{ fill: '#9aa0a6', fontSize: 10 }} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            const totalVal = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);
                            return (
                              <div className="bg-[#1e1f20] border border-[#3c4043] p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans z-50">
                                <div className="font-bold text-white flex items-center justify-between gap-4 border-b border-[#2d2e30] pb-1">
                                  <span>{label}</span>
                                  <span className="text-purple-400 font-mono text-[11px]">{totalVal} Action{totalVal !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="space-y-1 pt-0.5">
                                  {payload.map((entry: any, index: number) => (
                                    <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
                                      <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span>{entry.name}:</span>
                                      </span>
                                      <span className="font-mono font-semibold text-white">{entry.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        formatter={(value) => <span className="text-xs text-[#9aa0a6] font-medium">{value}</span>}
                      />
                      <Area type="monotone" dataKey="bans" name="Bans" stackId="1" stroke="#ef4444" fillOpacity={1} fill="url(#colorBans)" />
                      <Area type="monotone" dataKey="premium" name="Premium Updates" stackId="1" stroke="#a855f7" fillOpacity={1} fill="url(#colorPremium)" />
                      <Area type="monotone" dataKey="switches" name="Switches" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSwitches)" />
                      <Area type="monotone" dataKey="deletions" name="Deletions" stackId="1" stroke="#f97316" fillOpacity={1} fill="url(#colorDeletions)" />
                      <Area type="monotone" dataKey="other" name="Other Actions" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorOther)" />
                    </AreaChart>
                  ) : (
                    <AreaChart data={auditChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#4e8cff" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2e30" vertical={false} />
                      <XAxis dataKey="date" stroke="#9aa0a6" tick={{ fill: '#9aa0a6', fontSize: 10 }} tickLine={false} />
                      <YAxis stroke="#9aa0a6" tick={{ fill: '#9aa0a6', fontSize: 10 }} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#1e1f20] border border-[#3c4043] p-3 rounded-xl shadow-2xl text-xs space-y-1 font-sans z-50">
                                <div className="font-bold text-white border-b border-[#2d2e30] pb-1">{label}</div>
                                <div className="text-purple-300 font-mono font-semibold pt-1">
                                  Total Actions: {payload[0]?.value}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="total" name="Total Actions" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comprehensive Search, User Activity & Date Range Filters Bar (Hidden in Print) */}
            <div className="space-y-3 bg-[#131314] p-4 rounded-xl border border-[#2d2e30] no-print">
              {/* Row 1: Search Input & User Activity Dropdown */}
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 bg-[#1e1f20] border border-[#2d2e30] focus-within:border-[#4e8cff] rounded-xl flex items-center px-3.5 py-2 w-full transition">
                  <Search size={16} className="text-[#9aa0a6] shrink-0" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search logs by keyword, admin, target user, action..."
                    className="bg-transparent outline-none text-xs text-white placeholder:text-[#9aa0a6] ml-2 w-full"
                  />
                  {auditSearch && (
                    <button
                      onClick={() => setAuditSearch('')}
                      className="text-[#9aa0a6] hover:text-white p-0.5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* User Activity Dropdown */}
                <div className="w-full md:w-72 bg-[#1e1f20] border border-[#2d2e30] rounded-xl flex items-center px-3 py-1.5 focus-within:border-[#4e8cff]">
                  <User size={15} className="text-[#4e8cff] shrink-0 mr-2" />
                  <select
                    value={selectedUserFilter}
                    onChange={(e) => setSelectedUserFilter(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full cursor-pointer py-1"
                  >
                    <option value="ALL" className="bg-[#1e1f20] text-white">
                      All User Activity ({uniqueUsers.length} users)
                    </option>
                    {uniqueUsers.map((userEmailOrId) => (
                      <option key={userEmailOrId} value={userEmailOrId} className="bg-[#1e1f20] text-white font-mono">
                        {userEmailOrId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Action Filters & Date Range Controls */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-[#2d2e30]">
                {/* Action Type Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
                  <span className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                    <Filter size={12} /> Action:
                  </span>
                  {(['ALL', 'BAN', 'PREMIUM', 'SWITCH', 'DELETE'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAuditFilter(filter)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer shrink-0 border ${
                        auditFilter === filter
                          ? 'bg-[#4e8cff]/20 text-[#4e8cff] border-[#4e8cff]/40'
                          : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border-[#2d2e30]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Date Range Picker Controls */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <div className="flex items-center gap-1 text-[11px] text-[#9aa0a6]">
                    <Calendar size={13} className="text-[#4e8cff]" />
                    <span className="hidden sm:inline">Date Range:</span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'TODAY', label: 'Today' },
                      { id: '7DAYS', label: '7 Days' },
                      { id: '30DAYS', label: '30 Days' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setQuickDatePreset(preset.id as any)}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono transition cursor-pointer border ${
                          (!auditStartDate && !auditEndDate && preset.id === 'ALL') ||
                          (preset.id === 'TODAY' && auditStartDate && auditStartDate === auditEndDate)
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold'
                            : 'bg-[#1e1f20] text-[#9aa0a6] hover:text-white border-[#2d2e30]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Date Range Input Pickers */}
                  <div className="flex items-center gap-1 bg-[#1e1f20] border border-[#2d2e30] rounded-lg px-2 py-1">
                    <input
                      type="date"
                      value={auditStartDate}
                      onChange={(e) => setAuditStartDate(e.target.value)}
                      className="bg-transparent text-[10px] font-mono text-white outline-none cursor-pointer border-none"
                      title="Start Date"
                    />
                    <span className="text-[#9aa0a6] text-[10px]">-</span>
                    <input
                      type="date"
                      value={auditEndDate}
                      onChange={(e) => setAuditEndDate(e.target.value)}
                      className="bg-transparent text-[10px] font-mono text-white outline-none cursor-pointer border-none"
                      title="End Date"
                    />
                  </div>

                  {/* Clear All Filters Button */}
                  {(auditSearch || auditFilter !== 'ALL' || selectedUserFilter !== 'ALL' || auditStartDate || auditEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditSearch('');
                        setAuditFilter('ALL');
                        setSelectedUserFilter('ALL');
                        setAuditStartDate('');
                        setAuditEndDate('');
                      }}
                      className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
                      title="Reset all filters"
                    >
                      <X size={12} /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Logs Table / List */}
            {auditLoading ? (
              <div className="p-12 text-center text-[#9aa0a6] text-xs space-y-2">
                <RefreshCw size={24} className="animate-spin mx-auto text-[#4e8cff]" />
                <p>Loading administrator audit logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-[#9aa0a6] text-xs space-y-2 bg-[#131314] rounded-xl border border-[#2d2e30]">
                <ShieldCheck size={32} className="mx-auto text-emerald-400/80" />
                <p className="font-medium text-white">No Audit Events Recorded Yet</p>
                <p className="text-[11px]">Critical admin actions like user bans or plan upgrades will automatically appear here.</p>
              </div>
            ) : (() => {
              const filteredLogs = getFilteredAuditLogs();

              if (filteredLogs.length === 0) {
                return (
                  <div className="p-8 text-center text-[#9aa0a6] text-xs space-y-2 bg-[#131314] rounded-xl border border-[#2d2e30]">
                    <Search size={28} className="mx-auto text-[#4e8cff]/70" />
                    <p className="font-medium text-white">No matching audit logs found</p>
                    <p className="text-[11px]">Try adjusting your search terms, user filter, action category, or date range.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#9aa0a6] px-1">
                    <span>
                      Showing <strong className="text-white">{filteredLogs.length}</strong> of{' '}
                      <strong className="text-white">{auditLogs.length}</strong> total log entries
                    </span>
                    {(auditStartDate || auditEndDate || selectedUserFilter !== 'ALL' || auditSearch || auditFilter !== 'ALL') && (
                      <span className="font-mono text-purple-400">Filters Active</span>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
                    {filteredLogs.map((log) => {
                      const dateStr = new Date(log.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      });

                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-xl bg-[#131314] border border-[#2d2e30] hover:border-[#3c4043] transition space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {/* Action Badges */}
                              {log.action.includes('BAN') ? (
                                <span className="bg-red-500/20 text-red-300 border border-red-500/30 font-mono text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                  <UserX size={12} /> {log.action}
                                </span>
                              ) : log.action.includes('PREMIUM') || log.action.includes('TENURE') ? (
                                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                  <Crown size={12} /> {log.action}
                                </span>
                              ) : log.action.includes('DELETE') ? (
                                <span className="bg-red-700/30 text-red-400 border border-red-700/40 font-mono text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                  <Trash2 size={12} /> {log.action}
                                </span>
                              ) : (
                                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                  <Sliders size={12} /> {log.action}
                                </span>
                              )}

                              <span className="text-[11px] font-mono text-emerald-400 font-medium flex items-center gap-1">
                                <Shield size={11} className="text-emerald-400" />
                                {log.adminEmail}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono text-[#9aa0a6] flex items-center gap-1">
                              <Clock size={11} /> {dateStr}
                            </span>
                          </div>

                          <p className="text-xs text-[#e3e3e3] leading-relaxed pl-1">
                            {log.details}
                          </p>

                          {log.targetUserEmail && (
                            <div className="pt-2 border-t border-[#2d2e30]/60 flex items-center gap-2 text-[11px] text-[#9aa0a6]">
                              <User size={11} className="text-[#4e8cff]" />
                              <span>Target Account:</span>
                              <span className="font-mono text-slate-200">{log.targetUserEmail}</span>
                              {log.targetUserId && (
                                <span className="font-mono text-slate-500 text-[10px]">({log.targetUserId})</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}



