import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bar, Line, Pie } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { 
  BarChart2, Calendar, ChevronDown, Download, Eye, MessageCircle, Share2, ThumbsUp, TrendingUp, Users 
} from 'lucide-react';
import { useLocationContext } from '@/lib/location-context';
import { motion } from 'framer-motion';

// Define Post interface
interface Post {
  id: number;
  location_id: number;
  title: string;
  content: string;
  image_url: string | null;
  cta_type: string | null;
  cta_url: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_date: string | null;
  category: string | null;
  tags: string[];
  published_at: string | null;
}

interface PostAnalytics {
  post_id: number;
  views: number;
  engagements: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
  time_on_page: number;
  history: Array<{
    date: string;
    views: number;
    engagements: number;
    clicks: number;
  }>;
  performance_score: number;
  engagement_rate: number;
  click_through_rate: number;
  audience: {
    age_groups: Record<string, number>;
    gender: Record<string, number>;
    devices: Record<string, number>;
    locations: Record<string, number>;
  };
}

interface GBPLocation {
  id: number;
  name: string;
  address: string;
  user_id: number;
  location_id: string;
}

// Mock data generator for analytics
const generateMockAnalytics = (postId: number): PostAnalytics => {
  const days = 30;
  const startDate = subDays(new Date(), days);
  
  // Generate daily history
  const history = Array.from({ length: days }, (_, i) => {
    const date = format(subDays(new Date(), days - i), 'yyyy-MM-dd');
    return {
      date,
      views: Math.floor(Math.random() * 100) + 10,
      engagements: Math.floor(Math.random() * 50) + 5,
      clicks: Math.floor(Math.random() * 30) + 2,
    };
  });
  
  // Calculate totals
  const views = history.reduce((sum, day) => sum + day.views, 0);
  const engagements = history.reduce((sum, day) => sum + day.engagements, 0);
  const clicks = history.reduce((sum, day) => sum + day.clicks, 0);
  
  return {
    post_id: postId,
    views,
    engagements,
    clicks,
    shares: Math.floor(Math.random() * 50) + 5,
    comments: Math.floor(Math.random() * 30) + 3,
    likes: Math.floor(Math.random() * 100) + 20,
    time_on_page: Math.floor(Math.random() * 120) + 30, // seconds
    history,
    performance_score: Math.floor(Math.random() * 40) + 60, // 60-100
    engagement_rate: parseFloat((engagements / views * 100).toFixed(2)),
    click_through_rate: parseFloat((clicks / views * 100).toFixed(2)),
    audience: {
      age_groups: {
        '18-24': Math.floor(Math.random() * 20) + 5,
        '25-34': Math.floor(Math.random() * 30) + 15,
        '35-44': Math.floor(Math.random() * 25) + 10,
        '45-54': Math.floor(Math.random() * 15) + 5,
        '55+': Math.floor(Math.random() * 10) + 5,
      },
      gender: {
        'Male': Math.floor(Math.random() * 50) + 25,
        'Female': Math.floor(Math.random() * 50) + 25,
        'Other': Math.floor(Math.random() * 5),
      },
      devices: {
        'Mobile': Math.floor(Math.random() * 70) + 20,
        'Desktop': Math.floor(Math.random() * 30) + 5,
        'Tablet': Math.floor(Math.random() * 10) + 2,
      },
      locations: {
        'Local Area': Math.floor(Math.random() * 60) + 30,
        'Same State': Math.floor(Math.random() * 20) + 5,
        'National': Math.floor(Math.random() * 10) + 2,
        'International': Math.floor(Math.random() * 5),
      }
    }
  };
};

export default function PostAnalyticsPage() {
  const { toast } = useToast();
  const { locationId: paramLocationId } = useParams<{ locationId: string }>();
  
  // Use the location context
  const { selectedLocationId, setSelectedLocationId, locations } = useLocationContext();
  
  // Determine which location ID to use
  const effectiveLocationId = paramLocationId || (selectedLocationId?.toString() || "1");
  
  // State for time period selection
  const [timePeriod, setTimePeriod] = useState<'7days' | '30days' | '90days' | 'alltime'>('30days');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  
  // Fetch posts for the selected location
  const { data: posts, isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ['/api/posts', effectiveLocationId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/posts/${effectiveLocationId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load posts: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load posts');
        }
        
        return data.posts as Post[];
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
    },
    enabled: !!effectiveLocationId,
  });
  
  // Filter only published posts
  const publishedPosts = posts?.filter(post => post.status === "published") || [];
  
  // Set default selected post if none is selected and posts are loaded
  if (!selectedPostId && publishedPosts.length > 0) {
    setSelectedPostId(publishedPosts[0].id);
  }
  
  // Get analytics for selected post
  const selectedPostAnalytics = selectedPostId ? generateMockAnalytics(selectedPostId) : null;
  const selectedPost = publishedPosts.find(post => post.id === selectedPostId);
  
  // Prepare data for history chart
  const getHistoryChartData = () => {
    if (!selectedPostAnalytics) return null;
    
    // Get desired number of days based on time period
    let daysToShow = 30;
    if (timePeriod === '7days') daysToShow = 7;
    else if (timePeriod === '90days') daysToShow = 90;
    else if (timePeriod === 'alltime') daysToShow = selectedPostAnalytics.history.length;
    
    // Get the most recent days
    const history = selectedPostAnalytics.history.slice(-daysToShow);
    
    return {
      labels: history.map(day => format(new Date(day.date), 'MMM dd')),
      datasets: [
        {
          label: 'Views',
          data: history.map(day => day.views),
          backgroundColor: 'rgba(82, 145, 255, 0.5)',
          borderColor: 'rgba(82, 145, 255, 1)',
          borderWidth: 1,
        },
        {
          label: 'Engagements',
          data: history.map(day => day.engagements),
          backgroundColor: 'rgba(242, 140, 56, 0.5)',
          borderColor: 'rgba(242, 140, 56, 1)',
          borderWidth: 1,
        },
        {
          label: 'Clicks',
          data: history.map(day => day.clicks),
          backgroundColor: 'rgba(52, 199, 89, 0.5)',
          borderColor: 'rgba(52, 199, 89, 1)',
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Prepare data for audience charts
  const getAudienceData = () => {
    if (!selectedPostAnalytics) return null;
    
    return {
      age: {
        labels: Object.keys(selectedPostAnalytics.audience.age_groups),
        datasets: [{
          label: 'Age Distribution',
          data: Object.values(selectedPostAnalytics.audience.age_groups),
          backgroundColor: [
            'rgba(82, 145, 255, 0.7)',
            'rgba(242, 140, 56, 0.7)',
            'rgba(52, 199, 89, 0.7)',
            'rgba(255, 69, 58, 0.7)',
            'rgba(175, 82, 222, 0.7)',
          ],
          borderWidth: 1,
        }]
      },
      gender: {
        labels: Object.keys(selectedPostAnalytics.audience.gender),
        datasets: [{
          label: 'Gender Distribution',
          data: Object.values(selectedPostAnalytics.audience.gender),
          backgroundColor: [
            'rgba(82, 145, 255, 0.7)',
            'rgba(255, 69, 58, 0.7)',
            'rgba(175, 82, 222, 0.7)',
          ],
          borderWidth: 1,
        }]
      },
      devices: {
        labels: Object.keys(selectedPostAnalytics.audience.devices),
        datasets: [{
          label: 'Device Distribution',
          data: Object.values(selectedPostAnalytics.audience.devices),
          backgroundColor: [
            'rgba(242, 140, 56, 0.7)',
            'rgba(82, 145, 255, 0.7)',
            'rgba(52, 199, 89, 0.7)',
          ],
          borderWidth: 1,
        }]
      },
    };
  };
  
  // Handle location change
  const handleLocationChange = (value: string) => {
    setSelectedLocationId(parseInt(value));
    window.history.pushState(null, '', `/client/posts/analytics/${value}`);
    setSelectedPostId(null);
  };
  
  // Calculate engagement change from previous period
  const getEngagementChange = () => {
    if (!selectedPostAnalytics || !selectedPostAnalytics.history) return 0;
    
    const history = selectedPostAnalytics.history;
    const halfPoint = Math.floor(history.length / 2);
    
    const recentEngagements = history.slice(halfPoint).reduce((sum, day) => sum + day.engagements, 0);
    const previousEngagements = history.slice(0, halfPoint).reduce((sum, day) => sum + day.engagements, 0);
    
    if (previousEngagements === 0) return 100;
    
    return parseFloat(((recentEngagements - previousEngagements) / previousEngagements * 100).toFixed(1));
  };
  
  return (
    <div className="w-full pl-[70px] pr-[150px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">Post Analytics</h1>
        <div className="flex gap-2">
          <Select
            value={effectiveLocationId.toString()}
            onValueChange={handleLocationChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations?.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline" 
            className="gap-1 bg-gray-100 text-black hover:bg-gray-200"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-white text-black">
            <CardHeader>
              <CardTitle>Published Posts</CardTitle>
              <CardDescription>
                Select a post to view analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-[#F28C38] border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading posts...</p>
                </div>
              ) : postsError ? (
                <div className="text-center py-8 text-red-500">
                  Error loading posts. Please try again.
                </div>
              ) : publishedPosts.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-gray-500">No published posts</p>
                  <Button
                    className="mt-4 bg-[#F28C38] hover:bg-[#F5A461] text-white"
                    onClick={() => window.location.href = `/client/posts/${effectiveLocationId}`}
                  >
                    Create a Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {publishedPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPostId === post.id
                          ? 'border-[#F28C38] bg-orange-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPostId(post.id)}
                    >
                      <h3 className="font-medium text-black truncate">{post.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {post.published_at 
                          ? format(new Date(post.published_at), 'MMM dd, yyyy') 
                          : 'Unknown date'
                        }
                      </div>
                      <div className="mt-2">
                        <Badge className="bg-green-500 text-white">
                          Published
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3 space-y-6">
          {!selectedPost || !selectedPostAnalytics ? (
            <Card className="bg-white text-black">
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center">
                  <BarChart2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">Select a post to view analytics</h3>
                  <p className="text-gray-500 mt-1">
                    {publishedPosts.length > 0 
                      ? 'Choose a post from the sidebar to see detailed analytics' 
                      : 'Publish a post to start tracking analytics'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-white text-black p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-black">{selectedPost.title}</h2>
                      <Badge className="bg-green-500 text-white">
                        Published
                      </Badge>
                    </div>
                    <p className="text-gray-500 mt-1">
                      {selectedPost.published_at 
                        ? `Published on ${format(new Date(selectedPost.published_at), 'MMMM dd, yyyy')}` 
                        : 'Publication date unknown'
                      }
                    </p>
                  </div>
                  <div>
                    <Select
                      value={timePeriod}
                      onValueChange={(value: any) => setTimePeriod(value)}
                    >
                      <SelectTrigger className="w-[180px] bg-[#F28C38] hover:bg-[#F5A461] text-white">
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="90days">Last 90 days</SelectItem>
                        <SelectItem value="alltime">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white text-black">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Eye className="h-5 w-5 text-blue-500" />
                        </div>
                        <h3 className="font-medium text-gray-500">Total Views</h3>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-3xl font-bold text-black">{selectedPostAnalytics.views.toLocaleString()}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white text-black">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-orange-100">
                          <ThumbsUp className="h-5 w-5 text-orange-500" />
                        </div>
                        <h3 className="font-medium text-gray-500">Engagement Rate</h3>
                      </div>
                      <Badge className={`${
                        getEngagementChange() > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {getEngagementChange() > 0 ? '+' : ''}{getEngagementChange()}%
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-3xl font-bold text-black">{selectedPostAnalytics.engagement_rate}%</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white text-black">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-green-100">
                          <Share2 className="h-5 w-5 text-green-500" />
                        </div>
                        <h3 className="font-medium text-gray-500">Click Rate</h3>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-3xl font-bold text-black">{selectedPostAnalytics.click_through_rate}%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-white text-black">
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
                  <CardDescription>
                    View metrics over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {getHistoryChartData() && (
                      <Bar
                        data={getHistoryChartData()!}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              grid: {
                                display: false,
                              },
                            },
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white text-black">
                  <CardHeader>
                    <CardTitle>Engagement Breakdown</CardTitle>
                    <CardDescription>
                      Types of engagement with your post
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Likes</span>
                      </div>
                      <span className="font-semibold">{selectedPostAnalytics.likes}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Comments</span>
                      </div>
                      <span className="font-semibold">{selectedPostAnalytics.comments}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Shares</span>
                      </div>
                      <span className="font-semibold">{selectedPostAnalytics.shares}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Avg. Time on Page</span>
                      </div>
                      <span className="font-semibold">{selectedPostAnalytics.time_on_page} seconds</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white text-black">
                  <CardHeader>
                    <CardTitle>Performance Score</CardTitle>
                    <CardDescription>
                      Overall performance rating
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center">
                    <div 
                      className="w-40 h-40 rounded-full flex items-center justify-center border-8 mb-4"
                      style={{
                        borderColor: selectedPostAnalytics.performance_score >= 80 ? '#22c55e' :
                                    selectedPostAnalytics.performance_score >= 60 ? '#f59e0b' : '#ef4444',
                        borderRightColor: 'transparent'
                      }}
                    >
                      <div className="text-4xl font-bold">
                        {selectedPostAnalytics.performance_score}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="font-medium text-lg">
                        {selectedPostAnalytics.performance_score >= 80 ? 'Excellent' :
                         selectedPostAnalytics.performance_score >= 60 ? 'Good' : 'Needs Improvement'}
                      </h3>
                      <p className="text-gray-500 mt-1">
                        {selectedPostAnalytics.performance_score >= 80 ? 'This post is performing very well' :
                         selectedPostAnalytics.performance_score >= 60 ? 'This post is performing well, but could be better' : 
                         'This post needs optimization to improve performance'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-white text-black">
                <CardHeader>
                  <CardTitle>Audience Insights</CardTitle>
                  <CardDescription>
                    Demographic breakdown of post viewers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="age" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="age">
                        Age Groups
                      </TabsTrigger>
                      <TabsTrigger value="gender">
                        Gender
                      </TabsTrigger>
                      <TabsTrigger value="devices">
                        Devices
                      </TabsTrigger>
                    </TabsList>
                    
                    {getAudienceData() && (
                      <>
                        <TabsContent value="age">
                          <div className="h-[300px]">
                            <Bar
                              data={getAudienceData()!.age}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                              }}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="gender">
                          <div className="h-[300px] flex items-center justify-center">
                            <div className="w-[250px] h-[250px]">
                              <Pie
                                data={getAudienceData()!.gender}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                }}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="devices">
                          <div className="h-[300px] flex items-center justify-center">
                            <div className="w-[250px] h-[250px]">
                              <Pie
                                data={getAudienceData()!.devices}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                }}
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
              
              <Card className="bg-white text-black">
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>
                    Insights to improve this post's performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPostAnalytics.engagement_rate < 5 && (
                      <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <ThumbsUp className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-black">Improve Engagement</h4>
                          <p className="text-gray-700 mt-1">
                            Your engagement rate is below average. Consider adding a question or call-to-action in your post to encourage interaction.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedPostAnalytics.click_through_rate < 3 && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Share2 className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-black">Enhance CTA</h4>
                          <p className="text-gray-700 mt-1">
                            Your click-through rate could be improved. Make your call-to-action more prominent and compelling to drive more clicks.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!selectedPost.image_url && (
                      <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Eye className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-black">Add Visual Content</h4>
                          <p className="text-gray-700 mt-1">
                            Posts with images typically get 2.3x more engagement. Consider adding a relevant image to this post.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedPostAnalytics.performance_score >= 80 && (
                      <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-black">High Performing Post</h4>
                          <p className="text-gray-700 mt-1">
                            This post is performing well. Consider creating similar content to maintain engagement.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}