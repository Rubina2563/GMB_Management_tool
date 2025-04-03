/**
 * Competitor data types
 */

/**
 * Review structure for a competitor
 */
export interface CompetitorReview {
  text: string;
  rating: number;
  date: string;
}

/**
 * Competitor data structure (basic)
 */
export interface Competitor {
  id?: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  category?: string | null;
  rating?: number | null;
  review_count?: number | null;
  photo_count?: number | null;
  post_count?: number | null;
  distance?: number | null;
  rank?: number | null;
}

/**
 * Extended competitor data structure (for API results)
 */
export interface CompetitorData {
  name: string;
  category: string;
  address: string;
  rating: number;
  reviewCount: number;
  responseRate: number;
  photoCount: number;
  postCount: number;
  website: string;
  phone: string;
  reviews: CompetitorReview[];
}

/**
 * Performance gap identified in competitor analysis
 */
export interface PerformanceGap {
  metric: string;
  yourValue: number;
  competitorAvg: number;
  gap: number;
  significance: 'high' | 'medium' | 'low';
}

/**
 * Recommendation structure
 */
export interface Recommendation {
  title: string;
  description: string;
  action: string;
}

/**
 * Complete competitor analysis result
 */
export interface CompetitorAnalysis {
  competitors: CompetitorData[];
  performanceGaps: PerformanceGap[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: Recommendation[];
  score?: number;
  locationId?: number;
  lastUpdated?: string | Date;
  rankingPosition?: number | null;
}