/**
 * GBP Audit Routes
 * Handles API routes for GBP audit functionality
 */
import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { gbpAuditService } from './audit-service';

const router: Router = express.Router();

/**
 * Connect a new GBP (mock OAuth flow)
 * POST /api/client/gbp/connect
 */
router.post('/connect', authenticateToken, async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would initiate the Google OAuth flow
    // For demo purposes, we mock the response
    
    const userId = (req as any).user.id;
    const { authorizationCode } = req.body;
    
    // Mock successful connection
    res.json({
      success: true,
      message: "Google Business Profile connected successfully",
      gbp: {
        id: "gbp_1",
        name: "Fitness Center Downtown",
        address: "123 Main St, Seattle, WA 98101",
        category: "Gym / Fitness Center",
        connected_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to connect Google Business Profile"
    });
  }
});

/**
 * Get list of connected GBPs for selection
 * GET /api/client/gbp/select
 */
router.get('/select', authenticateToken, async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would fetch GBPs from the database
    // For demo purposes, we return mock data
    
    res.json({
      success: true,
      message: "GBP profiles retrieved successfully",
      profiles: [
        {
          id: "gbp_1",
          name: "Fitness Center Downtown",
          address: "123 Main St, Seattle, WA 98101",
          category: "Gym / Fitness Center"
        },
        {
          id: "gbp_2",
          name: "Elite Fitness Studio",
          address: "456 Pine St, Seattle, WA 98101",
          category: "Fitness Studio"
        },
        {
          id: "gbp_3",
          name: "CrossFit Revolution",
          address: "789 Market St, Seattle, WA 98109",
          category: "CrossFit Box"
        }
      ]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve GBP profiles"
    });
  }
});

/**
 * Run a GBP audit
 * POST /api/client/gbp/audit
 */
router.post('/audit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gbpId } = req.body;
    
    if (!gbpId) {
      return res.status(400).json({
        success: false,
        message: "GBP ID is required"
      });
    }
    
    // Get user's credit balance
    const creditBalance = await gbpAuditService.getUserCreditBalance(userId);
    
    if (creditBalance < 1) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits to run audit"
      });
    }
    
    // Run the audit
    const auditResult = await gbpAuditService.runAudit(userId, gbpId);
    
    // Get updated credit balance
    const updatedCreditBalance = await gbpAuditService.getUserCreditBalance(userId);
    
    res.json({
      success: true,
      message: "Audit completed successfully",
      audit: auditResult,
      credits: {
        used: 1,
        remaining: updatedCreditBalance
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to run GBP audit"
    });
  }
});

/**
 * Get audit insights/history for a GBP
 * GET /api/client/gbp/insights/:gbpId
 */
router.get('/insights/:gbpId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gbpId } = req.params;
    
    const insights = await gbpAuditService.getAuditInsights(userId, gbpId);
    
    res.json({
      success: true,
      message: "Audit insights retrieved successfully",
      insights
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve audit insights"
    });
  }
});

/**
 * Get latest audit for a GBP
 * GET /api/client/gbp/audit/:gbpId
 */
router.get('/audit/:gbpId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gbpId } = req.params;
    
    const auditResult = await gbpAuditService.getLatestAudit(userId, gbpId);
    
    if (!auditResult) {
      return res.json({
        success: true,
        message: "No audit found for this GBP",
        audit: null
      });
    }
    
    res.json({
      success: true,
      message: "Latest audit retrieved successfully",
      audit: auditResult
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve latest audit"
    });
  }
});

/**
 * Get user's credit balance
 * GET /api/client/gbp/credits
 */
router.get('/credits', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const creditBalance = await gbpAuditService.getUserCreditBalance(userId);
    
    res.json({
      success: true,
      message: "Credit balance retrieved successfully",
      credits: creditBalance
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve credit balance"
    });
  }
});

export default router;