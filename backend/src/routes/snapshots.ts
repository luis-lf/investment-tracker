import { Router } from 'express';
import { SnapshotController } from '../controllers/SnapshotController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const snapshotController = new SnapshotController();

// Get snapshots for an investment
router.get('/investment/:investmentId', asyncHandler(snapshotController.getByInvestmentId));

// Create a single snapshot
router.post('/', asyncHandler(snapshotController.createSnapshot));

// Bulk update snapshots for a month
router.post('/bulk-update', asyncHandler(snapshotController.bulkUpdateSnapshots));

// Get monthly snapshot
router.get('/monthly', asyncHandler(snapshotController.getMonthlySnapshot));

export default router;
