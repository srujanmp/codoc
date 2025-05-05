import { WebSocket, WebSocketServer } from 'ws';
import { parse } from 'url';
import type { Server } from 'http';

interface WSConnection extends WebSocket {
  userId: string;
  documentId: string;
}

interface DocumentConnections {
  [documentId: string]: WSConnection[];
}

const documents: DocumentConnections = {};

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req) => {
    const { query } = parse(req.url ?? '', true);
    const documentId = query.documentId as string;
    const userId = query.userId as string;

    if (!documentId || !userId) {
      ws.close();
      return;
    }

    // Extend WebSocket with custom properties
    const connection = ws as WSConnection;
    connection.userId = userId;
    connection.documentId = documentId;

    // Add new connection
    if (!documents[documentId]) {
      documents[documentId] = [];
    }
    documents[documentId].push(connection);

    // Broadcast active users count
    broadcastToDocument(documentId, {
      type: 'activeUsers',
      count: documents[documentId].length,
    });

    // Handle messages
    connection.addEventListener('message', (event) => {
      const data = JSON.parse(event.data.toString());
      if (data.type === 'content') {
        broadcastToDocument(documentId, data, userId);
      }
    });

    // Handle disconnection
    connection.addEventListener('close', () => {
      // Remove connection
      if (documents[documentId]) {
        documents[documentId] = documents[documentId].filter(
          (conn) => conn.userId !== userId
        );

        // Update active users count
        broadcastToDocument(documentId, {
          type: 'activeUsers',
          count: documents[documentId].length,
        });

        // Clean up empty document rooms
        if (documents[documentId].length === 0) {
          delete documents[documentId];
        }
      }
    });
  });
}

function broadcastToDocument(documentId: string, data: any, excludeUserId?: string) {
  documents[documentId]?.forEach((connection) => {
    if (connection.userId !== excludeUserId) {
      connection.send(JSON.stringify(data));
    }
  });
}
