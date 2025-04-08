import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
// Use main routes
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeStorage } from './db/config';

// Set a fixed port with fallback mechanism
const PORT = 3300; // Using a less common port to avoid conflicts

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize the storage system
  const storage = initializeStorage();
  log('Storage system initialized', 'storage');
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server with reliable port handling
  let currentPort = PORT;
  let maxRetries = 5;
  let serverStarted = false;

  // Try to start server with retries
  while (!serverStarted && maxRetries > 0) {
    try {
      server.listen({
        port: currentPort,
        host: "localhost",
      });
      serverStarted = true;
      log(`Server running at http://localhost:${currentPort}`, 'express');
      
      // Store the port in a file for client to access
      process.env.APP_PORT = currentPort.toString();
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${currentPort} is in use, trying ${currentPort + 1}...`, 'express');
        currentPort++;
        maxRetries--;
      } else {
        log(`Error starting server: ${error.message}`, 'express');
        maxRetries = 0; // stop retrying on non-port errors
      }
    }
  }

  if (!serverStarted) {
    log('Failed to start server after multiple attempts. Please check if multiple instances are running.', 'express');
    process.exit(1);
  }
})();
