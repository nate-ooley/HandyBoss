import { IStorage } from '../storage';
import { MongoStorage } from './mongoStorage';
import { MemStorage } from '../storage';
import { log } from '../vite';

// Storage configuration
let storage: IStorage;

// Function to determine which storage implementation to use
export function initializeStorage(forceMemory = false): IStorage {
  const useMongoDb = process.env.USE_MONGODB === 'true' && !forceMemory;
  
  if (useMongoDb) {
    log('Using MongoDB storage implementation', 'storage');
    storage = new MongoStorage();
  } else {
    log('Using in-memory storage implementation', 'storage');
    storage = new MemStorage();
  }
  
  return storage;
}

// Get the current storage instance
export function getStorage(): IStorage {
  if (!storage) {
    return initializeStorage();
  }
  return storage;
}

// Explicitly set the storage implementation
export function setStorage(newStorage: IStorage): void {
  storage = newStorage;
}