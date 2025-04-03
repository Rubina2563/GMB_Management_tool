import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Star, 
  TrendingDown, 
  TrendingUp, 
  Map,
  BarChart3,
  Calendar,
  ChevronRight,
  Link2,
  Activity as ActivityIcon
} from 'lucide-react';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export interface LocationMetricsData {
  // Ranking metrics
  rank: number;
  rankChange: number;
  
  // Review metrics
  reviewCount: number;
  reviewRating: string;
  
  // Post metrics
  postCount: number;
  lastPostDate: string;
  
  // Citation metrics
  totalCitations: number;
  missingCitations: number;
  
  // Engagement metrics
  weeklyViews: number;
  weeklyActions: number;
  weeklyDirections: number;
  weeklyCalls: number;
  
  // Health score
  healthScore: number;
}

interface LocationMetricsProps {
  metrics: LocationMetricsData;
  className?: string;
}

export default function LocationMetrics({ 
  metrics,
  className = ''
}: LocationMetricsProps) {
  const [timeframe, setTimeframe] = useState<string>("7");
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return 'N/A';
      
      // If date is more than 30 days ago, show the date
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (date < thirtyDaysAgo) {
        return format(date, 'MMM d, yyyy');
      }
      
      // Otherwise show relative time
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'N/A';
    }
  };

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
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Function to adjust metrics based on selected timeframe
  const getAdjustedMetrics = () => {
    const multiplier = timeframe === "7" ? 1 : timeframe === "30" ? 4 : 1;
    return {
      ...metrics,
      reviewCount: Math.round(metrics.reviewCount * (timeframe === "30" ? 1.2 : 1)), // Reviews don't scale linearly
      weeklyViews: metrics.weeklyViews * multiplier,
      weeklyActions: metrics.weeklyActions * multiplier,
      weeklyDirections: metrics.weeklyDirections * multiplier,
      weeklyCalls: metrics.weeklyCalls * multiplier,
      postCount: Math.round(metrics.postCount * (timeframe === "30" ? 1.5 : 1)),
    };
  };
  
  const adjustedMetrics = getAdjustedMetrics();

  return (
    <motion.div 
      className={`space-y-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Timeframe selector removed from here and moved to LocalDashboardTopBar */}
      
      {/* Key Metrics Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Review Summary Card */}
        <motion.div variants={itemVariants}>
          <Link href="/client/reviews">
            <Card className="bg-white shadow-sm border border-[#1C2526] cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium flex items-center text-[#1C2526] font-['Montserrat']">
                  <Star className="h-5 w-5 mr-2 text-[#F28C38]" />
                  Review Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mr-3">
                      <span className="text-xl font-bold text-[#1C2526]">{adjustedMetrics.reviewCount}</span>
                    </div>
                    <div>
                      <p className="text-sm text-black">Total Reviews</p>
                      <div className="flex items-center mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-3 w-3 ${
                              parseFloat(adjustedMetrics.reviewRating) >= star 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                        <span className="ml-1 text-sm font-medium">{adjustedMetrics.reviewRating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#1C2526]">Average Rating</span>
                    <ChevronRight className="h-4 w-4 text-[#F28C38]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Post Engagement Card */}
        <motion.div variants={itemVariants}>
          <Link href="/client/posts">
            <Card className="bg-white shadow-sm border border-[#1C2526] cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium flex items-center text-[#1C2526] font-['Montserrat']">
                  <Calendar className="h-5 w-5 mr-2 text-[#F28C38]" />
                  Post Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mr-3">
                      <span className="text-xl font-bold text-[#1C2526]">{adjustedMetrics.postCount}</span>
                    </div>
                    <div>
                      <p className="text-sm text-black">Total Posts</p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">{Math.round(adjustedMetrics.weeklyViews / 2)}</span> avg. views
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#1C2526]">Last post {formatDate(adjustedMetrics.lastPostDate)}</span>
                    <ChevronRight className="h-4 w-4 text-[#F28C38]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Ranking Trend Card */}
        <motion.div variants={itemVariants}>
          <Link href="/client/campaigns">
            <Card className="bg-white shadow-sm border border-[#1C2526] cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium flex items-center text-[#1C2526] font-['Montserrat']">
                  <Map className="h-5 w-5 mr-2 text-[#F28C38]" />
                  Ranking Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mr-3">
                      <span className="text-xl font-bold text-[#1C2526]">#{adjustedMetrics.rank}</span>
                    </div>
                    <div>
                      <p className="text-sm text-black">Avg. Position</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-sm font-medium flex items-center ${
                          adjustedMetrics.rankChange === 0 
                            ? 'text-black' 
                            : adjustedMetrics.rankChange < 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                        }`}>
                          {adjustedMetrics.rankChange === 0 
                            ? 'No change' 
                            : adjustedMetrics.rankChange < 0 
                              ? <><TrendingUp className="h-3 w-3 mr-1" /> +{Math.abs(adjustedMetrics.rankChange)}</> 
                              : <><TrendingDown className="h-3 w-3 mr-1" /> {adjustedMetrics.rankChange}</>}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#1C2526]">View Keywords</span>
                    <ChevronRight className="h-4 w-4 text-[#F28C38]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Citation Health Card */}
        <motion.div variants={itemVariants}>
          <Link href="/client/citations">
            <Card className="bg-white shadow-sm border border-[#1C2526] cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium flex items-center text-[#1C2526] font-['Montserrat']">
                  <Link2 className="h-5 w-5 mr-2 text-[#F28C38]" />
                  Citation Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mr-3">
                      <span className="text-xl font-bold text-[#1C2526]">{adjustedMetrics.totalCitations}</span>
                    </div>
                    <div>
                      <p className="text-sm text-black">Total Citations</p>
                      <p className="text-sm mt-1 text-red-500">
                        {adjustedMetrics.missingCitations} high-priority missing
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#1C2526]">View Citation Report</span>
                    <ChevronRight className="h-4 w-4 text-[#F28C38]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
        
        {/* GBP Audit Card */}
        <motion.div variants={itemVariants}>
          <Link href="/client/gbp-audit">
            <Card className="bg-white shadow-sm border border-[#1C2526] cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium flex items-center text-[#1C2526] font-['Montserrat']">
                  <ActivityIcon className="h-5 w-5 mr-2 text-[#F28C38]" />
                  GBP Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg font-bold text-[#1C2526]">{adjustedMetrics.healthScore}<span className="text-sm">%</span></span>
                    </div>
                    <div>
                      <p className="text-sm text-black">Audit Score</p>
                      <p className="text-sm mt-1 truncate w-24">
                        Last audit: {formatDate(new Date().toISOString())}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#1C2526]">Run New Audit</span>
                    <ChevronRight className="h-4 w-4 text-[#F28C38]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>
      
      {/* Optimization Progress Section removed */}
    </motion.div>
  );
}