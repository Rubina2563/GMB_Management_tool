import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CompetitorTrend } from './competitor-types';

interface CompetitorTrendsChartProps {
  trends: CompetitorTrend[];
  yourBusinessName: string;
  competitorName: string;
  timeRange?: number; // Number of days to show
}

const CompetitorTrendsChart: React.FC<CompetitorTrendsChartProps> = ({
  trends,
  yourBusinessName,
  competitorName,
  timeRange = 30
}) => {
  // Filter trends to only include the business and competitor
  const filteredTrends = trends.filter(trend => 
    trend.competitorName === yourBusinessName || trend.competitorName === competitorName
  );
  
  // Format the data for the chart
  const formatChartData = () => {
    // Get the trends for the business and competitor
    const yourBusinessTrend = filteredTrends.find(trend => trend.competitorName === yourBusinessName);
    const competitorTrend = filteredTrends.find(trend => trend.competitorName === competitorName);
    
    if (!yourBusinessTrend || !competitorTrend) {
      return [];
    }
    
    // Create the chart data
    const chartData = [];
    
    // Limit to the timeRange
    const limitedBusinessTrends = yourBusinessTrend.trends.slice(-timeRange);
    const limitedCompetitorTrends = competitorTrend.trends.slice(-timeRange);
    
    // Create data points for each date
    for (let i = 0; i < limitedBusinessTrends.length; i++) {
      const businessPoint = limitedBusinessTrends[i];
      const competitorPoint = limitedCompetitorTrends[i];
      
      if (businessPoint && competitorPoint) {
        // Format the date to be more readable
        const date = new Date(businessPoint.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        
        chartData.push({
          date: formattedDate,
          [yourBusinessTrend.competitorName]: businessPoint.rank,
          [competitorTrend.competitorName]: competitorPoint.rank
        });
      }
    }
    
    return chartData;
  };
  
  const chartData = formatChartData();
  
  // If there's no data, show a message
  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-black">
        No trend data available for comparison.
      </div>
    );
  }
  
  // Find the max rank for Y-axis domain
  const maxRank = Math.max(
    ...chartData.map(item => Math.max(
      Number(item[yourBusinessName]) || 0, 
      Number(item[competitorName]) || 0
    ))
  );
  
  return (
    <div className="h-72 w-full">
      <h3 className="text-black text-sm font-medium mb-2 text-center">
        Ranking Trends - Last {timeRange} Days
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={chartData}
          margin={{ top: 15, right: 30, left: 30, bottom: 15 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'black', fontSize: 10 }}
            tickMargin={10}
          />
          <YAxis 
            domain={[0, Math.max(20, maxRank + 2)]} 
            tick={{ fill: 'black', fontSize: 10 }}
            tickMargin={10}
            reversed // Reversed to show rank 1 at the top
            label={{ 
              value: 'Rank Position', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: 'black', fontSize: 11 },
              offset: -20,
              dy: 50
            }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'white', borderColor: '#e5e7eb', color: 'black' }}
            labelStyle={{ color: 'black' }}
            formatter={(value, name) => [`Rank ${value}`, name]}
          />
          <Legend 
            wrapperStyle={{ color: 'black' }} 
            verticalAlign="bottom"
            height={36}
          />
          <Line
            type="monotone"
            dataKey={yourBusinessName}
            stroke="#F28C38"
            strokeWidth={2}
            dot={{ r: 2, fill: "#F28C38" }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey={competitorName}
            stroke="#28A745"
            strokeWidth={2}
            dot={{ r: 2, fill: "#28A745" }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompetitorTrendsChart;