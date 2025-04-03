import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Helmet } from 'react-helmet';
import { useLocationContext } from '@/lib/location-context';
import ComingSoon from "@/components/ComingSoon";
import FAQsList from "@/components/faqs-reply/FAQsList";
import ReplyLog from "@/components/faqs-reply/ReplyLog";
import { useQueryClient } from '@tanstack/react-query';

interface FaqsReplyPageProps {
  locationId?: string | number;
  activeTabDefault?: string;
}

const FaqsReplyPage: React.FC<FaqsReplyPageProps> = ({ 
  locationId, 
  activeTabDefault = "faqs-list" 
}) => {
  // Use useRef to persist the active tab value between renders
  const activeTabRef = useRef(activeTabDefault);
  const [activeTab, setActiveTab] = useState(activeTabDefault);
  const { toast } = useToast();
  const { selectedLocation } = useLocationContext();
  const queryClient = useQueryClient();
  
  // Set active tab when activeTabDefault changes
  useEffect(() => {
    activeTabRef.current = activeTabDefault;
    setActiveTab(activeTabDefault);
  }, [activeTabDefault]);
  
  // Create a custom tab change handler that updates both state and ref
  const handleTabChange = (value: string) => {
    activeTabRef.current = value;
    setActiveTab(value);
  };
  
  // Custom function to force a specific tab (used by child components)
  const forceTab = (tabValue: string) => {
    console.log('Forcing tab to:', tabValue);
    activeTabRef.current = tabValue;
    setActiveTab(tabValue);
  };
  
  // Get page title based on active tab
  const getPageTitle = () => {
    switch(activeTab) {
      case 'faqs-list':
        return 'FAQs Management';
      case 'reply-log':
        return 'Reply Log';
      default:
        return 'FAQs Reply';
    }
  };

  return (
    <div className="container mx-auto px-0 mt-8">
      <Helmet>
        <title>{getPageTitle()} | LocalAuthority</title>
      </Helmet>
      
      <div className="flex justify-between items-center">
        <PageHeader 
          title="FAQs Reply" 
          description="Manage your FAQs and automate replies to customer questions on Google Business Profile"
          titleClassName="text-black"
          descriptionClassName="text-black"
        />
      </div>
      
      <div className="mt-8">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full mb-8 grid grid-cols-2 bg-white">
            <TabsTrigger 
              value="faqs-list"
              className="text-black data-[state=active]:bg-[#F28C38] data-[state=active]:text-white"
            >
              FAQs List
            </TabsTrigger>
            <TabsTrigger 
              value="reply-log"
              className="text-black data-[state=active]:bg-[#F28C38] data-[state=active]:text-white"
            >
              Reply Log
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="faqs-list" className="mt-0">
            {selectedLocation ? (
              <FAQsList 
                locationId={selectedLocation.id}
                currentTab={activeTab}
                setParentTab={forceTab}
              />
            ) : (
              <ComingSoon 
                title="FAQs List" 
                description="Please select a location to view and manage your FAQs."
                showRequestButton={false}
              />
            )}
          </TabsContent>
          
          <TabsContent value="reply-log" className="mt-0">
            {selectedLocation ? (
              <ReplyLog 
                locationId={selectedLocation.id}
                currentTab={activeTab}
                setParentTab={forceTab}
              />
            ) : (
              <ComingSoon 
                title="Reply Log" 
                description="Please select a location to view your reply log."
                showRequestButton={false}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FaqsReplyPage;