import mongoose from 'mongoose';
import { log } from '../vite';

// Safely handle error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || 'Unknown error');
}

// Connection URI (using environment variable or default to a local MongoDB)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/boss-man';

// MongoDB connection options
const connectionOptions = {
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
};

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState === 0) {
      log(`Connecting to MongoDB at ${MONGODB_URI.replace(/mongodb:\/\/(.*@)?/, 'mongodb://****@')}`, 'mongodb');
      await mongoose.connect(MONGODB_URI, connectionOptions);
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