/**
 * Admin Routes
 * Handles API routes for admin-only functionality
 */

import express, { Router, Response } from 'express';
import { authenticateToken, requireAdmin } from '../auth';
import { storage } from '../db';

const router: Router = express.Router();

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Get clients (admin only)
 * GET /api/admin/clients
 */
router.get('/clients', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    
    // Filter only clients and remove passwords
    const clients = users
      .filter(user => user.role === 'client')
      .map(user => {
        const { password, ...clientWithoutPassword } = user;
        return clientWithoutPassword;
      });
    
    res.status(200).json({
      success: true,
      message: 'Clients retrieved successfully',
      clients,
      totalClients: clients.length
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching clients"
    });
  }
});

export default router;