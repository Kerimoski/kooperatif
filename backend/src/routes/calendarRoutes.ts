import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { 
  getAllEvents, 
  getEventsByDate, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getEventById 
} from '../controllers/calendarController';

const router = express.Router();

// Tüm route'lar için authentication zorunlu
router.use(authenticateToken);

// GET /api/calendar - Tüm takvim etkinliklerini getir (filtreleme ile)
router.get('/', getAllEvents);

// GET /api/calendar/:id - Belirli bir etkinliği getir
router.get('/:id', getEventById);

// GET /api/calendar/date/:date - Belirli bir tarihteki etkinlikleri getir
router.get('/date/:date', getEventsByDate);

// POST /api/calendar - Yeni takvim etkinliği oluştur (sadece admin)
router.post('/', requireAdmin, createEvent);

// PUT /api/calendar/:id - Takvim etkinliğini güncelle (admin veya oluşturan kişi)
router.put('/:id', updateEvent);

// DELETE /api/calendar/:id - Takvim etkinliğini sil (admin veya oluşturan kişi)
router.delete('/:id', deleteEvent);

export default router; 