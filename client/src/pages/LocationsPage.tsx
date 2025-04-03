import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocationContext } from '@/lib/location-context';
import { 
  Building, 
  Plus, 
  Search, 
  MapPin, 
  Phone,
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface Location {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  location_id: string;
  latitude: string | null;
  longitude: string | null;
  status: string;
}

export default function LocationsPage() {
  const { toast } = useToast();
  const { selectedLocationId, setSelectedLocationId } = useLocationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch locations
  const { data: gbpLocationsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/gbp/locations'],
    queryFn: async () => {
      const response = await fetch('/api/gbp/locations', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      return response.json();
    }
  });

  // Handle adding a new location (mock function, will use real API in production)
  const handleAddLocation = async (googleLocationId: string) => {
    try {
      // In a real implementation, this would call the API to connect a GBP location
      await axios.post('/api/gbp/connect', {
        location_id: googleLocationId
      });
      
      toast({
        title: "Success",
        description: "Location added successfully",
      });
      
      // Refresh locations data
      refetch();
      setShowAddDialog(false);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter locations based on search query
  const filteredLocations = gbpLocationsData?.locations
    ? gbpLocationsData.locations.filter((loc: Location) => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Add some dummy locations if we don't have any
  const dummyLocations: Location[] = [
    {
      id: 1,
      name: "Fitness Pro Studio",
      address: "123 Main Street, Anytown, USA",
      phone: "+1 (212) 555-1234",
      website: "https://fitnesspro.example.com",
      location_id: "location_123",
      latitude: "40.7128",
      longitude: "-74.0060",
      status: "active"
    },
    {
      id: 2,
      name: "Wellness Center Downtown",
      address: "456 Park Ave, New York, NY 10022",
      phone: "+1 (212) 555-5678",
      website: "https://wellness.example.com",
      location_id: "location_456",
      latitude: "40.7639",
      longitude: "-73.9724",
      status: "active"
    },
    {
      id: 3,
      name: "Brooklyn Fitness Club",
      address: "789 Atlantic Ave, Brooklyn, NY 11217",
      phone: "+1 (718) 555-9012",
      website: "https://brooklynfitness.example.com",
      location_id: "location_789",
      latitude: "40.6782",
      longitude: "-73.9442",
      status: "active"
    },
    {
      id: 4,
      name: "Queens Health Center",
      address: "101 Queens Blvd, Queens, NY 11375",
      phone: "+1 (718) 555-3456",
      website: "https://queenshealth.example.com",
      location_id: "location_101",
      latitude: "40.7282",
      longitude: "-73.7949",
      status: "active"
    },
    {
      id: 5,
      name: "Staten Island Wellness",
      address: "202 Hylan Blvd, Staten Island, NY 10305",
      phone: "+1 (718) 555-7890",
      website: "https://statenislandwellness.example.com",
      location_id: "location_202",
      latitude: "40.6090",
      longitude: "-74.1558",
      status: "active"
    },
    {
      id: 6,
      name: "Chicago Fitness Hub",
      address: "123 Michigan Ave, Chicago, IL 60601",
      phone: "+1 (312) 555-4321",
      website: "https://chicagofitness.example.com",
      location_id: "location_303",
      latitude: "41.8781",
      longitude: "-87.6298",
      status: "active"
    },
    {
      id: 7,
      name: "LA Wellness Studio",
      address: "555 Sunset Blvd, Los Angeles, CA 90028",
      phone: "+1 (310) 555-8765",
      website: "https://lawellness.example.com",
      location_id: "location_404",
      latitude: "34.0522",
      longitude: "-118.2437",
      status: "active"
    },
    {
      id: 8,
      name: "Miami Beach Fitness",
      address: "800 Ocean Drive, Miami, FL 33139",
      phone: "+1 (305) 555-9876",
      website: "https://miamibeachfitness.example.com",
      location_id: "location_505",
      latitude: "25.7617",
      longitude: "-80.1918",
      status: "active"
    }
  ];

  // Combine real and dummy locations
  const displayLocations = gbpLocationsData?.locations?.length > 0 
    ? filteredLocations 
    : dummyLocations.filter(loc => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="mx-auto py-6 bg-white" style={{ paddingLeft: '70px', paddingRight: '150px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-black">Business Locations</h1>
          <p className="text-gray-600">
            Manage your Google Business Profile locations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search locations..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white">
                <Plus className="h-5 w-5 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Business Location</DialogTitle>
                <DialogDescription>
                  Connect your Google Business Profile location to manage it through the platform.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="location-id" className="text-sm font-medium">
                    Google Place ID
                  </label>
                  <Input
                    id="location-id"
                    placeholder="Enter Google Place ID (e.g., ChIJN1t_tDeuEmsRUsoyG83frY4)"
                  />
                  <p className="text-xs text-gray-500">
                    You can find this in your Google Business Profile dashboard or by using the Google Places API.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white"
                  onClick={() => handleAddLocation("ChIJN1t_tDeuEmsRUsoyG83frY4")}
                >
                  Connect Location
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isLoading ? (
        // Loading state
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#F28C38]"></div>
        </div>
      ) : displayLocations.length === 0 ? (
        // Empty state
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Building className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No locations found</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery 
              ? "No locations match your search criteria. Try another search term." 
              : "You haven't added any business locations yet. Add your first location to get started."}
          </p>
          <Button
            className="mt-6 bg-[#F28C38] hover:bg-[#F28C38]/80 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Location
          </Button>
        </div>
      ) : (
        // Location cards grid
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {displayLocations.map((location: Location) => (
            <motion.div key={location.id} variants={itemVariants}>
              <Card className={`h-full transition-shadow hover:shadow-md bg-white border ${location.id === selectedLocationId ? 'border-[#F28C38] ring-1 ring-[#F28C38]' : 'border-gray-200'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-semibold text-lg text-black">{location.name}</CardTitle>
                      <CardDescription className="text-gray-500 truncate max-w-[220px]">
                        {location.address}
                      </CardDescription>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-700 hover:text-black">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-600 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Location
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1 mr-2" />
                      <span className="text-sm text-gray-700 flex-1">{location.address}</span>
                    </div>
                    
                    {location.phone && (
                      <div className="flex items-start">
                        <Phone className="h-4 w-4 text-gray-500 mt-1 mr-2" />
                        <span className="text-sm text-gray-700">{location.phone}</span>
                      </div>
                    )}
                    
                    {location.website && (
                      <div className="flex items-start">
                        <Globe className="h-4 w-4 text-gray-500 mt-1 mr-2" />
                        <a 
                          href={location.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 hover:text-blue-800 truncate max-w-[220px]"
                        >
                          {location.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center mt-4">
                      <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                      <span className="text-xs text-amber-600">Last verified 3 days ago</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-[#F28C38] border-[#F28C38] hover:bg-[#F28C38]/10 flex-1 mr-2"
                    onClick={() => location.id && setSelectedLocationId(location.id)}
                  >
                    Select
                  </Button>
                  
                  <Link href={`/client/dashboard?locationId=${location.id}`}>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white flex-1"
                    >
                      View Dashboard
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}