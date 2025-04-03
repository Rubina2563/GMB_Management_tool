import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Save, 
  Loader2, 
  RefreshCw, 
  CheckCircle2,
  Globe,
  Trash2,
  X
} from 'lucide-react';

interface GeoTaggingProps {
  locationId: string | number;
  currentTab?: string;
  setParentTab?: (tab: string) => void;
}

interface GeoTag {
  lat: number;
  lng: number;
}

interface ImageWithGeoTag {
  id: number | string;
  url: string;
  title: string;
  category?: string;
  altText?: string;
  keywords?: string[];
  geoTag?: GeoTag;
  hasGeoTag?: boolean;
}

const GeoTagging: React.FC<GeoTaggingProps> = ({ locationId, currentTab, setParentTab }) => {
  const [selectedImage, setSelectedImage] = useState<ImageWithGeoTag | null>(null);
  const [searchCoords, setSearchCoords] = useState<{ lat: string; lng: string }>({ lat: '', lng: '' });
  const [saving, setSaving] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch actual images from the server
  const { data: images, isLoading, error } = useQuery({
    queryKey: ['geo-tagging-images', locationId],
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
      
      return data.images.map((img: any) => ({
        ...img,
        hasGeoTag: !!(img.geoTag && img.geoTag.lat && img.geoTag.lng)
      }));
    },
  });
  
  // Mutation to update image geo tag
  const updateImageMutation = useMutation({
    mutationFn: async (imageData: any) => {
      const response = await fetch(`/api/client/gbp-audit/location/${locationId}/image/${imageData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...imageData,
          geoTag: imageData.removeGeoTag ? null : {
            lat: parseFloat(searchCoords.lat),
            lng: parseFloat(searchCoords.lng)
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update image');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update image');
      }
      
      return data;
    },
    onSuccess: () => {
      // Use parent component's tab control function if available
      if (setParentTab && currentTab) {
        setParentTab('geo-tagging');
      }
      
      // Only invalidate the geo-tagging-images query to avoid tab reset
      // This prevents the navigation back to the Current Images tab
      queryClient.invalidateQueries({ queryKey: ['geo-tagging-images', locationId] });
      
      // Use setQueryData to directly update the location-images cache without triggering a refetch
      const currentImages = queryClient.getQueryData(['location-images', locationId]);
      if (currentImages) {
        queryClient.setQueryData(['location-images', locationId], currentImages);
      }
    },
  });

  const handleImageSelect = (image: ImageWithGeoTag) => {
    setSelectedImage(image);
    if (image.hasGeoTag && image.geoTag?.lat && image.geoTag?.lng) {
      setSearchCoords({
        lat: image.geoTag.lat.toString(),
        lng: image.geoTag.lng.toString()
      });
    } else {
      // Clear the coordinate fields if the image doesn't have a geo tag
      setSearchCoords({
        lat: '',
        lng: ''
      });
    }
  };

  const handleSaveGeoTag = () => {
    if (!selectedImage) return;
    
    // Validate coordinates
    if (!searchCoords.lat || !searchCoords.lng) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter both latitude and longitude values.",
        variant: "destructive",
      });
      return;
    }

    // Parse coordinates and handle potential invalid inputs
    let lat, lng;
    try {
      lat = parseFloat(searchCoords.lat);
      lng = parseFloat(searchCoords.lng);
    } catch (error) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter numeric values for latitude and longitude.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if coordinates are valid numbers and within range
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.",
        variant: "destructive",
      });
      return;
    }

    // Set saving state and call the mutation
    setSaving(true);
    
    // Create a copy of the image with fields needed for the update
    const imageToUpdate = {
      id: selectedImage.id,
      title: selectedImage.title,
      category: selectedImage.category || '',
      altText: selectedImage.altText || '',
      keywords: selectedImage.keywords || []
    };
    
    // Store a local reference to the current images in case we need to restore the cache
    const currentGeoTaggingImages = queryClient.getQueryData(['geo-tagging-images', locationId]);
    
    updateImageMutation.mutate(imageToUpdate, {
      onSuccess: () => {
        setSaving(false);
        
        // Force parent to stay on 'geo-tagging' tab
        if (setParentTab && currentTab) {
          setParentTab('geo-tagging');
        }
        
        toast({
          title: "Geo Tag Saved",
          description: `Geolocation data has been added to ${selectedImage.title}.`,
          variant: "default",
        });
        
        // Update selected image locally
        setSelectedImage({
          ...selectedImage,
          hasGeoTag: true,
          geoTag: { lat, lng }
        });
        
        // Update the images in the cache directly
        if (currentGeoTaggingImages) {
          const updatedImages = (currentGeoTaggingImages as any[]).map(img => 
            img.id === selectedImage.id 
              ? { ...img, hasGeoTag: true, geoTag: { lat, lng } } 
              : img
          );
          queryClient.setQueryData(['geo-tagging-images', locationId], updatedImages);
          
          // Update general images cache too to ensure consistency
          const generalImages = queryClient.getQueryData(['location-images', locationId]);
          if (generalImages) {
            queryClient.setQueryData(['location-images', locationId], generalImages);
          }
        }
      },
      onError: (error) => {
        setSaving(false);
        toast({
          title: "Error Saving Geo Tag",
          description: `Failed to save geo tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleUseBusinessLocation = () => {
    // In a real implementation, you would fetch the business location from the API
    // For now, we'll just use hardcoded values
    setSearchCoords({
      lat: '34.0522',
      lng: '-118.2437'
    });
    
    toast({
      title: "Business Location Applied",
      description: "Using main business location coordinates for this image.",
      variant: "default",
    });
  };
  
  const handleRemoveGeoTag = () => {
    if (!selectedImage) return;

    // Confirm before removing
    if (confirm('Are you sure you want to remove the geo tag from this image?')) {
      setSaving(true);
      
      // Create a copy of the image with fields needed for the update
      const imageToUpdate = {
        id: selectedImage.id,
        title: selectedImage.title,
        category: selectedImage.category || '',
        altText: selectedImage.altText || '',
        keywords: selectedImage.keywords || [],
        removeGeoTag: true // Special flag to indicate geo tag removal
      };
      
      // Store a local reference to the current images in case we need to restore the cache
      const currentGeoTaggingImages = queryClient.getQueryData(['geo-tagging-images', locationId]);
      
      updateImageMutation.mutate(imageToUpdate, {
        onSuccess: () => {
          setSaving(false);
          
          // Force parent to stay on 'geo-tagging' tab
          if (setParentTab && currentTab) {
            setParentTab('geo-tagging');
          }
          
          // Clear coordinates
          setSearchCoords({ lat: '', lng: '' });
          
          toast({
            title: "Geo Tag Removed",
            description: `Geolocation data has been removed from ${selectedImage.title}.`,
            variant: "default",
          });
          
          // Update selected image locally
          setSelectedImage({
            ...selectedImage,
            hasGeoTag: false,
            geoTag: undefined
          });
          
          // Update the images in the cache directly if needed
          if (currentGeoTaggingImages) {
            const updatedImages = (currentGeoTaggingImages as any[]).map(img => 
              img.id === selectedImage.id 
                ? { ...img, hasGeoTag: false, geoTag: undefined } 
                : img
            );
            queryClient.setQueryData(['geo-tagging-images', locationId], updatedImages);
            
            // Update general images cache too to ensure consistency
            const generalImages = queryClient.getQueryData(['location-images', locationId]);
            if (generalImages) {
              queryClient.setQueryData(['location-images', locationId], generalImages);
            }
          }
        },
        onError: (error) => {
          setSaving(false);
          toast({
            title: "Error Removing Geo Tag",
            description: `Failed to remove geo tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    // In real implementation, this would handle a click on the map component
    // For now, we'll just simulate it with random coordinates near the business
    const baseLat = 34.0522;
    const baseLng = -118.2437;
    const randomLat = baseLat + (Math.random() * 0.01 - 0.005);
    const randomLng = baseLng + (Math.random() * 0.01 - 0.005);
    
    setSearchCoords({
      lat: randomLat.toFixed(6),
      lng: randomLng.toFixed(6)
    });
    
    toast({
      title: "Map Location Selected",
      description: "You can adjust the coordinates manually if needed.",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#F28C38]" />
        <span className="ml-2 text-gray-600">Loading images...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
        Error loading images. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Image Geo Tagging</CardTitle>
          <CardDescription className="text-gray-600">
            Add geographic information to your images to improve local search visibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image selection panel */}
            <div className="lg:w-1/3">
              <h3 className="text-lg font-semibold text-black mb-4">Select an Image</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {images && images.map((image: any) => (
                  <div 
                    key={image.id} 
                    className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImage?.id === image.id 
                        ? 'border-[#F28C38] shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleImageSelect(image)}
                  >
                    <div className="relative">
                      <img 
                        src={image.url} 
                        alt={image.title} 
                        className="w-full h-40 object-cover" 
                      />
                      {image.hasGeoTag && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs rounded-full px-2 py-1 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          Geo Tagged
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-black">{image.title}</h4>
                      <p className="text-sm text-gray-600">Category: {image.category}</p>
                      {image.hasGeoTag && image.geoTag && (
                        <p className="text-xs text-gray-500 mt-1">
                          {image.geoTag.lat}, {image.geoTag.lng}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map and coordinate controls */}
            <div className="lg:w-2/3">
              {selectedImage ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-black">
                      Geo Tag: {selectedImage.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Set the geographic location where this image was taken.
                    </p>
                  </div>

                  {/* Map placeholder - in real implementation, this would be a GoogleMap component */}
                  <div 
                    className="w-full h-[300px] bg-gray-100 rounded-lg mb-6 relative overflow-hidden cursor-crosshair"
                    onClick={handleMapClick}
                  >
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <Globe className="h-16 w-16 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center px-4">
                        Interactive map would appear here. <br />
                        Click anywhere on the map to set location.
                      </p>
                    </div>
                    {/* Fake pin for selected coordinates */}
                    {searchCoords.lat && searchCoords.lng && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                          <MapPin className="h-10 w-10 text-[#F28C38] -mt-10" />
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 bg-white text-xs px-1 rounded shadow">
                            {selectedImage.title}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label htmlFor="latitude" className="text-black">Latitude</Label>
                      <Input 
                        id="latitude"
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        value={searchCoords.lat}
                        onChange={e => {
                          const value = e.target.value;
                          setSearchCoords({...searchCoords, lat: value});
                        }}
                        placeholder="e.g. 34.0522"
                        className="w-full text-black bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude" className="text-black">Longitude</Label>
                      <Input 
                        id="longitude"
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        value={searchCoords.lng}
                        onChange={e => {
                          const value = e.target.value;
                          setSearchCoords({...searchCoords, lng: value});
                        }}
                        placeholder="e.g. -118.2437"
                        className="w-full text-black bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={handleUseBusinessLocation}
                      className="bg-[#F28C38]/10 text-[#F28C38] border-[#F28C38] hover:bg-[#F28C38]/20"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Use Business Location
                    </Button>
                    
                    {selectedImage?.hasGeoTag && (
                      <Button
                        variant="outline"
                        onClick={handleRemoveGeoTag}
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        disabled={saving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Geo Tag
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleSaveGeoTag}
                      className="bg-[#F28C38] text-white hover:bg-[#F28C38]/90"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Geo Tag
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg w-full">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-black mb-2">Select an Image</h3>
                    <p className="text-gray-600">
                      Choose an image from the left panel to add or edit geo location data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeoTagging;