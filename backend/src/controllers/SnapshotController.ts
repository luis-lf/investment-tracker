import { Request, Response } from 'express';
import { SnapshotRepository } from '../repositories/SnapshotRepository';
import { InvestmentRepository } from '../repositories/InvestmentRepository';
import { InvestmentStatus } from '../../../shared/types';
import dayjs from 'dayjs';

export class SnapshotController {
  private get snapshotRepo(): SnapshotRepository {
    return new SnapshotRepository();
  }

  private get investmentRepo(): InvestmentRepository {
    return new InvestmentRepository();
  }

  getByInvestmentId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { investmentId } = req.params;

      if (!investmentId) {
        res.status(400).json({
          success: false,
          message: 'Investment ID is required'
        });
        return;
      }

      const snapshots = await this.snapshotRepo.findByInvestmentId(parseInt(investmentId));

      res.json({
        success: true,
        data: snapshots
      });
    } catch (error) {
      console.error('Error getting snapshots:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get snapshots'
      });
    }
  };

  createSnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const { investmentId, snapshotDate, valueOriginal, currency, status } = req.body;

      if (!investmentId || !snapshotDate || valueOriginal === undefined) {
        res.status(400).json({
          success: false,
          message: 'investmentId, snapshotDate, and valueOriginal are required'
        });
        return;
      }

      const snapshot = await this.snapshotRepo.create({
        investmentId: parseInt(investmentId),
        snapshotDate: dayjs(snapshotDate).toDate(),
        valueOriginal: parseFloat(valueOriginal),
        currency: currency || 'BRL',
        status: status || InvestmentStatus.ACTIVE
      });

      res.json({
        success: true,
        data: snapshot,
        message: 'Snapshot created successfully'
      });
    } catch (error) {
      console.error('Error creating snapshot:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create snapshot'
      });
    }
  };

  bulkUpdateSnapshots = async (req: Request, res: Response): Promise<void> => {
    try {
      const { month, updates } = req.body;

      if (!month || !updates || !Array.isArray(updates)) {
        res.status(400).json({
          success: false,
          message: 'month and updates array are required'
        });
        return;
      }

      const snapshotDate = dayjs(month).toDate();

      const snapshots = updates.map((update: any) => ({
        investmentId: parseInt(update.investmentId),
        snapshotDate,
        valueOriginal: parseFloat(update.value),
        currency: update.currency || 'BRL',
        status: update.status || InvestmentStatus.ACTIVE
      }));

      await this.snapshotRepo.bulkCreate(snapshots);

      res.json({
        success: true,
        message: `Successfully created ${snapshots.length} snapshots`
      });
    } catch (error) {
      console.error('Error bulk updating snapshots:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update snapshots'
      });
    }
  };

  getMonthlySnapshot = async (req: Request, res: Response): Promise<void> => {
    try {
      const { month } = req.query;

      if (!month) {
        res.status(400).json({
          success: false,
          message: 'month parameter is required'
        });
        return;
      }

      // TODO: Implement date filtering using month parameter
      // Get all active investments
      const investments = await this.investmentRepo.getActiveInvestments();

      // Get latest snapshot for each investment
      const snapshotData = [];
      for (const investment of investments) {
        const snapshot = await this.snapshotRepo.getLatestSnapshot(investment.id!);
        if (snapshot) {
          snapshotData.push(snapshot);
        }
      }

      res.json({
        success: true,
        data: snapshotData
      });
    } catch (error) {
      console.error('Error getting monthly snapshot:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get monthly snapshot'
      });
    }
  };
}
