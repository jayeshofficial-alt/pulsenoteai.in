// Google Flow Engine - Real-time WebSocket Broadcast Server
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { flowStore } from './flowStore.js';
import { FlowCollaborator } from '../src/types/index.js';

interface ClientConnection {
  ws: WebSocket;
  projectId: string;
  collaborator: FlowCollaborator;
}

export function initFlowWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/flow' });
  const clients = new Map<WebSocket, ClientConnection>();

  // Helper to broadcast to all clients in a specific project (optionally excluding sender)
  function broadcastToProject(projectId: string, message: any, excludeWs?: WebSocket) {
    const payload = JSON.stringify(message);
    clients.forEach((client, ws) => {
      if (client.projectId === projectId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          console.warn('[WS_BROADCAST_ERR]', e);
        }
      }
    });
  }

  wss.on('connection', (ws: WebSocket, req) => {
    // Parse projectId and userInfo from query string
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const projectId = url.searchParams.get('projectId') || 'proj_flow_genesis';
    const userName = url.searchParams.get('userName') || 'Collaborator';
    const userEmail = url.searchParams.get('userEmail') || 'user@pulsenoteai.in';
    const userColor = url.searchParams.get('userColor') || '#6366f1';
    const userId = url.searchParams.get('userId') || `usr_${Date.now()}`;

    const collaborator: FlowCollaborator = {
      id: userId,
      name: userName,
      email: userEmail,
      color: userColor,
      lastSeen: Date.now(),
      x: 0,
      y: 0,
    };

    clients.set(ws, { ws, projectId, collaborator });

    // Send initial project state
    const project = flowStore.getProject(projectId);
    if (project) {
      // Collect current active unique collaborators in this project
      const collaboratorMap = new Map<string, FlowCollaborator>();
      clients.forEach((c) => {
        if (c.projectId === projectId && c.collaborator?.id) {
          collaboratorMap.set(c.collaborator.id, c.collaborator);
        }
      });
      const activeCollaborators = Array.from(collaboratorMap.values());

      ws.send(
        JSON.stringify({
          type: 'init',
          project: {
            ...project,
            collaborators: activeCollaborators,
          },
        })
      );
    }

    // Broadcast user joined
    broadcastToProject(
      projectId,
      {
        type: 'user_joined',
        collaborator,
      },
      ws
    );

    ws.on('message', (rawMessage: string) => {
      try {
        const msg = JSON.parse(rawMessage.toString());
        const client = clients.get(ws);
        if (!client) return;

        switch (msg.type) {
          case 'cursor_move': {
            client.collaborator.x = msg.x;
            client.collaborator.y = msg.y;
            client.collaborator.activeNodeId = msg.activeNodeId;
            client.collaborator.lastSeen = Date.now();

            broadcastToProject(
              client.projectId,
              {
                type: 'cursor_update',
                userId: client.collaborator.id,
                x: msg.x,
                y: msg.y,
                activeNodeId: msg.activeNodeId,
              },
              ws
            );
            break;
          }

          case 'node_create': {
            if (msg.node) {
              const created = flowStore.addNode(client.projectId, msg.node);
              broadcastToProject(
                client.projectId,
                {
                  type: 'node_created',
                  node: created,
                },
                ws
              );
            }
            break;
          }

          case 'node_move': {
            if (msg.nodeId && typeof msg.x === 'number' && typeof msg.y === 'number') {
              flowStore.moveNode(client.projectId, msg.nodeId, msg.x, msg.y);
              broadcastToProject(
                client.projectId,
                {
                  type: 'node_moved',
                  nodeId: msg.nodeId,
                  x: msg.x,
                  y: msg.y,
                },
                ws
              );
            }
            break;
          }

          case 'node_update': {
            if (msg.nodeId && msg.changes) {
              const updated = flowStore.updateNode(
                client.projectId,
                msg.nodeId,
                msg.changes,
                msg.createVersion
              );
              broadcastToProject(
                client.projectId,
                {
                  type: 'node_updated',
                  nodeId: msg.nodeId,
                  node: updated,
                },
                ws
              );
            }
            break;
          }

          case 'node_delete': {
            if (msg.nodeId) {
              flowStore.deleteNode(client.projectId, msg.nodeId);
              broadcastToProject(
                client.projectId,
                {
                  type: 'node_deleted',
                  nodeId: msg.nodeId,
                },
                ws
              );
            }
            break;
          }

          case 'connection_create': {
            if (msg.connection) {
              const conn = flowStore.addConnection(client.projectId, msg.connection);
              if (conn) {
                broadcastToProject(
                  client.projectId,
                  {
                    type: 'connection_created',
                    connection: conn,
                  },
                  ws
                );
              }
            }
            break;
          }

          case 'connection_delete': {
            if (msg.connectionId) {
              flowStore.deleteConnection(client.projectId, msg.connectionId);
              broadcastToProject(
                client.projectId,
                {
                  type: 'connection_deleted',
                  connectionId: msg.connectionId,
                },
                ws
              );
            }
            break;
          }

          case 'comment_add': {
            if (msg.nodeId && msg.comment) {
              const added = flowStore.addComment(client.projectId, msg.nodeId, msg.comment);
              broadcastToProject(
                client.projectId,
                {
                  type: 'comment_added',
                  nodeId: msg.nodeId,
                  comment: added,
                },
                ws
              );
            }
            break;
          }

          case 'viewport_update': {
            if (msg.viewport) {
              flowStore.updateViewport(client.projectId, msg.viewport);
            }
            break;
          }
        }
      } catch (err: any) {
        console.warn('[WS_MSG_ERROR]', err?.message || err);
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        broadcastToProject(
          client.projectId,
          {
            type: 'user_left',
            userId: client.collaborator.id,
          },
          ws
        );
        clients.delete(ws);
      }
    });

    ws.on('error', (err) => {
      console.warn('[WS_SOCKET_ERR]', err);
    });
  });

  console.log('[FLOW_WS] WebSocket server initialized on /ws/flow');
  return wss;
}
