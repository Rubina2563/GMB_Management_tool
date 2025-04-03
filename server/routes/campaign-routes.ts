/**
 * Campaign Routes
 * Handles API routes for campaign management
 */
import express, { Request, Response, Router } from 'express';
import { authenticateToken } from '../auth';
import { campaignsService } from '../campaigns/campaigns-service';
import { dbService } from '../db';
import { getCampaignKeywords } from './campaigns-utils';

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
 * Get all campaigns for the authenticated user
 * GET /api/client/campaigns/list
 */
router.get('/list', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const campaigns = await campaignsService.getCampaignsByUserId(userId);
    
    res.json({
      success: true,
      message: 'Campaigns retrieved successfully',
      campaigns
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message
    });
  }
});

/**
 * Get a specific campaign by ID
 * GET /api/client/campaigns/:id
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const campaign = await campaignsService.getCampaign(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    // Make sure the campaign belongs to the user
    if (campaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to campaign'
      });
    }
    
    res.json({
      success: true,
      message: 'Campaign retrieved successfully',
      campaign
    });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign',
      error: error.message
    });
  }
});

/**
 * Create a new campaign
 * POST /api/client/campaigns/create
 */
router.post('/create', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const campaignData = {
      ...req.body,
      user_id: userId
    };
    
    const campaign = await campaignsService.createCampaign(campaignData);
    
    res.json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating campaign',
      error: error.message
    });
  }
});

/**
 * Update an existing campaign
 * PATCH /api/client/campaigns/:id
 */
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Check if campaign exists and belongs to user
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to campaign'
      });
    }
    
    const updatedCampaign = await campaignsService.updateCampaign(campaignId, req.body);
    
    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating campaign',
      error: error.message
    });
  }
});

/**
 * Delete a campaign
 * DELETE /api/client/campaigns/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Check if campaign exists and belongs to user
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to campaign'
      });
    }
    
    await campaignsService.deleteCampaign(campaignId);
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting campaign',
      error: error.message
    });
  }
});

/**
 * Set a campaign as selected for the user
 * POST /api/client/campaigns/select/:id
 */
router.post('/select/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Check if campaign exists and belongs to user
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to campaign'
      });
    }
    
    // Update user's selected campaign
    await dbService.updateUserSelectedCampaign(userId, campaignId);
    
    res.json({
      success: true,
      message: 'Campaign selected successfully',
      campaignId
    });
  } catch (error: any) {
    console.error('Error selecting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error selecting campaign',
      error: error.message
    });
  }
});

/**
 * Get the currently selected campaign for the user
 * GET /api/client/campaigns/selected
 */
router.get('/selected', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get user's selected campaign ID
    const user = await dbService.getUser(userId);
    
    if (!user || !user.selected_campaign_id) {
      // If no campaign is selected, return the first campaign or null
      const userCampaigns = await campaignsService.getCampaignsByUserId(userId);
      
      if (userCampaigns.length > 0) {
        // Auto-select the first campaign
        await dbService.updateUserSelectedCampaign(userId, userCampaigns[0].id);
        
        return res.json({
          success: true,
          message: 'First campaign auto-selected',
          campaign: userCampaigns[0]
        });
      }
      
      return res.json({
        success: true,
        message: 'No campaigns available',
        campaign: null
      });
    }
    
    // Get the selected campaign
    const campaign = await campaignsService.getCampaign(user.selected_campaign_id);
    
    if (!campaign) {
      // If the selected campaign no longer exists, clear the selection
      await dbService.updateUserSelectedCampaign(userId, null);
      
      return res.json({
        success: false,
        message: 'Selected campaign not found',
        campaign: null
      });
    }
    
    res.json({
      success: true,
      message: 'Selected campaign retrieved successfully',
      campaign
    });
  } catch (error: any) {
    console.error('Error fetching selected campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching selected campaign',
      error: error.message
    });
  }
});

/**
 * Get keywords for a specific campaign
 * GET /api/client/campaigns/:id/keywords
 */
router.get('/:id/keywords', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Check if campaign exists and belongs to user
    const existingCampaign = await campaignsService.getCampaign(campaignId);
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    if (existingCampaign.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to campaign'
      });
    }
    
    // Get campaign keywords
    const keywords = getCampaignKeywords(campaignId);
    
    res.json({
      success: true,
      message: 'Campaign keywords retrieved successfully',
      keywords
    });
  } catch (error: any) {
    console.error('Error fetching campaign keywords:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign keywords',
      error: error.message
    });
  }
});

export default router;