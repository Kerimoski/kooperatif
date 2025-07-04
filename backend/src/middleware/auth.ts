import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt';

// Request interface'ini genişletiyoruz
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Yetkisiz erişim',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama gerekli'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin yetkisi gerekli'
    });
    return;
  }

  next();
};

export const requireMember = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama gerekli'
    });
    return;
  }

  if (req.user.role !== 'member' && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Üye yetkisi gerekli'
    });
    return;
  }

  next();
}; 