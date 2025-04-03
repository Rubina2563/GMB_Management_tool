import { RankingNode } from './types';

interface HistoricalRankingPoint {
  date: string;
  rank: number;
  lat: number;
  lng: number;
  id: string | number;
}

interface TrendLine {
  start: HistoricalRankingPoint;
  end: HistoricalRankingPoint;
  rankChange: number;
}

interface HeatmapPoint {
  location: google.maps.LatLng;
  weight: number;
}

/**
 * Generate simulated historical data for trend visualization
 * @param nodes Current ranking nodes
 * @param numHistoricalPoints Number of historical points to generate
 * @returns Array of historical ranking points with dates
 */
export function generateHistoricalData(nodes: RankingNode[], numHistoricalPoints: number = 3): HistoricalRankingPoint[][] {
  // If no nodes provided, return empty array
  if (!nodes || nodes.length === 0) return [];
  
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const twoMonthsAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
  
  const dates = [
    twoMonthsAgo.toISOString().split('T')[0],
    oneMonthAgo.toISOString().split('T')[0],
    twoWeeksAgo.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  ];
  
  // For each node, generate historical data points
  return nodes.map(node => {
    // Create an array to hold historical points for this node
    const nodeHistory: HistoricalRankingPoint[] = [];
    
    // For each historical point, modify the rank and position slightly
    for (let i = 0; i < numHistoricalPoints; i++) {
      // Generate a random rank change between -3 and +3 (weighted toward improvement)
      const randomChange = Math.floor(Math.random() * 7) - 3;
      
      // Calculate historical rank (ensure it's at least 1)
      const historicalRank = Math.max(1, node.rank + randomChange);
      
      // Add slight geo position variance for more realistic visualization
      const latVariance = (Math.random() - 0.5) * 0.002; // About 200m
      const lngVariance = (Math.random() - 0.5) * 0.002;
      
      nodeHistory.push({
        date: dates[i],
        rank: historicalRank,
        lat: node.lat + latVariance,
        lng: node.lng + lngVariance,
        id: `${node.id}-hist-${i}`
      });
    }
    
    // Add the current node as the latest point
    nodeHistory.push({
      date: dates[dates.length - 1],
      rank: node.rank,
      lat: node.lat,
      lng: node.lng,
      id: `${node.id}-current`
    });
    
    return nodeHistory;
  });
}

/**
 * Generate trend lines to visualize geographic movement over time
 * @param historicalData Array of historical ranking points
 * @returns Array of point pairs for trend lines
 */
export function generateTrendLines(historicalData: HistoricalRankingPoint[][]): TrendLine[] {
  // Each item in historical data is an array of points for one node
  if (!historicalData || historicalData.length === 0) return [];
  
  const trendLines: TrendLine[] = [];
  
  // For each node's history
  historicalData.forEach(nodeHistory => {
    // Sort by date
    const sortedHistory = [...nodeHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Create pairs of consecutive points
    for (let i = 0; i < sortedHistory.length - 1; i++) {
      trendLines.push({
        start: sortedHistory[i],
        end: sortedHistory[i+1],
        rankChange: sortedHistory[i].rank - sortedHistory[i+1].rank
      });
    }
  });
  
  return trendLines;
}

/**
 * Calculate a heat value based on rank changes over time
 * More improvement = higher heat value
 * @param historicalData Array of historical ranking points
 * @returns Array of heat points with weighted values
 */
export function calculateHeatMap(historicalData: HistoricalRankingPoint[][]): HeatmapPoint[] {
  if (!historicalData || historicalData.length === 0) return [];
  
  const heatPoints: HeatmapPoint[] = [];
  
  // For each node's history
  historicalData.forEach(nodeHistory => {
    // If we have at least 2 points, we can calculate trends
    if (nodeHistory.length >= 2) {
      // Sort by date
      const sortedHistory = [...nodeHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Get first and last points to measure overall change
      const firstPoint = sortedHistory[0];
      const lastPoint = sortedHistory[sortedHistory.length - 1];
      
      // Calculate rank improvement
      const rankImprovement = firstPoint.rank - lastPoint.rank;
      
      // Normalize to a heat value (0-1)
      // Positive = improvement, negative = decline
      // Scale to a reasonable range (-10 to +10 mapped to 0-1)
      let heatValue = 0.5; // Neutral point
      
      if (rankImprovement > 0) {
        // Improved ranking (lower number is better)
        heatValue = Math.min(1.0, 0.5 + (rankImprovement / 20));
      } else if (rankImprovement < 0) {
        // Declined ranking
        heatValue = Math.max(0.0, 0.5 + (rankImprovement / 20));
      }
      
      // Add to heat points array
      heatPoints.push({
        location: new google.maps.LatLng(lastPoint.lat, lastPoint.lng),
        weight: heatValue
      });
    }
  });
  
  return heatPoints;
}