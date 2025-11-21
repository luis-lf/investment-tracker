import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class AuthController {
  private get service(): UserService {
    return new UserService();
  }

  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    const result = await this.service.register({ email, password, name });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  };

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const result = await this.service.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  };

  /**
   * GET /api/v1/auth/profile
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const profile = await this.service.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: profile
    });
  };

  /**
   * PUT /api/v1/auth/profile
   * Update current user profile
   */
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { name, email } = req.body;
    const profile = await this.service.updateProfile(req.user.userId, { name, email });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  };

  /**
   * POST /api/v1/auth/change-password
   * Change user password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    await this.service.changePassword(req.user.userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  };

  /**
   * GET /api/v1/auth/verify
   * Verify token (useful for frontend to check if token is still valid)
   */
  verifyToken = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role
      }
    });
  };
}
