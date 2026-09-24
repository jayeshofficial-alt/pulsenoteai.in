import React, { useState } from 'react';
import { MessageSquare, X, Send, User, Clock } from 'lucide-react';
import { FlowNode, FlowNodeComment } from '../../types';

interface FlowNodeCommentDrawerProps {
  node: FlowNode | null;
  onClose: () => void;
  onAddComment: (nodeId: string, text: string) => void;
  currentUser: { name: string; email: string };
}

export const FlowNodeCommentDrawer: React.FC<FlowNodeCommentDrawerProps> = ({
  node,
  onClose,
  onAddComment,
  currentUser,
}) => {
  const [commentText, setCommentText] = useState('');

  if (!node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(node.id, commentText.trim());
    setCommentText('');
  };

  const comments = node.comments || [];

  return (
    <div 
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Live Node Comments</h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">{node.title}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Comments Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>No comments on this node yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">Leave feedback or notes for your team in real-time.</p>
          </div>
        ) : (
          comments.map((com, idx) => (
            <div key={com.id || idx} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {com.authorName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-200">{com.authorName}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(com.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 pl-8 leading-relaxed">{com.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Type a comment..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
