import { useState, useEffect, useRef } from "react";
import GoogleMapRankingGrid from "@/components/rankings/GoogleMapRankingGrid";
import EnhancedRankingSummary from "@/components/rankings/EnhancedRankingSummary";
import EnhancedRankingTrends from "@/components/rankings/EnhancedRankingTrends";
import CompetitorAnalysis from "@/components/rankings/CompetitorAnalysis";
import { RankingNode } from "@/components/rankings/types";
import { CustomProgress } from "@/components/rankings/CustomProgress";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCampaignContext } from "@/lib/campaign-context";
import { useToast } from "@/hooks/use-toast";
import {
  SearchIcon,
  ArrowRightIcon,
  InfoIcon,
  BarChart3Icon,
  LineChartIcon,
  UsersIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  TrophyIcon,
  GridIcon,
  StarIcon,
  UserIcon,
  UsersIcon as CompetitorsIcon
} from "lucide-react";

export default function RankingsPage() {
  // State for keyword selection and campaign data
  const [keyword, setKeyword] = useState<string>("");
  const [hoveredCell, setHoveredCell] = useState<RankingNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiSource, setApiSource] = useState<string>("dataforseo");
  
  // Add a map reference for zoom control
  const mapRef = useRef<any>(null);
  
  // Function to zoom to a specific area
  const handleZoomToArea = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(15); // Higher zoom level to focus on the specific area
    }
  };
  
  // State for campaign keywords
  const [campaignKeywords, setCampaignKeywords] = useState<{id: number, keyword: string}[]>([]);
  
  // Grid data state
  const [gridData, setGridData] = useState<RankingNode[]>([]);
  
  // Metrics state
  const [metrics, setMetrics] = useState<{afpr: string, tgrm: string, tss: string}>({
    afpr: "0.0", // Average First Page Rank
    tgrm: "0.0", // Total Grid Rank Mean
    tss: "0%",   // Top Spot Share
  });
  
  // Access campaign context and toast
  const { selectedCampaign, setSelectedCampaign } = useCampaignContext();
  const { toast } = useToast();
  
  // Fetch all keywords for a campaign
  const fetchAllCampaignKeywords = async (campaignId: number) => {
    try {
      // First try the campaign-specific keywords endpoint
      const response = await fetch(`/api/client/campaigns/${campaignId}/keywords`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.keywords) {
          setCampaignKeywords(data.keywords);
          
          // If there are keywords, select the first one by default
          if (data.keywords.length > 0 && (!keyword || keyword === "")) {
            setKeyword(data.keywords[0].keyword);
          }
          return;
        }
      }
      
      // If that fails, try the general rankings keywords endpoint
      console.log("Trying general rankings keywords endpoint...");
      const fallbackResponse = await fetch(`/api/client/rankings/keywords`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.success && data.keywords) {
          setCampaignKeywords(data.keywords);
          
          // If there are keywords, select the first one by default
          if (data.keywords.length > 0 && (!keyword || keyword === "")) {
            setKeyword(data.keywords[0].keyword);
          }
          return;
        }
      }
      
      // If both endpoints fail, use realistic plumbing keywords for demo
      console.log("Using plumbing keyword data for demo...");
      const mockKeywords = [
        { id: 1, keyword: "plumber near me", campaign_id: campaignId },
        { id: 2, keyword: "emergency plumbing service", campaign_id: campaignId },
        { id: 3, keyword: "local plumber", campaign_id: campaignId },
        { id: 4, keyword: "water heater repair", campaign_id: campaignId },
        { id: 5, keyword: "licensed plumbing contractor", campaign_id: campaignId },
        { id: 6, keyword: "bathroom remodeling", campaign_id: campaignId },
        { id: 7, keyword: "24 hour plumber", campaign_id: campaignId },
        { id: 8, keyword: "pipe repair service", campaign_id: campaignId }
      ];
      
      setCampaignKeywords(mockKeywords);
      
      // If no keyword is selected, choose the first one
      if (!keyword || keyword === "") {
        setKeyword(mockKeywords[0].keyword);
      }
      
    } catch (error) {
      console.error("Error fetching all campaign keywords:", error);
      
      // Use realistic plumbing industry-specific keywords
      const mockKeywords = [
        { id: 1, keyword: "plumber near me", campaign_id: selectedCampaign?.id || 999 },
        { id: 2, keyword: "emergency plumbing service", campaign_id: selectedCampaign?.id || 999 },
        { id: 3, keyword: "local plumber", campaign_id: selectedCampaign?.id || 999 },
        { id: 4, keyword: "water heater repair", campaign_id: selectedCampaign?.id || 999 },
        { id: 5, keyword: "licensed plumbing contractor", campaign_id: selectedCampaign?.id || 999 },
        { id: 6, keyword: "bathroom remodeling", campaign_id: selectedCampaign?.id || 999 },
        { id: 7, keyword: "24 hour plumber", campaign_id: selectedCampaign?.id || 999 },
        { id: 8, keyword: "pipe repair service", campaign_id: selectedCampaign?.id || 999 }
      ];
      
      setCampaignKeywords(mockKeywords);
      
      // If no keyword is selected, choose the first one
      if (!keyword || keyword === "") {
        setKeyword(mockKeywords[0].keyword);
      }
    }
  };
  
  // Fetch ranking data for a specific keyword
  const fetchRankingData = async (keywordQuery: string) => {
    if (!keywordQuery) return;
    
    setIsLoading(true);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        keyword: keywordQuery
      });
      
      // Use the rankings endpoint from requirements
      const response = await fetch(`/api/client/rankings?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.gridData) {
          setGridData(data.gridData);
          
          // Update metrics
          setMetrics({
            afpr: data.afpr?.toFixed(1) || "N/A",
            tgrm: data.tgrm?.toFixed(1) || "N/A",
            tss: data.tss ? `${data.tss.toFixed(1)}%` : "N/A"
          });
          
          // Update API source if available
          if (data.apiUsed) {
            setApiSource(data.apiUsed);
          }
          return;
        }
      } 
      
      // Try fallback method
      console.warn("New rankings endpoint failed, falling back to old method");
      const legacySuccess = await fetchGridDataLegacy(keywordQuery);
      
      // If legacy method also failed, generate mock data
      if (!legacySuccess) {
        console.warn("Legacy endpoints also failed, using mock grid data");
        generateMockGridData(keywordQuery);
      }
      
    } catch (error) {
      console.error("Exception fetching ranking data:", error);
      
      // Generate mock data as a last resort
      console.warn("Exception occurred, using mock grid data");
      generateMockGridData(keywordQuery);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate realistic mock grid data for demonstration purposes
  const generateMockGridData = (keywordQuery: string) => {
    console.log("Generating mock grid data for keyword:", keywordQuery);
    
    // Generate a simple hash from the keyword for consistent results
    const hash = keywordQuery.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Define a type for keyword metrics
    type KeywordMetrics = {
      afpr: number;
      tgrm: number;
      tss: number;
    };
    
    // Generate metrics based on the keyword and hash
    // Different keywords should have different metrics
    const keywordDifficulty: Record<string, KeywordMetrics> = {
      "plumber near me": { afpr: 3.2, tgrm: 7.9, tss: 45 },
      "emergency plumbing service": { afpr: 4.7, tgrm: 9.8, tss: 32 },
      "local plumber": { afpr: 2.8, tgrm: 6.5, tss: 58 },
      "water heater repair": { afpr: 3.5, tgrm: 8.2, tss: 41 },
      "licensed plumbing contractor": { afpr: 5.1, tgrm: 11.4, tss: 27 },
      "bathroom remodeling": { afpr: 6.3, tgrm: 12.8, tss: 22 },
      "24 hour plumber": { afpr: 3.9, tgrm: 8.4, tss: 37 },
      "pipe repair service": { afpr: 4.2, tgrm: 9.1, tss: 35 }
    };
    
    // Get metrics for the current keyword or use hash-based defaults
    const metrics = keywordDifficulty[keywordQuery] || {
      afpr: Math.max(1, Math.min(10, 3 + (hash % 5))),
      tgrm: Math.max(1, Math.min(20, 8 + (hash % 9))),
      tss: Math.max(10, Math.min(90, 40 + (hash % 50)))
    };
    
    // Update metrics
    setMetrics({
      afpr: metrics.afpr.toString(),
      tgrm: metrics.tgrm.toString(),
      tss: metrics.tss + '%'
    });
    
    // Generate mock grid data
    const mockNodes: RankingNode[] = [];
    const gridSize = 8; // Larger grid for more detail
    const centerLat = 37.7749;
    const centerLng = -122.4194;
    const spread = 0.015; // Roughly 1.5km between points
    
    // Plumbing competitors for realism
    const competitorNames = [
      "Fast Fix Plumbing",
      "Premier Plumbers Inc",
      "All Hours Plumbing",
      "Reliable Plumbing Co",
      "Pro Pipe Solutions",
      "City Plumbing Service",
      "Modern Plumbing Tech",
      "Speedy Drain Cleaning"
    ];
    
    // Create patterns based on the keyword
    // Some areas will have better rankings than others
    const isEmergencyKeyword = keywordQuery.includes("emergency") || keywordQuery.includes("24 hour");
    const isSpecialtyKeyword = keywordQuery.includes("remodel") || keywordQuery.includes("heater");
    
    // Generate a grid of nodes with realistic variance
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = centerLat + ((i - Math.floor(gridSize/2)) * spread);
        const lng = centerLng + ((j - Math.floor(gridSize/2)) * spread);
        
        // Base the rank on distance from center and the keyword type
        const distFromCenter = Math.sqrt(
          Math.pow(i - Math.floor(gridSize/2), 2) + 
          Math.pow(j - Math.floor(gridSize/2), 2)
        );
        
        // Create areas with good rankings (top left) and poor rankings (bottom right)
        // This creates a more interesting pattern on the map
        const isStrongArea = i < gridSize/2 && j < gridSize/2;
        const isWeakArea = i >= gridSize/2 && j >= gridSize/2;
        
        // Adjust ranking by area and keyword type
        let rankAdjustment = 0;
        if (isStrongArea) rankAdjustment -= 4; // Better rankings
        if (isWeakArea) rankAdjustment += 4;   // Worse rankings
        if (isEmergencyKeyword && i % 2 === 0) rankAdjustment -= 2; // Emergency services rank better in certain areas
        if (isSpecialtyKeyword && j % 2 === 0) rankAdjustment -= 3; // Specialty services rank better in different areas
        
        // Calculate rank (1-20 scale, lower is better)
        // Create some variability but with clear patterns
        const rank = Math.max(1, Math.min(20, 
          Math.round(3 + distFromCenter * 1.5 + (hash % 5) + rankAdjustment)
        ));
        
        // Calculate search volume - higher near center, varies by keyword
        const volumeBase = keywordQuery.includes("near me") ? 800 : 
                          keywordQuery.includes("emergency") ? 600 : 
                          keywordQuery.includes("local") ? 900 : 500;
        
        const searchVolume = Math.round(volumeBase - (distFromCenter * 100) + (hash % 200));
        
        // Random rank change with trends
        // Use hash to ensure consistency per keyword, but create realistic patterns
        const baseChange = ((hash + i + j) % 7) - 3;
        let rankChange = baseChange;
        
        // Trending patterns - improving in strong areas, declining in weak areas
        if (isStrongArea && rank <= 10) rankChange = Math.max(0, rankChange); // Strong areas are improving or stable
        if (isWeakArea && rank > 10) rankChange = Math.min(0, rankChange);    // Weak areas are declining or stable
        
        // Add some outliers for visual interest
        if ((i + j) % 7 === 0) rankChange = (rankChange > 0) ? -2 : 3;
        
        // Generate relevant competitors (3-5 per cell)
        // Different competitors appear in different areas
        const shuffledCompetitors = [...competitorNames].sort(() => 0.5 - Math.random());
        const competitorCount = 3 + ((i + j + hash) % 3);
        const competitors = shuffledCompetitors.slice(0, competitorCount);
        
        mockNodes.push({
          id: i * gridSize + j + 1,
          lat,
          lng,
          rank,
          searchVolume,
          rankChange,
          competitors
        });
      }
    }
    
    setGridData(mockNodes);
    setApiSource("mock-data");  // Indicate we're using mock data
  };
  
  // Legacy method for fetching grid data (for backward compatibility)
  const fetchGridDataLegacy = async (keywordQuery: string): Promise<boolean> => {
    try {
      if (!selectedCampaign) {
        toast({
          title: "No campaign selected",
          description: "Please select a campaign to view rankings.",
          variant: "destructive"
        });
        return false;
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        keyword: keywordQuery,
        businessName: selectedCampaign.name,
        gridSize: (selectedCampaign.geo_grid_size || 5).toString()
      });
      
      // Get the user's API preference for geo-grid rankings
      try {
        const preferenceResponse = await fetch('/api/admin/geo-grid-api/preference', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          }
        });
        
        if (preferenceResponse.ok) {
          const preferenceData = await preferenceResponse.json();
          if (preferenceData.success) {
            const preferredApi = preferenceData.preferredApi;
            setApiSource(preferredApi);
          }
        }
      } catch (error) {
        console.error("Error fetching API preference:", error);
      }

      // Determine endpoint based on API source
      const endpoint = apiSource === "dataforseo" 
        ? "/api/client/dataforseo/local-rankings"
        : "/api/client/gbp-audit/map-rankings";
        
      const response = await fetch(`${endpoint}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const rankingData = data.data;
          
          // Update metrics
          setMetrics({
            afpr: rankingData.afpr ? rankingData.afpr.toFixed(1) : "N/A",
            tgrm: rankingData.tgrm ? rankingData.tgrm.toFixed(1) : "N/A",
            tss: rankingData.tss ? rankingData.tss.toFixed(1) + '%' : "N/A"
          });
          
          // Set grid data
          if (rankingData.gridData && rankingData.gridData.length > 0) {
            setGridData(rankingData.gridData);
            return true;
          }
        }
      }
      
      console.error("Failed to get ranking data from legacy endpoint");
      return false;
    } catch (error) {
      console.error("Error fetching grid data:", error);
      return false;
    }
  };
  
  // Generate mock trend data for a keyword
  const getMockTrendDataForKeyword = (kw: string) => {
    // Simple function to generate consistent mock data based on the keyword
    const hash = kw.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
      keyword: kw,
      dates: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      ranks: [
        Math.max(1, Math.min(20, 10 - (hash % 5))),
        Math.max(1, Math.min(20, 9 - (hash % 5))),
        Math.max(1, Math.min(20, 8 - (hash % 5))),
        Math.max(1, Math.min(20, 7 - (hash % 6))),
        Math.max(1, Math.min(20, 6 - (hash % 6))),
        Math.max(1, Math.min(20, 5 - (hash % 6)))
      ]
    };
  };
  
  // Create a default campaign if no campaign is selected
  useEffect(() => {
    // If we don't have a campaign, create a temporary one for demo purposes
    if (!selectedCampaign) {
      // Make sure the campaign matches the expected type in campaign-context.tsx
      const demoPlumbingCampaign = {
        id: 999,
        name: "Demo Plumbing Campaign",
        status: "active",
        user_id: 1,
        geo_grid_size: 8,
        distance: 10,
        shape: "circular",
        update_frequency: "weekly",
        locations: 3,
        keywords: 8,
        progress: 100,
        lastUpdated: "2025-03-23"
      };
      
      setSelectedCampaign(demoPlumbingCampaign);
      
      // Demo campaign was created, now force a fetch of the keywords
      fetchAllCampaignKeywords(999);
    }
  }, []);
  
  // Load keywords when campaign changes
  useEffect(() => {
    if (selectedCampaign) {
      fetchAllCampaignKeywords(selectedCampaign.id);
    } else {
      setCampaignKeywords([]);
    }
  }, [selectedCampaign]);
  
  // Fetch ranking data when keyword changes
  useEffect(() => {
    if (keyword) {
      fetchRankingData(keyword);
    }
  }, [keyword]);
  
  // Mock data for realistic plumbing competitors
  const mockCompetitorData = [
    { name: "Fast Fix Plumbing", overallRank: 2, keywordOverlap: 78, rankingKeywords: 94 },
    { name: "Premier Plumbers Inc", overallRank: 3, keywordOverlap: 65, rankingKeywords: 82 },
    { name: "All Hours Plumbing", overallRank: 4, keywordOverlap: 58, rankingKeywords: 76 },
    { name: "Reliable Plumbing Co", overallRank: 5, keywordOverlap: 45, rankingKeywords: 63 },
    { name: "Pro Pipe Solutions", overallRank: 7, keywordOverlap: 34, rankingKeywords: 48 }
  ];

  // Calculate trending data for display
  const keywordTrendData = keyword ? getMockTrendDataForKeyword(keyword) : null;
  const trendDataSeries = campaignKeywords.map(kw => getMockTrendDataForKeyword(kw.keyword));

  return (
    <div className="w-full pl-[70px] pr-[150px] py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Map Rankings</h1>
        <p className="text-slate-600">Visualize your rankings on a geographic grid for the selected campaign</p>
      </div>

      {/* API Source Indicator - Small banner at the top */}
      <div className="flex items-center justify-end text-sm mb-4">
        <div className="flex items-center px-3 py-1 rounded-md bg-gray-50 border">
          <span className="text-black mr-2">Data Source:</span>
          <span className="font-medium text-[#006039]">
            {apiSource === "dataforseo" 
              ? "DataForSEO" 
              : apiSource === "mock-data" 
                ? "Mock Data (Demo)" 
                : "Google Places API"}
          </span>
          <div className="ml-2 w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>

      {/* Two Column Layout: Sidebar and Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Left Sidebar - Keyword Selection */}
        <div className="md:col-span-1">
          <Card className="bg-white shadow-sm border h-full min-w-[250px] w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-black flex items-center">
                <SearchIcon className="h-5 w-5 text-[#F28C38] mr-2" />
                Keywords
              </CardTitle>
              <CardDescription>
                Select a keyword to view its ranking grid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCampaign ? (
                <div className="text-center p-4 text-gray-500">
                  <p>No campaign selected</p>
                  <p className="text-sm mt-2">Please select a campaign first</p>
                </div>
              ) : campaignKeywords.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  <p>No keywords in this campaign</p>
                  <Button 
                    variant="outline"
                    className="mt-2 text-[#F28C38] border-[#F28C38] hover:bg-[#F28C38]/10"
                    onClick={() => toast({
                      title: "Campaign Management",
                      description: "Add keywords in the Campaign Management section",
                    })}
                  >
                    Add Keywords
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-1">
                    {campaignKeywords.map((kw) => (
                      <Button
                        key={kw.id}
                        variant="ghost"
                        className={`w-full justify-start text-left font-normal ${
                          keyword === kw.keyword 
                            ? "bg-[#F28C38]/10 text-[#F28C38] font-medium" 
                            : "text-black hover:bg-gray-100"
                        }`}
                        onClick={() => setKeyword(kw.keyword)}
                      >
                        <div className="flex items-center w-full">
                          {keyword === kw.keyword && (
                            <CheckCircle2Icon className="h-4 w-4 mr-2 text-[#F28C38]" />
                          )}
                          {keyword !== kw.keyword && (
                            <div className="w-4 h-4 mr-2" />
                          )}
                          <span className="break-words">{kw.keyword}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              )}
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-black">Campaign Info</h4>
                {selectedCampaign ? (
                  <div className="text-sm space-y-2">
                    <p><span className="text-gray-700 font-medium">Name:</span> <span className="text-black">{selectedCampaign.name}</span></p>
                    <p><span className="text-gray-700 font-medium">Grid Size:</span> <span className="text-black">{selectedCampaign.geo_grid_size}x{selectedCampaign.geo_grid_size}</span></p>
                    <p><span className="text-gray-700 font-medium">Radius:</span> <span className="text-black">{selectedCampaign.distance} miles</span></p>
                    <p><span className="text-gray-700 font-medium">Shape:</span> <span className="text-black">{selectedCampaign.shape}</span></p>
                    <p><span className="text-gray-700 font-medium">Status:</span> <span className={`font-medium ${
                      selectedCampaign.status === 'active' 
                        ? 'text-green-600' 
                        : selectedCampaign.status === 'paused' 
                          ? 'text-amber-600' 
                          : 'text-black'
                    }`}>{selectedCampaign.status}</span></p>
                  </div>
                ) : (
                  <p className="text-sm text-black">No campaign selected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content - Map and Metrics (wider) */}
        <div className="md:col-span-5">
          {/* Map Card */}
          <Card className="bg-white shadow-sm border mb-6">
            <CardContent className="p-0">
              <GoogleMapRankingGrid
                nodes={gridData}
                keyword={keyword || "No keyword selected"}
                location={selectedCampaign?.name || "Not specified"}
                isLoading={isLoading}
                onNodeHover={setHoveredCell}
                mapRef={mapRef}
              />
            </CardContent>
          </Card>

          {/* Vertically Stacked Data Display */}
          <div className="flex flex-col space-y-6 pb-2">
            {/* Enhanced Ranking Summary - Full Width */}
            <div className="w-full">
              <EnhancedRankingSummary 
                data={gridData}
                metrics={{
                  averageFirstPageRank: parseFloat(metrics.afpr),
                  gridRankMean: parseFloat(metrics.tgrm),
                  topSpotShare: parseFloat(metrics.tss.replace('%', '')),
                  visibilityScore: 100.0
                }}
                keyword={keyword}
                previousMetrics={{
                  afpr: parseFloat(metrics.afpr) + 0.5, // Simulated previous metrics 
                  tgrm: parseFloat(metrics.tgrm) + 0.3,
                  tss: parseFloat(metrics.tss.replace('%', '')) - 2.1
                }}
                // Sort grid data for top and weakest points if available
                topGridPoints={gridData.length > 0 ? 
                  [...gridData].sort((a, b) => a.rank - b.rank).slice(0, 3) : 
                  []
                }
                weakestGridPoints={gridData.length > 0 ? 
                  [...gridData].sort((a, b) => b.rank - a.rank).slice(0, 3) : 
                  []
                }
                keywordDifficulty={45}
                onZoomToArea={(lat, lng) => {
                  if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng });
                    mapRef.current.setZoom(13);
                  }
                }}
              />
            </div>
            
            {/* Competitor Analysis - Full Width */}
            <div className="w-full">
              <Card className="bg-white shadow-sm border w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-black flex items-center">
                    <CompetitorsIcon className="h-5 w-5 text-[#F28C38] mr-2" />
                    Competitor Analysis
                  </CardTitle>
                  <CardDescription>
                    Compare your business with top competitors for {keyword}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <CompetitorAnalysis
                    campaignId={selectedCampaign?.id}
                    initialData={{
                      yourBusiness: {
                        name: "Your Plumbing Business",
                        rank: 1,
                        overlap: 100,
                        reviewCount: 120,
                        averageRating: 4.8,
                        categories: ["Plumber", "Water Heater Installation", "Pipe Repair"],
                        isOpen: true,
                        website: "https://yourplumbingbusiness.com",
                        domainAuthority: 50,
                        rankingKeywords: 100
                      },
                      competitors: mockCompetitorData.map(comp => ({
                        name: comp.name,
                        rank: comp.overallRank,
                        rankChange: Math.random() > 0.5 ? 1 : -1,
                        visibility: Math.floor(Math.random() * 20) + 70,
                        keywordOverlap: comp.keywordOverlap,
                        reviewCount: Math.floor(Math.random() * 80) + 20,
                        averageRating: (Math.random() * 2 + 3).toFixed(1),
                        categories: ["Plumber", "Drain Cleaning"],
                        isOpen: Math.random() > 0.3,
                        domainAuthority: Math.floor(Math.random() * 30) + 20,
                        strengths: ["Local citations", "GMB optimization"],
                        weaknesses: ["Site speed", "Mobile optimization"]
                      })),
                      keywordOverlaps: mockCompetitorData.slice(0, 3).map(comp => ({
                        competitor: comp.name,
                        keywords: Object.fromEntries(
                          campaignKeywords.slice(0, 5).map(kw => [
                            kw.keyword, 
                            Math.floor(Math.random() * 10) + 1
                          ])
                        )
                      })),
                      trendData: {
                        yourBusiness: [
                          { date: '2024-12-01', rank: 5 },
                          { date: '2024-12-15', rank: 4 },
                          { date: '2025-01-01', rank: 3 },
                          { date: '2025-01-15', rank: 3 },
                          { date: '2025-02-01', rank: 2 },
                          { date: '2025-02-15', rank: 1 },
                          { date: '2025-03-01', rank: 1 }
                        ],
                        competitors: {
                          "ABC Plumbing": [
                            { date: '2024-12-01', rank: 1 },
                            { date: '2024-12-15', rank: 1 },
                            { date: '2025-01-01', rank: 2 },
                            { date: '2025-01-15', rank: 2 },
                            { date: '2025-02-01', rank: 3 },
                            { date: '2025-02-15', rank: 3 },
                            { date: '2025-03-01', rank: 2 }
                          ],
                          "Quick Fix Plumbers": [
                            { date: '2024-12-01', rank: 3 },
                            { date: '2024-12-15', rank: 3 },
                            { date: '2025-01-01', rank: 4 },
                            { date: '2025-01-15', rank: 4 },
                            { date: '2025-02-01', rank: 4 },
                            { date: '2025-02-15', rank: 4 },
                            { date: '2025-03-01', rank: 3 }
                          ],
                          "Perfect Pipes": [
                            { date: '2024-12-01', rank: 2 },
                            { date: '2024-12-15', rank: 2 },
                            { date: '2025-01-01', rank: 1 },
                            { date: '2025-01-15', rank: 1 },
                            { date: '2025-02-01', rank: 1 },
                            { date: '2025-02-15', rank: 2 },
                            { date: '2025-03-01', rank: 4 }
                          ]
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Ranking Trends - Full Width */}
            <div className="w-full">
              <EnhancedRankingTrends
                keywordTrendData={keyword ? getMockTrendDataForKeyword(keyword) : null}
                trendDataSeries={campaignKeywords.map(kw => getMockTrendDataForKeyword(kw.keyword))}
                keyword={keyword}
                onSelectKeyword={(kw: string) => setKeyword(kw)}
              />
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}