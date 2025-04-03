import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Plus, Users, Clock } from 'lucide-react';
import GBPConnectionDialog from './GBPConnectionDialog';
import ClientSwitcher from './ClientSwitcher';
import LocationSelector from './LocationSelector';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface LocalDashboardTopBarProps {
  numberOfClients: number;
  hasGBPLocations: boolean;
  selectedClientId: number | null;
  selectedLocationId: number | null;
  clients: Array<{
    id: number;
    name: string;
    locations: Array<{
      id: number;
      name: string;
    }>;
  }>;
  locations: Array<{
    id: number;
    name: string;
    address: string;
  }>;
  isAdmin: boolean;
  onClientChange: (clientId: number) => void;
  onLocationChange: (locationId: string | number) => void;
  onConnectGBP: (locationId: string | number) => void;
  className?: string;
}

export default function LocalDashboardTopBar({
  numberOfClients,
  hasGBPLocations,
  selectedClientId,
  selectedLocationId,
  clients,
  locations,
  isAdmin,
  onClientChange,
  onLocationChange,
  onConnectGBP,
  className = ''
}: LocalDashboardTopBarProps) {
  // Find selected client
  const selectedClient = clients.find(client => client.id === selectedClientId);
  
  // State for timeframe selector
  const [timeframe, setTimeframe] = useState<string>("7");
  
  // Animation variants
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      className={`w-full ${className}`}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 justify-between">
            {/* Left section with client count and switchers */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Only show client count for admin users */}
              {isAdmin && (
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  className="flex items-center space-x-3 bg-white border border-gray-200 p-4 rounded-lg shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-[#F28C38] flex items-center justify-center shadow-md">
                    <Users className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <p className="text-sm text-black font-medium">Total Clients</p>
                    <p className="text-2xl font-bold text-[#000000] tracking-tight">{numberOfClients}</p>
                  </div>
                </motion.div>
              )}
              
              {/* Client Switcher - only for admin users */}
              {isAdmin && (
                <ClientSwitcher
                  clients={clients}
                  selectedClientId={selectedClientId}
                  onClientChange={onClientChange}
                />
              )}
              
              {/* Location Selector - for all users */}
              <LocationSelector
                locations={locations}
                selectedLocationId={selectedLocationId}
                onLocationChange={onLocationChange}
              />
            </div>
            
            {/* Right section with Connect/Add Location button and timeframe selector */}
            <div className="flex items-center space-x-4">
              {/* Timeframe selector */}
              <div className="flex items-center">
                <span className="text-sm text-[#1C2526] mr-2 font-['Montserrat'] hidden md:inline-block">
                  <Clock className="h-4 w-4 inline-block mr-1 text-[#F28C38]" />
                  Timeframe:
                </span>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="bg-white text-[#1C2526] h-9 w-36 border-[#1C2526]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Add Location button */}
              <GBPConnectionDialog
                hasGBPLocations={hasGBPLocations}
                onConnectGBP={onConnectGBP}
                variant="default"
                className="bg-[#F28C38] text-white hover:bg-[#F28C38]/90"
                iconClassName="h-4 w-4 mr-2"
                hideTextOnMobile={false}
                icon={<Plus className="h-4 w-4" />}
                buttonText="Add Location"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}