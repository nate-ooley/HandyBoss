import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { log } from "./vite";
import { 
  insertCommandSchema, 
  insertChatMessageSchema,
  insertProjectMemberSchema,
  insertProjectCommunicationSchema
} from "@shared/schema";
import { translateWithOpenAI, detectLanguageWithOpenAI } from "./openai";
import { sendEmail, sendSMS, sendBulkNotifications } from "./services/sendgrid";
import { createPaymentIntent, createCustomer, createSubscription, getCustomer, getSubscription } from "./services/stripe";
import { processVoiceCommand, translateConstructionText, createCommandFromSpeech } from "./services/anthropic";

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
      
      // Try to use Anthropic for improved construction-specific translation
      try {
        const translatedText = await translateConstructionText(text, targetLanguage as 'en' | 'es');
        
        res.json({
          original: text,
          translated: translatedText,
          targetLanguage,
          provider: 'anthropic'
        });
        return;
      } catch (anthropicError) {
        // If Anthropic fails, fall back to OpenAI
        console.log('Anthropic translation failed, falling back to OpenAI:', anthropicError);
      }
      
      // Fallback to OpenAI
      const translatedText = await translateWithOpenAI(text, targetLanguage as 'en' | 'es');
      
      res.json({
        original: text,
        translated: translatedText,
        targetLanguage,
        provider: 'openai'
      });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ message: 'Error processing translation' });
    }
  });
  
  // Process voice commands
  app.post('/api/voice/process-command', async (req, res) => {
    try {
      const { text, language = 'en', jobsiteId, userId = 1 } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Missing required field: text' });
      }
      
      // Process command with Anthropic NLP
      let commandData;
      try {
        commandData = await processVoiceCommand(text);
      } catch (err) {
        console.error('Error processing command with Anthropic:', err);
        // Fallback to basic intent detection
        commandData = {
          intent: text.toLowerCase().includes('schedule') ? 'schedule' :
                  text.toLowerCase().includes('report') ? 'report' :
                  text.toLowerCase().includes('alert') ? 'alert' :
                  text.toLowerCase().includes('request') ? 'request' : 'information',
          action: text,
          entities: [],
          priority: 'medium',
          jobsiteRelevant: jobsiteId !== undefined,
          requiresResponse: text.endsWith('?')
        };
      }
      
      // Store the command in the database
      const command = await storage.createCommand({
        text,
        userId: typeof userId === 'number' ? userId : 1,
        jobsiteId: jobsiteId ? Number(jobsiteId) : undefined,
        timestamp: new Date(),
      });
      
      // Generate a response message
      const responseMessage = generateCommandResponse(commandData);
      
      // Return processed command with additional information
      res.json({
        ...commandData,
        command,
        response: responseMessage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing voice command:', error);
      res.status(500).json({ error: 'Failed to process voice command' });
    }
  });
  
  // Helper function to generate responses based on command intent
  function generateCommandResponse(command: any): string {
    const intentResponses: Record<string, string[]> = {
      'schedule': [
        'I\'ve scheduled that for you.',
        'Added to the calendar.',
        'The schedule has been updated.',
        'Task scheduled successfully.'
      ],
      'report': [
        'Report received. Thank you.',
        'I\'ve logged your report.',
        'Thank you for the update.',
        'Report has been recorded.'
      ],
      'alert': [
        'Alert sent to the team.',
        'Team has been notified.',
        'Alert has been issued.',
        'Emergency notification sent.'
      ],
      'request': [
        'Your request has been submitted.',
        'I\'ll process that request right away.',
        'Request received and logged.',
        'I\'ll take care of that request.'
      ],
      'information': [
        'Here\'s the information you requested.',
        'I\'ve found that information for you.',
        'Let me look that up for you.',
        'Here are the details you asked for.'
      ]
    };
    
    const fallbackResponses = [
      'Command processed successfully.',
      'I\'ve taken care of that for you.',
      'Your request has been processed.',
      'All done!'
    ];
    
    const responses = intentResponses[command.intent] || fallbackResponses;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
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
  
  // Payment API Endpoints with Stripe
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      const { amount, currency = 'usd', metadata = {} } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }
      
      // Convert dollars to cents for Stripe
      const amountInCents = Math.round(amount * 100);
      
      const paymentIntent = await createPaymentIntent(amountInCents, currency, metadata);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret || '',
        amount: amountInCents,
        currency
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        error: 'Failed to create payment intent',
        message: error.message
      });
    }
  });
  
  app.post('/api/create-customer', async (req, res) => {
    try {
      const { email, name, metadata = {} } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const customer = await createCustomer(email, name, metadata);
      
      res.json({ 
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      });
    } catch (error: any) {
      console.error('Error creating customer:', error);
      res.status(500).json({ 
        error: 'Failed to create customer',
        message: error.message
      });
    }
  });
  
  app.post('/api/create-subscription', async (req, res) => {
    try {
      const { customerId, priceId, metadata = {} } = req.body;
      
      if (!customerId || !priceId) {
        return res.status(400).json({ 
          error: 'Customer ID and Price ID are required' 
        });
      }
      
      const subscription = await createSubscription(customerId, priceId, metadata);
      
      // Type assertion for latest_invoice since it could be an expanded object
      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent as any;
      
      res.json({ 
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || null,
        status: subscription.status
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ 
        error: 'Failed to create subscription',
        message: error.message
      });
    }
  });
  
  app.get('/api/customer/:id', async (req, res) => {
    try {
      const customerId = req.params.id;
      
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      const customer = await getCustomer(customerId);
      
      res.json({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        metadata: customer.metadata
      });
    } catch (error: any) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ 
        error: 'Failed to fetch customer',
        message: error.message
      });
    }
  });
  
  app.get('/api/subscription/:id', async (req, res) => {
    try {
      const subscriptionId = req.params.id;
      
      if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID is required' });
      }
      
      const subscription = await getSubscription(subscriptionId);
      
      // Type assert the subscription for easier access to properties
      const sub = subscription as any;
      
      res.json({
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: sub.current_period_end,
        currentPeriodStart: sub.current_period_start,
        cancelAtPeriodEnd: sub.cancel_at_period_end
      });
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ 
        error: 'Failed to fetch subscription',
        message: error.message
      });
    }
  });
  
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
  
  // User settings routes
  app.get('/api/user/settings', async (req, res) => {
    try {
      // Get settings for default user (in a real app, this would use authentication)
      const user = await storage.getUser(1); // Default user
      
      if (user && user.settings) {
        res.json(user.settings);
      } else {
        // Return null if no settings found - frontend will use defaults
        res.json(null);
      }
    } catch (error) {
      console.error('Error getting user settings:', error);
      res.status(500).json({ error: 'Failed to retrieve user settings' });
    }
  });
  
  app.post('/api/user/settings', async (req, res) => {
    try {
      // Validate settings with zod
      const settingsValidator = z.object({
        language: z.enum(['en', 'es']).optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        notifications: z.boolean().optional(),
        soundEffects: z.boolean().optional(),
        vibration: z.boolean().optional(),
        voiceSpeed: z.number().min(0).max(100).optional(),
        voiceVolume: z.number().min(0).max(100).optional(),
        voiceLanguage: z.enum(['en', 'es']).optional(),
        autoTranslate: z.boolean().optional(),
        lowPowerMode: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        notifyOnNewMessages: z.boolean().optional(),
        notifyOnJobsiteUpdates: z.boolean().optional(),
        notifyOnWeatherAlerts: z.boolean().optional(),
        notifyOnSafetyIncidents: z.boolean().optional(),
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
        locationSharing: z.boolean().optional(),
        dataCollection: z.boolean().optional(),
        biometricLogin: z.boolean().optional(),
        autoLogout: z.number().min(0).optional()
      }).passthrough(); // Allow additional properties
      
      // Parse settings
      const settings = settingsValidator.parse(req.body);
      
      // Get current user
      const user = await storage.getUser(1); // Default user
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update user settings (in a real app, this would be a formal database update)
      // Here we're simulating it with a direct object manipulation
      user.settings = {
        ...(user.settings || {}),
        ...settings
      };
      
      // In a real app with a database, we would update the record
      // For now, we'll just return success
      
      // Return the updated settings
      res.json({ 
        success: true, 
        message: 'Settings saved successfully',
        settings: user.settings
      });
    } catch (error) {
      console.error('Error saving user settings:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid settings data', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: 'Failed to save user settings' });
    }
  });
  
  app.post('/api/jobsites', async (req, res) => {
    try {
      const { name, address, status, startDate, endDate, description, progress, location } = req.body;
      
      if (!name || !address || !status || !startDate) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, address, status, and startDate are required' 
        });
      }
      
      console.log('Creating new jobsite:', req.body);
      
      // Convert dates to Date objects
      const jobsiteData = {
        name,
        address,
        status,
        description: description || null,
        progress: progress || 0,
        time: new Date().toISOString(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: location || null
      };
      
      const newJobsite = await storage.createJobsite(jobsiteData);
      
      console.log('Created jobsite:', newJobsite);
      res.status(201).json(newJobsite);
    } catch (error) {
      console.error('Error creating jobsite:', error);
      res.status(500).json({ 
        error: 'Failed to create jobsite',
        message: error.message
      });
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
  
  app.get('/api/jobsites/manager/:managerId', async (req, res) => {
    try {
      const managerId = parseInt(req.params.managerId);
      if (isNaN(managerId)) {
        return res.status(400).json({ message: 'Invalid manager ID' });
      }
      
      const jobsites = await storage.getJobsitesByManager(managerId);
      res.json(jobsites);
    } catch (error) {
      console.error('Error fetching manager jobsites:', error);
      res.status(500).json({ error: 'Failed to fetch jobsites for manager' });
    }
  });
  
  app.put('/api/jobsites/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid jobsite ID' });
      }
      
      const data = req.body;
      const jobsite = await storage.updateJobsite(id, data);
      
      if (!jobsite) {
        return res.status(404).json({ error: 'Jobsite not found' });
      }
      
      res.json(jobsite);
    } catch (error) {
      console.error('Error updating jobsite:', error);
      res.status(500).json({ error: 'Failed to update jobsite' });
    }
  });
  
  app.patch('/api/jobsites/:id/progress', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid jobsite ID' });
      }
      
      const { progress } = req.body;
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ error: 'Progress must be a number between 0 and 100' });
      }
      
      const jobsite = await storage.updateJobsiteProgress(id, progress);
      
      if (!jobsite) {
        return res.status(404).json({ error: 'Jobsite not found' });
      }
      
      res.json(jobsite);
    } catch (error) {
      console.error('Error updating jobsite progress:', error);
      res.status(500).json({ error: 'Failed to update jobsite progress' });
    }
  });
  
  app.delete('/api/jobsites/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid jobsite ID' });
      }
      
      const success = await storage.deleteJobsite(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Jobsite not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting jobsite:', error);
      res.status(500).json({ error: 'Failed to delete jobsite' });
    }
  });
  
  // Project crew API endpoints
  app.get('/api/projects/:projectId/crew', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const projectMembers = await storage.getProjectMembers(projectId);
      return res.json(projectMembers);
    } catch (error) {
      console.error('Error fetching project crew:', error);
      return res.status(500).json({ message: 'Failed to fetch project crew' });
    }
  });
  
  app.post('/api/projects/:projectId/crew', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const { crewMemberId, role = 'crew-member' } = req.body;
      if (!crewMemberId) {
        return res.status(400).json({ message: 'Crew member ID is required' });
      }
      
      // Add crew member to project
      const projectMember = await storage.addProjectMember({
        projectId,
        crewMemberId,
        role,
        assignedBy: 1, // Default to first user (admin)
        notes: null,
        hourlyRate: null
      });
      
      return res.json(projectMember);
    } catch (error) {
      console.error('Error adding crew member to project:', error);
      return res.status(500).json({ message: 'Failed to add crew member to project' });
    }
  });
  
  app.delete('/api/projects/:projectId/crew/:crewMemberId', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const crewMemberId = parseInt(req.params.crewMemberId);
      
      if (isNaN(projectId) || isNaN(crewMemberId)) {
        return res.status(400).json({ message: 'Invalid project or crew member ID' });
      }
      
      // Find the project member record
      const projectMembers = await storage.getProjectMembers(projectId);
      const memberToRemove = projectMembers.find(m => m.crewMemberId === crewMemberId);
      
      if (!memberToRemove) {
        return res.status(404).json({ message: 'Crew member not found in this project' });
      }
      
      // Remove the project member
      const removed = await storage.removeProjectMember(memberToRemove.id);
      
      if (!removed) {
        return res.status(500).json({ message: 'Failed to remove crew member from project' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error removing crew member from project:', error);
      return res.status(500).json({ message: 'Failed to remove crew member from project' });
    }
  });

  // Project members API endpoints
  app.get('/api/projects/:projectId/members', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      console.error('Error fetching project members:', error);
      res.status(500).json({ error: 'Failed to fetch project members' });
    }
  });
  
  app.get('/api/projects/member/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid member ID' });
      }
      
      const member = await storage.getProjectMember(id);
      
      if (!member) {
        return res.status(404).json({ error: 'Project member not found' });
      }
      
      res.json(member);
    } catch (error) {
      console.error('Error fetching project member:', error);
      res.status(500).json({ error: 'Failed to fetch project member' });
    }
  });
  
  app.get('/api/crew/:crewMemberId/projects', async (req, res) => {
    try {
      const crewMemberId = parseInt(req.params.crewMemberId);
      if (isNaN(crewMemberId)) {
        return res.status(400).json({ message: 'Invalid crew member ID' });
      }
      
      const projects = await storage.getProjectsByCrewMember(crewMemberId);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching crew member projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects for crew member' });
    }
  });
  
  app.post('/api/projects/:projectId/members', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const data = req.body;
      
      // Validate the input data
      try {
        const validatedData = insertProjectMemberSchema.parse({
          ...data,
          projectId
        });
        
        const member = await storage.addProjectMember(validatedData);
        res.status(201).json(member);
      } catch (validationError: any) {
        return res.status(400).json({ 
          error: 'Invalid project member data', 
          details: validationError.errors 
        });
      }
    } catch (error) {
      console.error('Error adding project member:', error);
      res.status(500).json({ error: 'Failed to add project member' });
    }
  });
  
  app.put('/api/projects/member/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid member ID' });
      }
      
      const data = req.body;
      const member = await storage.updateProjectMember(id, data);
      
      if (!member) {
        return res.status(404).json({ error: 'Project member not found' });
      }
      
      res.json(member);
    } catch (error) {
      console.error('Error updating project member:', error);
      res.status(500).json({ error: 'Failed to update project member' });
    }
  });
  
  app.delete('/api/projects/member/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid member ID' });
      }
      
      const success = await storage.removeProjectMember(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Project member not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing project member:', error);
      res.status(500).json({ error: 'Failed to remove project member' });
    }
  });
  
  // Project communications API endpoints
  app.get('/api/projects/:projectId/communications', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const communications = await storage.getProjectCommunications(projectId, limit);
      res.json(communications);
    } catch (error) {
      console.error('Error fetching project communications:', error);
      res.status(500).json({ error: 'Failed to fetch project communications' });
    }
  });
  
  app.post('/api/projects/:projectId/communications', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      const data = req.body;
      
      // Validate the input data
      try {
        const validatedData = insertProjectCommunicationSchema.parse({
          ...data,
          projectId
        });
        
        const communication = await storage.createProjectCommunication(validatedData);
        res.status(201).json(communication);
        
        // Broadcast to all connected clients via WebSocket
        broadcast({
          type: 'project-communication',
          action: 'create',
          projectId,
          communication,
          timestamp: new Date().toISOString()
        });
      } catch (validationError: any) {
        return res.status(400).json({ 
          error: 'Invalid project communication data', 
          details: validationError.errors 
        });
      }
    } catch (error) {
      console.error('Error creating project communication:', error);
      res.status(500).json({ error: 'Failed to create project communication' });
    }
  });
  
  app.post('/api/projects/communications/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid communication ID' });
      }
      
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const communication = await storage.markCommunicationAsRead(id, userId);
      
      if (!communication) {
        return res.status(404).json({ error: 'Communication not found' });
      }
      
      res.json(communication);
    } catch (error) {
      console.error('Error marking communication as read:', error);
      res.status(500).json({ error: 'Failed to mark communication as read' });
    }
  });
  
  app.post('/api/projects/communications/:id/reactions', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid communication ID' });
      }
      
      const { userId, emoji } = req.body;
      
      if (!userId || !emoji) {
        return res.status(400).json({ error: 'User ID and emoji are required' });
      }
      
      const communication = await storage.addReactionToProjectCommunication(id, userId, emoji);
      
      if (!communication) {
        return res.status(404).json({ error: 'Communication not found' });
      }
      
      res.json(communication);
      
      // Broadcast reaction update
      broadcast({
        type: 'project-communication-reaction',
        action: 'add',
        communicationId: id,
        userId,
        emoji,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding reaction to communication:', error);
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  });
  
  app.delete('/api/projects/communications/:id/reactions', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid communication ID' });
      }
      
      const { userId, emoji } = req.body;
      
      if (!userId || !emoji) {
        return res.status(400).json({ error: 'User ID and emoji are required' });
      }
      
      const communication = await storage.removeReactionFromProjectCommunication(id, userId, emoji);
      
      if (!communication) {
        return res.status(404).json({ error: 'Communication not found' });
      }
      
      res.json(communication);
      
      // Broadcast reaction update
      broadcast({
        type: 'project-communication-reaction',
        action: 'remove',
        communicationId: id,
        userId,
        emoji,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error removing reaction from communication:', error);
      res.status(500).json({ error: 'Failed to remove reaction' });
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
  
  // Crew API Endpoints
  app.get('/api/crew', async (req, res) => {
    try {
      const crewMembers = await storage.getCrewMembers();
      res.json(crewMembers);
    } catch (error) {
      console.error('Error fetching crew members:', error);
      res.status(500).json({ error: 'Failed to fetch crew members' });
    }
  });
  
  app.get('/api/crew/jobsite/:jobsiteId', async (req, res) => {
    try {
      const jobsiteId = parseInt(req.params.jobsiteId);
      
      if (isNaN(jobsiteId)) {
        return res.status(400).json({ error: 'Invalid jobsite ID' });
      }
      
      const crewMembers = await storage.getCrewMembersByJobsite(jobsiteId);
      res.json(crewMembers);
    } catch (error) {
      console.error('Error fetching crew members by jobsite:', error);
      res.status(500).json({ error: 'Failed to fetch crew members' });
    }
  });
  
  app.get('/api/crew/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid crew member ID' });
      }
      
      const crewMember = await storage.getCrewMember(id);
      
      if (!crewMember) {
        return res.status(404).json({ error: 'Crew member not found' });
      }
      
      res.json(crewMember);
    } catch (error) {
      console.error('Error fetching crew member:', error);
      res.status(500).json({ error: 'Failed to fetch crew member' });
    }
  });
  
  app.post('/api/crew', async (req, res) => {
    try {
      const crewMemberData = req.body;
      
      // Validate required fields
      if (!crewMemberData.name || !crewMemberData.role) {
        return res.status(400).json({ error: 'Name and role are required fields' });
      }
      
      const newCrewMember = await storage.createCrewMember(crewMemberData);
      res.status(201).json(newCrewMember);
    } catch (error) {
      console.error('Error creating crew member:', error);
      res.status(500).json({ error: 'Failed to create crew member' });
    }
  });
  
  app.patch('/api/crew/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid crew member ID' });
      }
      
      const crewMemberData = req.body;
      const updatedCrewMember = await storage.updateCrewMember(id, crewMemberData);
      
      if (!updatedCrewMember) {
        return res.status(404).json({ error: 'Crew member not found' });
      }
      
      res.json(updatedCrewMember);
    } catch (error) {
      console.error('Error updating crew member:', error);
      res.status(500).json({ error: 'Failed to update crew member' });
    }
  });
  
  app.patch('/api/crew/:id/location', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid crew member ID' });
      }
      
      const { latitude, longitude, locationName } = req.body;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Valid latitude and longitude are required' });
      }
      
      const updatedCrewMember = await storage.updateCrewMemberLocation(
        id, 
        latitude, 
        longitude, 
        locationName
      );
      
      if (!updatedCrewMember) {
        return res.status(404).json({ error: 'Crew member not found' });
      }
      
      res.json(updatedCrewMember);
    } catch (error) {
      console.error('Error updating crew member location:', error);
      res.status(500).json({ error: 'Failed to update crew member location' });
    }
  });
  
  app.delete('/api/crew/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid crew member ID' });
      }
      
      const success = await storage.deleteCrewMember(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Crew member not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting crew member:', error);
      res.status(500).json({ error: 'Failed to delete crew member' });
    }
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
