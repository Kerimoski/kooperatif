import express from 'express';
import {
  sendAnnouncement,
  sendFeeReminders,
  getMailHistory,
  getMailStats
} from '../controllers/mailController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Duyuru gönderme (sadece admin)
router.post('/announcement', authenticateToken, requireAdmin, sendAnnouncement);

// Aidat hatırlatması gönderme (sadece admin)
router.post('/fee-reminders', authenticateToken, requireAdmin, sendFeeReminders);

// Mail geçmişi (sadece admin)
router.get('/history', authenticateToken, requireAdmin, getMailHistory);

// Mail istatistikleri (sadece admin)
router.get('/stats', authenticateToken, requireAdmin, getMailStats);

export default router; 