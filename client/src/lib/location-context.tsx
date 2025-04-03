import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Location {
  id: number;
  name: string;
  address: string;
  category?: string;
  googleId?: string;
}

interface LocationContextType {
  selectedLocationId: number | null;
  setSelectedLocationId: (id: number | null) => void;
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;
  locations: Location[];
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Fetch locations with better error handling and stale-time
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['/api/gbp/locations'],
    queryFn: async () => {
      const response = await fetch('/api/gbp/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      return response.json();
    },
    staleTime: 30000, // Cache data for 30 seconds to prevent excessive fetching
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false // Don't refetch when window regains focus
  });

  // Derive locations from the query data
  const locations = locationsData?.locations || [];

  // Update selected location when locations or selectedLocationId changes
  useEffect(() => {
    if (locations.length > 0) {
      if (selectedLocationId) {
        // Find and set the selected location
        const location = locations.find((loc: Location) => loc.id === selectedLocationId);
        if (location) {
          setSelectedLocation(location);
        }
      } else if (!selectedLocationId && locations.length > 0) {
        // Auto-select the first location if none is selected
        setSelectedLocationId(locations[0].id);
        setSelectedLocation(locations[0]);
      }
    }
  }, [locations, selectedLocationId]);

  return (
    <LocationContext.Provider value={{
      selectedLocationId,
      setSelectedLocationId,
      selectedLocation,
      setSelectedLocation,
      locations,
      isLoading
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}