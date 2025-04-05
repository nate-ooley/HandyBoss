import express, { Express } from "express";
import { createServer, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { translateWithOpenAI } from "./openai";

// Simple debug version of routes for troubleshooting
// Handle chat messages
const handleChatMessage = async (ws: WebSocket, data: any) => {
  try {
    // Extract data from the message
    const messageText = data.text || '';
    const role = data.role || 'boss'; // 'boss' or 'worker'
    const sourceLanguage = data.language || (role === 'boss' ? 'en' : 'es'); 
    const targetLanguage = sourceLanguage === 'en' ? 'es' : 'en';
    
    console.log(`Processing message from ${role} in ${sourceLanguage}`);
    
    // Translate the message if needed
    let translatedText = '';
    if (role === 'boss' && sourceLanguage === 'en') {
      // Boss speaking English - translate to Spanish for worker
      translatedText = await translateWithOpenAI(messageText, 'es');
    } else if (role === 'worker' && sourceLanguage === 'es') {
      // Worker speaking Spanish - translate to English for boss
      translatedText = await translateWithOpenAI(messageText, 'en');
    } else {
      translatedText = messageText; // No translation needed
    }
    
    // Send response back to the client
    ws.send(JSON.stringify({
      type: 'chat-response',
      text: messageText,
      translatedText: translatedText,
      role: role,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      timestamp: new Date().toISOString(),
      // Include the requestId if it was provided in the original message
      ...(data.requestId ? { requestId: data.requestId } : {})
    }));
    
  } catch (error) {
    console.error('Error handling chat message:', error);
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Error processing chat message' 
    }));
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Ping the client every 30 seconds to keep the connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    // Send initial state
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to WebSocket server',
      timestamp: new Date().toISOString()
    }));

    // Handle WebSocket messages
    ws.on('message', async (message: string) => {
      try {
        console.log('Received message:', message.toString());
        const data = JSON.parse(message.toString());
        
        // Process different message types
        switch (data.type) {
          case 'chat-message':
            await handleChatMessage(ws, data);
            break;
          default:
            // Echo the message back to the client
            ws.send(JSON.stringify({
              type: 'echo',
              originalMessage: message.toString(),
              timestamp: new Date().toISOString()
            }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Error processing message' 
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(pingInterval);
    });
  });
  
  // Simple API Routes
  app.get('/api/health', async (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  
  app.get('/api/user/current', async (req, res) => {
    try {
      const user = await storage.getUser(1); // Default user for now
      if (user) {
        // Don't send password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Add a translation endpoint
  app.post('/api/translate', async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        return res.status(400).json({ 
          message: 'Missing required fields: text and targetLanguage' 
        });
      }
      
      if (!['en', 'es'].includes(targetLanguage)) {
        return res.status(400).json({ 
          message: 'Invalid target language. Supported languages: en, es' 
        });
      }
      
      const translatedText = await translateWithOpenAI(text, targetLanguage as 'en' | 'es');
      
      res.json({
        original: text,
        translated: translatedText,
        targetLanguage
      });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ message: 'Error processing translation' });
    }
  });
  
  return httpServer;
}