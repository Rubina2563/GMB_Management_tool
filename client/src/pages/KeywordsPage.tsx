import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ChartPieIcon, ChartBarIcon, MagnifyingGlassIcon, ArrowPathIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Type definitions
interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  trend: number[];
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
}

interface KeywordCategory {
  id: string;
  name: string;
  keywords: Keyword[];
  volume: number;
  difficulty: number;
  relevance: number;
}

interface KeywordSuggestion {
  seed_keyword: string;
  keywords: Keyword[];
  categories: KeywordCategory[];
}

interface KeywordSuggestionsResponse {
  success: boolean;
  message: string;
  suggestions: KeywordSuggestion;
}

interface KeywordCategoriesResponse {
  success: boolean;
  message: string;
  categories: KeywordCategory[];
}

interface SearchTrendDataPoint {
  date: string;
  volume: number;
}

interface SearchTrend {
  keyword: string;
  data: SearchTrendDataPoint[];
}

interface SearchTrendResponse {
  success: boolean;
  message: string;
  trends: SearchTrend[];
}

// Intent badge component
const IntentBadge: React.FC<{intent: string}> = ({ intent }) => {
  let color;
  switch (intent) {
    case 'informational':
      color = 'bg-blue-100 text-blue-800';
      break;
    case 'navigational':
      color = 'bg-purple-100 text-purple-800';
      break;
    case 'commercial':
      color = 'bg-yellow-100 text-yellow-800';
      break;
    case 'transactional':
      color = 'bg-green-100 text-green-800';
      break;
    default:
      color = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {intent}
    </span>
  );
};

// Difficulty indicator component
const DifficultyIndicator: React.FC<{difficulty: number}> = ({ difficulty }) => {
  let color = '';
  let label = '';
  
  if (difficulty < 30) {
    color = 'bg-green-500';
    label = 'Easy';
  } else if (difficulty < 60) {
    color = 'bg-yellow-500';
    label = 'Medium';
  } else {
    color = 'bg-red-500';
    label = 'Hard';
  }
  
  return (
    <div className="flex items-center space-x-2">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full`} 
          style={{ width: `${difficulty}%` }}
        />
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
};

// Trend indicator component
const TrendIndicator: React.FC<{trend: number[]}> = ({ trend }) => {
  const latestTrend = trend[trend.length - 1] - trend[0];
  const trendColor = latestTrend > 0 ? 'text-green-500' : latestTrend < 0 ? 'text-red-500' : 'text-gray-500';
  const TrendIcon = latestTrend > 0 ? 
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
    </svg>
    : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.94l3.172-3.172a.75.75 0 011.06 0l3.322 3.322a.75.75 0 11-1.06 1.06L10.53 8.2 7.47 11.26a.75.75 0 01-1.06 0L1.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M7.462 11.11a.75.75 0 01.815.685l.428 4.066a.75.75 0 11-1.494.157l-.427-4.066a.75.75 0 01.678-.843z" clipRule="evenodd" />
      </svg>;
  
  const trendDiff = Math.abs(Math.round(((trend[trend.length - 1] - trend[0]) / trend[0]) * 100));
  
  return (
    <div className={`flex items-center ${trendColor}`}>
      {TrendIcon}
      <span className="ml-1 text-xs">{trendDiff}%</span>
      
      <div className="ml-2 flex h-4">
        {trend.map((value, index) => (
          <div 
            key={index}
            className={`w-1 mx-[1px] ${latestTrend >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ height: `${(value / Math.max(...trend)) * 100}%`, alignSelf: 'flex-end' }}
          />
        ))}
      </div>
    </div>
  );
};

