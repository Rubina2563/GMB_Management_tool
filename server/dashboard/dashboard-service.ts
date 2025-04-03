/**
 * Dashboard Service
 * Handles the local dashboard functionality
 */

import { storage } from '../storage';

export interface LocationMetrics {
  // Ranking metrics
  rank: number;
  rankChange: number;
  
  // Review metrics
  reviewCount: number;
  reviewRating: string;
  
  // Post metrics
  postCount: number;
  lastPostDate: string;
  
  // Citation metrics
  totalCitations: number;
  missingCitations: number;
  
  // Engagement metrics
  weeklyViews: number;
  weeklyActions: number;
  weeklyDirections: number;
  weeklyCalls: number;
  
  // Health score
  healthScore: number;
}

export interface ActionCard {
  id: number;
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  locationId: number | null;
  locationName: string;
  action: string;
  actionLink: string;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  locationId: number | null;
  locationName: string;
  actionLabel?: string;
  actionLink?: string;
  status?: string;
  severity?: 'success' | 'warning' | 'info' | 'danger';
  reviewer?: string;
  rating?: number;
}

export interface LocationWithMetrics {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  location_id: string;
  latitude: string | null;
  longitude: string | null;
  status: string;
  metrics: LocationMetrics | null;
}

export interface ClientData {
  id: number;
  name: string;
  username: string;
  email: string;
  locations: LocationWithMetrics[];
}

export interface DashboardData {
  locations: LocationWithMetrics[];
  selectedGbpId: number | null;
  actionCards: ActionCard[];
  recentActivity: RecentActivity[];
  numberOfClients?: number;
  clients?: ClientData[];
  isNewUser: boolean;
}

export class DashboardService {
  /**
   * Get dashboard data for a user
   */
  async getDashboardData(userId: number, selectedGbpId?: number, timeframe: string = '7days'): Promise<DashboardData> {
    // Fetch all GBP locations for this user
    const userLocations = await storage.getGbpLocations(userId);
    
    // Map locations to include metrics
    const locations: LocationWithMetrics[] = await Promise.all(
      userLocations.map(async (location) => {
        // For each location, fetch/generate metrics
        const metrics = await this.getLocationMetrics(location.id, timeframe);
        
        return {
          ...location,
          metrics
        };
      })
    );

    // Generate action cards based on metrics and user settings
    const actionCards = await this.generateActionCards(locations, selectedGbpId);
    
    // Generate recent activity data
    const recentActivity = await this.generateRecentActivity(userId, selectedGbpId);
    
    // Fetch clients data for admin users
    let numberOfClients = 0;
    let clients: ClientData[] = [];
    
    // Check if user is admin
    const user = await storage.getUser(userId);
    if (user && user.role === 'admin') {
      // Get all users with role client
      const allUsers = await storage.getAllUsers();
      const clientUsers = allUsers.filter(user => user.role === 'client');
      
      // Count clients
      numberOfClients = clientUsers.length;
      
      // Map clients with their locations
      clients = await Promise.all(
        clientUsers.map(async (client) => {
          const clientLocations = await storage.getGbpLocations(client.id);
          
          // Map client locations to include metrics
          const locationsWithMetrics: LocationWithMetrics[] = await Promise.all(
            clientLocations.map(async (location) => {
              const metrics = await this.getLocationMetrics(location.id, timeframe);
              return {
                ...location,
                metrics
              };
            })
          );
          
          return {
            id: client.id,
            name: client.username, // Use username as name since we don't have a separate name field
            username: client.username,
            email: client.email,
            locations: locationsWithMetrics
          };
        })
      );
    }
    
    // Check if user is a new user (incomplete onboarding)
    // A user is considered new if they don't have:
    // 1. Connected Google account (API keys)
    // 2. Added locations
    // 3. Started a campaign
    const apiKeys = await storage.getApiKeys(userId);
    const hasGoogleAccount = apiKeys && (
      apiKeys.google_api_key || 
      apiKeys.google_client_id || 
      apiKeys.gbp_client_id
    );
    
    const hasLocations = locations.length > 0;
    
    // Check if user has any campaigns (this would be fetched from campaigns table in a real app)
    // For now, we'll simplify and assume no campaigns for this demo
    const hasCampaigns = false;
    
    // User is new if they're missing any of these steps
    const isNewUser = !hasGoogleAccount || !hasLocations || !hasCampaigns;
    
    return {
      locations,
      selectedGbpId: selectedGbpId || null,
      actionCards,
      recentActivity,
      numberOfClients,
      clients,
      isNewUser
    };
  }
  
