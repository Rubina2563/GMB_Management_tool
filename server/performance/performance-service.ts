/**
 * Performance Service
 * 
 * Provides services for retrieving and analyzing GBP performance metrics.
 * Uses the GBP API to fetch data and process it for display.
 */

import { createHash } from 'crypto';
import { NlpService } from '../nlp/nlp-service';

interface PerformanceMetrics {
  calls: {
    current: number;
    previous: number;
    change_percent: number;
  };
  website_clicks: {
    current: number;
    previous: number;
    change_percent: number;
  };
  direction_requests: {
    current: number;
    previous: number;
    change_percent: number;
  };
  views: {
    current: number;
    previous: number;
    change_percent: number;
  };
}

interface HistoricalTrend {
  month: string;
  calls: number;
  website_clicks: number;
  direction_requests: number;
  views: number;
}

interface PerformanceData {
  score: number;
  metrics: PerformanceMetrics;
  historical_trends: HistoricalTrend[];
  recommendations: string[];
}

export class PerformanceService {
  private nlpService: NlpService;

  constructor() {
    this.nlpService = new NlpService();
  }

  /**
   * Get performance metrics for a location
   * @param locationId - The ID of the location
   * @param timeframe - The timeframe for historical data (3m or 6m)
   * @returns Performance data including metrics, historical trends, and recommendations
   */
  async getPerformanceMetrics(locationId: number, timeframe: '3m' | '6m' = '3m'): Promise<PerformanceData> {
    try {
      // Fetch metrics from GBP API
      const metrics = await this.fetchMetrics(locationId);
      
      // Fetch historical trends
      const trends = await this.fetchHistoricalTrends(locationId, timeframe);
      
      // Generate recommendations based on metrics and trends
      const recommendations = await this.generateRecommendations(metrics, trends);
      
      // Calculate performance score
      const score = this.calculatePerformanceScore(metrics, trends);
      
      return {
        score,
        metrics,
        historical_trends: trends,
        recommendations
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      // If there's an error, return fallback data
      return this.getFallbackPerformanceData();
    }
  }

  /**
   * Fetch the latest performance metrics from GBP API
   * @param locationId - The ID of the location
   * @returns Current and previous metrics with change percentages
   */
  private async fetchMetrics(locationId: number): Promise<PerformanceMetrics> {
    try {
      // In a real implementation, this would call the GBP API
      // For now, we'll use deterministic mock data based on the locationId
      const seed = parseInt(createHash('md5').update(locationId.toString()).digest('hex').substring(0, 8), 16);
      const rand = (min: number, max: number) => Math.floor((seed / 0xFFFFFFFF) * (max - min + 1)) + min;
      
      const currentCalls = rand(50, 200);
      const previousCalls = rand(40, 180);
      
      const currentClicks = rand(100, 350);
      const previousClicks = rand(90, 320);
      
      const currentDirections = rand(30, 150);
      const previousDirections = rand(25, 140);
      
      const currentViews = rand(500, 1500);
      const previousViews = rand(450, 1400);
      
      return {
        calls: {
          current: currentCalls,
          previous: previousCalls,
          change_percent: this.calculateChangePercent(currentCalls, previousCalls)
        },
        website_clicks: {
          current: currentClicks,
          previous: previousClicks,
          change_percent: this.calculateChangePercent(currentClicks, previousClicks)
        },
        direction_requests: {
          current: currentDirections,
          previous: previousDirections,
          change_percent: this.calculateChangePercent(currentDirections, previousDirections)
        },
        views: {
          current: currentViews,
          previous: previousViews,
          change_percent: this.calculateChangePercent(currentViews, previousViews)
        }
      };
    } catch (error) {
      console.error('Error fetching metrics from GBP API:', error);
      throw error;
    }
  }

  /**
   * Fetch historical performance trends
   * @param locationId - The ID of the location
   * @param timeframe - The timeframe for historical data (3m or 6m)
   * @returns Array of monthly performance data
   */
  private async fetchHistoricalTrends(locationId: number, timeframe: '3m' | '6m'): Promise<HistoricalTrend[]> {
    try {
      // In a real implementation, this would call the GBP API
      // For now, we'll generate deterministic mock data based on the locationId
      const seed = parseInt(createHash('md5').update(locationId.toString()).digest('hex').substring(0, 8), 16);
      const monthsToShow = timeframe === '3m' ? 3 : 6;
      
      const trends: HistoricalTrend[] = [];
      const currentDate = new Date();
      
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const trendDate = new Date();
        trendDate.setMonth(currentDate.getMonth() - i);
        
        const monthName = trendDate.toLocaleString('default', { month: 'short' });
        const baseSeed = (seed + i) % 1000;
        
        // Generate deterministic random values based on the month and locationId
        const calls = 50 + Math.floor((baseSeed * 150) / 1000);
        const clicks = 100 + Math.floor((baseSeed * 250) / 1000);
        const directions = 30 + Math.floor((baseSeed * 120) / 1000);
        const views = 500 + Math.floor((baseSeed * 1000) / 1000);
        
        trends.push({
          month: monthName,
          calls,
          website_clicks: clicks,
          direction_requests: directions,
          views
        });
      }
      
      return trends;
    } catch (error) {
      console.error('Error fetching historical trends from GBP API:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on performance metrics
   * @param metrics - The current performance metrics
   * @param trends - Historical trend data
   * @returns Array of recommendation strings
   */
  private async generateRecommendations(metrics: PerformanceMetrics, trends: HistoricalTrend[]): Promise<string[]> {
    try {
      // First, try to use the NLP service to generate recommendations
      const prompt = this.createRecommendationPrompt(metrics, trends);
      const nlpRecommendations = await this.nlpService.generateText(prompt);
      
      if (nlpRecommendations) {
        // Parse the recommendations from the NLP service response
        return nlpRecommendations
          .split('\n')
          .filter(rec => rec.trim().length > 0)
          .map(rec => rec.replace(/^-\s*/, '').trim()) // Remove leading dashes
          .slice(0, 5); // Limit to 5 recommendations
      }
      
      // Fallback to predefined recommendations if NLP service fails
      return this.getPredefinedRecommendations(metrics);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Return predefined recommendations if there's an error
      return this.getPredefinedRecommendations(metrics);
    }
  }

  /**
   * Get predefined recommendations based on metrics
   * @param metrics Performance metrics
   * @returns Array of recommendation strings
   */
  private getPredefinedRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on metric performance
    if (metrics.calls.change_percent < 0) {
      recommendations.push("Update your phone number's prominence on your profile to increase calls.");
    }
    
    if (metrics.website_clicks.change_percent < 0) {
      recommendations.push("Add a clear call-to-action button on your profile to drive more website traffic.");
    }
    
    if (metrics.direction_requests.change_percent < 0) {
      recommendations.push("Verify your business address is accurate and add landmarks to help customers find you.");
    }
    
    if (metrics.views.change_percent < 0) {
      recommendations.push("Post weekly updates to increase profile visibility in search results.");
    }
    
    // Add general recommendations if needed to reach at least 3
    const generalRecommendations = [
      "Respond to all reviews within 24 hours to improve engagement and visibility.",
      "Add high-quality photos of your products and services to enhance your profile.",
      "Update your business hours to include special holiday hours.",
      "Create Google Posts that highlight seasonal promotions or special events.",
      "Add frequently asked questions to your profile to improve customer experience."
    ];
    
    // Combine specific recommendations with general ones to ensure we have at least 3
    while (recommendations.length < 3) {
      const index = recommendations.length % generalRecommendations.length;
      recommendations.push(generalRecommendations[index]);
    }
    
    return recommendations.slice(0, 5); // Return at most 5 recommendations
  }

  /**
   * Create a prompt for the NLP service to generate recommendations
   * @param metrics - The current performance metrics
   * @param trends - Historical trend data
   * @returns Prompt string for NLP service
   */
  private createRecommendationPrompt(metrics: PerformanceMetrics, trends: HistoricalTrend[]): string {
    const trendsSummary = this.summarizeTrends(trends);
    
    return `Generate 5 actionable recommendations for a business to improve their Google Business Profile performance based on the following metrics:

Current Performance:
- Phone calls: ${metrics.calls.current} (${metrics.calls.change_percent}% change from previous period)
- Website clicks: ${metrics.website_clicks.current} (${metrics.website_clicks.change_percent}% change)
- Direction requests: ${metrics.direction_requests.current} (${metrics.direction_requests.change_percent}% change)
- Profile views: ${metrics.views.current} (${metrics.views.change_percent}% change)

Historical Trends:
${trendsSummary}

Provide 5 specific, actionable recommendations to improve these metrics. Each recommendation should be concise (1-2 sentences) and focused on a specific action the business can take to improve their Google Business Profile performance. Format each recommendation as a separate line starting with a dash.`;
  }

  /**
   * Summarize historical trends for the NLP prompt
   * @param trends - Historical trend data
   * @returns Summary string
   */
  private summarizeTrends(trends: HistoricalTrend[]): string {
    if (!trends || trends.length === 0) {
      return "No historical data available.";
    }
    
    let summary = "";
    
    trends.forEach(trend => {
      summary += `- ${trend.month}: ${trend.calls} calls, ${trend.website_clicks} clicks, ${trend.direction_requests} directions, ${trend.views} views\n`;
    });
    
    return summary;
  }

  /**
   * Calculate performance score based on metrics and trends
   * @param metrics - The current performance metrics
   * @param trends - Historical trend data
   * @returns Performance score (0-100)
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics, trends: HistoricalTrend[]): number {
    // Base score starts at 70
    let score = 70;
    
    // Adjust score based on the performance changes
    score += this.getScoreAdjustment(metrics.calls.change_percent, 5);
    score += this.getScoreAdjustment(metrics.website_clicks.change_percent, 5);
    score += this.getScoreAdjustment(metrics.direction_requests.change_percent, 5);
    score += this.getScoreAdjustment(metrics.views.change_percent, 10);
    
    // Check for trend improvements
    if (trends && trends.length >= 2) {
      const latestMonth = trends[trends.length - 1];
      const previousMonth = trends[trends.length - 2];
      
      if (latestMonth.views > previousMonth.views) score += 1;
      if (latestMonth.calls > previousMonth.calls) score += 1;
      if (latestMonth.website_clicks > previousMonth.website_clicks) score += 1;
      if (latestMonth.direction_requests > previousMonth.direction_requests) score += 2;
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get score adjustment based on metric change percentage
   * @param changePercent - The percentage change
   * @param maxAdjustment - The maximum score adjustment
   * @returns Score adjustment value
   */
  private getScoreAdjustment(changePercent: number, maxAdjustment: number): number {
    if (changePercent >= 20) return maxAdjustment;
    if (changePercent >= 10) return maxAdjustment * 0.8;
    if (changePercent >= 5) return maxAdjustment * 0.5;
    if (changePercent >= 0) return maxAdjustment * 0.2;
    if (changePercent >= -5) return -maxAdjustment * 0.2;
    if (changePercent >= -10) return -maxAdjustment * 0.5;
    if (changePercent >= -20) return -maxAdjustment * 0.8;
    return -maxAdjustment;
  }

  /**
   * Calculate percentage change between two values
   * @param current - Current value
   * @param previous - Previous value
   * @returns Percentage change
   */
  private calculateChangePercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Get fallback performance data when API calls fail
   * @returns Default performance data
   */
  private getFallbackPerformanceData(): PerformanceData {
    const currentDate = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trends: HistoricalTrend[] = [];
    
    // Generate 3 months of fallback data
    for (let i = 2; i >= 0; i--) {
      const monthIndex = (currentDate.getMonth() - i + 12) % 12;
      trends.push({
        month: months[monthIndex],
        calls: 75 + Math.floor(Math.random() * 50),
        website_clicks: 150 + Math.floor(Math.random() * 100),
        direction_requests: 60 + Math.floor(Math.random() * 40),
        views: 800 + Math.floor(Math.random() * 400)
      });
    }
    
    return {
      score: 65,
      metrics: {
        calls: {
          current: 100,
          previous: 90,
          change_percent: 11
        },
        website_clicks: {
          current: 200,
          previous: 190,
          change_percent: 5
        },
        direction_requests: {
          current: 80,
          previous: 85,
          change_percent: -6
        },
        views: {
          current: 1000,
          previous: 950,
          change_percent: 5
        }
      },
      historical_trends: trends,
      recommendations: [
        "Respond to all customer reviews within 24 hours to improve engagement.",
        "Add high-quality photos of your products and services to your profile.",
        "Create weekly posts about promotions and events to increase visibility.",
        "Update your business description to include relevant keywords.",
        "Add Q&A content to your profile to address common customer questions."
      ]
    };
  }
}

export const performanceService = new PerformanceService();