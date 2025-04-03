// AI Service - Handles AI-powered reply generation for reviews
// This service supports multiple LLM providers: OpenAI, Claude, DeepSeek, Grok

import axios from 'axios';
import { storage } from '../storage';
import { creditService, CREDIT_COSTS } from './credit-service';

export type LLMProvider = 'openai' | 'claude' | 'deepseek' | 'grok';

interface AIServiceConfig {
  provider: LLMProvider;
  apiKey?: string;
}

interface AIReplyRequest {
  review: {
    rating: number;
    comment: string;
    reviewer_name: string;
  };
  business: {
    name: string;
    location: string;
    primaryKeyword: string;
  };
}

export class AIService {
  // Generate an AI-powered reply to a review
  async generateReply(
    userId: number,
    config: AIServiceConfig,
    request: AIReplyRequest
  ): Promise<string> {
    try {
      // Check if user provided their own API key
      const useOurAPI = !config.apiKey;

      // If using our API, check and deduct credits
      if (useOurAPI) {
        const hasCredits = await creditService.hasEnoughCredits(
          userId, 
          CREDIT_COSTS.AI_REPLY
        );
        
        if (!hasCredits) {
          throw new Error('Insufficient credits for AI reply generation');
        }
        
        // Deduct credits
        await creditService.deductCredits(userId, CREDIT_COSTS.AI_REPLY);
      }
      
      // In a real implementation, we would call the selected AI provider's API
      // For now, we'll return mock responses based on rating and review sentiment
      
      const reply = this.getMockAIReply(
        config.provider,
        request.review.rating,
        request.review.comment,
        request.review.reviewer_name,
        request.business.name,
        request.business.location,
        request.business.primaryKeyword
      );
      
      return reply;
    } catch (error) {
      console.error('Error generating AI reply:', error);
      throw error;
    }
  }
  
  // Generate multiple AI replies for bulk processing
  async generateBulkReplies(
    userId: number,
    config: AIServiceConfig,
    requests: AIReplyRequest[]
  ): Promise<string[]> {
    try {
      // Check if user provided their own API key
      const useOurAPI = !config.apiKey;
      
      // If using our API, check and deduct credits
      if (useOurAPI) {
        const totalCost = CREDIT_COSTS.AI_REPLY * requests.length;
        const hasCredits = await creditService.hasEnoughCredits(userId, totalCost);
        
        if (!hasCredits) {
          throw new Error('Insufficient credits for bulk AI reply generation');
        }
        
        // Deduct credits
        await creditService.deductCredits(userId, totalCost);
      }
      
      // In a real implementation, we would batch these requests to the API
      // For demonstration, we'll process them sequentially
      
      const replies: string[] = [];
      
      for (const request of requests) {
        const reply = this.getMockAIReply(
          config.provider,
          request.review.rating,
          request.review.comment,
          request.review.reviewer_name,
          request.business.name,
          request.business.location,
          request.business.primaryKeyword
        );
        
        replies.push(reply);
      }
      
      return replies;
    } catch (error) {
      console.error('Error generating bulk AI replies:', error);
      throw error;
    }
  }
  
  // Mock AI reply generation based on review characteristics
  private getMockAIReply(
    provider: LLMProvider,
    rating: number,
    comment: string,
    reviewerName: string,
    businessName: string,
    location: string,
    keyword: string
  ): string {
    // Determine sentiment based on rating
    const isPositive = rating >= 4;
    const isNeutral = rating === 3;
    const isNegative = rating <= 2;
    
    // Base responses by sentiment with different styles for different providers
    let response = '';
    
    if (isPositive) {
      switch(provider) {
        case 'openai':
          response = `Thank you so much for your wonderful review, ${reviewerName}! We're thrilled that you enjoyed your experience at our ${keyword} in ${location}. Your feedback means the world to us at ${businessName}, and we look forward to serving you again soon!`;
          break;
        case 'claude':
          response = `We're incredibly grateful for your kind words, ${reviewerName}! It's reviews like yours that make our work at ${businessName} truly rewarding. We strive to provide the best ${keyword} experience in ${location}, and we're delighted we could exceed your expectations. Please visit us again soon!`;
          break;
        case 'deepseek':
          response = `Thank you for the amazing review, ${reviewerName}! At ${businessName}, we're passionate about delivering exceptional ${keyword} service in ${location}. We're so happy you noticed our commitment to quality. We can't wait to welcome you back!`;
          break;
        case 'grok':
          response = `Wow, thanks a million, ${reviewerName}! 🌟 Your awesome review just made our day at ${businessName}! We put our hearts into being the best ${keyword} provider in ${location}, and it's fantastic to know it shows. Hope to see you again soon!`;
          break;
      }
    } else if (isNeutral) {
      switch(provider) {
        case 'openai':
          response = `Thank you for taking the time to share your feedback, ${reviewerName}. We appreciate your honest review of our ${keyword} services at ${businessName} in ${location}. We're constantly working to improve, and your insights will help us enhance our offerings. If there's anything specific we could do better, please don't hesitate to reach out directly.`;
          break;
        case 'claude':
          response = `We sincerely appreciate your balanced feedback, ${reviewerName}. At ${businessName}, we value every opportunity to improve our ${keyword} services in ${location}. Your experience matters to us, and we'd love to hear more about how we could make your next visit a five-star experience. Thank you for choosing us.`;
          break;
        case 'deepseek':
          response = `Thank you for your thoughtful review, ${reviewerName}. We at ${businessName} are dedicated to providing exceptional ${keyword} experiences in ${location}, and we take all feedback seriously. We'd love to learn more about how we can exceed your expectations next time - please feel free to contact us directly with any specific suggestions.`;
          break;
        case 'grok':
          response = `Thanks for the honest review, ${reviewerName}! 👍 We're all about continuous improvement at ${businessName}, especially when it comes to our ${keyword} offerings in ${location}. We'd love to turn that 3-star experience into a 5-star one next time! Any specific suggestions? Drop us a line anytime!`;
          break;
      }
    } else if (isNegative) {
      switch(provider) {
        case 'openai':
          response = `We sincerely apologize for your disappointing experience, ${reviewerName}. At ${businessName}, we hold ourselves to high standards for our ${keyword} services in ${location}, and we clearly fell short. Your feedback is invaluable as we work to improve. I would appreciate the opportunity to address your concerns personally - please contact me directly at your convenience.`;
          break;
        case 'claude':
          response = `We're truly sorry about your experience at ${businessName}, ${reviewerName}. There's no excuse for falling short of expectations, especially regarding our ${keyword} services in ${location}. We take full responsibility and are already implementing changes based on your valuable feedback. I'd welcome the chance to make this right - please reach out to us directly.`;
          break;
        case 'deepseek':
          response = `On behalf of everyone at ${businessName}, I want to apologize for your unsatisfactory experience with our ${keyword} services in ${location}. Your feedback is taken very seriously, and we're already addressing the issues you've highlighted. We'd appreciate the opportunity to regain your trust - please contact us directly so we can make things right.`;
          break;
        case 'grok':
          response = `We're really sorry we missed the mark, ${reviewerName}. 😔 That's definitely not the ${keyword} experience we aim to provide at ${businessName} in ${location}. Your feedback is super valuable and we're already working on improvements. We'd love a chance to make it up to you - please reach out directly and let's find a solution together.`;
          break;
      }
    }
    
    return response;
  }
}

export const aiService = new AIService();