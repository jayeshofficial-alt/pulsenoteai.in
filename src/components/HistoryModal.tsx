import React, { useState } from 'react';
import { TransformedReport, TargetIndustry } from '../types';
import { INDUSTRY_CONFIGS } from '../data/presets';
import { 
  X, 
  Search, 
  Trash2, 
  ExternalLink, 
  Clock, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: TransformedReport[];
  onSelectReport: (report: TransformedReport) => void;
  onDeleteReport: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  reports,
  onSelectReport,
  onDeleteReport,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');

  if (!isOpen) return null;

  const filteredReports = reports.filter((r) => {
    const matchesIndustry = filterIndustry === 'all' || r.industry === filterIndustry;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.markdownReport.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in no-print">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Documentation Archive</h3>
              <p className="text-xs text-slate-400">{reports.length} reports stored locally</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reports.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-900/40"
              >
                Clear Archive
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, keyword, or patient/asset name..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilterIndustry('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterIndustry === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Modes
            </button>
            {INDUSTRY_CONFIGS.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setFilterIndustry(ind.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filterIndustry === ind.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ind.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* List of Reports */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredReports.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-300">No archived documentation found</p>
              <p className="text-xs text-slate-500 mt-1">
                Transform rough transcripts or notes to save them to your local archive.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const config = INDUSTRY_CONFIGS.find((c) => c.id === report.industry) || INDUSTRY_CONFIGS[0];
              return (
                <div
                  key={report.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3 group"
                >
                  <div
                    onClick={() => {
                      onSelectReport(report);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${config.badgeBg}`}>
                        {config.shortName}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(report.timestamp).toLocaleDateString()} •{' '}
                        {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                      {report.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {report.markdownReport.replace(/[#*`_\[\]]/g, '')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <button
                      onClick={() => {
                        onSelectReport(report);
                        onClose();
                      }}
                      title="Load Report"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteReport(report.id);
                      }}
                      title="Delete Report"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
