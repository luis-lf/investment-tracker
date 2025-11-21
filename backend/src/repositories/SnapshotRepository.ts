import { Knex } from 'knex';
import { getDatabase } from '../database/connection';
import { PortfolioSnapshot } from '../../../shared/types';

export class SnapshotRepository {
  private get db(): Knex {
    return getDatabase();
  }

  async findByInvestmentId(investmentId: number): Promise<PortfolioSnapshot[]> {
    const results = await this.db('portfolio_snapshots')
      .where('investment_id', investmentId)
      .orderBy('snapshot_date', 'desc');
    
    return results;
  }

  async create(data: Omit<PortfolioSnapshot, 'id'>): Promise<PortfolioSnapshot> {
    const [id] = await this.db('portfolio_snapshots').insert({
      investment_id: data.investmentId,
      snapshot_date: data.snapshotDate,
      value_original: data.valueOriginal,
      currency: data.currency,
      status: data.status,
      created_at: new Date()
    });

    return { ...data, id };
  }

  async bulkCreate(snapshots: Omit<PortfolioSnapshot, 'id'>[]): Promise<void> {
    const data = snapshots.map(s => ({
      investment_id: s.investmentId,
      snapshot_date: s.snapshotDate,
      value_original: s.valueOriginal,
      currency: s.currency,
      status: s.status,
      created_at: new Date()
    }));

    await this.db('portfolio_snapshots').insert(data);
  }

  async getLatestSnapshot(investmentId: number): Promise<PortfolioSnapshot | null> {
    const result = await this.db('portfolio_snapshots')
      .where('investment_id', investmentId)
      .orderBy('snapshot_date', 'desc')
      .first();
    
    return result || null;
  }
}
