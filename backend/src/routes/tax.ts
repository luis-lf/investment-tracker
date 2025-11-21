import { Router } from 'express';
const router = Router();
router.get('/report', (_req, res) => res.json({ message: 'Tax report endpoint' }));
export default router;
