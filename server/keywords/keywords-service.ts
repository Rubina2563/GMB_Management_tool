/**
 * Keywords Service
 * Handles keyword analysis operations and DataForSEO API integration
 */

import natural from 'natural';
import { KeywordOptimization } from '@shared/schema';
import { storage } from '../storage';
import { apiKeysService } from '../api-keys/api-keys-service';
import axios from 'axios';

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  priority: number;
  is_current?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'applied';
}

interface ContentAnalysisResult {
  contentKeywords: string[];
  reviewKeywords: string[];
}

interface KeywordAnalysisResult {
  score: number;
  contentAnalysis: ContentAnalysisResult;
  suggestions: KeywordData[];
  recommendations: string[];
}

class KeywordsService {
  /**
   * Analyze GBP content to extract and suggest keywords
   * @param userId User ID
   * @param locationId GBP Location ID
   */
  async analyzeKeywords(userId: number, locationId: number): Promise<KeywordAnalysisResult> {
    try {
      // Check if the user has the required API keys
      const apiKeysCheck = await apiKeysService.checkRequiredApiKeys(userId, ['data_for_seo_key', 'data_for_seo_email']);
      
      if (!apiKeysCheck.success) {
        throw new Error('Missing required API keys: ' + apiKeysCheck.missingKeys?.join(', '));
      }
      
      // Get the business location
      const location = await storage.getGbpLocationById(locationId);
      
      if (!location) {
        throw new Error('Location not found');
      }
      
      // Get business content for analysis
      const businessContent = await this.getBusinessContent(locationId);
      
      // Analyze content with NLP
      const contentAnalysis = await this.analyzeContent(businessContent);
      
      // Get existing keywords for this location
      const existingKeywords = await storage.getGbpKeywordsByLocationId(locationId);
      
      // Get API keys
      const apiKeys = await apiKeysService.getUserApiKeys(userId);
      
      // Get keyword suggestions from DataForSEO API
      const category = location.category || 'business';
      const suggestedKeywords = await this.getDataForSEOKeywordSuggestions(
        contentAnalysis.contentKeywords,
        category,
        apiKeys?.data_for_seo_email || '',
        apiKeys?.data_for_seo_key || ''
      );
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        contentAnalysis,
        suggestedKeywords,
        existingKeywords
      );
      
      // Calculate optimization score
      const score = this.calculateOptimizationScore(
        contentAnalysis,
        suggestedKeywords,
        existingKeywords
      );
      
      return {
        score,
        contentAnalysis,
        suggestions: suggestedKeywords,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing keywords:', error);
      throw error;
    }
  }

