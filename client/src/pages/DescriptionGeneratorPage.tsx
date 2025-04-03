import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import PageHeader from '@/components/PageHeader';
import DescriptionGenerator from '../components/description-generator/DescriptionGenerator';
import { Badge } from "@/components/ui/badge";

interface DescriptionGeneratorPageProps {
  locationId?: string | number;
  activeTabDefault?: string;
}

const DescriptionGeneratorPage: React.FC<DescriptionGeneratorPageProps> = ({ 
  locationId: propLocationId,
  activeTabDefault = "description-generator"
}) => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [locationId, setLocationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>(activeTabDefault);

  // Parse locationId from URL if not provided in props
  useEffect(() => {
    if (propLocationId) {
      setLocationId(Number(propLocationId));
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const locId = urlParams.get('locationId');
      if (locId) {
        setLocationId(Number(locId));
      } else {
        // Set a default location ID for testing
        setLocationId(1);
      }
    }
  }, [propLocationId, location]);

  // Get user info
  const { data: userdata, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Get selected location info
  const { data: locationData, isLoading: locationLoading } = useQuery({
    queryKey: ['/api/client/gbp/location', locationId],
    enabled: !!locationId,
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (!locationId && !userLoading) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader title="Description Generator" />
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>No Location Selected</CardTitle>
            <CardDescription>
              Please select a location from the locations dropdown first.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Try to get the location name safely
  let locationName = "Default Location";
  try {
    if (locationData && locationData.data && locationData.data.name) {
      locationName = locationData.data.name;
    }
  } catch (error) {
    console.error("Error accessing location name:", error);
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Description Generator">
        <Badge variant="outline" className="ml-2">
          {locationName}
        </Badge>
      </PageHeader>
      
      <Card className="mt-4 bg-white">
        <CardContent className="p-6 bg-white">
          <Tabs
            defaultValue={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="description-generator" className="text-black">
                Business Description Generator
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description-generator" className="py-4 bg-white">
              {locationId && (
                <DescriptionGenerator
                  locationId={locationId}
                  currentTab={activeTab}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DescriptionGeneratorPage;