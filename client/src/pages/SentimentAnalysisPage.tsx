import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  PieChartIcon,
  BarChart3Icon,
  LineChartIcon,
  CalendarIcon,
  FileTextIcon,
  HashIcon,
  SmileIcon,
  MehIcon,
  FrownIcon,
  DownloadIcon
} from "lucide-react";
import { colors, gradients } from "@/lib/colors";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface SentimentData {
  overview: {
    positive: number;
    neutral: number;
    negative: number;
    averageScore: number;
    reviewCount: number;
    sentimentTrend: {
      direction: 'up' | 'down' | 'stable';
      percentage: number;
    };
  };
  trends: {
    dates: string[];
    positive: number[];
    neutral: number[];
    negative: number[];
    averageScores: number[];
  };
  keywords: {
    positive: Array<{
      keyword: string;
      count: number;
      score: number;
    }>;
    negative: Array<{
      keyword: string;
      count: number;
      score: number;
    }>;
  };
}

export default function SentimentAnalysisPage() {
  const [location] = useLocation();
  
  // Extract locationId from the URL
  // In a real app this would be from the route params
  // For now we'll use a hardcoded value
  const locationId = "location_123"; // Mock location ID
  
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [timeframe, setTimeframe] = useState<string>("30days");
  
  // Fetch sentiment data
  const { 
    data: sentimentData = getMockSentimentData(), // Provide default value to avoid undefined errors
    isLoading: sentimentLoading,
    error: sentimentError
  } = useQuery({
    queryKey: ['/api/reviews/sentiment', locationId, timeframe],
    queryFn: async () => {
      // In a real app, we would make an API call here
      // For now, we'll return mock data
      return getMockSentimentData();
    }
  });
  
  // Helper function to generate mock sentiment data
  function getMockSentimentData(): SentimentData {
    // Generate dates for the past 30 days
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });
    
    // Generate random trend data
    const positive = Array.from({ length: 30 }, () => Math.floor(Math.random() * 15) + 10);
    const neutral = Array.from({ length: 30 }, () => Math.floor(Math.random() * 10) + 5);
    const negative = Array.from({ length: 30 }, () => Math.floor(Math.random() * 5) + 1);
    
    // Calculate average scores
    const averageScores = Array.from({ length: 30 }, (_, i) => {
      const total = positive[i] * 1 + neutral[i] * 0 + negative[i] * -1;
      const count = positive[i] + neutral[i] + negative[i];
      return parseFloat((total / count).toFixed(2));
    });
    
    // Calculate total counts
    const totalPositive = positive.reduce((a, b) => a + b, 0);
    const totalNeutral = neutral.reduce((a, b) => a + b, 0);
    const totalNegative = negative.reduce((a, b) => a + b, 0);
    const totalReviews = totalPositive + totalNeutral + totalNegative;
    
    // Calculate average sentiment score
    const averageScore = parseFloat(((totalPositive - totalNegative) / totalReviews).toFixed(2));
    
    // Generate positive keywords
    const positiveKeywords = [
      { keyword: "excellent", count: Math.floor(Math.random() * 20) + 30, score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) },
      { keyword: "friendly", count: Math.floor(Math.random() * 20) + 25, score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) },
      { keyword: "helpful", count: Math.floor(Math.random() * 15) + 20, score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) },
      { keyword: "great service", count: Math.floor(Math.random() * 15) + 15, score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) },
      { keyword: "professional", count: Math.floor(Math.random() * 10) + 10, score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) },
      { keyword: "recommended", count: Math.floor(Math.random() * 10) + 8, score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) },
      { keyword: "best", count: Math.floor(Math.random() * 8) + 5, score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) },
      { keyword: "fast", count: Math.floor(Math.random() * 5) + 3, score: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)) }
    ];
    
    // Generate negative keywords
    const negativeKeywords = [
      { keyword: "slow", count: Math.floor(Math.random() * 10) + 5, score: parseFloat((-Math.random() * 0.3 - 0.7).toFixed(2)) },
      { keyword: "expensive", count: Math.floor(Math.random() * 8) + 4, score: parseFloat((-Math.random() * 0.3 - 0.7).toFixed(2)) },
      { keyword: "rude", count: Math.floor(Math.random() * 5) + 3, score: parseFloat((-Math.random() * 0.3 - 0.7).toFixed(2)) },
      { keyword: "disappointing", count: Math.floor(Math.random() * 5) + 2, score: parseFloat((-Math.random() * 0.3 - 0.7).toFixed(2)) },
      { keyword: "poor service", count: Math.floor(Math.random() * 4) + 2, score: parseFloat((-Math.random() * 0.3 - 0.7).toFixed(2)) },
      { keyword: "not happy", count: Math.floor(Math.random() * 3) + 1, score: parseFloat((-Math.random() * 0.3 - 0.7).toFixed(2)) }
    ];
    
    return {
      overview: {
        positive: totalPositive,
        neutral: totalNeutral,
        negative: totalNegative,
        averageScore,
        reviewCount: totalReviews,
        sentimentTrend: {
          direction: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          percentage: parseFloat((Math.random() * 15).toFixed(1))
        }
      },
      trends: {
        dates,
        positive,
        neutral,
        negative,
        averageScores
      },
      keywords: {
        positive: positiveKeywords,
        negative: negativeKeywords
      }
    };
  }
  
  // Listen for submenu clicks
  useEffect(() => {
    const handleSubMenuClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.id) {
        setActiveTab(customEvent.detail.id);
      }
    };
    
    window.addEventListener('submenuClicked', handleSubMenuClick);
    
    return () => {
      window.removeEventListener('submenuClicked', handleSubMenuClick);
    };
  }, []);
  
  // Helper function to get sentiment color
  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'rgb(34, 197, 94)';
      case 'neutral':
        return 'rgb(234, 179, 8)';
      case 'negative':
        return 'rgb(239, 68, 68)';
      default:
        return 'rgb(156, 163, 175)';
    }
  };
  
  const pieChartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: sentimentData ? [
          sentimentData.overview.positive,
          sentimentData.overview.neutral,
          sentimentData.overview.negative
        ] : [0, 0, 0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(22, 163, 74)',
          'rgb(202, 138, 4)',
          'rgb(220, 38, 38)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const sentimentTrendData = {
    labels: sentimentData ? sentimentData.trends.dates : [],
    datasets: [
      {
        label: 'Positive',
        data: sentimentData ? sentimentData.trends.positive : [],
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(22, 163, 74)',
        borderWidth: 1,
      },
      {
        label: 'Neutral',
        data: sentimentData ? sentimentData.trends.neutral : [],
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        borderColor: 'rgb(202, 138, 4)',
        borderWidth: 1,
      },
      {
        label: 'Negative',
        data: sentimentData ? sentimentData.trends.negative : [],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(220, 38, 38)',
        borderWidth: 1,
      }
    ],
  };
  
  const sentimentScoreData = {
    labels: sentimentData ? sentimentData.trends.dates : [],
    datasets: [
      {
        label: 'Average Sentiment Score',
        data: sentimentData ? sentimentData.trends.averageScores : [],
        fill: false,
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(79, 70, 229)',
        tension: 0.1,
      }
    ],
  };
  
  const positiveKeywordsData = {
    labels: sentimentData ? sentimentData.keywords.positive.map(k => k.keyword) : [],
    datasets: [
      {
        label: 'Occurrences',
        data: sentimentData ? sentimentData.keywords.positive.map(k => k.count) : [],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(22, 163, 74)',
        borderWidth: 1,
      }
    ],
  };
  
  const negativeKeywordsData = {
    labels: sentimentData ? sentimentData.keywords.negative.map(k => k.keyword) : [],
    datasets: [
      {
        label: 'Occurrences',
        data: sentimentData ? sentimentData.keywords.negative.map(k => k.count) : [],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(220, 38, 38)',
        borderWidth: 1,
      }
    ],
  };
  
  return (
    <div className="w-full pl-[70px] pr-[150px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.text.dark }}>Sentiment Analysis</h1>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-black" />
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            style={{ backgroundColor: colors.orange.base, color: 'white' }}
            className="hover:bg-[#F5A461] gap-1"
            size="sm" 
          >
            <DownloadIcon className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">
            Sentiment Overview
          </TabsTrigger>
          <TabsTrigger value="trends">
            Sentiment Trends
          </TabsTrigger>
          <TabsTrigger value="keywords">
            Keyword Analysis
          </TabsTrigger>
          <TabsTrigger value="reports">
            Sentiment Reports
          </TabsTrigger>
        </TabsList>
        
        {sentimentLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
          </div>
        ) : sentimentError ? (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-500">Error loading sentiment data. Please try again.</p>
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] flex justify-center items-center">
                      <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </CardContent>
                  <CardFooter className="px-6 py-3 border-t flex justify-between text-sm text-black">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      <span>Positive</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                      <span>Neutral</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                      <span>Negative</span>
                    </div>
                  </CardFooter>
                </Card>
                
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sentiment Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Average Sentiment Score</span>
                          <span className="text-sm font-medium" style={{
                            color: sentimentData.overview.averageScore > 0.3 ? 'rgb(22, 163, 74)' : 
                                  sentimentData.overview.averageScore < -0.3 ? 'rgb(220, 38, 38)' : 
                                  'rgb(202, 138, 4)'
                          }}>
                            {sentimentData.overview.averageScore.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={(sentimentData.overview.averageScore + 1) * 50} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                          <SmileIcon className="h-6 w-6 text-green-500 mb-1" />
                          <span className="font-semibold text-lg text-green-700">
                            {sentimentData.overview.positive}
                          </span>
                          <span className="text-xs text-gray-600">Positive</span>
                        </div>
                        
                        <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
                          <MehIcon className="h-6 w-6 text-yellow-500 mb-1" />
                          <span className="font-semibold text-lg text-yellow-700">
                            {sentimentData.overview.neutral}
                          </span>
                          <span className="text-xs text-gray-600">Neutral</span>
                        </div>
                        
                        <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
                          <FrownIcon className="h-6 w-6 text-red-500 mb-1" />
                          <span className="font-semibold text-lg text-red-700">
                            {sentimentData.overview.negative}
                          </span>
                          <span className="text-xs text-gray-600">Negative</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Overall Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[250px]">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{
                          background: sentimentData.overview.averageScore > 0.3 ? 'rgba(34, 197, 94, 0.1)' : 
                                     sentimentData.overview.averageScore < -0.3 ? 'rgba(239, 68, 68, 0.1)' : 
                                     'rgba(234, 179, 8, 0.1)',
                          border: `2px solid ${
                            sentimentData.overview.averageScore > 0.3 ? 'rgb(22, 163, 74)' : 
                            sentimentData.overview.averageScore < -0.3 ? 'rgb(220, 38, 38)' : 
                            'rgb(202, 138, 4)'
                          }`
                        }}>
                          {sentimentData.overview.averageScore > 0.3 ? (
                            <SmileIcon className="h-10 w-10 text-green-500" />
                          ) : sentimentData.overview.averageScore < -0.3 ? (
                            <FrownIcon className="h-10 w-10 text-red-500" />
                          ) : (
                            <MehIcon className="h-10 w-10 text-yellow-500" />
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold mb-1" style={{
                          color: sentimentData.overview.averageScore > 0.3 ? 'rgb(22, 163, 74)' : 
                                 sentimentData.overview.averageScore < -0.3 ? 'rgb(220, 38, 38)' : 
                                 'rgb(202, 138, 4)'
                        }}>
                          {sentimentData.overview.averageScore > 0.3 ? 'Positive' : 
                           sentimentData.overview.averageScore < -0.3 ? 'Negative' : 
                           'Neutral'}
                        </h3>
                        
                        <p className="text-sm text-black">
                          Based on {sentimentData.overview.reviewCount} reviews
                        </p>
                        
                        <div className="mt-6 flex items-center justify-center">
                          {sentimentData.overview.sentimentTrend.direction === 'up' ? (
                            <div className="flex items-center text-green-600">
                              <TrendingUpIcon className="h-5 w-5 mr-1" />
                              <span>+{sentimentData.overview.sentimentTrend.percentage}% from previous period</span>
                            </div>
                          ) : sentimentData.overview.sentimentTrend.direction === 'down' ? (
                            <div className="flex items-center text-red-600">
                              <TrendingDownIcon className="h-5 w-5 mr-1" />
                              <span>-{sentimentData.overview.sentimentTrend.percentage}% from previous period</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-yellow-600">
                              <span>No change from previous period</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Top Positive Keywords</CardTitle>
                    <CardDescription className="text-black">
                      Most frequently mentioned positive terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sentimentData.keywords.positive.slice(0, 5).map((keyword, i) => (
                        <div key={i} className="flex items-center">
                          <div className="w-32 truncate">
                            <span className="text-sm font-medium">{keyword.keyword}</span>
                          </div>
                          <div className="flex-1 mx-3">
                            <div className="h-2 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-green-500"
                                style={{
                                  width: `${(keyword.count / sentimentData.keywords.positive[0].count) * 100}%`
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-12 text-right">
                            <span className="text-sm font-medium">{keyword.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Top Negative Keywords</CardTitle>
                    <CardDescription className="text-black">
                      Most frequently mentioned negative terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sentimentData.keywords.negative.slice(0, 5).map((keyword, i) => (
                        <div key={i} className="flex items-center">
                          <div className="w-32 truncate">
                            <span className="text-sm font-medium">{keyword.keyword}</span>
                          </div>
                          <div className="flex-1 mx-3">
                            <div className="h-2 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-red-500"
                                style={{
                                  width: `${(keyword.count / sentimentData.keywords.negative[0].count) * 100}%`
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-12 text-right">
                            <span className="text-sm font-medium">{keyword.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-0">
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Sentiment Trend</CardTitle>
                    <CardDescription className="text-black">
                      Positive, neutral, and negative sentiment over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <Bar 
                        data={sentimentTrendData}
                        options={{
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              stacked: true,
                              grid: {
                                display: false
                              }
                            },
                            y: {
                              stacked: true,
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Sentiment Score Trend</CardTitle>
                    <CardDescription className="text-black">
                      Average sentiment score over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <Line
                        data={sentimentScoreData}
                        options={{
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              min: -1,
                              max: 1,
                              grid: {
                                color: 'rgba(200, 200, 200, 0.2)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="keywords" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Positive Keywords</CardTitle>
                    <CardDescription className="text-black">
                      Keywords associated with positive sentiment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <Bar 
                        data={positiveKeywordsData}
                        options={{
                          indexAxis: 'y',
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Negative Keywords</CardTitle>
                    <CardDescription className="text-black">
                      Keywords associated with negative sentiment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <Bar 
                        data={negativeKeywordsData}
                        options={{
                          indexAxis: 'y',
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 md:col-span-2 bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Keyword Insights</CardTitle>
                    <CardDescription className="text-black">
                      Detailed analysis of keyword mentions and sentiment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-3 text-black">Positive Keyword Context</h3>
                        <div className="space-y-3">
                          {sentimentData.keywords.positive.slice(0, 3).map((keyword, i) => (
                            <div key={i} className="bg-green-50 p-3 rounded-lg">
                              <h4 className="font-medium text-green-700">{keyword.keyword}</h4>
                              <p className="text-sm mt-1 text-black">
                                "...customers frequently mention {keyword.keyword} when referring to our staff and service quality..."
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3 text-black">Negative Keyword Context</h3>
                        <div className="space-y-3">
                          {sentimentData.keywords.negative.slice(0, 3).map((keyword, i) => (
                            <div key={i} className="bg-red-50 p-3 rounded-lg">
                              <h4 className="font-medium text-red-700">{keyword.keyword}</h4>
                              <p className="text-sm mt-1 text-black">
                                "...customers occasionally mention {keyword.keyword} in relation to wait times and pricing concerns..."
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="reports" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Available Reports</CardTitle>
                    <CardDescription className="text-black">
                      Generated sentiment analysis reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FileTextIcon className="h-5 w-5 text-black mr-3" />
                          <div>
                            <p className="font-medium">Monthly Sentiment Report</p>
                            <p className="text-xs text-black">March 2025</p>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          style={{ backgroundColor: colors.orange.base, color: 'white' }}
                          className="hover:bg-[#F5A461]"
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FileTextIcon className="h-5 w-5 text-black mr-3" />
                          <div>
                            <p className="font-medium">Quarterly Sentiment Analysis</p>
                            <p className="text-xs text-black">Q1 2025</p>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          style={{ backgroundColor: colors.orange.base, color: 'white' }}
                          className="hover:bg-[#F5A461]"
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FileTextIcon className="h-5 w-5 text-black mr-3" />
                          <div>
                            <p className="font-medium">Customer Satisfaction Report</p>
                            <p className="text-xs text-black">February 2025</p>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          style={{ backgroundColor: colors.orange.base, color: 'white' }}
                          className="hover:bg-[#F5A461]"
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white text-black border border-gray-200">
                  <CardHeader>
                    <CardTitle>Schedule Reports</CardTitle>
                    <CardDescription className="text-black">
                      Set up automatic report generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-3">Report Types</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" id="monthly" className="h-4 w-4 mr-2" defaultChecked />
                            <label htmlFor="monthly" className="text-sm text-black">Monthly Sentiment Summary</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="quarterly" className="h-4 w-4 mr-2" defaultChecked />
                            <label htmlFor="quarterly" className="text-sm text-black">Quarterly Sentiment Analysis</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="keyword" className="h-4 w-4 mr-2" />
                            <label htmlFor="keyword" className="text-sm text-black">Keyword Trend Reports</label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Delivery Options</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" id="email" className="h-4 w-4 mr-2" defaultChecked />
                            <label htmlFor="email" className="text-sm text-black">Email Reports</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="dashboard" className="h-4 w-4 mr-2" defaultChecked />
                            <label htmlFor="dashboard" className="text-sm text-black">Dashboard Notifications</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="download" className="h-4 w-4 mr-2" />
                            <label htmlFor="download" className="text-sm text-black">Automatic Downloads</label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Button 
                          style={{ backgroundColor: colors.orange.base, color: 'white' }}
                          className="w-full hover:bg-[#F5A461]"
                        >
                          Save Report Preferences
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}