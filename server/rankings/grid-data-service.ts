/**
 * Grid Data Service
 * Generates mock geo-grid data for testing purposes
 */

interface RankingNode {
  id: number;
  lat: number;
  lng: number;
  rank: number;
  searchVolume: number;
  rankChange: number;
  competitors: string[];
}

interface GridDataOptions {
  keyword: string;
  gridSize: number;
  baseRank: number;
  shape: 'square' | 'circular';
}

// Generate a consistent hash value from a string
function getStringHash(str: string): number {
  return str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

// Generate mock competitors based on keyword
function generateCompetitors(keyword: string): string[] {
  const competitors = [
    "Competitor A",
    "Competitor B",
    "Competitor C",
    "Competitor D",
    "Competitor E",
    "Competitor F"
  ];
  
  // Get a unique hash from the keyword to determine which competitors to include
  const hash = getStringHash(keyword);
  const numCompetitors = Math.max(1, (hash % 3) + 1); // 1-3 competitors
  
  // Use the hash to determine which competitors to include
  const selectedIndices = new Set<number>();
  for (let i = 0; i < numCompetitors; i++) {
    selectedIndices.add((hash + i) % competitors.length);
  }
  
  return Array.from(selectedIndices).map(index => competitors[index]);
}

/**
 * Generate mock grid data for the geo-grid map
 */
export function generateMockGridData(options: GridDataOptions): RankingNode[] {
  const { keyword, gridSize, baseRank, shape } = options;
  const result: RankingNode[] = [];
  
  // Phoenix coordinates as default center
  const centerLat = 33.4484;
  const centerLng = -112.0740;
  
  // Calculate step size for even spacing
  const latStep = 0.008;
  const lngStep = 0.01;
  
  // Get a hash from the keyword to ensure consistent results for the same keyword
  const hash = getStringHash(keyword);
  
  // Generate grid points
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Calculate relative position from center (range: -1 to 1)
      const relRow = (row / (gridSize - 1)) * 2 - 1;
      const relCol = (col / (gridSize - 1)) * 2 - 1;
      
      // Calculate distance from center (0 to ~1.414 for corners)
      const distanceFromCenter = Math.sqrt(relRow * relRow + relCol * relCol);
      
      // Skip points outside the circle for circular shape
      if (shape === 'circular' && distanceFromCenter > 1) {
        continue;
      }
      
      // Calculate coordinates
      const lat = centerLat + relRow * latStep * gridSize/2;
      const lng = centerLng + relCol * lngStep * gridSize/2;
      
      // Calculate rank based on distance from center and keyword hash
      // Points closer to center have better ranks
      const distanceFactor = distanceFromCenter * 10; // Scale to 0-14 range
      const randomFactor = ((hash + row * gridSize + col) % 10) / 10; // 0-0.9 random factor
      const calculatedRank = Math.floor(baseRank + distanceFactor + randomFactor * 5);
      const rank = Math.max(1, Math.min(20, calculatedRank));
      
      // Calculate search volume (inverse to rank - better ranks have higher volume)
      const searchVolume = Math.floor(1000 - rank * 30 + ((hash + row + col) % 200));
      
      // Calculate rank change (-5 to +5)
      const rankChange = Math.floor(((hash + row * col) % 11) - 5);
      
      // Generate competing businesses
      const competitors = generateCompetitors(`${keyword}-${row}-${col}`);
      
      result.push({
        id: row * gridSize + col + 1,
        lat,
        lng,
        rank,
        searchVolume,
        rankChange,
        competitors
      });
    }
  }
  
  return result;
}