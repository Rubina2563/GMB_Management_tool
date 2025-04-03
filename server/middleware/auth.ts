import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../auth';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use the authenticateToken middleware
    authenticateToken(req, res, (err?: Error) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // If we get here, the token was valid and the user is set in req
      next();
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

// Middleware to require admin role
export const requireAdminRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin role required'
    });
  }
  
  next();
};

// Middleware to require client role
export const requireClientRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'client' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Client role required'
    });
  }
  
  next();
};