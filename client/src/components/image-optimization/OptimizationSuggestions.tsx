import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  RefreshCw, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OptimizationSuggestionsProps {
  locationId: string | number;
  currentTab?: string;
  setParentTab?: (tabValue: string) => void;
}

interface OptimizationSuggestion {
  id: number;
  image: string;
  title: string;
  issue: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
  impact: string;
  imageId: string | number;
}

const OptimizationSuggestions: React.FC<OptimizationSuggestionsProps> = ({ locationId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);

  // Fetch actual images from the server
  const { data: imagesData, isLoading: isLoadingImages, error: imagesError } = useQuery({
    queryKey: ['location-images', locationId],
    queryFn: async () => {
      const response = await fetch(`/api/client/gbp-audit/location/${locationId}/images`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load images');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load images');
      }
      
      return data.images;
    },
  });

  // Generate optimization suggestions based on actual images
  useEffect(() => {
    if (imagesData && imagesData.length > 0) {
      const generatedSuggestions: OptimizationSuggestion[] = [];
      
      imagesData.forEach((image: any, index: number) => {
        // Check for missing alt text
        if (!image.altText || image.altText.trim() === '') {
          generatedSuggestions.push({
            id: generatedSuggestions.length + 1,
            image: image.url,
            title: image.title || `Image ${index + 1}`,
            issue: 'Missing alt text',
            recommendation: 'Add descriptive alt text for better accessibility and SEO',
            severity: 'high',
            impact: 'SEO, Accessibility',
            imageId: image.id
          });
        }
        
        // Check for missing keywords
        if (!image.keywords || image.keywords.length === 0) {
          generatedSuggestions.push({
            id: generatedSuggestions.length + 1,
            image: image.url,
            title: image.title || `Image ${index + 1}`,
            issue: 'Missing keywords',
            recommendation: 'Add relevant keywords to improve searchability',
            severity: 'medium',
            impact: 'Search Visibility',
            imageId: image.id
          });
        }
        
        // Check for missing geo tagging
        if (!image.geoTag || !image.geoTag.lat || !image.geoTag.lng) {
          generatedSuggestions.push({
            id: generatedSuggestions.length + 1,
            image: image.url,
            title: image.title || `Image ${index + 1}`,
            issue: 'Missing geolocation data',
            recommendation: 'Add geolocation data to improve local search relevance',
            severity: 'medium',
            impact: 'Local SEO',
            imageId: image.id
          });
        }
      });
      
      setSuggestions(generatedSuggestions);
    }
  }, [imagesData]);

  const isLoading = isLoadingImages;
  const error = imagesError;

  const handleApplySuggestion = (suggestionId: number) => {
    // Find the suggestion
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Navigate to edit the image
    window.location.href = `/image-optimization#current-images-${suggestion.imageId}`;
    
    toast({
      title: "Redirecting to Edit Image",
      description: "You'll be redirected to edit this image and fix the issue.",
      variant: "default",
    });
  };

  const handleRefreshSuggestions = () => {
    // Refresh images data by refreshing the query
    queryClient.invalidateQueries({ queryKey: ['location-images', locationId] });
    
    toast({
      title: "Refreshing Suggestions",
      description: "Analyzing your images for new optimization opportunities...",
      variant: "default",
    });
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-amber-500 bg-amber-50';
      case 'low':
        return 'text-blue-500 bg-blue-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#F28C38]" />
        <span className="ml-2 text-gray-600">Analyzing images...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
        Error loading optimization suggestions. Please try again later.
      </div>
    );
  }
  
  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 bg-white rounded-lg">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-black">No Optimization Issues Found</h3>
        <p className="text-gray-600 text-center mt-2">
          Your images don't have any optimization issues. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl font-bold text-black">Image Optimization Suggestions</CardTitle>
            <CardDescription className="text-gray-600">
              Recommendations to improve your image performance and visibility.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center text-black"
            onClick={handleRefreshSuggestions}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Analysis
          </Button>
        </CardHeader>
        <CardContent>
          <Card className="bg-[#F28C38]/10 border-[#F28C38] mb-6">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="bg-white p-2 rounded-full">
                  <ImageIcon className="h-6 w-6 text-[#F28C38]" />
                </div>
                <div>
                  <h3 className="text-black font-medium">Optimize for better visibility</h3>
                  <p className="text-sm text-gray-700">
                    Applying these suggestions can improve your image performance in search results and enhance 
                    user engagement on your Google Business Profile.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Table className="w-full">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-black">Image</TableHead>
                <TableHead className="text-black">Issue</TableHead>
                <TableHead className="text-black">Recommendation</TableHead>
                <TableHead className="text-black">Severity</TableHead>
                <TableHead className="text-black">Impact</TableHead>
                <TableHead className="text-black">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions && suggestions.map((suggestion: any) => (
                <TableRow key={suggestion.id}>
                  <TableCell className="align-middle">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={suggestion.image} 
                        alt={suggestion.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                      <span className="text-sm font-medium text-black">{suggestion.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-black">{suggestion.issue}</TableCell>
                  <TableCell className="text-black">{suggestion.recommendation}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(suggestion.severity)}`}>
                      {getSeverityIcon(suggestion.severity)}
                      <span className="ml-1 capitalize">{suggestion.severity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-black">{suggestion.impact}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      className="bg-[#F28C38] text-white hover:bg-[#F28C38]/90 w-full"
                      onClick={() => handleApplySuggestion(suggestion.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizationSuggestions;