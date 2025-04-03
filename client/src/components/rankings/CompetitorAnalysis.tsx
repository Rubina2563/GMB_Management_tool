import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, ComposedChart,
  Area, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BarChartIcon, FilterIcon, StarIcon, LayersIcon, ClockIcon, GlobeIcon, ExternalLinkIcon,
  ChevronUpIcon, ChevronDownIcon, TrendingUpIcon, TrendingDownIcon, XCircleIcon, ArrowUpIcon,
  ArrowDownIcon, ThumbsUpIcon, ThumbsDownIcon, RadarIcon, SearchIcon, LinkIcon, AreaChartIcon,
  LineChartIcon, BookmarkIcon
} from 'lucide-react';
import { CompetitorData, KeywordOverlapData, CompetitorKeywordTrend, CompetitorMetric } from './types';

// Mock data for testing
const yourBusiness = {
  name: 'Your Business',
  rank: 1,
  rankChange: 2,
  visibility: 87,
  keywordOverlap: 100,
  strengths: ['Local Presence', 'High Engagement', 'Review Frequency'],
  weaknesses: ['Content Depth', 'Backlink Profile', 'Photo Variety'],
  reviewCount: 87,
  averageRating: 4.7,
  categories: ['Plumbing Service', 'Emergency Service', 'Water Heater Installation'],
  isOpen: true,
  website: 'yourbusiness.com',
  domainAuthority: 35,
  rankingKeywords: 63
};

const mockCompetitors = [
  {
    name: 'ABC Plumbing Services',
    rank: 2,
    rankChange: -1,
    visibility: 78,
    keywordOverlap: 85,
    strengths: ['Content Strategy', 'Blog Articles', 'Technical SEO'],
    weaknesses: ['Review Volume', 'Review Recency', 'Post Engagement'],
    reviewCount: 52,
    averageRating: 4.3,
    categories: ['Plumbing Service', 'Commercial Plumbing', 'Drain Cleaning'],
    isOpen: true,
    website: 'abcplumbing.com',
    domainAuthority: 42,
    rankingKeywords: 47
  },
  {
    name: 'Premier Plumbing Solutions',
    rank: 3,
    rankChange: 1,
    visibility: 72,
    keywordOverlap: 68,
    strengths: ['Backlink Profile', 'Content Quality', 'Video Content'],
    weaknesses: ['Post Frequency', 'Response Time', 'Mobile Experience'],
    reviewCount: 41,
    averageRating: 4.5,
    categories: ['Plumbing Service', 'Bathroom Remodeling', 'Pipe Repair'],
    isOpen: true,
    website: 'premierplumbing.com',
    domainAuthority: 38,
    rankingKeywords: 39
  },
  {
    name: 'Fast Fix Plumbing Co',
    rank: 4,
    rankChange: 0,
    visibility: 63,
    keywordOverlap: 72,
    strengths: ['Response Time', 'Mobile Experience', 'Local Citations'],
    weaknesses: ['Website Speed', 'Photo Quality', 'Content Depth'],
    reviewCount: 63,
    averageRating: 4.1,
    categories: ['Plumbing Service', 'Emergency Plumbing', 'Leak Repair'],
    isOpen: false,
    website: 'fastfixplumbing.com',
    domainAuthority: 31,
    rankingKeywords: 42
  },
  {
    name: 'Best Local Plumbers',
    rank: 5,
    rankChange: -2,
    visibility: 59,
    keywordOverlap: 65,
    strengths: ['Photo Quality', 'Photo Quantity', 'Service Diversity'],
    weaknesses: ['Website Authority', 'Schema Markup', 'Citation Consistency'],
    reviewCount: 38,
    averageRating: 4.2,
    categories: ['Plumbing Service', 'Water Heater Repair', 'Fixture Installation'],
    isOpen: true,
    website: 'bestlocalplumbers.com',
    domainAuthority: 28,
    rankingKeywords: 35
  }
];

// Mock data for keyword overlap table
const keywordOverlapData = [
  { 
    keyword: 'emergency plumber',
    yourRank: 2,
    competitors: {
      'ABC Plumbing Services': 1,
      'Premier Plumbing Solutions': 3,
      'Fast Fix Plumbing Co': 4,
      'Best Local Plumbers': 7
    }
  },
  { 
    keyword: 'plumbing repair service',
    yourRank: 4,
    competitors: {
      'ABC Plumbing Services': 2,
      'Premier Plumbing Solutions': 5,
      'Fast Fix Plumbing Co': 3,
      'Best Local Plumbers': 8
    }
  },
  { 
    keyword: 'bathroom plumbing',
    yourRank: 1,
    competitors: {
      'ABC Plumbing Services': 3,
      'Premier Plumbing Solutions': 2,
      'Fast Fix Plumbing Co': 5,
      'Best Local Plumbers': 6
    }
  },
  { 
    keyword: 'water heater installation',
    yourRank: 6,
    competitors: {
      'ABC Plumbing Services': 4,
      'Premier Plumbing Solutions': 5,
      'Fast Fix Plumbing Co': 3,
      'Best Local Plumbers': 9
    }
  },
  { 
    keyword: 'leak repair',
    yourRank: 3,
    competitors: {
      'ABC Plumbing Services': 5,
      'Premier Plumbing Solutions': 4,
      'Fast Fix Plumbing Co': 2,
      'Best Local Plumbers': 7
    }
  }
];

// Mock trend data for your business and competitors
const trendData = {
  yourBusiness: [
    { date: '2025-01-01', rank: 3 },
    { date: '2025-01-15', rank: 3 },
    { date: '2025-02-01', rank: 2 },
    { date: '2025-02-15', rank: 2 },
    { date: '2025-03-01', rank: 1 },
    { date: '2025-03-15', rank: 1 }
  ],
  competitors: {
    'ABC Plumbing Services': [
      { date: '2025-01-01', rank: 1 },
      { date: '2025-01-15', rank: 1 },
      { date: '2025-02-01', rank: 1 },
      { date: '2025-02-15', rank: 3 },
      { date: '2025-03-01', rank: 2 },
      { date: '2025-03-15', rank: 2 }
    ],
    'Premier Plumbing Solutions': [
      { date: '2025-01-01', rank: 4 },
      { date: '2025-01-15', rank: 3 },
      { date: '2025-02-01', rank: 3 },
      { date: '2025-02-15', rank: 4 },
      { date: '2025-03-01', rank: 3 },
      { date: '2025-03-15', rank: 3 }
    ],
    'Fast Fix Plumbing Co': [
      { date: '2025-01-01', rank: 2 },
      { date: '2025-01-15', rank: 4 },
      { date: '2025-02-01', rank: 4 },
      { date: '2025-02-15', rank: 5 },
      { date: '2025-03-01', rank: 4 },
      { date: '2025-03-15', rank: 4 }
    ],
    'Best Local Plumbers': [
      { date: '2025-01-01', rank: 5 },
      { date: '2025-01-15', rank: 5 },
      { date: '2025-02-01', rank: 5 },
      { date: '2025-02-15', rank: 6 },
      { date: '2025-03-01', rank: 5 },
      { date: '2025-03-15', rank: 5 }
    ]
  }
};

// Helper function to generate bar chart data
function prepareBarChartData(yourBusiness: any, competitors: any[]) {
  // Normalize data to keep everything on a 0-100 scale
  // Find max values for normalization
  const allBusinesses = [yourBusiness, ...competitors];
  const maxReviewCount = Math.max(...allBusinesses.map(b => b.reviewCount || 0));
  const maxDomainAuthority = Math.max(...allBusinesses.map(b => b.domainAuthority || 0));
  
  const data = [
    {
      name: 'Your Business',
      rank: 100 - yourBusiness.rank * 10, // Invert for visualization (higher is better)
      reviewScore: (yourBusiness.reviewCount / maxReviewCount) * 100, // Normalize to 0-100
      authorityScore: (yourBusiness.domainAuthority / maxDomainAuthority) * 100, // Normalize to 0-100
      isYourBusiness: true
    },
    ...competitors.slice(0, 4).map(comp => ({
      name: comp.name,
      rank: 100 - (comp.rank || 10) * 10, // Invert for visualization (higher is better)
      reviewScore: ((comp.reviewCount || 0) / maxReviewCount) * 100, // Normalize to 0-100
      authorityScore: ((comp.domainAuthority || 0) / maxDomainAuthority) * 100, // Normalize to 0-100
      isYourBusiness: false
    }))
  ];
  
  return data;
}

