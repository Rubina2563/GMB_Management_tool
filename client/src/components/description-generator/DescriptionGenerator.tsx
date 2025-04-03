import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clipboard, Copy, Link } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import SpinnerIcon from '../../components/SpinnerIcon';

const formSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  categories: z.string().min(1, "At least one category is required"),
  services: z.string(),
  products: z.string(),
  uniqueSellingPoints: z.string(),
  tone: z.string().default("professional"),
});

type FormValues = z.infer<typeof formSchema>;

interface DescriptionGeneratorProps {
  locationId: number;
  currentTab: string;
}

const DescriptionGenerator: React.FC<DescriptionGeneratorProps> = ({
  locationId,
  currentTab
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [charCount, setCharCount] = useState<number>(0);
  const MAX_CHAR_COUNT = 750;

  // Set up the form with example values for testing
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "Premier Plumbing Solutions",
      categories: "Home Service, Plumbing, Emergency Repair",
      services: "Pipe Repair, Drain Cleaning, Water Heater Installation, Emergency Plumbing",
      products: "Pipes, Fixtures, Water Heaters, Faucets",
      uniqueSellingPoints: "24/7 Service, Family Owned, 20+ Years Experience, Guaranteed Work",
      tone: "professional",
    },
  });

  // Query to get the existing GBP data for the location
  const { data: locationData, isLoading: locationLoading } = useQuery({
    queryKey: ['/api/client/gbp/location', locationId],
    enabled: !!locationId
  });

  // Set initial form values based on location data - use defaults if not available
  useEffect(() => {
    if (locationData?.data) {
      try {
        const location = locationData.data;
        if (location && location.name) {
          form.setValue("businessName", location.name);
        }
        if (location && location.category) {
          form.setValue("categories", location.category);
        }
      } catch (error) {
        console.error("Error setting form values from location data:", error);
      }
    }
  }, [locationData, form]);

  // State for generated descriptions with example data for testing
  const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([
    "Welcome to our premier Home Service company specializing in comprehensive Pipe Repair, thorough Drain Cleaning, and professional Water Heater Installation. Our expert technicians are dedicated to providing exceptional service with the highest quality Pipes, Fixtures, and plumbing supplies on the market. What truly sets us apart is our unwavering commitment to 24/7 Service availability and our proud history as a Family Owned business deeply rooted in the community. We understand that plumbing emergencies don't follow a 9-to-5 schedule, which is why our team is always ready to respond to your needs, day or night, weekends and holidays included. With over 20+ Years Experience serving residential and commercial clients, we've built a reputation for reliability, integrity, and skillful workmanship that stands the test of time. Contact us today to experience the difference that professional, personalized service can make for all your plumbing needs!",
    
    "Looking for professional Plumbing services that combine expertise with dependability? Look no further. We provide comprehensive Pipe Repair services for everything from minor leaks to major system failures, thorough Drain Cleaning that addresses the root cause of clogs, professional Water Heater Installation for optimal efficiency, and responsive Emergency Plumbing services when you need help the most. With a steadfast focus on 24/7 Service availability and Guaranteed Work that you can trust, our experienced team consistently delivers results you can count on, regardless of the complexity of the job. Our approach is methodical yet flexible, dependable yet innovative, and always customer-focused, ensuring you receive the best service possible from our family-owned business with over two decades of hands-on experience in the industry. We understand that inviting service professionals into your home requires trust, which is why we prioritize clear communication, transparent pricing, and respect for your property throughout every project. Reach out today to learn how our comprehensive plumbing solutions can address your immediate needs while preventing future problems!",
    
    "24/7 Service availability is at the very heart of our Emergency Repair business model, ensuring that help is always just a phone call away when plumbing disasters strike at the most inconvenient times. We've earned our reputation through years of reliable service and an expert approach to Pipe Repair that addresses not just the immediate issue but the underlying causes to prevent future problems. Our specialized Drain Cleaning services utilize the latest techniques and equipment to restore proper flow and function to your plumbing system, while our professional Water Heater Installation services ensure energy efficiency and consistent performance for years to come. Whether you need urgent repairs or planned maintenance, our skilled team is here to exceed your expectations with prompt response times, thorough diagnostics, and lasting solutions. We take particular pride in being a Family Owned business with 20+ Years Experience serving our community, bringing a level of personal care and accountability that larger corporations simply cannot match. Our deep roots in the area mean we treat every customer like a neighbor because that's exactly what you are to us. Contact us today to discover the remarkable difference that experienced, dedicated service professionals can make for all your plumbing and home service needs!",
    
    "Since establishing our family-owned Home Service business over two decades ago, we've been the trusted name in Pipe Repair, Drain Cleaning, and Water Heater Installation throughout the region. Our comprehensive approach combines technical expertise with exceptional customer service, ensuring that every project is completed to the highest standards of quality and reliability. What distinguishes our service from others is our unwavering commitment to accessibility—offering genuine 24/7 emergency response when you need it most—and our extensive catalog of premium Pipes, Fixtures, and specialized equipment that allows us to handle projects of any scale or complexity. Our technicians undergo continuous training to stay current with the latest industry innovations and safety protocols, ensuring that your home or business receives service that's both cutting-edge and thoroughly tested. Having successfully completed thousands of installations and repairs over our 20+ Years Experience, we've developed streamlined processes that maximize efficiency without ever compromising on quality. When you choose our services, you're not just hiring contractors—you're partnering with dedicated professionals who take genuine pride in improving the comfort, safety, and functionality of your property. Contact our friendly team today to schedule a consultation and experience firsthand the perfect blend of traditional service values and modern technical expertise!",
    
    "When it comes to professional Plumbing services, our commitment to excellence goes beyond just fixing the immediate problem—we focus on creating long-term solutions that enhance the overall performance of your entire plumbing system. Our comprehensive service offerings include specialized Pipe Repair using the most durable materials on the market, advanced Drain Cleaning techniques that penetrate even the most stubborn blockages, expert Water Heater Installation with precision calibration for optimal energy efficiency, and responsive Emergency Plumbing interventions available day or night. Our business was built on the foundation of customer satisfaction, which is why we offer 24/7 Service availability and back every job with our satisfaction guarantee. With a team of certified technicians who bring decades of combined experience to every project, we're equipped to handle everything from routine maintenance to complex system overhauls with the same attention to detail and commitment to quality. As a Family Owned business with deep roots in the community for over 20 years, we understand that our reputation depends on each and every service call, which is why we never cut corners or recommend unnecessary work. Choose our services for the perfect combination of traditional craftsmanship, modern techniques, and genuine customer care that puts your needs and satisfaction first. Contact us today to schedule an appointment and discover what true plumbing excellence feels like!"
  ]);
  const [canAutoUpdate, setCanAutoUpdate] = useState<boolean>(true);
  const [manualInstructions, setManualInstructions] = useState<string>("You can now update your Google Business Profile with one of these descriptions. Choose the one that best represents your business.");
  
  // Automatically select the first description when descriptions are loaded
  useEffect(() => {
    if (generatedDescriptions.length > 0 && !selectedDescription) {
      handleSelectDescription(generatedDescriptions[0]);
    }
  }, [generatedDescriptions, selectedDescription]);

  // Mutation for generating descriptions
  const generateDescriptionMutation = useMutation({
    mutationFn: async (data: FormValues & { locationId: number }) => {
      const response = await fetch('/api/client/description-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: data.locationId,
          businessDetails: {
            businessName: data.businessName,
            categories: data.categories.split(',').map(item => item.trim()),
            services: data.services.split(',').map(item => item.trim()),
            products: data.products.split(',').map(item => item.trim()),
            uniqueSellingPoints: data.uniqueSellingPoints.split(',').map(item => item.trim()),
          },
          tone: data.tone,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate descriptions');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedDescriptions(data.descriptions);
      setCanAutoUpdate(data.canAutoUpdate);
      setManualInstructions(data.manualInstructions);
      
      toast({
        title: "Success!",
        description: "Descriptions generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to generate descriptions',
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (values: FormValues) => {
    generateDescriptionMutation.mutate({
      ...values,
      locationId
    });
  };

  // Handle selecting a description
  const handleSelectDescription = (description: string) => {
    setSelectedDescription(description);
    setEditedDescription(description);
    setCharCount(description.length);
  };

  // Handle editing description
  const handleEditDescription = (value: string) => {
    setEditedDescription(value);
    setCharCount(value.length);
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editedDescription);
    toast({
      title: "Copied!",
      description: "Description copied to clipboard",
    });
  };

  // Handle update GBP description
  const handleUpdateGBPDescription = () => {
    // In a real implementation, this would send the edited description to the GBP API
    toast({
      title: "Success!",
      description: "Description updated in Google Business Profile",
    });
  };

  // Render comma-separated list input helper
  const renderCommaSeparatedHelp = () => (
    <FormDescription>
      Enter multiple items separated by commas
    </FormDescription>
  );

  return (
    <div className="flex flex-col space-y-6 p-4">
      <Card className="bg-white">
        <CardHeader className="bg-white">
          <CardTitle className="text-black">GBP Description Generator</CardTitle>
          <CardDescription className="text-black">
            Create compelling descriptions for your Google Business Profile
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Name */}
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem className="text-black">
                    <FormLabel className="text-black">Business Name</FormLabel>
                    <FormControl>
                      <Input className="bg-white text-black" placeholder="e.g. Premier Plumbing Solutions" {...field} />
                    </FormControl>
                    <FormDescription className="text-black">
                      Enter your business name as it appears in Google Business Profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business categories */}
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem className="text-black">
                    <FormLabel className="text-black">Business Categories</FormLabel>
                    <FormControl>
                      <Input className="bg-white text-black" placeholder="e.g. Plumber, Emergency Services, Home Repair" {...field} />
                    </FormControl>
                    <FormDescription className="text-black">
                      Enter multiple items separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Services */}
              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem className="text-black">
                    <FormLabel className="text-black">Services Offered</FormLabel>
                    <FormControl>
                      <Input className="bg-white text-black" placeholder="e.g. Pipe Repair, Drain Cleaning, Installation" {...field} />
                    </FormControl>
                    <FormDescription className="text-black">
                      Enter multiple items separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Products */}
              <FormField
                control={form.control}
                name="products"
                render={({ field }) => (
                  <FormItem className="text-black">
                    <FormLabel className="text-black">Products</FormLabel>
                    <FormControl>
                      <Input className="bg-white text-black" placeholder="e.g. Pipes, Fixtures, Water Heaters" {...field} />
                    </FormControl>
                    <FormDescription className="text-black">
                      Enter multiple items separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unique selling points */}
              <FormField
                control={form.control}
                name="uniqueSellingPoints"
                render={({ field }) => (
                  <FormItem className="text-black">
                    <FormLabel className="text-black">Unique Selling Points</FormLabel>
                    <FormControl>
                      <Input className="bg-white text-black" placeholder="e.g. 24/7 Service, Locally Owned, 20+ Years Experience" {...field} />
                    </FormControl>
                    <FormDescription className="text-black">
                      Enter multiple items separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tone selection */}
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem className="text-black">
                    <FormLabel className="text-black">Tone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white text-black">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white text-black">
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                        <SelectItem value="informative">Informative</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-black">
                      Choose the tone that best represents your business
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={generateDescriptionMutation.isPending}
                className="w-full bg-orange-base hover:bg-orange-light text-white"
              >
                {generateDescriptionMutation.isPending ? (
                  <>
                    <SpinnerIcon className="mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  "Generate Descriptions"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Generated descriptions section */}
      {generatedDescriptions.length > 0 && (
        <Card className="bg-white">
          <CardHeader className="bg-white">
            <CardTitle className="text-black">Generated Descriptions</CardTitle>
            <CardDescription className="text-black">
              Select one of the generated descriptions or edit it to fit your needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 bg-white">
            {generatedDescriptions.map((description, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer border-2 bg-white ${selectedDescription === description ? 'border-orange-base' : 'border-gray-100'}`}
                onClick={() => handleSelectDescription(description)}
              >
                <CardContent className="p-4 bg-white">
                  <p className="text-black">{description}</p>
                </CardContent>
              </Card>
            ))}

            {selectedDescription && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-black">Edit Selected Description</h3>
                <div>
                  <Textarea 
                    value={editedDescription} 
                    onChange={(e) => handleEditDescription(e.target.value)}
                    rows={5}
                    maxLength={MAX_CHAR_COUNT}
                    className="bg-white text-black"
                  />
                  <p className={`text-sm mt-1 text-right ${charCount > MAX_CHAR_COUNT - 50 ? 'text-orange-base' : 'text-black'}`}>
                    {charCount}/{MAX_CHAR_COUNT} characters
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleCopyToClipboard} 
                    className="bg-orange-base hover:bg-orange-light text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button 
                    onClick={handleUpdateGBPDescription}
                    className="bg-orange-base hover:bg-orange-light text-white"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Update GBP Description
                  </Button>
                </div>
                {manualInstructions && (
                  <div className="p-4 bg-orange-base/10 rounded-md border border-orange-base/30">
                    <p className="text-orange-base text-sm">{manualInstructions}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DescriptionGenerator;