/**
 * Optimizations Routes
 * Handles API routes for GBP optimization suggestions
 */

import express from 'express';
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { optimizationsService } from './optimizations-service';
import { 
  OptimizationResponse, 
  CategoryOptimizationResponse, 
  KeywordOptimizationResponse,
  optimizationSchema,
  categoryOptimizationSchema,
  keywordOptimizationSchema
} from '../../shared/schema';

const router: Router = express.Router();

/**
 * Get optimization suggestions
 * GET /api/gbp/optimize/:locationId
 */
router.get('/optimize/:locationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.locationId);
    
    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID provided'
      });
    }
    
    const suggestions = await optimizationsService.getOptimizationSuggestions(locationId);
    
    const response: OptimizationResponse = {
      success: true,
      message: 'Optimization suggestions retrieved successfully',
      suggestions: suggestions
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error retrieving optimization suggestions:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving optimization suggestions: ${error.message}`
    });
  }
});

/**
 * Get category optimization suggestions
 * GET /api/gbp/category-optimize/:locationId
 */
router.get('/category-optimize/:locationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.locationId);
    
    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID provided'
      });
    }
    
    const categories = await optimizationsService.getCategoryOptimizations(locationId);
    
    const response: CategoryOptimizationResponse = {
      success: true,
      message: 'Category optimization suggestions retrieved successfully',
      categories: categories
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error retrieving category suggestions:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving category suggestions: ${error.message}`
    });
  }
});

/**
 * Get keyword optimization suggestions
 * GET /api/gbp/keyword-optimize/:locationId
 */
router.get('/keyword-optimize/:locationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.locationId);
    
    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID provided'
      });
    }
    
    const keywords = await optimizationsService.getKeywordOptimizations(locationId);
    
    const response: KeywordOptimizationResponse = {
      success: true,
      message: 'Keyword optimization suggestions retrieved successfully',
      keywords: keywords
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error retrieving keyword suggestions:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving keyword suggestions: ${error.message}`
    });
  }
});

/**
 * Update optimization status
 * PATCH /api/gbp/optimize/:optimizationId
 */
router.patch('/optimize/:optimizationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const optimizationId = parseInt(req.params.optimizationId);
    const { status } = req.body;
    
    if (isNaN(optimizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid optimization ID provided'
      });
    }
    
    if (!status || !['pending', 'approved', 'rejected', 'applied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, rejected, applied)'
      });
    }
    
    const updatedOptimization = await optimizationsService.updateOptimizationStatus(optimizationId, status);
    
    if (!updatedOptimization) {
      return res.status(404).json({
        success: false,
        message: 'Optimization not found'
      });
    }
    
    const response: OptimizationResponse = {
      success: true,
      message: `Optimization status updated to ${status}`,
      suggestions: [updatedOptimization]
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error updating optimization status:', error);
    res.status(500).json({
      success: false,
      message: `Error updating optimization status: ${error.message}`
    });
  }
});

/**
 * Update category status
 * PATCH /api/gbp/category-optimize/:categoryId
 */
router.patch('/category-optimize/:categoryId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const { status } = req.body;
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID provided'
      });
    }
    
    if (!status || !['pending', 'approved', 'rejected', 'applied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, rejected, applied)'
      });
    }
    
    const updatedCategory = await optimizationsService.updateCategoryStatus(categoryId, status);
    
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const response: CategoryOptimizationResponse = {
      success: true,
      message: `Category status updated to ${status}`,
      categories: [updatedCategory]
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error updating category status:', error);
    res.status(500).json({
      success: false,
      message: `Error updating category status: ${error.message}`
    });
  }
});

/**
 * Update keyword status
 * PATCH /api/gbp/keyword-optimize/:keywordId
 */
router.patch('/keyword-optimize/:keywordId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const keywordId = parseInt(req.params.keywordId);
    const { status, priority } = req.body;
    
    if (isNaN(keywordId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid keyword ID provided'
      });
    }
    
    if (!status || !['pending', 'approved', 'rejected', 'applied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, rejected, applied)'
      });
    }
    
    if (priority && (priority < 1 || priority > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be between 1 and 5'
      });
    }
    
    const updatedKeyword = await optimizationsService.updateKeywordStatus(keywordId, status, priority);
    
    if (!updatedKeyword) {
      return res.status(404).json({
        success: false,
        message: 'Keyword not found'
      });
    }
    
    const response: KeywordOptimizationResponse = {
      success: true,
      message: `Keyword status updated to ${status}${priority ? ` with priority ${priority}` : ''}`,
      keywords: [updatedKeyword]
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error updating keyword status:', error);
    res.status(500).json({
      success: false,
      message: `Error updating keyword status: ${error.message}`
    });
  }
});

/**
 * Get optimization progress for the dashboard
 * GET /api/gbp/optimization-progress/:locationId
 */
router.get('/optimization-progress/:locationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.locationId);
    
    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID provided'
      });
    }
    
    const progress = await optimizationsService.getOptimizationProgress(locationId);
    
    res.json({
      success: true,
      message: 'Optimization progress retrieved successfully',
      progress
    });
  } catch (error: any) {
    console.error('Error retrieving optimization progress:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving optimization progress: ${error.message}`
    });
  }
});

export default router;