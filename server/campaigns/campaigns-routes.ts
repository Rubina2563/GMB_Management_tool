/**
 * Campaigns Routes
 * Handles API routes for campaign management and ranking data
 */

import express, { Router, Request as ExpressRequest, Response } from 'express';
import { authenticateToken } from '../auth';
import { campaignsService } from './campaigns-service';

// Extend Request type to include user property
interface Request extends ExpressRequest {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}
import { 
  CampaignsListResponse,
  CampaignKeywordsListResponse,
  CampaignData,
  CampaignKeywordData
} from '../../shared/schema';

const router: Router = express.Router();

/**
 * Get all campaigns for the authenticated user
 * GET /api/campaigns
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Extract user ID from request
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Get campaigns from service
    const campaigns = await campaignsService.getCampaigns(userId);
    
    // Return success response
    const response: CampaignsListResponse = {
      success: true,
      message: 'Campaigns fetched successfully',
      campaigns: campaigns.map(campaign => ({
        ...campaign,
        // Add some UI-specific fields that would normally come from calculations
        locations: Math.floor(Math.random() * 5) + 1,
        keywords: Math.floor(Math.random() * 20) + 5,
        progress: Math.floor(Math.random() * 100),
        lastUpdated: campaign.updated_at.toISOString().split('T')[0]
      }))
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error in GET /campaigns:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns'
    });
  }
});

/**
 * Get a specific campaign by ID
 * GET /api/campaigns/:campaignId
 */
router.get('/:campaignId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Get campaign from service
    const campaign = await campaignsService.getCampaign(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Ensure user has access to this campaign
    if (campaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Return success response
    return res.json({
      success: true,
      message: 'Campaign fetched successfully',
      campaign: {
        ...campaign,
        // Add some UI-specific fields
        locations: Math.floor(Math.random() * 5) + 1,
        keywords: Math.floor(Math.random() * 20) + 5,
        progress: Math.floor(Math.random() * 100),
        lastUpdated: campaign.updated_at.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error in GET /campaigns/:campaignId:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign'
    });
  }
});

/**
 * Create a new campaign
 * POST /api/campaigns
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const campaignData: CampaignData = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Create campaign with user ID included in data
    const campaignWithUser = {
      ...campaignData,
      user_id: userId
    };
    const campaign = await campaignsService.createCampaign(campaignWithUser);
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Error in POST /campaigns:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create campaign'
    });
  }
});

/**
 * Update an existing campaign
 * PATCH /api/campaigns/:campaignId
 */
router.patch('/:campaignId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const userId = req.user?.id;
    const campaignData: Partial<CampaignData> = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Get existing campaign to verify ownership
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Ensure user has access to this campaign
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update campaign
    const updatedCampaign = await campaignsService.updateCampaign(campaignId, campaignData);
    
    // Return success response
    return res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('Error in PATCH /campaigns/:campaignId:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update campaign'
    });
  }
});

/**
 * Delete a campaign
 * DELETE /api/campaigns/:campaignId
 */
router.delete('/:campaignId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Get existing campaign to verify ownership
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Ensure user has access to this campaign
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Delete campaign
    await campaignsService.deleteCampaign(campaignId);
    
    // Return success response
    return res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /campaigns/:campaignId:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete campaign'
    });
  }
});

/**
 * Get keywords for a campaign
 * GET /api/campaigns/keywords?campaignId=123
 */
router.get('/keywords', authenticateToken, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.query.campaignId as string);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }
    
    // Get existing campaign to verify ownership
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Ensure user has access to this campaign
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get keywords for campaign
    const keywords = await campaignsService.getCampaignKeywords(campaignId);
    
    // Add extra data fields for UI
    const enrichedKeywords = keywords.map(keyword => ({
      ...keyword,
      rank: Math.floor(Math.random() * 10) + 1,
      rankChange: Math.floor(Math.random() * 7) - 3
    }));
    
    // Return success response
    const response: CampaignKeywordsListResponse = {
      success: true,
      message: 'Keywords fetched successfully',
      keywords: enrichedKeywords
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error in GET /campaigns/keywords:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign keywords'
    });
  }
});

/**
 * Get geo-grid rankings for a campaign and keyword
 * GET /api/campaigns/geo-grid?campaignId=123&keyword=service&location=Los%20Angeles&radius=10
 */
router.get('/geo-grid', authenticateToken, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.query.campaignId as string);
    const keyword = req.query.keyword as string;
    const location = req.query.location as string;
    const radius = parseInt(req.query.radius as string);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (isNaN(campaignId) || !keyword || !location || isNaN(radius)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    // Get existing campaign to verify ownership
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Ensure user has access to this campaign
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get geo-grid rankings
    const geoGridData = await campaignsService.getGeoGridRankings(campaignId, keyword, location, radius);
    
    // Return success response
    return res.json({
      success: true,
      message: 'Geo-grid rankings fetched successfully',
      data: geoGridData
    });
  } catch (error) {
    console.error('Error in GET /campaigns/geo-grid:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch geo-grid rankings'
    });
  }
});

/**
 * Get ranking trends for a campaign
 * GET /api/campaigns/trends?campaignId=123&keyword=service
 */
router.get('/trends', authenticateToken, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.query.campaignId as string);
    const keyword = req.query.keyword as string;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }
    
    // Get existing campaign to verify ownership
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Ensure user has access to this campaign
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get ranking trends
    const trendsData = await campaignsService.getRankingTrends(campaignId, keyword);
    
    // Return success response
    return res.json({
      success: true,
      message: 'Ranking trends fetched successfully',
      data: trendsData
    });
  } catch (error) {
    console.error('Error in GET /campaigns/trends:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ranking trends'
    });
  }
});

/**
 * Get competitor data for a campaign
 * GET /api/campaigns/competitors?campaignId=123
 */
router.get('/competitors', authenticateToken, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.query.campaignId as string);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }
    
    // Get existing campaign to verify ownership
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Ensure user has access to this campaign
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get competitor data
    const competitorData = await campaignsService.getCompetitorData(campaignId);
    
    // Return success response
    return res.json({
      success: true,
      message: 'Competitor data fetched successfully',
      data: competitorData
    });
  } catch (error) {
    console.error('Error in GET /campaigns/competitors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch competitor data'
    });
  }
});

export default router;