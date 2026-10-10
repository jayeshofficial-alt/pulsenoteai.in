// Google Flow Canvas Engine - Server Store & Real-time State Manager
import { FlowProject, FlowNode, FlowConnection, FlowCollaborator, FlowNodeVersion, FlowNodeComment } from '../src/types/index.js';

class FlowStore {
  private projects: Map<string, FlowProject> = new Map();

  constructor() {
    this.seedDefaultProject();
  }

  private seedDefaultProject() {
    const defaultProject: FlowProject = {
      id: 'proj_flow_genesis',
      name: 'Pulse Note AI Workspace',
      description: 'Multi-modal workspace powered by Gemini 3.1 Pro, Imagen 3, and Veo 3.1',
      createdAt: Date.now() - 3600000 * 24,
      updatedAt: Date.now(),
      ownerId: 'usr_lead_arch',
      ownerName: 'Lead Architect',
      viewport: { x: 100, y: 100, zoom: 0.9 },
      collaborators: [],
      nodes: [],
      connections: [],
    };

    this.projects.set(defaultProject.id, defaultProject);
  }

  // Get all projects overview
  getAllProjects(): FlowProject[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Get single project by ID
  getProject(id: string): FlowProject | undefined {
    return this.projects.get(id);
  }

  // Create new project
  createProject(name: string, description?: string, ownerId: string = 'usr_guest', ownerName: string = 'Flow Creator'): FlowProject {
    const newProject: FlowProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || 'Untitled Flow Workspace',
      description: description?.trim() || 'Collaborative infinite canvas workspace',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId,
      ownerName,
      viewport: { x: 200, y: 200, zoom: 1.0 },
      collaborators: [
        {
          id: `collab_${Date.now()}`,
          name: ownerName,
          email: `${ownerId}@pulsenoteai.in`,
          color: '#6366f1',
          lastSeen: Date.now(),
        },
      ],
      nodes: [],
      connections: [],
    };

    this.projects.set(newProject.id, newProject);
    return newProject;
  }

  // Add node to project
  addNode(projectId: string, node: FlowNode): FlowNode | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;

    // Check if node already exists
    const existingIdx = proj.nodes.findIndex((n) => n.id === node.id);
    if (existingIdx >= 0) {
      proj.nodes[existingIdx] = { ...proj.nodes[existingIdx], ...node, updatedAt: Date.now() };
      proj.updatedAt = Date.now();
      return proj.nodes[existingIdx];
    }

    proj.nodes.push(node);
    proj.updatedAt = Date.now();
    return node;
  }

  // Update node
  updateNode(projectId: string, nodeId: string, changes: Partial<FlowNode>, createVersion: boolean = false): FlowNode | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;

    const node = proj.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    if (createVersion) {
      const version: FlowNodeVersion = {
        id: `ver_${Date.now()}`,
        timestamp: Date.now(),
        authorName: changes.ownerName || node.ownerName,
        title: node.title,
        prompt: node.prompt,
        summary: node.report?.executiveSummary,
        previewUrl: node.imageParams?.previewUrl,
      };
      node.versions = [version, ...(node.versions || [])].slice(0, 10);
    }

    Object.assign(node, changes);
    node.updatedAt = Date.now();
    proj.updatedAt = Date.now();
    return node;
  }

  // Move node
  moveNode(projectId: string, nodeId: string, x: number, y: number): boolean {
    const proj = this.projects.get(projectId);
    if (!proj) return false;

    const node = proj.nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    node.x = x;
    node.y = y;
    node.updatedAt = Date.now();
    return true;
  }

  // Delete node
  deleteNode(projectId: string, nodeId: string): boolean {
    const proj = this.projects.get(projectId);
    if (!proj) return false;

    proj.nodes = proj.nodes.filter((n) => n.id !== nodeId);
    // Also remove any connections tied to this node
    proj.connections = proj.connections.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId);
    proj.updatedAt = Date.now();
    return true;
  }

  // Add connection
  addConnection(projectId: string, conn: FlowConnection): FlowConnection | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;

    // Check duplicate
    const exists = proj.connections.some(
      (c) => c.fromNodeId === conn.fromNodeId && c.toNodeId === conn.toNodeId
    );
    if (exists) return null;

    proj.connections.push(conn);
    proj.updatedAt = Date.now();
    return conn;
  }

  // Delete connection
  deleteConnection(projectId: string, connectionId: string): boolean {
    const proj = this.projects.get(projectId);
    if (!proj) return false;

    proj.connections = proj.connections.filter((c) => c.id !== connectionId);
    proj.updatedAt = Date.now();
    return true;
  }

  // Add comment to node
  addComment(projectId: string, nodeId: string, comment: FlowNodeComment): FlowNodeComment | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;

    const node = proj.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    node.comments = [...(node.comments || []), comment];
    node.updatedAt = Date.now();
    proj.updatedAt = Date.now();
    return comment;
  }

  // Update viewport
  updateViewport(projectId: string, viewport: { x: number; y: number; zoom: number }): boolean {
    const proj = this.projects.get(projectId);
    if (!proj) return false;

    proj.viewport = viewport;
    return true;
  }
}

export const flowStore = new FlowStore();