  /**
   * Get metrics for a specific location
   */
  private async getLocationMetrics(locationId: number, timeframe: string): Promise<LocationMetrics> {
    // In a real implementation, this would fetch data from various services
    // For this example, we're generating mock data
    
    // Calculate a consistent but seemingly random health score between 40-95
    const healthScore = ((locationId * 13) % 55) + 40;
    
    // Create relative metrics based on the health score to make it look realistic
    const reviewCount = Math.floor((healthScore / 100) * 50) + 5;
    const reviewRating = ((3 + (healthScore / 100) * 2)).toFixed(1);
    
    // Post metrics
    const postCount = Math.floor((healthScore / 100) * 30) + 2;
    
    // Set last post date to be more recent for healthier profiles
    const lastPostDate = new Date();
    if (healthScore < 60) {
      // Less healthy profiles have older posts
      lastPostDate.setDate(lastPostDate.getDate() - 30 - (90 - healthScore));
    } else {
      // Healthier profiles have more recent posts
      lastPostDate.setDate(lastPostDate.getDate() - 5 - (90 - healthScore) / 10);
    }
    
    // Citation metrics
    const totalCitations = 40;
    const missingCitations = Math.floor((100 - healthScore) / 20);
    
    // Engagement metrics - higher for healthier profiles
    const factor = healthScore / 100;
    const weeklyViews = Math.floor(factor * 500) + 100;
    const weeklyActions = Math.floor(factor * 120) + 20;
    const weeklyDirections = Math.floor(factor * 40) + 5;
    const weeklyCalls = Math.floor(factor * 30) + 3;
    
    // Rank metrics
    const rank = Math.floor((100 - healthScore) / 5) + 1;
    const rankChange = healthScore > 70 ? 2 : healthScore > 50 ? 0 : -1;
    
    return {
      rank,
      rankChange,
      reviewCount,
      reviewRating,
      postCount,
      lastPostDate: lastPostDate.toISOString(),
      totalCitations,
      missingCitations,
      weeklyViews,
      weeklyActions,
      weeklyDirections,
      weeklyCalls,
      healthScore
    };
  }
  
