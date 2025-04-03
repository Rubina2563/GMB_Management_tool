import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Globe, Key, CheckCircle, AlertCircle, Lock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleApiSetupProps {
  initialApiKey?: string;
  initialClientId?: string;
  initialClientSecret?: string;
  initialRedirectUri?: string;
}

const GoogleApiSetup: React.FC<GoogleApiSetupProps> = ({
  initialApiKey = '',
  initialClientId = '',
  initialClientSecret = '',
  initialRedirectUri = '',
}) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [clientId, setClientId] = useState(initialClientId);
  const [clientSecret, setClientSecret] = useState(initialClientSecret);
  const [redirectUri, setRedirectUri] = useState(initialRedirectUri || 
    (typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : ''));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [setupResult, setSetupResult] = useState<{
    validatedApis: string[];
    failedApis: string[];
    message: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<{
    workingApis: string[];
    failedApis: string[];
    message: string;
  } | null>(null);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey || !clientId || !clientSecret) {
      toast({
        title: "Validation Error",
        description: "API Key, Client ID, and Client Secret are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    setSetupStatus('idle');
    
    try {
      const response = await fetch('/api/admin/google-api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          clientId,
          clientSecret,
          redirectUri,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSetupStatus('success');
        setSetupResult({
          validatedApis: data.validatedApis || [],
          failedApis: data.failedApis || [],
          message: data.message || 'Google API setup successful'
        });
        toast({
          title: "Setup Successful",
          description: data.message || "Google API setup successful",
          variant: "default",
        });
      } else {
        setSetupStatus('error');
        setSetupResult({
          validatedApis: data.validatedApis || [],
          failedApis: data.failedApis || [],
          message: data.message || 'Google API setup failed'
        });
        toast({
          title: "Setup Failed",
          description: data.message || "Failed to set up Google API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up Google API:', error);
      setSetupStatus('error');
      setSetupResult({
        validatedApis: [],
        failedApis: ["Places", "Maps JavaScript", "Natural Language", "OAuth 2.0"],
        message: 'An error occurred while setting up Google API'
      });
      toast({
        title: "Setup Failed",
        description: "An error occurred while setting up Google API",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus('idle');
    
    try {
      const response = await fetch('/api/admin/google-api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestStatus('success');
        setTestResult({
          workingApis: data.workingApis || [],
          failedApis: data.failedApis || [],
          message: data.message || 'Google API test successful'
        });
        toast({
          title: "Test Successful",
          description: data.message || "Google API test successful",
          variant: "default",
        });
      } else {
        setTestStatus('error');
        setTestResult({
          workingApis: data.workingApis || [],
          failedApis: data.failedApis || [],
          message: data.message || 'Google API test failed'
        });
        toast({
          title: "Test Failed",
          description: data.message || "Failed to test Google API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing Google API:', error);
      setTestStatus('error');
      setTestResult({
        workingApis: [],
        failedApis: ["Places", "Maps JavaScript", "Natural Language", "OAuth 2.0"],
        message: 'An error occurred while testing Google API'
      });
      toast({
        title: "Test Failed",
        description: "An error occurred while testing Google API",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-5 border border-[#F28C38]/20 rounded-md bg-white shadow-sm mb-6">
      <h3 className="text-xl font-semibold text-[#006039] mb-4 flex items-center gap-2 border-b pb-2 border-[#c9c08f]/30">
        <Globe className="h-6 w-6 text-[#F28C38]" />
        Google API Setup
      </h3>
      
      <div className="bg-[#f4f4f2]/50 p-4 rounded-md border border-[#c9c08f]/30 mb-5">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <AlertCircle className="h-5 w-5 text-[#F28C38]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              All Google APIs are part of a single Google Cloud project and share the same credentials.
            </p>
            <ul className="text-xs text-gray-600 list-disc list-inside space-y-1 mb-2">
              <li><span className="font-medium">Google Business Profile APIs:</span> Business info, reviews, posts, photos</li>
              <li><span className="font-medium">Google Places API:</span> Geo-grid coordinates, duplicate listings</li>
              <li><span className="font-medium">Google Maps JavaScript API:</span> Map visualization</li>
              <li><span className="font-medium">Google Natural Language API:</span> Review sentiment analysis</li>
            </ul>
            <p className="text-xs text-gray-600 italic">
              Configure and test your credentials once to enable all Google features.
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSetupSubmit} className="space-y-6">
        {/* API Key Section */}
        <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
          <h4 className="text-md font-semibold text-[#006039] mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-[#F28C38]" />
            API Key
          </h4>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="google_api_key" className="text-[#333333] font-medium">Google API Key</Label>
              <Input
                id="google_api_key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Google API key"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for: Places API, Maps JavaScript API, Natural Language API
              </p>
            </div>
          </div>
        </div>
        
        {/* OAuth Credentials Section */}
        <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
          <h4 className="text-md font-semibold text-[#006039] mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#F28C38]" />
            OAuth 2.0 Credentials
          </h4>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="google_client_id" className="text-[#333333] font-medium">Client ID</Label>
              <Input
                id="google_client_id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your OAuth 2.0 Client ID"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for: Google Business Profile APIs, User Authentication
              </p>
            </div>
            
            <div>
              <Label htmlFor="google_client_secret" className="text-[#333333] font-medium">Client Secret</Label>
              <Input
                id="google_client_secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter your OAuth 2.0 Client Secret"
                type="password"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep this secure and never share it publicly
              </p>
            </div>
            
            <div>
              <Label htmlFor="redirect_uri" className="text-[#333333] font-medium">Redirect URI</Label>
              <Input
                id="redirect_uri"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                placeholder="Enter your OAuth 2.0 Redirect URI"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: https://your-replit-id.replit.dev/api/auth/google/callback
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-[#f4f4f2]/50 rounded border border-[#c9c08f]/30">
            <h5 className="text-xs font-semibold text-[#006039] mb-2">Make sure these APIs are enabled in your Google Cloud Console project:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Google Business Profile API</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Google Places API</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Google Maps JavaScript API</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Google Natural Language API</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            type="submit" 
            className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Credentials"
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline"
            className="border-[#006039] text-[#006039]"
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </div>
      </form>

      {/* Setup Result */}
      {setupStatus === 'success' && setupResult && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Setup Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            {setupResult.message}
            {setupResult.validatedApis.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Validated APIs:</p>
                <ul className="list-disc list-inside text-sm">
                  {setupResult.validatedApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
            {setupResult.failedApis.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Failed APIs:</p>
                <ul className="list-disc list-inside text-sm">
                  {setupResult.failedApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {setupStatus === 'error' && setupResult && (
        <Alert className="mt-4 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Setup Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            {setupResult.message}
            {setupResult.validatedApis.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Validated APIs:</p>
                <ul className="list-disc list-inside text-sm">
                  {setupResult.validatedApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
            {setupResult.failedApis.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Failed APIs:</p>
                <ul className="list-disc list-inside text-sm">
                  {setupResult.failedApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Test Result */}
      {testStatus === 'success' && testResult && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Test Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            {testResult.message}
            {testResult.workingApis.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Working APIs:</p>
                <ul className="list-disc list-inside text-sm">
                  {testResult.workingApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
            {testResult.failedApis.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Failed APIs:</p>
                <ul className="list-disc list-inside text-sm">
                  {testResult.failedApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {testStatus === 'error' && testResult && (
        <Alert className="mt-4 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Test Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            {testResult.message}
            {testResult.workingApis.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Working APIs:</p>
                <ul className="list-disc list-inside text-sm">
                  {testResult.workingApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
            {testResult.failedApis.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Failed APIs:</p>
                <ul className="list-disc list-inside text-sm">
                  {testResult.failedApis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GoogleApiSetup;