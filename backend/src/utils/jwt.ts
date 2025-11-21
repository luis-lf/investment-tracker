import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export class JWTUtil {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'your-secret-key-here-change-in-production') {
      throw new AppError('JWT_SECRET must be configured in production', 500);
    }
    return secret;
  }

  private static getExpiry(): string {
    return process.env.JWT_EXPIRY || '7d';
  }

  /**
   * Generate a JWT token for a user
   */
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.getSecret(), {
      expiresIn: this.getExpiry()
    } as any);
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.getSecret()) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      throw new AppError('Token verification failed', 401);
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}
