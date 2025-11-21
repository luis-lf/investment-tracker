import { Knex } from 'knex';
import { getDatabase } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  isActive: boolean;
  role: 'USER' | 'ADMIN';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  passwordHash: string;
  name: string;
  role?: 'USER' | 'ADMIN';
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  role: 'USER' | 'ADMIN';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  private get db(): Knex {
    return getDatabase();
  }

  /**
   * Convert database row to User object (includes password hash)
   */
  private mapToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      isActive: row.is_active,
      role: row.role,
      lastLogin: row.last_login ? new Date(row.last_login) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Convert User to UserResponse (excludes password hash)
   */
  static toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async findAll(): Promise<User[]> {
    const results = await this.db('users')
      .orderBy('created_at', 'desc');
    return results.map(row => this.mapToUser(row));
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.db('users')
      .where('id', id)
      .first();

    return result ? this.mapToUser(result) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db('users')
      .where('email', email.toLowerCase())
      .first();

    return result ? this.mapToUser(result) : null;
  }

  async create(data: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new AppError('User with this email already exists', 409);
    }

    const [id] = await this.db('users').insert({
      email: data.email.toLowerCase(),
      password_hash: data.passwordHash,
      name: data.name,
      role: data.role || 'USER',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    const created = await this.findById(id);
    if (!created) {
      throw new AppError('Failed to create user', 500);
    }

    return created;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const dbData: any = {
      updated_at: new Date()
    };

    if (data.email !== undefined) dbData.email = data.email.toLowerCase();
    if (data.passwordHash !== undefined) dbData.password_hash = data.passwordHash;
    if (data.name !== undefined) dbData.name = data.name;
    if (data.isActive !== undefined) dbData.is_active = data.isActive;
    if (data.role !== undefined) dbData.role = data.role;
    if (data.lastLogin !== undefined) dbData.last_login = data.lastLogin;

    await this.db('users')
      .where('id', id)
      .update(dbData);

    const updated = await this.findById(id);
    if (!updated) {
      throw new AppError('User not found', 404);
    }

    return updated;
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.db('users')
      .where('id', id)
      .update({
        last_login: new Date()
      });
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.db('users')
      .where('id', id)
      .delete();

    if (deleted === 0) {
      throw new AppError('User not found', 404);
    }
  }

  async count(): Promise<number> {
    const result = await this.db('users').count('* as count').first();
    return result ? Number(result.count) : 0;
  }
}
