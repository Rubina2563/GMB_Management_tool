import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  MapIcon, 
  TrendingUpIcon, 
  UsersIcon, 
  SearchIcon, 
  ArrowRightIcon,
  ChevronRightIcon,
  InfoIcon, 
  ZoomInIcon,
  PlusCircleIcon,
  BellIcon,
  FolderIcon,
  BarChart3Icon,
  CalendarIcon,
  ListChecksIcon,
  SettingsIcon
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CampaignStatus, 
  GeoGridShape, 
  UpdateFrequency 
} from "@shared/schema";

// Types for campaign management
interface GridCell {
  id: number;
  lat: number;
  lng: number;
  rank: number;
  searchVolume: number;
  rankChange: number;
  competitors: string[];
}

interface Campaign {
  id: number;
  name: string;
  status: CampaignStatus;
  lastUpdated: string;
  locations: number;
  keywords: number;
  progress: number;
  geo_grid_size: number;
  distance: number;
  shape: GeoGridShape;
  update_frequency: UpdateFrequency;
}

interface CampaignKeyword {
  id: number;
  keyword: string;
  is_primary: boolean;
  tag: string;
  volume: number;
  difficulty: number;
  rank: number;
  rankChange: number;
}

// Mock data for campaigns
const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: "Local SEO Campaign - Los Angeles",
    status: "active",
    lastUpdated: "2025-03-10",
    locations: 3,
    keywords: 12,
    progress: 78,
    geo_grid_size: 7,
    distance: 1,
    shape: "square",
    update_frequency: "weekly"
  },
  {
    id: 2,
    name: "Competitor Analysis - West Coast",
    status: "paused",
    lastUpdated: "2025-03-05",
    locations: 5,
    keywords: 24,
    progress: 45,
    geo_grid_size: 5,
    distance: 2,
    shape: "circular",
    update_frequency: "monthly"
  },
  {
    id: 3,
    name: "Local Service Keywords",
    status: "active",
    lastUpdated: "2025-03-12",
    locations: 1,
    keywords: 8,
    progress: 92,
    geo_grid_size: 9,
    distance: 0.5,
    shape: "square",
    update_frequency: "weekly"
  }
];

// Mock data for campaign keywords
const mockCampaignKeywords: CampaignKeyword[] = [
  { id: 1, keyword: "local business", is_primary: true, tag: "service", volume: 1800, difficulty: 4, rank: 2, rankChange: 1 },
  { id: 2, keyword: "near me", is_primary: true, tag: "location", volume: 2400, difficulty: 7, rank: 3, rankChange: -1 },
  { id: 3, keyword: "best service", is_primary: false, tag: "quality", volume: 1200, difficulty: 5, rank: 5, rankChange: 2 },
  { id: 4, keyword: "professional experts", is_primary: false, tag: "service", volume: 980, difficulty: 4, rank: 4, rankChange: 0 },
  { id: 5, keyword: "affordable service", is_primary: false, tag: "pricing", volume: 1500, difficulty: 6, rank: 7, rankChange: 3 }
];

// Create a 5x5 grid of mock data
const mockGeoGridData: GridCell[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  lat: 34.0522 + (Math.random() * 0.1 - 0.05),
  lng: -118.2437 + (Math.random() * 0.1 - 0.05),
  rank: Math.floor(Math.random() * 10) + 1,
  searchVolume: Math.floor(Math.random() * 1000) + 100,
  rankChange: Math.floor(Math.random() * 5) - 2,
  competitors: [
    "Competitor A",
    "Competitor B",
    "Competitor C"
  ].slice(0, Math.floor(Math.random() * 3) + 1)
}));

// Mock trends data
const mockTrendsData = {
  keywords: ["local business", "near me", "service", "professional", "expert"],
  dates: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  ranks: [
    [3, 4, 3, 2, 1, 1],  // local business
    [5, 4, 4, 3, 3, 2],  // near me
    [7, 6, 6, 5, 4, 3],  // service
    [9, 8, 7, 6, 5, 4],  // professional
    [12, 10, 9, 8, 7, 6] // expert
  ]
};

