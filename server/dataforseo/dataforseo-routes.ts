/**
 * DataForSEO Routes
 * Handles API routes for the DataForSEO API integration
 */

import express, { Request, Response, Router } from 'express';
import { authenticateToken, requireAdmin } from '../auth';
import { dataForSEOService } from './dataforseo-service';
import { storage } from '../storage';

const router: Router = express.Router();

/**
 * Test DataForSEO API credentials
 * POST /api/dataforseo/test
 */
router.post('/test', authenticateToken, async (req: any, res: Response) => {
  try {
    const { data_for_seo_email, data_for_seo_key } = req.body;
    
    if (!data_for_seo_email || !data_for_seo_key) {
      return res.status(400).json({
        success: false,
        message: 'DataForSEO email and API key are required'
      });
    }
    
    // Test the credentials
    const result = await dataForSEOService.testCredentials(data_for_seo_email, data_for_seo_key);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error testing DataForSEO API:', error.message);
    return res.status(500).json({
      success: false,
      message: `Error testing DataForSEO API: ${error.message}`
    });
  }
});

/**
 * Search for a business ranking
 * POST /api/dataforseo/business-ranking
 */
router.post('/business-ranking', authenticateToken, async (req: any, res: Response) => {
  try {
    const { keyword, businessName, location } = req.body;
    const userId = req.user.id;
    
    if (!keyword || !businessName || !location) {
      return res.status(400).json({
        success: false,
        message: 'Keyword, business name, and location are required'
      });
    }
    
    // Get API keys for the user
    const apiKeys = await storage.getApiKeys(userId);
    
    if (!apiKeys || !apiKeys.data_for_seo_email || !apiKeys.data_for_seo_key) {
      return res.status(400).json({
        success: false,
        message: 'DataForSEO API credentials not found for this user'
      });
    }
    
    // Find business ranking
    const rank = await dataForSEOService.findBusinessRanking(
      apiKeys.data_for_seo_email,
      apiKeys.data_for_seo_key,
      keyword,
      businessName,
      location
    );
    
    return res.json({
      success: true,
      rank: rank
    });
  } catch (error: any) {
    console.error('Error getting business ranking:', error.message);
    return res.status(500).json({
      success: false,
      message: `Error getting business ranking: ${error.message}`
    });
  }
});

/**
 * Get local search results
 * POST /api/dataforseo/local-search
 */
router.post('/local-search', authenticateToken, async (req: any, res: Response) => {
  try {
    const { keyword, location } = req.body;
    const userId = req.user.id;
    
    if (!keyword || !location) {
      return res.status(400).json({
        success: false,
        message: 'Keyword and location are required'
      });
    }
    
    // Get API keys for the user
    const apiKeys = await storage.getApiKeys(userId);
    
    if (!apiKeys || !apiKeys.data_for_seo_email || !apiKeys.data_for_seo_key) {
      return res.status(400).json({
        success: false,
        message: 'DataForSEO API credentials not found for this user'
      });
    }
    
    // Get local search results
    const results = await dataForSEOService.getLocalSearchResults(
      apiKeys.data_for_seo_email,
      apiKeys.data_for_seo_key,
      keyword,
      location
    );
    
    return res.json({
      success: true,
      results: results
    });
  } catch (error: any) {
    console.error('Error getting local search results:', error.message);
    return res.status(500).json({
      success: false,
      message: `Error getting local search results: ${error.message}`
    });
  }
});

/**
 * Get local rankings data for the Rankings page
 * GET /api/client/dataforseo/local-rankings
 */
router.get('/local-rankings', authenticateToken, async (req: any, res: Response) => {
  try {
    const { keyword, businessName, lat, lng, gridSize } = req.query;
    const userId = req.user.id;
    
    if (!keyword || !businessName || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Keyword, business name, latitude, and longitude are required'
      });
    }
    
    // Get API keys for the user
    const apiKeys = await storage.getApiKeys(userId);
    
    if (!apiKeys || !apiKeys.data_for_seo_email || !apiKeys.data_for_seo_key) {
      return res.status(400).json({
        success: false,
        message: 'DataForSEO API credentials not found for this user'
      });
    }
    
    // Get local rankings data
    const rankingData = await dataForSEOService.getLocalRankings(
      apiKeys.data_for_seo_email,
      apiKeys.data_for_seo_key,
      String(keyword),
      String(businessName),
      parseFloat(String(lat)),
      parseFloat(String(lng)),
      gridSize ? parseInt(String(gridSize)) : 5
    );
    
    return res.json({
      success: true,
      data: rankingData,
      source: 'dataforseo'
    });
  } catch (error: any) {
    console.error('Error getting local rankings:', error.message);
    return res.status(500).json({
      success: false,
      message: `Error getting local rankings: ${error.message}`
    });
  }
});

/**
 * Get geo-grid rankings
 * POST /api/dataforseo/geo-grid
 */
router.post('/geo-grid', authenticateToken, async (req: any, res: Response) => {
  try {
    const { keyword, businessName, centerLat, centerLng, gridSize, radiusKm } = req.body;
    const userId = req.user.id;
    
    if (!keyword || !businessName || !centerLat || !centerLng) {
      return res.status(400).json({
        success: false,
        message: 'Keyword, business name, latitude, and longitude are required'
      });
    }
    
    // Get API keys for the user
    const apiKeys = await storage.getApiKeys(userId);
    
    if (!apiKeys || !apiKeys.data_for_seo_email || !apiKeys.data_for_seo_key) {
      return res.status(400).json({
        success: false,
        message: 'DataForSEO API credentials not found for this user'
      });
    }
    
    // Get geo grid rankings
    const gridRankings = await dataForSEOService.getGeoGridRankings(
      apiKeys.data_for_seo_email,
      apiKeys.data_for_seo_key,
      keyword,
      businessName,
      parseFloat(centerLat),
      parseFloat(centerLng),
      gridSize || 5,
      radiusKm || 5
    );
    
    return res.json({
      success: true,
      gridPoints: gridRankings
    });
  } catch (error: any) {
    console.error('Error getting geo grid rankings:', error.message);
    return res.status(500).json({
      success: false,
      message: `Error getting geo grid rankings: ${error.message}`
    });
  }
});

/**
 * Export the router
 */
export default router;