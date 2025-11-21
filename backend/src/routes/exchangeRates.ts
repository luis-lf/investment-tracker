import { Router } from 'express';
import { ExchangeRateController } from '../controllers/ExchangeRateController';
import { validateUpdateRate, validateGetHistory } from '../validators/exchangeRateValidator';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const exchangeRateController = new ExchangeRateController();

// Apply authentication to all exchange rate routes
router.use(authenticate);

// Get current exchange rate
router.get('/current', asyncHandler(exchangeRateController.getCurrent));

// Get historical rates
router.get('/history', validateGetHistory, asyncHandler(exchangeRateController.getHistory));

// Update/create exchange rate
router.post('/', validateUpdateRate, asyncHandler(exchangeRateController.updateRate));

export default router;
