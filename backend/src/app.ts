import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route imports
import authRoutes from './routes/authRoutes';
import commissionRoutes from './routes/commissionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import documentRoutes from './routes/documents';
import memberRoutes from './routes/memberRoutes';
import calendarRoutes from './routes/calendarRoutes';
import membershipRoutes from './routes/membershipRoutes';
import mailRoutes from './routes/mailRoutes';
import dailyMessageRoutes from './routes/dailyMessageRoutes';

dotenv.config();

const app = express();

// Middleware - CORS configuration
const corsOptions = {
  origin: [
    'https://koop.bbomizmir.org',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/daily-messages', dailyMessageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Koop API çalışıyor', 
    timestamp: new Date().toISOString(),
    routes: {
      dailyMessages: '/api/daily-messages',
      auth: '/api/auth',
      member: '/api/member'
    }
  });
});

export default app; 