import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  MessageSquare, Star, TrendingUp, Building, 
  CalendarDays, AlertCircle, Award, Clock,
  FileSearch, Filter, Check, Info, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  locationId: number | null;
  locationName: string;
  actionLabel?: string;
  actionLink?: string;
  status?: string;
  severity?: 'success' | 'warning' | 'info' | 'danger';
  reviewer?: string;
  rating?: number;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  selectedLocationId: number | null;
  maxItems?: number;
}

type ActivityFilter = 'all' | 'review' | 'post' | 'ranking' | 'citation' | 'audit' | 'campaign';

export default function RecentActivity({ 
  activities, 
  selectedLocationId,
  maxItems = 10 
}: RecentActivityProps) {
  // State for activity type filter
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');
  
  // Filter activities by selected location and type
  const filteredActivities = activities
    .filter(activity => 
      !selectedLocationId || 
      activity.locationId === selectedLocationId || 
      activity.locationId === null
    )
    .filter(activity => 
      activeFilter === 'all' || activity.type === activeFilter
    )
    .slice(0, maxItems);

  if (filteredActivities.length === 0) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center text-[#000000]">
            <Clock className="h-5 w-5 mr-2 text-[#F28C38]" />
            Recent Activity
          </CardTitle>
          <div className="text-sm text-[#000000]">
            Activity updates from all connected services
          </div>
        </CardHeader>
        <CardContent className="text-center py-6 text-black">
          No recent activity for the selected location.
        </CardContent>
      </Card>
    );
  }

  // Format relative time
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Get icon based on activity type and severity
  const getActivityIcon = (activity: ActivityItem) => {
    // Use severity to determine background color
    const bgColor = getSeverityColor(activity.severity, 'bg');
    const textColor = getSeverityColor(activity.severity, 'text');

    // Get icon based on type
    switch (activity.type) {
      case 'review':
        return (
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <MessageSquare className={`h-4 w-4 ${textColor}`} />
          </div>
        );
      case 'ranking':
        return (
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <TrendingUp className={`h-4 w-4 ${textColor}`} />
          </div>
        );
      case 'post':
        return (
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <CalendarDays className={`h-4 w-4 ${textColor}`} />
          </div>
        );
      case 'citation':
        return (
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <Building className={`h-4 w-4 ${textColor}`} />
          </div>
        );
      case 'campaign':
        return (
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <Award className={`h-4 w-4 ${textColor}`} />
          </div>
        );
      case 'audit':
        return (
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <FileSearch className={`h-4 w-4 ${textColor}`} />
          </div>
        );
      default:
        return (
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <AlertCircle className={`h-4 w-4 ${textColor}`} />
          </div>
        );
    }
  };
  
  // Get color based on severity
  const getSeverityColor = (severity?: string, type: 'bg' | 'text' = 'bg') => {
    if (type === 'bg') {
      switch (severity) {
        case 'success':
          return 'bg-green-100';
        case 'warning':
          return 'bg-yellow-100';
        case 'danger':
          return 'bg-red-100';
        case 'info':
          return 'bg-blue-100';
        default:
          return 'bg-gray-100';
      }
    } else {
      switch (severity) {
        case 'success':
          return 'text-green-700';
        case 'warning':
          return 'text-yellow-700';
        case 'danger':
          return 'text-red-700';
        case 'info':
          return 'text-blue-700';
        default:
          return 'text-black';
      }
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

  // Activity Type Filter options
  const filterOptions: { value: ActivityFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Filter className="h-4 w-4" /> },
    { value: 'review', label: 'Reviews', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'post', label: 'Posts', icon: <CalendarDays className="h-4 w-4" /> },
    { value: 'ranking', label: 'Rankings', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'citation', label: 'Citations', icon: <Building className="h-4 w-4" /> },
    { value: 'audit', label: 'Audits', icon: <FileSearch className="h-4 w-4" /> },
    { value: 'campaign', label: 'Campaigns', icon: <Award className="h-4 w-4" /> },
  ];
  
  // Get star rating display for reviews
  const renderRatingStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-0.5 mt-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };
  
  // Get status badge
  const renderStatusBadge = (status?: string, severity?: string) => {
    if (!status) return null;
    
    // Color mapping for different status types
    const getBadgeStyles = () => {
      switch (severity) {
        case 'success':
          return 'bg-green-100 text-green-800 border border-green-300';
        case 'info':
          return 'bg-blue-100 text-blue-800 border border-blue-300';
        case 'warning':
          return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
        case 'danger':
          return 'bg-red-100 text-red-800 border border-red-300';
        default:
          return 'bg-gray-100 text-gray-800 border border-gray-300';
      }
    };
    
    return (
      <Badge variant="outline" className={`ml-2 text-xs font-medium ${getBadgeStyles()}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Animations for filter buttons
  const filterVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100">
        <div className="flex flex-col space-y-3">
          <CardTitle className="text-lg font-semibold flex items-center text-[#000000]">
            <Clock className="h-5 w-5 mr-2 text-[#F28C38]" />
            Recent Activity
          </CardTitle>
          <div className="text-sm text-[#000000]">
            Activity updates from all connected services
          </div>
          
          {/* Activity type filters */}
          <div className="flex flex-wrap gap-2 pt-2">
            {filterOptions.map((option) => (
              <motion.div
                key={option.value}
                variants={filterVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Button
                  size="sm"
                  variant={activeFilter === option.value ? 'default' : 'outline'}
                  className={`rounded-full text-xs px-3 ${
                    activeFilter === option.value ? 'bg-[#F28C38] hover:bg-[#F28C38]/90 text-black' : 'bg-[#F28C38] text-black'
                  }`}
                  onClick={() => setActiveFilter(option.value)}
                >
                  <span className="flex items-center">
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <motion.div 
          className="divide-y"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredActivities.length === 0 ? (
            <div className="py-8 text-center text-black">
              No {activeFilter !== 'all' ? activeFilter : ''} activities found.
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <motion.div 
                key={activity.id} 
                className="py-4 px-6 flex items-start hover:bg-gray-50 transition-colors duration-200"
                variants={itemVariants}
              >
                <div className="mr-4">
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-[#000000]">{activity.description}</p>
                    {renderStatusBadge(activity.status, activity.severity)}
                  </div>
                  
                  {activity.reviewer && (
                    <p className="text-xs text-black mt-1">
                      From: {activity.reviewer}
                    </p>
                  )}
                  
                  {activity.rating !== undefined && renderRatingStars(activity.rating)}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs text-black">
                      <span className="font-medium text-[#000000] mr-2">{activity.locationName}</span>
                      <span>{formatTime(activity.timestamp)}</span>
                    </div>
                    
                    {activity.actionLabel && activity.actionLink && (
                      <Link to={activity.actionLink}>
                        <Button size="sm" variant="link" className="h-6 p-0 font-medium text-[#F28C38] hover:text-[#F28C38]/80">
                          {activity.actionLabel}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}