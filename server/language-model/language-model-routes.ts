/**
 * Language Model Routes
 * Handles API routes for language model configuration and AI content generation
 */

import express, { Request, Response, Router } from "express";
import { authenticateToken } from "../auth";
import { languageModelService } from "./language-model-service";

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
 * Setup language model API configuration
 * POST /api/client/language-model/setup
 */
router.post('/setup', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    const { modelProvider, apiKey } = req.body;
    
    if (!modelProvider || !apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: "Model provider and API key are required" 
      });
    }

    // Validate model provider
    if (!["openai", "claude", "grok", "deepseek"].includes(modelProvider)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid model provider. Supported providers: openai, claude, grok, deepseek" 
      });
    }

    // Save the language model settings
    const result = await languageModelService.saveSettings(userId, modelProvider, apiKey);
    
    return res.json({
      success: true,
      message: "Language model setup successful",
      settings: result
    });
  } catch (error: any) {
    console.error("Error setting up language model:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to setup language model"
    });
  }
});

/**
 * Generate AI content (posts or review replies)
 * POST /api/client/language-model/generate
 */
router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    const { type, prompt } = req.body;
    
    if (!type || !prompt) {
      return res.status(400).json({ 
        success: false, 
        error: "Content type and prompt are required" 
      });
    }

    // Validate content type
    if (!["post", "review-reply"].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid content type. Supported types: post, review-reply" 
      });
    }

    // Generate AI content
    const content = await languageModelService.generateContent(userId, type, prompt);
    
    return res.json({
      success: true,
      content
    });
  } catch (error: any) {
    console.error("Error generating content:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate content"
    });
  }
});

/**
 * Get user's language model settings
 * GET /api/client/language-model/settings
 */
router.get('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    // Get user's language model settings
    const settings = await languageModelService.getSettings(userId);
    
    return res.json({
      success: true,
      settings
    });
  } catch (error: any) {
    console.error("Error retrieving language model settings:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve language model settings"
    });
  }
});

export default router;