import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Helmet } from 'react-helmet';
import { useLocationContext } from '@/lib/location-context';
import CurrentImages from "@/components/image-optimization/CurrentImages";
import OptimizationSuggestions from "@/components/image-optimization/OptimizationSuggestions";
import GeoTagging from "@/components/image-optimization/GeoTagging";
import UploadImages from "@/components/image-optimization/UploadImages";
import ComingSoon from "@/components/ComingSoon";
import { jsPDF } from 'jspdf';
import { useQueryClient } from '@tanstack/react-query';

interface ImageOptimizationPageProps {
  locationId?: string | number;
  activeTabDefault?: string;
}

interface GBPImage {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  uploadDate: string;
  keywords?: string[];
  description?: string;
  geoData?: {
    latitude?: number;
    longitude?: number;
  };
}

const ImageOptimizationPage: React.FC<ImageOptimizationPageProps> = ({ 
  locationId, 
  activeTabDefault = "current-images" 
}) => {
  // Use useRef to persist the active tab value between renders
  const activeTabRef = useRef(activeTabDefault);
  const [activeTab, setActiveTab] = useState(activeTabDefault);
  const { toast } = useToast();
  const { selectedLocation } = useLocationContext();
  const queryClient = useQueryClient();
  
  // Set active tab when activeTabDefault changes
  useEffect(() => {
    activeTabRef.current = activeTabDefault;
    setActiveTab(activeTabDefault);
  }, [activeTabDefault]);
  
  // Create a custom tab change handler that updates both state and ref
  const handleTabChange = (value: string) => {
    activeTabRef.current = value;
    setActiveTab(value);
  };
  
  // Custom function to force a specific tab (used by child components)
  const forceTab = (tabValue: string) => {
    console.log('Forcing tab to:', tabValue);
    activeTabRef.current = tabValue;
    setActiveTab(tabValue);
  };
  
  // Get page title based on active tab
  const getPageTitle = () => {
    switch(activeTab) {
      case 'current-images':
        return 'Current GBP Images';
      case 'upload-images':
        return 'Upload Images';
      case 'optimization-suggestions':
        return 'Image Optimization Suggestions';
      case 'geo-tagging':
        return 'Image Geo Tagging';
      default:
        return 'Image Optimization';
    }
  };

  // Handle image report download
  const handleDownloadReport = async () => {
    try {
      if (!selectedLocation) {
        toast({
          title: "No Location Selected",
          description: "Please select a location to generate a report.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Generating Report",
        description: "Your image optimization report is being generated...",
        variant: "default",
      });

      // Get images data
      const response = await fetch(`/api/client/gbp-audit/location/${selectedLocation.id}/images`);
      const data = await response.json();
      const images = (data.images || []) as GBPImage[];

      // Create PDF document
      const doc = new jsPDF();
      
      // Add heading
      doc.setFontSize(20);
      doc.setTextColor(242, 140, 56); // #F28C38
      doc.text('Image Optimization Report', 105, 20, { align: 'center' });
      
      // Add business name and date
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Business: ${selectedLocation.name}`, 20, 35);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 42);
      
      // Add summary
      doc.setFontSize(16);
      doc.setTextColor(60, 60, 60);
      doc.text('Image Summary', 20, 55);
      
      doc.setFontSize(11);
      doc.text(`Total Images: ${images.length}`, 25, 65);
      
      // Categories summary
      const categories: Record<string, number> = {};
      for (const img of images) {
        categories[img.category] = (categories[img.category] || 0) + 1;
      }
      
      doc.text('Image Categories:', 25, 75);
      let y = 85;
      for (const [category, count] of Object.entries(categories)) {
        doc.text(`• ${category}: ${count} images`, 30, y);
        y += 7;
      }
      
      // Image list
      if (images.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(60, 60, 60);
        doc.text('Image Details', 20, y + 10);
        
        y += 20;
        for (let i = 0; i < Math.min(images.length, 10); i++) {
          const img = images[i];
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text(`Image ${i+1}: ${img.title}`, 25, y);
          
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(`Category: ${img.category}`, 30, y + 6);
          doc.text(`Upload Date: ${img.uploadDate}`, 30, y + 12);
          doc.text(`Keywords: ${img.keywords?.join(', ') || 'None'}`, 30, y + 18);
          
          y += 25;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        }
      }
      
      // Add recommendations
      doc.setFontSize(16);
      doc.setTextColor(60, 60, 60);
      doc.text('Recommendations', 20, y + 10);
      
      y += 20;
      const recommendations = [
        'Ensure all images have descriptive titles and alt text',
        'Add geolocation data to images to improve local search visibility',
        'Use high-quality images that showcase your business',
        'Include images of different categories (exterior, interior, products, etc.)',
        'Update images seasonally to keep your profile fresh'
      ];
      
      for (const rec of recommendations) {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`• ${rec}`, 25, y);
        y += 7;
      }
      
      // Save the PDF
      doc.save(`image-optimization-report-${selectedLocation.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      
      toast({
        title: "Report Downloaded",
        description: "Your image optimization report has been downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-0 mt-8">
      <Helmet>
        <title>{getPageTitle()} | LocalAuthority</title>
      </Helmet>
      
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Image Optimization" 
          description="Optimize your business images to increase engagement and visibility on Google Business Profile"
        />
        <div className="flex">
          <Button 
            variant="outline" 
            className="flex items-center bg-white border-gray-300 text-black hover:bg-[#F28C38] hover:text-white"
            onClick={handleDownloadReport}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full mb-8 grid grid-cols-4 bg-white text-black">
            <TabsTrigger 
              value="current-images"
              className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white"
            >
              Current Images
            </TabsTrigger>
            <TabsTrigger 
              value="upload-images"
              className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white"
            >
              Upload Images
            </TabsTrigger>
            <TabsTrigger 
              value="optimization-suggestions"
              className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white"
            >
              Optimization Suggestions
            </TabsTrigger>
            <TabsTrigger 
              value="geo-tagging"
              className="data-[state=active]:bg-[#F28C38] data-[state=active]:text-white"
            >
              Geo Tagging
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="current-images" className="mt-0">
            {selectedLocation ? (
              <CurrentImages 
                locationId={selectedLocation.id}
                currentTab={activeTab}
                setParentTab={forceTab}
              />
            ) : (
              <ComingSoon 
                title="Current Images" 
                description="Please select a location to view and manage your current GBP images."
                showRequestButton={false}
              />
            )}
          </TabsContent>
          
          <TabsContent value="upload-images" className="mt-0">
            {selectedLocation ? (
              <UploadImages 
                locationId={selectedLocation.id}
                currentTab={activeTab}
                setParentTab={forceTab}
              />
            ) : (
              <ComingSoon 
                title="Upload Images" 
                description="Please select a location to upload new images to your GBP profile."
                showRequestButton={false}
              />
            )}
          </TabsContent>
          
          <TabsContent value="optimization-suggestions" className="mt-0">
            {selectedLocation ? (
              <OptimizationSuggestions 
                locationId={selectedLocation.id}
                currentTab={activeTab}
                setParentTab={forceTab}
              />
            ) : (
              <ComingSoon 
                title="Optimization Suggestions" 
                description="Please select a location to view optimization suggestions for your images."
                showRequestButton={false}
              />
            )}
          </TabsContent>
          
          <TabsContent value="geo-tagging" className="mt-0">
            {selectedLocation ? (
              <GeoTagging 
                locationId={selectedLocation.id}
                currentTab={activeTab}
                setParentTab={forceTab}
              />
            ) : (
              <ComingSoon 
                title="Image Geo Tagging" 
                description="Please select a location to geo-tag your business images."
                showRequestButton={false}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ImageOptimizationPage;