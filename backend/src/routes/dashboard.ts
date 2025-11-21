import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const dashboardController = new DashboardController();

// Apply authentication to all dashboard routes
router.use(authenticate);

// Get dashboard summary
router.get('/summary', asyncHandler(dashboardController.getSummary));

// Get portfolio evolution
router.get('/evolution', asyncHandler(dashboardController.getEvolution));

// Get asset allocation
router.get('/allocation', asyncHandler(dashboardController.getAllocation));

export default router;
