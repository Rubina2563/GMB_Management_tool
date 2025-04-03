import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import {
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowRightIcon,
  TrophyIcon,
  AlertTriangleIcon,
  InfoIcon,
  GridIcon,
  StarIcon,
  TargetIcon
} from 'lucide-react';
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CustomProgress } from './CustomProgress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';

// Define the color scheme
const colors = {
  primary: '#F28C38',
  text: '#1C2526',
  positive: '#28A745',
  warning: '#F5A461',
  negative: '#E63946',
  neutral: '#CCCCCC'
};

// Define types for the component props
interface RankingNode {
  id: number;
  lat: number;
  lng: number;
  rank: number;
  searchVolume?: number;
  rankChange?: number;
  competitors?: string[];
}

interface RankDistribution {
  '1-3': number;
  '4-10': number;
  '11-20': number;
  '>20': number;
}

interface PreviousMetrics {
  afpr: number;
  tgrm: number;
  tss: number;
}

interface EnhancedRankingSummaryProps {
  data: RankingNode[];
  metrics: {
    averageFirstPageRank: number;
    gridRankMean: number;
    topSpotShare: number;
    visibilityScore: number;
  };
  keyword?: string;
  rankDistribution?: RankDistribution;
  topGridPoints?: RankingNode[];
  weakestGridPoints?: RankingNode[];
  previousMetrics?: PreviousMetrics;
  keywordDifficulty?: number;
  onZoomToArea?: (lat: number, lng: number) => void;
}

// Helper function to convert a metrics string to a number
const metricToNumber = (metric: string): number => {
  if (metric === 'N/A') return 0;
  if (metric.includes('%')) {
    return parseFloat(metric.replace('%', ''));
  }
  return parseFloat(metric);
};

// Helper function to calculate the color based on a metric value
const getMetricColor = (metric: string, type: 'afpr' | 'tgrm' | 'tss'): string => {
  const value = metricToNumber(metric);
  
  if (type === 'afpr' || type === 'tgrm') {
    if (value < 5) return colors.positive;
    if (value < 10) return colors.warning;
    return colors.negative;
  } else { // tss
    if (value > 50) return colors.positive;
    if (value > 20) return colors.warning;
    return colors.negative;
  }
};

// Helper function to calculate the percentage for progress bars
const getProgressPercentage = (metric: string, type: 'afpr' | 'tgrm' | 'tss'): number => {
  const value = metricToNumber(metric);
  
  if (type === 'afpr' || type === 'tgrm') {
    // Lower is better for ranks, so we invert the scale
    return Math.max(0, Math.min(100, 100 - (value / 20 * 100)));
  } else { // tss
    return Math.max(0, Math.min(100, value));
  }
};

// Helper function to calculate the trend indicator and value
const getTrendIndicator = (current: string, previous: number, type: 'afpr' | 'tgrm' | 'tss') => {
  if (!previous) return { icon: null, value: '0', color: colors.neutral };
  
  const currentValue = metricToNumber(current);
  const diff = type === 'tss' 
    ? currentValue - previous 
    : previous - currentValue; // For ranks, lower is better
  
  const formattedDiff = diff.toFixed(1);
  
  if (diff > 0) {
    return {
      icon: <TrendingUpIcon className="h-4 w-4" />,
      value: `+${formattedDiff}`,
      color: colors.positive
    };
  } else if (diff < 0) {
    return {
      icon: <TrendingDownIcon className="h-4 w-4" />,
      value: formattedDiff,
      color: colors.negative
    };
  } else {
    return {
      icon: null,
      value: '0',
      color: colors.neutral
    };
  }
};

// Helper function to calculate keyword difficulty label
const getKeywordDifficultyLabel = (score: number): { label: string; color: string } => {
  if (score > 60) return { label: 'High', color: colors.negative };
  if (score > 30) return { label: 'Medium', color: colors.warning };
  return { label: 'Low', color: colors.positive };
};

