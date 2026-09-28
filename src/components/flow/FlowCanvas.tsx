import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  Maximize, 
  RotateCcw, 
  Grid, 
  Eye, 
  Navigation,
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  FlowProject, 
  FlowNode, 
  FlowConnection, 
  FlowCollaborator, 
  FlowNodeVersion,
  FlowNodeType
} from '../../types';
import { FlowNodeCard } from './FlowNodeCard';

interface FlowCanvasProps {
  project: FlowProject;
  collaborators: FlowCollaborator[];
  onUpdateNodePos: (nodeId: string, x: number, y: number) => void;
  onSelectNode: (nodeId: string | null) => void;
  selectedNodeId: string | null;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onCreateConnection: (fromId: string, toId: string) => void;
  onDeleteConnection: (connId: string) => void;
  onOpenVersions: (node: FlowNode) => void;
  onOpenComments: (node: FlowNode) => void;
  onCursorMove: (x: number, y: number) => void;
  onAnimateImage?: (imageUrl: string, title: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  project,
  collaborators,
  onUpdateNodePos,
  onSelectNode,
  selectedNodeId,
  onDeleteNode,
  onDuplicateNode,
  onCreateConnection,
  onDeleteConnection,
  onOpenVersions,
  onOpenComments,
  onCursorMove,
  onAnimateImage,
  onShowToast,
}) => {
  // Viewport camera state (pan X, pan Y, zoom)
  const [viewport, setViewport] = useState(project.viewport || { x: 80, y: 80, zoom: 0.85 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging node state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connecting line state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert screen coordinates to canvas world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const relX = screenX - rect.left;
      const relY = screenY - rect.top;
      return {
        x: (relX - viewport.x) / viewport.zoom,
        y: (relY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Handle Mouse Wheel: Smooth Vertical/Horizontal Scroll & Ctrl-Key Zoom
  const handleWheel = (e: React.WheelEvent) => {
    // If Ctrl / Meta is pressed (or pinch gesture), perform zooming
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.25), 2.5);

      const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const mouseScreenX = e.clientX - rect.left;
      const mouseScreenY = e.clientY - rect.top;

      // Zoom towards mouse cursor point
      const newX = mouseScreenX - (mouseScreenX - viewport.x) * (newZoom / viewport.zoom);
      const newY = mouseScreenY - (mouseScreenY - viewport.y) * (newZoom / viewport.zoom);

      setViewport({ x: newX, y: newY, zoom: newZoom });
      return;
    }

    // Otherwise, perform standard smooth vertical and horizontal panning/scrolling
    setViewport((prev) => ({
      ...prev,
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
    }));
  };

  // Canvas Pan Start
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      onSelectNode(null);
      if (connectingSourceId) {
        setConnectingSourceId(null);
      }
    }
  };

  // Node Move Start
  const handleNodeMoveStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = project.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const world = screenToWorld(e.clientX, e.clientY);
    setDraggedNodeId(nodeId);
    setDragOffset({
      x: world.x - node.x,
      y: world.y - node.y,
    });
    onSelectNode(nodeId);
  };

  // Mouse Move on Canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    setMousePos(world);
    onCursorMove(world.x, world.y);

    if (isPanning) {
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else if (draggedNodeId) {
      const node = project.nodes.find((n) => n.id === draggedNodeId);
      if (node) {
        const newX = Math.round(world.x - dragOffset.x);
        const newY = Math.round(world.y - dragOffset.y);
        onUpdateNodePos(draggedNodeId, newX, newY);
      }
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Start Connection from output port
  const handleStartConnect = (nodeId: string) => {
    setConnectingSourceId(nodeId);
    onShowToast?.('info', 'Click on an input port (left circle) of another card to link them');
  };

  // End Connection on input port
  const handleEndConnect = (targetNodeId: string) => {
    if (connectingSourceId && connectingSourceId !== targetNodeId) {
      onCreateConnection(connectingSourceId, targetNodeId);
      onShowToast?.('success', 'Connected flow nodes with relationship vector');
    }
    setConnectingSourceId(null);
  };

  // Canvas Zoom Controls
  const zoomIn = () => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.2, 2.5) }));
  const zoomOut = () => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom * 0.8, 0.25) }));
  const resetView = () => setViewport({ x: 80, y: 80, zoom: 0.85 });
  const fitView = () => {
    if (project.nodes.length === 0) return resetView();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    project.nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 460));
      maxY = Math.max(maxY, n.y + (n.height || 480));
    });
    const padding = 120;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const zoom = Math.min(screenW / width, screenH / height, 1.2);
    setViewport({
      x: (screenW - width * zoom) / 2 - minX * zoom + padding * zoom,
      y: (screenH - height * zoom) / 2 - minY * zoom + padding * zoom,
      zoom: Math.max(zoom, 0.3),
    });
  };

  // Compute Bezier Curve for Node Connections
  const computeBezierPath = (fromNode: FlowNode, toNode: FlowNode) => {
    const fromWidth = fromNode.width || 460;
    const fromHeight = fromNode.height || 480;
    const toHeight = toNode.height || 480;

    const startX = fromNode.x + fromWidth;
    const startY = fromNode.y + fromHeight / 2;
    const endX = toNode.x;
    const endY = toNode.y + toHeight / 2;

    const dx = Math.abs(endX - startX) * 0.5;
    return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
  };

  const connectingSourceNode = connectingSourceId
    ? project.nodes.find((n) => n.id === connectingSourceId)
    : null;

  return (
    <div
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-screen overflow-hidden bg-slate-950 select-none cursor-grab ${
        isPanning ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Infinite Dot Grid Canvas Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.4) 1px, transparent 0)`,
          backgroundSize: `${32 * viewport.zoom}px ${32 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* Transform Container for Canvas Elements */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          inset: 0,
        }}
      >
        {/* SVG Layer for Flow Relationship Connectors */}
        <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ width: '1px', height: '1px' }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" />
            </marker>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Active Existing Connections */}
          {project.connections.map((conn) => {
            const fromNode = project.nodes.find((n) => n.id === conn.fromNodeId);
            const toNode = project.nodes.find((n) => n.id === conn.toNodeId);
            if (!fromNode || !toNode) return null;

            const pathStr = computeBezierPath(fromNode, toNode);
            const midX = (fromNode.x + (fromNode.width || 460) + toNode.x) / 2;
            const midY = (fromNode.y + (fromNode.height || 480) / 2 + toNode.y + (toNode.height || 480) / 2) / 2;

            return (
              <g key={conn.id} className="group/conn pointer-events-auto cursor-pointer">
                {/* Glow & Path */}
                <path
                  d={pathStr}
                  fill="none"
                  stroke={conn.color || 'url(#flowGrad)'}
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  className="transition-all hover:stroke-width-6 hover:stroke-indigo-300"
                  markerEnd="url(#arrowhead)"
                />

                {/* Connection Label Pill */}
                {conn.label && (
                  <foreignObject
                    x={midX - 70}
                    y={midY - 14}
                    width="140"
                    height="28"
                    className="overflow-visible"
                  >
                    <div className="flex items-center justify-center gap-1 bg-slate-900/90 border border-slate-700 text-slate-300 rounded-full px-2 py-0.5 text-[10px] font-mono shadow-md">
                      <span className="truncate">{conn.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConnection(conn.id);
                        }}
                        className="text-slate-400 hover:text-red-400 ml-1"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Temporary Connecting Line (when dragging out of a node port) */}
          {connectingSourceNode && (
            <path
              d={`M ${connectingSourceNode.x + (connectingSourceNode.width || 460)} ${
                connectingSourceNode.y + (connectingSourceNode.height || 480) / 2
              } C ${connectingSourceNode.x + (connectingSourceNode.width || 460) + 120} ${
                connectingSourceNode.y + (connectingSourceNode.height || 480) / 2
              }, ${mousePos.x - 120} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
              fill="none"
              stroke="#a855f7"
              strokeWidth="3"
              strokeDasharray="4 4"
              className="animate-pulse"
              markerEnd="url(#arrowhead)"
            />
          )}
        </svg>

        {/* Node Cards Layer */}
        {project.nodes.map((node) => (
          <FlowNodeCard
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isConnectingSource={connectingSourceId === node.id}
            onSelect={onSelectNode}
            onMoveStart={handleNodeMoveStart}
            onStartConnect={handleStartConnect}
            onEndConnect={handleEndConnect}
            onDelete={onDeleteNode}
            onDuplicate={onDuplicateNode}
            onOpenVersions={onOpenVersions}
            onOpenComments={onOpenComments}
            onAnimateImage={onAnimateImage}
            onShowToast={onShowToast}
          />
        ))}

        {/* Real-Time Collaborator Cursors */}
        {collaborators.map((collab, idx) => {
          if (typeof collab.x !== 'number' || typeof collab.y !== 'number') return null;
          return (
            <div
              key={`canvas-cursor-${collab.id || 'anon'}-${idx}`}
              style={{
                transform: `translate3d(${collab.x}px, ${collab.y}px, 0)`,
                position: 'absolute',
                pointerEvents: 'none',
                transition: 'transform 0.08s ease-out',
                zIndex: 45,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={collab.color || '#6366f1'}>
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" />
              </svg>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg whitespace-nowrap ml-3 -mt-2 inline-block"
                style={{ backgroundColor: collab.color || '#6366f1' }}
              >
                {collab.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Camera Controls (Bottom-Left) */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl">
        <button
          onClick={zoomIn}
          title="Zoom in (+)"
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-bold text-slate-300 px-1 min-w-[42px] text-center">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={zoomOut}
          title="Zoom out (-)"
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-0.5" />
        <button
          onClick={fitView}
          title="Fit view to all nodes"
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset origin (100%)"
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Minimap (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block w-44 h-32 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl p-2 overflow-hidden pointer-events-none">
        <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden">
          {project.nodes.map((n) => (
            <div
              key={n.id}
              className="absolute rounded bg-indigo-500/60 border border-indigo-400"
              style={{
                left: `${(n.x / 4000) * 100 + 40}%`,
                top: `${(n.y / 4000) * 100 + 40}%`,
                width: '12px',
                height: '10px',
              }}
            />
          ))}
          {/* Camera viewport indicator box */}
          <div
            className="absolute border border-indigo-400/80 bg-indigo-500/10 rounded pointer-events-none"
            style={{
              left: `${(-viewport.x / 4000) * 100 + 30}%`,
              top: `${(-viewport.y / 4000) * 100 + 30}%`,
              width: '35%',
              height: '35%',
            }}
          />
        </div>
      </div>
    </div>
  );
};
