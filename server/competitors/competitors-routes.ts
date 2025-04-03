import { Router } from 'express';
import { CompetitorsService } from './competitors-service';
import { LocationService } from '../gbp';
import { NlpService } from '../nlp/nlp-service';
import { authenticateToken } from '../auth';

export function competitorsRoutes(locationService: LocationService, nlpService: NlpService): Router {
  const router = Router();
  const competitorsService = new CompetitorsService(locationService, nlpService);

  /**
   * GET /api/client/competitors/:locationId
   * Get competitor analysis for a specific location
   */
  router.get('/:locationId', authenticateToken, async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      
      if (isNaN(locationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID'
        });
      }
      
      const analysis = await competitorsService.getCompetitorAnalysis(locationId);
      
      return res.json({
        success: true,
        message: 'Competitor analysis retrieved successfully',
        data: analysis
      });
    } catch (error: any) {
      console.error('Error getting competitor analysis:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get competitor analysis'
      });
    }
  });

  return router;
}