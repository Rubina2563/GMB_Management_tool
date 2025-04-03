import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrashIcon, PencilIcon, Loader2, Save, X, ImageIcon, MapPin } from 'lucide-react';
import CoordinateInput from './CoordinateInput';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CurrentImagesProps {
  locationId: string | number;
  currentTab?: string;
  setParentTab?: (tabValue: string) => void;
}

interface Image {
  id: number;
  url: string;
  title: string;
  category: string;
  uploadDate: string;
  format: string;
  size: string;
  altText: string;
  keywords: string[];
  geoTag?: { lat: number | null; lng: number | null };
}

const CurrentImages: React.FC<CurrentImagesProps> = ({ locationId }) => {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Image>>({
    geoTag: { lat: null, lng: null }
  });
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch images from the API
  const { data: imagesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['gbp-images', locationId],
    queryFn: async () => {
      const response = await fetch(`/api/client/gbp-audit/location/${locationId}/images`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      
      return response.json();
    },
    // Ensure this query refetches when locationId changes
    refetchOnWindowFocus: false, 
    refetchOnMount: true,
    staleTime: 0
  });
  
  // Effect to refetch images when locationId changes
  React.useEffect(() => {
    refetch();
  }, [locationId, refetch]);
  
  // Extract images from the response
  const [images, setImages] = useState<Image[]>([]);
  
  // Update local images state when the response changes
  React.useEffect(() => {
    if (imagesResponse?.images) {
      setImages(imagesResponse.images);
    }
  }, [imagesResponse]);

  // Update image mutation
  const updateImageMutation = useMutation({
    mutationFn: async (updatedImage: Image) => {
      const response = await fetch(`/api/client/gbp-audit/location/${locationId}/image/${updatedImage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedImage),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gbp-images', locationId] });
      setEditDialogOpen(false);
      toast({
        title: "Image Updated",
        description: `The image "${selectedImage?.title}" has been updated successfully.`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch(`/api/client/gbp-audit/location/${locationId}/image/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gbp-images', locationId] });
      setDeleteDialogOpen(false);
      toast({
        title: "Image Deleted",
        description: `The image "${selectedImage?.title}" has been deleted successfully.`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Handle opening the delete confirmation dialog
  const handleDelete = (image: Image) => {
    setSelectedImage(image);
    setDeleteDialogOpen(true);
  };

  // Confirm and execute image deletion
  const confirmDelete = async () => {
    if (selectedImage) {
      try {
        await deleteImageMutation.mutateAsync(selectedImage.id);
        // Force refresh the data
        await refetch();
        setImages((prevImages: Image[]) => prevImages.filter((img: Image) => img.id !== selectedImage.id));
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
  };

  // Handle opening the edit dialog
  const handleEdit = (image: Image) => {
    // Set selected image first
    setSelectedImage(image);
    
    // Set up form data
    setEditForm({
      ...image,
      keywords: [...image.keywords], // Create a copy of the keywords array
    });
    
    // Open dialog with a small delay to let React update the state first
    requestAnimationFrame(() => {
      setEditDialogOpen(true);
    });
  };
  
  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setEditForm({
      ...editForm,
      [field]: value,
    });
  };
  
  // Handle keywords input (comma-separated)
  const handleKeywordsChange = (value: string) => {
    const keywordsArray = value.split(',').map(keyword => keyword.trim());
    setEditForm({
      ...editForm,
      keywords: keywordsArray,
    });
  };
  
  // Save the edited image
  const saveImage = () => {
    if (selectedImage && editForm) {
      updateImageMutation.mutate({
        ...selectedImage,
        ...editForm,
      } as Image);
    }
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
          <CardTitle className="text-xl font-bold text-black">Current GBP Images</CardTitle>
          <CardDescription className="text-gray-600">
            Manage images currently displayed on your Google Business Profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images && images.map((image: Image) => (
              <Card key={image.id} className="overflow-hidden bg-white border border-gray-200">
                <div className="relative">
                  <img 
                    src={image.url} 
                    alt={image.title} 
                    className="w-full h-48 object-cover" 
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-8 w-8 rounded-full bg-white text-gray-700 hover:bg-[#F28C38] hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(image);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-8 w-8 rounded-full bg-white text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(image);
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-black">{image.title}</h3>
                  <p className="text-sm text-gray-600">Category: {image.category}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Upload Date: {image.uploadDate}</div>
                    <div>Format: {image.format}</div>
                    <div>Size: {image.size}</div>
                    <div>Keywords: {image.keywords?.slice(0, 2).join(', ')}{image.keywords?.length > 2 ? '...' : ''}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Alt Text: {image.altText}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the image "{selectedImage?.title}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteImageMutation.isPending}
            >
              {deleteImageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Image Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            // Reset states when closing dialog
            setImageLoading(false);
            setImageError(false);
          }
        }}
      >
        <DialogContent className="bg-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-black">Edit Image</DialogTitle>
            <DialogDescription>
              Update the image information to optimize your Google Business Profile appearance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2 flex justify-center">
              {selectedImage && (
                <>
                  {imageLoading && (
                    <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-[#F28C38]" />
                    </div>
                  )}
                  {imageError && (
                    <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-100 rounded-md p-4">
                      <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-600 text-center text-sm">
                        Error loading image. The image will appear in the next view.
                      </p>
                    </div>
                  )}
                  <img 
                    src={selectedImage.url} 
                    alt={selectedImage.title} 
                    className={`max-h-64 object-contain ${imageLoading || imageError ? 'hidden' : ''}`}
                    onLoad={() => {
                      setImageLoading(false);
                      setImageError(false);
                    }}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                </>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-black">Title</Label>
                <Input 
                  id="title" 
                  value={editForm.title || ''} 
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="border-gray-300 focus:border-[#F28C38] text-black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-black">Category</Label>
                <Input 
                  id="category" 
                  value={editForm.category || ''} 
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  className="border-gray-300 focus:border-[#F28C38] text-black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altText" className="text-black">Alt Text (Important for SEO)</Label>
                <Textarea 
                  id="altText" 
                  value={editForm.altText || ''} 
                  onChange={(e) => handleFormChange('altText', e.target.value)}
                  className="border-gray-300 focus:border-[#F28C38] text-black resize-none h-20 bg-white"
                  placeholder="Describe what's in the image for better accessibility and SEO"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keywords" className="text-black">Keywords (comma-separated)</Label>
                <Textarea 
                  id="keywords" 
                  value={editForm.keywords?.join(', ') || ''} 
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  className="border-gray-300 focus:border-[#F28C38] text-black resize-none h-20 bg-white"
                  placeholder="e.g., storefront, business, exterior"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-black">GEO Tagging</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="latitude" className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Latitude
                    </Label>
                    <CoordinateInput
                      placeholder="e.g., 37.7749"
                      value={editForm.geoTag?.lat ?? null}
                      onChange={(value) => {
                        handleFormChange('geoTag', { 
                          ...editForm.geoTag, 
                          lat: value
                        });
                      }}
                      className="border-gray-300 focus:border-[#F28C38]"
                      isLatitude={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude" className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Longitude
                    </Label>
                    <CoordinateInput 
                      placeholder="e.g., -122.4194"
                      value={editForm.geoTag?.lng ?? null}
                      onChange={(value) => {
                        handleFormChange('geoTag', { 
                          ...editForm.geoTag, 
                          lng: value
                        });
                      }}
                      className="border-gray-300 focus:border-[#F28C38]"
                      isLatitude={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveImage}
              disabled={updateImageMutation.isPending}
              className="bg-[#F28C38] hover:bg-[#E67D2E] text-white"
            >
              {updateImageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurrentImages;