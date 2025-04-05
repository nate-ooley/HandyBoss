import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertCommandSchema, insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket setup
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send initial message
    ws.send(JSON.stringify({ 
      type: 'connection-established', 
      message: 'Connected to Boss-Man server' 
    }));
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'command':
            handleCommand(ws, data);
            break;
          case 'chat-message':
            handleChatMessage(ws, data);
            break;
          default:
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Unknown message type' 
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
    });
  });
  
  // Broadcast to all connected clients
  const broadcast = (message: any) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };
  
  // Handle command messages
  const handleCommand = async (ws: WebSocket, data: any) => {
    try {
      // Store the command
      const command = await storage.createCommand({
        text: data.command,
        timestamp: data.timestamp,
        userId: 1, // Default user for now
        jobsiteId: data.jobsiteId
      });
      
      // Process the command
      let response = '';
      if (data.command.toLowerCase().includes('late')) {
        response = `I've notified the team that you'll be late. Your ETA has been updated.`;
        
        // Update jobsite status if it's mentioned
        const jobsites = await storage.getJobsites();
        for (const jobsite of jobsites) {
          if (data.command.toLowerCase().includes(jobsite.name.toLowerCase())) {
            await storage.updateJobsiteStatus(jobsite.id, `Delayed (from voice command)`);
            break;
          }
        }
      } else if (data.command.toLowerCase().includes('weather')) {
        response = `Weather update received. I've updated the jobsite status and notified the client.`;
      } else if (data.command.toLowerCase().includes('equipment') || data.command.toLowerCase().includes('material')) {
        response = `Supply request logged. The team has been notified about the needed resources.`;
      } else if (data.command.toLowerCase().includes('safety')) {
        response = `Safety issue reported. A supervisor has been notified to address this immediately.`;
      } else {
        response = `Command received: ${data.command}`;
      }
      
      // Send response back to the client
      ws.send(JSON.stringify({
        type: 'command-response',
        text: response,
        commandId: command.id,
        timestamp: new Date().toISOString()
      }));
      
      // Broadcast update to all clients
      broadcast({
        type: 'command-update',
        command: command,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error handling command:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Error processing command' 
      }));
    }
  };
  
  // Handle chat messages
  const handleChatMessage = async (ws: WebSocket, data: any) => {
    try {
      // Store the chat message
      const chatMessage = await storage.createChatMessage({
        text: data.text,
        isUser: true,
        timestamp: data.timestamp,
        userId: 1 // Default user for now
      });
      
      // Generate response based on the chat message
      let responseText = '';
      if (data.text.toLowerCase().includes('where') && data.text.toLowerCase().includes('mike')) {
        responseText = `Mike is currently at the Downtown Renovation site. He arrived 30 minutes ago and reported heavy rain conditions.`;
      } else if (data.text.toLowerCase().includes('weather')) {
        const weatherAlerts = await storage.getWeatherAlerts();
        if (weatherAlerts.length > 0) {
          responseText = `There is a ${weatherAlerts[0].title} for the ${weatherAlerts[0].location}. ${weatherAlerts[0].impact}`;
        } else {
          responseText = `There are no current weather alerts.`;
        }
      } else if (data.text.toLowerCase().includes('status') || data.text.toLowerCase().includes('update')) {
        responseText = `There are 3 active jobsites today. Westside Project is delayed by 20 minutes, Downtown Renovation has a weather alert, and Eastside Construction is on schedule.`;
      } else {
        responseText = `I'm sorry, I don't have information about that. Please try asking about jobsite status, weather conditions, or crew locations.`;
      }
      
      // Store the response
      const responseMessage = await storage.createChatMessage({
        text: responseText,
        isUser: false,
        timestamp: new Date().toISOString(),
        userId: 1 // Default user for now
      });
      
      // Send response back to the client
      ws.send(JSON.stringify({
        type: 'chat-response',
        text: responseText,
        messageId: responseMessage.id,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error handling chat message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Error processing chat message' 
      }));
    }
  };

  // API Routes
  app.get('/api/user/current', async (req, res) => {
    const user = await storage.getUser(1); // Default user for now
    if (user) {
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
  
  app.get('/api/jobsites', async (req, res) => {
    const jobsites = await storage.getJobsites();
    res.json(jobsites);
  });
  
  app.get('/api/jobsites/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid jobsite ID' });
    }
    
    const jobsite = await storage.getJobsite(id);
    if (jobsite) {
      res.json(jobsite);
    } else {
      res.status(404).json({ message: 'Jobsite not found' });
    }
  });
  
  app.get('/api/weather-alerts', async (req, res) => {
    const weatherAlerts = await storage.getWeatherAlerts();
    res.json(weatherAlerts);
  });
  
  app.get('/api/commands/recent', async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const commands = await storage.getRecentCommands(limit);
    res.json(commands);
  });
  
  app.get('/api/chat-messages', async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const messages = await storage.getChatMessages(limit);
    res.json(messages);
  });
  
  return httpServer;
}
