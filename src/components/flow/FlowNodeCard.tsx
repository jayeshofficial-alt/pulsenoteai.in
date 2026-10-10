import React, { useState } from 'react';
import { 
  Search, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Code as CodeIcon, 
  FileText, 
  Music, 
  Sparkles,
  ExternalLink,
  Download,
  Link as LinkIcon,
  MessageSquare,
  History,
  MoreVertical,
  Trash2,
  Copy,
  Maximize2,
  Minimize2,
  Check,
  ChevronRight,
  ShieldCheck,
  Play,
  RotateCcw,
  Plus,
  Paperclip,
  Film,
  FileCode,
  Eye
} from 'lucide-react';
import { FlowNode, FlowNodeType, FlowNodeVersion, FlowNodeComment } from '../../types';
import { MediaExportDropdown } from '../MediaExportDropdown';
import { ImageResultsGrid } from '../ImageResultsGrid';

interface FlowNodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  isConnectingSource: boolean;
  onSelect: (nodeId: string) => void;
  onMoveStart: (e: React.MouseEvent, nodeId: string) => void;
  onStartConnect: (nodeId: string) => void;
  onEndConnect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onOpenVersions: (node: FlowNode) => void;
  onOpenComments: (node: FlowNode) => void;
  onAnimateImage?: (imageUrl: string, title: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

const TYPE_CONFIG: Record<FlowNodeType, { label: string; icon: any; color: string; bgBadge: string; border: string; glow: string }> = {
  research: {
    label: 'Deep Research • Gemini 3.1 Pro',
    icon: Search,
    color: 'text-cyan-400',
    bgBadge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    border: 'border-cyan-500/40 hover:border-cyan-400',
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.15)]',
  },
  image: {
    label: 'Imagen 3 / Flash Image • 8K Render',
    icon: ImageIcon,
    color: 'text-purple-400',
    bgBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    border: 'border-purple-500/40 hover:border-purple-400',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.15)]',
  },
  video: {
    label: 'Veo 3.1 Cinema • Storyboard',
    icon: VideoIcon,
    color: 'text-pink-400',
    bgBadge: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    border: 'border-pink-500/40 hover:border-pink-400',
    glow: 'shadow-[0_0_25px_rgba(236,72,153,0.15)]',
  },
  code: {
    label: 'Logic & Code Canvas • Gemini 3.1 Pro',
    icon: CodeIcon,
    color: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.15)]',
  },
  document: {
    label: 'Document Intelligence',
    icon: FileText,
    color: 'text-blue-400',
    bgBadge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    border: 'border-blue-500/40 hover:border-blue-400',
    glow: 'shadow-[0_0_25px_rgba(59,130,246,0.15)]',
  },
  audio: {
    label: 'Audio Synthesizer',
    icon: Music,
    color: 'text-amber-400',
    bgBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/40 hover:border-amber-400',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)]',
  },
  prompt: {
    label: 'Prompt Input Node',
    icon: Sparkles,
    color: 'text-indigo-400',
    bgBadge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    border: 'border-indigo-500/40 hover:border-indigo-400',
    glow: 'shadow-[0_0_25px_rgba(99,102,241,0.15)]',
  },
};

