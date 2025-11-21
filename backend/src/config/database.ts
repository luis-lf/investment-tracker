import { Knex } from 'knex';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DATABASE_PATH || './data/investments.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '../database/migrations'),
      extension: 'ts'
    },
    seeds: {
      directory: path.join(__dirname, '../database/seeds'),
      extension: 'ts'
    }
  },

  production: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DATABASE_PATH || './data/investments.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '../database/migrations'),
      extension: 'js'
    },
    seeds: {
      directory: path.join(__dirname, '../database/seeds'),
      extension: 'js'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;
