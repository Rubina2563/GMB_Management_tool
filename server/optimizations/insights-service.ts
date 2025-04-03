/**
 * GBP Insights Service
 * Handles operations for generating strategic optimization insights
 */

import { storage } from "../storage";
import { creditService } from "../reviews/credit-service";

// Define types for insights data
export interface OptimizationInsight {
  id: number;
  gbp_id: number;
  user_id: number;
  timestamp: string;
  data: {
    keyword_optimization: {
      score: number;
      suggestions: Array<{
        keyword: string;
        volume: number;
        difficulty: number;
        opportunity: 'high' | 'medium' | 'low';
      }>;
      recommendations: string[];
    };
    review_response_optimization: {
      score: number;
      priority_reviews: Array<{
        id: string;
        rating: number;
        sentiment: number;
        priority: 'high' | 'medium' | 'low';
        reviewer_name: string;
        comment: string;
      }>;
      recommendations: string[];
    };
    posting_schedule_optimization: {
      score: number;
      best_times: Array<{
        day: string;
        time: string;
        engagement_score: number;
      }>;
      worst_times: Array<{
        day: string;
        time: string;
        engagement_score: number;
      }>;
      recommendations: string[];
    };
    citation_prioritization: {
      score: number;
      priority_directories: Array<{
        name: string;
        url: string;
        da: number;
        priority: 'high' | 'medium' | 'low';
      }>;
      recommendations: string[];
    };
    performance_forecast: {
      score: number;
      metrics: {
        calls: {
          current: number;
          forecast: number;
          change_percent: number;
        };
        website_clicks: {
          current: number;
          forecast: number;
          change_percent: number;
        };
        direction_requests: {
          current: number;
          forecast: number;
          change_percent: number;
        };
      };
      trend: Array<{
        month: string;
        calls: number;
        website_clicks: number;
        direction_requests: number;
      }>;
      recommendations: string[];
    };
    competitor_benchmarking: {
      score: number;
      gaps: Array<{
        metric: string;
        your_value: number;
        competitor_avg: number;
        gap_percent: number;
        priority: 'high' | 'medium' | 'low';
      }>;
      top_competitors: Array<{
        name: string;
        strengths: string[];
        weaknesses: string[];
      }>;
      recommendations: string[];
    };
    overall_score: number;
    
    // New fields for enhanced Overview tab
    profile_metrics: {
      review_count: number;
      review_growth: number;
      average_rating: number;
      rating_growth: number;
      directions_requests: number;
      directions_growth: number;
      avg_response_time: number;
      response_time_improvement: number;
    };
    recent_activity: Array<{
      type: 'review' | 'post' | 'photo' | 'query';
      title: string;
      description: string;
      timestamp: string;
      action?: string;
    }>;
  };
  credits_used: number;
}

