import { BaseStorage } from './base.storage';
import { User, InsertUser, users } from '@shared/schema';
import { NotFoundError } from '../errors/api.error';
import { db } from '../db';
import { eq } from 'drizzle-orm';

export interface IUserStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

export class UserStorage extends BaseStorage implements IUserStorage {
  constructor() {
    super('User');
  }

  async initialize(): Promise<void> {
    // Any initialization logic if needed
  }

  async cleanup(): Promise<void> {
    // Any cleanup logic if needed
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.executeWithErrorHandling('getUser', async () => {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.executeWithErrorHandling('getUserByUsername', async () => {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.executeWithErrorHandling('createUser', async () => {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    });
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    return this.executeWithErrorHandling('updateUser', async () => {
      const result = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      
      if (!result[0]) {
        throw new NotFoundError('User');
      }
      
      return result[0];
    });
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('deleteUser', async () => {
      const result = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      return result.length > 0;
    });
  }
} 