  /**
   * Get business content for analysis
   */
  private async getBusinessContent(locationId: number): Promise<{description: string, posts: string[], reviews: string[]}> {
    // Get GBP posts for the location
    const posts = await storage.getGbpPosts(locationId);
    
    // Extract post content
    const postContent = posts.map(post => post.content);
    
    // Get GBP data for the location (this would include reviews in a real implementation)
    const gbpData = await storage.getGbpData(locationId, 'reviews');
    
    // Extract review content (simplified for this implementation)
    const reviewContent: string[] = [];
    
    if (gbpData && gbpData.data) {
      try {
        const reviewsData = typeof gbpData.data === 'string' 
          ? JSON.parse(gbpData.data) 
          : gbpData.data;
        
        if (Array.isArray(reviewsData)) {
          reviewsData.forEach((review: any) => {
            if (review.comment) {
              reviewContent.push(review.comment);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing review data:', error);
      }
    }
    
    // Get location details
    const location = await storage.getGbpLocationById(locationId);
    const description = location?.category || '';
    
    return {
      description,
      posts: postContent,
      reviews: reviewContent
    };
  }

  /**
   * Analyze content using NLP techniques
   */
  private async analyzeContent(businessContent: {description: string, posts: string[], reviews: string[]}): Promise<ContentAnalysisResult> {
    // Combine all post content
    const combinedPostsText = businessContent.posts.join(' ');
    
    // Combine all review content
    const combinedReviewsText = businessContent.reviews.join(' ');
    
    // Extract keywords from posts and description
    const contentKeywords = this.identifyPhrases(businessContent.description + ' ' + combinedPostsText);
    
    // Extract keywords from reviews
    const reviewKeywords = this.identifyPhrases(combinedReviewsText);
    
    return {
      contentKeywords,
      reviewKeywords
    };
  }

  /**
   * Identify phrases in text
   */
  private identifyPhrases(text: string): string[] {
    // Use natural library for keyword extraction
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    if (!tokens || tokens.length === 0) {
      return [];
    }
    
    // Filter out common stop words
    const stopwords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by'];
    const filteredTokens = tokens.filter(token => !stopwords.includes(token) && token.length > 2);
    
    // Count token frequencies
    const tokenCounts: Record<string, number> = {};
    filteredTokens.forEach(token => {
      tokenCounts[token] = (tokenCounts[token] || 0) + 1;
    });
    
    // Sort by frequency and take top 15
    const sortedTokens = Object.entries(tokenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([token]) => token);
    
    // Identify 2-word phrases
    const bigrams = natural.NGrams.bigrams(filteredTokens);
    
    // Count bigram frequencies
    const bigramCounts: Record<string, number> = {};
    bigrams.forEach(bigram => {
      const phrase = bigram.join(' ');
      bigramCounts[phrase] = (bigramCounts[phrase] || 0) + 1;
    });
    
    // Sort by frequency and take top 10
    const sortedBigrams = Object.entries(bigramCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);
    
    // Return combined keywords and phrases
    return [...sortedTokens, ...sortedBigrams];
  }

  /**
   * Get keyword suggestions from DataForSEO API
   */
  private async getDataForSEOKeywordSuggestions(
    keywords: string[],
    category: string,
    login: string,
    password: string
  ): Promise<KeywordData[]> {
    // For demo/development purposes, return mock data if using mock credentials
    if (login.startsWith('mock') || password.startsWith('mock')) {
      return this.getMockKeywordSuggestions(keywords, category);
    }
    
    try {
      // Use no more than 5 keywords for the API request
      const seedKeywords = keywords.slice(0, 5);
      
      // Convert category to DataForSEO category code
      const categoryId = this.mapBusinessCategoryToDataForSEOCode(category);
      
      // Prepare the API request body
      const requestData = [{
        keywords: seedKeywords,
        location_code: 2840, // USA
        language_code: "en",
        category_code: categoryId,
        depth: 3,
        limit: 10,
        include_serp_info: false,
        include_seed_keyword: true
      }];
      
      // Make the API request
      const response = await axios({
        method: 'post',
        url: 'https://api.dataforseo.com/v3/keywords_data/google/keywords_for_keywords/live',
        auth: {
          username: login,
          password: password
        },
        data: requestData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data || !response.data.tasks || !response.data.tasks[0].result) {
        throw new Error('Invalid response from DataForSEO API');
      }
      
      // Extract results
      const results = response.data.tasks[0].result;
      
      // Process results
      return results.map((item: any) => {
        const volume = item.search_volume || 0;
        const competition = item.keyword_difficulty || 0;
        
        return {
          keyword: item.keyword,
          volume,
          difficulty: this.calculateDifficulty(competition),
          priority: this.calculatePriority(volume, competition),
          is_current: true,
          status: 'pending'
        };
      });
    } catch (error) {
      console.error('Error getting keyword suggestions from DataForSEO:', error);
      
      // Fall back to mock data on API error
      return this.getMockKeywordSuggestions(keywords, category);
    }
  }

  /**
   * Get mock keyword suggestions for testing/development
   */
  private getMockKeywordSuggestions(keywords: string[], category: string): KeywordData[] {
    // Combine keywords with category-specific terms
    const combinedKeywords = [
      ...keywords,
      category,
      `best ${category}`,
      `${category} near me`,
      `top ${category}`,
      `affordable ${category}`,
      `professional ${category}`
    ];
    
    // Generate mock suggestions
    return combinedKeywords.slice(0, 10).map(keyword => {
      // Generate random but somewhat realistic values
      const volume = Math.floor(Math.random() * 8000) + 100;
      const difficultyValue = Math.floor(Math.random() * 10) + 1;
      
      return {
        keyword,
        volume,
        difficulty: difficultyValue,
        priority: this.calculatePriority(volume, difficultyValue * 10), // Scale up for the API format
        is_current: true,
        status: 'pending'
      };
    });
  }

  /**
   * Map business category to DataForSEO category code
   */
  private mapBusinessCategoryToDataForSEOCode(category: string): number {
    // Simplified mapping
    const categoryMapping: Record<string, number> = {
      'restaurant': 1022, // Restaurants
      'food': 1022,
      'cafe': 1022,
      'hotel': 799, // Hotels
      'accommodation': 799,
      'retail': 784, // Shopping
      'store': 784,
      'shop': 784,
      'health': 45, // Health
      'medical': 45,
      'doctor': 45,
      'fitness': 174, // Fitness
      'gym': 174,
      'beauty': 68, // Beauty & Personal Care
      'salon': 68,
      'spa': 68,
      'auto': 47, // Automotive
      'car': 47,
      'repair': 47,
      'legal': 971, // Legal Services
      'lawyer': 971,
      'attorney': 971,
      'education': 191, // Education
      'school': 191,
      'real estate': 860, // Real Estate
      'property': 860,
      'financial': 303, // Finance
      'bank': 303,
      'insurance': 303,
      'travel': 670, // Travel
      'tourism': 670
    };
    
    // Default to "Business" category if no match
    const defaultCategoryId = 124;
    
    // Find matching category
    const lowerCategory = category.toLowerCase();
    
    for (const [key, code] of Object.entries(categoryMapping)) {
      if (lowerCategory.includes(key)) {
        return code;
      }
    }
    
    return defaultCategoryId;
  }

  /**
   * Calculate keyword difficulty on scale of 1-10
   */
  private calculateDifficulty(apiDifficulty: number): number {
    // DataForSEO difficulty is on a scale of 0-100
    // Convert to a scale of 1-10
    return Math.max(1, Math.min(10, Math.ceil(apiDifficulty / 10)));
  }

  /**
   * Calculate priority rating based on volume and difficulty (1-5 scale)
   */
  private calculatePriority(volume: number, difficulty: number): number {
    // Convert volume and difficulty to a 1-5 scale
    // High priority: High volume, low difficulty
    if (volume > 1000 && difficulty < 50) {
      return 5; // Highest priority
    }
    
    // Medium-high priority: Decent volume, medium difficulty
    if (volume > 500 && difficulty < 70) {
      return 4;
    }
    
    // Medium priority: Moderate volume or difficulty
    if (volume > 250 || difficulty < 80) {
      return 3;
    }
    
    // Medium-low priority: Low volume or high difficulty
    if (volume > 100 || difficulty < 90) {
      return 2;
    }
    
    // Low priority: Very low volume or very high difficulty
    return 1;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    contentAnalysis: ContentAnalysisResult,
    suggestedKeywords: KeywordData[],
    existingKeywords: KeywordOptimization[]
  ): string[] {
    const recommendations: string[] = [];
    
    // 1. Check if high priority keywords are being used
    const highPriorityKeywords = suggestedKeywords.filter(k => k.priority >= 4);
    
    if (highPriorityKeywords.length > 0) {
      const highPriorityValues = highPriorityKeywords.map(k => k.keyword);
      const existingValues = existingKeywords.map(k => k.keyword);
      
      const missingHighPriorityKeywords = highPriorityKeywords.filter(
        k => !existingValues.includes(k.keyword)
      );
      
      if (missingHighPriorityKeywords.length > 0) {
        const keywordsToAdd = missingHighPriorityKeywords.slice(0, 3).map(k => `"${k.keyword}"`).join(", ");
        recommendations.push(
          `Add high priority keywords to your profile: ${keywordsToAdd}`
        );
      }
    }
    
    // 2. Check for keyword diversity
    if (existingKeywords.length < 5) {
      recommendations.push(
        `Increase your keyword diversity. You should target at least 5-10 relevant keywords.`
      );
    }
    
    // 3. Content-specific recommendations
    if (contentAnalysis.contentKeywords.length < 10) {
      recommendations.push(
        `Add more detailed content to your GBP posts to increase relevant keyword opportunities.`
      );
    }
    
    // 4. Review-specific recommendations
    if (contentAnalysis.reviewKeywords.length < 5) {
      recommendations.push(
        `Encourage more detailed customer reviews to improve your keyword footprint.`
      );
    }
    
    // 5. Check if popular keywords from reviews match your content
    const reviewKeywordsSet = new Set(contentAnalysis.reviewKeywords);
    const contentKeywordsSet = new Set(contentAnalysis.contentKeywords);
    
    let missingReviewKeywords = 0;
    contentAnalysis.reviewKeywords.slice(0, 5).forEach(keyword => {
      if (!contentKeywordsSet.has(keyword)) {
        missingReviewKeywords++;
      }
    });
    
    if (missingReviewKeywords >= 3) {
      recommendations.push(
        `Align your content with customer expectations by incorporating terms from their reviews.`
      );
    }
    
    // 6. Generic recommendations if we don't have enough specific ones
    if (recommendations.length < 3) {
      recommendations.push(
        `Update your business description to include your primary keywords.`
      );
      recommendations.push(
        `Create regular posts that feature your target keywords naturally.`
      );
    }
    
    return recommendations;
  }

  /**
   * Calculate optimization score based on analysis
   */
  private calculateOptimizationScore(
    contentAnalysis: ContentAnalysisResult,
    suggestedKeywords: KeywordData[],
    existingKeywords: KeywordOptimization[]
  ): number {
    let score = 50; // Start at a neutral point
    
    // 1. Number of existing keywords (up to +15 points)
    const keywordCountScore = Math.min(15, existingKeywords.length * 3);
    score += keywordCountScore;
    
    // 2. High priority keywords being used (up to +15 points)
    const highPriorityKeywords = suggestedKeywords.filter(k => k.priority >= 4);
    const existingKeywordValues = existingKeywords.map(k => k.keyword);
    
    let highPriorityCount = 0;
    highPriorityKeywords.forEach(keyword => {
      if (existingKeywordValues.includes(keyword.keyword)) {
        highPriorityCount++;
      }
    });
    
    const highPriorityScore = Math.min(15, highPriorityCount * 5);
    score += highPriorityScore;
    
    // 3. Content keyword diversity (up to +10 points)
    const contentKeywordScore = Math.min(10, contentAnalysis.contentKeywords.length);
    score += contentKeywordScore;
    
    // 4. Review keywords being leveraged (up to +10 points)
    const reviewKeywordsSet = new Set(contentAnalysis.reviewKeywords);
    const contentKeywordsSet = new Set(contentAnalysis.contentKeywords);
    
    let matchingReviewKeywords = 0;
    reviewKeywordsSet.forEach(keyword => {
      if (contentKeywordsSet.has(keyword)) {
        matchingReviewKeywords++;
      }
    });
    
    const reviewKeywordScore = Math.min(10, matchingReviewKeywords * 2);
    score += reviewKeywordScore;
    
    // Ensure the score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update a location's keyword data
   */
  async updateKeywords(userId: number, locationId: number, keywords: Omit<KeywordOptimization, 'id'>[]): Promise<{ success: boolean; message: string }> {
    try {
      // Verify the location exists and belongs to the user
      const location = await storage.getGbpLocationById(locationId);
      
      if (!location) {
        return { 
          success: false, 
          message: 'Location not found' 
        };
      }
      
      if (location.user_id !== userId) {
        return { 
          success: false, 
          message: 'Unauthorized access to location' 
        };
      }
      
      // Delete existing keywords for this location
      await storage.deleteGbpKeywordsByLocationId(locationId);
      
      // Create new keywords
      for (const keyword of keywords) {
        await storage.createGbpKeyword({
          ...keyword,
          location_id: locationId
        });
      }
      
      return {
        success: true,
        message: 'Keywords updated successfully'
      };
    } catch (error) {
      console.error('Error updating keywords:', error);
      return {
        success: false,
        message: 'Failed to update keywords'
      };
    }
  }
}

export const keywordsService = new KeywordsService();