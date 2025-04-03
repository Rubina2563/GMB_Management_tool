import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  ArrowRight, Search, BarChart3, Key, ExternalLink, 
  Loader2, MapPin, Phone, Globe, Clock, Star, 
  Building, RefreshCcw, ChevronRight, ChevronDown,
  Rocket, CheckCircle2, AlertCircle, Activity, Circle,
  MapPin as LocationIcon, Search as SearchIcon, Link as LinkIcon,
  Star as StarIcon, ShoppingBag, MessageCircle, CalendarCheck,
  MessageSquare, PieChart, Award, TrendingUp, Zap,
  ArrowUpRight, Compass, ClipboardCheck, LineChart,
  Building2, Send, Lightbulb
} from 'lucide-react';

// Import our custom components
import LocationSelector from '@/components/LocationSelector';
import { useLocationContext } from '@/lib/location-context';

import LocationMetrics, { LocationMetricsData } from '@/components/LocationMetrics';
import RecentActivity from '@/components/RecentActivity';
import ComingSoon from '@/components/ComingSoon';
import ClientSwitcher from '@/components/ClientSwitcher';
import LocalDashboardTopBar from '@/components/LocalDashboardTopBar';
import GBPInsights from '@/components/GBPInsights';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import GBPConnectionDialog from '@/components/GBPConnectionDialog';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Define dashboard tabs
type DashboardTab = 'overview' | 'local-dashboard';

export default function ClientDashboard() {
  const { user } = useAuth();
  // Set default tab to Local Dashboard
  const [activeTab, setActiveTab] = useState<DashboardTab>('local-dashboard');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Use the location context instead of local state
  const { selectedLocationId, setSelectedLocationId, selectedLocation } = useLocationContext();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Query for API keys to check if user has set them up
  const { data: apiKeysData, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ['/api/api-keys'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/api-keys');
        return response.data;
      } catch (error) {
        console.error('Error fetching API keys:', error);
        return { api_keys: null };
      }
    }
  });
  
  // Query for GBP locations
  const { 
    data: gbpLocations,
    isLoading: isLoadingLocations,
    isError: isErrorLocations
  } = useQuery({
    queryKey: ['/api/gbp/locations'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/gbp/locations');
        return response.data;
      } catch (error) {
        console.error('Error fetching GBP locations:', error);
        return { locations: [] };
      }
    },
    retry: 1
  });

  // Mutation for connecting GBP
  const connectGBPMutation = useMutation({
    mutationFn: async (locationId: string) => {
      setIsConnecting(true);
      const response = await axios.post('/api/gbp/connect', { location_id: locationId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gbp/locations'] });
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error('Error connecting GBP:', error);
      setIsConnecting(false);
    }
  });
  
  const hasSetupApiKeys = apiKeysData?.api_keys && (
    apiKeysData.api_keys.google_api_key ||
    apiKeysData.api_keys.data_for_seo_key ||
    apiKeysData.api_keys.serp_api_key
  );

  const hasGBPLocations = gbpLocations?.locations && gbpLocations.locations.length > 0;

  // Query for dashboard data (with enhanced location support)
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard
  } = useQuery({
    queryKey: ['/api/client/dashboard', selectedLocationId],
    queryFn: async () => {
      try {
        const queryParams = selectedLocationId ? `?gbp_id=${selectedLocationId}` : '';
        const response = await axios.get(`/api/client/dashboard${queryParams}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return { 
          success: false,
          data: null,
          error: 'Failed to load dashboard data'
        };
      }
    },
    retry: 1
  });

  // Removed optimization progress query as it's no longer needed

  // Set default location when locations are loaded
  useEffect(() => {
    if (hasGBPLocations && !selectedLocationId && gbpLocations?.locations.length > 0) {
      setSelectedLocationId(gbpLocations.locations[0].id);
    }
  }, [gbpLocations, hasGBPLocations, selectedLocationId]);

  // Handle location change
  const handleLocationChange = (locationId: string | number) => {
    // Handle both string and number types
    if (typeof locationId === 'string') {
      setSelectedLocationId(locationId === "all" ? null : Number(locationId));
    } else {
      // If it's already a number, use it directly
      setSelectedLocationId(locationId);
    }
  };

  // Handle connect GBP - accepts both string and number types
  const handleConnectGBP = (locationId: string | number) => {
    toast({
      title: "Connecting GBP Location",
      description: "Connecting to Google Business Profile...",
    });
    
    // Convert to string if needed
    const locationIdStr = locationId.toString();
    connectGBPMutation.mutate(locationIdStr);
  };

  // We use selectedLocation from the location context now, but we still need to match it
  // with the full location data from the dashboard data
  const dashboardSelectedLocation = selectedLocationId && dashboardData?.data?.locations
    ? dashboardData.data.locations.find((loc: any) => loc.id === selectedLocationId)
    : null;

  // Extract the metrics for the selected location
  let locationMetrics = dashboardSelectedLocation?.metrics || null;
  
  // DUMMY DATA: This will be replaced with real data from API later
  // Location-specific dummy metrics based on location ID
  const dummyLocationMetrics: Record<number, LocationMetricsData> = {
    1: {
      rank: 3,
      rankChange: -2,
      reviewCount: 42,
      reviewRating: "4.8",
      postCount: 23,
      lastPostDate: new Date().toISOString(),
      totalCitations: 48,
      missingCitations: 5,
      weeklyViews: 230,
      weeklyActions: 56,
      weeklyDirections: 18,
      weeklyCalls: 24,
      healthScore: 89
    },
    2: {
      rank: 5,
      rankChange: 1,
      reviewCount: 35,
      reviewRating: "4.5",
      postCount: 17,
      lastPostDate: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
      totalCitations: 40,
      missingCitations: 8,
      weeklyViews: 185,
      weeklyActions: 42,
      weeklyDirections: 15,
      weeklyCalls: 19,
      healthScore: 76
    },
    3: {
      rank: 8,
      rankChange: -1,
      reviewCount: 28,
      reviewRating: "4.2",
      postCount: 12,
      lastPostDate: new Date(Date.now() - 86400000 * 8).toISOString(), // 8 days ago
      totalCitations: 32,
      missingCitations: 12,
      weeklyViews: 148,
      weeklyActions: 37,
      weeklyDirections: 12,
      weeklyCalls: 15,
      healthScore: 68
    },
    4: {
      rank: 12,
      rankChange: 0,
      reviewCount: 18,
      reviewRating: "3.9",
      postCount: 7,
      lastPostDate: new Date(Date.now() - 86400000 * 14).toISOString(), // 14 days ago
      totalCitations: 25,
      missingCitations: 15,
      weeklyViews: 112,
      weeklyActions: 28,
      weeklyDirections: 9,
      weeklyCalls: 11,
      healthScore: 58
    },
    5: {
      rank: 15,
      rankChange: 2,
      reviewCount: 12,
      reviewRating: "3.6",
      postCount: 5,
      lastPostDate: new Date(Date.now() - 86400000 * 21).toISOString(), // 21 days ago
      totalCitations: 18,
      missingCitations: 20,
      weeklyViews: 95,
      weeklyActions: 22,
      weeklyDirections: 7,
      weeklyCalls: 8,
      healthScore: 45
    }
  };
  
  // Override locationMetrics with dummy data based on location ID
  if (selectedLocationId && selectedLocationId in dummyLocationMetrics) {
    // Safe index access with known key
    const id = selectedLocationId as keyof typeof dummyLocationMetrics;
    locationMetrics = dummyLocationMetrics[id] || locationMetrics;
  }

  return (
    <div className="w-full pl-[70px] pr-[150px] py-8">
      {/* Main Dashboard tabs */}
      <div className="mb-6">
        <Tabs defaultValue="local-dashboard" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="bg-white border border-gray-200 p-1 rounded-md">
              <TabsTrigger 
                value="local-dashboard"
                onClick={() => setActiveTab('local-dashboard')}
                className="
                  data-[state=active]:bg-[#F28C38] 
                  data-[state=active]:text-black 
                  data-[state=active]:border-[#F28C38]
                  text-black 
                  hover:bg-gray-100 
                  transition-all 
                  duration-200 
                  font-medium 
                  px-6 
                  py-2 
                  rounded-md
                  border-transparent
                  border
                "
              >
                Local Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="overview"
                onClick={() => setActiveTab('overview')}
                className="
                  data-[state=active]:bg-[#F28C38] 
                  data-[state=active]:text-black 
                  data-[state=active]:border-[#F28C38]
                  text-black 
                  hover:bg-gray-100 
                  transition-all 
                  duration-200 
                  font-medium 
                  px-6 
                  py-2 
                  rounded-md
                  border-transparent
                  border
                "
              >
                Account Overview
              </TabsTrigger>
            </TabsList>
            
            {/* Connect GBP button in header */}
            {(!hasGBPLocations && activeTab === 'local-dashboard') && (
              <GBPConnectionDialog 
                hasGBPLocations={hasGBPLocations}
                onConnectGBP={handleConnectGBP}
                className="bg-[#F28C38] text-white hover:bg-[#F28C38]/90"
                variant="default"
              />
            )}
          </div>
          
          <TabsContent value="local-dashboard" className="mt-0">
            <AnimatePresence mode="wait">
              {activeTab === 'local-dashboard' && (
                <motion.div
                  key="local-dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="mb-4">
                    <h1 className="text-3xl font-bold text-black font-['Montserrat']">
                      {user?.first_name ? `Welcome, ${user.first_name}!` : 'Welcome to your Dashboard!'}
                    </h1>
                    <p className="text-black mt-1">
                      Manage your business's online presence and performance
                    </p>
                  </div>
                  
                  {isLoadingDashboard || isLoadingLocations ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin text-[#F28C38]" />
                    </div>
                  ) : isErrorDashboard || isErrorLocations ? (
                    <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
                      <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Dashboard</h3>
                      <p className="text-red-600 mb-4">
                        There was a problem loading your dashboard data. Please check your API keys and connections.
                      </p>
                      <div className="flex justify-center">
                        <Link href="/client/api-keys">
                          <Button className="bg-red-600 hover:bg-red-700 text-white">
                            Check API Settings
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : !hasGBPLocations ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">No Business Locations Found</h2>
                      <p className="text-black mb-6 max-w-md mx-auto">
                        Connect your Google Business Profile to get started with the Local Dashboard. 
                        This will enable you to see insights and manage your business profile.
                      </p>
                      
                      <GBPConnectionDialog 
                        hasGBPLocations={hasGBPLocations}
                        onConnectGBP={handleConnectGBP}
                        className="mx-auto"
                      />
                      
                      {!hasSetupApiKeys && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mt-8 max-w-md mx-auto">
                          <p className="text-yellow-800 text-sm mb-3">
                            You need to set up your API keys before connecting a GBP location.
                          </p>
                          <Link href="/client/api-keys">
                            <Button variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-100">
                              Configure API Keys
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {/* LocalDashboardTopBar component for clients & location management */}
                      <LocalDashboardTopBar 
                        numberOfClients={dashboardData?.data?.numberOfClients || 0}
                        hasGBPLocations={hasGBPLocations}
                        selectedClientId={user?.role === 'admin' ? dashboardData?.data?.selectedClientId || null : null}
                        selectedLocationId={selectedLocationId}
                        clients={dashboardData?.data?.clients || []}
                        locations={gbpLocations?.locations || []}
                        isAdmin={user?.role === 'admin'}
                        onClientChange={(clientId: number) => {
                          // Handle client change logic
                          console.log('Client changed to:', clientId);
                          // You would implement admin client switching logic here
                        }}
                        onLocationChange={handleLocationChange}
                        onConnectGBP={handleConnectGBP}
                      />
                      
                      {/* Location metrics below location selector */}
                      {dashboardSelectedLocation && locationMetrics && (
                        <div className="w-full mt-3">
                          <LocationMetrics metrics={locationMetrics} />
                        </div>
                      )}
                      
                      {/* Onboarding and Explore the App sections removed from top of dashboard */}
                      
                      {/* Main grid layout after locations and metrics */}
                      <div className="grid grid-cols-1 lg:grid-cols-9 gap-6 mt-4">
                        {/* Main content area */}
                        <div className="lg:col-span-6">
                          
                          {/* Onboarding Placeholder - only shown for new users - Moved to top */}
                          {dashboardData?.data?.isNewUser && (
                            <motion.div variants={itemVariants} className="mb-6">
                              <Card className="bg-white shadow-sm border border-gray-200">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg font-semibold flex items-center text-black">
                                    <Rocket className="h-5 w-5 mr-2 text-[#F28C38]" />
                                    Welcome to LOCALAUTHORITY! Let's get started.
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-6">
                                    <div className="flex items-start space-x-4 p-4 rounded-md border border-gray-100 shadow-sm">
                                      <div className="flex-shrink-0 mt-1">
                                        {apiKeysData?.api_keys?.google_api_key ? (
                                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        ) : (
                                          <Circle className="h-6 w-6 text-gray-300" />
                                        )}
                                      </div>
                                      <div className="flex-grow">
                                        <h3 className="font-bold text-black text-base">Connect Google Account</h3>
                                        <p className="text-black text-sm mt-1 mb-3">Connect your Google account to access Google Business Profile features.</p>
                                        <Link href="/client/api-keys">
                                          <Button className="bg-[#F28C38] hover:bg-[#F28C38]/90 text-white">
                                            Connect Now
                                          </Button>
                                        </Link>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-start space-x-4 p-4 rounded-md border border-gray-100 shadow-sm">
                                      <div className="flex-shrink-0 mt-1">
                                        {hasGBPLocations ? (
                                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        ) : (
                                          <Circle className="h-6 w-6 text-gray-300" />
                                        )}
                                      </div>
                                      <div className="flex-grow">
                                        <h3 className="font-bold text-black text-base">Add Your First Location</h3>
                                        <p className="text-black text-sm mt-1 mb-3">Connect your business location to start tracking performance.</p>
                                        <GBPConnectionDialog 
                                          hasGBPLocations={hasGBPLocations}
                                          onConnectGBP={handleConnectGBP}
                                          className=""
                                          buttonText="Add Location"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-start space-x-4 p-4 rounded-md border border-gray-100 shadow-sm">
                                      <div className="flex-shrink-0 mt-1">
                                        <Circle className="h-6 w-6 text-gray-300" />
                                      </div>
                                      <div className="flex-grow">
                                        <h3 className="font-bold text-black text-base">Start a Campaign</h3>
                                        <p className="text-black text-sm mt-1 mb-3">Create your first campaign to track keywords and improve rankings.</p>
                                        <Link href="/client/campaigns/new">
                                          <Button className="bg-[#F28C38] hover:bg-[#F28C38]/90 text-white">
                                            Create Campaign
                                          </Button>
                                        </Link>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )}
                          
                          {/* Explore the App section - always visible - Moved to top */}
                          <motion.div variants={itemVariants} className="mb-6">
                            <Card className="bg-white shadow-sm border border-gray-200">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center text-black">
                                  <Compass className="h-5 w-5 mr-2 text-[#F28C38]" />
                                  Explore the App
                                </CardTitle>
                                <CardDescription className="text-black">
                                  Discover key features to help manage your online presence
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Link href="/client/gbp-audit" className="block">
                                    <motion.div 
                                      whileHover={{ y: -4 }}
                                      className="p-4 rounded-md border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all duration-200"
                                    >
                                      <ClipboardCheck className="h-8 w-8 text-[#F28C38] mb-2" />
                                      <h3 className="font-bold text-black">View GBP Audit</h3>
                                      <p className="text-black text-sm mt-1">Run a comprehensive audit of your business profile</p>
                                    </motion.div>
                                  </Link>
                                  
                                  <Link href="/client/local-rankings" className="block">
                                    <motion.div 
                                      whileHover={{ y: -4 }}
                                      className="p-4 rounded-md border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all duration-200"
                                    >
                                      <LineChart className="h-8 w-8 text-[#F28C38] mb-2" />
                                      <h3 className="font-bold text-black">Check Local Rankings</h3>
                                      <p className="text-black text-sm mt-1">Monitor your search engine rankings and visibility</p>
                                    </motion.div>
                                  </Link>
                                  
                                  <Link href="/client/reviews" className="block">
                                    <motion.div 
                                      whileHover={{ y: -4 }}
                                      className="p-4 rounded-md border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all duration-200"
                                    >
                                      <Star className="h-8 w-8 text-[#F28C38] mb-2" />
                                      <h3 className="font-bold text-black">Manage Reviews</h3>
                                      <p className="text-black text-sm mt-1">Track and respond to customer reviews</p>
                                    </motion.div>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>

                          {/* GBP Insights Section - only show for selected location - Moved after onboarding sections */}
                          {dashboardSelectedLocation && (
                            <GBPInsights
                              locationId={selectedLocationId}
                              locationName={dashboardSelectedLocation.name}
                              metrics={locationMetrics}
                              className="mt-0"
                            />
                          )}
                        </div>
                        
                        {/* Right sidebar - Recent activity */}
                        <div className="lg:col-span-3">
                          <RecentActivity
                            activities={dashboardData?.data?.recentActivity || []}
                            selectedLocationId={selectedLocationId}
                          />
                          
                          {/* Coming Soon feature placeholder */}
                          <ComingSoon className="mt-6" />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
          
          <TabsContent value="overview" className="mt-0">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-black font-['Montserrat']">
                      Welcome to Your Dashboard
                    </h1>
                    <p className="text-black mt-2">
                      Hello, {user?.first_name || user?.username}! Here's an overview of your account and available features.
                    </p>
                  </div>
                  
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={itemVariants}>
                      <Card className="bg-white text-black h-full shadow-sm hover:shadow-md transition-shadow duration-300">
                        <CardHeader>
                          <Search className="h-8 w-8 mb-2 text-[#F28C38]" />
                          <CardTitle className="font-['Montserrat'] text-xl">GBP Audit</CardTitle>
                          <CardDescription className="text-black">
                            Analyze your Google Business Profile
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4">
                            Get comprehensive analysis and actionable recommendations to improve your GBP performance.
                          </p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link href="/client/gbp-audit">
                              <Button className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white mt-2">
                                Run Audit
                              </Button>
                            </Link>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <Card className="bg-white text-black h-full shadow-sm hover:shadow-md transition-shadow duration-300">
                        <CardHeader>
                          <BarChart3 className="h-8 w-8 mb-2 text-[#F28C38]" />
                          <CardTitle className="font-['Montserrat'] text-xl">Posts Management</CardTitle>
                          <CardDescription className="text-black">
                            Create and schedule GBP posts
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4">
                            Create engaging posts for your Google Business Profile to boost visibility and customer engagement.
                          </p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link href="/client/posts">
                              <Button className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white mt-2">
                                Manage Posts
                              </Button>
                            </Link>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <Card className="bg-white text-black h-full shadow-sm hover:shadow-md transition-shadow duration-300">
                        <CardHeader>
                          <Building2 className="h-8 w-8 mb-2 text-[#F28C38]" />
                          <CardTitle className="font-['Montserrat'] text-xl">Google Business Profile</CardTitle>
                          <CardDescription className="text-black">
                            Connect and manage your GBP
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4">
                            Integrate with Google Business Profile to manage your business information and reviews.
                          </p>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <GBPConnectionDialog 
                              hasGBPLocations={hasGBPLocations}
                              onConnectGBP={handleConnectGBP}
                              className=""
                            />
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                  
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card className="mb-8 shadow-sm bg-white">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-black font-['Montserrat']">Getting Started</CardTitle>
                        <CardDescription className="text-black">Quick tips to get the most out of our platform</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 bg-[#F28C38]/10 rounded-full p-2">
                              <span className="text-[#F28C38] font-bold">1</span>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold text-[#F28C38] font-['Montserrat']">Configure Your API Keys</h3>
                              <p className="text-black">
                                Set up your API keys to enable all features. Visit the API Keys page to get started.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex-shrink-0 bg-[#F28C38]/10 rounded-full p-2">
                              <span className="text-[#F28C38] font-bold">2</span>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold text-[#F28C38] font-['Montserrat']">Connect Your GBP</h3>
                              <p className="text-black">
                                Link your Google Business Profile to get insights and manage your business presence.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex-shrink-0 bg-[#F28C38]/10 rounded-full p-2">
                              <span className="text-[#F28C38] font-bold">3</span>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold text-[#F28C38] font-['Montserrat']">Run Your First GBP Audit</h3>
                              <p className="text-black">
                                Analyze your Google Business Profile to get actionable recommendations.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      <Link href="/client/api-keys">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white w-full md:w-auto">
                            Configure API Keys
                            <Key className="ml-2 h-4 w-4" />
                          </Button>
                        </motion.div>
                      </Link>
                      
                      <Link href="/client/documentation">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button variant="outline" className="border-[#F28C38] text-[#F28C38] w-full md:w-auto">
                            View Documentation
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </motion.div>
                      </Link>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}