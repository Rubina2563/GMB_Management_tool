/**
 * Types for the ranking components
 */

// Represents a single point in the geo grid
export interface RankingNode {
  id: number;
  lat: number;
  lng: number;
  rank: number;
  searchVolume?: number;
  rankChange?: number;
  competitors?: string[];
}

// Historical data point for trends
export interface HistoricalPoint {
  date: string;
  rank: number;
  lat: number;
  lng: number;
  id: string | number;
}

// Trend line between two points
export interface TrendLine {
  start: HistoricalPoint;
  end: HistoricalPoint;
  rankChange: number;
}

// Ranking data for a specific keyword
export interface KeywordRankingData {
  keyword: string;
  rankData: RankingNode[];
  averageRank: number;
  rankChange: number;
  lastUpdate: string;
}

// Time series data for rank trends
export interface RankingTrendData {
  dates: string[];
  ranks: number[];
  keyword: string;
}

// Trend data point with additional metrics
export interface TrendDataPoint {
  date: string;
  rank: number;
  traffic?: number;
  visibility?: number;
  projected?: boolean;
}

// Competitor analysis data
export interface CompetitorData {
  name: string;
  rank: number;
  rankChange: number;
  visibility: number;
  keywordOverlap: number;
  strengths: string[];
  weaknesses: string[];
  // Enhanced competitor data
  reviewCount?: number;
  averageRating?: number;
  categories?: string[];
  isOpen?: boolean;
  website?: string;
  domainAuthority?: number;
  rankingKeywords?: number;
}

// Ranking distribution data for charts
export interface RankDistribution {
  range: string;
  count: number;
}

// View types for the heatmap overlay
export type ViewMode = 'standard' | 'heatmap' | 'trend';

// Tab types for the ranking trends section
export type TrendTab = 'overview' | 'competitors' | 'forecast';

// Keyword overlap data
export interface KeywordOverlapData {
  competitor: string;
  keywords: Record<string, number>;
}

// Single keyword trend for a competitor
export interface CompetitorKeywordTrend {
  competitor: string;
  keyword: string;
  data: { date: string; rank: number }[];
}

// Competitor metric data for radar charts
export interface CompetitorMetric {
  name: string;
  data: {
    category: string;
    value: number;
  }[];
}

// Map marker icon types
export enum MarkerIcon {
  Standard = 'standard',
  Improved = 'improved',
  Declined = 'declined',
  Top3 = 'top3',
  NotRanked = 'not-ranked'
}

// Theme colors
export const THEME_COLORS = {
  primary: '#F28C38',
  secondary: '#1F2937',
  success: '#34D399',
  danger: '#EF4444',
  warning: '#FBBF24',
  info: '#60A5FA',
  neutral: '#9CA3AF'
};

// Utility function to determine marker icon based on rank data
export function getMarkerIcon(rank: number, rankChange?: number): MarkerIcon {
  if (rank <= 0) return MarkerIcon.NotRanked;
  if (rank <= 3) return MarkerIcon.Top3;
  if (rankChange && rankChange > 0) return MarkerIcon.Improved;
  if (rankChange && rankChange < 0) return MarkerIcon.Declined;
  return MarkerIcon.Standard;
}

// Utility function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}