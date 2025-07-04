import express from 'express';
import { getDashboardStats, getAllUsers } from '../controllers/dashboardController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Dashboard istatistiklerini getir (sadece admin)
router.get('/stats', authenticateToken, requireAdmin, getDashboardStats);

// Tüm kullanıcıları getir (sadece admin)
router.get('/users', authenticateToken, requireAdmin, getAllUsers);

export default router; 