import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
// Use main routes
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeStorage } from './db/config';
import { isLocalLLMAvailable } from './services/localLLM';
import net from 'net';

// Get port from environment with fallback
const PORT = parseInt(process.env.PORT || '3300', 10);

// Function to check if a port is available
const isPortAvailable = (port: number): Promise<boolean> => {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, 'localhost');
  });
};

// Function to find an available port
const findAvailablePort = async (startPort: number): Promise<number> => {
  let port = startPort;
  const maxPort = startPort + 20; // Try at most 20 ports
  
  while (port < maxPort) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  
  // If we reach here, we couldn't find an available port
  log(`Could not find an available port between ${startPort} and ${maxPort-1}`, 'express');
  return startPort; // Return the start port as a last resort
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add a basic health check endpoint early
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

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

  // Find an available port
  const availablePort = await findAvailablePort(PORT);
  
  if (availablePort !== PORT) {
    log(`Port ${PORT} is in use, using ${availablePort} instead...`, 'express');
  }
  
  // Update environment variable with the actual port
  process.env.PORT = availablePort.toString();
  
  // Start the server
  server.listen(availablePort, "localhost", () => {
    log(`Server running at http://localhost:${availablePort}`, 'express');
  });
})();
