import { 
  CompetitorDetails, 
  EnhancedCompetitorData, 
  KeywordOverlap, 
  CompetitorStrength, 
  CompetitorTrend 
} from './competitor-types';

// This is a test dataset for development purposes, following the types defined in competitor-types.ts
// Later, this will be replaced with real data from the backend API

export const generateMockCompetitorData = (keyword: string = 'plumber near me'): EnhancedCompetitorData => {
  // Your business details
  const yourBusiness: CompetitorDetails = {
    name: "Your Plumbing Business",
    rank: 1,
    overlap: 100,
    reviewCount: 120,
    averageRating: 4.8,
    categories: ["Plumber", "Water Heater Installation", "Pipe Repair"],
    isOpen: true,
    website: "https://yourplumbingbusiness.com",
    domainAuthority: 50,
    rankingKeywords: 100
  };

  // Competitor details
  const competitors: CompetitorDetails[] = [
    {
      name: "Fast Fix Plumbing",
      rank: 2,
      overlap: 78,
      reviewCount: 150,
      averageRating: 4.6,
      categories: ["Plumber", "Emergency Plumbing", "Drain Cleaning"],
      isOpen: true,
      website: "https://fastfixplumbing.com",
      domainAuthority: 45,
      rankingKeywords: 94
    },
    {
      name: "Premier Plumbers Inc",
      rank: 3,
      overlap: 65,
      reviewCount: 95,
      averageRating: 4.9,
      categories: ["Plumber", "Bathroom Remodeling", "Commercial Plumbing"],
      isOpen: false,
      website: "https://premierplumbers.com",
      domainAuthority: 52,
      rankingKeywords: 82
    },
    {
      name: "All Hours Plumbing",
      rank: 4,
      overlap: 58,
      reviewCount: 180,
      averageRating: 4.3,
      categories: ["Plumber", "24/7 Emergency Service", "Sewer Repair"],
      isOpen: true,
      website: "https://allhoursplumbing.com",
      domainAuthority: 38,
      rankingKeywords: 76
    },
    {
      name: "Reliable Plumbing Co",
      rank: 5,
      overlap: 45,
      reviewCount: 85,
      averageRating: 4.7,
      categories: ["Plumber", "Gas Line Services", "Water Heater Repair"],
      isOpen: false,
      website: "https://reliableplumbing.com",
      domainAuthority: 42,
      rankingKeywords: 63
    },
    {
      name: "Pro Pipe Solutions",
      rank: 7,
      overlap: 34,
      reviewCount: 65,
      averageRating: 4.5,
      categories: ["Plumber", "Pipe Repair", "Leak Detection"],
      isOpen: true,
      website: "https://propipesolutions.com",
      domainAuthority: 35,
      rankingKeywords: 48
    }
  ];

  // Keyword overlap data
  const keywordOverlaps: KeywordOverlap[] = [
    { keyword: "plumber near me", yourRank: 1, competitorRank: 2, competitorName: "Fast Fix Plumbing" },
    { keyword: "emergency plumbing service", yourRank: 3, competitorRank: 1, competitorName: "All Hours Plumbing" },
    { keyword: "local plumber", yourRank: 2, competitorRank: 3, competitorName: "Premier Plumbers Inc" },
    { keyword: "water heater repair", yourRank: 1, competitorRank: 4, competitorName: "Reliable Plumbing Co" },
    { keyword: "pipe repair service", yourRank: 2, competitorRank: 1, competitorName: "Pro Pipe Solutions" },
    { keyword: "bathroom plumbing", yourRank: 3, competitorRank: 1, competitorName: "Premier Plumbers Inc" },
    { keyword: "commercial plumber", yourRank: 4, competitorRank: 2, competitorName: "Premier Plumbers Inc" },
    { keyword: "24 hour plumber", yourRank: 5, competitorRank: 1, competitorName: "All Hours Plumbing" },
    { keyword: "sewer line repair", yourRank: 2, competitorRank: 1, competitorName: "All Hours Plumbing" },
    { keyword: "leak detection", yourRank: 3, competitorRank: 1, competitorName: "Pro Pipe Solutions" }
  ];

  // Competitor strengths
  const competitorStrengths: CompetitorStrength[] = [
    {
      competitorName: "Fast Fix Plumbing",
      strengths: {
        betterRank: false,
        moreReviews: true,
        higherRating: false,
        higherDomainAuthority: false
      }
    },
    {
      competitorName: "Premier Plumbers Inc",
      strengths: {
        betterRank: false,
        moreReviews: false,
        higherRating: true,
        higherDomainAuthority: true
      }
    },
    {
      competitorName: "All Hours Plumbing",
      strengths: {
        betterRank: false,
        moreReviews: true,
        higherRating: false,
        higherDomainAuthority: false
      }
    },
    {
      competitorName: "Reliable Plumbing Co",
      strengths: {
        betterRank: false,
        moreReviews: false,
        higherRating: false,
        higherDomainAuthority: false
      }
    },
    {
      competitorName: "Pro Pipe Solutions",
      strengths: {
        betterRank: false,
        moreReviews: false,
        higherRating: false,
        higherDomainAuthority: false
      }
    }
  ];

  // Generate trends (mock data for past 30 days)
  const generateTrendData = (baseName: string, baseRank: number): CompetitorTrend => {
    const trends = [];
    let currentRank = baseRank;
    
    // Generate dates for the past 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Random rank fluctuation (±2 positions, but never below 1)
      const fluctuation = Math.floor(Math.random() * 5) - 2;
      currentRank = Math.max(1, currentRank + fluctuation);
      
      trends.push({
        date: dateStr,
        rank: currentRank
      });
    }
    
    return {
      competitorName: baseName,
      trends
    };
  };

  const rankTrends: CompetitorTrend[] = [
    generateTrendData(yourBusiness.name, yourBusiness.rank),
    ...competitors.map(comp => generateTrendData(comp.name, comp.rank))
  ];

  return {
    yourBusiness,
    competitors,
    keywordOverlaps,
    competitorStrengths,
    trends: rankTrends, // Mapped to match the EnhancedCompetitorData type
    rankTrends
  };
};

// Export a convenient way to get the mock data
export const getMockCompetitorData = (keyword?: string): EnhancedCompetitorData => {
  return generateMockCompetitorData(keyword);
};