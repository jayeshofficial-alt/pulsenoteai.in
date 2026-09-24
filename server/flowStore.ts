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
      name: 'Autonomous Vision & Neural Launch',
      description: 'Multi-modal workspace exploring Imagen 3 generative pipelines and Deep Research',
      createdAt: Date.now() - 3600000 * 24,
      updatedAt: Date.now(),
      ownerId: 'usr_lead_arch',
      ownerName: 'Lead Architect',
      viewport: { x: 100, y: 100, zoom: 0.9 },
      collaborators: [
        {
          id: 'collab_1',
          name: 'Sarah Chen (Research)',
          email: 'sarah.chen@pulsenoteai.in',
          color: '#3b82f6',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80',
          x: 450,
          y: 280,
          lastSeen: Date.now(),
        },
        {
          id: 'collab_2',
          name: 'Alex Rivera (Creative)',
          email: 'alex.rivera@pulsenoteai.in',
          color: '#a855f7',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
          x: 950,
          y: 420,
          lastSeen: Date.now(),
        },
      ],
      nodes: [
        {
          id: 'node_res_1',
          type: 'research',
          title: 'Deep Research: Autonomous Drone Swarm Architecture',
          prompt: 'Synthesize system architecture and real-time vision telemetry for autonomous drone swarms',
          x: 120,
          y: 120,
          width: 480,
          height: 480,
          status: 'completed',
          ownerName: 'Sarah Chen',
          ownerEmail: 'sarah.chen@pulsenoteai.in',
          createdAt: Date.now() - 3600000 * 5,
          updatedAt: Date.now() - 3600000 * 4,
          colorAccent: '#0ea5e9',
          tags: ['Gemini 1.5 Pro', 'Deep Research', 'Robotics'],
          report: {
            id: 'rep_seed_1',
            timestamp: Date.now() - 3600000 * 5,
            industry: 'software',
            rawInput: 'Synthesize system architecture and real-time vision telemetry for autonomous drone swarms',
            responseMode: 'research',
            title: 'Autonomous Drone Swarm Telemetry & Edge Vision Mesh',
            executiveSummary: 'High-throughput edge computing mesh enabling real-time neural vision and decentralized collision avoidance for drone swarms.',
            markdownReport: `### Executive Architecture Synthesis
The autonomous drone mesh utilizes **Gemini Edge Vision** for decentralized spatial reasoning and LiDAR sensor fusion.

#### Key System Pillars:
1. **Ultra-Low Latency Telemetry:** Sub-12ms inter-node synchronization over 5G mesh arrays.
2. **On-Device Optical Odometry:** Visual SLAM running at 120 FPS on custom tensor coprocessors.
3. **Decentralized Swarm Consensus:** Zero single-point-of-failure routing.`,
            sections: [
              {
                heading: 'Optical Odometry & Neural Vision',
                content: 'Edge accelerators process dual stereoscopic 4K sensor feeds to compute localized point clouds.',
              },
              {
                heading: 'Swarm Communication Matrix',
                content: 'Adaptive peer-to-peer RF mesh dynamically routes mission-critical telemetry.',
              },
            ],
            actionItems: [
              {
                task: 'Deploy FPGA neural acceleration firmware',
                priority: 'High',
                deadline: '4 days',
                owner: 'Hardware Lead',
              },
              {
                task: 'Calibrate optical flow stereoscopic baseline',
                priority: 'High',
                deadline: '2 days',
                owner: 'Vision Engineer',
              },
            ],
            detectedEntities: [
              { name: 'Gemini Edge', type: 'System' },
              { name: 'LiDAR SLAM', type: 'System' },
              { name: 'Point Clouds', type: 'Metric' },
              { name: 'RF Mesh', type: 'System' },
            ],
            keyTakeaways: ['Sub-12ms latency achieved', 'Zero single-point-of-failure'],
            complianceDisclaimer: '[Legal & Professional Notice]: Pulse Note AI is an assistive tool. All generated assets must be verified before professional use. Zero liability.',
          },
          versions: [
            {
              id: 'v_1',
              timestamp: Date.now() - 3600000 * 5,
              authorName: 'Sarah Chen',
              title: 'Initial Swarm Architecture Plan',
              summary: 'Initial draft of telemetry pipelines',
            },
          ],
          comments: [
            {
              id: 'com_1',
              authorName: 'Alex Rivera',
              authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
              text: 'The telemetry benchmarks look rock solid. Generating visual mockups next.',
              timestamp: Date.now() - 3600000 * 3,
            },
          ],
        },
        {
          id: 'node_img_1',
          type: 'image',
          title: 'Imagen 3: Cyberpunk Drone Swarm in Neon Megacity',
          prompt: 'A fleet of sleek autonomous futuristic quadcopters hovering over a glowing cybernetic megacity skyline at dusk, cinematic 8k, volumetric rays --ar 16:9',
          x: 680,
          y: 120,
          width: 440,
          height: 480,
          status: 'completed',
          ownerName: 'Alex Rivera',
          ownerEmail: 'alex.rivera@pulsenoteai.in',
          createdAt: Date.now() - 3600000 * 3,
          updatedAt: Date.now() - 3600000 * 2,
          colorAccent: '#a855f7',
          tags: ['Imagen 3', '8K Render', 'Concept Art'],
          imageParams: {
            prompt: 'A fleet of sleek autonomous futuristic quadcopters hovering over a glowing cybernetic megacity skyline at dusk, cinematic 8k',
            style: 'Photorealistic Hyper-Detailed 8K',
            aspectRatio: '16:9',
            composition: 'Cinematic wide-angle rule-of-thirds',
            lighting: 'Volumetric cyan and magenta neon fill',
            previewUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80',
          },
          versions: [
            {
              id: 'v_img_1',
              timestamp: Date.now() - 3600000 * 3,
              authorName: 'Alex Rivera',
              title: 'Initial Dusk Render',
              previewUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80',
            },
          ],
          comments: [],
        },
        {
          id: 'node_vid_1',
          type: 'video',
          title: 'Veo 2: Atmospheric Drone Flight Sequences',
          prompt: 'Cinematic FPV drone sweeping between futuristic skyscrapers through rain and fog at 60fps',
          x: 1200,
          y: 120,
          width: 460,
          height: 520,
          status: 'completed',
          ownerName: 'Lead Architect',
          ownerEmail: 'contact@pulsenoteai.in',
          createdAt: Date.now() - 3600000 * 2,
          updatedAt: Date.now() - 3600000 * 1,
          colorAccent: '#ec4899',
          tags: ['Veo 2', 'Cinematic Motion', 'Storyboard'],
          videoParams: {
            title: 'Veo 2: Atmospheric Drone Flight Sequences',
            targetDuration: '12s',
            aspectRatio: '16:9',
            cameraMotion: 'Dynamic 360 orbit with high-speed dive',
            visualStyle: 'Photorealistic 8K Blade Runner cyberpunk atmosphere',
            lighting: 'Volumetric neon atmospheric glow',
            audioPrompt: 'Synthesized cybernetic ambient engine hum',
            modelPromptVeoSora: 'Cinematic FPV drone sweeping between futuristic skyscrapers through rain and fog',
            scenes: [
              {
                shotNumber: 1,
                duration: '00:00 - 00:04',
                camera: 'Slow forward dolly',
                visualAction: 'High altitude establishing shot of cybernetic skyline.',
                audioSFX: 'Wind whistle and distant neon hum',
              },
              {
                shotNumber: 2,
                duration: '00:04 - 00:08',
                camera: 'High velocity tilt down',
                visualAction: 'Sudden descent through volumetric fog and rain.',
                audioSFX: 'High speed air drag and rain patter',
              },
              {
                shotNumber: 3,
                duration: '00:08 - 00:12',
                camera: 'Dynamic roll & pan',
                visualAction: 'Formation split and high-speed cornering.',
                audioSFX: 'Thruster roar and electronic lock-on beep',
              },
            ],
          },
          versions: [],
          comments: [],
        },
      ],
      connections: [
        {
          id: 'conn_1',
          fromNodeId: 'node_res_1',
          toNodeId: 'node_img_1',
          label: 'Visual Concept Synthesis',
          type: 'pipeline',
          color: '#38bdf8',
        },
        {
          id: 'conn_2',
          fromNodeId: 'node_img_1',
          toNodeId: 'node_vid_1',
          label: 'Veo Motion Generation',
          type: 'derivation',
          color: '#f472b6',
        },
      ],
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
