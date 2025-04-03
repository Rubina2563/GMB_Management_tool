import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataForSEOApiSetupProps {
  initialEmail?: string;
  initialApiKey?: string;
}

const DataForSEOApiSetup: React.FC<DataForSEOApiSetupProps> = ({
  initialEmail = '',
  initialApiKey = '',
}) => {
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !apiKey) {
      toast({
        title: "Validation Error",
        description: "Email and API Key are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    setSetupStatus('idle');
    
    try {
      const response = await fetch('/api/admin/dataforseo-api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          apiKey,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSetupStatus('success');
        toast({
          title: "Setup Successful",
          description: data.message || "DataForSEO API setup successful",
          variant: "default",
        });
      } else {
        setSetupStatus('error');
        toast({
          title: "Setup Failed",
          description: data.message || "Failed to set up DataForSEO API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up DataForSEO API:', error);
      setSetupStatus('error');
      toast({
        title: "Setup Failed",
        description: "An error occurred while setting up DataForSEO API",
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
      const response = await fetch('/api/admin/dataforseo-api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestStatus('success');
        toast({
          title: "Test Successful",
          description: data.message || "DataForSEO API test successful",
          variant: "default",
        });
      } else {
        setTestStatus('error');
        toast({
          title: "Test Failed",
          description: data.message || "Failed to test DataForSEO API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing DataForSEO API:', error);
      setTestStatus('error');
      toast({
        title: "Test Failed",
        description: "An error occurred while testing DataForSEO API",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-5 border border-[#F28C38]/20 rounded-md bg-white shadow-sm mb-6">
      <h3 className="text-xl font-semibold text-[#006039] mb-4 flex items-center gap-2 border-b pb-2 border-[#c9c08f]/30">
        <BarChart3 className="h-6 w-6 text-[#F28C38]" />
        DataForSEO API Setup
      </h3>
      
      <div className="bg-[#f4f4f2]/50 p-4 rounded-md border border-[#c9c08f]/30 mb-5">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <AlertCircle className="h-5 w-5 text-[#F28C38]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              DataForSEO is used for geo-grid ranking data and local search rankings.
            </p>
            <p className="text-xs text-gray-600">
              This API provides more accurate ranking data than Google Places API and offers additional competitive insights.
              You can sign up for a DataForSEO account at <a href="https://app.dataforseo.com/register" target="_blank" rel="noopener noreferrer" className="text-[#006039] hover:underline">app.dataforseo.com/register</a>.
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSetupSubmit} className="space-y-6">
        {/* DataForSEO Credentials Section */}
        <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
          <div className="space-y-4">
            <div>
              <Label htmlFor="dataforseo_email" className="text-[#333333] font-medium">DataForSEO Account Email</Label>
              <Input
                id="dataforseo_email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your DataForSEO account email"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                The email address you used to register with DataForSEO
              </p>
            </div>
            
            <div>
              <Label htmlFor="dataforseo_api_key" className="text-[#333333] font-medium">DataForSEO API Key</Label>
              <Input
                id="dataforseo_api_key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your DataForSEO API key"
                type="password"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in your DataForSEO dashboard under API Key section
              </p>
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
      {setupStatus === 'success' && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Setup Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            DataForSEO API credentials have been successfully saved.
          </AlertDescription>
        </Alert>
      )}

      {setupStatus === 'error' && (
        <Alert className="mt-4 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Setup Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            Failed to save DataForSEO API credentials. Please check your input and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Test Result */}
      {testStatus === 'success' && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Test Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Successfully connected to DataForSEO API. Your account is active and ready to use.
          </AlertDescription>
        </Alert>
      )}

      {testStatus === 'error' && (
        <Alert className="mt-4 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Test Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            Failed to connect to DataForSEO API. Please check your credentials and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DataForSEOApiSetup;