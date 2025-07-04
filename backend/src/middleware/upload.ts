import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Upload klasörünü oluştur
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Güvenli dosya ismi oluştur
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9\u00C0-\u017F.-]/g, '_')
      .replace(/_+/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(sanitizedName);
    const baseName = path.basename(sanitizedName, extension);
    cb(null, `${baseName}_${uniqueSuffix}${extension}`);
  }
});

// Dosya filtresi
const fileFilter = (req: any, file: any, cb: any) => {
  // İzin verilen dosya tipleri
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı'), false);
  }
};

// Multer instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}); 

// Bellekte sakla (dosyayı diske yazmadan)
const storageExcel = multer.memoryStorage();

// Dosya türü kontrolü
const fileFilterExcel = (req: any, file: any, cb: any) => {
  // Excel dosyalarını kabul et
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
    file.mimetype === 'application/vnd.ms-excel' || // .xls
    file.mimetype === 'text/csv' // .csv
  ) {
    cb(null, true);
  } else {
    cb(new Error('Sadece Excel (.xlsx, .xls) ve CSV dosyaları kabul edilir'), false);
  }
};

// Multer yapılandırması
export const uploadExcel = multer({
  storage: storageExcel,
  fileFilter: fileFilterExcel,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('excel'); // 'excel' field adı 