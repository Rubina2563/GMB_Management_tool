import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoogleApiSetup from './GoogleApiSetup';
import DataForSEOApiSetup from './DataForSEOApiSetup';
import LanguageModelApiSetup from './LanguageModelApiSetup';
import { ApiKeysData } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Globe, BarChart3, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ApiSetupTab: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeysData | null>(null);
  const [activeTab, setActiveTab] = useState('google');

  // Fetch API keys from server
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/api-keys'],
    queryFn: async () => {
      const response = await fetch('/api/api-keys');
      const data = await response.json();
      return data;
    },
  });

  // Update API keys state when data is fetched
  useEffect(() => {
    if (data?.success && data.apiKeys) {
      setApiKeys(data.apiKeys);
    }
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="bg-[#f4f4f2]/50 p-4 rounded-md border border-[#c9c08f]/30 mb-5">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <AlertCircle className="h-5 w-5 text-[#F28C38]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              API Setup & Management
            </p>
            <p className="text-xs text-gray-600">
              Configure and manage your API connections for various services. These settings apply system-wide for all users.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load API keys. Please refresh the page and try again.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="google" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google" className="flex gap-2 items-center">
            <Globe className="h-4 w-4" />
            <span>Google APIs</span>
          </TabsTrigger>
          <TabsTrigger value="dataforseo" className="flex gap-2 items-center">
            <BarChart3 className="h-4 w-4" />
            <span>DataForSEO</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="flex gap-2 items-center">
            <MessageSquare className="h-4 w-4" />
            <span>Language Model</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="google" className="pt-4">
          {isLoading ? (
            <div className="text-center p-6">
              <div className="animate-spin h-6 w-6 border-2 border-[#006039] border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading Google API setup...</p>
            </div>
          ) : (
            <GoogleApiSetup 
              initialApiKey={apiKeys?.google_api_key || ''}
              initialClientId={apiKeys?.google_client_id || ''}
              initialClientSecret={apiKeys?.google_client_secret || ''}
              initialRedirectUri={apiKeys?.gbp_redirect_uri || ''}
            />
          )}
        </TabsContent>
        
        <TabsContent value="dataforseo" className="pt-4">
          {isLoading ? (
            <div className="text-center p-6">
              <div className="animate-spin h-6 w-6 border-2 border-[#006039] border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading DataForSEO API setup...</p>
            </div>
          ) : (
            <DataForSEOApiSetup 
              initialEmail={apiKeys?.data_for_seo_email || ''}
              initialApiKey={apiKeys?.data_for_seo_key || ''}
            />
          )}
        </TabsContent>
        
        <TabsContent value="language" className="pt-4">
          {isLoading ? (
            <div className="text-center p-6">
              <div className="animate-spin h-6 w-6 border-2 border-[#006039] border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading Language Model API setup...</p>
            </div>
          ) : (
            <LanguageModelApiSetup 
              initialProvider={apiKeys?.language_model_provider || 'openai'}
              initialApiKeys={{
                openai_api_key: apiKeys?.openai_api_key || '',
                claude_api_key: apiKeys?.claude_api_key || '',
                grok_api_key: apiKeys?.grok_api_key || '',
                deepseek_api_key: apiKeys?.deepseek_api_key || '',
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiSetupTab;