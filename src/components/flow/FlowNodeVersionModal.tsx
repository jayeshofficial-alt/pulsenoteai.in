import React from 'react';
import { History, X, RotateCcw, Clock, User, Check, Sparkles } from 'lucide-react';
import { FlowNode, FlowNodeVersion } from '../../types';

interface FlowNodeVersionModalProps {
  node: FlowNode | null;
  onClose: () => void;
  onRestoreVersion: (nodeId: string, version: FlowNodeVersion) => void;
}

export const FlowNodeVersionModal: React.FC<FlowNodeVersionModalProps> = ({
  node,
  onClose,
  onRestoreVersion,
}) => {
  if (!node) return null;

  const versions = node.versions || [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Version History & Snapshots</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[300px]">{node.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Versions List */}
        <div className="p-4 overflow-y-auto space-y-3">
          {versions.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>No previous versions recorded yet.</p>
              <p className="text-[10px] text-slate-600 mt-1">Snapshots are automatically captured whenever prompts are regenerated or content is edited.</p>
            </div>
          ) : (
            versions.map((ver, idx) => (
              <div 
                key={ver.id || idx}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono font-bold text-indigo-300">
                      v{versions.length - idx}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{ver.title || 'Revision Snapshot'}</span>
                  </div>
                  <button
                    onClick={() => onRestoreVersion(node.id, ver)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Rollback</span>
                  </button>
                </div>

                {ver.summary && (
                  <p className="text-xs text-slate-300 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    {ver.summary}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ver.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ver.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
