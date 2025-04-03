/**
 * Keywords Routes
 * Handles API routes for keyword analysis and optimization
 */

import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { keywordsService } from './keywords-service';
import { storage } from '../storage';
import { KeywordOptimization, OptimizationStatus } from '@shared/schema';

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
 * Analyze keywords for a GBP location
 * POST /api/client/keywords/analyze/:locationId
 */
router.post('/analyze/:locationId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const locationId = parseInt(req.params.locationId);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (isNaN(locationId)) {
      return res.status(400).json({ success: false, message: 'Invalid location ID' });
    }

    // Check if the location exists and belongs to the user
    const location = await storage.getGbpLocation(locationId);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (location.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this location' });
    }

    // Perform keyword analysis
    const analysisResult = await keywordsService.analyzeKeywords(userId, locationId);

    return res.status(200).json({
      success: true,
      message: 'Keywords analyzed successfully',
      data: analysisResult
    });
  } catch (error: any) {
    console.error('Error analyzing keywords:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to analyze keywords: ${error.message || 'Unknown error'}`
    });
  }
});

/**
 * Update keywords for a GBP location
 * PUT /api/client/keywords/:locationId
 */
router.put('/:locationId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const locationId = parseInt(req.params.locationId);
    const { keywords } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (isNaN(locationId)) {
      return res.status(400).json({ success: false, message: 'Invalid location ID' });
    }

    if (!Array.isArray(keywords)) {
      return res.status(400).json({ success: false, message: 'Keywords must be an array' });
    }

    // Check if the location exists and belongs to the user
    const location = await storage.getGbpLocation(locationId);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (location.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this location' });
    }

    // Format the keywords to match the expected structure
    const formattedKeywords: Omit<KeywordOptimization, 'id'>[] = keywords.map((keyword: any) => ({
      location_id: locationId,
      keyword: keyword.keyword,
      volume: keyword.volume || 0,
      difficulty: keyword.difficulty || 0,
      priority: keyword.priority || 0,
      is_current: keyword.is_current === undefined ? true : keyword.is_current,
      applied_at: keyword.applied_at || null,
      status: (keyword.status as OptimizationStatus) || 'pending',
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Update the keywords
    const result = await keywordsService.updateKeywords(userId, locationId, formattedKeywords);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error updating keywords:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to update keywords: ${error.message || 'Unknown error'}`
    });
  }
});

/**
 * Get keywords for a GBP location
 * GET /api/client/keywords/:locationId
 */
router.get('/:locationId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const locationId = parseInt(req.params.locationId);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (isNaN(locationId)) {
      return res.status(400).json({ success: false, message: 'Invalid location ID' });
    }

    // Check if the location exists and belongs to the user
    const location = await storage.getGbpLocation(locationId);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (location.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this location' });
    }

    // Get the keywords
    const keywords = await storage.getGbpKeywordsByLocationId(locationId);

    return res.status(200).json({
      success: true,
      message: 'Keywords retrieved successfully',
      data: keywords
    });
  } catch (error: any) {
    console.error('Error getting keywords:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to get keywords: ${error.message || 'Unknown error'}`
    });
  }
});

export default router;