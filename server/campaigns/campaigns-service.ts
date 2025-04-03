/**
 * Campaigns Service
 * Handles operations for campaign management and ranking data
 */

import { 
  Campaign, 
  CampaignKeyword, 
  CampaignLocation, 
  CampaignRanking,
  CampaignAudit,
  CampaignStatus,
  UpdateFrequency,
  GeoGridShape
} from '../../shared/schema';

// Interface for grid cell data
interface GridCell {
  id: number;
  lat: number;
  lng: number;
  rank: number;
  searchVolume: number;
  rankChange: number;
  competitors: string[];
}

// Interface for trends data
interface RankingTrendsData {
  keywords: string[];
  dates: string[];
  ranks: number[][];
}

// Interface for competitor data
interface CompetitorData {
  name: string;
  overallRank: number;
  keywordOverlap: number;
  rankingKeywords: number;
}

export class CampaignsService {
  /**
   * Get all campaigns for a user
   */
  async getCampaigns(userId: number): Promise<Campaign[]> {
    try {
      // In a real implementation, this would fetch from a database
      return this.getMockCampaigns(userId);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw new Error('Failed to fetch campaigns');
    }
  }
  
  /**
   * Get all campaigns for a user (alias for getCampaigns)
   */
  async getCampaignsByUserId(userId: number): Promise<Campaign[]> {
    return this.getCampaigns(userId);
  }

