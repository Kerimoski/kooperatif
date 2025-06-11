import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getMemberDashboard,
  getAvailableCommissions,
  joinCommission,
  leaveCommission,
  getCommissionDetail
} from '../controllers/memberController';

const router = express.Router();

// Tüm member route'ları authentication gerektirir
router.use(authenticateToken);

// Dashboard verilerini getir
router.get('/dashboard', getMemberDashboard);

// Katılabileceği komisyonları getir
router.get('/commissions/available', getAvailableCommissions);

// Komisyona katıl
router.post('/commissions/:commissionId/join', joinCommission);

// Komisyondan ayrıl
router.delete('/commissions/:commissionId/leave', leaveCommission);

// Komisyon detayını getir (sadece üye olduğu komisyonlar)
router.get('/commissions/:commissionId/detail', getCommissionDetail);

export default router; 