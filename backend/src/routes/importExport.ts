import { Router } from 'express';
const router = Router();
router.post('/import', (_req, res) => res.json({ message: 'Import endpoint' }));
router.get('/export', (_req, res) => res.json({ message: 'Export endpoint' }));
export default router;
