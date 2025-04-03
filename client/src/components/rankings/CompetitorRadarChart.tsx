import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CompetitorDetails } from './competitor-types';

interface CompetitorRadarChartProps {
  yourBusiness: CompetitorDetails;
  competitor: CompetitorDetails;
}

interface RadarData {
  subject: string;
  yourBusiness: number;
  competitor: number;
  fullMark: number;
}

const CompetitorRadarChart: React.FC<CompetitorRadarChartProps> = ({
  yourBusiness,
  competitor,
}) => {
  // Normalize values to a 0-100 scale for radar chart
  const normalizeRank = (rank: number): number => {
    // For rank, lower is better (1 is best), so we invert the scale
    return Math.max(0, 100 - ((rank - 1) * 5));
  };

  const normalizeReviews = (reviews: number, maxReviews: number): number => {
    return Math.min(100, (reviews / maxReviews) * 100);
  };

  const normalizeRating = (rating: number): number => {
    // Rating is typically 1-5, normalize to 0-100
    return ((rating - 1) / 4) * 100;
  };

  const normalizeDomainAuthority = (authority: number): number => {
    // Domain authority is already 0-100
    return authority;
  };

  const normalizeOverlap = (overlap: number): number => {
    // Overlap is already a percentage
    return overlap;
  };

  // Find the max review count for normalization
  const maxReviews = Math.max(yourBusiness.reviewCount, competitor.reviewCount);

  const data: RadarData[] = [
    {
      subject: 'Rank',
      yourBusiness: normalizeRank(yourBusiness.rank),
      competitor: normalizeRank(competitor.rank),
      fullMark: 100
    },
    {
      subject: 'Reviews',
      yourBusiness: normalizeReviews(yourBusiness.reviewCount, maxReviews),
      competitor: normalizeReviews(competitor.reviewCount, maxReviews),
      fullMark: 100
    },
    {
      subject: 'Rating',
      yourBusiness: normalizeRating(yourBusiness.averageRating),
      competitor: normalizeRating(competitor.averageRating),
      fullMark: 100
    },
    {
      subject: 'Domain Authority',
      yourBusiness: normalizeDomainAuthority(yourBusiness.domainAuthority),
      competitor: normalizeDomainAuthority(competitor.domainAuthority),
      fullMark: 100
    },
    {
      subject: 'Keyword Overlap',
      yourBusiness: normalizeOverlap(yourBusiness.overlap),
      competitor: normalizeOverlap(competitor.overlap),
      fullMark: 100
    }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'black', fontSize: 11 }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: 'black', fontSize: 10 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickCount={5}
          />
          <Radar
            name={yourBusiness.name}
            dataKey="yourBusiness"
            stroke="#F28C38"
            fill="#F28C38"
            fillOpacity={0.5}
          />
          <Radar
            name={competitor.name}
            dataKey="competitor"
            stroke="#28A745"
            fill="#28A745"
            fillOpacity={0.5}
          />
          <Legend wrapperStyle={{ color: 'black' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompetitorRadarChart;