import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Building, BarChart, Users, Mail, Calendar } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useLocationContext } from '@/lib/location-context';
import { GbpProfileSelectionModal } from '@/components/common/GbpProfileSelectionModal';
import { colors } from '@/lib/colors';

export default function LocalDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fetch locations
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['/api/gbp/locations'],
    queryFn: async () => {
      const response = await fetch('/api/gbp/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      return response.json();
    }
  });
  
  // Determine if user has GBP locations
  const hasGBPLocations = locationsData?.locations?.length > 0;
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard, isError: isErrorDashboard } = useQuery({
    queryKey: ['/api/client/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/client/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    }
  });
  
  // Handle adding a new location
  const handleAddNewLocation = () => {
    setIsModalOpen(true);
  };
  
  // Handle save profiles
  const handleSaveProfiles = async (selectedProfiles: string[]) => {
    try {
      const response = await axios.post('/api/client/gbp-audit/save-profiles', {
        selectedProfiles
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/gbp/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/dashboard'] });
      
      toast({
        title: "Success",
        description: "Selected profiles have been connected successfully",
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to save profiles:", error);
      toast({
        title: "Error",
        description: "Failed to connect selected profiles",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  return (
    <div style={{ 
      width: "774px", 
      paddingLeft: "70px", 
      paddingRight: "150px", 
      marginLeft: "300px" 
    }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.dark }}>Local Dashboard</h1>
        <p style={{ color: colors.text.secondary }}>
          Manage your business's online presence and performance
        </p>
      </div>
      
      {isLoadingDashboard || isLoadingLocations ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#F28C38]" />
        </div>
      ) : isErrorDashboard ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">
            We encountered an issue while loading your dashboard data.
          </p>
          <Button 
            variant="outline" 
            className="border-red-500 text-red-700 hover:bg-red-50"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/client/dashboard'] })}
          >
            Try Again
          </Button>
        </div>
      ) : !hasGBPLocations ? (
        <Card className="w-full" style={{
          backgroundColor: colors.background.white,
          border: `1px solid ${colors.text.secondary}20`
        }}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle style={{ color: colors.text.dark }}>Connect Your First Location</CardTitle>
            </div>
            <CardDescription style={{ color: colors.text.dark }}>
              To get started, connect your Google Business Profile
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-center py-6">
              <Building className="h-12 w-12 mx-auto mb-4 text-[#F28C38]" />
              <p style={{ color: colors.text.secondary }} className="mb-6 max-w-md mx-auto">
                Connect your Google Business Profile to manage your business information,
                see insights, respond to reviews, and more.
              </p>
              <Button 
                onClick={handleAddNewLocation}
                style={{ 
                  backgroundColor: colors.orange.base, 
                  color: colors.text.white 
                }}
                className="hover:bg-[#F5A461]"
              >
                <MapPin className="mr-2 h-4 w-4" /> Connect Google Business Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button 
              onClick={handleAddNewLocation} 
              style={{ 
                backgroundColor: colors.orange.base, 
                color: colors.text.white 
              }}
              className="hover:bg-[#F5A461]"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Add new location
            </Button>
          </div>
        
          <Card className="w-full mb-6" style={{
            backgroundColor: colors.background.white,
            border: `1px solid ${colors.text.secondary}20`
          }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle style={{ color: colors.text.dark }}>Performance Overview</CardTitle>
              </div>
              <CardDescription style={{ color: colors.text.dark }}>
                Key metrics across all your business locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm" style={{ backgroundColor: colors.background.light }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                          Total Views
                        </p>
                        <h3 className="text-2xl font-bold mt-1" style={{ color: colors.text.dark }}>
                          2,846
                        </h3>
                        <p className="text-xs mt-1 flex items-center" style={{ color: colors.green.base }}>
                          +12.5% <span className="ml-1">from last month</span>
                        </p>
                      </div>
                      <div className="bg-orange-100 p-2 rounded-full">
                        <BarChart className="h-6 w-6 text-[#F28C38]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm" style={{ backgroundColor: colors.background.light }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                          Customer Actions
                        </p>
                        <h3 className="text-2xl font-bold mt-1" style={{ color: colors.text.dark }}>
                          594
                        </h3>
                        <p className="text-xs mt-1 flex items-center" style={{ color: colors.green.base }}>
                          +4.3% <span className="ml-1">from last month</span>
                        </p>
                      </div>
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Users className="h-6 w-6 text-[#F28C38]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm" style={{ backgroundColor: colors.background.light }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                          Review Rating
                        </p>
                        <h3 className="text-2xl font-bold mt-1" style={{ color: colors.text.dark }}>
                          4.7
                        </h3>
                        <p className="text-xs mt-1 flex items-center" style={{ color: colors.green.base }}>
                          +0.2 <span className="ml-1">from last month</span>
                        </p>
                      </div>
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Mail className="h-6 w-6 text-[#F28C38]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm" style={{ backgroundColor: colors.background.light }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                          Posts
                        </p>
                        <h3 className="text-2xl font-bold mt-1" style={{ color: colors.text.dark }}>
                          12
                        </h3>
                        <p className="text-xs mt-1 flex items-center" style={{ color: colors.amber.base }}>
                          Same <span className="ml-1">as last month</span>
                        </p>
                      </div>
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Calendar className="h-6 w-6 text-[#F28C38]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Card className="w-full" style={{
            backgroundColor: colors.background.white,
            border: `1px solid ${colors.text.secondary}20`
          }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle style={{ color: colors.text.dark }}>Your Locations</CardTitle>
              </div>
              <CardDescription style={{ color: colors.text.dark }}>
                Manage your connected business locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locationsData?.locations?.map((location: any) => (
                  <Card key={location.id} className="border" style={{ 
                    borderColor: colors.text.secondary + '20',
                    backgroundColor: colors.background.light
                  }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg" style={{ color: colors.text.dark }}>{location.name}</CardTitle>
                      <CardDescription style={{ color: colors.text.secondary }}>{location.address}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm mb-2" style={{ color: colors.text.secondary }}>
                        <span className="font-medium">Category:</span>
                        <span className="ml-2">{location.category || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center text-sm" style={{ color: colors.text.secondary }}>
                        <span className="font-medium">Status:</span>
                        <span className="ml-2 px-2 py-1 text-xs rounded-full" style={{ 
                          backgroundColor: colors.green.light, 
                          color: colors.green.base 
                        }}>
                          Connected
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* GBP Profile Selection Modal */}
      <GbpProfileSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProfiles}
      />
    </div>
  );
}