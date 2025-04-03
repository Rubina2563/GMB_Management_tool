import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationSelectorProps {
  locations: Array<{
    id: number;
    name: string;
    address: string;
  }>;
  selectedLocationId: number | null;
  onLocationChange: (locationId: number) => void;
  className?: string;
}

export default function LocationSelector({
  locations,
  selectedLocationId,
  onLocationChange,
  className = '',
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prevLocationId, setPrevLocationId] = useState<number | null>(null);
  
  // Animation effect when location changes
  useEffect(() => {
    if (selectedLocationId !== prevLocationId && prevLocationId !== null) {
      // Location changed, could trigger additional effects
    }
    setPrevLocationId(selectedLocationId);
  }, [selectedLocationId]);

  // Handle location selection
  const handleLocationChange = (value: string) => {
    onLocationChange(parseInt(value, 10));
  };

  // Find selected location for display
  const selectedLocation = selectedLocationId && locations
    ? locations.find(location => location.id === selectedLocationId)
    : null;

  // Animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <Select
          value={selectedLocationId?.toString() || ''}
          onValueChange={handleLocationChange}
          onOpenChange={(open) => setIsOpen(open)}
        >
          <SelectTrigger
            className="w-[280px] border-[#F28C38] text-[#000000] bg-white focus:ring-[#F28C38] focus:ring-offset-2 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F28C38]/10 mr-3">
                  <MapPin className="h-4 w-4 text-[#F28C38]" />
                </div>
                {selectedLocation ? (
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-[#000000]">{selectedLocation.name}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[180px]">
                      {selectedLocation.address}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">Select Location</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-[#F28C38] transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md p-1 w-[280px]">
            <AnimatePresence>
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="max-h-[300px] overflow-y-auto"
              >
                {Array.isArray(locations) && locations.length > 0 ? (
                  locations.map((location) => (
                    <SelectItem
                      key={location.id}
                      value={location.id.toString()}
                      className="cursor-pointer hover:bg-gray-100 rounded my-1 focus:bg-gray-100 focus:text-black"
                    >
                      <div className="flex items-center py-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mr-3">
                          <MapPin className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-[#000000]">{location.name}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">
                            {location.address}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value="none"
                    disabled
                    className="text-gray-400 py-4 text-center"
                  >
                    No locations available
                  </SelectItem>
                )}
              </motion.div>
            </AnimatePresence>
          </SelectContent>
        </Select>
      </motion.div>
    </div>
  );
}