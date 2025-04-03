/**
 * NLP Service
 * 
 * A service for natural language processing tasks including:
 * - Text generation (using OpenAI or similar)
 * - Sentiment analysis 
 * - Keyword extraction
 * - FAQ matching
 * 
 * This service provides a unified interface for NLP tasks with fallback strategies
 * when primary APIs are unavailable.
 */

import OpenAI from 'openai';
import natural from 'natural';
import { storage } from '../storage';

// Separate utility function to match questions to FAQs
export async function matchQuestionToFaqs(question: string, locationId: number, userId: number) {
  // Create a temporary instance of the service
  const nlpService = new NlpService();
  
  // Get all the stored FAQs for the location
  const faqs = await storage.getFaqs(locationId);
  
  if (!faqs || faqs.length === 0) {
    return {
      matches: [],
      found: false
    };
  }
  
  // Use the service to perform similarity matching
  return nlpService.findSimilarFaqs(question, faqs);
}

export class NlpService {
  private openaiApiKey: string;
  private openai: OpenAI | null = null;
  private analyzerNatural: any;
  
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.initializeClients();
    
    // We don't need to initialize the analyzer here since we're using a custom approach
    this.analyzerNatural = null;
  }
  
  /**
   * Initialize NLP clients
   */
  private initializeClients(): void {
    // Initialize OpenAI if key is available
    if (this.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: this.openaiApiKey
      });
    }
  }
  
  /**
   * Generate text using a prompt
   * @param prompt The prompt to generate text from
   * @returns Generated text or null if generation fails
   */
  async generateText(prompt: string): Promise<string | null> {
    try {
      // Try OpenAI first if available
      if (this.openai && this.openaiApiKey) {
        const response = await this.openai.completions.create({
          model: 'gpt-3.5-turbo-instruct',
          prompt,
          max_tokens: 500,
          temperature: 0.7
        });
        
        if (response.choices && response.choices.length > 0) {
          return response.choices[0].text?.trim() || null;
        }
      }
      
      // If OpenAI fails or is not available, return null
      // This will trigger the fallback in the service that called this method
      return null;
    } catch (error) {
      console.error('Error generating text:', error);
      return null;
    }
  }
  
  /**
   * Analyze sentiment of text
   * @param text Text to analyze
   * @returns Sentiment analysis result with score and magnitude
   */
  async analyzeSentiment(text: string): Promise<{ score: number; magnitude: number }> {
    try {
      // Just use Natural library for sentiment analysis
      return this.analyzeWithNatural(text);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Return neutral sentiment in case of error
      return { score: 0, magnitude: 0 };
    }
  }
  
  /**
   * Analyze sentiment using a simple approach
   * @param text Text to analyze
   * @returns Sentiment score and magnitude
   */
  private analyzeWithNatural(text: string): { score: number; magnitude: number } {
    try {
      // Basic positive and negative word lists
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'happy', 
        'recommend', 'perfect', 'awesome', 'fantastic', 'satisfied', 'helpful', 'beautiful', 'easy'];
        
      const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'worst', 'hate', 'disappointed', 'horrible', 
        'avoid', 'waste', 'slow', 'rude', 'difficult', 'useless', 'broken', 'frustrating'];
      
      const lowerText = text.toLowerCase();
      let score = 0;
      
      // Count positive and negative words
      positiveWords.forEach(word => {
        if (lowerText.includes(word)) score += 0.2;
      });
      
      negativeWords.forEach(word => {
        if (lowerText.includes(word)) score -= 0.2;
      });
      
      // Clamp between -1 and 1
      const normalizedScore = Math.max(-1, Math.min(1, score));
      const magnitude = Math.min(2, Math.abs(normalizedScore) * 2);
      
      return {
        score: normalizedScore,
        magnitude
      };
    } catch (error) {
      console.error('Error in fallback sentiment analysis:', error);
      return { score: 0, magnitude: 0 };
    }
  }
  
  /**
   * Extract keywords from text
   * @param text Text to extract keywords from
   * @returns Array of keywords
   */
  async extractKeywords(text: string): Promise<string[]> {
    try {
      // Just use TF-IDF method
      return this.extractKeywordsWithTfIdf(text);
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }
  
  /**
   * Extract keywords using TF-IDF (fallback)
   * @param text Text to extract keywords from
   * @returns Array of keywords
   */
  private extractKeywordsWithTfIdf(text: string): string[] {
    try {
      // Basic stopwords list
      const stopwords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'of', 'to', 'for', 'with', 'is', 'are', 'was', 'were'];
      
      // Tokenize and filter out stopwords
      const tokenizer = new natural.WordTokenizer();
      const tokens = tokenizer.tokenize(text) || [];
      const filteredTokens = tokens.filter(token => 
        token.length > 2 && 
        !stopwords.includes(token.toLowerCase())
      );
      
      // Count word frequency
      const wordCounts: Record<string, number> = {};
      filteredTokens.forEach(token => {
        const word = token.toLowerCase();
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
      
      // Sort by frequency
      const sortedWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
      
      // Return top keywords (up to 10)
      return sortedWords.slice(0, 10);
    } catch (error) {
      console.error('Error in TF-IDF keyword extraction:', error);
      return [];
    }
  }
  
  /**
   * Find similar FAQs to a user question
   * @param question The user question
   * @param faqs Array of stored FAQs
   * @returns Matching FAQs with similarity scores
   */
  findSimilarFaqs(question: string, faqs: any[]): { matches: any[]; found: boolean } {
    try {
      // Initialize TF-IDF for text similarity
      const tfidf = new natural.TfIdf();
      
      // Add the question and all FAQ questions to the corpus
      tfidf.addDocument(question.toLowerCase());
      faqs.forEach((faq, index) => {
        tfidf.addDocument(faq.question.toLowerCase());
      });
      
      // Calculate similarity scores
      const matches = faqs.map((faq, index) => {
        // Calculate TF-IDF similarity (using cosine similarity)
        let similarity = 0;
        tfidf.tfidfs(question.toLowerCase(), (i, measure) => {
          if (i === index + 1) { // +1 because question is the first document
            similarity = measure;
          }
        });
        
        // If similarity is above threshold, consider it a match
        const isMatch = similarity > 0.1;
        
        return {
          ...faq,
          similarity,
          isMatch
        };
      });
      
      // Sort by similarity score (descending)
      const sortedMatches = matches
        .filter(m => m.isMatch)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3); // Return top 3 matches
      
      return {
        matches: sortedMatches,
        found: sortedMatches.length > 0
      };
    } catch (error) {
      console.error('Error finding similar FAQs:', error);
      return { matches: [], found: false };
    }
  }
  
  /**
   * Generate a response to a review
   * @param reviewText The review text
   * @param reviewerName Name of the reviewer
   * @param rating Review rating (1-5)
   * @returns Generated response
   */
  async generateReviewResponse(
    reviewText: string,
    reviewerName: string,
    rating: number
  ): Promise<string> {
    try {
      // Try to use OpenAI if available
      if (this.openai && this.openaiApiKey) {
        const prompt = `
Generate a helpful, friendly response to this customer review. 
Be professional, empathetic, and specific to the review content.

Review by ${reviewerName} (${rating}/5 stars):
"${reviewText}"

Response:`;

        const response = await this.generateText(prompt);
        if (response) {
          return response;
        }
      }
      
      // Fallback to template-based response
      return this.generateTemplateResponse(reviewText, reviewerName, rating);
    } catch (error) {
      console.error('Error generating review response:', error);
      return this.generateTemplateResponse(reviewText, reviewerName, rating);
    }
  }
  
  /**
   * Generate a template-based response for a review (fallback)
   * @param reviewText Review text
   * @param reviewerName Reviewer name
   * @param rating Rating (1-5)
   * @returns Template-based response
   */
  private generateTemplateResponse(reviewText: string, reviewerName: string, rating: number): string {
    const firstName = reviewerName.split(' ')[0];
    
    // Different templates based on rating
    if (rating <= 2) {
      return `Thank you for your feedback, ${firstName}. We're sorry to hear about your experience. We take all feedback seriously and would like to make things right. Please contact us directly so we can address your concerns personally.`;
    } else if (rating === 3) {
      return `Thank you for your review, ${firstName}. We appreciate your feedback and are constantly working to improve. We'd love to hear more about how we can make your next experience with us even better.`;
    } else {
      return `Thank you for your kind review, ${firstName}! We're thrilled that you had a positive experience and appreciate you taking the time to share your feedback. We look forward to serving you again soon!`;
    }
  }
}