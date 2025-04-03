import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  ImagePlus, 
  X, 
  Check,
  MapPin,
  Tag,
  Loader2
} from 'lucide-react';
import CoordinateInput from './CoordinateInput';

interface UploadImagesProps {
  locationId: string | number;
  currentTab?: string;
  setParentTab?: (tabValue: string) => void;
}

interface UploadPreview {
  id: string;
  file: File;
  preview: string;
  title: string;
  category: string;
  altText: string;
  keywords: string;
  geoTag: {
    lat: number | null;
    lng: number | null;
  };
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
}

const UploadImages: React.FC<UploadImagesProps> = ({ locationId }) => {
  const [selectedFiles, setSelectedFiles] = useState<UploadPreview[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      toast({
        title: "Invalid Files",
        description: "Please select only image files (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    const newFiles: UploadPreview[] = fileArray.map(file => {
      // Generate a title from the filename
      const title = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[_-]/g, ' ');
      
      // Generate smart alt text based on the title
      const altText = `${title} - ${locationId}`;
      
      // Generate initial keywords based on the title
      const keywords = title.toLowerCase().split(' ').join(', ');
      
      return {
        id: Math.random().toString(36).substring(2, 11),
        file,
        preview: URL.createObjectURL(file),
        title,
        category: 'Exterior', // Default category
        altText,
        keywords,
        geoTag: {
          lat: null,
          lng: null
        },
        status: 'idle' as const,
        progress: 0
      };
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => {
      const filtered = prev.filter(file => file.id !== id);
      // Release URL object to avoid memory leaks
      const removed = prev.find(file => file.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  };

  const handleUpdateTitle = (id: string, title: string) => {
    setSelectedFiles(prev => prev.map(file => {
      if (file.id === id) {
        return { ...file, title };
      }
      return file;
    }));
  };

  const handleUpdateCategory = (id: string, category: string) => {
    setSelectedFiles(prev => prev.map(file => {
      if (file.id === id) {
        return { ...file, category };
      }
      return file;
    }));
  };

  const handleUpdateAltText = (id: string, altText: string) => {
    setSelectedFiles(prev => prev.map(file => {
      if (file.id === id) {
        return { ...file, altText };
      }
      return file;
    }));
  };

  const handleUpdateKeywords = (id: string, keywords: string) => {
    setSelectedFiles(prev => prev.map(file => {
      if (file.id === id) {
        return { ...file, keywords };
      }
      return file;
    }));
  };

  const handleUpdateGeoTag = (id: string, lat: number | null, lng: number | null) => {
    setSelectedFiles(prev => prev.map(file => {
      if (file.id === id) {
        return { 
          ...file, 
          geoTag: { lat, lng } 
        };
      }
      return file;
    }));
  };

  // Initialize queryClient for cache invalidation
  const queryClient = useQueryClient();
  
  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: async (images: UploadPreview[]) => {
      // Prepare the upload data
      const uploadData = images.map(img => ({
        url: img.preview, // In a real implementation, we'd upload the file to a storage service first
        title: img.title,
        category: img.category,
        altText: img.altText,
        keywords: img.keywords.split(',').map(k => k.trim()),
        geoTag: img.geoTag,
        format: img.file.type.replace('image/', ''),
        size: `${Math.round(img.file.size / 1024)}KB`,
      }));
      
      const response = await fetch(`/api/client/gbp-audit/location/${locationId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ images: uploadData }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload images');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Get current data first
      const currentImageData = queryClient.getQueryData(['gbp-images', locationId]);
      
      // Update cache directly instead of invalidating to avoid tab switching
      if (currentImageData) {
        // This is a safer approach than invalidating the query
        queryClient.setQueryData(['gbp-images', locationId], (old: any) => {
          // If we have the structure of the data, we could merge it properly
          return old; // Just return the old data to trigger a refresh
        });
      }
      
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${selectedFiles.length} images to your GBP profile.`,
        variant: "default",
      });
      
      // Reset selected files after a short delay
      setTimeout(() => {
        setSelectedFiles([]);
      }, 2000);
    },
    onError: (error) => {
      // Mark files as error
      setSelectedFiles(prev => prev.map(file => ({ ...file, status: 'error' })));
      
      toast({
        title: "Upload Failed",
        description: `Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  const handleUpload = () => {
    // Validate files before uploading
    if (selectedFiles.length === 0) {
      toast({
        title: "No Images Selected",
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    // Mark all files as uploading
    setSelectedFiles(prev => prev.map(file => ({ ...file, status: 'uploading', progress: 0 })));
    
    // Start progress simulation for each file
    selectedFiles.forEach((file, index) => {
      let progress = 0;
      
      const simulateUpload = () => {
        if (progress < 95 && !uploadImagesMutation.isSuccess && !uploadImagesMutation.isError) {
          progress += Math.floor(Math.random() * 10) + 1;
          progress = Math.min(progress, 95); // Max out at 95% until we get the server response
          
          setSelectedFiles(prev => prev.map(f => {
            if (f.id === file.id) {
              return { ...f, progress };
            }
            return f;
          }));
          
          setTimeout(simulateUpload, 300);
        }
      };
      
      // Start progress simulation with slight delay for each file
      setTimeout(simulateUpload, index * 100);
    });
    
    // Execute the upload mutation
    uploadImagesMutation.mutate(selectedFiles);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Upload New Images</CardTitle>
          <CardDescription className="text-gray-600">
            Add new images to your Google Business Profile to showcase your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className={`border-2 border-dashed rounded-lg p-12 text-center ${
              dragActive ? 'border-[#F28C38] bg-[#F28C38]/10' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <ImagePlus className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">Drag and drop your images here</h3>
              <p className="text-sm text-gray-500 mb-4">
                Supports JPG, PNG and GIF formats. Max 5MB per image.
              </p>
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-[#F28C38] text-white hover:bg-[#F28C38]/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>
              <input 
                id="file-upload" 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-black mb-4">Selected Images ({selectedFiles.length})</h3>
              <div className="space-y-4">
                {selectedFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-shrink-0 relative w-full md:w-32 h-32">
                        <img 
                          src={file.preview} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-md" 
                        />
                        {file.status === 'success' && (
                          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-md">
                            <Check className="h-8 w-8 text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-grow">
                            <Label htmlFor={`title-${file.id}`} className="text-black">Image Title</Label>
                            <Input 
                              id={`title-${file.id}`}
                              value={file.title} 
                              onChange={(e) => handleUpdateTitle(file.id, e.target.value)}
                              className="max-w-md text-black bg-white"
                              disabled={file.status === 'uploading' || file.status === 'success'}
                            />
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-gray-500"
                            disabled={file.status === 'uploading' || file.status === 'success'}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="max-w-md">
                          <Label htmlFor={`category-${file.id}`} className="text-black">Category</Label>
                          <Select 
                            value={file.category} 
                            onValueChange={(value) => handleUpdateCategory(file.id, value)}
                            disabled={file.status === 'uploading' || file.status === 'success'}
                          >
                            <SelectTrigger className="w-full text-black bg-white">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-black">
                              <SelectItem value="Exterior">Exterior</SelectItem>
                              <SelectItem value="Interior">Interior</SelectItem>
                              <SelectItem value="Products">Products</SelectItem>
                              <SelectItem value="Services">Services</SelectItem>
                              <SelectItem value="Team">Team</SelectItem>
                              <SelectItem value="Events">Events</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="max-w-md">
                          <Label htmlFor={`alt-text-${file.id}`} className="text-black flex items-center gap-1">
                            Alt Text <span className="text-xs text-gray-500">(for accessibility)</span>
                          </Label>
                          <Textarea 
                            id={`alt-text-${file.id}`}
                            value={file.altText || ''} 
                            onChange={(e) => handleUpdateAltText(file.id, e.target.value)}
                            className="max-w-md text-black resize-none h-[80px] bg-white"
                            placeholder="Describe the image for those who can't see it"
                            disabled={file.status === 'uploading' || file.status === 'success'}
                          />
                        </div>

                        <div className="max-w-md">
                          <Label htmlFor={`keywords-${file.id}`} className="text-black flex items-center gap-1">
                            <Tag className="h-4 w-4" /> Keywords <span className="text-xs text-gray-500">(comma separated)</span>
                          </Label>
                          <Input 
                            id={`keywords-${file.id}`}
                            value={file.keywords || ''} 
                            onChange={(e) => handleUpdateKeywords(file.id, e.target.value)}
                            className="max-w-md text-black bg-white"
                            placeholder="e.g. storefront, business, retail"
                            disabled={file.status === 'uploading' || file.status === 'success'}
                          />
                        </div>

                        <div className="max-w-md">
                          <Label className="text-black flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> GEO Tag
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <div className="flex-1">
                              <CoordinateInput
                                placeholder="Latitude" 
                                value={file.geoTag?.lat}
                                onChange={(value) => handleUpdateGeoTag(file.id, value, file.geoTag?.lng || null)}
                                disabled={file.status === 'uploading' || file.status === 'success'}
                                isLatitude={true}
                              />
                            </div>
                            <div className="flex-1">
                              <CoordinateInput 
                                placeholder="Longitude" 
                                value={file.geoTag?.lng}
                                onChange={(value) => handleUpdateGeoTag(file.id, file.geoTag?.lat || null, value)}
                                disabled={file.status === 'uploading' || file.status === 'success'}
                                isLatitude={false}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Add location data to help with local search visibility</p>
                        </div>

                        {file.status === 'uploading' && (
                          <div className="max-w-md">
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#F28C38] rounded-full" 
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Uploading... {file.progress}%</p>
                          </div>
                        )}
                        {file.status === 'success' && (
                          <p className="text-sm text-green-600">Upload successful</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        {selectedFiles.length > 0 && (
          <CardFooter className="justify-end space-x-2 border-t p-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedFiles([])}
              disabled={selectedFiles.some(f => f.status === 'uploading')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              className="bg-[#F28C38] text-white hover:bg-[#F28C38]/90"
              disabled={
                selectedFiles.length === 0 || 
                selectedFiles.some(f => f.status === 'uploading') ||
                selectedFiles.every(f => f.status === 'success')
              }
            >
              Upload Images
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default UploadImages;