import express from 'express';
import { storage } from '../storage';
import { authenticateToken } from '../auth';
import { 
  faqSchema, 
  faqReplySchema, 
  insertFaqSchema, 
  insertFaqReplySchema 
} from '../../shared/schema';
import { matchQuestionToFaqs } from '../nlp/nlp-service';

const router = express.Router();

// Middleware to ensure the user has access to the location
const ensureLocationAccess = async (req: any, res: any, next: any) => {
  const userId = req.user.id;
  const locationId = parseInt(req.params.locationId);

  if (isNaN(locationId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid location ID'
    });
  }

  // Get the location
  const location = await storage.getGbpLocation(locationId);

  // Check if location exists and user has access
  if (!location || location.user_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access to this location is denied'
    });
  }

  // Add the location to the request object
  req.location = location;
  next();
};

// Get all FAQs for a location
router.get('/location/:locationId/faqs', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    const faqs = await storage.getFaqs(locationId);

    res.json({
      success: true,
      message: 'FAQs retrieved successfully',
      faqs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve FAQs'
    });
  }
});

// Get a single FAQ by ID
router.get('/location/:locationId/faqs/:faqId', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const faqId = parseInt(req.params.faqId);
    const faq = await storage.getFaq(faqId);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    if (faq.location_id !== parseInt(req.params.locationId)) {
      return res.status(403).json({
        success: false,
        message: 'FAQ does not belong to this location'
      });
    }

    res.json({
      success: true,
      message: 'FAQ retrieved successfully',
      faq
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve FAQ'
    });
  }
});

// Create a new FAQ
router.post('/location/:locationId/faqs', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const locationId = parseInt(req.params.locationId);
    
    // Create a question/answer object with required fields
    const faqData = {
      question: req.body.question,
      answer: req.body.answer,
      user_id: userId,
      location_id: locationId
    };
    
    // Validate the data against the schema
    const validatedData = insertFaqSchema.parse(faqData);
    
    // Create the FAQ
    const faq = await storage.createFaq(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      faq
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create FAQ'
    });
  }
});

// Update an existing FAQ
router.put('/location/:locationId/faqs/:faqId', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const faqId = parseInt(req.params.faqId);
    const locationId = parseInt(req.params.locationId);
    
    // Get the existing FAQ
    const existingFaq = await storage.getFaq(faqId);
    
    if (!existingFaq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    // Ensure the FAQ belongs to the location
    if (existingFaq.location_id !== locationId) {
      return res.status(403).json({
        success: false,
        message: 'FAQ does not belong to this location'
      });
    }
    
    // Validate the request body against the schema
    const validatedData = insertFaqSchema.partial().parse(req.body);
    
    // Update the FAQ
    const updatedFaq = await storage.updateFaq(faqId, validatedData);
    
    res.json({
      success: true,
      message: 'FAQ updated successfully',
      faq: updatedFaq
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update FAQ'
    });
  }
});

// Delete a FAQ
router.delete('/location/:locationId/faqs/:faqId', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const faqId = parseInt(req.params.faqId);
    const locationId = parseInt(req.params.locationId);
    
    // Get the existing FAQ
    const existingFaq = await storage.getFaq(faqId);
    
    if (!existingFaq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    // Ensure the FAQ belongs to the location
    if (existingFaq.location_id !== locationId) {
      return res.status(403).json({
        success: false,
        message: 'FAQ does not belong to this location'
      });
    }
    
    // Delete the FAQ
    const deleted = await storage.deleteFaq(faqId);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete FAQ'
      });
    }
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete FAQ'
    });
  }
});

// Get all FAQ replies for a location
router.get('/location/:locationId/faq-replies', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    const replies = await storage.getFaqReplies(locationId);

    res.json({
      success: true,
      message: 'FAQ replies retrieved successfully',
      replies
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve FAQ replies'
    });
  }
});

// Get a single FAQ reply by ID
router.get('/location/:locationId/faq-replies/:replyId', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const replyId = parseInt(req.params.replyId);
    const reply = await storage.getFaqReply(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'FAQ reply not found'
      });
    }

    if (reply.location_id !== parseInt(req.params.locationId)) {
      return res.status(403).json({
        success: false,
        message: 'FAQ reply does not belong to this location'
      });
    }

    res.json({
      success: true,
      message: 'FAQ reply retrieved successfully',
      reply
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve FAQ reply'
    });
  }
});

