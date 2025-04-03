import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { useLocation, useRoute } from 'wouter';
import { createCampaignContext, useCampaignContext } from '@/lib/campaign-context';

// Define Campaign type
interface Campaign {
  id: number;
  name: string;
  status: string;
  user_id: number;
  geo_grid_size: number;
  distance: number;
  shape: string;
  update_frequency: string;
  // Extra fields for UI
  locations?: number;
  keywords?: number;
  progress?: number;
  lastUpdated?: string;
}

// Create the Campaign context if it doesn't exist
if (!window.globalCampaignContext) {
  window.globalCampaignContext = createCampaignContext();
}

interface CampaignSelectorProps {
  className?: string;
}

const CampaignSelector = ({ className = '' }: CampaignSelectorProps) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedCampaign, setSelectedCampaign } = useCampaignContext();
  const [matchCampaigns, campaignsMatch] = useRoute('/client/campaigns');
  
  // Fetch campaigns data from the backend API
  const { data: campaignsResponse, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: getQueryFn<any>({
      on401: "throw"
    })
  });
  
  // Extract the campaigns from the response
  const campaigns = campaignsResponse?.campaigns || [];

  // Fetch currently selected campaign from server
  const { data: selectedResponse, isLoading: isLoadingSelected } = useQuery({
    queryKey: ["/api/client/campaigns/selected"],
    queryFn: getQueryFn<any>({
      on401: "throw"
    }),
    // Only run this query once on mount, we'll update the cache manually after selection changes
    staleTime: Infinity
  });
  
  // Select campaign mutation
  const selectCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await fetch('/api/client/campaigns/select/' + campaignId, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to select campaign');
      }
      
      return await response.json();
    },
    onSuccess: (data, campaignId) => {
      // Find the selected campaign in the list
      const selected = campaigns.find((c: Campaign) => c.id === campaignId);
      
      // Set the selected campaign in context
      if (selected) {
        setSelectedCampaign(selected);
      }
      
      // Update the cache for the selected campaign query
      queryClient.setQueryData(["/api/client/campaigns/selected"], { 
        campaign: selected,
        success: true
      });
      
      toast({
        title: "Campaign Selected",
        description: `Now viewing ${selected?.name || 'campaign'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to select campaign: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Set the selected campaign from the response when it loads
  useEffect(() => {
    if (selectedResponse?.campaign && !selectedCampaign) {
      setSelectedCampaign(selectedResponse.campaign);
    }
  }, [selectedResponse, selectedCampaign, setSelectedCampaign]);
  
  // Handle campaign selection change
  const handleCampaignChange = (campaignId: string) => {
    if (campaignId === "new") {
      navigate('/client/campaigns/setup');
      return;
    }
    
    selectCampaignMutation.mutate(parseInt(campaignId));
  };
  
  // If we're on the campaigns page already, don't show the selector
  if (campaignsMatch) {
    return null;
  }

  return (
    <div className={`ml-4 mr-4 ${className}`}>
      <Select
        value={selectedCampaign ? selectedCampaign.id.toString() : ""}
        onValueChange={handleCampaignChange}
        disabled={isLoadingCampaigns || isLoadingSelected || selectCampaignMutation.isPending}
      >
        <SelectTrigger 
          className="w-[200px] border-orange-base/20 bg-white text-black focus:border-orange-base focus:ring-orange-base/20"
        >
          <SelectValue placeholder="Select Campaign" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new" className="cursor-pointer text-orange-base font-semibold">
            <div className="flex items-center">
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create New Campaign
            </div>
          </SelectItem>
          
          {campaigns.map((campaign: Campaign) => (
            <SelectItem 
              key={campaign.id} 
              value={campaign.id.toString()}
              className="cursor-pointer"
            >
              {campaign.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CampaignSelector;