// Helper function to prepare radar chart data
function prepareRadarData(yourBusiness: any, competitor: any) {
  return [
    {
      subject: 'Search Visibility',
      yourBusiness: yourBusiness.visibility,
      competitor: competitor.visibility
    },
    {
      subject: 'Reviews',
      yourBusiness: yourBusiness.reviewCount ? (yourBusiness.reviewCount > 100 ? 100 : yourBusiness.reviewCount) : 0,
      competitor: competitor.reviewCount ? (competitor.reviewCount > 100 ? 100 : competitor.reviewCount) : 0
    },
    {
      subject: 'Rating',
      yourBusiness: yourBusiness.averageRating ? yourBusiness.averageRating * 20 : 0, // Scale to 0-100
      competitor: competitor.averageRating ? competitor.averageRating * 20 : 0
    },
    {
      subject: 'Domain Authority',
      yourBusiness: yourBusiness.domainAuthority,
      competitor: competitor.domainAuthority
    },
    {
      subject: 'Keyword Coverage',
      yourBusiness: yourBusiness.keywordOverlap,
      competitor: competitor.keywordOverlap
    }
  ];
}

// Helper function to prepare trend line data
function prepareTrendLineData(yourData: any[], competitorData: any[]) {
  const combinedData = [];
  
  for (let i = 0; i < yourData.length; i++) {
    combinedData.push({
      date: yourData[i].date,
      yours: yourData[i].rank,
      competitor: competitorData[i]?.rank || null
    });
  }
  
  return combinedData;
}

// Helper function to determine background color based on rank difference
function getRankDifferenceColor(yourRank: number, competitorRank: number | string) {
  if (competitorRank === '-') return 'transparent';
  
  if (typeof competitorRank === 'string') {
    competitorRank = parseInt(competitorRank);
    if (isNaN(competitorRank)) return 'transparent';
  }
  
  if (yourRank < competitorRank) return 'rgba(40, 167, 69, 0.2)'; // You rank better
  if (yourRank > competitorRank) return 'rgba(230, 57, 70, 0.2)'; // Competitor ranks better
  return '#CCCCCC'; // Same rank
}

interface CompetitorAnalysisProps {
  keyword?: string;
  location?: string;
  gridSize?: number;
  campaignId?: number;
  initialData?: {
    yourBusiness: {
      name: string;
      rank: number;
      overlap: number;
      reviewCount: number;
      averageRating: number;
      categories: string[];
      isOpen: boolean;
      website: string;
      domainAuthority: number;
      rankingKeywords: number;
    };
    competitors: any[]; // Using any[] for simplicity, could be more specifically typed
    keywordOverlaps: any[];
    trendData?: {
      yourBusiness: Array<{ date: string; rank: number }>;
      competitors: Record<string, Array<{ date: string; rank: number }>>;
    };
  };
}

export const CompetitorAnalysis = ({ 
  keyword = 'local plumber',
  location = 'Dallas, TX',
  gridSize = 5,
  campaignId,
  initialData
}: CompetitorAnalysisProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorData | null>(null);
  const [sortBy, setSortBy] = useState<string>('rank');
  // Always use 'overall' view mode since we removed the toggle
  const viewMode = 'overall';
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Sort competitors based on selected criteria
  const sortedCompetitors = [...mockCompetitors].sort((a, b) => {
    switch (sortBy) {
      case 'rank':
        return a.rank - b.rank;
      case 'reviewCount':
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      case 'domainAuthority':
        return (b.domainAuthority || 0) - (a.domainAuthority || 0);
      case 'keywordOverlap':
        return b.keywordOverlap - a.keywordOverlap;
      default:
        return a.rank - b.rank;
    }
  });

  // Prepare chart data
  const barChartData = prepareBarChartData(yourBusiness, sortedCompetitors);
  
  // Prepare radar chart data if a competitor is selected
  const radarData = selectedCompetitor 
    ? prepareRadarData(yourBusiness, selectedCompetitor)
    : [];
    
  // Use data from initialData if provided, otherwise fall back to mock data
  const effectiveTrendData = initialData?.trendData || trendData;
    
  // Prepare trend line data if a competitor is selected
  const trendLineData = selectedCompetitor
    ? prepareTrendLineData(
        effectiveTrendData.yourBusiness,
        // Add type safety for accessing competitors data by name
        selectedCompetitor.name in effectiveTrendData.competitors 
          ? effectiveTrendData.competitors[selectedCompetitor.name as keyof typeof effectiveTrendData.competitors]
          : []
      )
    : [];
  
  // Handle competitor card click
  const handleCompetitorClick = (competitor: CompetitorData) => {
    setSelectedCompetitor(competitor);
    setDialogOpen(true);
  };
  
  return (
    <Card className="border-[#F28C38]/20 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-black font-semibold">Competitor Analysis</CardTitle>
            <CardDescription className="text-black">
              Top competitors for "{keyword}" in {location}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden">
              <FilterIcon className="h-4 w-4 text-black ml-2" />
              <Select defaultValue="rank" onValueChange={setSortBy}>
                <SelectTrigger className="border-0 text-black h-8 w-[180px] focus:ring-0 outline-none bg-white">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="reviewCount">Review Count</SelectItem>
                  <SelectItem value="domainAuthority">Domain Authority</SelectItem>
                  <SelectItem value="keywordOverlap">Keyword Overlap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="bg-[#F28C38] hover:bg-[#E87D2A] text-white">
              <BarChartIcon className="h-4 w-4 mr-1" /> 
              Full Analysis
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-black font-semibold">Business Comparison</h3>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#000000' }} />
                <YAxis 
                  domain={[0, 100]} 
                  label={{ value: 'Score (0-100)', angle: -90, position: 'insideLeft', style: { fill: '#000000' } }} 
                  tick={{ fill: '#000000' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', color: 'black' }}
                  labelStyle={{ color: 'black', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ color: 'black' }} />
                <Bar 
                  dataKey="rank" 
                  name="Rank Score" 
                  fill="#F28C38" 
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.9}
                />
                <Bar 
                  dataKey="reviewScore" 
                  name="Review Score" 
                  fill="#28A745" 
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.9}
                />
                <Bar 
                  dataKey="authorityScore" 
                  name="Authority Score" 
                  fill="#E63946" 
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.9}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {/* Your Business Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col p-4 rounded-lg border-2 border-[#F28C38] bg-orange-50 h-[280px]"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-black text-lg">Your Business</h3>
                  <p className="text-sm mt-1 text-black">
                    Rank: <span className="font-semibold">#{yourBusiness.rank}</span> • 
                    Overlap: <span className="font-semibold">{yourBusiness.keywordOverlap}%</span>
                  </p>
                </div>
                <Badge className="bg-[#F28C38] text-white">You</Badge>
              </div>
              
              <div className="mt-3 space-y-2 flex-grow">
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                  <span className="text-black text-sm">
                    {yourBusiness.reviewCount} reviews • {yourBusiness.averageRating} average rating
                  </span>
                </div>
                <div className="flex items-center">
                  <LayersIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                  <span className="text-black text-sm italic">
                    {yourBusiness.categories.join(', ')}
                  </span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                  <span className="text-black text-sm flex items-center">
                    {yourBusiness.isOpen ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Open Now
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Closed
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <GlobeIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                  <span className="text-black text-sm">
                    Domain Authority: <span className="font-semibold">{yourBusiness.domainAuthority}</span>
                  </span>
                </div>
              </div>
              
              {/* Empty button placeholder for consistent sizing */}
              <div className="h-[38px] mt-2"></div>
            </motion.div>
            
            {/* Competitor Cards */}
            {sortedCompetitors.slice(0, 5).map((competitor, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col p-4 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer h-[280px]"
                onClick={() => handleCompetitorClick(competitor)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-black text-lg">{competitor.name}</h3>
                    <p className="text-sm mt-1 text-black">
                      Rank: <span className="font-semibold">#{competitor.rank}</span> • 
                      Overlap: <span className="font-semibold">{competitor.keywordOverlap}%</span>
                    </p>
                  </div>
                  {competitor.rank <= 3 && (
                    <Badge className="bg-green-500">Top 3</Badge>
                  )}
                </div>
                
                <div className="mt-3 space-y-2 flex-grow">
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                    <span className="text-black text-sm">
                      {competitor.reviewCount} reviews • {competitor.averageRating} average rating
                    </span>
                  </div>
                  <div className="flex items-center">
                    <LayersIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                    <span className="text-black text-sm italic">
                      {competitor.categories?.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                    <span className="text-black text-sm flex items-center">
                      {competitor.isOpen ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Open Now
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Closed
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <GlobeIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                    <span className="text-black text-sm">
                      Domain Authority: <span className="font-semibold">{competitor.domainAuthority}</span>
                    </span>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full bg-white hover:bg-white text-black border border-[#F28C38] hover:bg-[#F28C38]/10 mt-2"
                >
                  <ExternalLinkIcon className="h-3 w-3 mr-1 text-[#F28C38]" />
                  View Profile
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Detailed Competitor Comparison Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-black text-xl flex items-center justify-between">
                <span>Comparison: Your Business vs. {selectedCompetitor?.name}</span>
                <button onClick={() => setDialogOpen(false)} className="text-black hover:text-[#F28C38]">
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </DialogTitle>
              <DialogDescription className="text-black">
                Detailed analysis of how your business compares to {selectedCompetitor?.name} across key metrics.
              </DialogDescription>
            </DialogHeader>
            
            {selectedCompetitor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-black font-semibold mb-3 flex items-center">
                    <RadarIcon className="h-4 w-4 mr-1 text-[#F28C38]" />
                    Performance Radar
                  </h3>
                  <div className="h-[300px] border border-gray-200 p-2 rounded-lg bg-gray-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={90} data={radarData}>
                        <PolarGrid stroke="#ccc" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'black' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Your Business"
                          dataKey="yourBusiness"
                          stroke="#F28C38"
                          fill="#F28C38"
                          fillOpacity={0.5}
                        />
                        <Radar
                          name={selectedCompetitor.name}
                          dataKey="competitor"
                          stroke="#1F2937"
                          fill="#1F2937"
                          fillOpacity={0.3}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <h3 className="text-black font-semibold mt-6 mb-3 flex items-center">
                    <TrendingUpIcon className="h-4 w-4 mr-1 text-[#F28C38]" />
                    Ranking Trends
                  </h3>
                  <div className="h-[250px] border border-gray-200 p-2 rounded-lg bg-gray-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendLineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis dataKey="date" tick={{ fill: 'black' }} />
                        <YAxis reversed domain={[1, 10]} tick={{ fill: 'black' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', color: 'black' }}
                          labelStyle={{ fontWeight: 'bold', color: 'black' }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="yours"
                          name="Your Business"
                          stroke="#F28C38"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#F28C38' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="competitor"
                          name={selectedCompetitor.name}
                          stroke="#1F2937"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#1F2937' }}
                          activeDot={{ r: 6 }}
                        />
                        <ReferenceLine y={3} stroke="green" strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-black font-semibold mb-3 flex items-center">
                    <BarChartIcon className="h-4 w-4 mr-1 text-[#F28C38]" />
                    Key Metrics Comparison
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <StarIcon className="h-5 w-5 text-[#F28C38] mr-2" />
                          <h4 className="text-black font-medium">Reviews</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-[#F28C38]">{yourBusiness.reviewCount}</Badge>
                          <ArrowRightIcon className="h-4 w-4 text-gray-500" />
                          <Badge className={yourBusiness.reviewCount > (selectedCompetitor.reviewCount || 0) ? 'bg-green-500' : 'bg-red-500'}>
                            {selectedCompetitor.reviewCount}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                        <div className="flex h-3 rounded-full">
                          <div
                            className="bg-[#F28C38] rounded-l-full"
                            style={{ width: `${yourBusiness.reviewCount > (selectedCompetitor.reviewCount || 0) ? '65%' : '35%'}` }}
                          ></div>
                          <div
                            className={`${yourBusiness.reviewCount > (selectedCompetitor.reviewCount || 0) ? 'bg-gray-400' : 'bg-red-500'} rounded-r-full`}
                            style={{ width: `${yourBusiness.reviewCount > (selectedCompetitor.reviewCount || 0) ? '35%' : '65%'}` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-black mt-1">
                        {yourBusiness.reviewCount > (selectedCompetitor.reviewCount || 0) 
                          ? `You have ${yourBusiness.reviewCount - (selectedCompetitor.reviewCount || 0)} more reviews than your competitor.` 
                          : `Your competitor has ${(selectedCompetitor.reviewCount || 0) - yourBusiness.reviewCount} more reviews than you.`}
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <GlobeIcon className="h-5 w-5 text-[#F28C38] mr-2" />
                          <h4 className="text-black font-medium">Domain Authority</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-[#F28C38]">{yourBusiness.domainAuthority}</Badge>
                          <ArrowRightIcon className="h-4 w-4 text-gray-500" />
                          <Badge className={yourBusiness.domainAuthority > (selectedCompetitor.domainAuthority || 0) ? 'bg-green-500' : 'bg-red-500'}>
                            {selectedCompetitor.domainAuthority}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                        <div className="flex h-3 rounded-full">
                          <div
                            className="bg-[#F28C38] rounded-l-full"
                            style={{ width: `${yourBusiness.domainAuthority / (yourBusiness.domainAuthority + (selectedCompetitor.domainAuthority || 0)) * 100}%` }}
                          ></div>
                          <div
                            className={`${yourBusiness.domainAuthority > (selectedCompetitor.domainAuthority || 0) ? 'bg-gray-400' : 'bg-red-500'} rounded-r-full`}
                            style={{ width: `${(selectedCompetitor.domainAuthority || 0) / (yourBusiness.domainAuthority + (selectedCompetitor.domainAuthority || 0)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-black mt-1">
                        {yourBusiness.domainAuthority > (selectedCompetitor.domainAuthority || 0)
                          ? `Your domain authority is ${yourBusiness.domainAuthority - (selectedCompetitor.domainAuthority || 0)} points higher.` 
                          : `Your competitor's domain authority is ${(selectedCompetitor.domainAuthority || 0) - yourBusiness.domainAuthority} points higher.`}
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <StarIcon className="h-5 w-5 text-[#F28C38] mr-2" />
                          <h4 className="text-black font-medium">Average Rating</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-[#F28C38]">{yourBusiness.averageRating}</Badge>
                          <ArrowRightIcon className="h-4 w-4 text-gray-500" />
                          <Badge className={yourBusiness.averageRating > (selectedCompetitor.averageRating || 0) ? 'bg-green-500' : 'bg-red-500'}>
                            {selectedCompetitor.averageRating}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                        <div className="flex h-3 rounded-full">
                          <div
                            className="bg-[#F28C38] rounded-l-full"
                            style={{ width: `${(yourBusiness.averageRating / 5) * 100}%` }}
                          ></div>
                          <div
                            className={`${yourBusiness.averageRating > (selectedCompetitor.averageRating || 0) ? 'bg-gray-400' : 'bg-red-500'} rounded-r-full`}
                            style={{ width: `${((selectedCompetitor.averageRating || 0) / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-black mt-1">
                        {yourBusiness.averageRating > (selectedCompetitor.averageRating || 0)
                          ? `Your rating is ${(yourBusiness.averageRating - (selectedCompetitor.averageRating || 0)).toFixed(1)} stars higher.` 
                          : `Your competitor's rating is ${((selectedCompetitor.averageRating || 0) - yourBusiness.averageRating).toFixed(1)} stars higher.`}
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="text-black font-semibold mt-6 mb-3 flex items-center">
                    <BookmarkIcon className="h-4 w-4 mr-1 text-[#F28C38]" />
                    Keyword Rankings Comparison
                  </h3>
                  
                  <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                    <table className="w-full text-sm text-black">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left border-b">Keyword</th>
                          <th className="p-2 text-center border-b">You</th>
                          <th className="p-2 text-center border-b">Competitor</th>
                          <th className="p-2 text-center border-b">Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywordOverlapData.map((keyword, index) => {
                          const competitorRank = keyword.competitors[selectedCompetitor.name as keyof typeof keyword.competitors];
                          const difference = competitorRank ? keyword.yourRank - competitorRank : 0;
                          return (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-2 border-b">{keyword.keyword}</td>
                              <td className="p-2 border-b text-center font-semibold">#{keyword.yourRank}</td>
                              <td className="p-2 border-b text-center">
                                #{competitorRank || '-'}
                              </td>
                              <td className="p-2 border-b text-center">
                                {competitorRank ? (
                                  <span className={difference < 0 ? 'text-green-600' : difference > 0 ? 'text-red-600' : 'text-gray-500'}>
                                    {difference < 0 ? '+' : difference > 0 ? '' : ''}
                                    {Math.abs(difference)}
                                    {difference < 0 ? (
                                      <ChevronUpIcon className="h-3 w-3 inline ml-1" />
                                    ) : difference > 0 ? (
                                      <ChevronDownIcon className="h-3 w-3 inline ml-1" />
                                    ) : null}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex justify-between">
              <Button 
                className="bg-white text-black border border-gray-300 hover:bg-gray-100"
                onClick={() => setDialogOpen(false)}
              >
                Close
              </Button>
              <Button className="bg-[#F28C38] hover:bg-[#E87D2A] text-white">
                <LineChartIcon className="h-4 w-4 mr-1" />
                Export Full Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Arrow right icon component for the comparison section
const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
      clipRule="evenodd"
    />
  </svg>
);

export default CompetitorAnalysis;