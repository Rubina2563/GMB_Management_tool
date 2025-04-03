import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Building, ChevronDown, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientSwitcherProps {
  clients: Array<{
    id: number;
    name: string;
    locations: Array<{
      id: number;
      name: string;
    }>;
  }>;
  selectedClientId: number | null;
  onClientChange: (clientId: number) => void;
  className?: string;
}

export default function ClientSwitcher({
  clients,
  selectedClientId,
  onClientChange,
  className = ''
}: ClientSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle client selection
  const handleClientChange = (value: string) => {
    onClientChange(parseInt(value, 10));
  };

  // Find the selected client
  const selectedClient = selectedClientId 
    ? clients.find(client => client.id === selectedClientId)
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
          value={selectedClientId?.toString() || ''}
          onValueChange={handleClientChange}
          onOpenChange={(open) => setIsOpen(open)}
        >
          <SelectTrigger
            className="w-[280px] border-[#F28C38] text-[#000000] bg-white focus:ring-[#F28C38] focus:ring-offset-2 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F28C38]/10 mr-3">
                  <Building2 className="h-4 w-4 text-[#F28C38]" />
                </div>
                {selectedClient ? (
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-[#000000]">{selectedClient.name}</span>
                    <span className="text-xs text-gray-500">
                      {selectedClient.locations.length} {selectedClient.locations.length === 1 ? 'location' : 'locations'}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">Select Client</span>
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
                {clients.length > 0 ? clients.map((client) => (
                  <SelectItem
                    key={client.id}
                    value={client.id.toString()}
                    className="cursor-pointer hover:bg-gray-100 rounded my-1 focus:bg-gray-100 focus:text-black"
                  >
                    <div className="flex items-center py-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mr-3">
                        <Building2 className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-[#000000]">{client.name}</span>
                        <span className="text-xs text-gray-500">
                          {client.locations.length} {client.locations.length === 1 ? 'location' : 'locations'}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                )) : (
                  <div className="text-gray-400 py-4 text-center">
                    No clients available
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </SelectContent>
        </Select>
      </motion.div>
    </div>
  );
}