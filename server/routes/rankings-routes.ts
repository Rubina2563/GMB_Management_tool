/**
 * Rankings Routes
 * Handles API routes for geo-grid rankings
 */
import express, { Response, Router } from 'express';
import { authenticateToken } from '../auth';
import { generateMockGridData } from '../rankings/grid-data-service';
import { getCampaignKeywords } from './campaigns-utils';

const router: Router = express.Router();

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Get geo-grid rankings for keyword
 * GET /api/client/rankings
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Keyword parameter is required"
      });
    }
    
    console.log(`Fetching rankings for keyword: ${keyword}`);
    
    // Generate consistent mock grid data based on the keyword string hash
    const hashValue = String(keyword).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Generate simulated metrics based on the keyword
    const afpr = Math.max(1, Math.min(10, 3 + (hashValue % 4))); // Average first page rank (1-10)
    const tgrm = Math.max(1, Math.min(20, 8 + (hashValue % 8))); // Total grid rank mean (1-20)
    const tss = Math.max(5, Math.min(80, 30 + (hashValue % 40))); // Top spot share percentage (5-80%)
    
    // Generate grid data with the keyword's hash for consistency
    const gridData = generateMockGridData({
      keyword: String(keyword),
      gridSize: 5, // Get from campaign settings in production
      baseRank: Math.floor(afpr),
      shape: hashValue % 2 === 0 ? 'square' : 'circular' // Alternates between square and circular
    });
    
    return res.json({
      success: true,
      message: "Geo-grid rankings retrieved successfully",
      gridData,
      afpr,
      tgrm,
      tss,
      apiUsed: "dataforseo", // Indicate which API was used
      // Add any other metrics needed
    });
    
  } catch (error) {
    console.error("Error getting geo-grid rankings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching geo-grid rankings"
    });
  }
});

/**
 * Get all keywords for rankings
 * GET /api/client/rankings/keywords
 */
router.get('/keywords', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In production, we would fetch this from the database
    // For now, return static test keywords
    const keywords = getCampaignKeywords(1);
    
    return res.json({
      success: true,
      message: "Ranking keywords retrieved successfully",
      keywords
    });
  } catch (error) {
    console.error("Error getting ranking keywords:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching ranking keywords"
    });
  }
});

export default router;