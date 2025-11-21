import { Knex } from 'knex';
import { getDatabase } from '../database/connection';
import { ExchangeRate } from '../../../shared/types';
import dayjs from 'dayjs';

export class ExchangeRateRepository {
  private get db(): Knex {
    return getDatabase();
  }

  async getRate(date: Date, type: string = 'OFFICIAL'): Promise<ExchangeRate | null> {
    const result = await this.db('exchange_rates')
      .where('date', dayjs(date).format('YYYY-MM-DD'))
      .where('type', type)
      .first();
    
    return result || null;
  }

  async createRate(rate: Omit<ExchangeRate, 'id'>): Promise<ExchangeRate> {
    const [id] = await this.db('exchange_rates').insert({
      date: rate.date,
      rate: rate.rate,
      type: rate.type || 'OFFICIAL',
      source: rate.source,
      created_at: new Date()
    });

    return { ...rate, id };
  }

  async getLatestRate(type: string = 'OFFICIAL'): Promise<ExchangeRate | null> {
    const result = await this.db('exchange_rates')
      .where('type', type)
      .orderBy('date', 'desc')
      .first();
    
    return result || null;
  }

  async getRatesByDateRange(startDate: Date, endDate: Date, type: string = 'OFFICIAL'): Promise<ExchangeRate[]> {
    const results = await this.db('exchange_rates')
      .whereBetween('date', [startDate, endDate])
      .where('type', type)
      .orderBy('date', 'asc');
    
    return results;
  }
}
