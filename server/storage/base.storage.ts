import { StorageError } from '../errors/api.error';

export interface IBaseStorage {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

export abstract class BaseStorage implements IBaseStorage {
  protected constructor(protected readonly name: string) {}

  abstract initialize(): Promise<void>;
  abstract cleanup(): Promise<void>;

  protected handleError(error: unknown, operation: string): never {
    if (error instanceof StorageError) {
      throw error;
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError(
      `${this.name} storage error during ${operation}: ${message}`,
      { originalError: error }
    );
  }

  protected async executeWithErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error, operation);
    }
  }
} 