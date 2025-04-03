/**
 * Post Analytics Routes
 * 
 * API endpoints for post analytics and posting schedule optimization
 */

import express, { Request, Response } from 'express';
import { postAnalyticsService } from './post-analytics-service';
import { requireAuth } from '../middleware/auth';

export const router = express.Router();

/**
 * Get optimized posting schedule based on real metrics data
 * 
 * @route GET /api/client/posts/analytics/:locationId
 * @param locationId - The Google Business Profile location ID
 * @returns PostingTimeAnalysis object
 */
router.get('/analytics/:locationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const locationId = req.params.locationId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated'
      });
    }
    
    if (!locationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Location ID is required'
      });
    }
    
    // Get the posting time analysis
    const analysis = await postAnalyticsService.getPostAnalytics(userId, locationId);
    
    return res.status(200).json({
      success: true,
      message: 'Post analytics retrieved successfully',
      data: analysis
    });
  } catch (error) {
    console.error('Error retrieving post analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve post analytics',
      error: (error as Error).message
    });
  }
});