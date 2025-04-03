/**
 * Citation Audit Routes
 * Handles API routes for citation and backlink auditing
 */
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { citationAuditService } from './citation-audit-service';
import { storage } from '../storage';
import { creditService } from '../reviews/credit-service';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Run a citation audit for a GBP-linked website
 * POST /api/client/citations/audit
 */
router.post('/audit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { locationId, websiteUrl, businessName } = req.body;

    if (!locationId && !websiteUrl) {
      return res.status(400).json({
        success: false,
        message: "Either locationId or websiteUrl must be provided"
      });
    }

    // Check if user has enough credits
    const userCredits = await creditService.getUserCredits(userId);
    if (userCredits < 1) {
      return res.status(403).json({
        success: false,
        message: "Insufficient credits to run citation audit"
      });
    }

    // If locationId is provided, get website URL from location data
    let targetWebsiteUrl = websiteUrl;
    let targetBusinessName = businessName;

    if (locationId) {
      const location = await storage.getGbpLocation(Number(locationId));
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: "Location not found"
        });
      }

      if (!location.website) {
        return res.status(400).json({
          success: false,
          message: "Location does not have a website URL"
        });
      }

      targetWebsiteUrl = location.website;
      targetBusinessName = location.name;
    }

    if (!targetBusinessName) {
      return res.status(400).json({
        success: false,
        message: "Business name is required"
      });
    }

    // Run the citation audit
    const auditResult = await citationAuditService.runBacklinkAudit(
      userId, 
      targetWebsiteUrl, 
      targetBusinessName
    );

    // Get updated credit balance
    const remainingCredits = await creditService.getUserCredits(userId);

    res.json({
      success: true,
      message: "Citation audit completed successfully",
      audit: auditResult,
      credits: {
        used: 1,
        remaining: remainingCredits
      }
    });
  } catch (error: any) {
    console.error('Error running citation audit:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run citation audit'
    });
  }
});

/**
 * Run a NAP citation audit
 * POST /api/client/citations/audit/nap
 * 
 * This endpoint allows performing a citation audit with Name, Address, Phone (NAP) information,
 * using the DataForSEO API to analyze citations and NAP consistency across the web.
 */
router.post('/audit/nap', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { 
      websiteUrl, 
      businessName, 
      businessAddress, 
      phoneNumber,
      businessCategory,
      competitors 
    } = req.body;

    if (!websiteUrl || !businessName || !businessAddress || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Website URL, business name, address, and phone number are required"
      });
    }

    // Check if user has enough credits
    const userCredits = await creditService.getUserCredits(userId);
    if (userCredits < 1) {
      return res.status(403).json({
        success: false,
        message: "Insufficient credits to run citation audit"
      });
    }

    // Get API keys for DataForSEO
    const apiKeys = await storage.getApiKeys(userId);
    if (!apiKeys || !apiKeys.data_for_seo_email || !apiKeys.data_for_seo_key) {
      return res.status(400).json({
        success: false,
        message: "DataForSEO API credentials are not configured. Please set them up in the API Keys section."
      });
    }

    // Run the enhanced citation audit with NAP information
    const auditResult = await citationAuditService.runNAPCitationAudit(
      userId,
      websiteUrl,
      businessName,
      businessAddress,
      phoneNumber,
      apiKeys.data_for_seo_email,
      apiKeys.data_for_seo_key,
      businessCategory,
      competitors
    );

    // Get updated credit balance
    const remainingCredits = await creditService.getUserCredits(userId);

    res.json({
      success: true,
      message: "NAP citation audit completed successfully",
      audit: auditResult,
      credits: {
        used: 1,
        remaining: remainingCredits
      }
    });
  } catch (error: any) {
    console.error('Error running NAP citation audit:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run NAP citation audit'
    });
  }
});

/**
 * Get user's credit balance
 * GET /api/client/citations/credits
 */
router.get('/credits', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    const credits = await creditService.getUserCredits(userId);
    
    res.json({
      success: true,
      message: "Credit balance retrieved successfully",
      credits
    });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch credit balance'
    });
  }
});

export default router;