// Helper function to calculate rank distribution from grid data
const calculateRankDistribution = (gridData: RankingNode[]): RankDistribution => {
  const distribution = {
    '1-3': 0,
    '4-10': 0,
    '11-20': 0,
    '>20': 0
  };
  
  if (!gridData.length) return distribution;
  
  const total = gridData.length;
  
  gridData.forEach(node => {
    if (node.rank <= 3) {
      distribution['1-3']++;
    } else if (node.rank <= 10) {
      distribution['4-10']++;
    } else if (node.rank <= 20) {
      distribution['11-20']++;
    } else {
      distribution['>20']++;
    }
  });
  
  // Convert counts to percentages
  return {
    '1-3': Math.round((distribution['1-3'] / total) * 100),
    '4-10': Math.round((distribution['4-10'] / total) * 100),
    '11-20': Math.round((distribution['11-20'] / total) * 100),
    '>20': Math.round((distribution['>20'] / total) * 100)
  };
};

// Component to display a metric with a progress bar and trend indicator
const MetricDisplay = ({ 
  label, 
  value, 
  type, 
  icon, 
  previousValue 
}: { 
  label: string; 
  value: string; 
  type: 'afpr' | 'tgrm' | 'tss'; 
  icon: React.ReactNode;
  previousValue?: number;
}) => {
  const progressPercentage = getProgressPercentage(value, type);
  const progressColor = getMetricColor(value, type);
  const trend = previousValue ? getTrendIndicator(value, previousValue, type) : null;
  
  // Description for tooltip
  const descriptions = {
    afpr: 'AFPR (Average First Page Rank): The average rank of your business across all grid points with rank ≤ 10.',
    tgrm: 'GRM (Grid Rank Mean): The average rank of your business across all grid points on the map.',
    tss: 'TSS (Top Spot Share): The percentage of grid points where your business ranks in the top 3 positions.'
  };
  
  // Background colors for different metric types
  const getBgColor = () => {
    if (type === 'afpr') return 'bg-blue-50 border-blue-200';
    if (type === 'tgrm') return 'bg-purple-50 border-purple-200';
    if (type === 'tss') return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };
  
  // Value color based on metric
  const getValueColor = () => {
    if (type === 'afpr') return 'text-black';
    if (type === 'tgrm') return 'text-black';
    if (type === 'tss') return 'text-black';
    return 'text-black';
  };
  
  return (
    <div className={`p-3 rounded-md border ${getBgColor()}`}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <span className="text-sm font-medium text-black flex items-center">
            {icon}
            <span className="ml-1">{label}</span>
          </span>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3 w-3 text-black ml-1 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">{descriptions[type]}</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center">
          <p className={`text-xl font-bold ${getValueColor()}`}>{value}</p>
          {trend && (
            <div className="flex items-center ml-2 bg-white px-1.5 py-0.5 rounded-full border" style={{ color: trend.color }}>
              {trend.icon}
              <span className="text-xs ml-1 font-medium">{trend.value}</span>
            </div>
          )}
        </div>
      </div>
      <CustomProgress value={progressPercentage} className="h-2.5" indicatorColor={progressColor} />
    </div>
  );
};

// Component to display a grid point card (top or weakest)
const GridPointCard = ({ 
  node, 
  type,
  onZoom
}: { 
  node: RankingNode; 
  type: 'top' | 'weak';
  onZoom?: (lat: number, lng: number) => void;
}) => {
  // Colors and styles based on type
  const getCardStyle = () => {
    if (type === 'top') {
      return {
        bg: 'bg-green-50',
        border: 'border-l-4 border-green-500',
        iconColor: 'text-green-600',
        rankBg: 'bg-green-100',
        rankText: 'text-green-800'
      };
    } else {
      return {
        bg: 'bg-yellow-50',
        border: 'border-l-4 border-yellow-500',
        iconColor: 'text-yellow-600',
        rankBg: 'bg-yellow-100',
        rankText: 'text-yellow-800'
      };
    }
  };
  
  const style = getCardStyle();
  const icon = type === 'top' 
    ? <TrophyIcon className={`h-4 w-4 ${style.iconColor}`} /> 
    : <AlertTriangleIcon className={`h-4 w-4 ${style.iconColor}`} />;
  
  return (
    <div 
      className={`p-2 rounded-md text-sm flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity ${style.bg} ${style.border}`}
      onClick={() => onZoom && onZoom(node.lat, node.lng)}
    >
      <div className="flex items-center">
        <span className="mr-2">{icon}</span>
        <span className="text-black">Lat: {node.lat.toFixed(4)}, Lng: {node.lng.toFixed(4)}</span>
      </div>
      <span className={`font-bold px-2 py-1 rounded-full text-xs ${style.rankBg} ${style.rankText}`}>
        Rank {node.rank}
      </span>
    </div>
  );
};

