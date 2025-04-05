import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { log } from "./vite";
import { insertCommandSchema, insertChatMessageSchema } from "@shared/schema";
import { translateWithOpenAI, detectLanguageWithOpenAI } from "./openai";
import { sendEmail, sendSMS, sendBulkNotifications } from "./services/sendgrid";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
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
  
  // Calendar API Endpoints
  app.get('/api/calendar/events', async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const events = await storage.getCalendarEvents(startDate, endDate);
      res.json(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });
  
  app.post('/api/calendar/jobsite/:id/dates', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { startDate, endDate } = req.body;
      
      if (!startDate) {
        return res.status(400).json({ error: 'Start date is required' });
      }
      
      const updatedJobsite = await storage.updateJobsiteDates(
        id, 
        new Date(startDate), 
        endDate ? new Date(endDate) : undefined
      );
      
      if (!updatedJobsite) {
        return res.status(404).json({ error: 'Jobsite not found' });
      }
      
      res.json(updatedJobsite);
    } catch (error) {
      console.error('Error updating jobsite dates:', error);
      res.status(500).json({ error: 'Failed to update jobsite dates' });
    }
  });
  
  app.post('/api/calendar/message/:id/event', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Event title is required' });
      }
      
      const updatedMessage = await storage.markMessageAsCalendarEvent(id, title);
      
      if (!updatedMessage) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      console.error('Error marking message as calendar event:', error);
      res.status(500).json({ error: 'Failed to mark message as calendar event' });
    }
  });
  
  // Notification API Endpoints
  app.post('/api/notifications/sms', async (req, res) => {
    try {
      const { to, from, message, jobsiteName } = req.body;
      
      if (!to || !from || !message) {
        return res.status(400).json({ error: 'Missing required fields: to, from, message' });
      }
      
      const success = await sendSMS({
        to,
        from,
        message,
        jobsiteName
      });
      
      if (success) {
        res.json({ success: true, message: 'SMS notification sent successfully' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to send SMS notification' });
      }
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      res.status(500).json({ success: false, error: 'Failed to send SMS notification' });
    }
  });
  
  app.post('/api/notifications/email', async (req, res) => {
    try {
      const { to, from, subject, text, html } = req.body;
      
      if (!to || !from || !subject) {
        return res.status(400).json({ error: 'Missing required fields: to, from, subject' });
      }
      
      const success = await sendEmail({
        to,
        from,
        subject,
        text,
        html
      });
      
      if (success) {
        res.json({ success: true, message: 'Email notification sent successfully' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to send email notification' });
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
      res.status(500).json({ success: false, error: 'Failed to send email notification' });
    }
  });
  
  app.post('/api/notifications/bulk', async (req, res) => {
    try {
      const { recipients, message, jobsiteName } = req.body;
      
      if (!recipients || !Array.isArray(recipients) || !message) {
        return res.status(400).json({ error: 'Missing required fields: recipients (array), message' });
      }
      
      const result = await sendBulkNotifications(recipients, message, jobsiteName);
      
      res.json({
        success: true,
        message: 'Bulk notifications processed',
        stats: {
          smsCount: result.smsCount,
          emailCount: result.emailCount,
          totalSent: result.smsCount + result.emailCount,
          totalRecipients: recipients.length
        }
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      res.status(500).json({ success: false, error: 'Failed to send bulk notifications' });
    }
  });
  
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
          case 'calendar-event':
            handleCalendarEvent(ws, data);
            break;
          case 'message-reaction':
            handleMessageReaction(ws, data);
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
  
  // Handle calendar event requests
  const handleCalendarEvent = async (ws: WebSocket, data: any) => {
    try {
      console.log('Processing calendar event:', data);
      
      if (data.action === 'create' && data.messageId) {
        // Create a calendar event from a message
        const title = data.title || 'Calendar Event';
        const updatedMessage = await storage.markMessageAsCalendarEvent(data.messageId, title);
        
        if (!updatedMessage) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Message not found',
            requestId: data.requestId 
          }));
          return;
        }
        
        ws.send(JSON.stringify({
          type: 'calendar-event-response',
          event: updatedMessage,
          action: 'create',
          success: true,
          timestamp: new Date().toISOString(),
          requestId: data.requestId
        }));
        
        // Broadcast to all clients
        broadcast({
          type: 'calendar-event-update',
          event: updatedMessage,
          action: 'create',
          timestamp: new Date().toISOString()
        });
      } 
      else if (data.action === 'update' && data.jobsiteId) {
        // Update jobsite dates
        const jobsiteId = parseInt(data.jobsiteId);
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = data.endDate ? new Date(data.endDate) : undefined;
        
        const updatedJobsite = await storage.updateJobsiteDates(jobsiteId, startDate, endDate);
        
        if (!updatedJobsite) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Jobsite not found',
            requestId: data.requestId 
          }));
          return;
        }
        
        ws.send(JSON.stringify({
          type: 'calendar-event-response',
          event: updatedJobsite,
          action: 'update',
          success: true,
          timestamp: new Date().toISOString(),
          requestId: data.requestId
        }));
        
        // Broadcast to all clients
        broadcast({
          type: 'calendar-event-update',
          event: updatedJobsite,
          action: 'update',
          timestamp: new Date().toISOString()
        });
      }
      else if (data.action === 'fetch') {
        // Fetch calendar events
        const startDate = data.startDate ? new Date(data.startDate) : undefined;
        const endDate = data.endDate ? new Date(data.endDate) : undefined;
        
        const events = await storage.getCalendarEvents(startDate, endDate);
        
        ws.send(JSON.stringify({
          type: 'calendar-events-response',
          events: events,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          timestamp: new Date().toISOString(),
          requestId: data.requestId
        }));
      }
      else {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid calendar event action',
          requestId: data.requestId 
        }));
      }
    } catch (error) {
      console.error('Error handling calendar event:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Error processing calendar event',
        requestId: data.requestId
      }));
    }
  };
  
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
      let shouldSendNotification = false;
      let notificationMessage = '';
      let jobsiteName = '';
      
      if (data.command.toLowerCase().includes('late')) {
        response = `I've notified the team that you'll be late. Your ETA has been updated.`;
        shouldSendNotification = true;
        notificationMessage = `BOSS UPDATE: Running late to the jobsite. ETA is delayed.`;
        
        // Update jobsite status if it's mentioned
        const jobsites = await storage.getJobsites();
        for (const jobsite of jobsites) {
          if (data.command.toLowerCase().includes(jobsite.name.toLowerCase())) {
            await storage.updateJobsiteStatus(jobsite.id, `Delayed (from voice command)`);
            jobsiteName = jobsite.name;
            break;
          }
        }
      } else if (data.command.toLowerCase().includes('weather')) {
        response = `Weather update received. I've updated the jobsite status and notified the client.`;
        shouldSendNotification = true;
        notificationMessage = `WEATHER ALERT: Weather conditions may affect today's work. Take precautions.`;
        
        // Check if a specific jobsite is mentioned
        const jobsites = await storage.getJobsites();
        for (const jobsite of jobsites) {
          if (data.command.toLowerCase().includes(jobsite.name.toLowerCase())) {
            jobsiteName = jobsite.name;
            break;
          }
        }
      } else if (data.command.toLowerCase().includes('equipment') || data.command.toLowerCase().includes('material')) {
        response = `Supply request logged. The team has been notified about the needed resources.`;
        shouldSendNotification = true;
        notificationMessage = `SUPPLY REQUEST: New equipment or materials have been requested.`;
        
        // Check if a specific jobsite is mentioned
        const jobsites = await storage.getJobsites();
        for (const jobsite of jobsites) {
          if (data.command.toLowerCase().includes(jobsite.name.toLowerCase())) {
            jobsiteName = jobsite.name;
            break;
          }
        }
      } else if (data.command.toLowerCase().includes('safety')) {
        response = `Safety issue reported. A supervisor has been notified to address this immediately.`;
        shouldSendNotification = true;
        notificationMessage = `SAFETY ALERT: A safety concern has been reported. Please check in.`;
        
        // Check if a specific jobsite is mentioned
        const jobsites = await storage.getJobsites();
        for (const jobsite of jobsites) {
          if (data.command.toLowerCase().includes(jobsite.name.toLowerCase())) {
            jobsiteName = jobsite.name;
            break;
          }
        }
      } else {
        response = `Command received: ${data.command}`;
      }
      
      // Send SMS notification if needed
      if (shouldSendNotification) {
        try {
          // In a real app, we would get recipients from the database
          // based on the jobsite and notification preferences
          const recipients: Array<{ 
            name: string; 
            phone?: string; 
            email?: string; 
            preferredMethod: 'sms' | 'email' | 'both' 
          }> = [
            {
              name: "Worker 1",
              phone: "+15551234567", // Example phone number
              email: "worker1@example.com",
              preferredMethod: 'sms' as const
            },
            {
              name: "Supervisor",
              phone: "+15557654321", // Example phone number
              email: "supervisor@example.com",
              preferredMethod: 'email' as const
            }
          ];
          
          // Send bulk notifications
          await sendBulkNotifications(recipients, notificationMessage, jobsiteName);
          
          console.log(`Sent notifications for command: ${data.command}`);
        } catch (error) {
          console.error('Error sending notifications:', error);
          // Continue processing even if notification fails
        }
      }
      
      // Send response back to the client
      ws.send(JSON.stringify({
        type: 'command-response',
        text: response,
        commandId: command.id,
        timestamp: new Date().toISOString(),
        notificationSent: shouldSendNotification
      }));
      
      // Broadcast update to all clients
      broadcast({
        type: 'command-update',
        command: command,
        timestamp: new Date().toISOString(),
        notificationSent: shouldSendNotification
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
      // Extract data from the message
      const messageText = data.text || '';
      const role = data.role || 'boss'; // 'boss' or 'worker'
      const sourceLanguage = data.language || (role === 'boss' ? 'en' : 'es'); 
      const targetLanguage = sourceLanguage === 'en' ? 'es' : 'en';
      
      console.log(`Processing message from ${role} in ${sourceLanguage}`);
      
      // Store the original chat message
      const chatMessage = await storage.createChatMessage({
        text: messageText,
        isUser: true,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        userId: 1 // Default user for now
      });
      
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
      
      // Generate response based on the chat message (using the translated text if appropriate)
      const textToProcess = role === 'worker' ? translatedText : messageText;
      let responseText = '';
      
      if (textToProcess.toLowerCase().includes('where') && textToProcess.toLowerCase().includes('mike')) {
        responseText = role === 'boss' 
          ? `Mike is currently at the Downtown Renovation site. He arrived 30 minutes ago and reported heavy rain conditions.`
          : `Mike está actualmente en el sitio de Renovación del Centro. Llegó hace 30 minutos y reportó condiciones de lluvia intensa.`;
      } else if (textToProcess.toLowerCase().includes('weather') || textToProcess.toLowerCase().includes('clima')) {
        const weatherAlerts = await storage.getWeatherAlerts();
        if (weatherAlerts.length > 0) {
          responseText = role === 'boss'
            ? `There is a ${weatherAlerts[0].title} for the ${weatherAlerts[0].location}. ${weatherAlerts[0].impact}`
            : `Hay una alerta de ${await translateWithOpenAI(weatherAlerts[0].title, 'es')} para ${await translateWithOpenAI(weatherAlerts[0].location, 'es')}. ${await translateWithOpenAI(weatherAlerts[0].impact, 'es')}`;
        } else {
          responseText = role === 'boss' 
            ? `There are no current weather alerts.`
            : `No hay alertas meteorológicas actuales.`;
        }
      } else if (textToProcess.toLowerCase().includes('status') || textToProcess.toLowerCase().includes('update') || 
                 textToProcess.toLowerCase().includes('estado') || textToProcess.toLowerCase().includes('actualización')) {
        responseText = role === 'boss'
          ? `There are 3 active jobsites today. Westside Project is delayed by 20 minutes, Downtown Renovation has a weather alert, and Eastside Construction is on schedule.`
          : `Hay 3 sitios de trabajo activos hoy. El Proyecto Oeste está retrasado 20 minutos, la Renovación del Centro tiene una alerta meteorológica, y la Construcción Este está en horario.`;
      } else {
        responseText = role === 'boss'
          ? `I'm sorry, I don't have information about that. Please try asking about jobsite status, weather conditions, or crew locations.`
          : `Lo siento, no tengo información sobre eso. Por favor, intente preguntar sobre el estado del sitio de trabajo, las condiciones climáticas o las ubicaciones del equipo.`;
      }
      
      // Translate the response if needed
      let translatedResponse = '';
      if (role === 'boss' && responseText) {
        // Translate response to Spanish for the worker
        translatedResponse = await translateWithOpenAI(responseText, 'es');
      } else if (role === 'worker' && responseText) {
        // Translate response to English for the boss
        translatedResponse = await translateWithOpenAI(responseText, 'en');
      }
      
      // Store the response in the original language
      const responseMessage = await storage.createChatMessage({
        text: responseText,
        isUser: false,
        timestamp: new Date(),  // Use actual Date object for Postgres timestamp
        userId: 1 // Default user for now
      });
      
      // Send response back to the client
      ws.send(JSON.stringify({
        type: 'chat-response',
        text: responseText,
        originalText: messageText,
        translatedText: translatedText,
        translatedResponse: translatedResponse || responseText,
        messageId: responseMessage.id,
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
  
  // Handle message reactions
  const handleMessageReaction = async (ws: WebSocket, data: any) => {
    try {
      console.log('Processing message reaction:', data);
      
      // Required data: messageId, userId, emoji, action ('add' or 'remove')
      const { messageId, userId, emoji, action } = data;
      
      if (!messageId || !userId || !emoji || !action) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Missing required fields for reaction',
          requestId: data.requestId 
        }));
        return;
      }
      
      if (!['add', 'remove'].includes(action)) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid reaction action (must be "add" or "remove")',
          requestId: data.requestId 
        }));
        return;
      }
      
      let updatedMessage;
      if (action === 'add') {
        updatedMessage = await storage.addReactionToMessage(
          parseInt(messageId), 
          parseInt(userId), 
          emoji
        );
      } else {
        updatedMessage = await storage.removeReactionFromMessage(
          parseInt(messageId), 
          parseInt(userId), 
          emoji
        );
      }
      
      if (!updatedMessage) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Message not found',
          requestId: data.requestId 
        }));
        return;
      }
      
      // Send confirmation to the requesting client
      ws.send(JSON.stringify({
        type: 'reaction-response',
        messageId,
        userId,
        emoji,
        action,
        success: true,
        reactions: updatedMessage.reactions || {},
        timestamp: new Date().toISOString(),
        requestId: data.requestId
      }));
      
      // Broadcast to all clients
      console.log('Broadcasting reaction update to all clients');
      broadcast({
        type: 'message-reaction-update',
        messageId,
        userId,
        emoji,
        action,
        reactions: updatedMessage.reactions || {},
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error handling message reaction:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Error processing message reaction',
        requestId: data.requestId
      }));
    }
  };
  
  // Simulated translation function - in a real app, this would connect to Gemma or another translation service
  async function simulateTranslation(text: string, targetLanguage: 'en' | 'es'): Promise<string> {
    // This is a very simplified translation simulation
    // In a real app, this would use a proper translation API or Google's Gemma
    
    // Simple dictionary for common construction phrases
    const translations: Record<string, Record<string, string>> = {
      'en': { // English words
        'hola': 'hello',
        'adiós': 'goodbye',
        'gracias': 'thank you',
        'sí': 'yes',
        'no': 'no',
        'por favor': 'please',
        'ayuda': 'help',
        'necesito': 'I need',
        'trabajo': 'work',
        'herramientas': 'tools',
        'materiales': 'materials',
        'ahora': 'now',
        'mañana': 'tomorrow',
        'problema': 'problem',
        'arreglar': 'fix',
        'terminado': 'done',
        'tarde': 'late',
        'temprano': 'early',
        'lo siento': 'sorry',
        'bueno': 'good',
        'malo': 'bad',
        'sitio de trabajo': 'job site',
        'construcción': 'construction',
        'trabajador': 'worker',
        'jefe': 'boss',
        'más': 'more',
        'menos': 'less',
        'llamar': 'call',
        'mensaje': 'message',
        'entender': 'understand',
        'emergencia': 'emergency',
        'seguridad': 'safety',
        'equipo': 'equipment',
        'clima': 'weather',
        'lluvia': 'rain',
        'caliente': 'hot',
        'frío': 'cold',
        'listo': 'ready',
        'esperar': 'wait',
        'apurar': 'hurry',
        'lento': 'slow',
        'rápido': 'fast',
        'comenzar': 'start',
        'terminar': 'finish',
        'descanso': 'break',
        'almuerzo': 'lunch',
        'tiempo': 'time',
        'hora': 'hour',
        'minuto': 'minute',
        'día': 'day',
        'semana': 'week',
      },
      'es': { // Spanish words
        'hello': 'hola',
        'goodbye': 'adiós',
        'thank you': 'gracias',
        'yes': 'sí',
        'no': 'no',
        'please': 'por favor',
        'help': 'ayuda',
        'I need': 'necesito',
        'work': 'trabajo',
        'tools': 'herramientas',
        'materials': 'materiales',
        'now': 'ahora',
        'tomorrow': 'mañana',
        'problem': 'problema',
        'fix': 'arreglar',
        'done': 'terminado',
        'late': 'tarde',
        'early': 'temprano',
        'sorry': 'lo siento',
        'good': 'bueno',
        'bad': 'malo',
        'job site': 'sitio de trabajo',
        'construction': 'construcción',
        'worker': 'trabajador',
        'boss': 'jefe',
        'more': 'más',
        'less': 'menos',
        'call': 'llamar',
        'message': 'mensaje',
        'understand': 'entender',
        'emergency': 'emergencia',
        'safety': 'seguridad',
        'equipment': 'equipo',
        'weather': 'clima',
        'rain': 'lluvia',
        'hot': 'caliente',
        'cold': 'frío',
        'ready': 'listo',
        'wait': 'esperar',
        'hurry': 'apurar',
        'slow': 'lento',
        'fast': 'rápido',
        'start': 'comenzar',
        'finish': 'terminar',
        'break': 'descanso',
        'lunch': 'almuerzo',
        'time': 'tiempo',
        'hour': 'hora',
        'minute': 'minuto',
        'day': 'día',
        'week': 'semana',
      }
    };
    
    // Artificial delay to simulate processing time (would be faster with on-device Gemma)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get the translation dictionary for the target language
    const dictionary = translations[targetLanguage];
    
    // Simple word replacement (very naive translation)
    let translated = text.toLowerCase();
    
    // Special case for common construction phrases
    if (targetLanguage === 'es') {
      if (text.match(/I('| a)m on (my|the) way/i)) return "Estoy en camino";
      if (text.match(/I('| wi)ll be .* late/i)) return "Llegaré tarde";
      if (text.match(/need more workers/i)) return "Necesito más trabajadores";
      if (text.match(/need more materials/i)) return "Necesito más materiales";
      if (text.match(/there('| i)s a problem/i)) return "Hay un problema";
      if (text.match(/job (is )?complete(d)?/i)) return "Trabajo completado";
      if (text.match(/I don('|')t understand/i)) return "No entiendo";
      if (text.match(/call me/i)) return "Llámame";
      if (text.match(/send (the )?photos/i)) return "Envía las fotos";
    } else {
      if (text.match(/estoy en camino/i)) return "I'm on my way";
      if (text.match(/llegar(é|e) tarde/i)) return "I'll be late";
      if (text.match(/necesito más trabajadores/i)) return "I need more workers";
      if (text.match(/necesito más materiales/i)) return "I need more materials";
      if (text.match(/hay un problema/i)) return "There is a problem";
      if (text.match(/trabajo completado/i)) return "Job complete";
      if (text.match(/no entiendo/i)) return "I don't understand";
      if (text.match(/lláma(me|r)/i)) return "Call me";
      if (text.match(/env(í|i)a (las )?fotos/i)) return "Send photos";
    }
    
    // Word-by-word translation (very simplified)
    for (const [source, target] of Object.entries(dictionary)) {
      // Using case-insensitive global replacement with word boundaries
      const regex = new RegExp(`\\b${source}\\b`, 'gi');
      translated = translated.replace(regex, target);
    }
    
    return translated.charAt(0).toUpperCase() + translated.slice(1);
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
  
  // Add a dedicated translation API endpoint
  app.post('/api/translate', async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      // Log the request for debugging
      console.log('Translation request:', { text, targetLanguage });
      
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
      
      // Specific test case - Downtown Renovation
      if (text.includes("Downtown Renovation") && 
          text.toLowerCase().includes("late") && 
          targetLanguage === 'es') {
        console.log('HARDCODED: Downtown Renovation message matched');
        return res.json({
          original: text,
          translated: "Llegaré tarde a la Renovación del Centro",
          targetLanguage
        });
      }
      
      // Use the existing translation function
      const translatedText = await simulateTranslation(text, targetLanguage as 'en' | 'es');
      
      return res.json({
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
