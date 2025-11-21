import bcrypt from 'bcryptjs';
import { UserRepository, CreateUserDto, User, UserResponse } from '../repositories/UserRepository';
import { JWTUtil } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export class UserService {
  private get repository(): UserRepository {
    return new UserRepository();
  }

  private async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    return bcrypt.hash(password, rounds);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateAuthResponse(user: User): AuthResponse {
    const token = JWTUtil.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: UserRepository.toUserResponse(user),
      token
    };
  }

  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Validate password strength
    if (data.password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const createDto: CreateUserDto = {
      email: data.email,
      passwordHash,
      name: data.name,
      role: 'USER'
    };

    const user = await this.repository.create(createDto);

    // Update last login
    await this.repository.updateLastLogin(user.id);

    // Generate token and return
    return this.generateAuthResponse(user);
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    // Find user by email
    const user = await this.repository.findByEmail(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await this.repository.updateLastLogin(user.id);

    // Generate token and return
    return this.generateAuthResponse(user);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: number): Promise<UserResponse> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return UserRepository.toUserResponse(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, data: { name?: string; email?: string }): Promise<UserResponse> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If email is being changed, check if it's already taken
    if (data.email && data.email !== user.email) {
      const existing = await this.repository.findByEmail(data.email);
      if (existing) {
        throw new AppError('Email already in use', 409);
      }
    }

    const updated = await this.repository.update(userId, data);
    return UserRepository.toUserResponse(updated);
  }

  /**
   * Change password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await this.comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Hash and update password
    const passwordHash = await this.hashPassword(newPassword);
    await this.repository.update(userId, { passwordHash });
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.repository.findAll();
    return users.map(user => UserRepository.toUserResponse(user));
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(userId: number): Promise<void> {
    await this.repository.update(userId, { isActive: false });
  }

  /**
   * Activate user (admin only)
   */
  async activateUser(userId: number): Promise<void> {
    await this.repository.update(userId, { isActive: true });
  }
}
