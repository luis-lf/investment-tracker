import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const dashboardController = new DashboardController();

// Get dashboard summary
router.get('/summary', asyncHandler(dashboardController.getSummary));

// Get portfolio evolution
router.get('/evolution', asyncHandler(dashboardController.getEvolution));

// Get asset allocation
router.get('/allocation', asyncHandler(dashboardController.getAllocation));

export default router;
