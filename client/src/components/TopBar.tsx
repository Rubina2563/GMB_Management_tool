import { useState, useEffect } from 'react';
import { Bell, Search, Users, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import LocationSelector from './LocationSelector';
import CampaignSelector from './CampaignSelector';
import ClientSwitcher from './ClientSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showCampaignSelector, setShowCampaignSelector] = useState(false);
  const [showClientSwitcher, setShowClientSwitcher] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [locations, setLocations] = useState<Array<{id: number, name: string, address: string}>>([]);
  
  // Fetch selected client on component mount (for admin users)
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchSelectedClient = async () => {
        try {
          const response = await axios.get('/api/admin/selected-client');
          if (response.data.success && response.data.client) {
            setSelectedClientId(response.data.client.id);
          }
        } catch (error) {
          console.error('Error fetching selected client:', error);
        }
      };
      
      fetchSelectedClient();
    }
  }, [user]);
  
  // Handle client selection change
  const handleClientChange = async (clientId: number) => {
    setSelectedClientId(clientId);
    try {
      // Call API to set admin to manage this client
      await axios.post(`/api/admin/select-client/${clientId}`);
      // Optional: Reload the page or refresh relevant data
      window.location.reload();
    } catch (error) {
      console.error('Error switching client:', error);
    }
  };
  
  // Only show the location selector on client pages
  useEffect(() => {
    const path = window.location.pathname;
    // Check if this is a client page or one of the specific routes where location selector is needed
    const shouldShowLocation = path.startsWith('/client') || 
                      path.includes('/reviews') || 
                      path.includes('/posts') || 
                      path.includes('/optimization') ||
                      path.includes('/citations') ||
                      path.includes('/keywords') ||
                      path.includes('/campaigns') ||
                      path.includes('/gbp-audit');
                      
    // Check if this is a page where campaign selector is needed
    const shouldShowCampaign = path.includes('/campaigns') || 
                             path.includes('/local-dashboard') ||
                             path.includes('/ranking-reports') ||
                             path.includes('/geo-grid');
                             
    // Show client switcher for admin users on most pages
    const shouldShowClientSwitcher = user?.role === 'admin' && (
                             path.startsWith('/admin') || 
                             path.startsWith('/client') ||
                             path.includes('/dashboard') ||
                             path.includes('/local-') ||
                             path.includes('/rankings') ||
                             path.includes('/reviews') ||
                             path.includes('/posts') ||
                             path.includes('/optimization') ||
                             path.includes('/client-management'));
                      
    setShowLocationSelector(shouldShowLocation);
    setShowCampaignSelector(shouldShowCampaign);
    setShowClientSwitcher(shouldShowClientSwitcher);
  }, [user]);
  
  // Listen for route changes (since this component doesn't re-mount between client pages)
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const shouldShowLocation = path.startsWith('/client') || 
                        path.includes('/reviews') || 
                        path.includes('/posts') || 
                        path.includes('/optimization') ||
                        path.includes('/citations') ||
                        path.includes('/keywords') ||
                        path.includes('/campaigns') ||
                        path.includes('/gbp-audit');
      
      // Check if this is a page where campaign selector is needed
      const shouldShowCampaign = path.includes('/campaigns') || 
                               path.includes('/local-dashboard') ||
                               path.includes('/ranking-reports') ||
                               path.includes('/geo-grid');
      
      // Show client switcher for admin users on most pages
      const shouldShowClientSwitcher = user?.role === 'admin' && (
                               path.startsWith('/admin') || 
                               path.startsWith('/client') ||
                               path.includes('/dashboard') ||
                               path.includes('/local-') ||
                               path.includes('/rankings') ||
                               path.includes('/reviews') ||
                               path.includes('/posts') ||
                               path.includes('/optimization') ||
                               path.includes('/client-management'));
                        
      setShowLocationSelector(shouldShowLocation);
      setShowCampaignSelector(shouldShowCampaign);
      setShowClientSwitcher(shouldShowClientSwitcher);
    };
    
    // Create a MutationObserver to watch for DOM changes that might indicate navigation
    const observer = new MutationObserver(handleRouteChange);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Add event listener for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [user]);

  // Fetch clients count for admin users
  const { data: clientsData } = useQuery({
    queryKey: ['/api/admin/clients'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/admin/clients');
        return response.data;
      } catch (error) {
        console.error('Error fetching clients:', error);
        return { success: false, clients: [] };
      }
    },
    enabled: user?.role === 'admin' && showClientSwitcher
  });
  
  // Fetch locations for location selector
  const { data: locationsData } = useQuery({
    queryKey: ['/api/gbp/locations'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/gbp/locations');
        return response.data;
      } catch (error) {
        console.error('Error fetching locations:', error);
        return { success: false, locations: [] };
      }
    },
    enabled: showLocationSelector
  });

  // Set locations from query result
  useEffect(() => {
    if (locationsData?.success && locationsData?.locations) {
      setLocations(locationsData.locations);
    }
  }, [locationsData]);
  
  // Handle location change
  const handleLocationChange = (locationId: number) => {
    setSelectedLocationId(locationId);
    // You might want to add additional logic here like storing in local storage
  };
  
  // Format clients data to match ClientSwitcher props
  const formattedClients = clientsData?.clients ? 
    clientsData.clients.map((client: {id: number; username?: string; locations?: any[]}) => ({
      id: client.id,
      name: client.username || 'Client',
      locations: client.locations || []
    })) : [];
  
  const clientsCount = clientsData?.clients?.length || 0;

  return (
    <div className="top-bar border-b border-gray-200 bg-white flex items-center justify-between p-2 px-4 h-16">
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search..." 
            className="pl-8 bg-gray-100 border-0 focus-visible:ring-1 focus-visible:ring-gray-300" 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Show clients count card for admin users */}
        {user?.role === 'admin' && (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-3 flex items-center space-x-2">
              <Users className="h-5 w-5 text-[#F28C38]" />
              <div>
                <div className="text-sm font-medium text-black">Clients</div>
                <div className="text-xl font-bold text-black">{clientsCount}</div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Show client switcher for admin users */}
        {showClientSwitcher && formattedClients.length > 0 && (
          <ClientSwitcher 
            clients={formattedClients}
            selectedClientId={selectedClientId}
            onClientChange={handleClientChange}
          />
        )}
        
        {/* Show location selector conditionally */}
        {showLocationSelector && (
          <LocationSelector 
            className="mr-4"
            locations={locations}
            selectedLocationId={selectedLocationId}
            onLocationChange={handleLocationChange}
          />
        )}
        
        {/* Show campaign selector conditionally */}
        {showCampaignSelector && (
          <CampaignSelector className="mr-4" />
        )}
        
        {/* Add New Location button */}
        {showLocationSelector && (
          <Link href="/client/add-location">
            <Button className="bg-[#F28C38] hover:bg-[#F28C38]/90 text-white h-9 px-3 py-2 inline-flex items-center whitespace-nowrap">
              <Plus className="h-4 w-4 mr-1" />
              <span>Add Location</span>
            </Button>
          </Link>
        )}
        
        <ThemeToggle />
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}