// Main component
const EnhancedRankingSummary: React.FC<EnhancedRankingSummaryProps> = ({
  metrics,
  data,
  keyword,
  rankDistribution: propRankDistribution,
  topGridPoints: propTopGridPoints,
  weakestGridPoints: propWeakestGridPoints,
  previousMetrics,
  keywordDifficulty = 45, // Default medium difficulty
  onZoomToArea
}) => {
  // Always use overall view since we removed the toggle
  const view = 'overall';
  
  // Convert metrics to the expected format for component
  const formattedMetrics = {
    afpr: metrics.averageFirstPageRank.toFixed(1),
    tgrm: metrics.gridRankMean.toFixed(1),
    tss: metrics.topSpotShare.toFixed(1) + '%'
  };
  
  // Calculate rank distribution if not provided
  const rankDistribution = propRankDistribution || calculateRankDistribution(data || []);
  
  // Calculate top and weakest grid points if not provided
  const topGridPoints = propTopGridPoints || (data && data.length > 0 ? 
    [...data].sort((a, b) => a.rank - b.rank).slice(0, 3) : []);
    
  const weakestGridPoints = propWeakestGridPoints || (data && data.length > 0 ? 
    [...data].sort((a, b) => b.rank - a.rank).slice(0, 3) : []);
  
  // Prepare data for the donut chart
  const chartData = [
    { name: 'Rank 1-3', value: rankDistribution['1-3'] },
    { name: 'Rank 4-10', value: rankDistribution['4-10'] },
    { name: 'Rank 11-20', value: rankDistribution['11-20'] },
    { name: 'Rank >20', value: rankDistribution['>20'] }
  ];
  
  const COLORS = [colors.positive, colors.warning, colors.negative, colors.neutral];
  
  // Since we removed the "First Page Only" view, we don't need to filter the data
  const filteredChartData = chartData;
    
  // Use all points without filtering since we removed the toggle
  const displayedTopPoints = topGridPoints;
  const displayedWeakPoints = weakestGridPoints;
  
  // Keyword difficulty
  const difficultyInfo = getKeywordDifficultyLabel(keywordDifficulty);
  
  return (
    <Card className="bg-white shadow-sm border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-black flex items-center">
            <BarChart3Icon className="h-5 w-5 text-[#F28C38] mr-2" />
            Ranking Summary
          </CardTitle>
          {/* Removed First Page Only tab as requested */}
        </div>
      </CardHeader>
      <CardContent>
        {/* Main layout with 2 rows */}
        <div className="space-y-6">
          {/* Top row: Metrics and Rank Distribution */}
          <div className="grid grid-cols-4 gap-5">
            {/* Metrics Display - Full width, horizontal layout */}
            <div className="col-span-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-wrap gap-8 justify-between">
                <MetricDisplay 
                  label="AFPR (Avg First Page Rank)" 
                  value={formattedMetrics.afpr} 
                  type="afpr" 
                  icon={<TrophyIcon className="h-4 w-4 mr-1 text-[#F28C38]" />}
                  previousValue={previousMetrics?.afpr}
                />
                <MetricDisplay 
                  label="GRM (Grid Rank Mean)" 
                  value={formattedMetrics.tgrm} 
                  type="tgrm" 
                  icon={<GridIcon className="h-4 w-4 mr-1 text-[#F28C38]" />}
                  previousValue={previousMetrics?.tgrm}
                />
                <MetricDisplay 
                  label="TSS (Top Spot Share)" 
                  value={formattedMetrics.tss} 
                  type="tss" 
                  icon={<StarIcon className="h-4 w-4 mr-1 text-[#F28C38]" />}
                  previousValue={previousMetrics?.tss}
                />
                <div className="flex items-center">
                  <span className="bg-gray-200 text-black px-2 py-1 rounded-md text-xs font-medium">
                    Visibility Score: {metrics.visibilityScore.toFixed(1)}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Second row: 3 columns layout with equal height */}
          <div className="grid grid-cols-12 gap-5">
            {/* Left column: Keyword Difficulty */}
            <div className="col-span-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-black mb-3 text-sm">Keyword Difficulty</h4>
                {/* Removed First Page Only View label */}
              </div>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="flex-1">
                    <CustomProgress 
                      value={keywordDifficulty} 
                      className="h-3" 
                      indicatorColor={difficultyInfo.color}
                    />
                  </div>
                  <div className="ml-3 flex items-center">
                    <span 
                      className="px-2 py-0.5 text-xs rounded-full text-black font-semibold"
                      style={{ backgroundColor: difficultyInfo.color }}
                    >
                      {difficultyInfo.label}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm font-medium">{keywordDifficulty}/100</div>
              </div>
              
              <h4 className="font-semibold text-black mb-3 text-sm border-t pt-3">Rank Distribution</h4>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {filteredChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center text-xs mt-1 gap-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.positive }}></div>
                  <span>Rank 1-3: {rankDistribution['1-3']}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.warning }}></div>
                  <span>Rank 4-10: {rankDistribution['4-10']}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.negative }}></div>
                  <span>Rank 11-20: {rankDistribution['11-20']}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors.neutral }}></div>
                  <span>Rank &gt;20: {rankDistribution['>20']}%</span>
                </div>
              </div>
            </div>
            
            {/* Middle column: Top Areas */}
            <div className="col-span-4 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-black mb-3 text-sm">Top Performing Areas</h4>
              <div className="space-y-2 mb-4">
                {displayedTopPoints.map((node, index) => (
                  <GridPointCard 
                    key={`top-${index}`} 
                    node={node} 
                    type="top"
                    onZoom={onZoomToArea}
                  />
                ))}
                {displayedTopPoints.length === 0 && (
                  <div className="text-center p-3 bg-white rounded border text-sm text-gray-500">
                    No top ranking points available
                  </div>
                )}
              </div>
              
              <h4 className="font-semibold text-black mb-3 text-sm border-t pt-3">Opportunity Areas</h4>
              <div className="space-y-2">
                {displayedWeakPoints.map((node, index) => (
                  <GridPointCard 
                    key={`weak-${index}`} 
                    node={node} 
                    type="weak"
                    onZoom={onZoomToArea}
                  />
                ))}
                {displayedWeakPoints.length === 0 && (
                  <div className="text-center p-3 bg-white rounded border text-sm text-gray-500">
                    No opportunity points available
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column: Recommended Actions */}
            <div className="col-span-5 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-black mb-3 text-sm">Recommended Actions</h4>
              <ul className="space-y-3 text-sm mb-4">
                <li className="flex items-start p-2 rounded border-l-4 border-[#F28C38] bg-orange-50">
                  <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-black">Create location-specific content for opportunity areas to improve rankings</span>
                </li>
                <li className="flex items-start p-2 rounded border-l-4 border-[#F28C38] bg-orange-50">
                  <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-black">Build local backlinks from businesses and directories in weak regions</span>
                </li>
                <li className="flex items-start p-2 rounded border-l-4 border-[#F28C38] bg-orange-50">
                  <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-black">Optimize Google Business Profile with locally relevant attributes and content</span>
                </li>
              </ul>
              
              <h4 className="font-semibold text-black mb-3 text-sm border-t pt-3">Competitor Analysis</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded p-2 border-l-4 border-green-500">
                  <div className="text-sm font-semibold text-black">Top Competitor</div>
                  <div className="text-xs text-black">Fast Fix Plumbing: 65% Rank Share</div>
                </div>
                <div className="bg-white rounded p-2 border-l-4 border-blue-500">
                  <div className="text-sm font-semibold text-black">Most Improved</div>
                  <div className="text-xs text-black">Premier Plumbers Inc: +18%</div>
                </div>
                <div className="bg-white rounded p-2 border-l-4 border-yellow-500">
                  <div className="text-sm font-semibold text-black">Rising Competitor</div>
                  <div className="text-xs text-black">All Hours Plumbing: 14 New Reviews</div>
                </div>
                <div className="bg-white rounded p-2 border-l-4 border-red-500">
                  <div className="text-sm font-semibold text-black">Weakening</div>
                  <div className="text-xs text-black">Pro Pipe Solutions: -5.3 Rank Drop</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedRankingSummary;