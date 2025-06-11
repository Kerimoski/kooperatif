import express from 'express';
import { 
  getAllCommissions, 
  createCommission, 
  getCommissionMembers, 
  addMemberToCommission, 
  removeMemberFromCommission,
  updateCommission,
  deleteCommission,
  promoteToManager,
  demoteManager,
  getPendingApplications,
  approveApplication,
  rejectApplication
} from '../controllers/commissionController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Tüm komisyonları getir
router.get('/', authenticateToken, getAllCommissions);

// Yeni komisyon oluştur (sadece admin)
router.post('/', authenticateToken, requireAdmin, createCommission);

// Komisyon üyelerini getir
router.get('/:commissionId/members', authenticateToken, getCommissionMembers);

// Komisyona üye ekle (sadece admin)
router.post('/:commissionId/members', authenticateToken, requireAdmin, addMemberToCommission);

// Komisyondan üye çıkar (sadece admin)
router.delete('/:commissionId/members/:userId', authenticateToken, requireAdmin, removeMemberFromCommission);

// Komisyon güncelle (sadece admin)
router.put('/:commissionId', authenticateToken, requireAdmin, updateCommission);

// Komisyon sil (sadece admin)
router.delete('/:commissionId', authenticateToken, requireAdmin, deleteCommission);

// Komisyon yöneticisi ata (sadece admin)
router.post('/:commissionId/promote/:userId', authenticateToken, requireAdmin, promoteToManager);

// Komisyon yöneticisini geri al (sadece admin)
router.delete('/:commissionId/demote/:userId', authenticateToken, requireAdmin, demoteManager);

// Bekleyen başvuruları getir (komisyon yöneticisi)
router.get('/:commissionId/pending', authenticateToken, getPendingApplications);

// Başvuruyu onayla (komisyon yöneticisi)
router.post('/:commissionId/approve/:applicationUserId', authenticateToken, approveApplication);

// Başvuruyu reddet (komisyon yöneticisi)
router.delete('/:commissionId/reject/:applicationUserId', authenticateToken, rejectApplication);

export default router; 