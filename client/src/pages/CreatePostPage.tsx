import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { Calendar, ImageIcon, Link2, Tag, Trash2 } from 'lucide-react';
import { useLocationContext } from '@/lib/location-context';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Define Post interface
interface Post {
  id: number;
  location_id: number;
  title: string;
  content: string;
  image_url: string | null;
  cta_type: string | null;
  cta_url: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_date: string | null;
  category: string | null;
  tags: string[];
  published_at: string | null;
}

interface PostData {
  title: string;
  content: string;
  image_url: string | null;
  cta_type: string | null;
  cta_url: string | null;
  scheduled_date: Date | null;
  status: 'draft' | 'scheduled';
  category: string | null;
  tags: string[];
}

interface GeneratePostRequest {
  service_type: string;
  tone: string;
  prompt: string;
}

interface GeneratedPost {
  title: string;
  content: string;
  image_prompt: string;
}

interface GeneratePostResponse {
  success: boolean;
  message: string;
  generated_post: GeneratedPost;
}

interface GBPLocation {
  id: number;
  name: string;
  address: string;
  user_id: number;
  location_id: string;
}

export default function CreatePostPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { locationId: paramLocationId } = useParams<{ locationId: string }>();
  
  // Use the location context to get selected location
  const { selectedLocationId, setSelectedLocationId, locations } = useLocationContext();
  
  // Determine which location ID to use
  const effectiveLocationId = paramLocationId || (selectedLocationId?.toString() || "1");
  
  // States for post creation form
  const [postData, setPostData] = useState<PostData>({
    title: '',
    content: '',
    image_url: null,
    cta_type: 'LEARN_MORE',
    cta_url: '',
    scheduled_date: addDays(new Date(), 1),
    status: 'draft',
    category: '',
    tags: []
  });
  
  // State for generate dialog
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generateData, setGenerateData] = useState<GeneratePostRequest>({
    service_type: '',
    tone: 'professional',
    prompt: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  // State for tag input
  const [tagInput, setTagInput] = useState('');
  
  // State for calendar dialog
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // State for image upload (mock for now)
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Fetch GBP locations
  const { data: locationsResponse, isLoading: isLoadingLocations, error: locationsError } = useQuery({
    queryKey: ['/api/gbp/locations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/gbp/locations', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load GBP locations: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load GBP locations');
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching GBP locations:', error);
        throw error;
      }
    },
  });
  
  // Extract locations array from the response
  const locationsData = locationsResponse?.locations || [];
  
  // Mutation for creating posts
  const createPostMutation = useMutation({
    mutationFn: async (data: PostData & { location_id: number }) => {
      const response = await fetch(`/api/posts/${data.location_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', effectiveLocationId] });
      toast({
        title: 'Success!',
        description: 'Post created successfully',
        variant: 'default',
      });
      
      // Reset form
      setPostData({
        title: '',
        content: '',
        image_url: null,
        cta_type: 'LEARN_MORE',
        cta_url: '',
        scheduled_date: addDays(new Date(), 1),
        status: 'draft',
        category: '',
        tags: []
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for generating post content
  const generatePostMutation = useMutation({
    mutationFn: async (data: GeneratePostRequest) => {
      const response = await fetch(`/api/posts/${effectiveLocationId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate post content');
      }
      
      return response.json() as Promise<GeneratePostResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.generated_post) {
        setPostData(prev => ({
          ...prev,
          title: data.generated_post.title,
          content: data.generated_post.content,
        }));
        
        toast({
          title: 'Success!',
          description: 'Post content generated successfully',
          variant: 'default',
        });
      }
      setIsGenerateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate post content',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form field changes
  const handleChange = (field: keyof PostData, value: any) => {
    setPostData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !postData.tags.includes(tagInput.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  // Handle tag removal
  const handleRemoveTag = (tag: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  // Handle post creation
  const handleCreatePost = () => {
    createPostMutation.mutate({
      ...postData,
      location_id: parseInt(effectiveLocationId),
      scheduled_date: postData.status === 'scheduled' ? postData.scheduled_date : null,
    });
  };
  
  // Handle generate content
  const handleGenerateContent = async () => {
    try {
      setIsGenerating(true);
      
      // Clear previous response
      setAiResponse('');
      
      // Create a combined prompt for the language model
      const prompt = `Write a Google Business Profile post about ${generateData.service_type} in a ${generateData.tone} tone. ${generateData.prompt}`;
      
      // Call the language model API
      const response = await fetch('/api/client/language-model/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'post',
          prompt
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Split the AI response into title and content
        // Assuming the first line is the title
        const lines = data.content.split('\n');
        let title = '';
        let content = '';
        
        if (lines.length > 0) {
          // Find a line that looks like a title (shorter, may end with a colon)
          const titleIndex = lines.findIndex(line => 
            line.trim().length > 0 && 
            line.trim().length < 100 && 
            !line.includes('.') && 
            !line.toLowerCase().startsWith('hi') && 
            !line.toLowerCase().startsWith('dear')
          );
          
          if (titleIndex !== -1) {
            title = lines[titleIndex].replace(/[:!?]/g, '').trim();
            content = lines.filter((_, i) => i !== titleIndex).join('\n').trim();
          } else {
            // If no clear title found, generate one from the first sentence
            const firstSentence = data.content.split('.')[0];
            title = firstSentence.length > 50 
              ? firstSentence.substring(0, 50) + '...' 
              : firstSentence;
            content = data.content;
          }
        } else {
          content = data.content;
        }
        
        // Update the form with the generated content
        setPostData(prev => ({
          ...prev,
          title: title,
          content: content,
        }));
        
        // Show the AI response
        setAiResponse(data.content);
        
        toast({
          title: 'Success!',
          description: 'Post content generated successfully',
          variant: 'default',
        });
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle image preview
  useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedImage);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedImage]);
  
  return (
    <div className="w-full pl-[70px] pr-[150px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">Create GBP Post</h1>
        <div className="flex gap-2">
          <Select
            value={effectiveLocationId.toString()}
            onValueChange={(value) => {
              // Update both location param and context
              setSelectedLocationId(parseInt(value));
              window.history.pushState(null, '', `/client/posts/${value}`);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locationsData?.map((location: { id: number, name: string }) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline" 
            className="gap-1 bg-gray-100 text-black hover:bg-gray-200"
            onClick={() => setIsGenerateDialogOpen(true)}
          >
            AI Generate
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white text-black">
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
              <CardDescription className="text-black">Create content for your GBP post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title</Label>
                <Input 
                  id="title" 
                  value={postData.title} 
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter post title"
                  className="bg-white text-black"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Post Content</Label>
                <Textarea 
                  id="content" 
                  value={postData.content} 
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Enter post content"
                  className="min-h-[200px] bg-white text-black"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/2 space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={postData.category || ""}
                    onValueChange={(value) => handleChange('category', value)}
                  >
                    <SelectTrigger id="category" className="bg-white text-black">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Update">Business Update</SelectItem>
                      <SelectItem value="Offer">Special Offer</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-1/2 space-y-2">
                  <Label htmlFor="cta_type">Call to Action</Label>
                  <Select
                    value={postData.cta_type || "LEARN_MORE"}
                    onValueChange={(value) => handleChange('cta_type', value)}
                  >
                    <SelectTrigger id="cta_type" className="bg-white text-black">
                      <SelectValue placeholder="Select CTA type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                      <SelectItem value="BOOK">Book</SelectItem>
                      <SelectItem value="ORDER">Order</SelectItem>
                      <SelectItem value="SHOP">Shop</SelectItem>
                      <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                      <SelectItem value="CALL">Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cta_url">CTA URL</Label>
                <div className="flex items-center space-x-2">
                  <Link2 className="h-4 w-4 text-gray-500" />
                  <Input 
                    id="cta_url" 
                    value={postData.cta_url || ""} 
                    onChange={(e) => handleChange('cta_url', e.target.value)}
                    placeholder="https://example.com/your-landing-page"
                    className="bg-white text-black"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {postData.tags.map((tag) => (
                    <div 
                      key={tag} 
                      className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input 
                    value={tagInput} 
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="bg-white text-black"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleAddTag}
                    className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="bg-white text-black mb-6">
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
              <CardDescription className="text-black">Configure your post options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="schedule-toggle">Schedule Post</Label>
                <Switch 
                  id="schedule-toggle" 
                  checked={postData.status === 'scheduled'} 
                  onCheckedChange={(checked) => handleChange('status', checked ? 'scheduled' : 'draft')}
                />
              </div>
              
              {postData.status === 'scheduled' && (
                <div className="space-y-2">
                  <Label>Scheduled Date</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setIsCalendarOpen(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {postData.scheduled_date ? format(postData.scheduled_date, 'PPP') : 'Pick a date'}
                  </Button>
                </div>  
              )}
              
              <div className="space-y-2">
                <Label>Post Image</Label>
                <div className="border border-gray-200 rounded-md p-4 flex flex-col items-center justify-center">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={previewUrl} 
                        alt="Post preview" 
                        className="max-w-full h-auto rounded-md"
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedImage(null)}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full bg-[#F28C38] hover:bg-[#F5A461] text-white"
                      onClick={() => setIsImageUploadDialogOpen(true)}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Add Image
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-[#F28C38] hover:bg-[#F5A461] text-white"
                onClick={handleCreatePost}
                disabled={!postData.title || !postData.content}
              >
                {postData.status === 'scheduled' ? 'Schedule Post' : 'Save as Draft'}
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-white text-black">
            <CardHeader>
              <CardTitle>Post Preview</CardTitle>
              <CardDescription className="text-black">Preview your post before publishing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-200 rounded-md p-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-black">{postData.title || 'Post Title'}</h3>
                  <p className="text-sm text-black">
                    {postData.content ? (
                      postData.content.length > 150 
                        ? `${postData.content.substring(0, 150)}...` 
                        : postData.content
                    ) : 'Post content will appear here...'}
                  </p>
                  
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Post preview" 
                      className="w-full h-auto rounded-md"
                    />
                  )}
                  
                  {postData.cta_type && (
                    <div className="mt-2">
                      <span className="inline-block bg-[#F28C38] text-white text-xs px-3 py-1 rounded-full">
                        {postData.cta_type.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* AI Generate Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Post Content with AI</DialogTitle>
            <DialogDescription className="text-black">
              Fill in the details below to generate content for your post.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service_type">Service or Topic</Label>
              <Input 
                id="service_type" 
                value={generateData.service_type} 
                onChange={(e) => setGenerateData(prev => ({ ...prev, service_type: e.target.value }))}
                placeholder="e.g. Plumbing Services, Seasonal Menu"
                className="bg-white text-black"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select
                value={generateData.tone}
                onValueChange={(value) => setGenerateData(prev => ({ ...prev, tone: value }))}
              >
                <SelectTrigger id="tone" className="bg-white text-black">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="informative">Informative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt">Additional Instructions</Label>
              <Textarea 
                id="prompt" 
                value={generateData.prompt} 
                onChange={(e) => setGenerateData(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Include specific details about what to highlight..."
                className="bg-white text-black"
              />
            </div>
          </div>
          
          {/* Show AI response if available */}
          {aiResponse && (
            <div className="my-4 p-3 border rounded bg-gray-50 text-black">
              <h4 className="font-medium mb-2">Generated Content:</h4>
              <div className="text-sm whitespace-pre-line">{aiResponse}</div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
              onClick={handleGenerateContent}
              disabled={!generateData.service_type || isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Calendar Dialog */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Select a date</DialogTitle>
            <DialogDescription className="text-black">
              Choose when to schedule your post
            </DialogDescription>
          </DialogHeader>
          
          <CalendarComponent
            mode="single"
            selected={postData.scheduled_date || undefined}
            onSelect={(date: Date | undefined) => {
              if (date) {
                handleChange('scheduled_date', date);
                setIsCalendarOpen(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Image Upload Dialog */}
      <Dialog open={isImageUploadDialogOpen} onOpenChange={setIsImageUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Post Image</DialogTitle>
            <DialogDescription className="text-black">
              Select an image to include with your post
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Upload Image</Label>
              <Input 
                id="image-upload" 
                type="file" 
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="bg-white text-black"
              />
            </div>
            
            {previewUrl && (
              <div className="mt-2">
                <img 
                  src={previewUrl} 
                  alt="Upload preview" 
                  className="max-w-full h-auto rounded-md"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImageUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
              onClick={() => setIsImageUploadDialogOpen(false)}
              disabled={!selectedImage}
            >
              Add Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}