export default function KeywordsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [trendKeyword, setTrendKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('suggestions');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const trendInputRef = useRef<HTMLInputElement>(null);

  // Initialize queries but don't execute them yet
  const {
    data: suggestionsData,
    isLoading: suggestionsLoading,
    error: suggestionsError,
    refetch: refetchSuggestions
  } = useQuery<KeywordSuggestionsResponse>({
    queryKey: ['/api/keywords/suggestions', searchTerm],
    queryFn: async ({ queryKey }) => {
      const [endpoint, param] = queryKey as [string, string | undefined];
      let url = endpoint;
      
      if (param) {
        url = `${endpoint}?keyword=${encodeURIComponent(param)}`;
      }
      
      const res = await apiRequest('GET', url);
      const data = await res.json();
      return data as KeywordSuggestionsResponse;
    },
    enabled: !!searchTerm, // Only run when searchTerm is truthy
  });

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useQuery<KeywordCategoriesResponse>({
    queryKey: ['/api/keywords/categories'],
    queryFn: async ({ queryKey }) => {
      const [endpoint] = queryKey as [string];
      const res = await apiRequest('GET', endpoint);
      const data = await res.json();
      return data as KeywordCategoriesResponse;
    },
    enabled: activeTab === 'categories', // Only run when categories tab is active
  });

  const {
    data: trendsData,
    isLoading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends
  } = useQuery<SearchTrendResponse>({
    queryKey: ['/api/keywords/trends', trendKeyword],
    queryFn: async ({ queryKey }) => {
      const [endpoint, param] = queryKey as [string, string | undefined];
      let url = endpoint;
      
      if (param) {
        url = `${endpoint}?keyword=${encodeURIComponent(param)}`;
      }
      
      const res = await apiRequest('GET', url);
      const data = await res.json();
      return data as SearchTrendResponse;
    },
    enabled: activeTab === 'trends', // Only run when trends tab is active
  });

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputRef.current) {
      setSearchTerm(searchInputRef.current.value);
    }
  };

  // Handle trend search submission
  const handleTrendSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trendInputRef.current) {
      setTrendKeyword(trendInputRef.current.value);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Load data for the selected tab if needed
    if (value === 'categories' && !categoriesData) {
      refetchCategories();
    } else if (value === 'trends' && !trendsData) {
      refetchTrends();
    }
  };

  // Error handling
  useEffect(() => {
    if (suggestionsError) {
      toast({
        title: "Error",
        description: "Failed to fetch keyword suggestions. Please try again.",
        variant: "destructive",
      });
    }
    
    if (categoriesError) {
      toast({
        title: "Error",
        description: "Failed to fetch keyword categories. Please try again.",
        variant: "destructive",
      });
    }
    
    if (trendsError) {
      toast({
        title: "Error",
        description: "Failed to fetch search trends. Please try again.",
        variant: "destructive",
      });
    }
  }, [suggestionsError, categoriesError, trendsError, toast]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[#a37e2c] mb-2">Keyword Research</h1>
      <p className="text-gray-600 mb-6">
        Research keywords, analyze trends, and discover new opportunities for your business.
      </p>

      <Tabs 
        defaultValue="suggestions" 
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <MagnifyingGlassIcon className="h-4 w-4" />
            <span>Keyword Suggestions</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <ChartPieIcon className="h-4 w-4" />
            <span>Category Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <span>Search Trends</span>
          </TabsTrigger>
        </TabsList>

        {/* Keyword Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card className="border border-[#c9c08f]/20">
            <CardHeader>
              <CardTitle className="text-[#006039]">Keyword Suggestions</CardTitle>
              <CardDescription>
                Find new keyword ideas based on a seed keyword
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex mb-6 gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter a seed keyword (e.g., luxury watches)"
                    className="pl-10"
                    ref={searchInputRef}
                    defaultValue={searchTerm}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-[#a37e2c] hover:bg-[#8a6b25]"
                >
                  Search
                </Button>
              </form>

              {suggestionsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : suggestionsData ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Keyword suggestions for "{suggestionsData.suggestions.seed_keyword}"
                  </h3>
                  
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-[#f4f4f2]">
                        <TableRow>
                          <TableHead className="w-[300px]">Keyword</TableHead>
                          <TableHead className="text-right">Search Volume</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead className="text-right">CPC ($)</TableHead>
                          <TableHead>Intent</TableHead>
                          <TableHead>Trend</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestionsData.suggestions.keywords.map((keyword) => (
                          <TableRow key={keyword.id}>
                            <TableCell className="font-medium">{keyword.keyword}</TableCell>
                            <TableCell className="text-right">{keyword.volume.toLocaleString()}</TableCell>
                            <TableCell><DifficultyIndicator difficulty={keyword.difficulty} /></TableCell>
                            <TableCell className="text-right">${keyword.cpc.toFixed(2)}</TableCell>
                            <TableCell><IntentBadge intent={keyword.intent} /></TableCell>
                            <TableCell><TrendIndicator trend={keyword.trend} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No keywords yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter a seed keyword to get suggestions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Analysis Tab */}
        <TabsContent value="categories">
          <Card className="border border-[#c9c08f]/20">
            <CardHeader>
              <CardTitle className="text-[#006039]">Category Analysis</CardTitle>
              <CardDescription>
                View keyword categories and find opportunities by topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : categoriesData ? (
                <div className="space-y-6">
                  {categoriesData.categories.map((category) => (
                    <div key={category.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      <div className="bg-[#f4f4f2] p-4 flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium text-[#006039]">{category.name}</h3>
                          <div className="flex gap-4 text-sm text-gray-500 mt-1">
                            <span>Volume: {category.volume.toLocaleString()}</span>
                            <span>Relevance: {category.relevance}%</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-[#9eca9e]/10 text-[#006039] border-[#006039]/20">
                          {category.keywords.length} keywords
                        </Badge>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {category.keywords.slice(0, 6).map((keyword) => (
                            <div key={keyword.id} className="border rounded p-3 bg-[#f4f4f2]/50">
                              <div className="font-medium text-sm mb-1">{keyword.keyword}</div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{keyword.volume.toLocaleString()} searches</span>
                                <span>CPC: ${keyword.cpc.toFixed(2)}</span>
                              </div>
                              <div className="mt-2">
                                <DifficultyIndicator difficulty={keyword.difficulty} />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {category.keywords.length > 6 && (
                          <div className="mt-3 text-center">
                            <Button variant="outline" size="sm" className="text-[#a37e2c]">
                              View all {category.keywords.length} keywords
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <ChartPieIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No categories available</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Try refreshing or checking your connection
                  </p>
                  <Button
                    onClick={() => refetchCategories()}
                    variant="outline"
                    className="mt-4"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh Categories
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Trends Tab */}
        <TabsContent value="trends">
          <Card className="border border-[#c9c08f]/20">
            <CardHeader>
              <CardTitle className="text-[#006039]">Search Trends</CardTitle>
              <CardDescription>
                Analyze keyword search volume trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrendSearch} className="flex mb-6 gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter a keyword to view trends (e.g., rolex)"
                    className="pl-10"
                    ref={trendInputRef}
                    defaultValue={trendKeyword}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-[#a37e2c] hover:bg-[#8a6b25]"
                >
                  Search
                </Button>
              </form>

              {trendsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : trendsData && trendsData.trends.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">
                      {trendsData.trends.length > 1 
                        ? `Comparing ${trendsData.trends.length} keywords` 
                        : `Trend for "${trendsData.trends[0].keyword}"`}
                    </h3>
                    
                    {trendsData.trends.length > 1 && (
                      <div className="flex items-center space-x-4">
                        {trendsData.trends.map((trend, index) => (
                          <div key={index} className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ 
                                backgroundColor: index === 0 
                                  ? '#a37e2c' 
                                  : index === 1 
                                    ? '#006039' 
                                    : '#9eca9e' 
                              }}
                            />
                            <span className="text-sm">{trend.keyword}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-white h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trendsData.trends[0].data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a37e2c" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#a37e2c" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f2" />
                        <XAxis 
                          dataKey="date" 
                          tick={{fontSize: 12}}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.toLocaleString('default', { month: 'short' })}`;
                          }}
                        />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip 
                          labelFormatter={(value) => `Date: ${value}`}
                          formatter={(value) => [`${value.toLocaleString()} searches`, 'Volume']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#a37e2c" 
                          fillOpacity={1}
                          fill="url(#colorVolume)" 
                        />
                        {trendsData.trends.length > 1 && trendsData.trends.slice(1).map((trend, index) => (
                          <Area
                            key={index}
                            type="monotone"
                            dataKey="volume"
                            stroke={index === 0 ? '#006039' : '#9eca9e'}
                            data={trend.data}
                            fillOpacity={0}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Summary statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {trendsData.trends.map((trend, index) => {
                      const firstValue = trend.data[0].volume;
                      const lastValue = trend.data[trend.data.length - 1].volume;
                      const percentChange = ((lastValue - firstValue) / firstValue) * 100;
                      const isPositive = percentChange >= 0;
                      const avgVolume = Math.round(trend.data.reduce((sum, point) => sum + point.volume, 0) / trend.data.length);

                      return (
                        <Card key={index} className={`border ${index === 0 ? 'border-[#a37e2c]/20' : 'border-gray-200'}`}>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">{trend.keyword}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm text-gray-500">Avg. Monthly Searches</div>
                                <div className="text-2xl font-bold">{avgVolume.toLocaleString()}</div>
                              </div>
                              <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className="ml-1 font-medium text-sm">
                                  {Math.abs(Math.round(percentChange))}%
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <ArrowTrendingUpIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No trend data available</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter a keyword to view search trends
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}