import { Investment, CreateInvestmentDto, InvestmentStatus, Country } from '../../../shared/types';
import { InvestmentRepository } from '../repositories/InvestmentRepository';
// import { SnapshotRepository } from '../repositories/SnapshotRepository'; // Reserved for future use
import { ExchangeRateRepository } from '../repositories/ExchangeRateRepository';
import { AppError } from '../middleware/errorHandler';
import { calculateTaxBrazil } from '../utils/taxCalculator';
import Decimal from 'decimal.js';
import dayjs from 'dayjs';

export class InvestmentService {
  private get investmentRepo(): InvestmentRepository {
    return new InvestmentRepository();
  }
  // private snapshotRepo: SnapshotRepository; // Reserved for future snapshot functionality

  private get exchangeRateRepo(): ExchangeRateRepository {
    return new ExchangeRateRepository();
  }

  async getAllInvestments(filters?: {
    country?: Country;
    status?: InvestmentStatus;
    account?: string;
    type?: string;
  }): Promise<Investment[]> {
    return this.investmentRepo.findAll(filters);
  }

  async getInvestmentById(id: number): Promise<Investment> {
    const investment = await this.investmentRepo.findById(id);
    if (!investment) {
      throw new AppError('Investment not found', 404);
    }
    return investment;
  }

  async getInvestmentByCodigo(codigo: string): Promise<Investment> {
    const investment = await this.investmentRepo.findByCodigo(codigo);
    if (!investment) {
      throw new AppError('Investment not found', 404);
    }
    return investment;
  }

  async createInvestment(data: CreateInvestmentDto): Promise<Investment> {
    // Validate unique codigo for Brazilian investments
    if (data.codigo) {
      const existing = await this.investmentRepo.findByCodigo(data.codigo);
      if (existing) {
        throw new AppError('Investment with this codigo already exists', 400);
      }
    }

    // If purchase value and exchange rate provided, calculate USD value
    if (data.purchaseValueOriginal && data.country === Country.BR) {
      const exchangeRate = await this.exchangeRateRepo.getRate(
        data.purchaseDate || new Date()
      );
      
      if (exchangeRate) {
        const valueUsd = new Decimal(data.purchaseValueOriginal)
          .div(exchangeRate.rate)
          .toNumber();
        
        return this.investmentRepo.create({
          ...data,
          purchaseExchangeRate: exchangeRate.rate,
          purchaseValueUsd: valueUsd
        } as any);
      }
    }

    return this.investmentRepo.create(data);
  }

  async updateInvestment(id: number, data: Partial<Investment>): Promise<Investment> {
    const existing = await this.investmentRepo.findById(id);
    if (!existing) {
      throw new AppError('Investment not found', 404);
    }

    return this.investmentRepo.update(id, data);
  }

  async deleteInvestment(id: number): Promise<void> {
    const deleted = await this.investmentRepo.delete(id);
    if (!deleted) {
      throw new AppError('Investment not found', 404);
    }
  }

  async markInvestmentAsDone(
    id: number,
    finalValue: number,
    saleDate?: Date
  ): Promise<Investment> {
    const investment = await this.investmentRepo.findById(id);
    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    if (investment.status === InvestmentStatus.DONE) {
      throw new AppError('Investment is already marked as done', 400);
    }

    // Get exchange rate for the sale date
    const date = saleDate || new Date();
    let exchangeRate: number | undefined;
    let finalValueUsd: number | undefined;
    let earningsUsd: number | undefined;

    if (investment.country === Country.BR) {
      const rate = await this.exchangeRateRepo.getRate(date);
      if (rate) {
        exchangeRate = rate.rate;
        finalValueUsd = new Decimal(finalValue).div(rate.rate).toNumber();

        if (investment.purchaseValueOriginal) {
          const earnings = new Decimal(finalValue)
            .minus(investment.purchaseValueOriginal);
          earningsUsd = earnings.div(rate.rate).toNumber();
        }
      }
    }

    // Calculate Brazilian tax if applicable
    let taxInfo: any = {};
    if (investment.country === Country.BR && investment.purchaseDate) {
      const holdingDays = dayjs(date).diff(dayjs(investment.purchaseDate), 'day');
      const earnings = new Decimal(finalValue)
        .minus(investment.purchaseValueOriginal || 0)
        .toNumber();
      
      if (earnings > 0) {
        taxInfo = calculateTaxBrazil(investment.type, earnings, holdingDays);
      }
    }

    return this.investmentRepo.update(id, {
      status: InvestmentStatus.DONE,
      saleDate: date,
      finalValueOriginal: finalValue,
      finalExchangeRate: exchangeRate,
      finalValueUsd,
      earningsOriginal: investment.purchaseValueOriginal 
        ? finalValue - investment.purchaseValueOriginal 
        : undefined,
      earningsUsd,
      taxRateBrazil: taxInfo.rate,
      taxPaidBrazil: taxInfo.amount
    });
  }

  async getActiveInvestmentsSummary(): Promise<{
    total: number;
    byCountry: Record<string, number>;
    byType: Record<string, number>;
    byAccount: Record<string, number>;
  }> {
    const investments = await this.investmentRepo.getActiveInvestments();
    
    const summary = {
      total: investments.length,
      byCountry: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byAccount: {} as Record<string, number>
    };

    investments.forEach(inv => {
      // Count by country
      summary.byCountry[inv.country] = (summary.byCountry[inv.country] || 0) + 1;
      
      // Count by type
      summary.byType[inv.type] = (summary.byType[inv.type] || 0) + 1;
      
      // Count by account
      summary.byAccount[inv.account] = (summary.byAccount[inv.account] || 0) + 1;
    });

    return summary;
  }

  async getUpcomingMaturities(days: number = 30): Promise<Investment[]> {
    const startDate = new Date();
    const endDate = dayjs().add(days, 'day').toDate();
    
    return this.investmentRepo.getInvestmentsByMaturityDate(startDate, endDate);
  }

  async searchInvestments(query: string): Promise<Investment[]> {
    const allInvestments = await this.investmentRepo.findAll();
    
    const searchTerm = query.toLowerCase();
    return allInvestments.filter(inv => 
      inv.description.toLowerCase().includes(searchTerm) ||
      inv.account.toLowerCase().includes(searchTerm) ||
      (inv.codigo && inv.codigo.toLowerCase().includes(searchTerm)) ||
      inv.type.toLowerCase().includes(searchTerm)
    );
  }
}
