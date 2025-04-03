import React from 'react';
import { KeywordOverlap, CompetitorDetails } from './competitor-types';

interface KeywordOverlapHeatmapProps {
  keywordOverlaps: KeywordOverlap[];
  competitors: CompetitorDetails[];
  maxKeywords?: number;
}

// Helper function to calculate color based on rank difference
const getRankDifferenceColor = (yourRank: number, competitorRank: number): string => {
  const diff = competitorRank - yourRank;
  
  if (diff > 0) {
    // You rank better (lower)
    const intensity = Math.min(255, 100 + Math.abs(diff) * 20);
    return `rgba(242, 140, 56, ${intensity/255})`; // Orange with intensity (SaaS theme color)
  } else if (diff < 0) {
    // Competitor ranks better (lower)
    const intensity = Math.min(255, 100 + Math.abs(diff) * 20);
    return `rgba(16, 185, 129, ${intensity/255})`; // Green with intensity
  } else {
    // Same rank
    return 'rgba(229, 231, 235, 0.5)'; // Light gray
  }
};

const KeywordOverlapHeatmap: React.FC<KeywordOverlapHeatmapProps> = ({
  keywordOverlaps,
  competitors,
  maxKeywords = 5
}) => {
  // Get a list of unique keywords, limited to maxKeywords
  const getUniqueKeywords = (): string[] => {
    // Collect unique keywords without using Set for compatibility
    const keywordMap: Record<string, boolean> = {};
    keywordOverlaps.forEach(item => {
      keywordMap[item.keyword] = true;
    });
    
    // Convert to array and limit to maxKeywords
    const keywords = Object.keys(keywordMap);
    return keywords.slice(0, maxKeywords);
  };
  
  const uniqueKeywords = getUniqueKeywords();
  
  // Group overlaps by competitor for easier lookup
  const getCompetitorData = () => {
    const competitorMap = new Map<string, Map<string, { yourRank: number, competitorRank: number }>>();
    
    competitors.forEach(comp => {
      competitorMap.set(comp.name, new Map());
    });
    
    keywordOverlaps.forEach(overlap => {
      const compMap = competitorMap.get(overlap.competitorName);
      if (compMap) {
        compMap.set(overlap.keyword, {
          yourRank: overlap.yourRank,
          competitorRank: overlap.competitorRank
        });
      }
    });
    
    return competitorMap;
  };
  
  const competitorData = getCompetitorData();
  
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-black bg-gray-100 border">Keyword</th>
            <th className="p-2 text-center font-medium text-black bg-gray-100 border">Your Rank</th>
            {competitors.map((comp, i) => (
              <th 
                key={i} 
                className="p-2 text-center font-medium text-black bg-gray-100 border"
              >
                {comp.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {uniqueKeywords.map((keyword, i) => {
            // Find your rank for this keyword
            const yourRankData = keywordOverlaps.find(
              overlap => overlap.keyword === keyword
            );
            const yourRank = yourRankData?.yourRank || 0;
            
            return (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 text-black font-medium border">{keyword}</td>
                <td className="p-2 text-center text-black border">{yourRank}</td>
                {competitors.map((comp, j) => {
                  // Find competitor data for this keyword if it exists
                  const compKeywordMap = competitorData.get(comp.name);
                  const compData = compKeywordMap?.get(keyword);
                  
                  // Default values if no data exists
                  let competitorRank = 0;
                  let backgroundColor = 'transparent';
                  
                  if (compData) {
                    competitorRank = compData.competitorRank;
                    backgroundColor = getRankDifferenceColor(yourRank, competitorRank);
                  }
                  
                  return (
                    <td 
                      key={j} 
                      className="p-2 text-center text-black border"
                      style={{ backgroundColor }}
                    >
                      {competitorRank > 0 ? competitorRank : '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="mt-4 flex items-center text-sm justify-end space-x-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#F28C38] mr-2 rounded-sm"></div>
          <span className="text-black">You rank better</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-200 mr-2 rounded-sm"></div>
          <span className="text-black">Same rank</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 mr-2 rounded-sm"></div>
          <span className="text-black">Competitor ranks better</span>
        </div>
      </div>
    </div>
  );
};

export default KeywordOverlapHeatmap;