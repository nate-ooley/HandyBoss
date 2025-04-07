import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { log } from './vite';

// Load environment variables
config();

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    log('DATABASE_URL is not set in environment variables', 'error');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    // Try to execute a simple query
    const result = await pool.query('SELECT 1 as test');
    log('Database connection successful!', 'success');
    log(`Test query result: ${JSON.stringify(result.rows)}`, 'info');
  } catch (error) {
    log('Database connection failed!', 'error');
    log(`Error details: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  } finally {
    // Close the connection
    await pool.end();
    process.exit(0);
  }
}

testConnection(); 