import React from 'react';
import { RankingNode } from './types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ActivityIcon, BarChart3Icon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface RankingHeatmapOverlayProps {
  nodes: RankingNode[];
  onViewChange?: (type: 'standard' | 'heatmap' | 'trend') => void;
  onArrowsChange?: (showArrows: boolean) => void;
}

/**
 * Control panel component for the Ranking Heatmap overlay
 * This doesn't modify the GoogleMap, but provides controls to toggle different views
 */
const RankingHeatmapOverlay: React.FC<RankingHeatmapOverlayProps> = ({
  nodes,
  onViewChange,
  onArrowsChange
}) => {
  const [viewMode, setViewMode] = React.useState<'standard' | 'heatmap' | 'trend'>('standard');
  const [showTrendArrows, setShowTrendArrows] = React.useState<boolean>(true);
  
  // Handle view change
  const handleViewChange = (mode: 'standard' | 'heatmap' | 'trend') => {
    setViewMode(mode);
    if (onViewChange) {
      onViewChange(mode);
    }
  };
  
  // Calculate statistics for the current nodes
  const getRankingStats = () => {
    if (!nodes || nodes.length === 0) return { improving: 0, declining: 0, unchanged: 0 };
    
    const improving = nodes.filter(n => n.rankChange && n.rankChange > 0).length;
    const declining = nodes.filter(n => n.rankChange && n.rankChange < 0).length;
    const unchanged = nodes.filter(n => !n.rankChange || n.rankChange === 0).length;
    
    return { improving, declining, unchanged };
  };
  
  const stats = getRankingStats();
  const totalNodes = nodes.length;
  
  return (
    <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-md shadow-md text-black">
      <div className="font-medium text-base mb-3 border-b pb-2">Ranking Trend Overlay</div>
      
      <div className="flex flex-col space-y-4">
        {/* View Mode Selection */}
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === 'standard' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'standard' 
                    ? 'bg-[#F28C38] hover:bg-[#E87D2A] text-white' 
                    : 'text-black hover:text-black'}
                  onClick={() => handleViewChange('standard')}
                  style={{ backgroundColor: viewMode === 'standard' ? '#F28C38' : 'transparent' }}
                >
                  <BarChart3Icon className="h-4 w-4 mr-1" />
                  Standard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show standard ranking view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === 'heatmap' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'heatmap' 
                    ? 'bg-[#F28C38] hover:bg-[#E87D2A] text-white' 
                    : 'text-black hover:text-black'}
                  onClick={() => handleViewChange('heatmap')}
                  style={{ backgroundColor: viewMode === 'heatmap' ? '#F28C38' : 'transparent' }}
                >
                  <ActivityIcon className="h-4 w-4 mr-1" />
                  Heatmap
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show ranking heatmap overlay</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === 'trend' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'trend' 
                    ? 'bg-[#F28C38] hover:bg-[#E87D2A] text-white' 
                    : 'text-black hover:text-black'}
                  onClick={() => handleViewChange('trend')}
                  style={{ backgroundColor: viewMode === 'trend' ? '#F28C38' : 'transparent' }}
                >
                  <TrendingUpIcon className="h-4 w-4 mr-1" />
                  Trends
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show ranking trend indicators</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Trend Details */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Improving</span>
            <span>Declining</span>
            <span>Unchanged</span>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <TrendingUpIcon className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">{stats.improving}</span>
            </div>
            <div className="flex items-center">
              <TrendingDownIcon className="h-3 w-3 text-red-600 mr-1" />
              <span className="text-red-600 font-medium">{stats.declining}</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-gray-300 rounded-full inline-block mr-1"></span>
              <span className="text-gray-600 font-medium">{stats.unchanged}</span>
            </div>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full mt-1 overflow-hidden flex">
            <div 
              className="bg-green-600 h-full" 
              style={{ width: `${Math.round((stats.improving / totalNodes) * 100)}%` }}
            ></div>
            <div 
              className="bg-red-600 h-full"
              style={{ width: `${Math.round((stats.declining / totalNodes) * 100)}%` }}
            ></div>
            <div 
              className="bg-gray-400 h-full"
              style={{ width: `${Math.round((stats.unchanged / totalNodes) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Trend Arrows Toggle */}
        {viewMode === 'trend' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="trend-arrows"
                checked={showTrendArrows}
                onCheckedChange={(checked) => {
                  setShowTrendArrows(checked);
                  if (onArrowsChange) onArrowsChange(checked);
                }}
              />
              <Label htmlFor="trend-arrows" className="text-sm">Show Trend Arrows</Label>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs text-black mb-1">
            <span className="font-medium">Legend:</span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>Better Rank</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span>Worse Rank</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
              <span>Rank 4-10</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mr-1"></div>
              <span>No Change</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingHeatmapOverlay;