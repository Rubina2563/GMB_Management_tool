import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import RankingsPage from './RankingsPage';
import LocalOrganicRankings from '@/components/rankings/LocalOrganicRankings';
import LocalLinksPage from './LocalLinksPage';

// Tab switcher component for Local Rankings section
const LocalRankingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('gbp-map-rankings');
  const { user } = useAuth();
  
  // Fetch the selected campaign
  const { data: selectedCampaign } = useQuery({
    queryKey: ['selectedCampaign'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/client/campaigns/selected');
        return response.data.campaign;
      } catch (error) {
        console.error('Error fetching selected campaign:', error);
        return null;
      }
    },
    refetchOnWindowFocus: false
  });

  return (
    <>
      <Helmet>
        <title>Local Rankings | LocalAuthority</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-4 text-black">Local Rankings</h1>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <Tabs
            defaultValue="gbp-map-rankings"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full mb-8 grid grid-cols-3 bg-black">
              <TabsTrigger 
                value="gbp-map-rankings"
                className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white text-white"
              >
                GBP Map Rankings
              </TabsTrigger>
              <TabsTrigger 
                value="local-organic-rankings"
                className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white text-white"
              >
                Local Organic Rankings
              </TabsTrigger>
              <TabsTrigger 
                value="local-links"
                className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white text-white"
              >
                Local Links
              </TabsTrigger>
            </TabsList>
            
            {/* Tab Content */}
            <TabsContent value="gbp-map-rankings" className="mt-0">
              <RankingsPage />
            </TabsContent>
            
            <TabsContent value="local-organic-rankings" className="mt-0">
              <LocalOrganicRankings campaignId={selectedCampaign?.id} />
            </TabsContent>
            
            <TabsContent value="local-links" className="mt-0">
              <LocalLinksPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default LocalRankingsPage;