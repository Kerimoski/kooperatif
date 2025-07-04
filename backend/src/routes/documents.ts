// src/routes/documents.ts
import express from 'express';
import path from 'path';
import { getAllDocuments, uploadDocument, deleteDocument } from '../controllers/documentController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Tüm belgeleri getir (admin ve member)
router.get('/', authenticateToken, getAllDocuments);

// Belge yükle (sadece admin)
router.post('/', authenticateToken, requireAdmin, upload.single('file'), uploadDocument);

// Belge sil (sadece admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteDocument);

// Dosya serve etme (görüntüleme/indirme)
router.get('/file/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/documents', filename);
    
    // Dosyanın varlığını kontrol et
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Dosya bulunamadı'
      });
    }

    // Content-Type ayarla
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xls') contentType = 'application/vnd.ms-excel';
    else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.txt') contentType = 'text/plain';
    else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline'); // inline = sadece görüntüle, attachment = indir
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken hata oluştu'
    });
  }
});

export default router; 