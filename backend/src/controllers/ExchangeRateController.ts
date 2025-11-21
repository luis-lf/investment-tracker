import { Request, Response } from 'express';
import { ExchangeRateRepository } from '../repositories/ExchangeRateRepository';
import dayjs from 'dayjs';

export class ExchangeRateController {
  private get exchangeRateRepo(): ExchangeRateRepository {
    return new ExchangeRateRepository();
  }

  getCurrent = async (_req: Request, res: Response): Promise<void> => {
    try {
      let currentRate = await this.exchangeRateRepo.getLatestRate();

      // If no rate exists, create a default one
      if (!currentRate) {
        currentRate = await this.exchangeRateRepo.createRate({
          date: new Date(),
          rate: 5.10, // Default fallback rate
          type: 'OFFICIAL',
          source: 'default'
        });
      }

      res.json({
        success: true,
        data: currentRate
      });
    } catch (error) {
      console.error('Error getting current exchange rate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current exchange rate'
      });
    }
  };

  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required'
        });
        return;
      }

      const start = dayjs(startDate as string).toDate();
      const end = dayjs(endDate as string).toDate();

      const rates = await this.exchangeRateRepo.getRatesByDateRange(start, end);

      res.json({
        success: true,
        data: rates
      });
    } catch (error) {
      console.error('Error getting exchange rate history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get exchange rate history'
      });
    }
  };

  updateRate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, rate, type } = req.body;

      if (!date || !rate) {
        res.status(400).json({
          success: false,
          message: 'date and rate are required'
        });
        return;
      }

      const newRate = await this.exchangeRateRepo.createRate({
        date: dayjs(date).toDate(),
        rate: parseFloat(rate),
        type: type || 'OFFICIAL',
        source: 'manual'
      });

      res.json({
        success: true,
        data: newRate,
        message: 'Exchange rate updated successfully'
      });
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update exchange rate'
      });
    }
  };
}
