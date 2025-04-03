/**
 * Citations Routes
 * 
 * API endpoints for citation analysis and management
 */
import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { citationsService, CitationAnalysis } from './citations-service';

export const router = express.Router();

/**
 * Get citation analysis for a location
 * 
 * @route GET /api/client/citations/analysis/:locationId
 * @param locationId - The Google Business Profile location ID
 * @returns CitationAnalysis object with citation score, directory listings, and recommendations
 */
router.get('/analysis/:locationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const locationId = req.params.locationId;
    
    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'Location ID is required'
      });
    }
    
    const citationAnalysis = await citationsService.getCitationAnalysis(userId, locationId);
    
    res.status(200).json({
      success: true,
      message: 'Citation analysis retrieved successfully',
      data: citationAnalysis
    });
  } catch (error: any) {
    console.error('Error fetching citation analysis:', error);
    
    // Provide a more helpful error message for DataForSEO API configuration issues
    if (error.message && error.message.includes('API credentials')) {
      return res.status(400).json({
        success: false,
        message: 'DataForSEO API is not configured. Please add your API credentials in the admin panel.',
        errorCode: 'DATASEO_NOT_CONFIGURED'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve citation analysis'
    });
  }
});

/**
 * Update citation status
 * 
 * @route POST /api/client/citations/update-status
 * @body { locationId, directoryName, status }
 * @returns Success status
 */
router.post('/update-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { locationId, directoryName, status } = req.body;
    
    if (!locationId || !directoryName || !status) {
      return res.status(400).json({
        success: false,
        message: 'Location ID, directory name, and status are required'
      });
    }
    
    // Validate status
    const validStatuses = ['not_listed', 'listed', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }
    
    await citationsService.updateCitationStatus(userId, locationId, directoryName, status);
    
    res.status(200).json({
      success: true,
      message: 'Citation status updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating citation status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update citation status'
    });
  }
});