import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Calendar, 
  TrendingUp, 
  Eye, 
  ArrowRight,
  SlidersHorizontal,
  Loader2,
  Download,
  BarChart3,
  LineChart
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageAnalyticsProps {
  locationId: string | number;
}

// Mock analytics data
const mockOverviewData = {
  totalImages: 32,
  totalViews: 4782,
  avgViewsPerImage: 149,
  viewsLastMonth: 1243,
  viewsGrowth: 18.7, // percentage
  topPerformer: 'Store Front',
  topPerformerViews: 842,
  lowPerformer: 'Product Display (Old)',
  lowPerformerViews: 28,
};

const mockTimelineData = [
  { date: '2024-01', views: 920 },
  { date: '2024-02', views: 1105 },
  { date: '2024-03', views: 1243 },
];

const mockImagePerformanceData = [
  { 
    id: 1,
    image: 'https://placehold.co/60x60/F28C38/FFFFFF/png?text=Front',
    name: 'Store Front',
    category: 'Exterior',
    views: 842,
    clicks: 123,
    ctr: 14.6,
    trend: 'up'
  },
  { 
    id: 2,
    image: 'https://placehold.co/60x60/F28C38/FFFFFF/png?text=Team',
    name: 'Team Photo',
    category: 'Team',
    views: 731,
    clicks: 98,
    ctr: 13.4,
    trend: 'up'
  },
  { 
    id: 3,
    image: 'https://placehold.co/60x60/F28C38/FFFFFF/png?text=Interior',
    name: 'Store Interior',
    category: 'Interior',
    views: 689,
    clicks: 87,
    ctr: 12.6,
    trend: 'same'
  },
  { 
    id: 4,
    image: 'https://placehold.co/60x60/F28C38/FFFFFF/png?text=Products',
    name: 'Product Display',
    category: 'Products',
    views: 587,
    clicks: 68,
    ctr: 11.6,
    trend: 'up'
  },
  { 
    id: 5,
    image: 'https://placehold.co/60x60/F28C38/FFFFFF/png?text=Service',
    name: 'Service Area',
    category: 'Services',
    views: 492,
    clicks: 51,
    ctr: 10.4,
    trend: 'down'
  },
];

const mockCategoryPerformanceData = [
  { name: 'Exterior', views: 1253, share: 26.2 },
  { name: 'Interior', views: 1089, share: 22.8 },
  { name: 'Team', views: 982, share: 20.5 },
  { name: 'Products', views: 843, share: 17.6 },
  { name: 'Services', views: 615, share: 12.9 },
];

const ImageAnalytics: React.FC<ImageAnalyticsProps> = ({ locationId }) => {
  const [timeframe, setTimeframe] = useState('90days');
  const { toast } = useToast();

  // Simulate fetching analytics data
  const { data, isLoading, error } = useQuery({
    queryKey: ['image-analytics', locationId, timeframe],
    queryFn: async () => {
      // In a real implementation, this would be an API call with the selected timeframe
      // For now, we'll just return mock data after a simulated delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            overview: mockOverviewData,
            timeline: mockTimelineData,
            imagePerformance: mockImagePerformanceData,
            categoryPerformance: mockCategoryPerformanceData,
          });
        }, 1000);
      });
    },
  });

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  const handleExportReport = () => {
    toast({
      title: "Report Exported",
      description: "Your image analytics report is being downloaded.",
      variant: "default",
    });
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      default:
        return <ArrowRight className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#F28C38]" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
        Error loading analytics data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <SlidersHorizontal className="h-5 w-5 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-black mr-3">Filter by:</span>
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[180px] text-black">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExportReport} className="flex items-center text-black bg-white">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Views</p>
                <h3 className="text-2xl font-bold text-black mt-1">{data?.overview.totalViews.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-[#F28C38]/10 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-[#F28C38]" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+{data?.overview.viewsGrowth}%</span>
              <span className="text-gray-500 ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Images</p>
                <h3 className="text-2xl font-bold text-black mt-1">{data?.overview.totalImages}</h3>
              </div>
              <div className="h-12 w-12 bg-[#F28C38]/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-[#F28C38]" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <span className="text-gray-500">Avg. {data?.overview.avgViewsPerImage} views per image</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Top Performer</p>
                <h3 className="text-2xl font-bold text-black mt-1">{data?.overview.topPerformerViews.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-[#F28C38]/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#F28C38]" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <span className="text-gray-600 font-medium">{data?.overview.topPerformer}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <h3 className="text-2xl font-bold text-black mt-1">{data?.overview.viewsLastMonth.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-[#F28C38]/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-[#F28C38]" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-sm">
              <span className="text-gray-500">Monthly tracking</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-black">Views Over Time</CardTitle>
            <CardDescription className="text-gray-600">
              Track your images' view count trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Chart placeholder - in a real implementation, this would be a real chart */}
            <div className="bg-gray-50 rounded-lg h-[300px] flex items-center justify-center">
              <div className="text-center">
                <LineChart className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  Line chart visualization of image views over time would appear here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-black">Category Performance</CardTitle>
            <CardDescription className="text-gray-600">
              Views distribution by image category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Chart placeholder - in a real implementation, this would be a real chart */}
            <div className="bg-gray-50 rounded-lg h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  Bar chart visualization of views by category would appear here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top performing images */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-black">Image Performance</CardTitle>
          <CardDescription className="text-gray-600">
            Analytics for your top performing images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-black">Image</th>
                  <th className="text-left py-3 px-4 font-medium text-black">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-black">Views</th>
                  <th className="text-right py-3 px-4 font-medium text-black">Clicks</th>
                  <th className="text-right py-3 px-4 font-medium text-black">CTR</th>
                  <th className="text-right py-3 px-4 font-medium text-black">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data?.imagePerformance.map((image: any) => (
                  <tr key={image.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <img 
                          src={image.image} 
                          alt={image.name}
                          className="h-8 w-8 rounded object-cover mr-3"
                        />
                        <span className="font-medium text-black">{image.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-black">{image.category}</td>
                    <td className="py-3 px-4 text-right text-black">{image.views.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-black">{image.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-black">{image.ctr}%</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end">
                        {getTrendIcon(image.trend)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category performance breakdown */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-black">Category Breakdown</CardTitle>
          <CardDescription className="text-gray-600">
            View distribution across different image categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.categoryPerformance.map((category: any) => (
              <div key={category.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-black">{category.name}</span>
                  <span className="text-gray-600">{category.views.toLocaleString()} views ({category.share}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#F28C38] rounded-full" 
                    style={{ width: `${category.share}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageAnalytics;