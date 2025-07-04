import express from 'express';
import { login, register, getProfile, updateUser, deleteUser, deactivateUser, changePassword, importUsersFromExcel } from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadExcel } from '../middleware/upload';

const router = express.Router();

// Login
router.post('/login', login);

// Register (sadece admin)
router.post('/register', authenticateToken, requireAdmin, register);

// Get profile
router.get('/profile', authenticateToken, getProfile);

// Change password (üye kendi şifresini değiştirebilir)
router.post('/change-password', authenticateToken, changePassword);

// Update user (admin: tüm kullanıcılar, member: kendi profili)
router.put('/users/:userId', authenticateToken, updateUser);

// Deactivate user (sadece admin)
router.patch('/users/:userId/deactivate', authenticateToken, requireAdmin, deactivateUser);

// Delete user completely (sadece admin)
router.delete('/users/:userId', authenticateToken, requireAdmin, deleteUser);

// Excel ile toplu kullanıcı oluşturma (sadece admin)
router.post('/users/excel-import', authenticateToken, requireAdmin, uploadExcel, importUsersFromExcel);

export default router; 