  /**
   * Generate action cards based on metrics
   */
  private async generateActionCards(
    locations: LocationWithMetrics[], 
    selectedGbpId?: number
  ): Promise<ActionCard[]> {
    const actionCards: ActionCard[] = [];
    
    // Process each location
    locations.forEach(location => {
      // Skip if this isn't the selected location (if one is selected)
      if (selectedGbpId && location.id !== selectedGbpId) {
        return;
      }
      
      const metrics = location.metrics;
      if (!metrics) return;
      
      // Add action for low health score
      if (metrics.healthScore < 70) {
        actionCards.push({
          id: actionCards.length + 1,
          type: 'alert',
          description: `${location.name} has a low health score of ${metrics.healthScore}%. Run an audit to identify issues.`,
          priority: metrics.healthScore < 50 ? 'high' : 'medium',
          impact: 'high',
          locationId: location.id,
          locationName: location.name,
          action: 'Run GBP Audit',
          actionLink: `/client/gbp-audit?location=${location.id}`
        });
      }
      
      // Add action for missing citations
      if (metrics.missingCitations > 0) {
        actionCards.push({
          id: actionCards.length + 1,
          type: 'citation',
          description: `${location.name} is missing ${metrics.missingCitations} important citations that could boost visibility.`,
          priority: metrics.missingCitations > 5 ? 'high' : 'medium',
          impact: 'medium',
          locationId: location.id,
          locationName: location.name,
          action: 'Fix Citations',
          actionLink: `/client/citations?location=${location.id}`
        });
      }
      
      // Add action for old posts
      const lastPostDate = new Date(metrics.lastPostDate);
      const daysSinceLastPost = Math.floor((Date.now() - lastPostDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastPost > 14) {
        actionCards.push({
          id: actionCards.length + 1,
          type: 'post',
          description: `${location.name} hasn't posted in ${daysSinceLastPost} days. Regular posting improves engagement.`,
          priority: daysSinceLastPost > 30 ? 'high' : 'medium',
          impact: 'medium',
          locationId: location.id,
          locationName: location.name,
          action: 'Create Post',
          actionLink: `/client/posts/new?location=${location.id}`
        });
      }
      
      // Add action for campaign if rank isn't great
      if (metrics.rank > 5) {
        actionCards.push({
          id: actionCards.length + 1,
          type: 'campaign',
          description: `${location.name} is currently ranked #${metrics.rank}. Creating a campaign could improve visibility.`,
          priority: metrics.rank > 10 ? 'high' : 'medium',
          impact: 'high',
          locationId: location.id,
          locationName: location.name,
          action: 'Create Campaign',
          actionLink: `/client/campaigns/new?location=${location.id}`
        });
      }
    });
    
    // Sort by priority: high > medium > low
    return actionCards.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  /**
   * Generate recent activity data
   */
  private async generateRecentActivity(
    userId: number, 
    selectedGbpId?: number
  ): Promise<RecentActivity[]> {
    // In a real implementation, this would fetch from a database
    // For this demo, we'll generate mock data
    
    const userLocations = await storage.getGbpLocations(userId);
    const recentActivity: RecentActivity[] = [];
    
    // Generate mock activity for each location
    userLocations.forEach(location => {
      // Skip if this isn't the selected location (if one is selected)
      if (selectedGbpId && location.id !== selectedGbpId) {
        return;
      }
      
      // Generate a random date in the last 30 days
      const getRandomDate = (maxDaysAgo: number) => {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * maxDaysAgo));
        return date.toISOString();
      };
      
      // Review activity with diverse ratings
      const reviewers = ['John Smith', 'Emma Wilson', 'Michael Brown', 'Sarah Davis', 'James Miller'];
      const ratings = [5, 4, 3, 2, 1];
      
      // Add a few review activities with different ratings
      for (let i = 0; i < 3; i++) {
        const rating = ratings[i % ratings.length];
        const reviewer = reviewers[i % reviewers.length];
        const severity = rating >= 4 ? 'success' : (rating === 3 ? 'info' : 'danger');
        
        recentActivity.push({
          id: recentActivity.length + 1,
          type: 'review',
          description: `New ${rating}-star review received${rating < 4 ? ' that needs attention' : ''}`,
          timestamp: getRandomDate(7),
          locationId: location.id,
          locationName: location.name,
          actionLabel: 'View Review',
          actionLink: `/client/reviews/${location.id}`,
          status: 'new',
          severity,
          reviewer,
          rating
        });
      }
      
      // Post activities with different statuses
      const postStatuses = ['published', 'scheduled', 'draft'];
      const postTypes = ['promotion', 'event', 'update', 'offer'];
      
      for (let i = 0; i < 2; i++) {
        const status = postStatuses[i % postStatuses.length];
        const postType = postTypes[i % postTypes.length];
        const severity = status === 'published' ? 'success' : (status === 'scheduled' ? 'info' : 'warning');
        
        recentActivity.push({
          id: recentActivity.length + 1,
          type: 'post',
          description: `${status === 'published' ? 'Published' : (status === 'scheduled' ? 'Scheduled' : 'Created')} ${postType} post`,
          timestamp: getRandomDate(14),
          locationId: location.id,
          locationName: location.name,
          actionLabel: status === 'draft' ? 'Edit Post' : 'View Post',
          actionLink: `/client/posts/${i + 1}?location=${location.id}`,
          status,
          severity
        });
      }
      
      // Ranking activities
      const keywords = ['local plumber', 'emergency plumbing', 'bathroom remodel', 'kitchen installation'];
      const rankChanges = [3, 2, -1, -2];
      
      for (let i = 0; i < 2; i++) {
        const keyword = keywords[i % keywords.length];
        const rankChange = rankChanges[i % rankChanges.length];
        const severity = rankChange > 0 ? 'success' : (rankChange === 0 ? 'info' : 'warning');
        
        recentActivity.push({
          id: recentActivity.length + 1,
          type: 'ranking',
          description: `Rank ${rankChange > 0 ? 'improved' : 'decreased'} for "${keyword}" keyword (${rankChange > 0 ? '+' : ''}${rankChange})`,
          timestamp: getRandomDate(21),
          locationId: location.id,
          locationName: location.name,
          actionLabel: 'View Rankings',
          actionLink: `/client/rankings?location=${location.id}&keyword=${encodeURIComponent(keyword)}`,
          status: rankChange > 0 ? 'improved' : 'declined',
          severity
        });
      }
      
      // Citation activities
      const citationActions = ['added', 'updated', 'fixed'];
      const citationCounts = [3, 5, 2];
      const citationServices = ['Yellow Pages', 'Yelp', 'Google Business', 'Bing Places'];
      
      recentActivity.push({
        id: recentActivity.length + 1,
        type: 'citation',
        description: `${citationActions[0]} ${citationCounts[0]} new citations to improve local visibility`,
        timestamp: getRandomDate(28),
        locationId: location.id,
        locationName: location.name,
        actionLabel: 'View Citations',
        actionLink: `/client/local-links/citation-report?location=${location.id}`,
        status: 'completed',
        severity: 'success'
      });
      
      // Audit activity
      recentActivity.push({
        id: recentActivity.length + 1,
        type: 'audit',
        description: 'GBP Audit completed with 3 critical issues found',
        timestamp: getRandomDate(10),
        locationId: location.id,
        locationName: location.name,
        actionLabel: 'View Audit',
        actionLink: `/client/gbp-audit?location=${location.id}`,
        status: 'completed',
        severity: 'warning'
      });
      
      // Campaign activity
      recentActivity.push({
        id: recentActivity.length + 1,
        type: 'campaign',
        description: 'Local visibility campaign started for "plumbing services"',
        timestamp: getRandomDate(15),
        locationId: location.id,
        locationName: location.name,
        actionLabel: 'View Campaign',
        actionLink: `/client/campaigns?location=${location.id}`,
        status: 'active',
        severity: 'info'
      });
    });
    
    // Sort by timestamp (most recent first)
    return recentActivity.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }
}

export const dashboardService = new DashboardService();