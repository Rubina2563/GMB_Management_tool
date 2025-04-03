import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { GBPOAuthDialog } from './GBPOAuthDialog';
import axios from 'axios';

interface GBPConnectionDialogProps {
  hasGBPLocations: boolean;
  onConnectGBP: (locationId: string | number) => void;
  className?: string;
  buttonText?: string;
  variant?: "default" | "link" | "destructive" | "outline" | "secondary" | "ghost" | "custom";
  iconClassName?: string;
  hideTextOnMobile?: boolean;
  icon?: React.ReactNode;
}

interface SearchResult {
  id: string;
  name: string;
  address: string;
  selected?: boolean;
}

const GBPConnectionDialog: React.FC<GBPConnectionDialogProps> = ({ 
  hasGBPLocations, 
  onConnectGBP,
  className = '',
  buttonText,
  variant = 'default',
  iconClassName = '',
  hideTextOnMobile = false,
  icon
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [activeTab, setActiveTab] = useState('google');
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Poll for OAuth callback when the window is opened
  useEffect(() => {
    let oauthWindow: Window | null = null;
    let pollTimer: NodeJS.Timeout | null = null;
    
    // Function to handle message from popup
    const handleOAuthCallback = async (code: string) => {
      try {
        setIsLoading(true);
        
        // Send code to backend to exchange for tokens
        const response = await axios.post('/api/gbp/oauth/callback', { code });
        
        if (response.data.success) {
          toast({
            title: "Success!",
            description: "Google Business Profile connected successfully.",
          });
          
          // Close the dialog and tell parent component
          setIsDialogOpen(false);
          
          // Fetch locations and pass the first one
          const locationsResponse = await axios.get('/api/gbp/locations');
          if (locationsResponse.data.success && locationsResponse.data.locations?.length > 0) {
            onConnectGBP(locationsResponse.data.locations[0].id);
          } else {
            onConnectGBP("connected");
          }
        } else {
          toast({
            title: "Authentication Failed",
            description: response.data.message || "Failed to authenticate with Google",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          title: "Authentication Failed",
          description: "Could not complete authentication with Google",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        
        // Close the OAuth window if it's still open
        if (oauthWindow && !oauthWindow.closed) {
          oauthWindow.close();
        }
      }
    };
    
    // Function to initiate Google OAuth
    const initiateGoogleOAuth = async () => {
      if (activeTab === 'google' && isDialogOpen) {
        try {
          setIsLoading(true);
          
          // Get auth URL from backend
          const response = await axios.get('/api/gbp/oauth/url');
          
          if (response.data.success && response.data.auth_url) {
            setAuthUrl(response.data.auth_url);
            
            // Open popup window
            const width = 600;
            const height = 600;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            
            oauthWindow = window.open(
              response.data.auth_url,
              'GoogleOAuth',
              `width=${width},height=${height},left=${left},top=${top}`
            );
            
            // Poll for OAuth callback
            pollTimer = setInterval(() => {
              try {
                if (oauthWindow && oauthWindow.closed) {
                  if (pollTimer) clearInterval(pollTimer);
                  setIsLoading(false);
                  return;
                }
                
                if (oauthWindow && oauthWindow.location.href.includes('code=')) {
                  // Extract code from URL
                  const url = new URL(oauthWindow.location.href);
                  const code = url.searchParams.get('code');
                  
                  if (code) {
                    if (pollTimer) clearInterval(pollTimer);
                    handleOAuthCallback(code);
                  }
                }
              } catch (e) {
                // Cross-origin errors are expected while polling
                // This happens when the window loads non-same-origin URLs
              }
            }, 500);
          } else {
            toast({
              title: "Error",
              description: "Could not generate Google authorization URL",
              variant: "destructive",
            });
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error initiating OAuth:', error);
          toast({
            title: "Error",
            description: "Failed to connect to Google",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      }
    };
    
    // Trigger OAuth when appropriate
    if (activeTab === 'google' && isDialogOpen && !isLoading && !authUrl) {
      initiateGoogleOAuth();
    }
    
    // Clean up timer on unmount or dialog close
    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (oauthWindow && !oauthWindow.closed) {
        oauthWindow.close();
      }
    };
  }, [activeTab, isDialogOpen, isLoading, authUrl, onConnectGBP, toast]);

  // Function to handle search
  const handleSearch = async () => {
    if (!businessName.trim()) {
      toast({
        title: "Business Name Required",
        description: "Please enter a business name to search",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Search for business using Google Places API
      const response = await axios.post('/api/search-places', { 
        query: businessName 
      });
      
      if (response.data.success && response.data.results) {
        // Format results
        const formattedResults = response.data.results.map((result: any) => ({
          id: result.place_id,
          name: result.name,
          address: result.formatted_address || 'No address available',
          selected: false
        }));
        
        setSearchResults(formattedResults);
        
        if (formattedResults.length === 0) {
          toast({
            title: "No Results",
            description: "No businesses found with that name",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Search Failed",
          description: response.data.message || "Could not complete search",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Business search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for businesses",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Function to handle place ID connection
  const handlePlaceIdConnect = async () => {
    if (!placeId.trim()) {
      toast({
        title: "Place ID Required",
        description: "Please enter a Place ID or Maps URL",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Extract place ID from URL if needed
      let cleanPlaceId = placeId;
      if (placeId.includes('maps.google.com')) {
        // Attempt to extract from URL - this is simplified and may need to be more robust
        const matches = placeId.match(/[?&]pb=([^&#]*)/);
        if (matches && matches[1]) {
          const params = decodeURIComponent(matches[1]).split('!');
          for (let i = 0; i < params.length; i++) {
            if (params[i].startsWith('1s')) {
              cleanPlaceId = params[i].substring(2);
              break;
            }
          }
        }
      }
      
      // Connect using Place ID
      const response = await axios.post('/api/gbp/connect-by-place', {
        place_id: cleanPlaceId
      });
      
      if (response.data.success) {
        toast({
          title: "Success!",
          description: "Location connected successfully",
        });
        
        setIsDialogOpen(false);
        onConnectGBP(response.data.location.id);
      } else {
        toast({
          title: "Connection Failed",
          description: response.data.message || "Could not connect location",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Place ID connection error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect location",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle selection of search result
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    setSearchResults(searchResults.map(r => ({
      ...r,
      selected: r.id === result.id
    })));
  };

  // Function to connect selected search result
  const handleConnectSelected = async () => {
    if (!selectedResult) {
      toast({
        title: "Selection Required",
        description: "Please select a business from the search results",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Connect using Place ID of selected result
      const response = await axios.post('/api/gbp/connect-by-place', {
        place_id: selectedResult.id
      });
      
      if (response.data.success) {
        toast({
          title: "Success!",
          description: "Location connected successfully",
        });
        
        setIsDialogOpen(false);
        onConnectGBP(response.data.location.id);
      } else {
        toast({
          title: "Connection Failed",
          description: response.data.message || "Could not connect location",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search result connection error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect location",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle Connect button click
  const handleConnect = () => {
    switch (activeTab) {
      case 'google':
        // Real Google OAuth - handled by useEffect
        break;
      
      case 'search':
        if (selectedResult) {
          handleConnectSelected();
        } else if (!isSearching && searchResults.length === 0) {
          handleSearch();
        } else {
          toast({
            title: "Selection Required",
            description: "Please select a business from the search results",
            variant: "destructive",
          });
        }
        break;
      
      case 'place':
        handlePlaceIdConnect();
        break;
      
      default:
        break;
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={className}>
          <Button 
            variant={variant === 'default' ? undefined : 
                     variant === 'custom' ? 'default' : 
                     variant as "default" | "link" | "destructive" | "outline" | "secondary" | "ghost" | null}
            className={`${className || 'bg-[#F28C38] hover:bg-[#F28C38]/80 text-white'} flex items-center justify-center px-4 py-2 rounded-md shadow-md ${variant === 'custom' ? 'bg-transparent hover:bg-transparent shadow-none p-0' : ''}`}
          >
            <div className="flex items-center">
              {icon ? (
                <span className={iconClassName || "mr-2"}>{icon}</span>
              ) : (
                <BuildingStorefrontIcon className={`h-5 w-5 ${hideTextOnMobile ? 'mr-0 md:mr-2' : 'mr-2'}`} />
              )}
              <span className={hideTextOnMobile ? 'hidden md:inline' : ''}>
                {buttonText || (hasGBPLocations ? "Add New Location" : "Connect Google Business Profile")}
              </span>
            </div>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black font-['Montserrat']">
            Add GBP Location
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Choose a method to connect your Google Business Profile
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="google" className="text-sm">Google Account</TabsTrigger>
            <TabsTrigger value="search" className="text-sm">Business Search</TabsTrigger>
            <TabsTrigger value="place" className="text-sm">Place ID/URL</TabsTrigger>
          </TabsList>
          
          {/* Google Account Connection Tab */}
          <TabsContent value="google">
            <div className="space-y-4">
              <div className="text-center py-6">
                <BuildingStorefrontIcon className="h-14 w-14 mx-auto mb-4 text-[#F28C38]" />
                <h3 className="text-lg font-semibold font-['Montserrat'] mb-2">Connect with Google</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect your Google account to import all your business locations
                </p>
                <Button 
                  className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white flex items-center gap-2 px-4 py-2 rounded-md shadow-md"
                  onClick={handleConnect}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </svg>
                      Connect with Google
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Business Search Tab */}
          <TabsContent value="search">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-search">Business Name Search</Label>
                <div className="flex gap-2">
                  <Input 
                    id="business-search" 
                    placeholder="e.g. Starbucks San Francisco" 
                    className="flex-1"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={isSearching}
                  />
                  <Button 
                    type="button" 
                    className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white"
                    onClick={handleSearch}
                    disabled={isSearching || !businessName.trim()}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SearchIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Search for your business name and location to find your GBP
                </p>
              </div>
              
              {/* Search results */}
              <div className="border rounded-md p-3 text-sm">
                {searchResults.length === 0 ? (
                  <p className="italic text-gray-600">
                    {isSearching ? "Searching..." : "Search results will appear here..."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-black mb-2">Select a business:</p>
                    {searchResults.map((result) => (
                      <div 
                        key={result.id}
                        className={`p-2 rounded cursor-pointer ${
                          result.selected 
                            ? "bg-orange-100 border border-orange-300" 
                            : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                        }`}
                        onClick={() => handleResultSelect(result)}
                      >
                        <p className="font-medium">{result.name}</p>
                        <p className="text-xs text-gray-600">{result.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Place ID/URL Tab */}
          <TabsContent value="place">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="place-id">Google Place ID or Maps URL</Label>
                <Input 
                  id="place-id" 
                  placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4 or maps.google.com URL" 
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Enter a Google Maps URL or Place ID to connect directly
                </p>
              </div>
              
              <div className="bg-[#f4f4f2] rounded-md p-3 text-sm">
                <h4 className="font-medium text-black mb-1">How to find your Place ID:</h4>
                <ol className="list-decimal list-inside text-gray-600 text-xs space-y-1">
                  <li>Search for your business on Google Maps</li>
                  <li>Copy the URL from your browser address bar</li>
                  <li>Paste it in the field above</li>
                </ol>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          {activeTab !== 'google' && (
            <Button 
              type="button" 
              className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white"
              onClick={handleConnect}
              disabled={isLoading || (activeTab === 'place' && !placeId.trim())}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GBPConnectionDialog;