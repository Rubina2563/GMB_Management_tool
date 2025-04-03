/**
 * Defines the data structure for competitor analysis
 */

// Represents a single data point for trend analysis
export interface TrendPoint {
  date: string;
  rank: number;
}

// Represents trend data for a competitor
export interface CompetitorTrend {
  competitorName: string;
  trends: TrendPoint[];
}

// Represents keyword ranking overlap between business and competitor
export interface KeywordOverlap {
  keyword: string;
  yourRank: number;
  competitorRank: number;
  competitorName: string;
}

// Represents detailed competitor information
export interface CompetitorDetails {
  // Basic information
  name: string;
  rank: number;
  website?: string;
  isOpen: boolean;
  
  // Metrics
  reviewCount: number;
  averageRating: number;
  rankingKeywords: number;
  domainAuthority: number;
  photoCount?: number;
  postsLast30Days?: number;
  
  // Overlap with your business
  overlap: number; // percentage of keyword overlap
  
  // Categories
  categories: string[];
  
  // Location data for map
  lat?: number;
  lng?: number;
}

// Represents competitor strength analysis
export interface CompetitorStrengthData {
  betterRank: boolean;
  moreReviews: boolean;
  higherRating: boolean;
  higherDomainAuthority: boolean;
}

// Represents competitor strength
export interface CompetitorStrength {
  competitorName: string;
  strengths: CompetitorStrengthData;
}

// Represents aggregated competitor analysis data
export interface CompetitorAnalysisData {
  // Your business data
  yourBusiness: CompetitorDetails;
  
  // List of competitors
  competitors: CompetitorDetails[];
  
  // Keyword overlap data
  keywordOverlaps: KeywordOverlap[];
  
  // Trend data
  trends: CompetitorTrend[];
  
  // Selected competitor for detailed comparison
  selectedCompetitor?: string;
}

// Enhanced competitor data including strength analysis
export interface EnhancedCompetitorData extends CompetitorAnalysisData {
  competitorStrengths: CompetitorStrength[];
  rankTrends: CompetitorTrend[];
}