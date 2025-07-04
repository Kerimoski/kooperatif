import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { createDefaultAdmin } from './controllers/authController';

// Route imports
import authRoutes from './routes/authRoutes';
import commissionRoutes from './routes/commissionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import memberRoutes from './routes/memberRoutes';
import documentRoutes from './routes/documents';
import calendarRoutes from './routes/calendarRoutes';
import membershipRoutes from './routes/membershipRoutes';
import excelRoutes from './routes/excelRoutes';
import mailRoutes from './routes/mailRoutes';
import dailyMessageRoutes from './routes/dailyMessageRoutes';

// Environment variables yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Port 5001'e güncellendi

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/export', excelRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/daily-messages', dailyMessageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Eğitim Kooperatifi API çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Eğitim Kooperatifi Backend API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Sunucu hatası:', err);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası'
  });
});

// Veritabanı bağlantısını test et ve default admin oluştur
const startServer = async () => {
  try {
    // Veritabanı bağlantısını test et
    await testConnection();
    console.log('✅ Veritabanı bağlantısı başarılı');

    // Default admin oluştur
    await createDefaultAdmin();

    // Sunucuyu başlat
    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor`);
      console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Sunucu başlatılırken hata:', error);
    process.exit(1);
  }
};

startServer(); 