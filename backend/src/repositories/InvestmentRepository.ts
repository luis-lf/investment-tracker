import { Knex } from 'knex';
import { getDatabase } from '../database/connection';
import { Investment, CreateInvestmentDto, InvestmentStatus, Country } from '../../../shared/types';
import { AppError } from '../middleware/errorHandler';

export class InvestmentRepository {
  private get db(): Knex {
    return getDatabase();
  }

  async findAll(filters?: {
    userId?: number;
    country?: Country;
    status?: InvestmentStatus;
    account?: string;
    type?: string;
  }): Promise<Investment[]> {
    let query = this.db('investments');

    if (filters) {
      if (filters.userId) query = query.where('user_id', filters.userId);
      if (filters.country) query = query.where('country', filters.country);
      if (filters.status) query = query.where('status', filters.status);
      if (filters.account) query = query.where('account', filters.account);
      if (filters.type) query = query.where('type', filters.type);
    }

    const results = await query.orderBy('created_at', 'desc');
    return this.mapToInvestments(results);
  }

  async findById(id: number): Promise<Investment | null> {
    const result = await this.db('investments')
      .where('id', id)
      .first();
    
    return result ? this.mapToInvestment(result) : null;
  }

  async findByCodigo(codigo: string): Promise<Investment | null> {
    const result = await this.db('investments')
      .where('codigo', codigo)
      .first();
    
    return result ? this.mapToInvestment(result) : null;
  }

  async create(data: CreateInvestmentDto, userId?: number): Promise<Investment> {
    const [id] = await this.db('investments').insert({
      country: data.country,
      account: data.account,
      description: data.description,
      type: data.type,
      codigo: data.codigo,
      purchase_date: data.purchaseDate,
      purchase_value_original: data.purchaseValueOriginal,
      purchase_currency: data.purchaseCurrency,
      maturity_date: data.maturityDate,
      notes: data.notes,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    });

    const created = await this.findById(id);
    if (!created) {
      throw new AppError('Failed to create investment', 500);
    }
    
    return created;
  }

  async update(id: number, data: Partial<Investment>): Promise<Investment> {
    // Convert camelCase to snake_case for database
    const dbData: any = {};
    
    if (data.status !== undefined) dbData.status = data.status;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.purchaseValueOriginal !== undefined) dbData.purchase_value_original = data.purchaseValueOriginal;
    if (data.purchaseExchangeRate !== undefined) dbData.purchase_exchange_rate = data.purchaseExchangeRate;
    if (data.purchaseValueUsd !== undefined) dbData.purchase_value_usd = data.purchaseValueUsd;
    if (data.saleDate !== undefined) dbData.sale_date = data.saleDate;
    if (data.finalValueOriginal !== undefined) dbData.final_value_original = data.finalValueOriginal;
    if (data.finalExchangeRate !== undefined) dbData.final_exchange_rate = data.finalExchangeRate;
    if (data.finalValueUsd !== undefined) dbData.final_value_usd = data.finalValueUsd;
    if (data.earningsOriginal !== undefined) dbData.earnings_original = data.earningsOriginal;
    if (data.earningsUsd !== undefined) dbData.earnings_usd = data.earningsUsd;
    if (data.taxPaidBrazil !== undefined) dbData.tax_paid_brazil = data.taxPaidBrazil;
    if (data.taxRateBrazil !== undefined) dbData.tax_rate_brazil = data.taxRateBrazil;
    if (data.notes !== undefined) dbData.notes = data.notes;
    
    dbData.updated_at = new Date();

    await this.db('investments')
      .where('id', id)
      .update(dbData);

    const updated = await this.findById(id);
    if (!updated) {
      throw new AppError('Investment not found', 404);
    }
    
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const deleted = await this.db('investments')
      .where('id', id)
      .delete();
    
    return deleted > 0;
  }

  async getActiveInvestments(userId?: number): Promise<Investment[]> {
    let query = this.db('investments')
      .where('status', InvestmentStatus.ACTIVE);
    
    if (userId) {
      query = query.where('user_id', userId);
    }
    
    const results = await query.orderBy('account', 'asc').orderBy('description', 'asc');
    return this.mapToInvestments(results);
  }

  async getInvestmentsByMaturityDate(startDate: Date, endDate: Date): Promise<Investment[]> {
    const results = await this.db('investments')
      .whereBetween('maturity_date', [startDate, endDate])
      .orderBy('maturity_date', 'asc');
    
    return this.mapToInvestments(results);
  }

  async markAsDone(id: number, finalValue: number, exchangeRate?: number): Promise<Investment> {
    const investment = await this.findById(id);
    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    const updateData: Partial<Investment> = {
      status: InvestmentStatus.DONE,
      saleDate: new Date(),
      finalValueOriginal: finalValue,
      finalExchangeRate: exchangeRate,
      earningsOriginal: finalValue - (investment.purchaseValueOriginal || 0)
    };

    if (exchangeRate) {
      updateData.finalValueUsd = finalValue / exchangeRate;
      updateData.earningsUsd = (finalValue - (investment.purchaseValueOriginal || 0)) / exchangeRate;
    }

    return this.update(id, updateData);
  }

  // Helper methods for mapping database results to TypeScript types
  private mapToInvestment(row: any): Investment {
    return {
      id: row.id,
      country: row.country,
      account: row.account,
      description: row.description,
      type: row.type,
      codigo: row.codigo,
      status: row.status,
      purchaseDate: row.purchase_date,
      purchaseValueOriginal: row.purchase_value_original,
      purchaseCurrency: row.purchase_currency,
      purchaseExchangeRate: row.purchase_exchange_rate,
      purchaseValueUsd: row.purchase_value_usd,
      maturityDate: row.maturity_date,
      saleDate: row.sale_date,
      finalValueOriginal: row.final_value_original,
      finalExchangeRate: row.final_exchange_rate,
      finalValueUsd: row.final_value_usd,
      earningsOriginal: row.earnings_original,
      earningsUsd: row.earnings_usd,
      taxPaidBrazil: row.tax_paid_brazil,
      taxRateBrazil: row.tax_rate_brazil,
      taxToBePaid: row.tax_to_be_paid,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToInvestments(rows: any[]): Investment[] {
    return rows.map(row => this.mapToInvestment(row));
  }
}
