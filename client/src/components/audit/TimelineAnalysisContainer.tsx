import React, { useEffect, useState } from 'react';
import { TimelineAnalysis } from './TimelineAnalysis';
import { 
  generateAllTimelineData, 
  rankingImpactData,
  MOCK_COMPETITORS
} from '@/lib/mockTimelineData';

export interface TimelineAnalysisContainerProps {
  locationId?: string;
  businessId?: string;
  businessName?: string;
  dataType?: 'reviews' | 'posts' | 'photos';
  title?: string;
  description?: string;
  keyInsights?: React.ReactNode;
}

export function TimelineAnalysisContainer({ 
  locationId, 
  businessId, 
  businessName = "Your Business", 
  dataType = "reviews",
  title,
  description,
  keyInsights
}: TimelineAnalysisContainerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(generateAllTimelineData(24));
  const [competitors] = useState(MOCK_COMPETITORS.slice(0, 5));

  // Combine locationId and businessId for backward compatibility
  const entityId = locationId || businessId;

  // Simulate loading data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API request delay
    const timer = setTimeout(() => {
      // In a real implementation, this would be an API call
      const newData = generateAllTimelineData(24, dataType);
      // Only set the specific data type that was requested
      setTimelineData({
        reviews: dataType === 'reviews' ? newData.reviews : [],
        posts: dataType === 'posts' ? newData.posts : [],
        photos: dataType === 'photos' ? newData.photos : []
      });
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [entityId, dataType]);

  if (isLoading) {
    return (
      <div className="w-full p-8 bg-white rounded-lg shadow-sm animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-100 rounded w-1/2 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-gray-100 rounded border"></div>
          <div className="h-80 bg-gray-100 rounded border"></div>
        </div>
        <div className="h-40 bg-gray-100 rounded border mt-4"></div>
      </div>
    );
  }

  // Select the appropriate ranking impact data based on dataType
  const getRankingImpact = () => {
    switch(dataType) {
      case 'reviews':
        return rankingImpactData.reviews;
      case 'posts':
        return rankingImpactData.posts;
      case 'photos':
        return rankingImpactData.photos;
      default:
        return rankingImpactData.reviews;
    }
  };

  return (
    <TimelineAnalysis
      title={title || `${businessName} - ${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Timeline Analysis`}
      description={description || `Compare your ${dataType} activity with your top competitors over time`}
      timelineData={timelineData}
      competitors={competitors}
      rankingImpact={getRankingImpact()}
      enforceDataType={dataType}
      keyInsights={keyInsights}
    />
  );
}