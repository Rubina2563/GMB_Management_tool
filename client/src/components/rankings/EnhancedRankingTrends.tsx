import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, TrendingDownIcon, LineChart, BarChart, Activity } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';
import { THEME_COLORS, CompetitorKeywordTrend, TrendTab, TrendDataPoint } from './types';

// Mock data for trend charts
const generateMockTrendData = (keyword: string, startRank: number = 5, months: number = 6) => {
  const data: TrendDataPoint[] = [];
  const now = new Date();
  
  for (let i = months; i >= 0; i--) {
    const date = subMonths(now, i);
    const formattedDate = format(date, 'MMM yyyy');
    
    // Generate a rank between startRank-2 and startRank+2, with a slight trend toward improvement
    const trendFactor = (months - i) / months; // 0 to 1, higher as we get closer to now
    const improvementBias = Math.random() > 0.7 ? -1 : 0; // 30% chance of improvement
    const rankVariation = Math.floor(Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1);
    
    // Calculate rank, making sure it's at least 1
    let rank = Math.max(1, startRank + rankVariation - Math.floor(trendFactor * 2) + improvementBias);
    
    data.push({
      date: formattedDate,
      rank: rank,
      traffic: Math.floor(100 - rank * 10 + Math.random() * 50),
      visibility: Math.floor(100 - rank * 5 + Math.random() * 20)
    });
  }
  
  return {
    keyword,
    data
  };
};

// Mock competitor trend data
const generateCompetitorTrends = (competitors: string[], keyword: string) => {
  return competitors.map(competitor => {
    const startRank = Math.floor(Math.random() * 8) + 2; // Start at position 2-10
    return {
      competitor,
      keyword,
      data: generateMockTrendData(keyword, startRank).data
    };
  });
};

interface EnhancedRankingTrendsProps {
  keyword?: string;
  rank?: number;
  rankChange?: number;
  trendData?: Array<{ date: string; rank: number }>;
  competitors?: string[];
  keywordTrendData?: { keyword: string; dates: string[]; ranks: number[] } | null;
  trendDataSeries?: { keyword: string; dates: string[]; ranks: number[] }[];
  onSelectKeyword?: (keyword: string) => void;
}

/**
 * Enhanced Ranking Trends component with multiple visualizations
 */
