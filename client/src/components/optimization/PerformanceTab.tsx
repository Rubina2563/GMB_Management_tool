/**
 * PerformanceTab Component
 * 
 * Displays current GBP performance metrics, historical trends, and provides
 * actionable insights based on the data analysis.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  PhoneIcon, 
  MousePointerIcon, 
  MapIcon, 
  EyeIcon 
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface PerformanceMetrics {
  calls: {
    current: number;
    previous: number;
    change_percent: number;
  };
  website_clicks: {
    current: number;
    previous: number;
    change_percent: number;
  };
  direction_requests: {
    current: number;
    previous: number;
    change_percent: number;
  };
  views: {
    current: number;
    previous: number;
    change_percent: number;
  };
}

interface HistoricalTrend {
  month: string;
  calls: number;
  website_clicks: number;
  direction_requests: number;
  views: number;
}

interface PerformanceData {
  score: number;
  metrics: PerformanceMetrics;
  historical_trends: HistoricalTrend[];
  recommendations: string[];
}

interface PerformanceTabProps {
  locationId: number;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ locationId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '9m' | '12m'>('6m');
  const [activeMetric, setActiveMetric] = useState<string>('views');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`/api/client/performance/metrics/${locationId}?timeframe=${timeframe}`);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch performance data');
        }
      } catch (error: any) {
        setError(error.response?.data?.message || error.message || 'Failed to fetch performance data');
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (locationId) {
      fetchPerformanceData();
    }
  }, [locationId, timeframe]);

  const getChangeColor = (percent: number) => {
    if (percent > 0) return 'text-green-600';
    if (percent < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = (percent: number) => {
    if (percent > 0) return <ArrowUpIcon className="w-4 h-4 text-green-600" />;
    if (percent < 0) return <ArrowDownIcon className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getMetricIcon = (metricName: string, className: string = "w-5 h-5") => {
    switch (metricName) {
      case 'calls':
        return <PhoneIcon className={className} />;
      case 'website_clicks':
        return <MousePointerIcon className={className} />;
      case 'direction_requests':
        return <MapIcon className={className} />;
      case 'views':
        return <EyeIcon className={className} />;
      default:
        return null;
    }
  };

  const formatMetricName = (metricName: string): string => {
    switch (metricName) {
      case 'calls':
        return 'Phone Calls';
      case 'website_clicks':
        return 'Website Clicks';
      case 'direction_requests':
        return 'Direction Requests';
      case 'views':
        return 'Profile Views';
      default:
        return metricName;
    }
  };

  const getPerformanceScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white">
          <CardHeader className="bg-white">
            <Skeleton className="h-8 w-1/3 bg-gray-200" />
          </CardHeader>
          <CardContent className="space-y-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border bg-white">
                  <CardContent className="pt-6 bg-white">
                    <Skeleton className="h-6 w-1/2 mb-2 bg-gray-200" />
                    <Skeleton className="h-10 w-3/4 bg-gray-200" />
                    <Skeleton className="h-4 w-1/4 mt-2 bg-gray-200" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-white">
              <CardHeader className="bg-white">
                <Skeleton className="h-6 w-1/4 bg-gray-200" />
              </CardHeader>
              <CardContent className="bg-white">
                <Skeleton className="h-[300px] w-full bg-gray-200" />
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="bg-white">
                <Skeleton className="h-6 w-1/3 bg-gray-200" />
              </CardHeader>
              <CardContent className="bg-white">
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full bg-gray-200" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4 bg-white border border-red-300">
        <AlertTitle className="text-red-600">Error</AlertTitle>
        <AlertDescription className="text-black">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert className="my-4 bg-white text-black border border-gray-200">
        <AlertTitle className="text-black">No Data</AlertTitle>
        <AlertDescription className="text-black">No performance data available for this location.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader className="pb-2 bg-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-black">Performance Overview</CardTitle>
            <div className="flex space-x-2">

              <Select value={timeframe} onValueChange={(value) => setTimeframe(value as '3m' | '6m' | '9m' | '12m')}>
                <SelectTrigger className="w-[180px] bg-white text-black border border-gray-300">
                  <SelectValue placeholder="Timeframe" className="text-black" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="3m" className="text-black">Last 3 Months</SelectItem>
                  <SelectItem value="6m" className="text-black">Last 6 Months</SelectItem>
                  <SelectItem value="9m" className="text-black">Last 9 Months</SelectItem>
                  <SelectItem value="12m" className="text-black">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription className="text-black">
            View your Google Business Profile performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 bg-white text-black">
          {/* Performance Score */}
          <Card className="border bg-white">
            <CardContent className="pt-6 bg-white">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-xl font-semibold mb-2 text-black">Performance Score</h3>
                <div className="relative h-36 w-36 flex items-center justify-center mb-2">
                  <div className="absolute inset-0">
                    <Progress 
                      value={data.score} 
                      className={`h-4 w-full rounded-full ${getPerformanceScoreColor(data.score)}`} 
                      style={{ 
                        height: '100%',
                        width: '100%',
                        borderRadius: '100%',
                        background: '#e5e7eb',
                        transform: 'rotate(-90deg)'
                      }}
                    />
                  </div>
                  <span className="text-4xl font-bold z-10 text-black">{data.score}</span>
                </div>
                <p className="text-sm text-black">
                  {data.score >= 80 ? 'Excellent' : 
                   data.score >= 60 ? 'Good' : 
                   data.score >= 40 ? 'Fair' : 'Needs Improvement'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['views', 'calls', 'website_clicks', 'direction_requests'] as const).map((metric) => (
              <Card key={metric} className="border cursor-pointer hover:shadow-md transition-shadow bg-white"
                onClick={() => setActiveMetric(metric)}>
                <CardContent className="pt-6 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    {getMetricIcon(metric)}
                    <h3 className="font-medium text-black">{formatMetricName(metric)}</h3>
                  </div>
                  <div className="text-3xl font-bold text-black">
                    {data.metrics[metric].current.toLocaleString()}
                  </div>
                  <div className="flex items-center mt-1 text-sm">
                    <span className={getChangeColor(data.metrics[metric].change_percent)}>
                      {getChangeIcon(data.metrics[metric].change_percent)}
                    </span>
                    <span className={getChangeColor(data.metrics[metric].change_percent)}>
                      {data.metrics[metric].change_percent > 0 ? '+' : ''}
                      {data.metrics[metric].change_percent}%
                    </span>
                    <span className="text-black ml-1">vs previous</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Historical Trends Chart */}
          <Card className="bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-black">Historical Trends</CardTitle>
              <CardDescription className="text-black">
                See how your metrics have changed over time
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <Tabs defaultValue={activeMetric} value={activeMetric} onValueChange={setActiveMetric}>
                <TabsList className="mb-4 border">
                  <TabsTrigger value="views" className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>Views</span>
                  </TabsTrigger>
                  <TabsTrigger value="calls" className="flex items-center gap-1">
                    <PhoneIcon className="w-4 h-4" />
                    <span>Calls</span>
                  </TabsTrigger>
                  <TabsTrigger value="website_clicks" className="flex items-center gap-1">
                    <MousePointerIcon className="w-4 h-4" />
                    <span>Website Clicks</span>
                  </TabsTrigger>
                  <TabsTrigger value="direction_requests" className="flex items-center gap-1">
                    <MapIcon className="w-4 h-4" />
                    <span>Directions</span>
                  </TabsTrigger>
                </TabsList>

                {/* Chart Content */}
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.historical_trends}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={activeMetric}
                        stroke="#F97316"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-black">Performance Recommendations</CardTitle>
              <CardDescription className="text-black">
                Actionable insights to improve your GBP performance
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <ul className="space-y-4">
                {data.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 bg-white">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm text-black">{rec}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="text-sm bg-white">
              <p className="text-black">Recommendations are based on your performance data and industry best practices.</p>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTab;