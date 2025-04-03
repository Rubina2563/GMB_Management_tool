import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Globe,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Clock,
  FileText,
  ExternalLink,
  ArrowRight,
  Loader2,
  Filter,
  Search,
  PlusCircle,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface BuildLocalCitationsProps {
  campaignId?: number;
}

const BuildLocalCitations: React.FC<BuildLocalCitationsProps> = ({ campaignId }) => {
  const [activeTab, setActiveTab] = useState('directory-submission');
  const [businessName, setBusinessName] = useState('Doctor To You');
  const [website, setWebsite] = useState('https://doctortoyou.com.au');
  const [address, setAddress] = useState('123 Main St, Sydney, NSW 2000, Australia');
  const [phone, setPhone] = useState('+61 2 1234 5678');
  const [email, setEmail] = useState('info@doctortoyou.com.au');
  const [category, setCategory] = useState('Medical Services');
  const [description, setDescription] = useState('Mobile medical services providing at-home doctor visits across Sydney.');
  const [businessHours, setBusinessHours] = useState('Mon-Fri: 8am-6pm, Sat-Sun: 9am-5pm');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch citation directories from API
  const { data: directoriesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/client/local-links/citation-directories', campaignId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/client/local-links/citation-directories?campaignId=${campaignId || ''}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch citation directories');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching citation directories:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Citation directories data (from API or fallback)
  const citationDirectories = directoriesData?.data || [];

  // Define directory type
  interface Directory {
    id: number;
    name: string;
    website: string;
    domainAuthority: number;
    category: string;
    isPaid: boolean;
    relevance: string;
    acceptanceTime: string;
    notes: string;
  }

  // Filter directories based on search term
  const filteredDirectories = citationDirectories.filter((dir: any) => {
    if (!searchTerm) return true;
    return (
      dir.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dir.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dir.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dir.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle directory selection
  const handleDirectorySelect = (id: number) => {
    const selected = citationDirectories.find((dir: any) => dir.id === id);
    setSelectedDirectory(selected ? selected.name : null);
  };

  // Handle citation submission
  const handleSubmitCitation = () => {
    handleSubmitCitationApi();
  };

  // Get relevance color
  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high': return 'bg-[#F28C38] text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Handle API submission for new citation
  const handleSubmitCitationApi = async () => {
    if (!selectedDirectory) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/client/local-links/submit-citation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          directoryId: citationDirectories.find((dir: any) => dir.name === selectedDirectory)?.id,
          businessInfo: {
            name: businessName,
            website,
            address,
            phone,
            email,
            category,
            description,
            businessHours
          }
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit citation');
      }
      
      // Reset selection on success
      setSelectedDirectory(null);
    } catch (error) {
      console.error('Error submitting citation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">Build Local Citations</CardTitle>
          <CardDescription className="text-black">Loading directory data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 text-[#F28C38] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">Build Local Citations</CardTitle>
          <CardDescription className="text-black">Failed to load directory data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-black text-lg mb-4">There was an error loading citation directories</p>
          <Button 
            className="bg-[#F28C38] text-white hover:bg-[#E67D29]"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-black text-2xl">Build Local Citations</CardTitle>
              <CardDescription className="text-black text-lg">
                Improve your business presence across local directories and citation sources
              </CardDescription>
            </div>
            <Button 
              className="bg-[#F28C38] text-white hover:bg-[#E67D29]"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-8 grid grid-cols-2 bg-black">
              <TabsTrigger 
                value="directory-submission" 
                className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white text-white"
              >
                Directory Submission
              </TabsTrigger>
              <TabsTrigger 
                value="citation-manager" 
                className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white text-white"
              >
                Citation Manager
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="directory-submission" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card className="bg-white h-full">
                    <CardHeader>
                      <CardTitle className="text-black">Business Information</CardTitle>
                      <CardDescription className="text-black">
                        NAP details to use for citation submissions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Business Name</label>
                        <Input 
                          value={businessName} 
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="text-black"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Website</label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            value={website} 
                            onChange={(e) => setWebsite(e.target.value)}
                            className="text-black"
                          />
                          <Button variant="outline" size="icon" className="shrink-0">
                            <Globe className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Address</label>
                        <Textarea 
                          value={address} 
                          onChange={(e) => setAddress(e.target.value)}
                          className="text-black"
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Phone Number</label>
                        <Input 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)}
                          className="text-black"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Email</label>
                        <Input 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          className="text-black"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Category</label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="text-black">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Categories</SelectLabel>
                              <SelectItem value="Medical Services">Medical Services</SelectItem>
                              <SelectItem value="Doctor">Doctor</SelectItem>
                              <SelectItem value="Healthcare Provider">Healthcare Provider</SelectItem>
                              <SelectItem value="Urgent Care">Urgent Care</SelectItem>
                              <SelectItem value="Home Healthcare">Home Healthcare</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Business Description</label>
                        <Textarea 
                          value={description} 
                          onChange={(e) => setDescription(e.target.value)}
                          className="text-black"
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black">Business Hours</label>
                        <Input 
                          value={businessHours} 
                          onChange={(e) => setBusinessHours(e.target.value)}
                          className="text-black"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-black">Citation Directories</CardTitle>
                      <CardDescription className="text-black">
                        Select a directory to submit your business information
                      </CardDescription>
                      <div className="relative w-full">
                        <Search className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search directories..."
                          className="pl-8 text-black"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="h-[500px] overflow-y-auto space-y-4">
                      {filteredDirectories.length === 0 ? (
                        <div className="text-center text-black p-8">
                          No directories match your search criteria
                        </div>
                      ) : (
                        filteredDirectories.map((directory: any) => (
                          <Card 
                            key={directory.id} 
                            className={`bg-white border hover:border-[#F28C38] transition-colors cursor-pointer ${selectedDirectory === directory.name ? 'border-[#F28C38] border-2' : ''}`}
                            onClick={() => handleDirectorySelect(directory.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-black text-lg">{directory.name}</h3>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Globe className="h-3.5 w-3.5 mr-1" /> 
                                    <a href={`https://${directory.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                      {directory.website}
                                    </a>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-black border-black">
                                    DA: {directory.domainAuthority}
                                  </Badge>
                                  <Badge className={getRelevanceColor(directory.relevance)}>
                                    {directory.relevance.charAt(0).toUpperCase() + directory.relevance.slice(1)} Relevance
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="flex items-center text-sm text-gray-700">
                                  <Tag className="h-3.5 w-3.5 mr-1" /> 
                                  {directory.category}
                                </div>
                                <div className="flex items-center text-sm text-gray-700">
                                  <Clock className="h-3.5 w-3.5 mr-1" /> 
                                  {directory.acceptanceTime}
                                </div>
                                <div className="flex items-center text-sm text-gray-700">
                                  {directory.isPaid ? (
                                    <span className="text-amber-600">Paid Listing</span>
                                  ) : (
                                    <span className="text-green-600">Free Listing</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-2 text-sm text-gray-700">
                                <FileText className="h-3.5 w-3.5 inline mr-1" /> 
                                {directory.notes}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-4">
                      <Button variant="outline" className="text-black" onClick={() => setSelectedDirectory(null)}>
                        Clear Selection
                      </Button>
                      <Button 
                        className="bg-[#F28C38] text-white hover:bg-[#E67D29]"
                        onClick={handleSubmitCitation}
                        disabled={!selectedDirectory || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Submit Citation
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="citation-manager" className="space-y-6">
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-black">Active Citations</CardTitle>
                    <Button className="bg-[#F28C38] text-white hover:bg-[#E67D29]">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Citation
                    </Button>
                  </div>
                  <CardDescription className="text-black">
                    Track and manage your existing business citations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left font-semibold text-black">Directory</th>
                          <th className="p-2 text-left font-semibold text-black">Status</th>
                          <th className="p-2 text-left font-semibold text-black">Claimed</th>
                          <th className="p-2 text-left font-semibold text-black">Domain Authority</th>
                          <th className="p-2 text-left font-semibold text-black">Last Updated</th>
                          <th className="p-2 text-left font-semibold text-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-2 text-black">
                            <div className="font-medium">Yellow Pages Australia</div>
                            <div className="text-sm text-gray-500">yellowpages.com.au</div>
                          </td>
                          <td className="p-2">
                            <Badge className="bg-green-500 text-white">Active</Badge>
                          </td>
                          <td className="p-2 text-black">
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" /> 
                              Yes
                            </div>
                          </td>
                          <td className="p-2 text-black">55</td>
                          <td className="p-2 text-black">2025-03-15</td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="text-blue-600">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-[#F28C38]">
                                Update
                              </Button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-2 text-black">
                            <div className="font-medium">HealthEngine</div>
                            <div className="text-sm text-gray-500">healthengine.com.au</div>
                          </td>
                          <td className="p-2">
                            <Badge className="bg-green-500 text-white">Active</Badge>
                          </td>
                          <td className="p-2 text-black">
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" /> 
                              Yes
                            </div>
                          </td>
                          <td className="p-2 text-black">50</td>
                          <td className="p-2 text-black">2025-03-20</td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="text-blue-600">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-[#F28C38]">
                                Update
                              </Button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-2 text-black">
                            <div className="font-medium">Healthdirect Service Finder</div>
                            <div className="text-sm text-gray-500">healthdirect.gov.au</div>
                          </td>
                          <td className="p-2">
                            <Badge className="bg-amber-500 text-white">Pending</Badge>
                          </td>
                          <td className="p-2 text-black">
                            <div className="flex items-center text-red-600">
                              No
                            </div>
                          </td>
                          <td className="p-2 text-black">65</td>
                          <td className="p-2 text-black">2025-03-10</td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="text-blue-600">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-[#F28C38]">
                                Claim
                              </Button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-2 text-black">
                            <div className="font-medium">Yelp Australia</div>
                            <div className="text-sm text-gray-500">yelp.com.au</div>
                          </td>
                          <td className="p-2">
                            <Badge className="bg-green-500 text-white">Active</Badge>
                          </td>
                          <td className="p-2 text-black">
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" /> 
                              Yes
                            </div>
                          </td>
                          <td className="p-2 text-black">58</td>
                          <td className="p-2 text-black">2025-02-28</td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="text-blue-600">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-[#F28C38]">
                                Update
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildLocalCitations;