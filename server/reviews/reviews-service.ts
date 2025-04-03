/**
 * Reviews Service
 * Handles review analysis operations and NLP integration
 */

import natural from 'natural';
import { storage } from '../storage';
import { apiKeysService } from '../api-keys/api-keys-service';
import { NlpService } from '../nlp/nlp-service';

// Create an instance of the NlpService class
const nlpService = new NlpService();

// Define review types
export interface ReviewData {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  reply?: string;
  reply_timestamp?: Date;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  sentiment: {
    score: number;
    magnitude: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  themes: string[];
  has_response: boolean;
  response_suggestion?: string;
}

export interface ReviewAnalysisResult {
  score: number;
  reviews: ReviewData[];
  recommendations: string[];
  priority_reviews: ReviewData[];
  sentiment_summary: {
    positive: number;
    negative: number;
    neutral: number;
    average_rating: number;
  };
  common_themes: {
    theme: string;
    count: number;
    sentiment: number;
  }[];
}

/**
 * Reviews Service
 * Handles review analysis and response recommendations
 */
class ReviewsService {
  /**
   * Analyze reviews for a GBP location
   * @param userId User ID
   * @param locationId GBP Location ID
   */
  async analyzeReviews(userId: number, locationId: number): Promise<ReviewAnalysisResult> {
    try {
      // Get the business reviews
      const reviews = await this.getBusinessReviews(locationId);
      
      // Analyze reviews with NLP
      const analyzedReviews = await this.analyzeReviewsWithNlp(reviews);
      
      // Generate recommendations based on analysis
      const recommendations = this.generateRecommendations(analyzedReviews);
      
      // Calculate overall optimization score
      const score = this.calculateOptimizationScore(analyzedReviews);
      
      // Get priority reviews (negative or no response)
      const priorityReviews = analyzedReviews
        .filter(review => review.priority === 'high')
        .slice(0, 5);
      
      // Calculate sentiment summary
      const sentimentSummary = this.calculateSentimentSummary(analyzedReviews);
      
      // Extract common themes
      const commonThemes = this.extractCommonThemes(analyzedReviews);
      
      return {
        score,
        reviews: analyzedReviews,
        recommendations,
        priority_reviews: priorityReviews,
        sentiment_summary: sentimentSummary,
        common_themes: commonThemes
      };
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      
      // Return default structure with error message in recommendations
      return {
        score: 50,
        reviews: [],
        recommendations: ['Error analyzing reviews. Please try again later.'],
        priority_reviews: [],
        sentiment_summary: {
          positive: 0,
          negative: 0,
          neutral: 0,
          average_rating: 0
        },
        common_themes: []
      };
    }
  }

  /**
   * Generate a response suggestion for a specific review
   * @param userId User ID
   * @param reviewId Review ID
   * @param reviewText Review text content
   * @param reviewerName Reviewer name
   * @param rating Review rating
   */
  async generateResponseSuggestion(
    userId: number, 
    reviewId: string, 
    reviewText: string, 
    reviewerName: string,
    rating: number
  ): Promise<string> {
    try {
      // Check if advanced NLP (OpenAI) is available
      const apiKeys = await apiKeysService.getUserApiKeys(userId);
      const useAdvancedNlp = apiKeys?.use_advanced_nlp && apiKeys?.openai_api_key;
      
      if (useAdvancedNlp) {
        // Use OpenAI for response generation
        const response = await nlpService.generateReviewResponse(
          reviewText,
          reviewerName,
          rating
        );
        return response;
      } else {
        // Use template-based response generation
        return this.generateTemplateResponse(reviewText, reviewerName, rating);
      }
    } catch (error) {
      console.error('Error generating response suggestion:', error);
      return this.getDefaultResponse(rating);
    }
  }

  /**
   * Get reviews for a specific location
   * @param locationId GBP Location ID
   */
  private async getBusinessReviews(locationId: number): Promise<any[]> {
    // In a real implementation, fetch from Google API
    // For now, use mock data from storage
    const reviewsData = await storage.getGbpData(locationId, 'reviews');
    
    if (!reviewsData || !reviewsData.data) {
      return this.getMockReviews();
    }
    
    // If data exists but not in the expected format, return mock data
    if (!Array.isArray(reviewsData.data)) {
      return this.getMockReviews();
    }
    
    return reviewsData.data;
  }

