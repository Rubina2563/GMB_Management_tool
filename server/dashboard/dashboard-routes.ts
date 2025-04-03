/**
 * Dashboard Routes
 * Handles API routes for local dashboard functionality
 */

import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { dashboardService } from './dashboard-service';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Get dashboard data for authenticated user
 * GET /api/client/dashboard
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Extract query parameters for filtering
    const gbpId = req.query.gbp_id ? parseInt(req.query.gbp_id as string) : undefined;
    const timeframe = req.query.timeframe as string || '7days';

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get dashboard data from service
    const dashboardData = await dashboardService.getDashboardData(
      req.user.id,
      gbpId,
      timeframe
    );

    // Return success response with data
    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * Get all connected GBP locations for selection
 * GET /api/client/dashboard/locations
 */
router.get('/locations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get all connected GBP locations for this user
    const userId = req.user.id;
    const dashboardData = await dashboardService.getDashboardData(userId);
    
    // Return just the locations part
    return res.status(200).json({
      success: true,
      data: {
        locations: dashboardData.locations
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch locations'
    });
  }
});

export default router;