/**
 * GBP Profile Selection Routes
 * Handles API routes for fetching and selecting Google Business Profiles
 */
import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { gbpService } from './gbp-service';

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
 * Get available GBP profiles for selection
 * GET /api/client/gbp/select
 */
router.get('/select', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    // Get available profiles using the GBP service
    const profiles = await gbpService.getAvailableProfiles(userId);
    
    return res.status(200).json({
      success: true,
      message: 'GBP profiles retrieved successfully',
      profiles
    });
    
  } catch (error: any) {
    console.error('Error fetching GBP profiles:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch GBP profiles'
    });
  }
});

export default router;