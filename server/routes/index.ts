import { Express } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import { errorHandler, notFoundHandler } from '../middleware/error.middleware';
import userRoutes from './user.routes';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Register routes
  app.use('/api/users', userRoutes);
  
  // Add more route registrations here
  // app.use('/api/projects', projectRoutes);
  // app.use('/api/communications', communicationRoutes);
  // app.use('/api/commands', commandRoutes);
  // app.use('/api/weather', weatherRoutes);

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle WebSocket messages
        console.log('Received:', data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return httpServer;
} 