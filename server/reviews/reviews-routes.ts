/**
 * Reviews Routes
 * Handles API routes for review analysis and management
 */

import express, { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { reviewsService } from './reviews-service';

// Add type for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

const router: Router = express.Router();

/**
 * Analyze reviews for a GBP location
 * GET /api/client/reviews/analyze/:locationId
 */
router.get('/analyze/:locationId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const locationId = parseInt(req.params.locationId);
    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const analysisResult = await reviewsService.analyzeReviews(userId, locationId);
    
    return res.status(200).json({
      success: true,
      message: 'Reviews analyzed successfully',
      data: analysisResult
    });
  } catch (error) {
    console.error('Error analyzing reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze reviews'
    });
  }
});

/**
 * Generate response suggestion for a specific review
 * POST /api/client/reviews/suggest-response
 */
router.post('/suggest-response', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { reviewId, reviewText, reviewerName, rating } = req.body;
    
    if (!reviewId || !reviewText || !reviewerName || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const responseSuggestion = await reviewsService.generateResponseSuggestion(
      userId,
      reviewId,
      reviewText,
      reviewerName,
      rating
    );
    
    return res.status(200).json({
      success: true,
      message: 'Response suggestion generated successfully',
      suggestion: responseSuggestion
    });
  } catch (error) {
    console.error('Error generating response suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate response suggestion'
    });
  }
});

export default router;