/**
 * Local Organic Rankings Routes
 * Handles API routes for organic keyword rankings
 */

import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { format } from 'date-fns';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// Mock data for organic keyword rankings
const getMockOrganicRankings = (campaignId: number, dateRange: string, startDate?: string, endDate?: string) => {
  // Generate historical data based on date range
  const getHistoricalData = () => {
    const history = [];
    const days = dateRange === 'last7days' ? 7 : dateRange === 'last30days' ? 30 : 90;
    const endDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(endDate.getDate() - (days - i));
      
      history.push({
        date: format(date, 'yyyy-MM-dd'),
        rank: Math.floor(Math.random() * 20) + 80 // Random rank between 80-100
      });
    }
    
    return history;
  };
  
  // Generate keywords with mock data
  const generateKeywords = () => {
    const keywordTemplates = [
      { keyword: "24 hour chemist near me open now", tags: ["urgent", "health"], searchVolume: 5400, cpc: 6.03, competition: 0.02 },
      { keyword: "online doctor consultation", tags: ["health", "digital"], searchVolume: 6500, cpc: 5.12, competition: 0.04 },
      { keyword: "telehealth service", tags: ["health", "digital"], searchVolume: 3200, cpc: 4.86, competition: 0.03 },
      { keyword: "medical center near me", tags: ["health", "local"], searchVolume: 8700, cpc: 7.45, competition: 0.05 },
      { keyword: "gp appointment online", tags: ["health", "digital"], searchVolume: 4100, cpc: 5.32, competition: 0.04 },
      { keyword: "after hours doctor", tags: ["urgent", "health"], searchVolume: 4600, cpc: 6.21, competition: 0.03 },
      { keyword: "bulk billing doctors", tags: ["health", "finance"], searchVolume: 7200, cpc: 5.75, competition: 0.04 },
      { keyword: "walk in medical clinic", tags: ["health", "local"], searchVolume: 5900, cpc: 6.89, competition: 0.04 },
      { keyword: "prescription delivery service", tags: ["health", "service"], searchVolume: 2500, cpc: 4.32, competition: 0.02 },
      { keyword: "doctor home visit", tags: ["health", "service"], searchVolume: 3800, cpc: 5.98, competition: 0.03 },
      { keyword: "virtual doctor consultation", tags: ["health", "digital"], searchVolume: 3300, cpc: 4.91, competition: 0.03 },
      { keyword: "free medical advice online", tags: ["health", "digital", "free"], searchVolume: 6800, cpc: 3.25, competition: 0.06 },
      { keyword: "medical certificates online", tags: ["health", "digital", "official"], searchVolume: 2900, cpc: 4.15, competition: 0.02 },
      { keyword: "family doctor accepting new patients", tags: ["health", "local"], searchVolume: 4500, cpc: 5.88, competition: 0.04 },
      { keyword: "specialist referral online", tags: ["health", "digital"], searchVolume: 2100, cpc: 5.34, competition: 0.02 }
    ];
    
    return keywordTemplates.map((template, index) => {
      const currentRank = Math.floor(Math.random() * 20) + 80; // 80-100
      const previousRank = currentRank + (Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : -Math.floor(Math.random() * 5) - 1);
      const bestRank = Math.min(currentRank, previousRank, 80 + Math.floor(Math.random() * 15));
      
      return {
        id: index + 1,
        ...template,
        currentRank,
        previousRank,
        change: currentRank - previousRank,
        bestRank,
        lastUpdated: format(new Date(), 'dd/MM/yyyy HH:mm'),
        history: getHistoricalData()
      };
    });
  };
  
  const keywords = generateKeywords();
  
  // Calculate summary metrics
  const keywordsUp = keywords.filter(k => k.change < 0).length;
  const keywordsDown = keywords.filter(k => k.change > 0).length;
  const keywordsNoChange = keywords.filter(k => k.change === 0).length;
  const keywordsTop3 = keywords.filter(k => k.currentRank <= 3).length;
  const keywordsTop10 = keywords.filter(k => k.currentRank <= 10).length;
  const keywordsTop100 = keywords.filter(k => k.currentRank <= 100).length;
  
  // Calculate project value
  const projectValue = keywords.reduce((total, k) => {
    return total + (k.searchVolume * k.cpc) / 1000;
  }, 0).toFixed(1);
  
  return {
    campaignDetails: {
      website: "doctortoyou.com.au",
      location: "Australia",
      language: "English",
      checkFrequency: "Daily at 13:56"
    },
    keywordRankings: keywords,
    summaryMetrics: {
      totalKeywords: keywords.length,
      keywordsUp,
      keywordsNoChange,
      keywordsDown,
      keywordsTop3,
      keywordsTop10,
      keywordsTop100,
      projectValue
    }
  };
};

/**
 * Get organic keyword rankings for a campaign
 * GET /api/client/local-organic-rankings
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaignId = parseInt(req.query.campaignId as string, 10) || 999;
    const dateRange = (req.query.dateRange as string) || 'last30days';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;
    
    const rankingsData = getMockOrganicRankings(campaignId, dateRange, startDate, endDate);
    
    // Apply sorting if requested
    if (sortBy && sortOrder) {
      rankingsData.keywordRankings.sort((a, b) => {
        let aValue: any = null;
        let bValue: any = null;
        
        // Handle specific sort fields
        switch(sortBy) {
          case 'keyword':
            aValue = a.keyword;
            bValue = b.keyword;
            break;
          case 'currentRank':
            aValue = a.currentRank;
            bValue = b.currentRank;
            break;
          case 'change':
            aValue = a.change;
            bValue = b.change;
            break;
          case 'searchVolume':
            aValue = a.searchVolume;
            bValue = b.searchVolume;
            break;
          case 'cpc':
            aValue = a.cpc;
            bValue = b.cpc;
            break;
          case 'competition':
            aValue = a.competition;
            bValue = b.competition;
            break;
          default:
            aValue = a.currentRank;
            bValue = b.currentRank;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    res.json({
      success: true,
      message: "Organic keyword rankings retrieved successfully",
      data: rankingsData
    });
  } catch (error: any) {
    console.error('Error fetching organic rankings:', error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve organic keyword rankings",
      error: error.message || "Unknown error"
    });
  }
});

export default router;