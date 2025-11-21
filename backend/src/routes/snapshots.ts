import { Router } from 'express';
import { SnapshotController } from '../controllers/SnapshotController';
import {
  validateCreateSnapshot,
  validateBulkUpdate,
  validateGetByInvestmentId,
  validateGetMonthlySnapshot
} from '../validators/snapshotValidator';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const snapshotController = new SnapshotController();

// Apply authentication to all snapshot routes
router.use(authenticate);

// Get snapshots for an investment
router.get('/investment/:investmentId', validateGetByInvestmentId, asyncHandler(snapshotController.getByInvestmentId));

// Get monthly snapshot
router.get('/monthly', validateGetMonthlySnapshot, asyncHandler(snapshotController.getMonthlySnapshot));

// Create a single snapshot
router.post('/', validateCreateSnapshot, asyncHandler(snapshotController.createSnapshot));

// Bulk update snapshots for a month
router.post('/bulk-update', validateBulkUpdate, asyncHandler(snapshotController.bulkUpdateSnapshots));

export default router;