// Mock competitor data
const mockCompetitorData = [
  { name: "Competitor A", overallRank: 2, keywordOverlap: 78, rankingKeywords: 94 },
  { name: "Competitor B", overallRank: 3, keywordOverlap: 65, rankingKeywords: 82 },
  { name: "Competitor C", overallRank: 5, keywordOverlap: 55, rankingKeywords: 68 },
  { name: "Competitor D", overallRank: 7, keywordOverlap: 40, rankingKeywords: 51 }
];

export default function CampaignsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [keyword, setKeyword] = useState("local business");
  const [location, setLocation] = useState("Los Angeles");
  const [radius, setRadius] = useState("10");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    locations: [] as string[],
    keywords: [] as string[],
    geo_grid_size: 7,
    distance: 1,
    shape: "square" as GeoGridShape,
    update_frequency: "weekly" as UpdateFrequency,
    email_notifications: true
  });

  // Fetch campaigns data from the backend API
  const { data: campaignsResponse, isLoading: isLoadingCampaigns, isError: isErrorCampaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: getQueryFn<any>({
      on401: "throw"
    })
  });
  
  // Extract the campaigns from the response
  const campaignsData = campaignsResponse?.campaigns || [];

  // Fetch geo-grid rankings data from the backend API
  const { data: geoGridData, isLoading, isError, refetch: refetchGeoGrid } = useQuery({
    queryKey: [`/api/campaigns/geo-grid?campaignId=${selectedCampaign?.id}&keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&radius=${radius}`],
    queryFn: getQueryFn<any>({
      on401: "throw"
    }),
    enabled: !!selectedCampaign && keyword.length > 0 && location.length > 0
  });

  // Fetch campaign keywords
  const { data: keywordsResponse, isLoading: isLoadingKeywords, isError: isErrorKeywords } = useQuery({
    queryKey: ["/api/campaigns/keywords", selectedCampaign?.id],
    queryFn: getQueryFn<any>({
      on401: "throw"
    }),
    enabled: !!selectedCampaign,
  });
  
  // Extract keywords from the response
  const campaignKeywords = keywordsResponse?.keywords || [];

  const handleRunAnalysis = () => {
    toast({
      title: "Campaign Analysis Running",
      description: `Analyzing rankings for "${keyword}" in ${location} (${radius} mile radius)`,
    });
    
    // Trigger a refetch of the geo-grid data
    refetchGeoGrid();
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setActiveTab("campaign-detail");
  };

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: typeof newCampaign) => {
      const response = await apiRequest('/api/campaigns', 'POST', {
        name: campaignData.name,
        status: 'active' as CampaignStatus,
        geo_grid_size: campaignData.geo_grid_size,
        distance: campaignData.distance,
        shape: campaignData.shape,
        update_frequency: campaignData.update_frequency,
        email_notifications: campaignData.email_notifications,
        credit_cost: 10 // Default credit cost
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: `New campaign "${newCampaign.name}" has been created successfully`,
      });
      
      // Reset form
      setNewCampaign({
        name: "",
        locations: [],
        keywords: [],
        geo_grid_size: 7,
        distance: 1,
        shape: "square",
        update_frequency: "weekly",
        email_notifications: true
      });
      
      // Close dialog
      setIsCreateDialogOpen(false);
      
      // Refresh campaigns list
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate(newCampaign);
  };

  // Group grid cells into rows for the grid display
  const gridRows = geoGridData && Array.isArray(geoGridData) 
    ? Array.from({ length: 5 }, (_, rowIndex) => 
        geoGridData.slice(rowIndex * 5, rowIndex * 5 + 5)
      )
    : [];

  return (
    <div className="w-full pl-[70px] pr-[150px] py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black flex items-center font-['Montserrat']">
              <FolderIcon className="h-6 w-6 text-[#F28C38] mr-2" />
              Campaign Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage your SEO campaigns for better local visibility
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="campaigns">
              <FolderIcon className="h-4 w-4 mr-2" />
              All Campaigns
            </TabsTrigger>
            {selectedCampaign && (
              <TabsTrigger value="campaign-detail">
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Campaign Detail
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Campaigns List Tab */}
        <TabsContent value="campaigns">
          <Card className="bg-white">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold text-black flex items-center font-['Montserrat']">
                    <FolderIcon className="h-5 w-5 text-[#F28C38] mr-2" />
                    Your Campaigns
                  </CardTitle>
                  <CardDescription className="text-black">
                    Manage and analyze your SEO campaigns
                  </CardDescription>
                </div>
                <Link href="/client/campaigns/setup">
                  <Button 
                    className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white flex items-center"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </Link>

              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoadingCampaigns ? (
                  <div className="col-span-3 flex justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    >
                      <FolderIcon className="h-12 w-12 text-[#F28C38]" />
                    </motion.div>
                  </div>
                ) : isErrorCampaigns ? (
                  <div className="col-span-3 text-center py-12">
                    <p className="text-red-500 mb-2">Error loading campaigns</p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="mx-auto"
                    >
                      Retry
                    </Button>
                  </div>
                ) : campaignsData && Array.isArray(campaignsData) && campaignsData.length > 0 ? (
                  <>
                    {campaignsData.map((campaign: Campaign) => (
                      <Card key={campaign.id} className="border border-[#F28C38]/30 hover:border-[#F28C38] transition-colors bg-white">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg text-black">
                              {campaign.name}
                            </CardTitle>
                            <Badge className={`
                              ${campaign.status === 'active' ? 'bg-green-100 text-green-800' : 
                                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-blue-100 text-blue-800'}
                            `}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Badge>
                          </div>
                          <CardDescription>
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span>Last updated: {campaign.lastUpdated}</span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                            <div className="bg-white p-2 rounded flex flex-col items-center">
                              <span className="text-gray-600">Locations</span>
                              <span className="font-bold text-black">{campaign.locations}</span>
                            </div>
                            <div className="bg-white p-2 rounded flex flex-col items-center">
                              <span className="text-gray-600">Keywords</span>
                              <span className="font-bold text-black">{campaign.keywords}</span>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-gray-600 mb-1">Campaign Progress</p>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#6B5B95]" 
                                  style={{ width: `${campaign.progress}%` }}
                                >
                                </div>
                              </div>
                              <p className="text-xs text-right mt-1">{campaign.progress}%</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Grid Configuration:</span> {campaign.geo_grid_size}x{campaign.geo_grid_size} {campaign.shape}, {campaign.distance} miles, {campaign.update_frequency} updates
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                          <Button variant="outline" size="sm" className="text-sm text-black border-[#F28C38]">
                            <SettingsIcon className="h-3.5 w-3.5 mr-1" />
                            Settings
                          </Button>
                          <Button 
                            className="text-sm bg-[#F28C38] hover:bg-[#F28C38]/80 text-white"
                            size="sm"
                            onClick={() => handleCampaignSelect(campaign)}
                          >
                            View Results
                            <ArrowRightIcon className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </>
                ) : (
                  <div className="col-span-3 text-center py-12 bg-white rounded-lg">
                    <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-6">Create your first campaign to start tracking local rankings</p>
                    <Link href="/client/campaigns/setup">
                      <Button 
                        className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white"
                      >
                        <PlusCircleIcon className="h-4 w-4 mr-2" />
                        Create First Campaign
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaign Detail Tab */}
        <TabsContent value="campaign-detail">
          {selectedCampaign && (
            <Card className="bg-white">
              <CardHeader className="pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-black flex items-center font-['Montserrat']">
                      <FolderIcon className="h-5 w-5 text-[#F28C38] mr-2" />
                      {selectedCampaign.name}
                    </CardTitle>
                    <CardDescription className="text-black">
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge className={`
                          ${selectedCampaign.status === 'active' ? 'bg-green-100 text-green-800' : 
                            selectedCampaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-blue-100 text-blue-800'}
                        `}>
                          {selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1)}
                        </Badge>
                        <div className="flex items-center text-sm space-x-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>Last updated: {selectedCampaign.lastUpdated}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      className="text-black border-[#F28C38]"
                      size="sm"
                    >
                      <SettingsIcon className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button 
                      className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white"
                      size="sm"
                    >
                      <BellIcon className="h-4 w-4 mr-1" />
                      Schedule Update
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="keywords" className="w-full">
                  <TabsList className="w-full justify-start mb-6">
                    <TabsTrigger value="keywords">
                      <SearchIcon className="h-4 w-4 mr-1" />
                      Keywords
                    </TabsTrigger>
                    <TabsTrigger value="geo-grid">
                      <MapIcon className="h-4 w-4 mr-1" />
                      Geo-Grid
                    </TabsTrigger>
                    <TabsTrigger value="competitors">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      Competitors
                    </TabsTrigger>
                    <TabsTrigger value="trends">
                      <TrendingUpIcon className="h-4 w-4 mr-1" />
                      Trends
                    </TabsTrigger>
                  </TabsList>

                  {/* Keywords Tab */}
                  <TabsContent value="keywords">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <div className="bg-white rounded-lg p-6 border border-[#F28C38]/30">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-black">Campaign Keywords</h3>
                            <Button size="sm" className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white text-xs h-8">
                              <PlusCircleIcon className="h-3.5 w-3.5 mr-1" />
                              Add Keywords
                            </Button>
                          </div>
                          
                          {isLoadingKeywords ? (
                            <div className="flex justify-center py-8">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                              >
                                <SearchIcon className="h-8 w-8 text-[#F28C38]" />
                              </motion.div>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left pb-2 text-black font-medium">Keyword</th>
                                    <th className="text-center pb-2 text-black font-medium">Rank</th>
                                    <th className="text-center pb-2 text-black font-medium">Change</th>
                                    <th className="text-center pb-2 text-black font-medium">Volume</th>
                                    <th className="text-center pb-2 text-black font-medium">Difficulty</th>
                                    <th className="text-center pb-2 text-black font-medium">Primary</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {campaignKeywords?.map((keyword: CampaignKeyword) => (
                                    <tr key={keyword.id} className="border-b border-gray-200 hover:bg-white/60 transition-colors">
                                      <td className="py-3">
                                        <div className="flex items-center">
                                          <SearchIcon className="h-3.5 w-3.5 text-[#F28C38] mr-2" />
                                          <span className="font-medium">{keyword.keyword}</span>
                                          <Badge className="ml-2 bg-gray-100 text-gray-800 text-xs">{keyword.tag}</Badge>
                                        </div>
                                      </td>
                                      <td className="py-3 text-center font-medium">{keyword.rank}</td>
                                      <td className="py-3 text-center">
                                        <span className={`font-medium ${keyword.rankChange > 0 ? 'text-green-600' : keyword.rankChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                          {keyword.rankChange > 0 ? '+' : ''}{keyword.rankChange}
                                        </span>
                                      </td>
                                      <td className="py-3 text-center">{keyword.volume}</td>
                                      <td className="py-3 text-center">
                                        <div className="inline-flex items-center">
                                          <span>{keyword.difficulty}</span>
                                          <div className="w-16 h-2 bg-gray-200 rounded-full ml-2 overflow-hidden">
                                            <div 
                                              className={`h-full ${keyword.difficulty <= 3 ? 'bg-green-500' : keyword.difficulty <= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                              style={{ width: `${(keyword.difficulty / 10) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 text-center">
                                        {keyword.is_primary ? (
                                          <Badge variant="outline" className="bg-[#006039]/10 text-black border-[#F28C38]/20">Primary</Badge>
                                        ) : (
                                          <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Secondary</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <Card className="border border-[#F28C38]/30/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold text-black">Keyword Stats</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm text-gray-600">Average Position</label>
                                  <span className="text-sm font-medium text-[#F28C38]">3.4</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#6B5B95]" style={{ width: '66%' }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm text-gray-600">Keyword Distribution</label>
                                </div>
                                <div className="flex text-xs text-center">
                                  <div className="w-1/3 px-1">
                                    <div className="h-16 relative">
                                      <div className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t-sm" style={{ height: '60%' }}></div>
                                    </div>
                                    <p className="mt-1">Pos 1-3</p>
                                    <p className="font-bold">60%</p>
                                  </div>
                                  <div className="w-1/3 px-1">
                                    <div className="h-16 relative">
                                      <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 rounded-t-sm" style={{ height: '30%' }}></div>
                                    </div>
                                    <p className="mt-1">Pos 4-10</p>
                                    <p className="font-bold">30%</p>
                                  </div>
                                  <div className="w-1/3 px-1">
                                    <div className="h-16 relative">
                                      <div className="absolute bottom-0 left-0 right-0 bg-red-500 rounded-t-sm" style={{ height: '10%' }}></div>
                                    </div>
                                    <p className="mt-1">Pos 11+</p>
                                    <p className="font-bold">10%</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm text-gray-600">Volume Coverage</label>
                                  <span className="text-sm font-medium text-[#F28C38]">7,880</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#6B5B95]" style={{ width: '78%' }}></div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-[#F28C38]/30/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold text-black">Recommended Actions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              <li className="flex items-start">
                                <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">Add more location-specific keywords</span>
                              </li>
                              <li className="flex items-start">
                                <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">Optimize content for "professional services"</span>
                              </li>
                              <li className="flex items-start">
                                <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">Create supporting pages for high-difficulty keywords</span>
                              </li>
                            </ul>
                            <Button 
                              className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white w-full mt-4"
                            >
                              <ListChecksIcon className="h-4 w-4 mr-2" />
                              Generate Action Plan
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Geo-Grid Tab */}
                  <TabsContent value="geo-grid">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-black mb-4">Analysis Parameters</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="keyword">Target Keyword</Label>
                            <div className="relative">
                              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                              <Input 
                                id="keyword" 
                                placeholder="e.g. plumber near me"
                                className="pl-8"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Target Location</Label>
                            <Input 
                              id="location"
                              placeholder="e.g. Los Angeles"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="radius">Grid Radius (miles)</Label>
                            <Select value={radius} onValueChange={setRadius}>
                              <SelectTrigger id="radius">
                                <SelectValue placeholder="Select radius" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 miles</SelectItem>
                                <SelectItem value="10">10 miles</SelectItem>
                                <SelectItem value="15">15 miles</SelectItem>
                                <SelectItem value="20">20 miles</SelectItem>
                                <SelectItem value="25">25 miles</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white w-full mt-4"
                            onClick={handleRunAnalysis}
                          >
                            Run Geo-Grid Analysis
                          </Button>
                        </div>

                        <div className="mt-6">
                          <h3 className="text-lg font-semibold text-black mb-3">Grid Configuration</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-black">Grid Size:</span>
                              <span>{selectedCampaign.geo_grid_size}x{selectedCampaign.geo_grid_size}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black">Shape:</span>
                              <span>{selectedCampaign.shape.charAt(0).toUpperCase() + selectedCampaign.shape.slice(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black">Distance:</span>
                              <span>{selectedCampaign.distance} miles</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black">Updates:</span>
                              <span>{selectedCampaign.update_frequency.charAt(0).toUpperCase() + selectedCampaign.update_frequency.slice(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <div className="mb-4 flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-black">Ranking Distribution</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="w-3 h-3 inline-block bg-green-500 rounded-full"></span>
                            <span className="text-black mr-3">Rank 1-3</span>
                            <span className="w-3 h-3 inline-block bg-yellow-500 rounded-full"></span>
                            <span className="text-black mr-3">Rank 4-7</span>
                            <span className="w-3 h-3 inline-block bg-red-500 rounded-full"></span>
                            <span className="text-black">Rank 8+</span>
                          </div>
                        </div>

                        {isLoading ? (
                          <div className="h-80 flex items-center justify-center bg-white rounded-lg border border-[#F28C38]/30">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            >
                              <MapIcon className="h-12 w-12 text-[#F28C38]" />
                            </motion.div>
                          </div>
                        ) : isError ? (
                          <div className="h-80 flex items-center justify-center bg-white rounded-lg border border-red-200">
                            <p className="text-red-500">Error loading geo-grid data</p>
                          </div>
                        ) : (
                          <div className="p-4 bg-white rounded-lg border border-[#F28C38]/30 relative">
                            <div className="grid grid-cols-5 gap-2 w-full">
                              {gridRows.map((row, rowIndex) => (
                                <div key={rowIndex} className="contents">
                                  {row.map((cell) => (
                                    <motion.div
                                      key={cell.id}
                                      className={`
                                        aspect-square relative flex items-center justify-center 
                                        ${cell.rank <= 3 ? 'bg-green-100' : cell.rank <= 7 ? 'bg-yellow-100' : 'bg-red-100'}
                                        rounded border border-[#c9c08f] cursor-pointer
                                      `}
                                      whileHover={{ scale: 1.05, zIndex: 10 }}
                                      onHoverStart={() => setHoveredCell(cell)}
                                      onHoverEnd={() => setHoveredCell(null)}
                                    >
                                      <span className="text-lg font-bold text-black">{cell.rank}</span>
                                    </motion.div>
                                  ))}
                                </div>
                              ))}
                            </div>
                            
                            {/* Hover detail card */}
                            {hoveredCell && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg p-3 z-20 w-64"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-black">Grid Position Details</h4>
                                  <ZoomInIcon className="h-4 w-4 text-[#F28C38]" />
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-black">Ranking Position:</span>
                                    <span className="font-semibold">{hoveredCell.rank}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-black">Coordinates:</span>
                                    <span>{hoveredCell.lat.toFixed(4)}, {hoveredCell.lng.toFixed(4)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-black">Search Volume:</span>
                                    <span>{hoveredCell.searchVolume}/mo</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-black">Rank Change:</span>
                                    <span className={`font-semibold ${hoveredCell.rankChange > 0 ? 'text-green-600' : hoveredCell.rankChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                      {hoveredCell.rankChange > 0 ? '+' : ''}{hoveredCell.rankChange}
                                    </span>
                                  </div>
                                  <div className="pt-1">
                                    <span className="text-black block mb-1">Top Competitors:</span>
                                    <div className="space-y-1">
                                      {hoveredCell.competitors.map((comp, i) => (
                                        <div key={i} className="flex items-center text-xs">
                                          <ChevronRightIcon className="h-3 w-3 text-[#F28C38] mr-1" />
                                          <span>{comp}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center">
                            <InfoIcon className="h-4 w-4 text-[#F28C38] mr-2" />
                            <span className="text-sm text-black">Hover over grid cells to see detailed information</span>
                          </div>
                          <Button 
                            variant="outline" 
                            className="text-black border-[#F28C38] hover:bg-[#006039] hover:text-white"
                          >
                            Export Data
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Other tabs content would go here (Competitors, Trends) */}
                  <TabsContent value="competitors">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <div className="bg-white rounded-lg p-6 border border-[#F28C38]/30">
                          <h3 className="text-lg font-semibold text-black mb-4">Competitor Comparison</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left pb-3 text-black font-medium">Competitor</th>
                                  <th className="text-center pb-3 text-black font-medium">Ranking Position</th>
                                  <th className="text-center pb-3 text-black font-medium">Keyword Overlap</th>
                                  <th className="text-center pb-3 text-black font-medium">Ranking Keywords</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-gray-200 bg-white/80">
                                  <td className="py-3 text-black font-semibold">Your Business</td>
                                  <td className="py-3 text-center font-medium text-[#F28C38]">1</td>
                                  <td className="py-3 text-center">100%</td>
                                  <td className="py-3 text-center">112</td>
                                </tr>
                                {mockCompetitorData.map((competitor, i) => (
                                  <tr key={i} className="border-b border-gray-200 hover:bg-white/40 transition-colors">
                                    <td className="py-3">{competitor.name}</td>
                                    <td className="py-3 text-center">{competitor.overallRank}</td>
                                    <td className="py-3 text-center">{competitor.keywordOverlap}%</td>
                                    <td className="py-3 text-center">{competitor.rankingKeywords}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white border rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-black mb-3">Competitive Edge</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-sm text-black">Overall Dominance</label>
                                <span className="text-sm font-medium text-[#F28C38]">75%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#6B5B95]" style={{ width: '75%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-sm text-black">Keyword Coverage</label>
                                <span className="text-sm font-medium text-[#F28C38]">62%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#6B5B95]" style={{ width: '62%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-sm text-black">Local Citations</label>
                                <span className="text-sm font-medium text-[#F28C38]">84%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#6B5B95]" style={{ width: '84%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Card className="border border-[#F28C38]/30/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold text-black">Recommended Actions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              <li className="flex items-start">
                                <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">Strengthen content for "service near me" and related terms</span>
                              </li>
                              <li className="flex items-start">
                                <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">Create competitor comparison content</span>
                              </li>
                              <li className="flex items-start">
                                <ArrowRightIcon className="h-4 w-4 text-[#F28C38] mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">Target more location-specific keywords</span>
                              </li>
                            </ul>
                            <Button 
                              className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white w-full mt-4"
                            >
                              Generate Action Plan
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="trends">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <div className="bg-white rounded-lg p-6 border border-[#F28C38]/30">
                          <h3 className="text-lg font-semibold text-black mb-4">Ranking Trends Over Time</h3>
                          <div className="h-[350px] bg-white p-4 rounded-lg">
                            {/* This would normally be a Chart.js or Recharts component */}
                            <div className="h-full flex items-center justify-center">
                              <div className="text-center">
                                <TrendingUpIcon className="h-12 w-12 text-[#F28C38] mx-auto mb-4" />
                                <p className="text-sm text-black">Trend chart visualization would appear here</p>
                                <p className="text-xs text-black mt-2">
                                  (Using Chart.js or Recharts to visualize keyword ranking changes over time)
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Card className="border border-[#F28C38]/30/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold text-black">Trend Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm text-black">Average Movement</label>
                                  <span className="text-sm font-medium text-green-600">+1.8</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500" style={{ width: '70%' }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm text-black">Trending Keywords</label>
                                  <span className="text-sm font-medium text-[#F28C38]">62%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#6B5B95]" style={{ width: '62%' }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm text-black">Volatility Score</label>
                                  <span className="text-sm font-medium text-[#F28C38]">34%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#6B5B95]" style={{ width: '34%' }}></div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="bg-white border rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-black mb-3">Keyword Movers</h3>
                          <div className="space-y-3">
                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                              <h4 className="font-medium text-green-800 mb-1">Top Gainers</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>"local service experts"</span>
                                  <span className="font-semibold text-green-600">+5</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>"professional services"</span>
                                  <span className="font-semibold text-green-600">+3</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                              <h4 className="font-medium text-red-800 mb-1">Top Losers</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>"expert near me"</span>
                                  <span className="font-semibold text-red-600">-2</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>"local business review"</span>
                                  <span className="font-semibold text-red-600">-1</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}