  /**
   * Analyze reviews using NLP techniques
   * @param reviews Raw review data
   */
  private async analyzeReviewsWithNlp(reviews: any[]): Promise<ReviewData[]> {
    const tokenizer = new natural.WordTokenizer();
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    
    // Add review comments to TF-IDF for theme extraction
    reviews.forEach((review, index) => {
      if (review.comment) {
        tfidf.addDocument(review.comment);
      }
    });
    
    // Process each review
    const analyzedReviews: ReviewData[] = await Promise.all(
      reviews.map(async (review) => {
        // Analyze sentiment with Natural's built-in sentiment analyzer
        const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        const tokens = tokenizer.tokenize(review.comment || '');
        const sentimentScore = tokens.length > 0 ? analyzer.getSentiment(tokens) : 0;
        
        // Scale sentiment score to range of -1 to 1
        const normalizedScore = sentimentScore * 2; // Natural's scores tend to be small
        
        // Determine sentiment label
        let sentimentLabel: 'positive' | 'negative' | 'neutral';
        if (normalizedScore > 0.2) {
          sentimentLabel = 'positive';
        } else if (normalizedScore < -0.2) {
          sentimentLabel = 'negative';
        } else {
          sentimentLabel = 'neutral';
        }
        
        // Extract themes (keywords) from the review
        const themes: string[] = [];
        if (review.comment) {
          // Use TF-IDF to find important terms
          tfidf.listTerms(reviews.indexOf(review)).slice(0, 3).forEach(item => {
            if (item.term.length > 3) { // Only include meaningful terms
              themes.push(item.term);
            }
          });
        }
        
        // Determine priority based on rating and response status
        let priority: 'high' | 'medium' | 'low';
        if (review.rating <= 2 || !review.reply) {
          priority = 'high';
        } else if (review.rating === 3) {
          priority = 'medium';
        } else {
          priority = 'low';
        }
        
        return {
          id: review.id || `review-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          reviewer_name: review.reviewer_name || 'Anonymous',
          rating: review.rating || 5,
          comment: review.comment || '',
          reply: review.reply,
          reply_timestamp: review.reply_timestamp ? new Date(review.reply_timestamp) : undefined,
          timestamp: review.timestamp ? new Date(review.timestamp) : new Date(),
          priority,
          sentiment: {
            score: normalizedScore,
            magnitude: Math.abs(normalizedScore),
            label: sentimentLabel
          },
          themes,
          has_response: !!review.reply,
          response_suggestion: await this.generateResponseSuggestion(
            0, // placeholder userId, will be replaced in actual API call
            review.id || '',
            review.comment || '',
            review.reviewer_name || 'Anonymous',
            review.rating || 5
          )
        };
      })
    );
    
    return analyzedReviews;
  }

  /**
   * Generate recommendations based on review analysis
   * @param analyzedReviews Analyzed review data
   */
  private generateRecommendations(analyzedReviews: ReviewData[]): string[] {
    const recommendations: string[] = [];
    
    // Get counts for various metrics
    const totalReviews = analyzedReviews.length;
    const reviewsWithReplies = analyzedReviews.filter(r => r.has_response).length;
    const negativeReviews = analyzedReviews.filter(r => r.sentiment.label === 'negative').length;
    const negativeNoReply = analyzedReviews.filter(r => 
      r.sentiment.label === 'negative' && !r.has_response
    ).length;
    
    // Calculate response rate
    const responseRate = totalReviews > 0 ? (reviewsWithReplies / totalReviews) * 100 : 0;
    
    // 1. Response rate recommendation
    if (responseRate < 80) {
      recommendations.push(
        `Improve your response rate (currently ${responseRate.toFixed(0)}%). Aim to respond to at least 80% of customer reviews.`
      );
    }
    
    // 2. Negative reviews recommendation
    if (negativeNoReply > 0) {
      recommendations.push(
        `Respond to ${negativeNoReply} negative ${negativeNoReply === 1 ? 'review' : 'reviews'} that need attention. Addressing concerns can improve customer satisfaction.`
      );
    }
    
    // 3. Response time recommendation
    const oldUnansweredReviews = analyzedReviews.filter(r => 
      !r.has_response && 
      ((new Date().getTime() - r.timestamp.getTime()) > 7 * 24 * 60 * 60 * 1000) // older than 7 days
    ).length;
    
    if (oldUnansweredReviews > 0) {
      recommendations.push(
        `Respond more quickly to reviews. You have ${oldUnansweredReviews} ${oldUnansweredReviews === 1 ? 'review' : 'reviews'} older than a week without a response.`
      );
    }
    
    // 4. Common themes in negative reviews
    const negativeThemes = new Map<string, number>();
    analyzedReviews
      .filter(r => r.sentiment.label === 'negative')
      .forEach(review => {
        review.themes.forEach(theme => {
          negativeThemes.set(theme, (negativeThemes.get(theme) || 0) + 1);
        });
      });
    
    // Find the most common negative theme
    let mostCommonNegativeTheme = '';
    let highestCount = 0;
    
    negativeThemes.forEach((count, theme) => {
      if (count > highestCount) {
        highestCount = count;
        mostCommonNegativeTheme = theme;
      }
    });
    
    if (mostCommonNegativeTheme && highestCount > 1) {
      recommendations.push(
        `Address "${mostCommonNegativeTheme}" in your business operations - it appears in multiple negative reviews.`
      );
    }
    
    // 5. General recommendation for review management
    if (totalReviews < 10) {
      recommendations.push(
        `Encourage more customer reviews. A larger sample size helps build trust and provides better insights.`
      );
    }
    
    // 6. If negative reviews are high, recommend addressing them in description
    if (negativeReviews > 0 && (negativeReviews / totalReviews > 0.3)) {
      recommendations.push(
        `Consider addressing common concerns proactively in your business description to set appropriate expectations.`
      );
    }
    
    // 7. Generic recommendation if we don't have enough specific ones
    if (recommendations.length < 3) {
      recommendations.push(
        `Maintain your review management strategy by responding promptly to all reviews.`
      );
    }
    
    return recommendations;
  }

  /**
   * Calculate optimization score based on review analysis
   * @param analyzedReviews Analyzed review data
   */
  private calculateOptimizationScore(analyzedReviews: ReviewData[]): number {
    if (analyzedReviews.length === 0) {
      return 50; // Neutral score if no reviews
    }
    
    let score = 50; // Start at a neutral point
    
    // Factor 1: Response rate (up to +25 points)
    const totalReviews = analyzedReviews.length;
    const reviewsWithReplies = analyzedReviews.filter(r => r.has_response).length;
    const responseRate = totalReviews > 0 ? (reviewsWithReplies / totalReviews) : 0;
    
    const responseRateScore = Math.min(25, Math.round(responseRate * 25));
    score += responseRateScore;
    
    // Factor 2: Average sentiment (up to +/- 15 points)
    const averageSentiment = analyzedReviews.reduce((sum, review) => sum + review.sentiment.score, 0) / totalReviews;
    const sentimentScore = Math.round(averageSentiment * 15);
    score += sentimentScore;
    
    // Factor 3: Response to negative reviews (up to +10 points)
    const negativeReviews = analyzedReviews.filter(r => r.sentiment.label === 'negative');
    const negativeWithReplies = negativeReviews.filter(r => r.has_response);
    const negativeResponseRate = negativeReviews.length > 0 ? 
      (negativeWithReplies.length / negativeReviews.length) : 1;
    
    const negativeResponseScore = Math.min(10, Math.round(negativeResponseRate * 10));
    score += negativeResponseScore;
    
    // Factor 4: Recency of responses (up to +10 points)
    // Check for reviews responded to within 48 hours
    const recentResponses = analyzedReviews.filter(r => {
      if (!r.has_response || !r.reply_timestamp) return false;
      const responseTime = r.reply_timestamp.getTime() - r.timestamp.getTime();
      return responseTime <= 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    }).length;
    
    const recentResponseRate = totalReviews > 0 ? (recentResponses / totalReviews) : 0;
    const recentResponseScore = Math.min(10, Math.round(recentResponseRate * 10));
    score += recentResponseScore;
    
    // Ensure the score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate sentiment summary statistics
   * @param analyzedReviews Analyzed review data
   */
  private calculateSentimentSummary(analyzedReviews: ReviewData[]): {
    positive: number;
    negative: number;
    neutral: number;
    average_rating: number;
  } {
    const positive = analyzedReviews.filter(r => r.sentiment.label === 'positive').length;
    const negative = analyzedReviews.filter(r => r.sentiment.label === 'negative').length;
    const neutral = analyzedReviews.filter(r => r.sentiment.label === 'neutral').length;
    
    const totalRating = analyzedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = analyzedReviews.length > 0 ? 
      parseFloat((totalRating / analyzedReviews.length).toFixed(1)) : 0;
    
    return {
      positive,
      negative,
      neutral,
      average_rating: averageRating
    };
  }

  /**
   * Extract common themes from analyzed reviews
   * @param analyzedReviews Analyzed review data
   */
  private extractCommonThemes(analyzedReviews: ReviewData[]): {
    theme: string;
    count: number;
    sentiment: number;
  }[] {
    // Create a map to track themes and associated sentiment
    const themeMap = new Map<string, { count: number, sentimentSum: number }>();
    
    // Process all themes from all reviews
    analyzedReviews.forEach(review => {
      review.themes.forEach(theme => {
        const existing = themeMap.get(theme) || { count: 0, sentimentSum: 0 };
        themeMap.set(theme, {
          count: existing.count + 1,
          sentimentSum: existing.sentimentSum + review.sentiment.score
        });
      });
    });
    
    // Convert map to array and calculate average sentiment
    const themes = Array.from(themeMap.entries())
      .filter(([_, data]) => data.count > 1) // Only include themes that appear more than once
      .map(([theme, data]) => ({
        theme,
        count: data.count,
        sentiment: parseFloat((data.sentimentSum / data.count).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count) // Sort by frequency
      .slice(0, 5); // Get top 5 themes
    
    return themes;
  }

  /**
   * Generate a template-based response for a review
   * @param reviewText Review text
   * @param reviewerName Reviewer name
   * @param rating Review rating
   */
  private generateTemplateResponse(reviewText: string, reviewerName: string, rating: number): string {
    // Determine if the review is positive, negative, or neutral
    let responseTemplate = '';
    
    if (rating >= 4) {
      // Positive review templates
      const positiveTemplates = [
        `Thank you so much for your wonderful review, ${reviewerName}! We're thrilled that you enjoyed your experience with us. Your feedback means a lot, and we look forward to serving you again soon!`,
        `We really appreciate your kind words, ${reviewerName}! It's great to hear that you had such a positive experience. Thank you for taking the time to share your feedback, and we hope to see you again!`,
        `Thank you for the fantastic review, ${reviewerName}! We're delighted that you were satisfied with our service. Customer satisfaction is our top priority, and we're glad we could deliver that for you.`
      ];
      
      responseTemplate = positiveTemplates[Math.floor(Math.random() * positiveTemplates.length)];
    } else if (rating <= 2) {
      // Negative review templates
      const negativeTemplates = [
        `We're sorry to hear about your experience, ${reviewerName}. We always strive to provide the best service possible, and we clearly missed the mark here. Please contact us directly so we can address your concerns and make things right.`,
        `Thank you for bringing this to our attention, ${reviewerName}. We apologize for not meeting your expectations. We take feedback seriously and will use this as an opportunity to improve. Please reach out to us directly so we can resolve these issues.`,
        `We apologize for your disappointing experience, ${reviewerName}. This is not representative of the service we aim to provide. We would appreciate the opportunity to make this right - please contact us directly to discuss your concerns.`
      ];
      
      responseTemplate = negativeTemplates[Math.floor(Math.random() * negativeTemplates.length)];
    } else {
      // Neutral review templates
      const neutralTemplates = [
        `Thank you for your feedback, ${reviewerName}. We appreciate you taking the time to share your experience. We're always looking for ways to improve, so please let us know if you have any specific suggestions.`,
        `We value your input, ${reviewerName}. Thank you for sharing your thoughts with us. If there's anything we could have done better, please don't hesitate to let us know so we can enhance your experience next time.`,
        `Thanks for your review, ${reviewerName}. We're committed to providing the best possible service, and your feedback helps us achieve that goal. We hope to serve you again and exceed your expectations.`
      ];
      
      responseTemplate = neutralTemplates[Math.floor(Math.random() * neutralTemplates.length)];
    }
    
    return responseTemplate;
  }

  /**
   * Get default response based on rating
   * @param rating Review rating
   */
  private getDefaultResponse(rating: number): string {
    if (rating >= 4) {
      return "Thank you for your positive review! We're glad you enjoyed your experience and appreciate your feedback.";
    } else if (rating <= 2) {
      return "We apologize for your experience. We take your feedback seriously and would like to make things right. Please contact us directly to discuss your concerns.";
    } else {
      return "Thank you for your feedback. We value your input and are always looking for ways to improve your experience with us.";
    }
  }

  /**
   * Get mock reviews for testing/development
   */
  private getMockReviews(): any[] {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    
    return [
      {
        id: 'review-1',
        reviewer_name: 'John Smith',
        rating: 5,
        comment: 'Great service and friendly staff! The facility was clean and well-maintained. Will definitely come back again.',
        reply: 'Thank you for your kind review, John! We appreciate your business and look forward to serving you again.',
        reply_timestamp: new Date(now.getTime() - 2 * oneDay),
        timestamp: new Date(now.getTime() - 3 * oneDay)
      },
      {
        id: 'review-2',
        reviewer_name: 'Sarah Johnson',
        rating: 2,
        comment: 'Disappointed with the service. Long wait times and staff seemed disinterested. The prices are also too high for what you get.',
        reply: null,
        timestamp: new Date(now.getTime() - 5 * oneDay)
      },
      {
        id: 'review-3',
        reviewer_name: 'Michael Chen',
        rating: 4,
        comment: 'Good experience overall. Professional service and quality products. The only issue was parking, which was limited.',
        reply: 'Thanks for your feedback, Michael! We appreciate your comments about our service and products. We understand parking can be challenging at times and are actively working on solutions.',
        reply_timestamp: new Date(now.getTime() - 1 * oneDay),
        timestamp: new Date(now.getTime() - 1.5 * oneDay)
      },
      {
        id: 'review-4',
        reviewer_name: 'Emma Wilson',
        rating: 1,
        comment: 'Terrible experience. The product I received was damaged and customer service was unhelpful when I tried to get a replacement.',
        reply: null,
        timestamp: new Date(now.getTime() - 2 * oneDay)
      },
      {
        id: 'review-5',
        reviewer_name: 'David Garcia',
        rating: 3,
        comment: 'Average service. Nothing particularly good or bad to report. Prices seem reasonable but selection is limited.',
        reply: null,
        timestamp: new Date(now.getTime() - 7 * oneDay)
      },
      {
        id: 'review-6',
        reviewer_name: 'Lisa Thompson',
        rating: 5,
        comment: 'Absolutely love this place! The staff went above and beyond to help me find exactly what I needed. Highly recommend!',
        reply: "Thank you for the glowing review, Lisa! We're thrilled to hear about your positive experience and look forward to your next visit.",
        reply_timestamp: new Date(now.getTime() - 0.5 * oneDay),
        timestamp: new Date(now.getTime() - 1 * oneDay)
      },
      {
        id: 'review-7',
        reviewer_name: 'Robert Kim',
        rating: 2,
        comment: 'Not impressed. Service was slow and the staff seemed untrained. There are better options in the area.',
        reply: null,
        timestamp: new Date(now.getTime() - 4 * oneDay)
      },
      {
        id: 'review-8',
        reviewer_name: 'Jennifer Lopez',
        rating: 4,
        comment: 'Good service and products. The staff was friendly and knowledgeable. Would recommend to friends.',
        reply: 'Thanks for your kind words, Jennifer! We appreciate your recommendation and hope to see you again soon.',
        reply_timestamp: new Date(now.getTime() - 3 * oneDay),
        timestamp: new Date(now.getTime() - 4 * oneDay)
      }
    ];
  }
}

export const reviewsService = new ReviewsService();