// Create a new FAQ reply
router.post('/location/:locationId/faq-replies', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const locationId = parseInt(req.params.locationId);
    
    // Validate the request body against the schema
    const validatedData = insertFaqReplySchema.parse(req.body);
    
    // Check if associated FAQ exists if faq_id is provided
    if (validatedData.faq_id) {
      const faq = await storage.getFaq(validatedData.faq_id);
      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'Associated FAQ not found'
        });
      }
      
      // Ensure the FAQ belongs to the location
      if (faq.location_id !== locationId) {
        return res.status(403).json({
          success: false,
          message: 'Associated FAQ does not belong to this location'
        });
      }
    }
    
    // Create the FAQ reply
    const reply = await storage.createFaqReply({
      ...validatedData,
      user_id: userId,
      location_id: locationId
    });
    
    res.status(201).json({
      success: true,
      message: 'FAQ reply created successfully',
      reply
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create FAQ reply'
    });
  }
});

// Update an existing FAQ reply
router.put('/location/:locationId/faq-replies/:replyId', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const replyId = parseInt(req.params.replyId);
    const locationId = parseInt(req.params.locationId);
    
    // Get the existing FAQ reply
    const existingReply = await storage.getFaqReply(replyId);
    
    if (!existingReply) {
      return res.status(404).json({
        success: false,
        message: 'FAQ reply not found'
      });
    }
    
    // Ensure the FAQ reply belongs to the location
    if (existingReply.location_id !== locationId) {
      return res.status(403).json({
        success: false,
        message: 'FAQ reply does not belong to this location'
      });
    }
    
    // Validate the request body against the schema
    const validatedData = insertFaqReplySchema.partial().parse(req.body);
    
    // Check if associated FAQ exists if faq_id is provided
    if (validatedData.faq_id) {
      const faq = await storage.getFaq(validatedData.faq_id);
      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'Associated FAQ not found'
        });
      }
      
      // Ensure the FAQ belongs to the location
      if (faq.location_id !== locationId) {
        return res.status(403).json({
          success: false,
          message: 'Associated FAQ does not belong to this location'
        });
      }
    }
    
    // Update the FAQ reply
    const updatedReply = await storage.updateFaqReply(replyId, validatedData);
    
    res.json({
      success: true,
      message: 'FAQ reply updated successfully',
      reply: updatedReply
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update FAQ reply'
    });
  }
});

// Update the status of an FAQ reply
router.patch('/location/:locationId/faq-replies/:replyId/status', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const replyId = parseInt(req.params.replyId);
    const locationId = parseInt(req.params.locationId);
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected', 'manual'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be one of: pending, approved, rejected, manual'
      });
    }
    
    // Get the existing FAQ reply
    const existingReply = await storage.getFaqReply(replyId);
    
    if (!existingReply) {
      return res.status(404).json({
        success: false,
        message: 'FAQ reply not found'
      });
    }
    
    // Ensure the FAQ reply belongs to the location
    if (existingReply.location_id !== locationId) {
      return res.status(403).json({
        success: false,
        message: 'FAQ reply does not belong to this location'
      });
    }
    
    // Update the FAQ reply status
    const updatedReply = await storage.updateFaqReplyStatus(replyId, status);
    
    res.json({
      success: true,
      message: 'FAQ reply status updated successfully',
      reply: updatedReply
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update FAQ reply status'
    });
  }
});

// Delete a FAQ reply
router.delete('/location/:locationId/faq-replies/:replyId', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const replyId = parseInt(req.params.replyId);
    const locationId = parseInt(req.params.locationId);
    
    // Get the existing FAQ reply
    const existingReply = await storage.getFaqReply(replyId);
    
    if (!existingReply) {
      return res.status(404).json({
        success: false,
        message: 'FAQ reply not found'
      });
    }
    
    // Ensure the FAQ reply belongs to the location
    if (existingReply.location_id !== locationId) {
      return res.status(403).json({
        success: false,
        message: 'FAQ reply does not belong to this location'
      });
    }
    
    // Delete the FAQ reply
    const deleted = await storage.deleteFaqReply(replyId);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete FAQ reply'
      });
    }
    
    res.json({
      success: true,
      message: 'FAQ reply deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete FAQ reply'
    });
  }
});

// Match a question to FAQs using NLP
router.post('/location/:locationId/match-question', authenticateToken, ensureLocationAccess, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const locationId = parseInt(req.params.locationId);
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Use the NLP service to match the question to FAQs
    const result = await matchQuestionToFaqs(question, locationId, userId);
    
    if (!result.matchedFaq) {
      // No match found, return empty result
      return res.json({
        success: true,
        message: 'No matching FAQ found',
        match: {
          faq: null,
          confidence: 0,
          suggestedAnswer: '',
          found: false
        }
      });
    }
    
    // Return the matched FAQ and suggested answer
    res.json({
      success: true,
      message: 'Question matched to FAQ',
      match: {
        faq: result.matchedFaq,
        confidence: result.confidence,
        suggestedAnswer: result.suggestedAnswer,
        found: true
      }
    });
  } catch (error: any) {
    console.error('Error matching question:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to match question to FAQs'
    });
  }
});

export default router;