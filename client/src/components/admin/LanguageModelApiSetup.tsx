import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  MessageSquare, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  RadioTower,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiKeysData } from '@shared/schema';

interface LanguageModelApiSetupProps {
  initialProvider?: string;
  initialApiKeys?: Partial<ApiKeysData>;
}

const LanguageModelApiSetup: React.FC<LanguageModelApiSetupProps> = ({
  initialProvider = 'openai',
  initialApiKeys = {},
}) => {
  const { toast } = useToast();
  const [provider, setProvider] = useState(initialProvider || 'openai');
  const [openaiApiKey, setOpenaiApiKey] = useState(initialApiKeys.openai_api_key || '');
  const [claudeApiKey, setClaudeApiKey] = useState(initialApiKeys.claude_api_key || '');
  const [grokApiKey, setGrokApiKey] = useState(initialApiKeys.grok_api_key || '');
  const [deepseekApiKey, setDeepseekApiKey] = useState(initialApiKeys.deepseek_api_key || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update active API key field when provider changes
  useEffect(() => {
    // Form validation logic can be added here
  }, [provider]);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let apiKey = '';
    switch (provider) {
      case 'openai':
        apiKey = openaiApiKey;
        break;
      case 'claude':
        apiKey = claudeApiKey;
        break;
      case 'grok':
        apiKey = grokApiKey;
        break;
      case 'deepseek':
        apiKey = deepseekApiKey;
        break;
    }
    
    if (!apiKey) {
      toast({
        title: "Validation Error",
        description: `API Key for ${getProviderDisplayName(provider)} is required`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    setSetupStatus('idle');
    
    try {
      const response = await fetch('/api/admin/language-model/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          openaiApiKey: provider === 'openai' ? openaiApiKey : undefined,
          claudeApiKey: provider === 'claude' ? claudeApiKey : undefined,
          grokApiKey: provider === 'grok' ? grokApiKey : undefined,
          deepseekApiKey: provider === 'deepseek' ? deepseekApiKey : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSetupStatus('success');
        toast({
          title: "Setup Successful",
          description: data.message || "Language model API setup successful",
          variant: "default",
        });
      } else {
        setSetupStatus('error');
        toast({
          title: "Setup Failed",
          description: data.message || "Failed to set up language model API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up language model API:', error);
      setSetupStatus('error');
      toast({
        title: "Setup Failed",
        description: "An error occurred while setting up language model API",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    let apiKey = '';
    switch (provider) {
      case 'openai':
        apiKey = openaiApiKey;
        break;
      case 'claude':
        apiKey = claudeApiKey;
        break;
      case 'grok':
        apiKey = grokApiKey;
        break;
      case 'deepseek':
        apiKey = deepseekApiKey;
        break;
    }
    
    if (!apiKey) {
      toast({
        title: "Validation Error",
        description: `API Key for ${getProviderDisplayName(provider)} is required`,
        variant: "destructive",
      });
      return;
    }
    
    setIsTesting(true);
    setTestStatus('idle');
    
    try {
      const response = await fetch('/api/admin/language-model/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestStatus('success');
        toast({
          title: "Test Successful",
          description: data.message || `${getProviderDisplayName(provider)} API test successful`,
          variant: "default",
        });
      } else {
        setTestStatus('error');
        toast({
          title: "Test Failed",
          description: data.message || `Failed to test ${getProviderDisplayName(provider)} API`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing language model API:', error);
      setTestStatus('error');
      toast({
        title: "Test Failed",
        description: `An error occurred while testing ${getProviderDisplayName(provider)} API`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderDisplayName = (provider: string): string => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'claude':
        return 'Claude';
      case 'grok':
        return 'Grok';
      case 'deepseek':
        return 'DeepSeek';
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return <Sparkles className="h-4 w-4" />;
      case 'claude':
        return <Lightbulb className="h-4 w-4" />;
      case 'grok':
        return <RadioTower className="h-4 w-4" />;
      case 'deepseek':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-5 border border-[#F28C38]/20 rounded-md bg-white shadow-sm mb-6">
      <h3 className="text-xl font-semibold text-[#006039] mb-4 flex items-center gap-2 border-b pb-2 border-[#c9c08f]/30">
        <MessageSquare className="h-6 w-6 text-[#F28C38]" />
        Language Model API Setup
      </h3>
      
      <div className="bg-[#f4f4f2]/50 p-4 rounded-md border border-[#c9c08f]/30 mb-5">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <AlertCircle className="h-5 w-5 text-[#F28C38]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Language models are used for generating AI content for review replies and posts.
            </p>
            <p className="text-xs text-gray-600">
              Select your preferred AI provider and enter the corresponding API key. You only need to configure one provider.
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSetupSubmit} className="space-y-6">
        {/* Provider Selection */}
        <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
          <h4 className="text-md font-semibold text-[#006039] mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#F28C38]" />
            Language Model Provider
          </h4>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider" className="text-[#333333] font-medium">Select Provider</Label>
              <Select 
                value={provider} 
                onValueChange={setProvider}
              >
                <SelectTrigger className="w-full border-[#c9c08f]/60 focus:ring-[#F28C38]/50 mt-1">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#006039]" />
                      <span>OpenAI</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="claude">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-[#006039]" />
                      <span>Claude (Anthropic)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="grok">
                    <div className="flex items-center gap-2">
                      <RadioTower className="h-4 w-4 text-[#006039]" />
                      <span>Grok (xAI)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deepseek">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#006039]" />
                      <span>DeepSeek</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the AI language model provider you wish to use
              </p>
            </div>
          </div>
        </div>
        
        {/* API Key Section */}
        <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
          <h4 className="text-md font-semibold text-[#006039] mb-3 flex items-center gap-2">
            {getProviderIcon(provider)}
            {getProviderDisplayName(provider)} API Key
          </h4>
          
          {provider === 'openai' && (
            <div>
              <Label htmlFor="openai_api_key" className="text-[#333333] font-medium">OpenAI API Key</Label>
              <Input
                id="openai_api_key"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                type="password"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in your OpenAI dashboard under API keys section
              </p>
            </div>
          )}
          
          {provider === 'claude' && (
            <div>
              <Label htmlFor="claude_api_key" className="text-[#333333] font-medium">Claude API Key</Label>
              <Input
                id="claude_api_key"
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder="Enter your Claude API key"
                type="password"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in your Anthropic dashboard under API keys section
              </p>
            </div>
          )}
          
          {provider === 'grok' && (
            <div>
              <Label htmlFor="grok_api_key" className="text-[#333333] font-medium">Grok API Key</Label>
              <Input
                id="grok_api_key"
                value={grokApiKey}
                onChange={(e) => setGrokApiKey(e.target.value)}
                placeholder="Enter your Grok API key"
                type="password"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in your xAI dashboard under API keys section
              </p>
            </div>
          )}
          
          {provider === 'deepseek' && (
            <div>
              <Label htmlFor="deepseek_api_key" className="text-[#333333] font-medium">DeepSeek API Key</Label>
              <Input
                id="deepseek_api_key"
                value={deepseekApiKey}
                onChange={(e) => setDeepseekApiKey(e.target.value)}
                placeholder="Enter your DeepSeek API key"
                type="password"
                className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in your DeepSeek dashboard under API keys section
              </p>
            </div>
          )}
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
              "Save API Key"
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
            {getProviderDisplayName(provider)} API key has been successfully saved and set as the default language model provider.
          </AlertDescription>
        </Alert>
      )}

      {setupStatus === 'error' && (
        <Alert className="mt-4 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Setup Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            Failed to save {getProviderDisplayName(provider)} API key. Please check your input and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Test Result */}
      {testStatus === 'success' && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Test Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Successfully connected to {getProviderDisplayName(provider)} API. Your API key is valid and ready to use.
          </AlertDescription>
        </Alert>
      )}

      {testStatus === 'error' && (
        <Alert className="mt-4 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Test Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            Failed to connect to {getProviderDisplayName(provider)} API. Please check your API key and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LanguageModelApiSetup;