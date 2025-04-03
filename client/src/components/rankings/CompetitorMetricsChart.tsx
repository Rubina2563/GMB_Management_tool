import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { CompetitorDetails } from './competitor-types';

interface CompetitorMetricsChartProps {
  yourBusiness: CompetitorDetails;
  competitor: CompetitorDetails;
}

interface MetricChartData {
  name: string;
  yourBusiness: number;
  competitor: number;
}

const CompetitorMetricsChart: React.FC<CompetitorMetricsChartProps> = ({
  yourBusiness,
  competitor,
}) => {
  // Transform the data for the chart
  const getChartData = (): MetricChartData[] => {
    return [
      {
        name: 'Ranking Keywords',
        yourBusiness: yourBusiness.rankingKeywords,
        competitor: competitor.rankingKeywords,
      },
      {
        name: 'Review Count',
        yourBusiness: yourBusiness.reviewCount,
        competitor: competitor.reviewCount,
      },
      {
        name: 'Domain Authority',
        yourBusiness: yourBusiness.domainAuthority,
        competitor: competitor.domainAuthority,
      },
      {
        name: 'Photo Count',
        yourBusiness: yourBusiness.photoCount || 0,
        competitor: competitor.photoCount || 0,
      },
      {
        name: 'Posts (30 days)',
        yourBusiness: yourBusiness.postsLast30Days || 0,
        competitor: competitor.postsLast30Days || 0,
      }
    ];
  };

  // Format the tooltip label to include percentage difference
  const formatTooltipLabel = (value: number, name: string, props: any) => {
    const { payload } = props;
    const yourValue = payload.yourBusiness;
    const competitorValue = payload.competitor;
    
    if (name === 'yourBusiness') {
      if (competitorValue === 0) return `${value} (N/A)`;
      
      const percentDifference = ((yourValue - competitorValue) / competitorValue) * 100;
      return `${value} (${percentDifference > 0 ? '+' : ''}${percentDifference.toFixed(0)}%)`;
    }
    
    if (name === 'competitor') {
      if (yourValue === 0) return `${value} (N/A)`;
      
      const percentDifference = ((competitorValue - yourValue) / yourValue) * 100;
      return `${value} (${percentDifference > 0 ? '+' : ''}${percentDifference.toFixed(0)}%)`;
    }
    
    return value;
  };

  const CustomizedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-sm text-black">{label}</p>
          <div className="flex flex-col text-xs text-black">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-[#F28C38] mr-2 rounded-sm"></div>
              {yourBusiness.name}: {payload[0].value}
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-[#28A745] mr-2 rounded-sm"></div>
              {competitor.name}: {payload[1].value}
            </span>
            {payload[0].value > 0 && payload[1].value > 0 && (
              <span className="text-gray-600 mt-1">
                {payload[0].value > payload[1].value 
                  ? `${yourBusiness.name} has ${(((payload[0].value - payload[1].value) / payload[1].value) * 100).toFixed(0)}% more`
                  : `${competitor.name} has ${(((payload[1].value - payload[0].value) / payload[0].value) * 100).toFixed(0)}% more`
                }
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={getChartData()}
          margin={{ top: 25, right: 30, left: 20, bottom: 40 }}
          barGap={15}
          barSize={22}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis 
            type="number"
            tick={{ fill: 'black', fontSize: 10 }}
          />
          <YAxis 
            type="category"
            dataKey="name"
            tick={{ fill: 'black', fontSize: 12 }}
            width={120}
          />
          <Tooltip content={<CustomizedTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', color: 'black' }}
            formatter={(value) => (value === 'yourBusiness' ? yourBusiness.name : competitor.name)}
          />
          <Bar 
            dataKey="yourBusiness" 
            name="yourBusiness"
            fill="#F28C38"
            radius={[0, 4, 4, 0]}
          >
            <LabelList 
              dataKey="yourBusiness" 
              position="right" 
              fill="black" 
              fontSize={10}
              formatter={(value: any) => typeof value === 'number' && value > 0 ? value : ''}
              offset={5}
            />
          </Bar>
          <Bar 
            dataKey="competitor" 
            name="competitor"
            fill="#28A745"
            radius={[0, 4, 4, 0]}
          >
            <LabelList 
              dataKey="competitor" 
              position="right" 
              fill="black" 
              fontSize={10}
              formatter={(value: any) => typeof value === 'number' && value > 0 ? value : ''}
              offset={5}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompetitorMetricsChart;