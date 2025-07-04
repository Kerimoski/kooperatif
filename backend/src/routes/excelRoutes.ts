import express from 'express';
import { exportFeesExcel } from '../controllers/excelController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Excel export routes (sadece admin)
router.get('/fees', authenticateToken, requireAdmin, exportFeesExcel);

export default router; 