/**
 * GBP Insights Routes
 * Handles API routes for generating and retrieving strategic optimization insights
 */

import express, { Request, Response, Router } from 'express';
import { authenticateToken } from '../auth';
import { insightsService } from './insights-service';

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
 * Generate new insights for a GBP location
 * POST /api/client/optimization/insights/:gbpId
 */
router.post('/insights/:gbpId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const gbpId = parseInt(req.params.gbpId);
    if (isNaN(gbpId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GBP ID'
      });
    }

    // Generate insights (costs 1 credit)
    const insights = await insightsService.generateInsights(req.user.id, gbpId);
    
    if (!insights) {
      return res.status(402).json({
        success: false,
        message: 'Not enough credits to generate insights'
      });
    }

    // Get updated credit balance
    const creditsRemaining = await insightsService.getUserCredits(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Insights generated successfully',
      insights,
      credits: {
        used: insights.credits_used,
        remaining: creditsRemaining
      }
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating insights'
    });
  }
});

/**
 * Get latest insights for a GBP location
 * GET /api/client/optimization/insights/:gbpId
 */
router.get('/insights/:gbpId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const gbpId = parseInt(req.params.gbpId);
    if (isNaN(gbpId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GBP ID'
      });
    }

    // Get latest insights
    const insights = await insightsService.getLatestInsights(req.user.id, gbpId);
    
    if (!insights) {
      return res.status(404).json({
        success: false,
        message: 'No insights found for this location'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Insights retrieved successfully',
      insights
    });
  } catch (error) {
    console.error('Error retrieving insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving insights'
    });
  }
});

/**
 * Get user's credit balance
 * GET /api/client/optimization/credits
 */
router.get('/credits', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get credit balance
    const credits = await insightsService.getUserCredits(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Credits retrieved successfully',
      credits
    });
  } catch (error) {
    console.error('Error retrieving credits:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving credits'
    });
  }
});

export default router;