import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { log } from '../vite';

// Safely handle error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || 'Unknown error');
}

// MongoDB Memory Server instance
let mongoMemoryServer: MongoMemoryServer | null = null;

// MongoDB connection options
const connectionOptions = {
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
};

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState === 0) {
      // Check if we should use MongoDB Memory Server or a real connection
      if (process.env.MONGODB_URI) {
        // Use the provided MongoDB URI
        const MONGODB_URI = process.env.MONGODB_URI;
        log(`Connecting to MongoDB at ${MONGODB_URI.replace(/mongodb:\/\/(.*@)?/, 'mongodb://****@')}`, 'mongodb');
        await mongoose.connect(MONGODB_URI, connectionOptions);
      } else {
        // Use MongoDB Memory Server for in-memory MongoDB
        if (!mongoMemoryServer) {
          log('Creating MongoDB Memory Server instance', 'mongodb');
          mongoMemoryServer = await MongoMemoryServer.create();
        }
        const uri = mongoMemoryServer.getUri();
        log(`Connecting to MongoDB Memory Server at ${uri}`, 'mongodb');
        await mongoose.connect(uri, connectionOptions);
      }
      log('Connected to MongoDB successfully', 'mongodb');
    }
    return { db: mongoose.connection.db, mongoose: mongoose };
  } catch (error) {
    log(`Error connecting to MongoDB: ${getErrorMessage(error)}`, 'mongodb');
    throw error;
  }
}

// Get the current connection state
export function getConnectionState() {
  return {
    connected: mongoose.connection.readyState === 1,
    connecting: mongoose.connection.readyState === 2,
    disconnected: mongoose.connection.readyState === 0,
    readyState: mongoose.connection.readyState,
  };
}

// Close connection
export async function closeConnection() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    log('MongoDB connection closed', 'mongodb');
  }
  
  // Stop MongoDB Memory Server if it's running
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
    log('MongoDB Memory Server stopped', 'mongodb');
  }
}

// Handle connection events for better logging and debugging
mongoose.connection.on('error', (err) => {
  log(`MongoDB connection error: ${err}`, 'mongodb');
});

mongoose.connection.on('disconnected', () => {
  log('MongoDB disconnected', 'mongodb');
});

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});