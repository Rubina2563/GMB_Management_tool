import { useEffect, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  Map, 
  Globe, 
  Search,
  AlertCircle,
  LockKeyhole,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiKeysSchema, ApiKeysData } from "@shared/schema";
import { getApiKeys, saveApiKeys, updateApiKeys } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const ApiKeysPage = () => {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [initialKeys, setInitialKeys] = useState<ApiKeysData | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // API Test States
  const [testingGoogleAPI, setTestingGoogleAPI] = useState(false);
  const [testingDataForSEO, setTestingDataForSEO] = useState(false);
  const [testingGBPAPI, setTestingGBPAPI] = useState(false);
  const [testingGeoGrid, setTestingGeoGrid] = useState(false);
  const [testingLLMAPI, setTestingLLMAPI] = useState(false);
  const [googleAPIStatus, setGoogleAPIStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [dataForSEOStatus, setDataForSEOStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [gbpAPIStatus, setGbpAPIStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [geoGridStatus, setGeoGridStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [llmAPIStatus, setLlmAPIStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [testResults, setTestResults] = useState<{
    google?: { success: boolean; message: string; data?: any };
    dataForSEO?: { success: boolean; message: string; data?: any };
    gbp?: { success: boolean; message: string; data?: any };
    geoGrid?: { success: boolean; message: string; data?: any };
    llm?: { success: boolean; message: string; data?: any };
  }>({});

  // Create form with zod validation
  const form = useForm<z.infer<typeof apiKeysSchema>>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      data_for_seo_key: "",
      data_for_seo_email: "",
      google_api_key: "",
      google_client_id: "",
      google_client_secret: "",
      serp_api_key: "",
      // Google Business Profile API fields
      gbp_client_id: "",
      gbp_client_secret: "",
      gbp_redirect_uri: "",
      // Geo Grid API preference
      geo_grid_api_preference: "dataforseo",
      // Language Model API fields
      language_model_provider: "",
      openai_api_key: "",
      claude_api_key: "",
      grok_api_key: "",
      deepseek_api_key: "",
    },
  });

  // Load existing keys on mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await getApiKeys();
        if (response.success && response.api_keys) {
          // Update form with existing values
          form.reset(response.api_keys);
          setInitialKeys(response.api_keys);
        }
      } catch (error) {
        toast({
          title: "Error loading API keys",
          description: "Could not retrieve your saved API keys.",
          variant: "destructive",
        });
      }
    };

    if (user) {
      fetchApiKeys();
    }
  }, [user, form, toast]);
  
  // This effect runs when the active tab changes
  // It ensures that test buttons are properly enabled/disabled based on current form values
  useEffect(() => {
    if (activeTab === "testing" && initialKeys) {
      // When switching to testing tab, make sure form has latest values
      const currentValues = form.getValues();
      console.log("Tab changed, current form values:", currentValues);
      
      // Force a form refresh to update Test Connection button states
      setTimeout(() => {
        form.trigger();
      }, 100);
    }
  }, [activeTab, form, initialKeys]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof apiKeysSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Determine if we should create or update based on whether keys exist
      const response = initialKeys 
        ? await updateApiKeys(values)
        : await saveApiKeys(values);
      
      if (response.success) {
        // Make sure we update initialKeys with the latest values
        const updatedKeys = response.api_keys || values;
        setInitialKeys(updatedKeys);
        
        // Reset the form with the latest values to ensure it's in sync
        form.reset(updatedKeys);
        
        // Update test tab states if we're testing
        if (activeTab === "testing") {
          setTimeout(() => {
            // Force a revalidation of form fields to update the disabled state of test buttons
            form.trigger();
          }, 100);
        }
        
        toast({
          title: "API Keys Saved",
          description: "Your API keys have been securely stored.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Saving API Keys",
        description: error.message || "Could not save your API keys.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Test Google Places API
  const testGoogleAPI = async () => {
    const googleAPIKey = form.getValues("google_api_key");
    
    if (!googleAPIKey) {
      toast({
        title: "Google API Key Required",
        description: "Please enter a Google API key to test.",
        variant: "destructive",
      });
      return;
    }
    
    setTestingGoogleAPI(true);
    setGoogleAPIStatus('idle');
    
    try {
      // Use our server-side endpoint to test the API key
      const response = await axios.post('/api/test-google-places', {
        api_key: googleAPIKey
      });
      
      if (response.data.success) {
        setGoogleAPIStatus('success');
        setTestResults(prev => ({
          ...prev,
          google: {
            success: true,
            message: response.data.message,
            data: response.data.data
          }
        }));
      } else {
        setGoogleAPIStatus('error');
        setTestResults(prev => ({
          ...prev,
          google: {
            success: false,
            message: response.data.message || "API key validation failed",
          }
        }));
      }
    } catch (error: any) {
      setGoogleAPIStatus('error');
      setTestResults(prev => ({
        ...prev,
        google: {
          success: false,
          message: error.response?.data?.message || error.message || "Connection error",
        }
      }));
    } finally {
      setTestingGoogleAPI(false);
    }
  };
  
  // Test DataForSEO API
  const testDataForSEOAPI = async () => {
    // Use getCurrentFormValues to get the most up-to-date values
    // This is important for testing just after saving
    const currentValues = form.getValues();
    const dataForSEOKey = currentValues.data_for_seo_key;
    const dataForSEOEmail = currentValues.data_for_seo_email;
    
    console.log("Testing DataForSEO API with:", { dataForSEOKey, dataForSEOEmail });
    
    if (!dataForSEOKey || !dataForSEOEmail) {
      toast({
        title: "DataForSEO Credentials Required",
        description: "Please enter both a DataForSEO API key and email to test.",
        variant: "destructive",
      });
      return;
    }
    
    setTestingDataForSEO(true);
    setDataForSEOStatus('idle');
    
    try {
      // Use our dedicated DataForSEO endpoint to test the credentials
      const response = await axios.post('/api/client/dataforseo/test', {
        login: dataForSEOEmail,
        password: dataForSEOKey
      });
      
      if (response.data.success) {
        setDataForSEOStatus('success');
        setTestResults(prev => ({
          ...prev,
          dataForSEO: {
            success: true,
            message: "DataForSEO API is working correctly with Basic Authentication!",
            data: response.data.data
          }
        }));
        
        // Since the test was successful, let's make sure these values are saved in the form
        // and our initialKeys state - solving both the disappearing email and test button issues
        const updatedKeys = {
          ...(initialKeys || {}),
          data_for_seo_key: dataForSEOKey,
          data_for_seo_email: dataForSEOEmail
        };
        
        // Only update if we really need to
        if (initialKeys?.data_for_seo_key !== dataForSEOKey || 
            initialKeys?.data_for_seo_email !== dataForSEOEmail) {
          
          // Update API keys in the backend
          updateApiKeys(updatedKeys).then(() => {
            // Update our local state
            setInitialKeys(updatedKeys);
            
            // Make sure form is in sync
            form.reset(updatedKeys);
            
            toast({
              title: "API Keys Updated",
              description: "Your DataForSEO credentials have been updated and verified.",
            });
          });
        }
      } else {
        setDataForSEOStatus('error');
        setTestResults(prev => ({
          ...prev,
          dataForSEO: {
            success: false,
            message: response.data.message || "Authentication failed",
          }
        }));
      }
    } catch (error: any) {
      setDataForSEOStatus('error');
      setTestResults(prev => ({
        ...prev,
        dataForSEO: {
          success: false,
          message: error.response?.data?.message || error.message || "Connection error",
        }
      }));
    } finally {
      setTestingDataForSEO(false);
    }
  };
  
  // Test Google Business Profile API
  const testGBPAPI = async () => {
    // Get current values
    const currentValues = form.getValues();
    const gbpClientId = currentValues.gbp_client_id;
    const gbpClientSecret = currentValues.gbp_client_secret;
    const gbpRedirectUri = currentValues.gbp_redirect_uri;
    
    if (!gbpClientId || !gbpClientSecret || !gbpRedirectUri) {
      toast({
        title: "GBP Credentials Required",
        description: "Please enter Client ID, Client Secret, and Redirect URI to test.",
        variant: "destructive",
      });
      return;
    }
    
    setTestingGBPAPI(true);
    setGbpAPIStatus('idle');
    
    try {
      // Use the server endpoint to validate the GBP credentials
      const response = await axios.post('/api/test-gbp-api', {
        client_id: gbpClientId,
        client_secret: gbpClientSecret,
        redirect_uri: gbpRedirectUri
      });
      
      if (response.data.success) {
        setGbpAPIStatus('success');
        setTestResults(prev => ({
          ...prev,
          gbp: {
            success: true,
            message: response.data.message,
            data: response.data.data
          }
        }));
        
        // If test is successful, ensure values are saved
        const updatedKeys = {
          ...(initialKeys || {}),
          gbp_client_id: gbpClientId,
          gbp_client_secret: gbpClientSecret,
          gbp_redirect_uri: gbpRedirectUri
        };
        
        // Only update if needed
        if (initialKeys?.gbp_client_id !== gbpClientId || 
            initialKeys?.gbp_client_secret !== gbpClientSecret ||
            initialKeys?.gbp_redirect_uri !== gbpRedirectUri) {
          
          // Update API keys in the backend
          updateApiKeys(updatedKeys).then(() => {
            // Update local state
            setInitialKeys(updatedKeys);
            
            // Make sure form is in sync
            form.reset(updatedKeys);
            
            toast({
              title: "API Keys Updated",
              description: "Your Google Business Profile API credentials have been updated and verified.",
            });
          });
        }
      } else {
        setGbpAPIStatus('error');
        setTestResults(prev => ({
          ...prev,
          gbp: {
            success: false,
            message: response.data.message || "Invalid GBP API credentials",
          }
        }));
      }
    } catch (error: any) {
      setGbpAPIStatus('error');
      setTestResults(prev => ({
        ...prev,
        gbp: {
          success: false,
          message: error.response?.data?.message || error.message || "Connection error",
        }
      }));
    } finally {
      setTestingGBPAPI(false);
    }
  };
  
  // Test Geo-Grid Functionality using DataForSEO Rank Tracker API
  const testGeoGridAPI = async () => {
    // Get DataForSEO credentials from form
    const dataForSEOKey = form.getValues("data_for_seo_key");
    const dataForSEOEmail = form.getValues("data_for_seo_email");
    
    if (!dataForSEOKey || !dataForSEOEmail) {
      toast({
        title: "DataForSEO Credentials Required",
        description: "Please enter DataForSEO login and password to test geo-grid ranking functionality.",
        variant: "destructive",
      });
      return;
    }
    
    setTestingGeoGrid(true);
    setGeoGridStatus('idle');
    
    try {
      // Use our DataForSEO local-rankings endpoint to test geo-grid functionality
      const response = await axios.get('/api/client/dataforseo/local-rankings', {
        params: {
          keyword: "local business", 
          businessName: "Example Business",
          lat: 34.0522, // Los Angeles
          lng: -118.2437
        }
      });
      
      if (response.data.success) {
        // Extract actual DataForSEO ranking data
        const rankingData = response.data.data;
        
        setGeoGridStatus('success');
        setTestResults(prev => ({
          ...prev,
          geoGrid: {
            success: true,
            message: "Local ranking data successfully retrieved from DataForSEO!",
            data: {
              center: { lat: 34.0522, lng: -118.2437 },
              gridSize: "5x5",
              metrics: {
                afpr: rankingData.afpr.toFixed(1), // Average First Page Rank
                tgrm: rankingData.tgrm.toFixed(1), // Total Grid Rank Mean
                tss: rankingData.tss.toFixed(1) + '%' // Top Spot Share
              },
              points: rankingData.gridData
            }
          }
        }));
      } else {
        setGeoGridStatus('error');
        setTestResults(prev => ({
          ...prev,
          geoGrid: {
            success: false,
            message: response.data.message || "Failed to create geo-grid."
          }
        }));
      }
    } catch (error: any) {
      setGeoGridStatus('error');
      setTestResults(prev => ({
        ...prev,
        geoGrid: {
          success: false,
          message: error.response?.data?.message || error.message || "Connection error"
        }
      }));
    } finally {
      setTestingGeoGrid(false);
    }
  };
  
  // Test Language Model API
  const testLLMAPI = async () => {
    // Get values from form
    const provider = form.getValues("language_model_provider");
    let apiKey = "";
    
    // Get the API key based on selected provider
    switch (provider) {
      case "openai":
        apiKey = form.getValues("openai_api_key");
        break;
      case "claude":
        apiKey = form.getValues("claude_api_key");
        break;
      case "grok":
        apiKey = form.getValues("grok_api_key");
        break;
      case "deepseek":
        apiKey = form.getValues("deepseek_api_key");
        break;
      default:
        toast({
          title: "Language Model Provider Required",
          description: "Please select a language model provider and enter an API key.",
          variant: "destructive",
        });
        return;
    }
    
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: `Please enter a valid ${provider.toUpperCase()} API key to test.`,
        variant: "destructive",
      });
      return;
    }
    
    setTestingLLMAPI(true);
    setLlmAPIStatus('idle');
    
    try {
      // Make an actual API call to test the language model configuration
      const response = await fetch('/api/client/language-model/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          modelProvider: provider,
          apiKey: apiKey
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify API key');
      }
      
      if (data.success) {
        setLlmAPIStatus('success');
        setTestResults(prev => ({
          ...prev,
          llm: {
            success: true,
            message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API connection successful!`,
            data: {
              provider,
              validKey: true
            }
          }
        }));
      } else {
        throw new Error(data.message || 'API key validation failed');
      }
      
      // Save the successful API key configuration
      const updatedKeys = {
        ...(initialKeys || {}),
        language_model_provider: provider,
        openai_api_key: provider === "openai" ? apiKey : initialKeys?.openai_api_key || "",
        claude_api_key: provider === "claude" ? apiKey : initialKeys?.claude_api_key || "",
        grok_api_key: provider === "grok" ? apiKey : initialKeys?.grok_api_key || "",
        deepseek_api_key: provider === "deepseek" ? apiKey : initialKeys?.deepseek_api_key || ""
      };
      
      // Update API keys in the backend
      updateApiKeys(updatedKeys).then(() => {
        // Update local state
        setInitialKeys(updatedKeys);
        
        // Make sure form is in sync
        form.reset(updatedKeys);
        
        toast({
          title: "API Keys Updated",
          description: `Your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API credentials have been updated and verified.`,
        });
      });
      
    } catch (error: any) {
      setLlmAPIStatus('error');
      setTestResults(prev => ({
        ...prev,
        llm: {
          success: false,
          message: error.response?.data?.message || error.message || "Connection error"
        }
      }));
    } finally {
      setTestingLLMAPI(false);
    }
  };

  // Redirect if not authenticated
  if (!isLoading && !user) {
    return <Redirect to="/auth" />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a37e2c]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-[#a37e2c]" />
          </div>
          <p className="text-gray-600 mt-2">
            Securely store and test your API keys to connect with various services.
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger 
              value="general" 
              className={activeTab === 'general' ? 'bg-[#a37e2c] text-white' : 'hover:bg-[#c9c08f]/50'}
            >
              API Key Configuration
            </TabsTrigger>
            <TabsTrigger 
              value="testing" 
              className={activeTab === 'testing' ? 'bg-[#a37e2c] text-white' : 'hover:bg-[#c9c08f]/50'}
            >
              API Key Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-[#c9c08f] shadow-md">
              <CardHeader className="bg-[#f4f4f2]">
                <CardTitle className="text-[#006039]">Manage Your API Keys</CardTitle>
                <CardDescription>
                  Your API keys are encrypted and securely stored. They're only used when you make requests to the associated services.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* DataForSEO Section */}
                    <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50">
                      <h3 className="text-lg font-semibold text-[#006039] mb-4 flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        DataForSEO Configuration
                      </h3>
                      
                      {/* DataForSEO API Key */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="data_for_seo_key"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#006039] font-semibold">DataForSEO API Key</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your DataForSEO API key"
                                  className="border-[#c9c08f] focus-visible:ring-[#a37e2c]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Used for SEO data and analytics. Format: alphanumeric, 20-64 characters.
                              </FormDescription>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        {/* DataForSEO Email */}
                        <FormField
                          control={form.control}
                          name="data_for_seo_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#006039] font-semibold">DataForSEO Account Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Enter your DataForSEO account email"
                                  className="border-[#c9c08f] focus-visible:ring-[#a37e2c]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                The email address associated with your DataForSEO account.
                              </FormDescription>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        {/* Geo Grid API Preference has been moved to the Admin Dashboard */}
                      </div>
                    </div>
                    
                    {/* Google API Setup - Unified Section */}
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
                      
                      <div className="space-y-6">
                        {/* API Key Section */}
                        <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
                          <h4 className="text-md font-semibold text-[#006039] mb-3 flex items-center gap-2">
                            <Key className="h-4 w-4 text-[#F28C38]" />
                            API Key
                          </h4>
                          
                          {/* Google API Key */}
                          <FormField
                            control={form.control}
                            name="google_api_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#333333] font-medium">Google API Key</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your Google API key"
                                    className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  <span className="text-xs">Used for: Places API, Maps JavaScript API, Natural Language API</span>
                                </FormDescription>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* OAuth Credentials Section */}
                        <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
                          <h4 className="text-md font-semibold text-[#006039] mb-3 flex items-center gap-2">
                            <LockKeyhole className="h-4 w-4 text-[#F28C38]" />
                            OAuth 2.0 Credentials
                          </h4>
                          <p className="text-xs text-gray-600 mb-4">
                            Required for Google Business Profile API access and user authentication
                          </p>
                          
                          <div className="grid gap-4">
                            {/* Client ID */}
                            <FormField
                              control={form.control}
                              name="google_client_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#333333] font-medium">Client ID</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter your OAuth 2.0 Client ID"
                                      className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-red-500" />
                                </FormItem>
                              )}
                            />
                            
                            {/* Client Secret */}
                            <FormField
                              control={form.control}
                              name="google_client_secret"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#333333] font-medium">Client Secret</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter your OAuth 2.0 Client Secret"
                                      className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50"
                                      type="password"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-red-500" />
                                </FormItem>
                              )}
                            />
                            
                            {/* Redirect URI */}
                            <FormField
                              control={form.control}
                              name="gbp_redirect_uri"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#333333] font-medium">Redirect URI</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="http://localhost:3000/oauth2callback"
                                      className="border-[#c9c08f]/60 focus-visible:ring-[#F28C38]/50"
                                      defaultValue="http://localhost:3000/oauth2callback"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    <span className="text-xs">The URI where Google will redirect after authentication</span>
                                  </FormDescription>
                                  <FormMessage className="text-red-500" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        {/* Required API Services */}
                        <div className="bg-white p-4 rounded-md border border-[#c9c08f]/30">
                          <h4 className="text-md font-semibold text-[#006039] mb-2">Required API Services</h4>
                          <p className="text-xs text-gray-600 mb-3">
                            Make sure these APIs are enabled in your Google Cloud Console project:
                          </p>
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
                    </div>
                    
                    {/* Bind Google Client data to GBP client data with effect */}
                    <div className="hidden">
                      <input type="hidden" name="gbp_client_id" value={form.getValues("google_client_id")} />
                      <input type="hidden" name="gbp_client_secret" value={form.getValues("google_client_secret")} />
                    </div>

                    {/* SERP API Key */}
                    <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50">
                      <h3 className="text-lg font-semibold text-[#006039] mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        SERP API Configuration
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="serp_api_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#006039] font-semibold">SERP API Key (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your SERP API key (optional)"
                                className="border-[#c9c08f] focus-visible:ring-[#a37e2c]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Used for search engine results data. Format: alphanumeric, 32-64 characters.
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Language Model API Section */}
                    <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50">
                      <h3 className="text-lg font-semibold text-[#006039] mb-4 flex items-center gap-2">
                        <LockKeyhole className="h-5 w-5" />
                        Language Model API Configuration
                      </h3>
                      
                      <div className="p-4 bg-white border border-[#c9c08f]/20 rounded-md mb-5">
                        <h4 className="text-md font-semibold text-[#006039] mb-3">Provider Selection</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Select and configure your preferred language model provider for AI-powered features.
                        </p>
                        
                        <FormField
                          control={form.control}
                          name="language_model_provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#006039] font-semibold">Language Model Provider</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full p-2 border border-[#c9c08f] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a37e2c]"
                                  {...field}
                                >
                                  <option value="">Select a provider</option>
                                  <option value="openai">OpenAI</option>
                                  <option value="claude">Claude (Anthropic)</option>
                                  <option value="grok">Grok</option>
                                  <option value="deepseek">DeepSeek</option>
                                </select>
                              </FormControl>
                              <FormDescription>
                                Choose your preferred AI provider for natural language processing features.
                              </FormDescription>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* OpenAI API Key */}
                      {form.watch("language_model_provider") === "openai" && (
                        <div className="space-y-4 p-4 bg-white border border-[#c9c08f]/20 rounded-md">
                          <FormField
                            control={form.control}
                            name="openai_api_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#006039] font-semibold">OpenAI API Key</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your OpenAI API key"
                                    className="border-[#c9c08f] focus-visible:ring-[#a37e2c]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Used for AI-powered features like review responses and content generation.
                                </FormDescription>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {/* Claude API Key */}
                      {form.watch("language_model_provider") === "claude" && (
                        <div className="space-y-4 p-4 bg-white border border-[#c9c08f]/20 rounded-md">
                          <FormField
                            control={form.control}
                            name="claude_api_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#006039] font-semibold">Claude API Key</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your Claude API key"
                                    className="border-[#c9c08f] focus-visible:ring-[#a37e2c]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Used for AI-powered features with Anthropic's Claude.
                                </FormDescription>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {/* Grok API Key */}
                      {form.watch("language_model_provider") === "grok" && (
                        <div className="space-y-4 p-4 bg-white border border-[#c9c08f]/20 rounded-md">
                          <FormField
                            control={form.control}
                            name="grok_api_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#006039] font-semibold">Grok API Key</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your Grok API key"
                                    className="border-[#c9c08f] focus-visible:ring-[#a37e2c]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Used for AI-powered features with Grok.
                                </FormDescription>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {/* DeepSeek API Key */}
                      {form.watch("language_model_provider") === "deepseek" && (
                        <div className="space-y-4 p-4 bg-white border border-[#c9c08f]/20 rounded-md">
                          <FormField
                            control={form.control}
                            name="deepseek_api_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#006039] font-semibold">DeepSeek API Key</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your DeepSeek API key"
                                    className="border-[#c9c08f] focus-visible:ring-[#a37e2c]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Used for AI-powered features with DeepSeek.
                                </FormDescription>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        className="bg-[#a37e2c] hover:bg-[#c9c08f] text-white transition-colors"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save API Keys"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="bg-[#f4f4f2]/50 flex flex-col items-start px-6 py-4 border-t border-[#c9c08f]/30">
                <h3 className="text-[#006039] font-semibold mb-2">Security Note</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your API keys are encrypted before being stored in our database. We recommend regularly rotating your keys as a security best practice.
                </p>
                <div className="flex items-center gap-2 text-sm text-[#a37e2c]">
                  <Key className="h-4 w-4" />
                  <span>Keys last updated: {initialKeys ? new Date().toLocaleDateString() : "Never"}</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="testing">
            <Card className="border-[#c9c08f] shadow-md">
              <CardHeader className="bg-[#f4f4f2]">
                <CardTitle className="text-[#006039]">Test Your API Keys</CardTitle>
                <CardDescription>
                  Verify that your API keys are valid and have the correct permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Google Places API Test */}
                <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Map className="h-5 w-5 text-[#006039]" />
                      <h3 className="text-lg font-semibold text-[#006039]">Google Places API</h3>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={testGeoGridAPI}
                        disabled={testingGeoGrid || !form.getValues("google_api_key")}
                        className="bg-[#F28C38] hover:bg-[#F5A461] text-white transition-colors"
                        size="sm"
                      >
                        {testingGeoGrid ? "Testing Grid..." : "Test Geo-Grid"}
                      </Button>
                      
                      <Button 
                        onClick={testGoogleAPI}
                        disabled={testingGoogleAPI || !form.getValues("google_api_key")}
                        className="bg-[#a37e2c] hover:bg-[#c9c08f] text-white transition-colors"
                        size="sm"
                      >
                        {testingGoogleAPI ? "Testing..." : "Test Connection"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-3 bg-white rounded border border-[#c9c08f]/30">
                    <h4 className="text-sm font-semibold text-[#006039] mb-2">Google Places API Features:</h4>
                    <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                      <li>Geo-grid mapping for GBP Rankings (5x5, 7x7 grids)</li>
                      <li>Duplicate listings identification and analysis</li>
                      <li>Local keyword insights for optimization</li>
                    </ul>
                  </div>
                  
                  {googleAPIStatus === 'idle' && !testResults.google && (
                    <div className="text-gray-500 text-sm">
                      Click "Test Connection" to verify your Google Places API key.
                    </div>
                  )}
                  
                  {googleAPIStatus === 'success' && testResults.google && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        {testResults.google.message}
                        {testResults.google.data && (
                          <div className="mt-2 text-sm">
                            <div>Status: {testResults.google.data.status}</div>
                            <div>Results: {testResults.google.data.resultsCount} places found</div>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {googleAPIStatus === 'error' && testResults.google && (
                    <Alert className="bg-red-50 border-red-200">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {testResults.google.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {googleAPIStatus === 'warning' && testResults.google && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Connection Warning</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        {testResults.google.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Geo-Grid Test Results */}
                  {geoGridStatus === 'success' && testResults.geoGrid && (
                    <div className="mt-4">
                      <Alert className="bg-green-50 border-green-200 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertTitle className="text-green-800">Geo-Grid Creation Successful</AlertTitle>
                        <AlertDescription className="text-green-700">
                          {testResults.geoGrid.message}
                        </AlertDescription>
                      </Alert>
                      
                      {testResults.geoGrid.data && (
                        <div className="bg-white p-4 border border-[#c9c08f]/30 rounded-md">
                          <h4 className="font-semibold text-[#006039] mb-2">5x5 Geo-Grid Sample</h4>
                          <div className="relative h-48 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                            <div className="absolute inset-0 p-2">
                              <div className="grid grid-cols-5 grid-rows-5 h-full w-full gap-1">
                                {testResults.geoGrid.data.points.map((point) => (
                                  <div 
                                    key={point.id}
                                    className={`rounded-md flex items-center justify-center text-xs 
                                      ${point.businessName ? 'bg-[#F28C38] text-white font-bold' : 
                                        point.rank <= 3 ? 'bg-green-100 border border-green-300' :
                                        point.rank <= 7 ? 'bg-yellow-50 border border-yellow-200' :
                                        'bg-gray-100 border border-gray-200'}`}
                                  >
                                    {point.rank}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-600">
                            <p>Center: Business location at ({testResults.geoGrid.data.center.lat.toFixed(4)}, {testResults.geoGrid.data.center.lng.toFixed(4)})</p>
                            <p className="mt-1">Grid Size: {testResults.geoGrid.data.gridSize} (configurable to 3x3, 5x5, 7x7)</p>
                            <p className="mt-1">Numbers represent ranking positions in search results</p>
                          </div>
                          <p className="mt-3 text-xs text-gray-500">
                            This is a simulation of how the geo-grid will be generated in the Rankings page. 
                            Actual implementation will use real-time data from Google Places API.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {geoGridStatus === 'error' && testResults.geoGrid && (
                    <Alert className="bg-red-50 border-red-200 mt-4">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <AlertTitle className="text-red-800">Geo-Grid Creation Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {testResults.geoGrid.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* DataForSEO Test */}
                <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-[#006039]" />
                      <h3 className="text-lg font-semibold text-[#006039]">DataForSEO API</h3>
                    </div>
                    
                    <Button 
                      onClick={testDataForSEOAPI}
                      disabled={testingDataForSEO}
                      className="bg-[#a37e2c] hover:bg-[#c9c08f] text-white transition-colors"
                      size="sm"
                    >
                      {testingDataForSEO ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                  
                  {dataForSEOStatus === 'idle' && !testResults.dataForSEO && (
                    <div className="text-gray-500 text-sm">
                      Click "Test Connection" to verify your DataForSEO API credentials.
                    </div>
                  )}
                  
                  {dataForSEOStatus === 'success' && testResults.dataForSEO && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        {testResults.dataForSEO.message}
                        {testResults.dataForSEO.data && (
                          <div className="mt-2 text-sm">
                            <div>Account verified successfully</div>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {dataForSEOStatus === 'error' && testResults.dataForSEO && (
                    <Alert className="bg-red-50 border-red-200">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {testResults.dataForSEO.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* Google Business Profile API Test */}
                <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50 mt-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-[#006039]" />
                      <h3 className="text-lg font-semibold text-[#006039]">Google Business Profile API</h3>
                    </div>
                    
                    <Button 
                      onClick={testGBPAPI}
                      disabled={testingGBPAPI || !form.getValues('gbp_client_id') || !form.getValues('gbp_client_secret') || !form.getValues('gbp_redirect_uri')}
                      className="bg-[#a37e2c] hover:bg-[#c9c08f] text-white transition-colors"
                      size="sm"
                    >
                      {testingGBPAPI ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                  
                  {gbpAPIStatus === 'idle' && !testResults.gbp && (
                    <div className="text-gray-500 text-sm">
                      Click "Test Connection" to verify your Google Business Profile API credentials.
                    </div>
                  )}
                  
                  {gbpAPIStatus === 'success' && testResults.gbp && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        {testResults.gbp.message}
                        {testResults.gbp.data && (
                          <div className="mt-2 text-sm">
                            <div>OAuth configuration verified successfully</div>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {gbpAPIStatus === 'error' && testResults.gbp && (
                    <Alert className="bg-red-50 border-red-200">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {testResults.gbp.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* Language Model API Test */}
                <div className="p-5 border border-[#c9c08f]/30 rounded-md bg-[#f4f4f2]/50 mt-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#F28C38]" />
                      <h3 className="text-lg font-semibold text-[#006039]">Language Model API</h3>
                    </div>
                    
                    <Button 
                      onClick={testLLMAPI}
                      disabled={
                        testingLLMAPI || 
                        !form.getValues('language_model_provider') || 
                        !(form.getValues('openai_api_key') || 
                          form.getValues('claude_api_key') || 
                          form.getValues('grok_api_key') || 
                          form.getValues('deepseek_api_key'))
                      }
                      className="bg-[#F28C38] hover:bg-[#F5A461] text-white transition-colors"
                      size="sm"
                    >
                      {testingLLMAPI ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                  
                  <div className="mb-4 p-3 bg-white rounded border border-[#c9c08f]/30">
                    <h4 className="text-sm font-semibold text-[#006039] mb-2">Supported Language Model Providers:</h4>
                    <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                      <li>OpenAI API (ChatGPT, GPT-4)</li>
                      <li>Claude API (Anthropic)</li>
                      <li>Grok API</li>
                      <li>DeepSeek API</li>
                    </ul>
                  </div>
                  
                  {llmAPIStatus === 'idle' && !testResults.llm && (
                    <div className="text-gray-500 text-sm">
                      Configure and test your preferred language model provider for AI-powered features.
                    </div>
                  )}
                  
                  {llmAPIStatus === 'success' && testResults.llm && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        {testResults.llm.message}
                        {testResults.llm.data && (
                          <div className="mt-2 text-sm">
                            <div>Provider: {testResults.llm.data.provider}</div>
                            <div>AI-powered features are now available</div>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {llmAPIStatus === 'error' && testResults.llm && (
                    <Alert className="bg-red-50 border-red-200">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {testResults.llm.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-[#f4f4f2]/50 flex flex-col items-start px-6 py-4 border-t border-[#c9c08f]/30">
                <h3 className="text-[#006039] font-semibold mb-2">Testing Notes</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Testing your API keys helps ensure they have the correct permissions and are properly configured.
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  For Google Places API, ensure you have enabled the Places API in your Google Cloud Console and configured the proper API restrictions.
                </p>
                <div className="bg-white p-3 rounded border border-[#c9c08f]/30 text-sm text-gray-700">
                  <h4 className="font-semibold text-[#006039] mb-1">Google Places API Implementation:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>API calls are securely managed by the backend</li>
                    <li>Used for generating accurate geo-grid coordinates</li>
                    <li>Powers cross-referencing of GBP and Place IDs</li>
                    <li>Enables location-based keyword research</li>
                  </ul>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApiKeysPage;