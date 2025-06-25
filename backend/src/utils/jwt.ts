import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { SignOptions } from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'admin' | 'member';
}

export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: '24h',
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Geçersiz token');
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new Error('Authorization header bulunamadı');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Geçersiz authorization format');
  }

  return authHeader.substring(7);
}; 