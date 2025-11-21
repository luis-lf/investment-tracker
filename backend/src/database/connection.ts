import knex, { Knex } from 'knex';
import config from '../config/database';
import { logger } from '../utils/logger';

let db: Knex;

export async function initializeDatabase(): Promise<void> {
  try {
    const environment = process.env.NODE_ENV || 'development';
    const dbConfig = config[environment];
    
    if (!dbConfig) {
      throw new Error(`No database configuration found for environment: ${environment}`);
    }
    
    db = knex(dbConfig);
    
    // Test the connection
    await db.raw('SELECT 1');
    logger.info('Database connected successfully');
    
    // Run migrations
    logger.info('Running database migrations...');
    await db.migrate.latest();
    logger.info('Database migrations completed');
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
  }
}
