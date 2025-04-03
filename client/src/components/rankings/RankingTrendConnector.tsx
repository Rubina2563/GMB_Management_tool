import React from 'react';
import { ArrowDownIcon, ArrowUpIcon, ArrowRightIcon } from 'lucide-react';

interface Coordinate {
  lat: number;
  lng: number;
}

interface TrendPoint {
  start: Coordinate;
  end: Coordinate;
  rankChange: number;
}

interface RankingTrendConnectorProps {
  trendLines: TrendPoint[];
  showArrows?: boolean;
  showLines?: boolean;
}

/**
 * Component that renders trend lines and arrows on the Google Map
 * to visualize ranking changes over time
 */
const RankingTrendConnector: React.FC<RankingTrendConnectorProps> = ({ 
  trendLines, 
  showArrows = true,
  showLines = true 
}) => {
  // Render nothing if there are no trend lines
  if (!trendLines || trendLines.length === 0) {
    return null;
  }

  return (
    <div className="trend-connector-wrapper" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {trendLines.map((line, index) => {
        // Determine color based on rank change
        let color = '#888888'; // No change
        if (line.rankChange > 0) {
          color = '#34D399'; // Improved (green)
        } else if (line.rankChange < 0) {
          color = '#EF4444'; // Declined (red)
        }

        // Calculate the middle point for arrow placement
        const midLat = (line.start.lat + line.end.lat) / 2;
        const midLng = (line.start.lng + line.end.lng) / 2;
        
        // Calculate the angle for arrow rotation
        const angle = Math.atan2(
          line.end.lat - line.start.lat,
          line.end.lng - line.start.lng
        ) * (180 / Math.PI);
        
        // Determine which arrow icon to use
        let ArrowIcon = ArrowRightIcon;
        if (line.rankChange > 0) {
          ArrowIcon = ArrowUpIcon;
        } else if (line.rankChange < 0) {
          ArrowIcon = ArrowDownIcon;
        }
        
        return (
          <div key={`trend-${index}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            {showLines && (
              <div 
                className="trend-line" 
                style={{ 
                  position: 'absolute',
                  top: line.start.lat,
                  left: line.start.lng,
                  width: `${Math.sqrt(Math.pow(line.end.lat - line.start.lat, 2) + Math.pow(line.end.lng - line.start.lng, 2))}px`,
                  height: '0px',
                  borderTop: `2px dashed ${color}`,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: '0 0'
                }} 
              />
            )}
            
            {showArrows && (
              <div
                style={{ 
                  position: 'absolute',
                  top: midLat,
                  left: midLng,
                  transform: `translate(-50%, -50%)`,
                  color: color,
                  background: 'white',
                  borderRadius: '50%',
                  padding: '2px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  zIndex: 10
                }}
              >
                <ArrowIcon size={16} style={{ transform: `rotate(${angle}deg)` }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RankingTrendConnector;