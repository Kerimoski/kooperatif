import express from 'express';
import {
  getDailyMessages,
  getAllDailyMessages,
  createDailyMessage,
  updateDailyMessage,
  deleteDailyMessage,
  updateMessageOrder
} from '../controllers/dailyMessageController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Member: Aktif günlük mesajları getir (authentication gerekli)
router.get('/', authenticateToken, getDailyMessages);

// Admin: Tüm günlük mesajları getir (admin yetkisi gerekli)
router.get('/admin', authenticateToken, requireAdmin, getAllDailyMessages);

// Admin: Yeni günlük mesaj ekle (admin yetkisi gerekli)
router.post('/', authenticateToken, requireAdmin, createDailyMessage);

// Admin: Günlük mesaj güncelle (admin yetkisi gerekli)
router.put('/:id', authenticateToken, requireAdmin, updateDailyMessage);

// Admin: Günlük mesaj sil (admin yetkisi gerekli)
router.delete('/:id', authenticateToken, requireAdmin, deleteDailyMessage);

// Admin: Mesaj sırasını güncelle (admin yetkisi gerekli)
router.patch('/reorder', authenticateToken, requireAdmin, updateMessageOrder);

export default router; 