import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define data types for timeline analysis
interface TimelineDataPoint {
  date: string;
  value: number;
  competitors?: {
    [key: string]: number;
  };
}

interface CompetitorData {
  name: string;
  color: string;
  data: number[];
}

interface TimelineAnalysisProps {
  title: string;
  description: string;
  timelineData: {
    reviews?: TimelineDataPoint[];
    posts?: TimelineDataPoint[];
    photos?: TimelineDataPoint[];
  };
  competitors?: string[];
  rankingImpact?: {
    correlation: number;
    description: string;
  };
  enforceDataType?: 'reviews' | 'posts' | 'photos';
  keyInsights?: React.ReactNode;
}

// Color palette for competitors
const COMPETITOR_COLORS = [
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 99, 132, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(153, 102, 255, 0.8)',
];

// Your color palette from theme
const PRIMARY_COLOR = 'rgba(249, 115, 22, 0.8)'; // orange-500
const SECONDARY_COLOR = 'rgba(34, 197, 94, 0.7)'; // green-500

export function TimelineAnalysis({ 
  title, 
  description, 
  timelineData,
  competitors = [],
  rankingImpact,
  enforceDataType = 'reviews',
  keyInsights
}: TimelineAnalysisProps) {
  const [timeRange, setTimeRange] = useState('1y'); // 3m, 6m, 1y
  const [activeTab, setActiveTab] = useState<'reviews' | 'posts' | 'photos'>(enforceDataType);

  // Function to filter data based on time range
  const filterDataByTimeRange = (data: TimelineDataPoint[] | undefined) => {
    if (!data) return [];
    
    const now = new Date();
    const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    const cutoffDate = new Date(now.setMonth(now.getMonth() - months));
    
    return data.filter(point => new Date(point.date) >= cutoffDate);
  };

  // Get the filtered data for the current tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'reviews':
        return filterDataByTimeRange(timelineData.reviews);
      case 'posts':
        return filterDataByTimeRange(timelineData.posts);
      case 'photos':
        return filterDataByTimeRange(timelineData.photos);
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  // Prepare labels (dates) and datasets for the charts
  const chartLabels = currentData.map(point => {
    const date = new Date(point.date);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  // Prepare data for your business
  const yourData = currentData.map(point => point.value);

  // Prepare competitor data
  const competitorDatasets: CompetitorData[] = [];
  competitors.forEach((competitor, index) => {
    const color = COMPETITOR_COLORS[index % COMPETITOR_COLORS.length];
    const data = currentData.map(point => point.competitors?.[competitor] || 0);
    
    competitorDatasets.push({
      name: competitor,
      color,
      data
    });
  });

  // Line chart data for trends over time
  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Your Business',
        data: yourData,
        borderColor: PRIMARY_COLOR,
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        tension: 0.3,
        fill: true,
      },
      ...competitorDatasets.map(competitor => ({
        label: competitor.name,
        data: competitor.data,
        borderColor: competitor.color,
        backgroundColor: competitor.color.replace('0.8', '0.1'),
        tension: 0.3,
        fill: true,
      })),
    ],
  };

  // Bar chart data for monthly comparison
  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Your Business',
        data: yourData,
        backgroundColor: PRIMARY_COLOR,
      },
      ...competitorDatasets.map(competitor => ({
        label: competitor.name,
        data: competitor.data,
        backgroundColor: competitor.color,
      })),
    ],
  };

  // Custom line chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#000000',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#000000',
        }
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#000000',
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  // Custom bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#000000',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#000000',
        }
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#000000',
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
  };

  // Calculate the average values for comparison
  const calculateAverages = () => {
    if (currentData.length === 0) return { yours: 0, competitors: {} };
    
    const yours = yourData.reduce((sum, val) => sum + val, 0) / yourData.length;
    const competitors: Record<string, number> = {};
    
    competitorDatasets.forEach(competitor => {
      competitors[competitor.name] = competitor.data.reduce((sum, val) => sum + val, 0) / competitor.data.length;
    });
    
    return { yours, competitors };
  };

  const averages = calculateAverages();
  
  // Changes based on active tab
  const getTabTitle = () => {
    switch (activeTab) {
      case 'reviews':
        return 'Review Timeline';
      case 'posts':
        return 'Posts Timeline';
      case 'photos':
        return 'Photos Timeline';
      default:
        return 'Timeline';
    }
  };

  // Get action name based on active tab
  const getActionName = () => {
    switch (activeTab) {
      case 'reviews':
        return 'reviews received';
      case 'posts':
        return 'posts published';
      case 'photos':
        return 'photos uploaded';
      default:
        return 'items';
    }
  };

  return (
    <Card className="w-full shadow-md bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-black">{title}</CardTitle>
            <CardDescription className="text-gray-600">{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => setTimeRange('3m')} 
              variant={timeRange === '3m' ? 'default' : 'outline'} 
              size="sm"
            >
              3M
            </Button>
            <Button 
              onClick={() => setTimeRange('6m')} 
              variant={timeRange === '6m' ? 'default' : 'outline'} 
              size="sm"
            >
              6M
            </Button>
            <Button 
              onClick={() => setTimeRange('1y')} 
              variant={timeRange === '1y' ? 'default' : 'outline'} 
              size="sm"
            >
              1Y
            </Button>
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-4 mt-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-black">Trend Analysis</CardTitle>
                <CardDescription className="text-gray-600">
                  {getTabTitle()} over time compared to competitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-black">Monthly Comparison</CardTitle>
                <CardDescription className="text-gray-600">
                  Monthly {activeTab} compared to competitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-black">Performance Summary</CardTitle>
              <CardDescription className="text-gray-600">
                How your {activeTab} performance compares to competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-black">Your Average</h3>
                  <p className="text-2xl font-bold text-black">{averages.yours.toFixed(1)}</p>
                  <p className="text-sm text-black">{getActionName()} per month</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-black">Top Competitor</h3>
                  {Object.entries(averages.competitors).length > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-black">
                        {Math.max(...Object.values(averages.competitors)).toFixed(1)}
                      </p>
                      <p className="text-sm text-black">
                        {Object.entries(averages.competitors)
                          .sort((a, b) => b[1] - a[1])
                          .map(([name]) => name)[0] || 'None'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-black">0.0</p>
                      <p className="text-sm text-black">No competitor data</p>
                    </>
                  )}
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-black">Ranking Impact</h3>
                  <p className="text-2xl font-bold flex items-center text-black">
                    {rankingImpact?.correlation !== undefined ? (
                      <span className={rankingImpact.correlation > 0.5 ? 'text-green-600' : rankingImpact.correlation > 0.3 ? 'text-yellow-600' : 'text-black'}>
                        {rankingImpact.correlation > 0.5 ? 'High' : rankingImpact.correlation > 0.3 ? 'Medium' : 'Low'}
                      </span>
                    ) : (
                      'Unknown'
                    )}
                  </p>
                  <p className="text-sm text-black">
                    {rankingImpact?.description || `Impact on local rankings`}
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-black">Insights</h3>
                
                {/* Custom Key Insights if provided */}
                {keyInsights && activeTab === 'reviews' && (
                  <div className="mb-4">
                    {keyInsights}
                  </div>
                )}
                
                {activeTab === 'reviews' && (
                  <p className="text-sm text-black">
                    Your business averages {averages.yours.toFixed(1)} reviews per month, which is 
                    {Object.values(averages.competitors).length > 0 
                      ? ` ${averages.yours > Math.max(...Object.values(averages.competitors)) 
                          ? 'higher than' 
                          : 'lower than'} your top competitor (${Math.max(...Object.values(averages.competitors)).toFixed(1)} per month).`
                      : ' currently unmatched by competitors in our analysis.'
                    } 
                    Regular positive reviews have a {rankingImpact?.correlation 
                      ? rankingImpact.correlation > 0.5 ? 'strong' : rankingImpact.correlation > 0.3 ? 'moderate' : 'minor' 
                      : 'significant'} impact on local rankings.
                  </p>
                )}
                
                {activeTab === 'posts' && (
                  <p className="text-sm text-black">
                    You publish an average of {averages.yours.toFixed(1)} posts per month, which is 
                    {Object.values(averages.competitors).length > 0 
                      ? ` ${averages.yours > Math.max(...Object.values(averages.competitors)) 
                          ? 'more frequent than' 
                          : 'less frequent than'} your top competitor (${Math.max(...Object.values(averages.competitors)).toFixed(1)} per month).`
                      : ' currently unmatched by competitors in our analysis.'
                    } 
                    Consistent posting has a {rankingImpact?.correlation 
                      ? rankingImpact.correlation > 0.5 ? 'strong' : rankingImpact.correlation > 0.3 ? 'moderate' : 'minor' 
                      : 'measurable'} correlation with improved local visibility.
                  </p>
                )}
                
                {activeTab === 'photos' && (
                  <p className="text-sm text-black">
                    Your business adds approximately {averages.yours.toFixed(1)} photos per month, which is 
                    {Object.values(averages.competitors).length > 0 
                      ? ` ${averages.yours > Math.max(...Object.values(averages.competitors)) 
                          ? 'more than' 
                          : 'fewer than'} your top competitor (${Math.max(...Object.values(averages.competitors)).toFixed(1)} per month).`
                      : ' currently unmatched by competitors in our analysis.'
                    } 
                    High-quality business photos have a {rankingImpact?.correlation 
                      ? rankingImpact.correlation > 0.5 ? 'significant' : rankingImpact.correlation > 0.3 ? 'moderate' : 'subtle' 
                      : 'notable'} effect on user engagement and conversion rates.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}