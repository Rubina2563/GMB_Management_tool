import express from 'express';
import { NlpService } from './nlp-service';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const nlpService = new NlpService();

/**
 * @route   POST /api/nlp/sentiment
 * @desc    Analyze sentiment of text
 * @access  Public (for testing)
 */
router.post('/sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    const sentiment = await nlpService.analyzeSentiment(text);
    
    return res.status(200).json({
      success: true,
      data: {
        sentiment,
        // Add sentiment label (positive, negative, neutral)
        label: sentiment.score > 0.05 ? 'positive' : 
               sentiment.score < -0.05 ? 'negative' : 'neutral'
      }
    });
  } catch (error: any) {
    console.error('Error analyzing sentiment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze sentiment',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/nlp/keywords
 * @desc    Extract keywords from text
 * @access  Public (for testing)
 */
router.post('/keywords', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    const keywords = await nlpService.extractKeywords(text);
    
    return res.status(200).json({
      success: true,
      data: {
        keywords
      }
    });
  } catch (error: any) {
    console.error('Error extracting keywords:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to extract keywords',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/nlp/generate-text
 * @desc    Generate text using a prompt
 * @access  Private
 */
router.post('/generate-text', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    const generatedText = await nlpService.generateText(prompt);
    
    return res.status(200).json({
      success: true,
      data: {
        text: generatedText || 'Could not generate text. Please check your OpenAI API key or try again later.'
      }
    });
  } catch (error: any) {
    console.error('Error generating text:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate text',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/nlp/review-response
 * @desc    Generate a response to a review
 * @access  Private
 */
router.post('/review-response', requireAuth, async (req, res) => {
  try {
    const { reviewText, reviewerName, rating } = req.body;
    
    if (!reviewText || !reviewerName || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Review text, reviewer name, and rating are required'
      });
    }
    
    const response = await nlpService.generateReviewResponse(
      reviewText,
      reviewerName,
      rating
    );
    
    return res.status(200).json({
      success: true,
      data: {
        response
      }
    });
  } catch (error: any) {
    console.error('Error generating review response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate review response',
      error: error.message
    });
  }
});

export default router;