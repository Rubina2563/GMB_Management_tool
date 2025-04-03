/**
 * Performance Routes
 * 
 * API routes for accessing performance metrics and insights for GBP profiles.
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { performanceService } from './performance-service';

// Create a router
const router = Router();

/**
 * GET /api/client/performance/metrics/:locationId
 * Get performance metrics for a specific location
 */
router.get('/metrics/:locationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.locationId, 10);
    const timeframe = req.query.timeframe === '6m' ? '6m' : '3m';
    
    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }
    
    const performanceData = await performanceService.getPerformanceMetrics(locationId, timeframe);
    
    res.status(200).json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: performanceData
    });
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve performance metrics'
    });
  }
});

export const performanceRoutes = router;