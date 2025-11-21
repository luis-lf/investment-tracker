import { Router } from 'express';
import { InvestmentController } from '../controllers/InvestmentController';
import { validateInvestment } from '../validators/investmentValidator';
import { validateIdParam, validateCodigoParam } from '../validators/commonValidator';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const controller = new InvestmentController();

// Apply authentication to all investment routes
router.use(authenticate);

// GET /api/v1/investments
router.get('/', asyncHandler(controller.getAllInvestments));

// GET /api/v1/investments/summary
router.get('/summary', asyncHandler(controller.getInvestmentsSummary));

// GET /api/v1/investments/upcoming-maturities
router.get('/upcoming-maturities', asyncHandler(controller.getUpcomingMaturities));

// GET /api/v1/investments/search?q=term
router.get('/search', asyncHandler(controller.searchInvestments));

// GET /api/v1/investments/:id
router.get('/:id', validateIdParam, asyncHandler(controller.getInvestmentById));

// GET /api/v1/investments/codigo/:codigo
router.get('/codigo/:codigo', validateCodigoParam, asyncHandler(controller.getInvestmentByCodigo));

// POST /api/v1/investments
router.post('/', validateInvestment, asyncHandler(controller.createInvestment));

// PUT /api/v1/investments/:id
router.put('/:id', validateIdParam, validateInvestment, asyncHandler(controller.updateInvestment));

// POST /api/v1/investments/:id/mark-done
router.post('/:id/mark-done', validateIdParam, asyncHandler(controller.markAsDone));

// DELETE /api/v1/investments/:id
router.delete('/:id', validateIdParam, asyncHandler(controller.deleteInvestment));

export default router;
