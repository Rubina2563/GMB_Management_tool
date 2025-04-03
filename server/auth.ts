import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '@shared/schema';

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;
// Token expiration time (1 hour)
const TOKEN_EXPIRATION = '1h';

// Hash a password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

// Compare a password with a hashed password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate a JWT token
export const generateToken = (user: Omit<User, 'password'>): string => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name || '',
    role: user.role,
    subscription_plan: user.subscription_plan,
    subscription_status: user.subscription_status,
    subscription_expiry: user.subscription_expiry ? user.subscription_expiry.toISOString() : null,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

// Verify a JWT token
export const verifyToken = (token: string): { 
  id: number; 
  username: string; 
  email: string;
  first_name: string;
  role: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_expiry: string | null;
} | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { 
      id: number; 
      username: string; 
      email: string; 
      first_name: string;
      role: string;
      subscription_plan: string;
      subscription_status: string;
      subscription_expiry: string | null;
    };
  } catch (error) {
    return null;
  }
};

// Middleware to authenticate requests
export const authenticateToken = (req: any, res: any, next: any) => {
  // Get the token from authorization header or cookie
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  const user = verifyToken(token);
  
  if (!user) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }

  // Add user info to the request
  req.user = user;
  next();
};

// Middleware to check if user is an admin
export const requireAdmin = (req: any, res: any, next: any) => {
  // First authenticate the user
  authenticateToken(req, res, () => {
    // Check if user exists and has admin role
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
  });
};