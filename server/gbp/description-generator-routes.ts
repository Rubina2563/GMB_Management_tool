/**
 * Description Generator Routes
 * 
 * This file contains routes for generating Google Business Profile descriptions
 * using the description generator service.
 */

import { Router, Request, Response } from 'express';
import { generateDescriptions } from './description-generator-service';
import { descriptionGeneratorSchema, DescriptionGeneratorData, DescriptionResponse } from '../../shared/schema';
import { requireAuth, requireClientRole } from '../middleware/auth';

const router = Router();

/**
 * Generate descriptions for a GBP location
 * 
 * POST /api/client/description-generator
 * 
 * Request body:
 * {
 *   locationId: number,
 *   businessDetails: {
 *     categories: string[],
 *     services: string[],
 *     products: string[],
 *     uniqueSellingPoints: string[]
 *   },
 *   tone: 'professional' | 'friendly' | 'persuasive' | 'informative' | 'conversational'
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   descriptions: string[],
 *   canAutoUpdate: boolean,
 *   manualInstructions: string
 * }
 */
router.post('/description-generator', requireAuth, requireClientRole, async (req: Request, res: Response) => {
  try {
    // Validate request data
    const result = descriptionGeneratorSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: result.error.errors
      });
    }

    const data = result.data;
    
    // Generate descriptions using the service
    const generatedDescriptions = await generateDescriptions(
      data.businessDetails,
      data.tone
    );

    const response: DescriptionResponse = {
      success: true,
      descriptions: generatedDescriptions.descriptions,
      canAutoUpdate: generatedDescriptions.canAutoUpdate,
      manualInstructions: generatedDescriptions.manualInstructions
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error generating descriptions:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while generating descriptions',
      descriptions: [],
      canAutoUpdate: false,
      manualInstructions: 'An error occurred. Please try again later.'
    });
  }
});

export default router;