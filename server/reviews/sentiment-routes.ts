/**
 * Sentiment Analysis Routes
 * Handles API routes for review sentiment analysis using Google Natural Language API
 * with fallback to natural package for local sentiment analysis
 */
import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { reviewsService } from './reviews-service';
import { sentimentService } from './sentiment-service';
import { dbService } from '../db';

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
 * Analyze sentiment of reviews for a location
 * GET /api/client/reviews/:locationId/sentiment
 */
router.get('/:locationId/sentiment', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const locationId = req.params.locationId;
    
    // Get reviews for the location
    const reviewsData = await reviewsService.getReviews(userId, locationId);
    
    // Analyze sentiment of the reviews
    try {
      // Attempt to analyze sentiment - this will work with or without the Google API
      // thanks to our robust fallback system
      const sentimentAnalysis = await sentimentService.analyzeSentiment(userId, reviewsData.reviews);
      
      // Check if the API key is missing but we still have a result (used fallback)
      const apiKeys = await dbService.getApiKeys(userId);
      const usingGoogleAPI = !!apiKeys?.google_api_key;
      
      // Always return a 200 since we'll have a result regardless
      res.status(200).json({
        success: true,
        message: usingGoogleAPI 
          ? 'Review sentiment analysis completed successfully using Google API'
          : 'Review sentiment analysis completed using built-in analysis (Google API not configured)',
        usingGoogleAPI,
        sentimentAnalysis
      });
    } catch (error: any) {
      console.error("Error in sentiment analysis route:", error);
      
      // If Google API key is missing but this shouldn't happen anymore with our fallbacks
      if (error.message === "Google Natural Language API not configured") {
        // Still ask the client to configure the API for better results
        console.log("Google Natural Language API not configured, advising user to configure");
        return res.status(200).json({
          success: true,
          warningMessage: "For better results, configure Google Natural Language API",
          action: "suggest_configure_api",
          sentimentAnalysis: {
            sentimentDistribution: reviewsData.sentiment,
            keyPhrases: {
              positive: [],
              neutral: [],
              negative: []
            }
          }
        });
      }
      
      // In case all fallbacks fail (which is unlikely), use the basic sentiment data from reviews
      res.status(200).json({
        success: true,
        message: 'Using basic sentiment data (all analysis methods failed)',
        sentimentAnalysis: {
          sentimentDistribution: reviewsData.sentiment,
          keyPhrases: {
            positive: [],
            neutral: [],
            negative: []
          }
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze review sentiment'
    });
  }
});

export default router;