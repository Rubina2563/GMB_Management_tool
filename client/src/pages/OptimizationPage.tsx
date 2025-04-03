import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import DownloadReportButton from "@/components/DownloadReportButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Globe,
  ImageIcon,
  MapPin,
  MessageSquare,
  Search,
  Star,
  Zap,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import ReviewsTab from "@/components/optimization/ReviewsTab";
import PostsTab from "@/components/optimization/PostsTab";
import CitationsTab from "@/components/optimization/CitationsTab";
import PerformanceTab from "@/components/optimization/PerformanceTab";

// Types for the insights data from API
interface Insight {
  id: number;
  gbp_id: number;
  user_id: number;
  timestamp: string;
  data: {
    keyword_optimization: {
      score: number;
      suggestions: Array<{
        keyword: string;
        volume: number;
        difficulty: number;
        opportunity: 'high' | 'medium' | 'low';
      }>;
      recommendations: string[];
    };
    review_response_optimization: {
      score: number;
      priority_reviews: Array<{
        id: string;
        rating: number;
        sentiment: number;
        priority: 'high' | 'medium' | 'low';
        reviewer_name: string;
        comment: string;
      }>;
      recommendations: string[];
    };
    posting_schedule_optimization: {
      score: number;
      best_times: Array<{
        day: string;
        time: string;
        engagement_score: number;
      }>;
      worst_times: Array<{
        day: string;
        time: string;
        engagement_score: number;
      }>;
      recommendations: string[];
    };
    citation_prioritization: {
      score: number;
      priority_directories: Array<{
        name: string;
        url: string;
        da: number;
        priority: 'high' | 'medium' | 'low';
      }>;
      recommendations: string[];
    };
    performance_forecast: {
      score: number;
      metrics: {
        calls: {
          current: number;
          forecast: number;
          change_percent: number;
        };
        website_clicks: {
          current: number;
          forecast: number;
          change_percent: number;
        };
        direction_requests: {
          current: number;
          forecast: number;
          change_percent: number;
        };
      };
      trend: Array<{
        month: string;
        calls: number;
        website_clicks: number;
        direction_requests: number;
      }>;
      recommendations: string[];
    };
    competitor_benchmarking: {
      score: number;
      gaps: Array<{
        metric: string;
        your_value: number;
        competitor_avg: number;
        gap_percent: number;
        priority: 'high' | 'medium' | 'low';
      }>;
      top_competitors: Array<{
        name: string;
        strengths: string[];
        weaknesses: string[];
      }>;
      recommendations: string[];
    };
    overall_score: number;
  };
  credits_used: number;
}

interface InsightResponse {
  success: boolean;
  message: string;
  insights: Insight;
  credits?: {
    used: number;
    remaining: number;
  };
}

interface CreditsResponse {
  success: boolean;
  message: string;
  credits: number;
}

interface Location {
  id: number;
  name: string;
  address: string;
}

const OptimizationPage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [insightDate, setInsightDate] = useState<string | null>(null);

  // Fetch GBP locations
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/gbp/locations'],
    queryFn: async () => {
      const response = await fetch('/api/gbp/locations', {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Fetch user's credits
  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ['/api/client/optimization/credits'],
    queryFn: async () => {
      const response = await fetch('/api/client/optimization/credits', {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Fetch insights for selected location
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError,
    refetch: refetchInsights
  } = useQuery({
    queryKey: ['/api/client/optimization/insights', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return null;
      
      const response = await fetch(`/api/client/optimization/insights/${selectedLocationId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          // No insights yet, that's okay
          return { success: false, message: 'No insights found for this location' };
        }
        throw new Error(errorData.message || 'Failed to fetch insights');
      }
      
      return response.json();
    },
    enabled: !!selectedLocationId,
    refetchOnWindowFocus: false
  });

  // Query for competitor analysis
  const { 
    data: competitorData, 
    isLoading: competitorLoading, 
    error: competitorError 
  } = useQuery({
    queryKey: ['/api/client/competitors', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return null;
      
      const response = await fetch(`/api/client/competitors/${selectedLocationId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch competitor analysis');
      }
      
      return response.json();
    },
    enabled: !!selectedLocationId && activeTab === 'competitors',
    refetchOnWindowFocus: false
  });

  // Mutation for generating new insights
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLocationId) throw new Error('No location selected');
      
      const response = await fetch(`/api/client/optimization/insights/${selectedLocationId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate insights');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Insights generated",
        description: "1 credit deducted from your balance",
        variant: "default",
      });
      
      // Update the query cache
      queryClient.invalidateQueries({ queryKey: ['/api/client/optimization/insights'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/optimization/credits'] });
      
      if (data?.insights) {
        setInsightDate(new Date(data.insights.timestamp).toLocaleDateString());
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Effect to set default location when data is loaded
  useEffect(() => {
    if (locationsData?.locations?.length && !selectedLocationId) {
      setSelectedLocationId(locationsData.locations[0].id);
    }
  }, [locationsData, selectedLocationId]);

  // Effect to set insight date when insights are loaded
  useEffect(() => {
    if (insightsData?.insights?.timestamp) {
      setInsightDate(new Date(insightsData.insights.timestamp).toLocaleDateString());
    }
  }, [insightsData]);

  // Handler for location selection
  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(parseInt(locationId));
  };

  // Handler for generating insights
  const handleGenerateInsights = () => {
    generateInsightsMutation.mutate();
  };

  // Handler for exporting insights to PDF
  const handleExportPDF = () => {
    if (!insightsData?.insights) return;
    
    const doc = new jsPDF();
    const insights = insightsData.insights;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const lineHeight = 7;
    let y = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('GBP Optimization Insights', margin, y);
    y += lineHeight * 2;
    
    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date(insights.timestamp).toLocaleDateString()}`, margin, y);
    y += lineHeight * 2;
    
    // Overall Score
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Optimization Score: ${insights.data.overall_score}/100`, margin, y);
    y += lineHeight * 2;
    
    // Sections
    const sections = [
      { 
        title: 'Keyword Optimization', 
        score: insights.data.keyword_optimization.score,
        recommendations: insights.data.keyword_optimization.recommendations
      },
      { 
        title: 'Review Response Optimization', 
        score: insights.data.review_response_optimization.score,
        recommendations: insights.data.review_response_optimization.recommendations
      },
      { 
        title: 'Posting Schedule Optimization', 
        score: insights.data.posting_schedule_optimization.score,
        recommendations: insights.data.posting_schedule_optimization.recommendations
      },
      { 
        title: 'Citation Prioritization', 
        score: insights.data.citation_prioritization.score,
        recommendations: insights.data.citation_prioritization.recommendations
      },
      { 
        title: 'Performance Forecast', 
        score: insights.data.performance_forecast.score,
        recommendations: insights.data.performance_forecast.recommendations
      },
      { 
        title: 'Competitor Benchmarking', 
        score: insights.data.competitor_benchmarking.score,
        recommendations: insights.data.competitor_benchmarking.recommendations
      }
    ];
    
    sections.forEach(section => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${section.title} - Score: ${section.score}/100`, margin, y);
      y += lineHeight;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Recommendations:', margin, y);
      y += lineHeight;
      
      section.recommendations.forEach(rec => {
        const lines = doc.splitTextToSize(`• ${rec}`, contentWidth);
        lines.forEach(line => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        });
      });
      
      y += lineHeight;
    });
    
    doc.save('gbp-optimization-insights.pdf');
    
    toast({
      title: "PDF Downloaded",
      description: "Your insights have been exported to PDF",
      variant: "default",
    });
  };

  // Loading state
  if (locationsLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-black mb-6">Optimization</h1>
        <div className="grid gap-6">
          <Card className="bg-white">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No locations state
  if (!locationsData?.locations?.length) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-black mb-6">Optimization</h1>
        <Alert>
          <AlertTitle>No GBP locations found</AlertTitle>
          <AlertDescription>
            Please connect a Google Business Profile first to access optimization insights.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4 bg-[#F28C38] hover:bg-[#F5A461] text-black"
          onClick={() => navigate("/gbp-connect")}
        >
          Connect GBP
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full pl-[70px] pr-[150px] py-8 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-black">Optimization</h1>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {insightDate && (
            <div className="text-sm text-black">
              <span className="mr-1">Last updated:</span>
              <span className="font-medium">{insightDate}</span>
            </div>
          )}
          
          <Select
            value={selectedLocationId?.toString()}
            onValueChange={handleLocationChange}
          >
            <SelectTrigger className="w-[220px] border-black">
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              {locationsData?.locations?.map((location: Location) => (
                <SelectItem key={location.id} value={location.id.toString()} className="text-black">
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6">
        {/* Overview Card */}
        <Card className="bg-white border border-black/10">
          <CardHeader className="bg-white text-black">
            <div className="flex justify-between items-center">
              <CardTitle className="text-black">GBP Insights</CardTitle>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-black">
                  <span className="mr-1">Credits:</span>
                  <span className="font-medium">{creditsLoading ? '...' : creditsData?.credits}</span>
                </div>
                
                <Button
                  onClick={handleGenerateInsights}
                  className="bg-[#F28C38] hover:bg-[#F5A461] text-black"
                  disabled={generateInsightsMutation.isPending || !creditsData?.credits}
                >
                  {generateInsightsMutation.isPending ? "Generating..." : "Generate Insights"}
                </Button>
                
                {insightsData?.insights && (
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    className="space-x-1 bg-white text-black hover:bg-gray-100"
                    disabled={generateInsightsMutation.isPending}
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-black">Export</span>
                  </Button>
                )}
              </div>
            </div>
            <CardDescription className="text-black">
              Strategic recommendations to optimize your Google Business Profile performance
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {generateInsightsMutation.isPending && (
              <div className="p-6 flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="bg-gray-200 h-8 w-8 mb-2 rounded-full"></div>
                  <div className="h-2 w-24 bg-gray-200 rounded"></div>
                </div>
                <p className="mt-3 text-sm text-black">Generating insights...</p>
              </div>
            )}
            
            {!generateInsightsMutation.isPending && insightsLoading && (
              <div className="p-6 flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="bg-gray-200 h-8 w-8 mb-2 rounded-full"></div>
                  <div className="h-2 w-24 bg-gray-200 rounded"></div>
                </div>
                <p className="mt-3 text-sm text-black">Loading insights...</p>
              </div>
            )}
            
            {!generateInsightsMutation.isPending && !insightsLoading && !insightsData?.insights && (
              <div className="text-center py-12">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <FileText className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">No insights yet</h3>
                <p className="text-sm text-black max-w-md mx-auto mb-6">
                  Generate insights to get strategic recommendations for optimizing your Google Business Profile performance.
                </p>
                <Button
                  onClick={handleGenerateInsights}
                  className="bg-[#F28C38] hover:bg-[#F5A461] text-black"
                  disabled={!creditsData?.credits}
                >
                  Generate Insights
                </Button>
                {creditsData?.credits === 0 && (
                  <p className="text-sm text-red-500 mt-3">
                    You need credits to generate insights.
                  </p>
                )}
              </div>
            )}
            
            {!generateInsightsMutation.isPending && !insightsLoading && insightsData?.insights && (
              <div>
                <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-8 mb-6 bg-white border border-gray-200 p-1 rounded-md">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-black text-black hover:bg-gray-100">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="keywords" className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-black text-black hover:bg-gray-100">
                      Keywords
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-black text-black hover:bg-gray-100">
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger value="posting" className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-black text-black hover:bg-gray-100">
                      Posting
                    </TabsTrigger>
                    <TabsTrigger value="citations" className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-black text-black hover:bg-gray-100">
                      Citations
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-black text-black hover:bg-gray-100">
                      Performance
                    </TabsTrigger>
                    <TabsTrigger value="competitors" className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-black text-black hover:bg-gray-100">
                      Competitors
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-black text-black hover:bg-gray-100">
                      Activity
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Overview Tab */}
                  <TabsContent value="overview">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h3 className="text-2xl font-bold text-black">Overall Optimization Score</h3>
                          <p className="text-black mt-1">
                            Combined score from all optimization categories
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-5xl font-bold text-[#F97316]">
                            {insightsData.insights.data.overall_score}
                            <span className="text-xl text-black">/100</span>
                          </div>
                          <DownloadReportButton 
                            reportType="overview" 
                            locationId={selectedLocationId || 0}
                            comprehensive={true}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Category Scores */}
                        <Card className="bg-white border border-gray-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-black">Category Scores</CardTitle>
                            <CardDescription className="text-black">Performance breakdown by category</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                  <span className="text-black">Keyword Optimization</span>
                                  <span className="text-black">{insightsData.insights.data.keyword_optimization.score}/100</span>
                                </div>
                                <Progress 
                                  value={insightsData.insights.data.keyword_optimization.score} 
                                  className="h-2 bg-gray-100" 
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                  <span className="text-black">Review Response</span>
                                  <span className="text-black">{insightsData.insights.data.review_response_optimization.score}/100</span>
                                </div>
                                <Progress 
                                  value={insightsData.insights.data.review_response_optimization.score} 
                                  className="h-2 bg-gray-100"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                  <span className="text-black">Posting Schedule</span>
                                  <span className="text-black">{insightsData.insights.data.posting_schedule_optimization.score}/100</span>
                                </div>
                                <Progress 
                                  value={insightsData.insights.data.posting_schedule_optimization.score} 
                                  className="h-2 bg-gray-100"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                  <span className="text-black">Citation Prioritization</span>
                                  <span className="text-black">{insightsData.insights.data.citation_prioritization.score}/100</span>
                                </div>
                                <Progress 
                                  value={insightsData.insights.data.citation_prioritization.score} 
                                  className="h-2 bg-gray-100"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                  <span className="text-black">Performance Forecast</span>
                                  <span className="text-black">{insightsData.insights.data.performance_forecast.score}/100</span>
                                </div>
                                <Progress 
                                  value={insightsData.insights.data.performance_forecast.score} 
                                  className="h-2 bg-gray-100"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                  <span className="text-black">Competitor Benchmarking</span>
                                  <span className="text-black">{insightsData.insights.data.competitor_benchmarking.score}/100</span>
                                </div>
                                <Progress 
                                  value={insightsData.insights.data.competitor_benchmarking.score} 
                                  className="h-2 bg-gray-100"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Key Recommendations */}
                        <Card className="bg-white border border-gray-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-black">Key Recommendations</CardTitle>
                            <CardDescription className="text-black">Actionable steps to improve your profile</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Top recommendation from each category */}
                              {insightsData.insights.data.keyword_optimization.recommendations.length > 0 && (
                                <div className="flex">
                                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                    <Search className="h-4 w-4 text-[#F97316]" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-black font-medium">Keywords:</p>
                                    <p className="text-sm text-black">
                                      {insightsData.insights.data.keyword_optimization.recommendations[0]}
                                    </p>
                                    <Button 
                                      variant="link" 
                                      className="px-0 h-6 text-[#F97316] font-medium"
                                      onClick={() => setActiveTab("keywords")}
                                    >
                                      View details →
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {insightsData.insights.data.review_response_optimization.recommendations.length > 0 && (
                                <div className="flex">
                                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                    <Star className="h-4 w-4 text-[#F97316]" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-black font-medium">Reviews:</p>
                                    <p className="text-sm text-black">
                                      {insightsData.insights.data.review_response_optimization.recommendations[0]}
                                    </p>
                                    <Button 
                                      variant="link" 
                                      className="px-0 h-6 text-[#F97316] font-medium"
                                      onClick={() => setActiveTab("reviews")}
                                    >
                                      View details →
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {insightsData.insights.data.posting_schedule_optimization.recommendations.length > 0 && (
                                <div className="flex">
                                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                    <Calendar className="h-4 w-4 text-[#F97316]" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-black font-medium">Posting:</p>
                                    <p className="text-sm text-black">
                                      {insightsData.insights.data.posting_schedule_optimization.recommendations[0]}
                                    </p>
                                    <Button 
                                      variant="link" 
                                      className="px-0 h-6 text-[#F97316] font-medium"
                                      onClick={() => setActiveTab("posting")}
                                    >
                                      View details →
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {insightsData.insights.data.citation_prioritization.recommendations.length > 0 && (
                                <div className="flex">
                                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                    <Globe className="h-4 w-4 text-[#F97316]" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-black font-medium">Citations:</p>
                                    <p className="text-sm text-black">
                                      {insightsData.insights.data.citation_prioritization.recommendations[0]}
                                    </p>
                                    <Button 
                                      variant="link" 
                                      className="px-0 h-6 text-[#F97316] font-medium"
                                      onClick={() => setActiveTab("citations")}
                                    >
                                      View details →
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {insightsData.insights.data.performance_forecast.recommendations.length > 0 && (
                                <div className="flex">
                                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                    <BarChart3 className="h-4 w-4 text-[#F97316]" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-black font-medium">Performance:</p>
                                    <p className="text-sm text-black">
                                      {insightsData.insights.data.performance_forecast.recommendations[0]}
                                    </p>
                                    <Button 
                                      variant="link" 
                                      className="px-0 h-6 text-[#F97316] font-medium"
                                      onClick={() => setActiveTab("performance")}
                                    >
                                      View details →
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Profile Metrics */}
                      <Card className="bg-white border border-gray-200 mb-6">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-black">Profile Metrics</CardTitle>
                          <CardDescription className="text-black">Key metrics from your Google Business Profile</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center mb-2">
                                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                  <MessageSquare className="h-4 w-4 text-[#F97316]" />
                                </div>
                                <h4 className="text-sm font-semibold text-black">Reviews</h4>
                              </div>
                              <div className="text-2xl font-bold text-black">{insightsData.insights.data.profile_metrics.review_count}</div>
                              <div className="text-xs text-black mt-1">
                                <span className={`font-medium ${insightsData.insights.data.profile_metrics.review_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {insightsData.insights.data.profile_metrics.review_growth > 0 ? '↑' : '↓'} 
                                  {Math.abs(insightsData.insights.data.profile_metrics.review_growth)}%
                                </span> vs. previous 30 days
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center mb-2">
                                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                  <Star className="h-4 w-4 text-[#F97316]" />
                                </div>
                                <h4 className="text-sm font-semibold text-black">Rating</h4>
                              </div>
                              <div className="text-2xl font-bold text-black">{insightsData.insights.data.profile_metrics.average_rating.toFixed(1)}</div>
                              <div className="text-xs text-black mt-1">
                                <span className={`font-medium ${insightsData.insights.data.profile_metrics.rating_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {insightsData.insights.data.profile_metrics.rating_growth > 0 ? '↑' : '↓'} 
                                  {Math.abs(insightsData.insights.data.profile_metrics.rating_growth)}
                                </span> vs. previous 30 days
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center mb-2">
                                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                  <MapPin className="h-4 w-4 text-[#F97316]" />
                                </div>
                                <h4 className="text-sm font-semibold text-black">Directions</h4>
                              </div>
                              <div className="text-2xl font-bold text-black">{insightsData.insights.data.profile_metrics.directions_requests}</div>
                              <div className="text-xs text-black mt-1">
                                <span className={`font-medium ${insightsData.insights.data.profile_metrics.directions_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {insightsData.insights.data.profile_metrics.directions_growth > 0 ? '↑' : '↓'} 
                                  {Math.abs(insightsData.insights.data.profile_metrics.directions_growth)}%
                                </span> vs. previous 30 days
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center mb-2">
                                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                  <Clock className="h-4 w-4 text-[#F97316]" />
                                </div>
                                <h4 className="text-sm font-semibold text-black">Response Time</h4>
                              </div>
                              <div className="text-2xl font-bold text-black">{insightsData.insights.data.profile_metrics.avg_response_time}h</div>
                              <div className="text-xs text-black mt-1">
                                <span className={`font-medium ${insightsData.insights.data.profile_metrics.response_time_improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {insightsData.insights.data.profile_metrics.response_time_improvement > 0 ? '↑' : '↓'} 
                                  {Math.abs(insightsData.insights.data.profile_metrics.response_time_improvement)}h
                                </span> vs. previous 30 days
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent Activity */}
                      <Card className="bg-white border border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-black">Recent Activity</CardTitle>
                          <CardDescription className="text-black">Latest updates from your Google Business Profile</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {insightsData.insights.data.recent_activity.map((activity, index) => (
                              <div key={index} className="flex">
                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                  {activity.type === 'review' && <Star className="h-4 w-4 text-[#F97316]" />}
                                  {activity.type === 'post' && <FileText className="h-4 w-4 text-[#F97316]" />}
                                  {activity.type === 'photo' && <BookOpen className="h-4 w-4 text-[#F97316]" />}
                                  {activity.type === 'query' && <Search className="h-4 w-4 text-[#F97316]" />}
                                </div>
                                <div>
                                  <p className="text-sm text-black font-medium">
                                    {activity.title}
                                    <span className="text-gray-500 font-normal ml-2">
                                      {new Date(activity.timestamp).toLocaleDateString()}
                                    </span>
                                  </p>
                                  <p className="text-sm text-black">
                                    {activity.description}
                                  </p>
                                  {activity.action && (
                                    <Button 
                                      variant="link" 
                                      className="px-0 h-6 text-[#F97316] font-medium"
                                      onClick={() => {
                                        // Handle action based on activity type
                                        if (activity.type === 'review') setActiveTab("reviews");
                                        if (activity.type === 'post') setActiveTab("posting");
                                        if (activity.type === 'photo') navigate("/image-optimization");
                                        if (activity.type === 'query') setActiveTab("keywords");
                                      }}
                                    >
                                      {activity.action} →
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t border-gray-100 pt-4">
                          <Button 
                            variant="outline" 
                            className="w-full text-[#F97316] border-[#F97316] hover:bg-orange-50"
                            onClick={() => {
                              // Navigate to the same page but with a specific activity tab parameter
                              navigate("/client/optimization?tab=activity");
                              setActiveTab("activity");
                            }}
                          >
                            View all activity
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </TabsContent>
                  
                  {/* Keywords Tab */}
                  <TabsContent value="keywords">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-2xl font-bold">Keyword Optimization</h3>
                          <p className="text-black mt-1">
                            Suggestions to improve visibility for relevant keywords
                          </p>
                        </div>
                        <div className="text-4xl font-bold text-[#F97316]">
                          {insightsData.insights.data.keyword_optimization.score}
                          <span className="text-xl text-black">/100</span>
                        </div>
                      </div>
                      
                      {/* Content Analysis Section */}
                      <Card className="bg-white border border-gray-200 mb-6">
                        <CardHeader className="border-b border-gray-100 pb-3">
                          <CardTitle className="text-lg text-black">Content Analysis</CardTitle>
                          <CardDescription className="text-black">
                            NLP analysis of your current GBP description, posts, and services
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium text-black mb-3">Current Content Keywords</h4>
                              <div className="flex flex-wrap gap-2">
                                {['local plumber', 'water heater repair', 'drain cleaning', 'emergency service', '24/7 availability', 'licensed plumbers'].map((term, i) => (
                                  <Badge 
                                    key={i} 
                                    className="bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-full"
                                  >
                                    {term}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-black mb-3">Customer Review Keywords</h4>
                              <div className="flex flex-wrap gap-2">
                                {['fast service', 'professional', 'affordable', 'reliable', 'quality work', 'friendly staff'].map((term, i) => (
                                  <Badge 
                                    key={i} 
                                    className="bg-blue-50 text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-full"
                                  >
                                    {term}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Suggested Keywords */}
                        <Card className="bg-white border border-gray-200">
                          <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-lg text-black">Suggested Keywords</CardTitle>
                            <CardDescription className="text-black">
                              Based on search volume and competition
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="space-y-4">
                              {insightsData.insights.data.keyword_optimization.suggestions.map((suggestion, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-black">{suggestion.keyword}</span>
                                    <Badge
                                      className={
                                        suggestion.opportunity === 'high'
                                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                          : suggestion.opportunity === 'medium'
                                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                      }
                                    >
                                      {suggestion.opportunity} opportunity
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 mb-3">
                                    <div>
                                      <span>Volume:</span>{' '}
                                      <span className="font-medium text-black">{suggestion.volume}</span>
                                    </div>
                                    <div>
                                      <span>Difficulty:</span>{' '}
                                      <span className="font-medium text-black">{suggestion.difficulty}/10</span>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      className="bg-[#F97316] hover:bg-orange-400 text-white"
                                      onClick={() => {
                                        navigator.clipboard.writeText(suggestion.keyword);
                                        toast({
                                          description: `Copied "${suggestion.keyword}" to clipboard`,
                                        });
                                      }}
                                    >
                                      Copy Keyword
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-[#F97316] text-[#F97316] hover:bg-orange-50"
                                      onClick={() => {
                                        // Would navigate to posts creation
                                        navigate("/client/gbp-management/posts/new");
                                      }}
                                    >
                                      Create Post
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Recommendations */}
                        <Card className="bg-white border border-gray-200">
                          <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-lg text-black">Recommendations</CardTitle>
                            <CardDescription className="text-black">
                              Actions to improve your keyword optimization
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="space-y-4">
                              {insightsData.insights.data.keyword_optimization.recommendations.map((rec, index) => {
                                // Dynamically highlight keywords within recommendations
                                const keywordsToHighlight = ['emergency plumbing repair', 'water heater replacement', 'tankless water heater'];
                                let highlightedRec = rec;
                                
                                keywordsToHighlight.forEach(keyword => {
                                  if (rec.includes(keyword)) {
                                    highlightedRec = highlightedRec.replace(
                                      new RegExp(keyword, 'gi'),
                                      `<span class="text-[#F97316] font-medium">${keyword}</span>`
                                    );
                                  }
                                });
                                
                                return (
                                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                    <p 
                                      className="text-black mb-3" 
                                      dangerouslySetInnerHTML={{ __html: highlightedRec }}
                                    />
                                    <div className="flex justify-end">
                                      <Button 
                                        size="sm"
                                        variant="link"
                                        className="text-[#F97316]"
                                        onClick={() => {
                                          window.open('https://business.google.com/dashboard', '_blank');
                                        }}
                                      >
                                        Edit in GBP →
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Content Update Guide */}
                      <Card className="bg-white border border-gray-200 mt-6">
                        <CardHeader className="border-b border-gray-100 pb-3">
                          <CardTitle className="text-lg text-black">Content Update Guide</CardTitle>
                          <CardDescription className="text-black">
                            Manual steps to improve your keyword optimization
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <ol className="list-decimal list-inside space-y-3 text-black">
                            <li>Go to your <a href="https://business.google.com/dashboard" target="_blank" className="text-[#F97316] hover:underline">Google Business Profile</a></li>
                            <li>Edit your business description and add the missing keywords identified above</li>
                            <li>Update your services section to include high-opportunity keywords</li>
                            <li>Create new posts that highlight the recommended keywords</li>
                            <li>Respond to customer reviews using relevant keywords naturally</li>
                          </ol>
                          <Alert className="mt-4 bg-blue-50 text-black border-blue-200">
                            <AlertTitle className="text-blue-800">Keep it natural</AlertTitle>
                            <AlertDescription>
                              Always incorporate keywords naturally into your content. Forced or excessive keyword usage may negatively impact your business profile.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                  
                  {/* Reviews Tab */}
                  <TabsContent value="reviews">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Using our enhanced ReviewsTab component */}
                      {selectedLocationId && (
                        <ReviewsTab locationId={selectedLocationId} />
                      )}
                    </motion.div>
                  </TabsContent>
                  
                  {/* Posting Tab */}
                  <TabsContent value="posting">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Using our enhanced PostsTab component */}
                      {selectedLocationId && (
                        <PostsTab locationId={selectedLocationId} />
                      )}
                    </motion.div>
                  </TabsContent>
                  
                  {/* Citations Tab */}
                  <TabsContent value="citations">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {selectedLocationId && (
                        <CitationsTab locationId={selectedLocationId} />
                      )}
                    </motion.div>
                  </TabsContent>
                  
                  {/* Performance Tab */}
                  <TabsContent value="performance">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PerformanceTab locationId={selectedLocationId || 1} />
                    </motion.div>
                  </TabsContent>
                  
                  {/* Competitors Tab */}
                  <TabsContent value="competitors">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {competitorLoading && (
                        <div className="p-6 flex flex-col items-center justify-center">
                          <div className="animate-pulse flex flex-col items-center">
                            <div className="bg-gray-200 h-8 w-8 mb-2 rounded-full"></div>
                            <div className="h-2 w-24 bg-gray-200 rounded"></div>
                          </div>
                          <p className="mt-3 text-sm text-black">Loading competitor analysis...</p>
                        </div>
                      )}
                      
                      {competitorError && (
                        <div className="p-6 text-center">
                          <Alert variant="destructive">
                            <AlertTitle>Error loading competitor data</AlertTitle>
                            <AlertDescription>
                              {competitorError instanceof Error ? competitorError.message : 'Failed to load competitor data'}
                            </AlertDescription>
                          </Alert>
                          <Button 
                            className="mt-4 bg-[#F28C38] hover:bg-[#F5A461] text-black"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/client/competitors'] })}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                      
                      {!competitorLoading && !competitorError && competitorData && competitorData.success && (
                        <>
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h3 className="text-2xl font-bold text-black">Competitor Benchmarking</h3>
                              <p className="text-black mt-1">
                                Comparison with top competitors in your area
                              </p>
                            </div>
                            <div className="text-4xl font-bold text-[#F28C38]">
                              {competitorData.data.score}
                              <span className="text-xl text-black">/100</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Performance Gaps */}
                            <Card className="bg-white">
                              <CardHeader>
                                <CardTitle className="text-lg text-black">Performance Gaps</CardTitle>
                                <CardDescription className="text-black">
                                  Areas where competitors are outperforming you
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-black">Metric</TableHead>
                                      <TableHead className="text-right text-black">Your Value</TableHead>
                                      <TableHead className="text-right text-black">Competitor Avg</TableHead>
                                      <TableHead className="text-right text-black">Gap</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {competitorData.data.performanceGaps.map((gap, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="font-medium text-black">{gap.metric}</TableCell>
                                        <TableCell className="text-right text-black">{gap.yourValue}</TableCell>
                                        <TableCell className="text-right text-black">{gap.competitorAvg}</TableCell>
                                        <TableCell className="text-right text-black">
                                          <Badge
                                            className={
                                              gap.gap < 0 && gap.significance === 'high'
                                                ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                                : gap.gap < 0 && gap.significance === 'medium'
                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                : 'bg-gray-100 text-black hover:bg-gray-100'
                                            }
                                          >
                                            {gap.gap}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                
                                <div className="mt-6 space-y-4">
                                  <h4 className="font-medium text-black">Top Competitors</h4>
                                  {competitorData.data.competitors.slice(0, 3).map((competitor, index) => (
                                    <div key={index} className="p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
                                      <div className="font-medium mb-2 text-black">{competitor.name}</div>
                                      <div className="text-sm text-black">
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                          <div>
                                            <span className="text-gray-500">Rating:</span> {competitor.rating.toFixed(1)}
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Reviews:</span> {competitor.reviewCount}
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Category:</span> {competitor.category}
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{competitor.address}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* Recommendations */}
                            <Card className="bg-white">
                              <CardHeader>
                                <CardTitle className="text-lg text-black">Analysis & Recommendations</CardTitle>
                                <CardDescription className="text-black">
                                  Competitor strengths, weaknesses, and actions to improve
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="mb-4">
                                  <h4 className="font-medium text-black mb-2">Competitor Strengths & Weaknesses</h4>
                                  <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                      <h5 className="text-green-700 mb-1 font-medium">Key Strengths</h5>
                                      <ul className="list-disc pl-4 space-y-1 text-black">
                                        {competitorData.data.strengthsWeaknesses.strengths.map((strength, i) => (
                                          <li key={i}>{strength}</li>
                                        ))}
                                        {competitorData.data.strengthsWeaknesses.strengths.length === 0 && (
                                          <li className="text-gray-500">No key strengths identified</li>
                                        )}
                                      </ul>
                                    </div>
                                    <div>
                                      <h5 className="text-red-700 mb-1 font-medium">Key Weaknesses</h5>
                                      <ul className="list-disc pl-4 space-y-1 text-black">
                                        {competitorData.data.strengthsWeaknesses.weaknesses.map((weakness, i) => (
                                          <li key={i}>{weakness}</li>
                                        ))}
                                        {competitorData.data.strengthsWeaknesses.weaknesses.length === 0 && (
                                          <li className="text-gray-500">No key weaknesses identified</li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <h4 className="font-medium text-black">Recommendations</h4>
                                  {competitorData.data.recommendations.map((rec, index) => (
                                    <div key={index} className="p-4 border-l-4 border-[#F28C38] bg-orange-50 rounded-r-lg">
                                      <p className="font-medium text-black">{rec.title}</p>
                                      <p className="text-black text-sm mt-1">{rec.description}</p>
                                      <p className="text-black text-sm mt-2 font-medium">Action: {rec.action}</p>
                                    </div>
                                  ))}
                                  
                                  {competitorData.data.recommendations.length === 0 && (
                                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                                      <p className="text-gray-500">No recommendations available</p>
                                    </div>
                                  )}
                                  
                                  <div className="mt-6">
                                    <h4 className="font-medium mb-4 text-black">Implementation Plan</h4>
                                    
                                    <div className="space-y-3">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 mr-3">
                                          <div className="h-6 w-6 flex items-center justify-center rounded-full bg-[#F28C38] text-white text-xs">1</div>
                                        </div>
                                        <div>
                                          <p className="text-black">Focus on the metrics with high significance gaps first</p>
                                        </div>
                                      </div>
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 mr-3">
                                          <div className="h-6 w-6 flex items-center justify-center rounded-full bg-[#F28C38] text-white text-xs">2</div>
                                        </div>
                                        <div>
                                          <p className="text-black">Follow the recommended actions in order of priority</p>
                                        </div>
                                      </div>
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 mr-3">
                                          <div className="h-6 w-6 flex items-center justify-center rounded-full bg-[#F28C38] text-white text-xs">3</div>
                                        </div>
                                        <div>
                                          <p className="text-black">Track your progress monthly and adjust your strategy as needed</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </>
                      )}
                      
                      {!competitorLoading && !competitorError && (!competitorData || !competitorData.success) && (
                        <div className="text-center py-12">
                          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                            <Search className="h-8 w-8 text-black" />
                          </div>
                          <h3 className="text-lg font-medium text-black mb-2">No competitor data available</h3>
                          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                            We couldn't find competitor data for this location. Check your DataForSEO API credentials and try again.
                          </p>
                          <Button 
                            className="bg-[#F28C38] hover:bg-[#F5A461] text-black"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/client/competitors'] })}
                          >
                            Refresh Data
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>
                  
                  {/* Activity Tab */}
                  <TabsContent value="activity">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-2xl font-bold">Activity Log</h3>
                          <p className="text-black mt-1">
                            Recent optimization activities and changes
                          </p>
                        </div>
                      </div>
                      
                      <Card className="bg-white">
                        <CardHeader className="border-b border-gray-100 pb-3">
                          <CardTitle className="text-lg text-black">All Activities</CardTitle>
                          <CardDescription className="text-black">
                            Chronological record of all profile optimization activities
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-6">
                            {/* More activities shown in this view */}
                            {[
                              {
                                id: 1,
                                type: 'review',
                                title: 'New 4-star review received',
                                description: 'Rachel L. left a new 4-star review',
                                time: '2 hours ago',
                                action: 'Respond'
                              },
                              {
                                id: 2,
                                type: 'keyword',
                                title: 'Keyword analysis completed',
                                description: 'Found 3 new high-opportunity keywords',
                                time: '4 hours ago',
                                action: 'View keywords'
                              },
                              {
                                id: 3,
                                type: 'photo',
                                title: 'Images optimized',
                                description: '2 images geo-tagged and alt text added',
                                time: '6 hours ago',
                                action: 'View images'
                              },
                              {
                                id: 4,
                                type: 'post',
                                title: 'Post scheduled',
                                description: 'New post scheduled for optimal engagement time',
                                time: '1 day ago',
                                action: 'View post'
                              },
                              {
                                id: 5,
                                type: 'review',
                                title: 'Review response sent',
                                description: 'Response sent to James T.',
                                time: '1 day ago',
                                action: null
                              },
                              {
                                id: 6,
                                type: 'query',
                                title: 'Search term report generated',
                                description: 'New search insights available',
                                time: '2 days ago',
                                action: 'View report'
                              },
                              {
                                id: 7,
                                type: 'citation',
                                title: 'Citation added',
                                description: 'Business listed on Yellow Pages',
                                time: '3 days ago',
                                action: null
                              },
                              {
                                id: 8,
                                type: 'insight',
                                title: 'Insight report generated',
                                description: 'New optimization recommendations available',
                                time: '4 days ago',
                                action: 'View insights'
                              },
                            ].map((activity, index) => (
                              <div key={index} className="flex">
                                <div className="mr-4 mt-1">
                                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                    {activity.type === 'review' && <MessageSquare className="h-4 w-4 text-[#F97316]" />}
                                    {activity.type === 'post' && <FileText className="h-4 w-4 text-[#F97316]" />}
                                    {activity.type === 'photo' && <ImageIcon className="h-4 w-4 text-[#F97316]" />}
                                    {activity.type === 'query' && <Search className="h-4 w-4 text-[#F97316]" />}
                                    {activity.type === 'keyword' && <BookOpen className="h-4 w-4 text-[#F97316]" />}
                                    {activity.type === 'citation' && <MapPin className="h-4 w-4 text-[#F97316]" />}
                                    {activity.type === 'insight' && <Zap className="h-4 w-4 text-[#F97316]" />}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-black mb-1">{activity.title}</h4>
                                  <p className="text-sm text-black mb-1">{activity.description}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-black">{activity.time}</span>
                                    {activity.action && (
                                      <Button 
                                        variant="link" 
                                        className="px-0 h-6 text-[#F97316] font-medium"
                                        onClick={() => {
                                          // Handle action based on activity type
                                          if (activity.type === 'review') setActiveTab("reviews");
                                          if (activity.type === 'post') setActiveTab("posting");
                                          if (activity.type === 'photo') navigate("/client/gbp-management/image-optimization");
                                          if (activity.type === 'query' || activity.type === 'keyword') setActiveTab("keywords");
                                          if (activity.type === 'citation') setActiveTab("citations");
                                          if (activity.type === 'insight') setActiveTab("overview");
                                        }}
                                      >
                                        {activity.action} →
                                      </Button>
                                    )}
                                  </div>
                                  {index < 7 && <Separator className="mt-4" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OptimizationPage;