const EnhancedRankingTrends: React.FC<EnhancedRankingTrendsProps> = ({
  keyword = 'local plumber',
  rank = 3,
  rankChange = -1,
  competitors = ['ABC Plumbing', 'Best Local Plumbers', 'Fast Fix Plumbing', 'Ultimate Plumbing Co'],
  keywordTrendData = null,
  trendDataSeries = [],
  onSelectKeyword = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<TrendTab>('overview');
  const [activePeriod, setActivePeriod] = useState<'30d' | '90d' | '6m' | '1y'>('6m');
  
  // Generate mock data
  const trendData = generateMockTrendData(keyword, rank).data;
  const competitorTrends: CompetitorKeywordTrend[] = generateCompetitorTrends(competitors, keyword);
  
  // Customize the data for the forecast tab
  const forecastData: TrendDataPoint[] = [...trendData];
  for (let i = 1; i <= 3; i++) {
    // Create future dates
    const lastDate = new Date(trendData[trendData.length - 1].date);
    const futureDate = format(new Date(lastDate.setMonth(lastDate.getMonth() + i)), 'MMM yyyy');
    
    // Predict rank improvements - forecast shows gradual improvement
    const previousRank = forecastData[forecastData.length - 1].rank;
    // More significant improvement for each month
    const projectedRank = Math.max(1, previousRank - (i * 0.5));
    
    forecastData.push({
      date: futureDate,
      rank: projectedRank,
      traffic: Math.floor(100 - projectedRank * 10 + Math.random() * 30),
      visibility: Math.floor(100 - projectedRank * 5 + Math.random() * 15),
      projected: true
    } as TrendDataPoint);
  }
  
  // Format to consistent data structure and reverse Y-axis (rank 1 at top)
  const formattedTrendData = trendData.map((d) => ({
    ...d,
    invRank: 11 - d.rank // Invert rank for chart display (lower is better)
  }));
  
  // Format forecast data similarly
  const formattedForecastData = forecastData.map((d) => ({
    ...d,
    invRank: 11 - d.rank // Invert rank for chart display (lower is better)
  }));
  
  return (
    <Card className="border-[#F28C38]/20 bg-white">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="text-xl text-black font-semibold">Ranking Trends</CardTitle>
            <div className="text-sm text-black mt-0.5">
              <span className="font-medium text-black">Current Rank:</span> {rank}
              {rankChange !== 0 && (
                <span 
                  className={`ml-1.5 inline-flex items-center ${
                    rankChange < 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {rankChange < 0 ? (
                    <>
                      <TrendingUpIcon className="h-3.5 w-3.5 mr-0.5" />
                      <span>+{Math.abs(rankChange)}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDownIcon className="h-3.5 w-3.5 mr-0.5" />
                      <span>-{rankChange}</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex mt-3 sm:mt-0">
            <div className="flex space-x-1 text-xs bg-white border border-black p-1 rounded-md">
              {(['30d', '90d', '6m', '1y'] as const).map((period) => (
                <Button 
                  key={period}
                  size="sm"
                  variant="ghost"
                  className={`px-2 py-1 h-auto text-xs ${
                    activePeriod === period 
                      ? 'bg-[#F28C38] text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                  onClick={() => setActivePeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={(v) => setActiveTab(v as TrendTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">
              <LineChart className="h-4 w-4 mr-1.5" /> 
              Overview
            </TabsTrigger>
            <TabsTrigger value="competitors">
              <BarChart className="h-4 w-4 mr-1.5" /> 
              Competitors
            </TabsTrigger>
            <TabsTrigger value="forecast">
              <Activity className="h-4 w-4 mr-1.5" /> 
              Forecast
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={formattedTrendData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={THEME_COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={THEME_COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      reversed 
                      ticks={[1, 3, 5, 7, 10]} 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                      label={{ 
                        value: 'Rank', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 }
                      }}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'rank') return [value, 'Rank'];
                        if (name === 'traffic') return [value, 'Traffic Score'];
                        if (name === 'visibility') return [value, 'Visibility'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rank" 
                      stroke={THEME_COLORS.primary} 
                      fill="url(#rankGradient)" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: THEME_COLORS.primary, stroke: '#FFF', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: THEME_COLORS.primary, stroke: '#FFF', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-black">
                  <div className="text-sm text-black mb-1">Average Rank</div>
                  <div className="text-xl font-semibold text-black">
                    {(trendData.reduce((sum, item) => sum + item.rank, 0) / trendData.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-black mt-1">
                    For keyword "{keyword}"
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-black">
                  <div className="text-sm text-black mb-1">Ranking Stability</div>
                  <div className="text-xl font-semibold text-black">
                    {Math.round(100 - (
                      trendData.reduce((sum, item, i, arr) => {
                        if (i === 0) return sum;
                        return sum + Math.abs(item.rank - arr[i-1].rank);
                      }, 0) / trendData.length * 10
                    ))}%
                  </div>
                  <div className="text-xs text-black mt-1">
                    Lower fluctuation is better
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-black">
                  <div className="text-sm text-black mb-1">Trend Direction</div>
                  <div className="text-xl font-semibold flex items-center">
                    {trendData[0].rank > trendData[trendData.length - 1].rank ? (
                      <>
                        <TrendingUpIcon className="h-5 w-5 mr-1 text-green-600" />
                        <span className="text-green-600">Improving</span>
                      </>
                    ) : trendData[0].rank < trendData[trendData.length - 1].rank ? (
                      <>
                        <TrendingDownIcon className="h-5 w-5 mr-1 text-red-600" />
                        <span className="text-red-600">Declining</span>
                      </>
                    ) : (
                      <span className="text-black">Stable</span>
                    )}
                  </div>
                  <div className="text-xs text-black mt-1">
                    Based on 6-month data
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="competitors" className="mt-0">
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={trendData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      reversed 
                      ticks={[1, 3, 5, 7, 10]} 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                      label={{ 
                        value: 'Rank', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 }
                      }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => {
                        if (name === 'rank') return [value, 'Your Rank'];
                        if (name.startsWith('competitor')) {
                          const idx = parseInt(name.split('-')[1]);
                          return [value, competitors[idx]];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                    
                    {/* Your business line */}
                    <Line 
                      type="monotone" 
                      dataKey="rank" 
                      name="rank"
                      stroke={THEME_COLORS.primary} 
                      strokeWidth={3}
                      dot={{ r: 3, fill: THEME_COLORS.primary, stroke: '#FFF', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: THEME_COLORS.primary, stroke: '#FFF', strokeWidth: 2 }}
                    />
                    
                    {/* Competitor lines */}
                    {competitorTrends.map((competitor, idx) => (
                      <Line 
                        key={competitor.competitor}
                        type="monotone" 
                        data={competitor.data}
                        dataKey="rank" 
                        name={`competitor-${idx}`}
                        stroke={idx === 0 ? THEME_COLORS.info : 
                               idx === 1 ? THEME_COLORS.success : 
                               idx === 2 ? THEME_COLORS.warning : 
                               THEME_COLORS.neutral}
                        strokeWidth={2}
                        strokeDasharray={idx === 0 ? "" : 
                                        idx === 1 ? "5 5" : 
                                        idx === 2 ? "3 3" : 
                                        "2 2"}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 1 }}
                      />
                    ))}
                    
                    <Legend 
                      formatter={(value: string, entry: any) => {
                        if (value === 'rank') return 'Your Business';
                        if (value.startsWith('competitor')) {
                          const idx = parseInt(value.split('-')[1]);
                          return competitors[idx];
                        }
                        return value;
                      }}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingTop: 10 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-black">
                <h3 className="text-sm font-medium text-black mb-2">Competitors Ranking Summary</h3>
                <div className="space-y-3">
                  {competitorTrends.map((competitor, idx) => {
                    const currentRank = competitor.data[competitor.data.length - 1].rank;
                    const previousRank = competitor.data[0].rank;
                    const hasImproved = previousRank > currentRank;
                    
                    return (
                      <div key={competitor.competitor} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ 
                              backgroundColor: idx === 0 ? THEME_COLORS.info : 
                                              idx === 1 ? THEME_COLORS.success : 
                                              idx === 2 ? THEME_COLORS.warning : 
                                              THEME_COLORS.neutral 
                            }}
                          ></div>
                          <span className="text-sm text-black">{competitor.competitor}</span>
                          {currentRank <= 3 && (
                            <Badge className="ml-2 bg-green-500 hover:bg-green-600 text-white text-xs" variant="outline">
                              Top 3
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2 text-black">#{currentRank}</span>
                          {hasImproved ? (
                            <span className="text-green-600 flex items-center text-xs">
                              <TrendingUpIcon className="h-3 w-3 mr-0.5" />
                              {Math.abs(previousRank - currentRank).toFixed(1)}
                            </span>
                          ) : previousRank < currentRank ? (
                            <span className="text-red-600 flex items-center text-xs">
                              <TrendingDownIcon className="h-3 w-3 mr-0.5" />
                              {Math.abs(previousRank - currentRank).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-black text-xs">No change</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="forecast" className="mt-0">
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={formattedForecastData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      reversed 
                      ticks={[1, 3, 5, 7, 10]} 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                      label={{ 
                        value: 'Rank', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 }
                      }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'rank') return [value, 'Rank'];
                        if (name === 'invRank') return [11 - value, 'Rank'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="rank" 
                      stroke={THEME_COLORS.primary} 
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.projected) {
                          return (
                            <svg x={cx - 5} y={cy - 5} width={10} height={10} fill="none" viewBox="0 0 10 10">
                              <circle cx="5" cy="5" r="4" stroke={THEME_COLORS.primary} strokeWidth="1.5" strokeDasharray="2 2" />
                            </svg>
                          );
                        }
                        return (
                          <svg x={cx - 5} y={cy - 5} width={10} height={10} fill="none" viewBox="0 0 10 10">
                            <circle cx="5" cy="5" r="4" fill="white" stroke={THEME_COLORS.primary} strokeWidth="1.5" />
                          </svg>
                        );
                      }}
                    />
                    
                    {/* Projected data separate line */}
                    <Line 
                      type="monotone" 
                      data={formattedForecastData.filter(d => d.projected)}
                      dataKey="rank" 
                      stroke={THEME_COLORS.primary}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: THEME_COLORS.primary, stroke: '#FFF', strokeWidth: 1 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-black">
                  <h3 className="text-sm font-medium text-black mb-3">Projected Improvements</h3>
                  
                  <div className="space-y-4">
                    {[1, 2, 3].map((month) => {
                      const currentRank = trendData[trendData.length - 1].rank;
                      const projectedRank = Math.max(1, currentRank - (month * 0.5));
                      
                      return (
                        <div key={month} className="flex justify-between items-center">
                          <div className="text-sm text-black">
                            In {month} {month === 1 ? 'month' : 'months'}
                          </div>
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-black">
                              Rank #{projectedRank.toFixed(1)}
                            </div>
                            <div className="flex items-center ml-2 text-green-600 text-xs">
                              <TrendingUpIcon className="h-3 w-3 mr-0.5" />
                              {(currentRank - projectedRank).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-black">
                  <h3 className="text-sm font-medium text-black mb-2">Traffic Forecast</h3>
                  
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart 
                        data={formattedForecastData.filter((d, i) => i >= formattedForecastData.length - 4)}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10, fill: '#6B7280' }}
                          axisLine={{ stroke: '#E5E7EB' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: '#6B7280' }}
                          axisLine={{ stroke: '#E5E7EB' }}
                          tickLine={false}
                          orientation="right"
                          label={{
                            value: 'Traffic',
                            angle: 90,
                            position: 'insideRight',
                            style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 10 }
                          }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value}`, 'Traffic Score']}
                          contentStyle={{ 
                            backgroundColor: '#FFF', 
                            border: '1px solid #E5E7EB',
                            borderRadius: '0.375rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                          }}
                        />
                        <Bar 
                          dataKey="traffic" 
                          fill={THEME_COLORS.primary}
                          fillOpacity={0.8}
                          radius={[4, 4, 0, 0]}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="text-xs text-black mt-3 flex justify-center space-x-4">
                    <span className="flex items-center">
                      <span className="w-3 h-3 inline-block mr-1" style={{backgroundColor: THEME_COLORS.primary}}></span>
                      Traffic Score
                    </span>
                    <span className="flex items-center">
                      <span className="w-3 h-3 inline-block mr-1" style={{backgroundColor: THEME_COLORS.secondary}}></span>
                      Projected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedRankingTrends;