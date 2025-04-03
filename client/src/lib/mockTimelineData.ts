// Mock data generator for timeline analysis

export interface TimelineDataPoint {
  date: string;
  value: number;
  competitors?: {
    [key: string]: number;
  };
}

// List of competitors for mock data
export const MOCK_COMPETITORS = [
  'City Dental Group',
  'Premier Plumbing Services',
  'Downtown Fitness Center',
  'Elite Home Renovations'
];

// Generate a date string for n months ago
const getDateMonthsAgo = (monthsAgo: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Generate random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate realistic review data with a growing trend for your business
export const generateReviewTimelineData = (
  months: number = 24,
  competitors: string[] = MOCK_COMPETITORS.slice(0, 5)
): TimelineDataPoint[] => {
  const result: TimelineDataPoint[] = [];
  
  // Base values that will have slight variations
  const yourBaseValue = 8; // Your business gets around 8 reviews per month
  const competitorBaseValues: Record<string, number> = {};
  
  // Assign random base values to competitors (between 4-10)
  competitors.forEach(competitor => {
    competitorBaseValues[competitor] = getRandomInt(4, 10);
  });
  
  // Generate data for each month
  for (let i = months - 1; i >= 0; i--) {
    const date = getDateMonthsAgo(i);
    
    // Your business shows a slight growth trend
    const growthFactor = 1 + (months - i) * 0.04; // 4% increase per month
    let yourValue = Math.round(yourBaseValue * growthFactor * (0.9 + Math.random() * 0.3));
    
    // Ensure minimum reasonable value
    yourValue = Math.max(3, yourValue);
    
    // Competitor data
    const competitorData: Record<string, number> = {};
    competitors.forEach(competitor => {
      // Competitors have different growth rates
      const competitorGrowthFactor = 1 + (months - i) * (0.02 + Math.random() * 0.03);
      let competitorValue = Math.round(
        competitorBaseValues[competitor] * competitorGrowthFactor * (0.85 + Math.random() * 0.3)
      );
      competitorValue = Math.max(2, competitorValue);
      competitorData[competitor] = competitorValue;
    });
    
    result.push({
      date,
      value: yourValue,
      competitors: competitorData
    });
  }
  
  return result;
};

// Generate post timeline data with seasonal variations
export const generatePostTimelineData = (
  months: number = 24,
  competitors: string[] = MOCK_COMPETITORS.slice(0, 5)
): TimelineDataPoint[] => {
  const result: TimelineDataPoint[] = [];
  
  // Base values
  const yourBaseValue = 6; // About 6 posts per month
  const competitorBaseValues: Record<string, number> = {};
  
  // Assign base values to competitors (between 3-8)
  competitors.forEach(competitor => {
    competitorBaseValues[competitor] = getRandomInt(3, 8);
  });
  
  // Generate data for each month
  for (let i = months - 1; i >= 0; i--) {
    const date = getDateMonthsAgo(i);
    const monthNumber = new Date(date).getMonth();
    
    // Add seasonal variations (more posts during holidays)
    let seasonalFactor = 1;
    if (monthNumber === 10 || monthNumber === 11) { // Nov-Dec (holiday season)
      seasonalFactor = 1.4;
    } else if (monthNumber === 5 || monthNumber === 6) { // Summer months
      seasonalFactor = 1.2;
    }
    
    // Your business shows consistent posting with seasonal variations
    let yourValue = Math.round(yourBaseValue * seasonalFactor * (0.9 + Math.random() * 0.3));
    yourValue = Math.max(2, yourValue);
    
    // Competitor data
    const competitorData: Record<string, number> = {};
    competitors.forEach(competitor => {
      // Different competitors have different seasonal patterns
      const competitorSeasonalFactor = 
        monthNumber === 10 || monthNumber === 11 ? 1.3 + Math.random() * 0.2 : 
        monthNumber === 5 || monthNumber === 6 ? 1.1 + Math.random() * 0.2 : 
        0.9 + Math.random() * 0.2;
      
      let competitorValue = Math.round(
        competitorBaseValues[competitor] * competitorSeasonalFactor * (0.85 + Math.random() * 0.3)
      );
      competitorValue = Math.max(1, competitorValue);
      competitorData[competitor] = competitorValue;
    });
    
    result.push({
      date,
      value: yourValue,
      competitors: competitorData
    });
  }
  
  return result;
};

// Generate photo upload timeline data
export const generatePhotoTimelineData = (
  months: number = 24,
  competitors: string[] = MOCK_COMPETITORS.slice(0, 5)
): TimelineDataPoint[] => {
  const result: TimelineDataPoint[] = [];
  
  // Base values (photos are typically uploaded less frequently)
  const yourBaseValue = 4; // About 4 photos per month
  const competitorBaseValues: Record<string, number> = {};
  
  // Assign base values to competitors (between 2-6)
  competitors.forEach(competitor => {
    competitorBaseValues[competitor] = getRandomInt(2, 6);
  });
  
  // Generate data for each month
  for (let i = months - 1; i >= 0; i--) {
    const date = getDateMonthsAgo(i);
    
    // Photos typically have spikes rather than seasonal patterns
    // Every few months, simulate a "photo shoot" with more uploads
    const isPhotoMonth = i % 3 === 0;
    const photoSpikeFactor = isPhotoMonth ? 2.5 : 1;
    
    let yourValue = Math.round(yourBaseValue * photoSpikeFactor * (0.8 + Math.random() * 0.4));
    yourValue = Math.max(1, yourValue);
    
    // Competitor data
    const competitorData: Record<string, number> = {};
    competitors.forEach(competitor => {
      // Competitors have their own photo upload patterns
      const competitorIsPhotoMonth = (i + getRandomInt(1, 3)) % 3 === 0;
      const competitorPhotoSpikeFactor = competitorIsPhotoMonth ? 2.2 : 1;
      
      let competitorValue = Math.round(
        competitorBaseValues[competitor] * competitorPhotoSpikeFactor * (0.7 + Math.random() * 0.6)
      );
      competitorValue = Math.max(0, competitorValue);
      competitorData[competitor] = competitorValue;
    });
    
    result.push({
      date,
      value: yourValue,
      competitors: competitorData
    });
  }
  
  return result;
};

// Generate all timeline data
export const generateAllTimelineData = (months: number = 24, dataType?: string) => {
  // If a specific dataType is provided, only generate that type of data
  if (dataType === 'reviews') {
    return {
      reviews: generateReviewTimelineData(months),
      posts: [],
      photos: []
    };
  } else if (dataType === 'posts') {
    return {
      reviews: [],
      posts: generatePostTimelineData(months),
      photos: []
    };
  } else if (dataType === 'photos') {
    return {
      reviews: [],
      posts: [],
      photos: generatePhotoTimelineData(months)
    };
  }
  
  // Default: generate all data
  return {
    reviews: generateReviewTimelineData(months),
    posts: generatePostTimelineData(months),
    photos: generatePhotoTimelineData(months)
  };
};

// Define ranking impact data
export const rankingImpactData = {
  reviews: {
    correlation: 0.72,
    description: 'Strong correlation with local ranking position'
  },
  posts: {
    correlation: 0.45,
    description: 'Moderate correlation with visibility and engagement'
  },
  photos: {
    correlation: 0.58,
    description: 'Significant impact on user engagement metrics'
  }
};