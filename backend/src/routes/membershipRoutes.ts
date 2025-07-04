import express from 'express';
import {
  getAllPlans,
  createPlan,
  deletePlan,
  getUserFees,
  getAllFees,
  createFee,
  deleteFee,
  getFeeGroup,
  recordPayment,
  recordBulkPayment,
  getFeeStats,
  getMemberStats,
  createBulkFees,
  setAutomaticFees,
  getAutomaticFees,
  applyLateFees,
  sendFeeReminders
} from '../controllers/membershipController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Aidat planları
router.get('/plans', getAllPlans);
router.post('/plans', authenticateToken, requireAdmin, createPlan);
router.delete('/plans/:planId', authenticateToken, requireAdmin, deletePlan);

// Aidat yönetimi
router.get('/fees', authenticateToken, requireAdmin, getAllFees);
router.get('/fees/user/:targetUserId?', authenticateToken, getUserFees);
router.get('/fees/group/:userId/:planId', authenticateToken, requireAdmin, getFeeGroup);
router.post('/fees', authenticateToken, requireAdmin, createFee);
router.delete('/fees/:feeId', authenticateToken, requireAdmin, deleteFee);

// Ödeme işlemleri
router.post('/payments', authenticateToken, requireAdmin, recordPayment);
router.post('/payments/bulk', authenticateToken, requireAdmin, recordBulkPayment);

// İstatistikler
router.get('/stats', authenticateToken, requireAdmin, getFeeStats);
router.get('/member-stats', authenticateToken, getMemberStats);

// Gelişmiş Aidat Yönetimi
router.post('/fees/bulk', authenticateToken, requireAdmin, createBulkFees);
router.post('/fees/late-fee', authenticateToken, requireAdmin, applyLateFees);
router.post('/fees/reminders', authenticateToken, requireAdmin, sendFeeReminders);

// Otomatik Aidat Sistemi
router.get('/automatic', authenticateToken, requireAdmin, getAutomaticFees);
router.post('/automatic', authenticateToken, requireAdmin, setAutomaticFees);

export default router; 