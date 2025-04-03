import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Loader2, Users, Key, ArrowRight, Map, Settings, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ApiKeysData } from '@shared/schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ApiSetupTab from '@/components/admin/ApiSetupTab';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState<'users' | 'apiKeys' | 'apiSetup'>('users');
  const [geoGridApiPreference, setGeoGridApiPreference] = useState<'dataforseo' | 'google-places'>('dataforseo');
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  const [preferenceUpdateStatus, setPreferenceUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch geo-grid API preference when component mounts
  useEffect(() => {
    const fetchApiPreference = async () => {
      try {
        const response = await fetch('/api/admin/geo-grid-api/preference', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.preferredApi) {
          setGeoGridApiPreference(data.preferredApi);
        }
      } catch (error) {
        console.error('Failed to fetch geo-grid API preference:', error);
      }
    };
    
    fetchApiPreference();
  }, []);

  // Handle geo-grid API preference change
  const handleGeoGridApiPreferenceChange = async (preference: 'dataforseo' | 'google-places') => {
    setIsUpdatingPreference(true);
    setPreferenceUpdateStatus('idle');
    
    try {
      const response = await fetch('/api/admin/geo-grid-api/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredApi: preference
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeoGridApiPreference(preference);
        setPreferenceUpdateStatus('success');
        toast({
          title: "Settings Updated",
          description: "Geo-grid API preference has been updated successfully.",
          variant: "default",
        });
      } else {
        setPreferenceUpdateStatus('error');
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update Geo-grid API preference.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating geo-grid API preference:', error);
      setPreferenceUpdateStatus('error');
      toast({
        title: "Update Failed",
        description: "An error occurred while updating the Geo-grid API preference.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPreference(false);
    }
  };

  // Mock users data - in a real app this would come from an API
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      // Normally, we'd fetch this from the server
      // For now, return mock data
      return {
        totalUsers: 12,
        newUsersToday: 3,
        activeUsers: 8
      };
    }
  });

  // Get API keys summary
  const { data: apiKeyStats, isLoading: apiKeysLoading } = useQuery({
    queryKey: ['/api/admin/api-keys-stats'],
    queryFn: async () => {
      // Normally, we'd fetch this from the server
      // For now, return mock data
      return {
        totalKeys: 18,
        activeKeys: 15,
        expiredKeys: 3
      };
    }
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <p className="text-gray-600">
          Welcome back, {user?.username}. Manage your platform efficiently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border-[#a37e2c] border-t-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#006039] text-xl">Total Users</CardTitle>
            <CardDescription>Platform user count</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#a37e2c]" />
            ) : (
              <div className="text-3xl font-bold text-[#006039]">{usersData?.totalUsers}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[#a37e2c] border-t-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#006039] text-xl">New Users Today</CardTitle>
            <CardDescription>Recent signups</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#a37e2c]" />
            ) : (
              <div className="text-3xl font-bold text-[#006039]">{usersData?.newUsersToday}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[#a37e2c] border-t-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#006039] text-xl">Active API Keys</CardTitle>
            <CardDescription>Keys in use</CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeysLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#a37e2c]" />
            ) : (
              <div className="text-3xl font-bold text-[#006039]">{apiKeyStats?.activeKeys} / {apiKeyStats?.totalKeys}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex space-x-4 mb-6 flex-wrap gap-y-2">
        <Button
          variant={selectedSection === 'users' ? 'default' : 'outline'}
          className={selectedSection === 'users' ? 'bg-[#006039] hover:bg-[#004d2e]' : 'border-[#006039] text-[#006039]'}
          onClick={() => setSelectedSection('users')}
        >
          <Users className="h-4 w-4 mr-2" />
          User Management
        </Button>
        <Button
          variant={selectedSection === 'apiKeys' ? 'default' : 'outline'}
          className={selectedSection === 'apiKeys' ? 'bg-[#006039] hover:bg-[#004d2e]' : 'border-[#006039] text-[#006039]'}
          onClick={() => setSelectedSection('apiKeys')}
        >
          <Key className="h-4 w-4 mr-2" />
          API Key Status
        </Button>
        <Button
          variant={selectedSection === 'apiSetup' ? 'default' : 'outline'}
          className={selectedSection === 'apiSetup' ? 'bg-[#006039] hover:bg-[#004d2e]' : 'border-[#006039] text-[#006039]'}
          onClick={() => setSelectedSection('apiSetup')}
        >
          <Settings className="h-4 w-4 mr-2" />
          API Setup
        </Button>
      </div>

      {selectedSection === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#006039]">User Management</CardTitle>
            <CardDescription>View and manage platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#a37e2c]" />
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">John Doe</div>
                              <div className="text-sm text-gray-500">john@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Admin
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-[#006039] hover:text-[#004d2e] mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Disable</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">Jane Smith</div>
                              <div className="text-sm text-gray-500">jane@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Client
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-[#006039] hover:text-[#004d2e] mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Disable</button>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSection === 'apiKeys' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#006039]">API Key Status</CardTitle>
            <CardDescription>Monitor and manage API key usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeysLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#a37e2c]" />
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">John Doe</div>
                              <div className="text-sm text-gray-500">john@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">Google API</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-[#006039] hover:text-[#004d2e] mr-3">View</button>
                          <button className="text-red-600 hover:text-red-900">Revoke</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">Jane Smith</div>
                              <div className="text-sm text-gray-500">jane@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">SERP API</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Expired
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-[#006039] hover:text-[#004d2e] mr-3">View</button>
                          <button className="text-blue-600 hover:text-blue-900">Renew</button>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSection === 'apiSetup' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#006039]">API Setup</CardTitle>
            <CardDescription>Configure system-wide API settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiSetupTab />
            
            <div className="mt-6">
            {/* Geo-Grid API Preference */}
            <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50">
              <div className="flex items-center gap-2 mb-4">
                <Map className="h-5 w-5 text-[#006039]" />
                <h3 className="text-lg font-semibold text-[#006039]">Geo-Grid API Preference</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Select the API source to use for geo-grid ranking data. This setting affects all users of the platform.
              </p>
              
              <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="dataforseo-toggle"
                        value="dataforseo"
                        checked={geoGridApiPreference === "dataforseo"}
                        onChange={() => handleGeoGridApiPreferenceChange("dataforseo")}
                        disabled={isUpdatingPreference}
                        className="text-[#a37e2c] focus:ring-[#a37e2c] h-4 w-4"
                      />
                      <label htmlFor="dataforseo-toggle" className="text-gray-900 font-medium">
                        DataForSEO API
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 ml-6 mt-1">
                      More comprehensive data with advanced metrics and deeper insights
                    </p>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="google-places-toggle"
                        value="google-places"
                        checked={geoGridApiPreference === "google-places"}
                        onChange={() => handleGeoGridApiPreferenceChange("google-places")}
                        disabled={isUpdatingPreference}
                        className="text-[#a37e2c] focus:ring-[#a37e2c] h-4 w-4"
                      />
                      <label htmlFor="google-places-toggle" className="text-gray-900 font-medium">
                        Google Places API
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 ml-6 mt-1">
                      Direct from Google with simplified ranking results
                    </p>
                  </div>
                </div>
              </div>
              
              {preferenceUpdateStatus === 'success' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-800 text-sm">Settings Updated</AlertTitle>
                  <AlertDescription className="text-green-700 text-xs">
                    Geo-grid API preference has been successfully updated to {geoGridApiPreference === 'dataforseo' ? 'DataForSEO' : 'Google Places API'}.
                  </AlertDescription>
                </Alert>
              )}
              
              {preferenceUpdateStatus === 'error' && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-800 text-sm">Update Failed</AlertTitle>
                  <AlertDescription className="text-red-700 text-xs">
                    There was an error updating the geo-grid API preference. Please try again.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline"
                  className="text-[#006039] border-[#006039] hover:bg-[#006039] hover:text-white"
                  onClick={() => setPreferenceUpdateStatus('idle')}
                  disabled={preferenceUpdateStatus === 'idle' || isUpdatingPreference}
                >
                  Clear Status
                </Button>
              </div>
            </div>
            
            {/* Google API Configuration */}
            <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-[#006039]" />
                <h3 className="text-lg font-semibold text-[#006039]">Google API Configuration</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Configure Google API settings for all connected Google services. All Google APIs share the same project credentials.
              </p>
              
              <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
                <Link href="/api-keys">
                  <Button className="bg-[#a37e2c] hover:bg-[#866723] text-white transition-colors w-full sm:w-auto">
                    Manage Google API Keys
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Link href="/api-keys">
          <Button className="bg-[#a37e2c] hover:bg-[#866723]">
            Manage All API Keys
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}