export class InsightsService {
  /**
   * Generate optimization insights for a GBP location
   */
  async generateInsights(userId: number, gbpId: number): Promise<OptimizationInsight | null> {
    // Check if user has enough credits
    const hasEnoughCredits = await creditService.hasEnoughCredits(userId, 1);
    if (!hasEnoughCredits) {
      return null;
    }

    // Deduct 1 credit
    await creditService.deductCredits(userId, 1);

    // In a production environment, we would:
    // 1. Fetch data from various sources (GBP Audit, Reviews, Posts, Citations, Campaigns)
    // 2. Call DataForSEO Rank Tracker API to get competitor keyword data
    // 3. Analyze review sentiment and response patterns
    // 4. Analyze post engagement metrics to determine optimal posting times
    // 5. Prioritize citation directories based on domain authority
    // 6. Apply linear regression to forecast performance metrics
    // 7. Compare with competitor benchmarks
    // 8. Generate scores and recommendations
    // 9. Store the insights in the database
    
    // For demonstration purposes, we just return mock insights data
    const mockInsights: OptimizationInsight = {
      id: 1,
      gbp_id: gbpId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      data: {
        keyword_optimization: {
          score: 72,
          suggestions: [
            {
              keyword: "emergency plumbing repair",
              volume: 3400,
              difficulty: 6,
              opportunity: 'high'
            },
            {
              keyword: "water heater replacement cost",
              volume: 2100,
              difficulty: 4,
              opportunity: 'medium'
            },
            {
              keyword: "tankless water heater installation",
              volume: 1800,
              difficulty: 5,
              opportunity: 'high'
            },
            {
              keyword: "bathroom plumbing repair near me",
              volume: 1200,
              difficulty: 7,
              opportunity: 'medium'
            },
            {
              keyword: "sump pump installation",
              volume: 980,
              difficulty: 3,
              opportunity: 'high'
            }
          ],
          recommendations: [
            "Add 'emergency plumbing repair' to your business description",
            "Create posts about tankless water heater installation with before/after images",
            "Add sump pump installation to your service list for seasonal targeting"
          ]
        },
        review_response_optimization: {
          score: 65,
          priority_reviews: [
            {
              id: "rev_001",
              rating: 2,
              sentiment: -0.6,
              priority: 'high',
              reviewer_name: "John D.",
              comment: "Called for an emergency pipe leak, took over 3 hours to arrive. Job was done well but price was higher than quoted."
            },
            {
              id: "rev_002",
              rating: 3,
              sentiment: -0.2,
              priority: 'medium',
              reviewer_name: "Sarah M.",
              comment: "Water heater installation was okay, but they left a mess in my utility room."
            },
            {
              id: "rev_003",
              rating: 1,
              sentiment: -0.8,
              priority: 'high',
              reviewer_name: "Robert P.",
              comment: "Terrible experience. They were late, unprofessional, and charged extra fees that weren't disclosed up front."
            }
          ],
          recommendations: [
            "Respond to the negative review from Robert P. within 24 hours",
            "Address emergency response time concerns in your business description",
            "Create a follow-up protocol for reviews mentioning pricing discrepancies"
          ]
        },
        posting_schedule_optimization: {
          score: 81,
          best_times: [
            {
              day: "Monday",
              time: "7:00 AM",
              engagement_score: 8.7
            },
            {
              day: "Wednesday",
              time: "6:30 PM",
              engagement_score: 9.2
            },
            {
              day: "Friday",
              time: "4:00 PM",
              engagement_score: 8.3
            }
          ],
          worst_times: [
            {
              day: "Saturday",
              time: "10:00 PM",
              engagement_score: 2.1
            },
            {
              day: "Sunday",
              time: "7:00 AM",
              engagement_score: 1.8
            }
          ],
          recommendations: [
            "Schedule your emergency service posts for Monday mornings to reach early-week browsers",
            "Post special offers on Wednesday evenings when engagement is highest",
            "Avoid posting on weekend mornings when engagement is lowest"
          ]
        },
        citation_prioritization: {
          score: 58,
          priority_directories: [
            {
              name: "Angi (formerly Angie's List)",
              url: "https://www.angi.com",
              da: 84,
              priority: 'high'
            },
            {
              name: "Houzz - Professional Directory",
              url: "https://www.houzz.com",
              da: 76,
              priority: 'high'
            },
            {
              name: "HomeAdvisor",
              url: "https://www.homeadvisor.com",
              da: 82,
              priority: 'high'
            },
            {
              name: "Thumbtack",
              url: "https://www.thumbtack.com",
              da: 73,
              priority: 'medium'
            },
            {
              name: "Porch",
              url: "https://www.porch.com",
              da: 68,
              priority: 'medium'
            }
          ],
          recommendations: [
            "Prioritize listing creation on Angi and HomeAdvisor (high DA and specific to home services)",
            "Add high-quality photos to your Houzz profile to attract renovation projects",
            "Ensure consistent NAP details across all directories"
          ]
        },
        performance_forecast: {
          score: 76,
          metrics: {
            calls: {
              current: 87,
              forecast: 112,
              change_percent: 28.7
            },
            website_clicks: {
              current: 142,
              forecast: 178,
              change_percent: 25.4
            },
            direction_requests: {
              current: 34,
              forecast: 42,
              change_percent: 23.5
            }
          },
          trend: [
            {
              month: "April 2025",
              calls: 95,
              website_clicks: 154,
              direction_requests: 37
            },
            {
              month: "May 2025",
              calls: 103,
              website_clicks: 167,
              direction_requests: 39
            },
            {
              month: "June 2025",
              calls: 112,
              website_clicks: 178,
              direction_requests: 42
            }
          ],
          recommendations: [
            "Prepare for 28.7% increase in call volume with adequate staffing",
            "Update your website to convert higher click traffic, focus on landing pages",
            "Ensure your physical location is optimized for the incoming direction requests"
          ]
        },
        competitor_benchmarking: {
          score: 68,
          gaps: [
            {
              metric: "Photo count",
              your_value: 6,
              competitor_avg: 18,
              gap_percent: -66.7,
              priority: 'high'
            },
            {
              metric: "Review response rate",
              your_value: 62,
              competitor_avg: 89,
              gap_percent: -30.3,
              priority: 'high'
            },
            {
              metric: "Posts per month",
              your_value: 2,
              competitor_avg: 5,
              gap_percent: -60.0,
              priority: 'medium'
            },
            {
              metric: "Services listed",
              your_value: 8,
              competitor_avg: 12,
              gap_percent: -33.3,
              priority: 'medium'
            },
            {
              metric: "Q&A responses",
              your_value: 3,
              competitor_avg: 7,
              gap_percent: -57.1,
              priority: 'low'
            }
          ],
          top_competitors: [
            {
              name: "Fast Plumbing Pros",
              strengths: ["High review count", "Regular posting", "24/7 service highlighted"],
              weaknesses: ["Few service categories", "Old photos", "Slow response time"]
            },
            {
              name: "Premium Plumbing & Heating",
              strengths: ["Extensive photo gallery", "100% review response", "Detailed service list"],
              weaknesses: ["Limited business hours", "Few posts", "No Q&A activity"]
            },
            {
              name: "Quality Plumbers Inc",
              strengths: ["Video content", "Regular offers/posts", "Active Q&A section"],
              weaknesses: ["Lower review rating", "Limited service area", "Generic business description"]
            }
          ],
          recommendations: [
            "Add at least 12 more high-quality photos to match competitor average",
            "Implement 24-hour review response policy to close the 30.3% gap",
            "Increase posting frequency to at least weekly (5 per month)"
          ]
        },
        overall_score: 70,
        
        // Profile metrics
        profile_metrics: {
          review_count: 42,
          review_growth: 12,
          average_rating: 4.2,
          rating_growth: 0.3,
          directions_requests: 67,
          directions_growth: 15,
          avg_response_time: 6,
          response_time_improvement: -1.5
        },
        
        // Recent activity
        recent_activity: [
          {
            type: 'review',
            title: 'New 1-star review requires attention',
            description: 'Robert P. left a negative review about pricing discrepancies and response time.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            action: 'Respond to review'
          },
          {
            type: 'post',
            title: 'Post engagement trending up',
            description: 'Your recent post about water heater installations received 37% more clicks than average.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            action: 'Create similar post'
          },
          {
            type: 'photo',
            title: 'New photos added',
            description: 'Recently added photos have 3 new views. Consider adding more service photos.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
            action: 'Add more photos'
          },
          {
            type: 'query',
            title: 'New search trend detected',
            description: 'Searches for "tankless water heater installation" have increased 28% in your area.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
            action: 'Target this keyword'
          }
        ]
      },
      credits_used: 1
    };

    return mockInsights;
  }

