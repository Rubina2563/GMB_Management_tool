import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import CitationReport from "@/components/links/CitationReport";
import CompetitorGapAnalysis from "@/components/links/CompetitorGapAnalysis";
import BuildLocalCitations from "@/components/links/BuildLocalCitations";
import { Helmet } from 'react-helmet';

interface LocalLinksPageProps {
  campaignId?: number;
  activeTabDefault?: string;
}

const LocalLinksPage: React.FC<LocalLinksPageProps> = ({ campaignId, activeTabDefault = "citation-report" }) => {
  const [activeTab, setActiveTab] = useState(activeTabDefault);
  
  // Set active tab when activeTabDefault changes
  useEffect(() => {
    setActiveTab(activeTabDefault);
  }, [activeTabDefault]);
  
  // Get page title based on active tab
  const getPageTitle = () => {
    switch(activeTab) {
      case 'citation-report':
        return 'Citation Report';
      case 'competitor-gap':
        return 'Competitor Gap Analysis';
      case 'build-citations':
        return 'Build Citations';
      default:
        return 'Local Links';
    }
  };

  return (
    <div className="container mx-auto px-0 mt-8">
      <Helmet>
        <title>{getPageTitle()} | LocalAuthority</title>
      </Helmet>
      
      <PageHeader 
        title={getPageTitle()} 
        description="Manage business citations, gap analysis, and build new citations"
      />
      
      <div className="mt-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full mb-8 grid grid-cols-3 bg-black">
            <TabsTrigger 
              value="citation-report"
              className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white text-white"
            >
              Citation Report
            </TabsTrigger>
            <TabsTrigger 
              value="competitor-gap"
              className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white text-white"
            >
              Competitor Gap Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="build-citations"
              className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white text-white"
            >
              Build Citations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="citation-report" className="mt-0">
            <CitationReport campaignId={campaignId} />
          </TabsContent>
          
          <TabsContent value="competitor-gap" className="mt-0">
            <CompetitorGapAnalysis campaignId={campaignId} />
          </TabsContent>
          
          <TabsContent value="build-citations" className="mt-0">
            <BuildLocalCitations campaignId={campaignId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LocalLinksPage;