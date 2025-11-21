import { Request, Response } from 'express';
import { InvestmentRepository } from '../repositories/InvestmentRepository';
import { SnapshotRepository } from '../repositories/SnapshotRepository';
import { ExchangeRateRepository } from '../repositories/ExchangeRateRepository';
import { Country, InvestmentType } from '../../../shared/types';
import Decimal from 'decimal.js';

export class DashboardController {
  private get investmentRepo(): InvestmentRepository {
    return new InvestmentRepository();
  }

  private get snapshotRepo(): SnapshotRepository {
    return new SnapshotRepository();
  }

  private get exchangeRateRepo(): ExchangeRateRepository {
    return new ExchangeRateRepository();
  }

  getSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const investments = await this.investmentRepo.getActiveInvestments();

      // Get current exchange rate
      const currentRate = await this.exchangeRateRepo.getLatestRate();
      const exchangeRate = currentRate?.rate || 5.10; // Fallback to default

      // Calculate totals
      let totalValueBrl = new Decimal(0);
      let totalValueUsd = new Decimal(0);

      const byCountry = {
        BR: { valueBrl: 0, valueUsd: 0, count: 0 },
        US: { valueBrl: 0, valueUsd: 0, count: 0 }
      };

      const byTypeMap = new Map<InvestmentType, {
        valueBrl: number;
        valueUsd: number;
        count: number;
      }>();

      // Process each investment
      for (const inv of investments) {
        const latestSnapshot = await this.snapshotRepo.getLatestSnapshot(inv.id!);
        const value = latestSnapshot?.valueOriginal || inv.purchaseValueOriginal || 0;

        if (inv.country === Country.BR) {
          const valueBrl = new Decimal(value);
          const valueUsd = valueBrl.div(exchangeRate);

          totalValueBrl = totalValueBrl.plus(valueBrl);
          totalValueUsd = totalValueUsd.plus(valueUsd);

          byCountry.BR.valueBrl += valueBrl.toNumber();
          byCountry.BR.valueUsd += valueUsd.toNumber();
          byCountry.BR.count += 1;
        } else {
          const valueUsd = new Decimal(value);
          const valueBrl = valueUsd.mul(exchangeRate);

          totalValueBrl = totalValueBrl.plus(valueBrl);
          totalValueUsd = totalValueUsd.plus(valueUsd);

          byCountry.US.valueBrl += valueBrl.toNumber();
          byCountry.US.valueUsd += valueUsd.toNumber();
          byCountry.US.count += 1;
        }

        // Track by type
        const type = inv.type;
        if (!byTypeMap.has(type)) {
          byTypeMap.set(type, { valueBrl: 0, valueUsd: 0, count: 0 });
        }
        const typeData = byTypeMap.get(type)!;

        if (inv.country === Country.BR) {
          typeData.valueBrl += value;
          typeData.valueUsd += value / exchangeRate;
        } else {
          typeData.valueBrl += value * exchangeRate;
          typeData.valueUsd += value;
        }
        typeData.count += 1;
      }

      // Convert byType map to array with percentages
      const totalBrl = totalValueBrl.toNumber();
      const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
        type,
        valueBrl: data.valueBrl,
        valueUsd: data.valueUsd,
        count: data.count,
        percentage: totalBrl > 0 ? (data.valueBrl / totalBrl) * 100 : 0
      }));

      // Calculate month-over-month change (simplified - would need historical data)
      const monthOverMonthChange = 0;
      const monthOverMonthChangePercent = 0;
      const ytdReturn = 0;
      const ytdReturnPercent = 0;

      const summary = {
        totalValueBrl: totalValueBrl.toNumber(),
        totalValueUsd: totalValueUsd.toNumber(),
        monthOverMonthChange,
        monthOverMonthChangePercent,
        ytdReturn,
        ytdReturnPercent,
        byCountry,
        byType,
        exchangeRates: {
          current: exchangeRate,
          scenarios: [
            { rate: 5.50, totalBrl: totalValueBrl.toNumber(), difference: 0 },
            { rate: exchangeRate, totalBrl: totalValueBrl.toNumber(), difference: 0 },
            { rate: 4.50, totalBrl: totalValueBrl.toNumber(), difference: 0 }
          ]
        }
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard summary'
      });
    }
  };

  getEvolution = async (_req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Implement historical evolution tracking using query params
      // For now, return empty array - would need to implement historical tracking
      const evolutionData: Array<{
        date: string;
        totalBrl: number;
        totalUsd: number;
      }> = [];

      res.json({
        success: true,
        data: evolutionData
      });
    } catch (error) {
      console.error('Error getting portfolio evolution:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get portfolio evolution'
      });
    }
  };

  getAllocation = async (_req: Request, res: Response): Promise<void> => {
    try {
      const investments = await this.investmentRepo.getActiveInvestments();
      const currentRate = await this.exchangeRateRepo.getLatestRate();
      const exchangeRate = currentRate?.rate || 5.10;

      const allocationMap = new Map<InvestmentType, {
        valueBrl: number;
        valueUsd: number;
        count: number;
      }>();

      let totalValueBrl = 0;

      for (const inv of investments) {
        const latestSnapshot = await this.snapshotRepo.getLatestSnapshot(inv.id!);
        const value = latestSnapshot?.valueOriginal || inv.purchaseValueOriginal || 0;

        if (!allocationMap.has(inv.type)) {
          allocationMap.set(inv.type, { valueBrl: 0, valueUsd: 0, count: 0 });
        }

        const allocation = allocationMap.get(inv.type)!;

        if (inv.country === Country.BR) {
          allocation.valueBrl += value;
          allocation.valueUsd += value / exchangeRate;
          totalValueBrl += value;
        } else {
          allocation.valueBrl += value * exchangeRate;
          allocation.valueUsd += value;
          totalValueBrl += value * exchangeRate;
        }
        allocation.count += 1;
      }

      const allocationData = Array.from(allocationMap.entries()).map(([type, data]) => ({
        type,
        valueBrl: data.valueBrl,
        valueUsd: data.valueUsd,
        count: data.count,
        percentage: totalValueBrl > 0 ? (data.valueBrl / totalValueBrl) * 100 : 0
      }));

      res.json({
        success: true,
        data: allocationData
      });
    } catch (error) {
      console.error('Error getting allocation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get allocation'
      });
    }
  };
}
