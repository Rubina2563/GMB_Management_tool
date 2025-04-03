import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

// Define the context shape
interface CampaignContextValue {
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign | null) => void;
}

// Create the context
export const createCampaignContext = () => {
  const CampaignContext = createContext<CampaignContextValue | undefined>(undefined);

  // Create provider component
  const CampaignProvider = ({ children }: { children: ReactNode }) => {
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
    return (
      <CampaignContext.Provider value={{ selectedCampaign, setSelectedCampaign }}>
        {children}
      </CampaignContext.Provider>
    );
  };

  // Create hook for using this context
  const useCampaignContext = (): CampaignContextValue => {
    const context = useContext(CampaignContext);
    if (context === undefined) {
      throw new Error('useCampaignContext must be used within a CampaignProvider');
    }
    return context;
  };

  return { CampaignContext, CampaignProvider, useCampaignContext };
};

// Extend Window interface to include our global context
declare global {
  interface Window {
    globalCampaignContext?: ReturnType<typeof createCampaignContext>;
  }
}

// Access the global campaign context
export const { CampaignContext, CampaignProvider, useCampaignContext } = 
  window.globalCampaignContext || createCampaignContext();