import { Request, Response } from 'express';
import { InvestmentService } from '../services/InvestmentService';
import { CreateInvestmentDto, Country, InvestmentStatus } from '../../../shared/types';
import { AppError } from '../middleware/errorHandler';

export class InvestmentController {
  private get investmentService(): InvestmentService {
    return new InvestmentService();
  }

  getAllInvestments = async (req: Request, res: Response): Promise<void> => {
    const { country, status, account, type } = req.query;

    const filters = {
      country: country as Country,
      status: status as InvestmentStatus,
      account: account as string,
      type: type as string
    };

    const investments = await this.investmentService.getAllInvestments(filters);
    
    res.json({
      success: true,
      data: investments,
      count: investments.length
    });
  };

  getInvestmentById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const investment = await this.investmentService.getInvestmentById(parseInt(id));
    
    res.json({
      success: true,
      data: investment
    });
  };

  getInvestmentByCodigo = async (req: Request, res: Response): Promise<void> => {
    const { codigo } = req.params;
    const investment = await this.investmentService.getInvestmentByCodigo(codigo);
    
    res.json({
      success: true,
      data: investment
    });
  };

  createInvestment = async (req: Request, res: Response): Promise<void> => {
    const data: CreateInvestmentDto = req.body;
    const investment = await this.investmentService.createInvestment(data);
    
    res.status(201).json({
      success: true,
      data: investment,
      message: 'Investment created successfully'
    });
  };

  updateInvestment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const data = req.body;
    
    const investment = await this.investmentService.updateInvestment(parseInt(id), data);
    
    res.json({
      success: true,
      data: investment,
      message: 'Investment updated successfully'
    });
  };

  markAsDone = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { finalValue, saleDate } = req.body;

    if (!finalValue) {
      throw new AppError('Final value is required', 400);
    }

    const investment = await this.investmentService.markInvestmentAsDone(
      parseInt(id),
      finalValue,
      saleDate ? new Date(saleDate) : undefined
    );
    
    res.json({
      success: true,
      data: investment,
      message: 'Investment marked as done successfully'
    });
  };

  deleteInvestment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.investmentService.deleteInvestment(parseInt(id));
    
    res.json({
      success: true,
      message: 'Investment deleted successfully'
    });
  };

  getInvestmentsSummary = async (_req: Request, res: Response): Promise<void> => {
    const summary = await this.investmentService.getActiveInvestmentsSummary();

    res.json({
      success: true,
      data: summary
    });
  };

  getUpcomingMaturities = async (req: Request, res: Response): Promise<void> => {
    const { days = 30 } = req.query;
    const investments = await this.investmentService.getUpcomingMaturities(parseInt(days as string));
    
    res.json({
      success: true,
      data: investments,
      count: investments.length
    });
  };

  searchInvestments = async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query;
    
    if (!q) {
      throw new AppError('Search query is required', 400);
    }

    const investments = await this.investmentService.searchInvestments(q as string);
    
    res.json({
      success: true,
      data: investments,
      count: investments.length
    });
  };
}
