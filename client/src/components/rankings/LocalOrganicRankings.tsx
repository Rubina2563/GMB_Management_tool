import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  Tag,
  TrendingUp,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define types for our data structure
interface KeywordRanking {
  id: number;
  keyword: string;
  tags: string[];
  currentRank: number;
  previousRank: number;
  change: number;
  bestRank: number;
  searchVolume: number;
  cpc: number;
  competition: number;
  lastUpdated: string;
  history: {
    date: string;
    rank: number;
  }[];
}

interface SummaryMetrics {
  totalKeywords: number;
  keywordsUp: number;
  keywordsNoChange: number;
  keywordsDown: number;
  keywordsTop3: number;
  keywordsTop10: number;
  keywordsTop100: number;
  projectValue: string;
}

interface CampaignDetails {
  website: string;
  location: string;
  language: string;
  checkFrequency: string;
}

interface OrganicRankingsResponse {
  campaignDetails: CampaignDetails;
  keywordRankings: KeywordRanking[];
  summaryMetrics: SummaryMetrics;
}

// Component for displaying trend popup
const TrendPopup: React.FC<{ data: { date: string; rank: number }[]; keyword: string }> = ({ data, keyword }) => {
  // Process data for recharts
  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    rank: item.rank
  }));

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg w-full max-w-lg">
      <h3 className="text-lg font-bold text-black mb-2">Ranking Trend for "{keyword}"</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="date" tick={{ fill: '#000000' }} />
            <YAxis tick={{ fill: '#000000' }} reversed domain={['dataMin', 'dataMax']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', color: '#000' }}
              labelStyle={{ fontWeight: 'bold', color: '#000' }}
            />
            <Line
              type="monotone"
              dataKey="rank"
              stroke="#F28C38"
              strokeWidth={2}
              dot={{ fill: '#F28C38', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-sm text-gray-500 mt-2">
        <p>Higher position on the chart indicates better ranking.</p>
      </div>
    </div>
  );
};

// Main component
const LocalOrganicRankings: React.FC<{ campaignId?: number }> = ({ campaignId = 999 }) => {
  // State for filters and sorting
  const [dateRange, setDateRange] = useState<string>('last30days');
  const [sortBy, setSortBy] = useState<string>('currentRank');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [trendPopupOpen, setTrendPopupOpen] = useState<{ [key: number]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Query for fetching organic rankings data
  const {
    data: organicData,
    isLoading,
    isError,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['organicRankings', campaignId, dateRange, sortBy, sortOrder],
    queryFn: async () => {
      const response = await axios.get<{
        success: boolean;
        message: string;
        data: OrganicRankingsResponse;
      }>(`/api/client/local-organic-rankings?campaignId=${campaignId}&dateRange=${dateRange}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      return response.data.data;
    },
    refetchOnWindowFocus: false
  });

  // Handler for trend popup
  const toggleTrendPopup = (keywordId: number) => {
    setTrendPopupOpen(prev => ({
      ...prev,
      [keywordId]: !prev[keywordId]
    }));
  };

  // Handler for selecting keywords (for bulk actions)
  const toggleKeywordSelection = (keywordId: number) => {
    setSelectedKeywords(prev => 
      prev.includes(keywordId) 
        ? prev.filter(id => id !== keywordId) 
        : [...prev, keywordId]
    );
  };

  // Handler for selecting all keywords
  const toggleSelectAll = () => {
    if (organicData && selectedKeywords.length < organicData.keywordRankings.length) {
      setSelectedKeywords(organicData.keywordRankings.map(kw => kw.id));
    } else {
      setSelectedKeywords([]);
    }
  };

  // Filter keywords based on search term
  const filteredKeywords = organicData?.keywordRankings.filter(kw => 
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Render rank change with color coding
  const renderRankChange = (change: number) => {
    if (change === 0) {
      return <span className="text-gray-400">→</span>;
    } else if (change < 0) {
      return <span className="text-green-600">↑{Math.abs(change)}</span>;
    } else {
      return <span className="text-red-600">↓{change}</span>;
    }
  };

  // Render rank with appropriate styling
  const renderRank = (rank: number) => {
    if (rank > 100) {
      return <span>100+</span>;
    }
    
    const rankColor = 
      rank <= 3 ? 'text-green-600 font-bold' :
      rank <= 10 ? 'text-green-500' :
      rank <= 30 ? 'text-orange-500' :
      'text-black';
    
    return <span className={rankColor}>{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-lg">
        <h3 className="font-bold">Error Loading Data</h3>
        <p>{queryError instanceof Error ? queryError.message : "Failed to load organic rankings data"}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!organicData) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        <h3 className="font-bold">No Data Available</h3>
        <p>Select a campaign to view organic rankings data.</p>
      </div>
    );
  }

  // Destructure data
  const { campaignDetails, summaryMetrics } = organicData;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-black">{campaignDetails.website}</h2>
        <p className="text-black">Location: {campaignDetails.location}, Language: {campaignDetails.language}</p>
        <p className="text-sm text-black">Check Frequency: {campaignDetails.checkFrequency}</p>
      </div>

      {/* Summary Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col items-center">
            <div className="text-sm text-black font-medium mb-1">Total Keywords</div>
            <div className="text-2xl font-bold text-black">{summaryMetrics.totalKeywords}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-black font-medium">Keywords Up</div>
                <div className="text-lg font-bold text-green-600">
                  {summaryMetrics.keywordsUp} <span className="text-green-600">↑</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-black font-medium">No Change</div>
                <div className="text-lg font-bold text-gray-400">
                  {summaryMetrics.keywordsNoChange} <span className="text-gray-400">→</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-black font-medium">Keywords Down</div>
                <div className="text-lg font-bold text-red-600">
                  {summaryMetrics.keywordsDown} <span className="text-red-600">↓</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-black font-medium">Top 3</div>
                <div className="text-lg font-bold text-black">{summaryMetrics.keywordsTop3}</div>
              </div>
              <div>
                <div className="text-sm text-black font-medium">Top 10</div>
                <div className="text-lg font-bold text-black">{summaryMetrics.keywordsTop10}</div>
              </div>
              <div>
                <div className="text-sm text-black font-medium">Top 100</div>
                <div className="text-lg font-bold text-black">{summaryMetrics.keywordsTop100}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col items-center">
            <div className="text-sm text-black font-medium mb-1">Monthly Value</div>
            <div className="text-2xl font-bold text-black">${summaryMetrics.projectValue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between space-y-2 md:space-y-0 md:space-x-4 p-4 bg-white rounded-lg border">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 items-start md:items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full md:w-40 text-black">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Date Range</SelectLabel>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40 text-black">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sort By</SelectLabel>
                  <SelectItem value="keyword">Keyword</SelectItem>
                  <SelectItem value="currentRank">Current Rank</SelectItem>
                  <SelectItem value="change">Change</SelectItem>
                  <SelectItem value="searchVolume">Search Volume</SelectItem>
                  <SelectItem value="cpc">CPC</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-black"
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              className="pl-8 text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" className="text-black border-[#F28C38]" onClick={() => {
            setDateRange('last30days');
            setSortBy('currentRank');
            setSortOrder('asc');
            setSearchTerm('');
          }}>
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Keywords Table */}
      <Card className="bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={organicData.keywordRankings.length > 0 && selectedKeywords.length === organicData.keywordRankings.length} 
                      onCheckedChange={toggleSelectAll} 
                    />
                  </TableHead>
                  <TableHead className="font-bold text-black">Keyword</TableHead>
                  <TableHead className="font-bold text-black">Tags</TableHead>
                  <TableHead className="font-bold text-black">Search Index</TableHead>
                  <TableHead className="font-bold text-black">Initial Rank</TableHead>
                  <TableHead className="font-bold text-black">Change</TableHead>
                  <TableHead className="font-bold text-black">Last Rank</TableHead>
                  <TableHead className="font-bold text-black">Best Rank</TableHead>
                  <TableHead className="font-bold text-black">Search Volume</TableHead>
                  <TableHead className="font-bold text-black">CPC</TableHead>
                  <TableHead className="font-bold text-black">Competition</TableHead>
                  <TableHead className="font-bold text-black">Last Updated</TableHead>
                  <TableHead className="font-bold text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-black py-8">
                      No keywords match your search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKeywords.map((keyword) => (
                    <TableRow key={keyword.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedKeywords.includes(keyword.id)}
                          onCheckedChange={() => toggleKeywordSelection(keyword.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-black">
                        {keyword.keyword}
                      </TableCell>
                      <TableCell>
                        {keyword.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 mr-1">
                            {tag}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>{renderRank(keyword.currentRank)}</TableCell>
                      <TableCell className="text-black">{keyword.currentRank > 100 ? '100+' : keyword.currentRank}</TableCell>
                      <TableCell>{renderRankChange(keyword.change)}</TableCell>
                      <TableCell className="text-black">{keyword.previousRank > 100 ? '100+' : keyword.previousRank}</TableCell>
                      <TableCell className="text-black">{keyword.bestRank > 100 ? '100+' : keyword.bestRank}</TableCell>
                      <TableCell className="text-black">{keyword.searchVolume.toLocaleString()}</TableCell>
                      <TableCell className="text-black">${keyword.cpc.toFixed(2)}</TableCell>
                      <TableCell className="text-black">{keyword.competition.toFixed(2)}</TableCell>
                      <TableCell className="text-black">{keyword.lastUpdated}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Popover open={trendPopupOpen[keyword.id]} onOpenChange={() => toggleTrendPopup(keyword.id)}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-[#F28C38]">
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <TrendPopup data={keyword.history} keyword={keyword.keyword} />
                            </PopoverContent>
                          </Popover>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-[#F28C38]"
                            onClick={() => {
                              window.open(`https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}`, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-[#F28C38]"
                            onClick={() => {
                              // Show a modal for adding tags in a real implementation
                              toast({
                                title: "Tag Management",
                                description: "This would open a modal for managing tags for this keyword.",
                              });
                            }}
                          >
                            <Tag className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalOrganicRankings;