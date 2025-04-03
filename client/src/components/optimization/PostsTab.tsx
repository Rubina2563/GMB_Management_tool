/**
 * PostsTab Component
 * 
 * Displays post analytics and recommends optimal posting schedules
 * based on real GBP metrics data.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  ChevronUp,
  ChevronDown,
  Clock,
  AreaChart,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  LineChart,
} from "lucide-react";

interface PostsTabProps {
  locationId: number;
}

interface PostingTimeAnalysis {
  bestTimes: {
    day: string;
    time: string;
    views: number;
    clicks: number;
  }[];
  worstTimes: {
    day: string;
    time: string;
    views: number;
    clicks: number;
  }[];
  recommendations: string[];
  score: number;
  industryBenchmarks?: {
    averagePostFrequency: number;
    topPerformingDays: string[];
    topPerformingHours: string[];
  };
  userPostingFrequency: number;
  postPerformanceTrend: 'increasing' | 'decreasing' | 'stable';
}

const PostsTab: React.FC<PostsTabProps> = ({ locationId }) => {
  const { toast } = useToast();
  
  // Fetch post analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics
  } = useQuery<{ success: boolean; message: string; data: PostingTimeAnalysis }>({
    queryKey: [`/api/client/posts/analytics/${locationId}`],
    queryFn: async () => {
      const response = await fetch(`/api/client/posts/analytics/${locationId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch post analytics data');
      }
      
      return response.json();
    },
    // Consider disabling automatic refetching to save API calls
    refetchOnWindowFocus: false
  });
  
  // Handle refresh analytics
  const handleRefreshAnalytics = () => {
    refetchAnalytics();
    toast({
      title: "Refreshing analytics",
      description: "Fetching the latest post analytics data.",
    });
  };
  
  // Calculate performance indicator color based on trend
  const getTrendColor = (trend: string) => {
    if (trend === 'increasing') return 'text-green-600';
    if (trend === 'decreasing') return 'text-red-600';
    return 'text-yellow-600';
  };
  
  // Get trend icon based on trend direction
  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (trend === 'decreasing') return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <LineChart className="h-5 w-5 text-yellow-600" />;
  };
  
  // Loading state
  if (analyticsLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (analyticsError || !analyticsData?.data) {
    return (
      <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load post analytics data. Please ensure your GBP profile is connected and try again.
        </AlertDescription>
        <Button 
          onClick={handleRefreshAnalytics} 
          variant="outline" 
          className="mt-2 border-red-200 text-red-800"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Alert>
    );
  }
  
  const analytics = analyticsData.data;
  
  return (
    <div className="space-y-6">
      {/* Header with Score and Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-black">Post Analytics</h2>
          <p className="text-gray-600">
            Optimize your posting schedule for maximum reach and engagement
          </p>
        </div>
        <div className="flex items-center">
          <div className="mr-4 text-center">
            <div className="text-4xl font-bold text-[#F97316]">
              {analytics.score}
              <span className="text-xl text-black">/100</span>
            </div>
            <p className="text-xs text-gray-600">Optimization Score</p>
          </div>
          <div className="flex space-x-2">

            <Button 
              variant="outline" 
              className="border-[#F97316] text-[#F97316] hover:bg-orange-50"
              onClick={handleRefreshAnalytics}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      {/* Performance Trend */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-black flex items-center">
            <AreaChart className="h-5 w-5 mr-2 text-[#F97316]" />
            Post Performance Trend
          </CardTitle>
          <CardDescription className="text-gray-600">
            Overall trend based on views and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getTrendIcon(analytics.postPerformanceTrend)}
              <div className="ml-3">
                <p className="font-medium text-black">
                  Your post performance is{' '}
                  <span className={getTrendColor(analytics.postPerformanceTrend)}>
                    {analytics.postPerformanceTrend}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Based on {analytics.userPostingFrequency.toFixed(1)} posts per week
                </p>
              </div>
            </div>
            <div>
              {analytics.industryBenchmarks && (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Industry avg: {analytics.industryBenchmarks.averagePostFrequency.toFixed(1)} posts/week
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Posting Times Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Posting Times */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-black flex items-center">
              <ChevronUp className="h-5 w-5 mr-2 text-green-600" />
              Best Posting Times
            </CardTitle>
            <CardDescription className="text-gray-600">
              Times with highest user engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.bestTimes.map((time, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                  <div className="flex items-center">
                    <div className="p-2 bg-white rounded-full mr-3">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-black">
                      <span className="font-medium">{time.day}</span> at{' '}
                      <span className="font-medium">{time.time}</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-3">
                      <div className="text-xs text-gray-600">Views</div>
                      <div className="font-medium text-black">{time.views}</div>
                    </div>
                    <Progress
                      value={Math.min(time.views, 100)}
                      className="h-2 w-20 bg-green-100"
                    />
                  </div>
                </div>
              ))}
              
              {analytics.bestTimes.length === 0 && (
                <div className="p-4 bg-gray-50 rounded-md text-gray-600 text-sm">
                  No best times data available. Publish more posts to generate analysis.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Worst Posting Times */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-black flex items-center">
              <ChevronDown className="h-5 w-5 mr-2 text-red-600" />
              Times to Avoid
            </CardTitle>
            <CardDescription className="text-gray-600">
              Times with lowest user engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.worstTimes.map((time, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                  <div className="flex items-center">
                    <div className="p-2 bg-white rounded-full mr-3">
                      <Clock className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm text-black">
                      <span className="font-medium">{time.day}</span> at{' '}
                      <span className="font-medium">{time.time}</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-3">
                      <div className="text-xs text-gray-600">Views</div>
                      <div className="font-medium text-black">{time.views}</div>
                    </div>
                    <Progress
                      value={Math.min(time.views * 2, 100)}
                      className="h-2 w-20 bg-red-100"
                    />
                  </div>
                </div>
              ))}
              
              {analytics.worstTimes.length === 0 && (
                <div className="p-4 bg-gray-50 rounded-md text-gray-600 text-sm">
                  No data available for times to avoid. Publish more posts to generate analysis.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recommendations */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-black flex items-center">
            <CalendarClock className="h-5 w-5 mr-2 text-[#F97316]" />
            Posting Recommendations
          </CardTitle>
          <CardDescription className="text-gray-600">
            Data-driven suggestions for improving post performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recommendations.map((rec, index) => (
              <div key={index} className="flex p-3 bg-orange-50 rounded-md">
                <div className="p-1 bg-white rounded-full mr-3 h-6 w-6 flex items-center justify-center text-[#F97316]">
                  {index + 1}
                </div>
                <p className="text-sm text-black">{rec}</p>
              </div>
            ))}
            
            {analytics.recommendations.length === 0 && (
              <div className="p-4 bg-gray-50 rounded-md text-gray-600 text-sm">
                No recommendations available. Publish more posts to generate personalized advice.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-100 pt-4">
          <Button 
            className="w-full bg-[#F97316] hover:bg-[#FB923C] text-white"
            onClick={() => window.location.href = `/client/posts/${locationId}`}
          >
            Create a New Post
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PostsTab;