export const FlowNodeCard: React.FC<FlowNodeCardProps> = ({
  node,
  isSelected,
  isConnectingSource,
  onSelect,
  onMoveStart,
  onStartConnect,
  onEndConnect,
  onDelete,
  onDuplicate,
  onOpenVersions,
  onOpenComments,
  onAnimateImage,
  onShowToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.research;
  const TypeIcon = config.icon;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    onShowToast?.('success', 'Content copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const cardWidth = isExpanded ? 760 : (node.width || 460);

  return (
    <div
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        width: `${cardWidth}px`,
        position: 'absolute',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={`group select-none rounded-2xl bg-slate-900/95 backdrop-blur-xl border transition-all duration-200 shadow-2xl ${
        isSelected
          ? `ring-2 ring-indigo-500/80 ${config.border} ${config.glow} z-30`
          : `border-slate-800/90 hover:border-slate-700 z-10`
      } ${isConnectingSource ? 'ring-2 ring-emerald-500 animate-pulse' : ''}`}
    >
      {/* Input Connection Port (Left) */}
      <div
        title="Connect input flow (Drop target)"
        onClick={(e) => {
          e.stopPropagation();
          onEndConnect(node.id);
        }}
        className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-700 hover:border-emerald-400 hover:bg-emerald-950/80 flex items-center justify-center cursor-pointer transition-all hover:scale-125 z-40 shadow-lg group/in"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-slate-400 group-hover/in:bg-emerald-400 transition-colors" />
      </div>

      {/* Output Connection Port (Right) */}
      <div
        title="Drag or click to connect to next node"
        onClick={(e) => {
          e.stopPropagation();
          onStartConnect(node.id);
        }}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-700 hover:border-indigo-400 hover:bg-indigo-950/80 flex items-center justify-center cursor-pointer transition-all hover:scale-125 z-40 shadow-lg group/out"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 group-hover/out:bg-indigo-300 transition-colors" />
      </div>

      {/* Card Draggable Header */}
      <div
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('button, input, a, select')) return;
          onMoveStart(e, node.id);
        }}
        className="p-3.5 rounded-t-2xl bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${config.bgBadge} shrink-0 shadow-sm`}>
            <TypeIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${config.bgBadge}`}>
                {config.label}
              </span>
              {node.status === 'generating' && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Generating...
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-100 truncate mt-0.5">
              {node.title}
            </h4>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Version History Button */}
          <button
            title="Version History & Snapshots"
            onClick={(e) => {
              e.stopPropagation();
              onOpenVersions(node);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs flex items-center gap-1 font-mono"
          >
            <History className="w-3.5 h-3.5" />
            <span className="text-[10px]">{node.versions?.length || 1}</span>
          </button>

          {/* Comments Button */}
          <button
            title="Collaborator Comments"
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(node);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs flex items-center gap-1 font-mono"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[10px]">{node.comments?.length || 0}</span>
          </button>

          {/* Expand/Collapse */}
          <button
            title={isExpanded ? 'Collapse card' : 'Expand card'}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Duplicate */}
          <button
            title="Duplicate node"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(node.id);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            title="Delete node from canvas"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Source Prompt Banner */}
      <div className="px-3.5 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-start gap-2 text-[11px] text-slate-400 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
        <span className="line-clamp-2 italic text-slate-300">
          "{node.prompt}"
        </span>
      </div>

      {/* Card Main Body Content */}
      <div 
        onWheel={(e) => e.stopPropagation()}
        className="p-3.5 space-y-3 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700"
      >
        {/* Attached Reference File Banner / Preview */}
        {node.attachment && (
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Paperclip className="w-3 h-3 text-indigo-400" />
                Attached Reference Asset
              </span>
              <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                {node.attachment.category} • {(node.attachment.size / 1024).toFixed(1)} KB
              </span>
            </div>

            {node.attachment.category === 'image' && node.attachment.previewUrl && (
              <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-48 bg-black/50 group/att">
                <img
                  src={node.attachment.previewUrl}
                  alt={node.attachment.name}
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <a
                    href={node.attachment.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium shadow-lg"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Full Image</span>
                  </a>
                </div>
              </div>
            )}

            {node.attachment.category === 'video' && node.attachment.previewUrl && (
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-black/50">
                <video
                  src={node.attachment.previewUrl}
                  controls
                  className="w-full max-h-48 object-contain"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800">
              <span className="truncate max-w-[280px] font-medium">{node.attachment.name}</span>
              {node.attachment.previewUrl && (
                <a
                  href={node.attachment.previewUrl}
                  download={node.attachment.name}
                  className="text-indigo-400 hover:text-indigo-300 p-1 flex items-center gap-1 text-[10px]"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* 1. Research Type Node */}
        {node.type === 'research' && node.report && (
          <div className="space-y-2.5 text-xs text-slate-300">
            {node.report.executiveSummary && (
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-[11px] leading-relaxed">
                <span className="font-bold text-cyan-400 uppercase tracking-wider block text-[10px] mb-1">
                  Executive Synthesis:
                </span>
                {node.report.executiveSummary}
              </div>
            )}

            {node.report.sections && node.report.sections.length > 0 && (
              <div className="space-y-1.5">
                {node.report.sections.slice(0, isExpanded ? 10 : 2).map((sec, sIdx) => (
                  <div key={sIdx} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <h5 className="font-semibold text-slate-200 text-[11px] mb-1">{sec.heading}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-3">{sec.content}</p>
                  </div>
                ))}
              </div>
            )}

            {node.report.actionItems && node.report.actionItems.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Action Roadmap ({node.report.actionItems.length}):
                </span>
                <div className="space-y-1">
                  {node.report.actionItems.slice(0, 3).map((act, aIdx) => (
                    <div key={aIdx} className="flex items-center justify-between text-[10px] text-slate-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {act.task}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400 shrink-0 ml-2">{act.deadline || 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Image Type Node (Imagen 3 / Live Results) */}
        {node.type === 'image' && (
          <div className="space-y-2.5">
            {node.imageResults && node.imageResults.length > 0 ? (
              <ImageResultsGrid
                results={node.imageResults}
                queryTitle={node.imageParams?.prompt || node.prompt}
                onShowToast={onShowToast}
              />
            ) : node.imageParams?.previewUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-purple-900/60 shadow-lg group/img">
                <img
                  src={node.imageParams.previewUrl}
                  alt={node.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity p-2.5 flex items-end justify-between">
                  <span className="text-[10px] font-mono text-purple-300 bg-slate-900/80 px-2 py-0.5 rounded border border-purple-500/40">
                    {node.imageParams.aspectRatio || '16:9'} • 8K Master
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
                No visual preview available
              </div>
            )}

            {/* Prompt & Style Metadata and Animate Button */}
            {node.imageParams && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span>Style: {node.imageParams.style || 'Photorealistic 8K'}</span>
                  <span>AR: {node.imageParams.aspectRatio || '16:9'}</span>
                </div>

                {node.imageParams.previewUrl && onAnimateImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnimateImage(node.imageParams!.previewUrl!, `Animate "${node.title}" with cinematic camera pan and dynamic lighting`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-300 hover:text-pink-200 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-pink-500/10"
                  >
                    <Film className="w-3.5 h-3.5 text-pink-400" />
                    <span>Animate into Video (Veo 3.1)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Video Type Node (Veo 3.1 Cinematic Sequence & Audio) */}
        {node.type === 'video' && node.videoParams && (
          <div className="space-y-2.5">
            {/* Visual Video Player / Poster */}
            {node.videoParams.videoUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-pink-900/60 shadow-lg">
                <video
                  src={node.videoParams.videoUrl}
                  controls
                  poster={node.videoParams.previewPosterUrl}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : node.videoParams.previewPosterUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-pink-900/60 shadow-lg group/vid">
                <img
                  src={node.videoParams.previewPosterUrl}
                  alt={node.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-pink-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-xl">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-pink-300 bg-slate-900/80 px-2 py-0.5 rounded border border-pink-500/40">
                  <span>Veo 3.1 720p / 1080p</span>
                  <span>{node.videoParams.aspectRatio || '16:9'} • {node.videoParams.targetDuration || '00:08'}</span>
                </div>
              </div>
            ) : null}

            {/* Embedded Audio Track Pill */}
            {(node.videoParams.audioTrackUrl || node.videoParams.audioPrompt) && (
              <div className="p-2 rounded-xl bg-slate-950/80 border border-pink-500/30 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-pink-300">
                  <Music className="w-3.5 h-3.5 text-pink-400" />
                  <span className="truncate max-w-[240px]">
                    {node.videoParams.audioPrompt || 'Synthesized Soundtrack & Voiceover'}
                  </span>
                </div>
                {node.videoParams.audioTrackUrl && (
                  <audio src={node.videoParams.audioTrackUrl} controls className="h-6 w-28" />
                )}
              </div>
            )}

            {/* Storyboard Scenes Grid */}
            {node.videoParams.scenes && node.videoParams.scenes.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-pink-300 font-mono">
                  <span>Veo 3.1 Storyboard Sequence</span>
                  <span>{node.videoParams.targetDuration || '12s'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {node.videoParams.scenes.map((scene, scIdx) => (
                    <div key={scIdx} className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span className="text-pink-400 font-bold">Shot #{scene.shotNumber || scIdx + 1}</span>
                        <span>{scene.duration}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 line-clamp-2">{scene.visualAction}</p>
                      <div className="text-[9px] font-mono text-slate-500 truncate">
                        Camera: {scene.camera}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Code Type Node */}
        {node.type === 'code' && node.codeSnippet && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 py-1 bg-slate-950 rounded-t-lg border border-slate-800 text-[10px] font-mono text-slate-400">
              <span>{node.codeSnippet.language || 'typescript'}</span>
              <button
                onClick={() => handleCopy(node.codeSnippet?.code || '')}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-b-lg border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
              <code>{node.codeSnippet.code}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Card Footer Toolbar & Multi-Format Exports */}
      <div className="p-3 bg-slate-950 rounded-b-2xl border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-[9px] text-indigo-300 font-bold">
            {node.ownerName?.charAt(0) || 'U'}
          </div>
          <span className="truncate max-w-[120px]">{node.ownerName || 'Lead Architect'}</span>
        </div>

        {/* Node Export Suite */}
        <div className="flex items-center gap-1.5">
          <MediaExportDropdown
            mediaType={node.type === 'video' ? 'video' : 'image'}
            mediaUrl={node.type === 'video' ? (node.videoParams?.videoUrl || node.videoParams?.previewPosterUrl || '') : (node.imageParams?.previewUrl || '')}
            title={node.title}
            aspectRatio={(node.type === 'video' ? node.videoParams?.aspectRatio : node.imageParams?.aspectRatio) || '16:9'}
            onShowToast={onShowToast}
          />
        </div>
      </div>

      {/* Mandatory Legal & Professional Notice */}
      <div className="px-3 py-1 bg-slate-950/90 rounded-b-2xl border-t border-slate-900 flex items-center gap-1 text-[8.5px] font-mono text-slate-500">
        <ShieldCheck className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        <span className="truncate">Assistive tool. Verify before professional use. Zero liability.</span>
      </div>
    </div>
  );
};
