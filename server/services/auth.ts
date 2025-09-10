import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from '../storage.js';
import type { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export async function registerUser(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists'
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name
    });

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return {
      success: true,
      user: { ...user, password: undefined } as User,
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed'
    };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return {
      success: true,
      user: { ...user, password: undefined } as User,
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed'
    };
  }
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUser(decoded.userId);
    return user ? { ...user, password: undefined } as User : null;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
