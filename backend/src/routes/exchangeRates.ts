import { Router } from 'express';
import { ExchangeRateController } from '../controllers/ExchangeRateController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const exchangeRateController = new ExchangeRateController();

// Get current exchange rate
router.get('/current', asyncHandler(exchangeRateController.getCurrent));

// Get historical rates
router.get('/history', asyncHandler(exchangeRateController.getHistory));

// Update/create exchange rate
router.post('/', asyncHandler(exchangeRateController.updateRate));

export default router;