  /**
   * Get a specific campaign by ID
   */
  async getCampaign(campaignId: number): Promise<Campaign | null> {
    try {
      // In a real implementation, this would fetch from a database
      const campaigns = this.getMockCampaigns(1); // Using default user ID
      return campaigns.find(c => c.id === campaignId) || null;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw new Error('Failed to fetch campaign');
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign> {
    try {
      // In a real implementation, this would save to a database
      // For now, we'll return a mock with an ID
      const userId = campaignData.user_id || 1; // Default to user ID 1 if not provided
      
      const newCampaign: Campaign = {
        id: Math.floor(Math.random() * 1000),
        user_id: userId,
        name: campaignData.name || 'New Campaign',
        status: campaignData.status || 'active',
        geo_grid_size: campaignData.geo_grid_size || 7,
        distance: campaignData.distance || 1,
        shape: campaignData.shape || 'square',
        update_frequency: campaignData.update_frequency || 'weekly',
        email_notifications: campaignData.email_notifications !== undefined ? campaignData.email_notifications : true,
        notification_recipients: campaignData.notification_recipients || null,
        credit_cost: campaignData.credit_cost || 10,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw new Error('Failed to create campaign');
    }
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(campaignId: number, campaignData: Partial<Campaign>): Promise<Campaign> {
    try {
      // In a real implementation, this would update in a database
      const campaign = await this.getCampaign(campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }
      
      // For mock purposes, we'll just return the updated campaign
      return {
        ...campaign,
        ...campaignData,
        updated_at: new Date()
      };
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw new Error('Failed to update campaign');
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: number): Promise<boolean> {
    try {
      // In a real implementation, this would delete from a database
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw new Error('Failed to delete campaign');
    }
  }

  /**
   * Get campaign keywords
   */
  async getCampaignKeywords(campaignId: number): Promise<CampaignKeyword[]> {
    try {
      // In a real implementation, this would fetch from a database
      return this.getMockCampaignKeywords(campaignId);
    } catch (error) {
      console.error('Error fetching campaign keywords:', error);
      throw new Error('Failed to fetch campaign keywords');
    }
  }

  /**
   * Get geo-grid rankings for a specific campaign and keyword
   */
  async getGeoGridRankings(
    campaignId: number,
    keyword: string,
    location: string,
    radius: number
  ): Promise<GridCell[]> {
    try {
      // In a real implementation, this would fetch from an API or database
      return this.getMockGeoGridData(keyword, location, radius);
    } catch (error) {
      console.error('Error fetching geo-grid rankings:', error);
      throw new Error('Failed to fetch geo-grid rankings');
    }
  }

  /**
   * Get ranking trends for a campaign
   */
  async getRankingTrends(campaignId: number, keyword?: string): Promise<RankingTrendsData> {
    try {
      // In a real implementation, this would fetch from an API or database
      return this.getMockTrendsData(keyword || 'all');
    } catch (error) {
      console.error('Error fetching ranking trends:', error);
      throw new Error('Failed to fetch ranking trends');
    }
  }

  /**
   * Get competitor data for a campaign
   */
  async getCompetitorData(campaignId: number): Promise<CompetitorData[]> {
    try {
      // In a real implementation, this would fetch from an API or database
      return this.getMockCompetitorData();
    } catch (error) {
      console.error('Error fetching competitor data:', error);
      throw new Error('Failed to fetch competitor data');
    }
  }

  /**
   * Mock data for campaigns
   */
  private getMockCampaigns(userId: number): Campaign[] {
    return [
      {
        id: 1,
        user_id: userId,
        name: "Local SEO Campaign - Los Angeles",
        status: "active",
        geo_grid_size: 7,
        distance: 1,
        shape: "square",
        update_frequency: "weekly",
        email_notifications: true,
        notification_recipients: "user@example.com",
        credit_cost: 10,
        created_at: new Date('2025-03-01'),
        updated_at: new Date('2025-03-10')
      },
      {
        id: 2,
        user_id: userId,
        name: "Competitor Analysis - West Coast",
        status: "paused",
        geo_grid_size: 5,
        distance: 2,
        shape: "circular",
        update_frequency: "monthly",
        email_notifications: true,
        notification_recipients: "user@example.com",
        credit_cost: 15,
        created_at: new Date('2025-02-15'),
        updated_at: new Date('2025-03-05')
      },
      {
        id: 3,
        user_id: userId,
        name: "Local Service Keywords",
        status: "active",
        geo_grid_size: 9,
        distance: 0.5,
        shape: "square",
        update_frequency: "weekly",
        email_notifications: false,
        notification_recipients: null,
        credit_cost: 8,
        created_at: new Date('2025-03-08'),
        updated_at: new Date('2025-03-12')
      }
    ];
  }

  /**
   * Mock data for campaign keywords
   */
  private getMockCampaignKeywords(campaignId: number): CampaignKeyword[] {
    return [
      {
        id: 1,
        campaign_id: campaignId,
        keyword: "local business",
        is_primary: true,
        tag: "service",
        volume: 1800,
        difficulty: 4,
        created_at: new Date('2025-03-01')
      },
      {
        id: 2,
        campaign_id: campaignId,
        keyword: "near me",
        is_primary: true,
        tag: "location",
        volume: 2400,
        difficulty: 7,
        created_at: new Date('2025-03-01')
      },
      {
        id: 3,
        campaign_id: campaignId,
        keyword: "best service",
        is_primary: false,
        tag: "quality",
        volume: 1200,
        difficulty: 5,
        created_at: new Date('2025-03-02')
      },
      {
        id: 4,
        campaign_id: campaignId,
        keyword: "professional experts",
        is_primary: false,
        tag: "service",
        volume: 980,
        difficulty: 4,
        created_at: new Date('2025-03-02')
      },
      {
        id: 5,
        campaign_id: campaignId,
        keyword: "affordable service",
        is_primary: false,
        tag: "pricing",
        volume: 1500,
        difficulty: 6,
        created_at: new Date('2025-03-03')
      }
    ];
  }

  /**
   * Mock data for geo-grid
   */
  private getMockGeoGridData(keyword: string, location: string, radius: number): GridCell[] {
    // Create mock data based on input parameters
    const gridSize = 5; // 5x5 grid
    const totalCells = gridSize * gridSize;
    const baseLat = location === 'Los Angeles' ? 34.0522 : 37.7749; // LA or SF as default
    const baseLng = location === 'Los Angeles' ? -118.2437 : -122.4194;
    
    return Array.from({ length: totalCells }, (_, i) => ({
      id: i + 1,
      lat: baseLat + (Math.random() * radius/5 - radius/10),
      lng: baseLng + (Math.random() * radius/5 - radius/10),
      rank: Math.floor(Math.random() * 10) + 1,
      searchVolume: Math.floor(Math.random() * 1000) + 100,
      rankChange: Math.floor(Math.random() * 5) - 2,
      competitors: [
        "Competitor A",
        "Competitor B",
        "Competitor C"
      ].slice(0, Math.floor(Math.random() * 3) + 1)
    }));
  }

  /**
   * Mock trends data
   */
  private getMockTrendsData(keyword: string): RankingTrendsData {
    return {
      keywords: ["local business", "near me", "service", "professional", "expert"],
      dates: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      ranks: [
        [3, 4, 3, 2, 1, 1],  // local business
        [5, 4, 4, 3, 3, 2],  // near me
        [7, 6, 6, 5, 4, 3],  // service
        [9, 8, 7, 6, 5, 4],  // professional
        [12, 10, 9, 8, 7, 6] // expert
      ]
    };
  }

  /**
   * Mock competitor data
   */
  private getMockCompetitorData(): CompetitorData[] {
    return [
      { name: "Competitor A", overallRank: 2, keywordOverlap: 78, rankingKeywords: 94 },
      { name: "Competitor B", overallRank: 3, keywordOverlap: 65, rankingKeywords: 82 },
      { name: "Competitor C", overallRank: 5, keywordOverlap: 55, rankingKeywords: 68 },
      { name: "Competitor D", overallRank: 7, keywordOverlap: 40, rankingKeywords: 51 }
    ];
  }
}

export const campaignsService = new CampaignsService();