  /**
   * Get the latest insights for a GBP location
   */
  async getLatestInsights(userId: number, gbpId: number): Promise<OptimizationInsight | null> {
    // In a production environment, we would fetch the latest insights from the database
    
    // For demonstration purposes, we just return mock insights data
    const mockInsights: OptimizationInsight = {
      id: 1,
      gbp_id: gbpId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      data: {
        keyword_optimization: {
          score: 72,
          suggestions: [
            {
              keyword: "emergency plumbing repair",
              volume: 3400,
              difficulty: 6,
              opportunity: 'high'
            },
            {
              keyword: "water heater replacement cost",
              volume: 2100,
              difficulty: 4,
              opportunity: 'medium'
            },
            {
              keyword: "tankless water heater installation",
              volume: 1800,
              difficulty: 5,
              opportunity: 'high'
            },
            {
              keyword: "bathroom plumbing repair near me",
              volume: 1200,
              difficulty: 7,
              opportunity: 'medium'
            },
            {
              keyword: "sump pump installation",
              volume: 980,
              difficulty: 3,
              opportunity: 'high'
            }
          ],
          recommendations: [
            "Add 'emergency plumbing repair' to your business description",
            "Create posts about tankless water heater installation with before/after images",
            "Add sump pump installation to your service list for seasonal targeting"
          ]
        },
        review_response_optimization: {
          score: 65,
          priority_reviews: [
            {
              id: "rev_001",
              rating: 2,
              sentiment: -0.6,
              priority: 'high',
              reviewer_name: "John D.",
              comment: "Called for an emergency pipe leak, took over 3 hours to arrive. Job was done well but price was higher than quoted."
            },
            {
              id: "rev_002",
              rating: 3,
              sentiment: -0.2,
              priority: 'medium',
              reviewer_name: "Sarah M.",
              comment: "Water heater installation was okay, but they left a mess in my utility room."
            },
            {
              id: "rev_003",
              rating: 1,
              sentiment: -0.8,
              priority: 'high',
              reviewer_name: "Robert P.",
              comment: "Terrible experience. They were late, unprofessional, and charged extra fees that weren't disclosed up front."
            }
          ],
          recommendations: [
            "Respond to the negative review from Robert P. within 24 hours",
            "Address emergency response time concerns in your business description",
            "Create a follow-up protocol for reviews mentioning pricing discrepancies"
          ]
        },
        posting_schedule_optimization: {
          score: 81,
          best_times: [
            {
              day: "Monday",
              time: "7:00 AM",
              engagement_score: 8.7
            },
            {
              day: "Wednesday",
              time: "6:30 PM",
              engagement_score: 9.2
            },
            {
              day: "Friday",
              time: "4:00 PM",
              engagement_score: 8.3
            }
          ],
          worst_times: [
            {
              day: "Saturday",
              time: "10:00 PM",
              engagement_score: 2.1
            },
            {
              day: "Sunday",
              time: "7:00 AM",
              engagement_score: 1.8
            }
          ],
          recommendations: [
            "Schedule your emergency service posts for Monday mornings to reach early-week browsers",
            "Post special offers on Wednesday evenings when engagement is highest",
            "Avoid posting on weekend mornings when engagement is lowest"
          ]
        },
        citation_prioritization: {
          score: 58,
          priority_directories: [
            {
              name: "Angi (formerly Angie's List)",
              url: "https://www.angi.com",
              da: 84,
              priority: 'high'
            },
            {
              name: "Houzz - Professional Directory",
              url: "https://www.houzz.com",
              da: 76,
              priority: 'high'
            },
            {
              name: "HomeAdvisor",
              url: "https://www.homeadvisor.com",
              da: 82,
              priority: 'high'
            },
            {
              name: "Thumbtack",
              url: "https://www.thumbtack.com",
              da: 73,
              priority: 'medium'
            },
            {
              name: "Porch",
              url: "https://www.porch.com",
              da: 68,
              priority: 'medium'
            }
          ],
          recommendations: [
            "Prioritize listing creation on Angi and HomeAdvisor (high DA and specific to home services)",
            "Add high-quality photos to your Houzz profile to attract renovation projects",
            "Ensure consistent NAP details across all directories"
          ]
        },
        performance_forecast: {
          score: 76,
          metrics: {
            calls: {
              current: 87,
              forecast: 112,
              change_percent: 28.7
            },
            website_clicks: {
              current: 142,
              forecast: 178,
              change_percent: 25.4
            },
            direction_requests: {
              current: 34,
              forecast: 42,
              change_percent: 23.5
            }
          },
          trend: [
            {
              month: "April 2025",
              calls: 95,
              website_clicks: 154,
              direction_requests: 37
            },
            {
              month: "May 2025",
              calls: 103,
              website_clicks: 167,
              direction_requests: 39
            },
            {
              month: "June 2025",
              calls: 112,
              website_clicks: 178,
              direction_requests: 42
            }
          ],
          recommendations: [
            "Prepare for 28.7% increase in call volume with adequate staffing",
            "Update your website to convert higher click traffic, focus on landing pages",
            "Ensure your physical location is optimized for the incoming direction requests"
          ]
        },
        competitor_benchmarking: {
          score: 68,
          gaps: [
            {
              metric: "Photo count",
              your_value: 6,
              competitor_avg: 18,
              gap_percent: -66.7,
              priority: 'high'
            },
            {
              metric: "Review response rate",
              your_value: 62,
              competitor_avg: 89,
              gap_percent: -30.3,
              priority: 'high'
            },
            {
              metric: "Posts per month",
              your_value: 2,
              competitor_avg: 5,
              gap_percent: -60.0,
              priority: 'medium'
            },
            {
              metric: "Services listed",
              your_value: 8,
              competitor_avg: 12,
              gap_percent: -33.3,
              priority: 'medium'
            },
            {
              metric: "Q&A responses",
              your_value: 3,
              competitor_avg: 7,
              gap_percent: -57.1,
              priority: 'low'
            }
          ],
          top_competitors: [
            {
              name: "Fast Plumbing Pros",
              strengths: ["High review count", "Regular posting", "24/7 service highlighted"],
              weaknesses: ["Few service categories", "Old photos", "Slow response time"]
            },
            {
              name: "Premium Plumbing & Heating",
              strengths: ["Extensive photo gallery", "100% review response", "Detailed service list"],
              weaknesses: ["Limited business hours", "Few posts", "No Q&A activity"]
            },
            {
              name: "Quality Plumbers Inc",
              strengths: ["Video content", "Regular offers/posts", "Active Q&A section"],
              weaknesses: ["Lower review rating", "Limited service area", "Generic business description"]
            }
          ],
          recommendations: [
            "Add at least 12 more high-quality photos to match competitor average",
            "Implement 24-hour review response policy to close the 30.3% gap",
            "Increase posting frequency to at least weekly (5 per month)"
          ]
        },
        overall_score: 70,
        
        // Profile metrics
        profile_metrics: {
          review_count: 42,
          review_growth: 12,
          average_rating: 4.2,
          rating_growth: 0.3,
          directions_requests: 67,
          directions_growth: 15,
          avg_response_time: 6,
          response_time_improvement: -1.5
        },
        
        // Recent activity
        recent_activity: [
          {
            type: 'review',
            title: 'New 1-star review requires attention',
            description: 'Robert P. left a negative review about pricing discrepancies and response time.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            action: 'Respond to review'
          },
          {
            type: 'post',
            title: 'Post engagement trending up',
            description: 'Your recent post about water heater installations received 37% more clicks than average.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            action: 'Create similar post'
          },
          {
            type: 'photo',
            title: 'New photos added',
            description: 'Recently added photos have 3 new views. Consider adding more service photos.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
            action: 'Add more photos'
          },
          {
            type: 'query',
            title: 'New search trend detected',
            description: 'Searches for "tankless water heater installation" have increased 28% in your area.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
            action: 'Target this keyword'
          }
        ]
      },
      credits_used: 1
    };

    return mockInsights;
  }

  /**
   * Get user's optimization credit balance
   */
  async getUserCredits(userId: number): Promise<number> {
    // In a production environment, this would query the credits table for the user's remaining credit balance
    
    // For demonstration purposes, just return a fixed number
    return 9;
  }
}

export const insightsService = new InsightsService();