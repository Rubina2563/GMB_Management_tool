import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Calendar as CalendarIcon, BarChart, X, Tag, Trash2, Edit, AlertCircle, Link2, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: number;
  location_id: number;
  title: string;
  content: string;
  image_url?: string;
  cta_type?: "LEARN_MORE" | "BOOK" | "ORDER" | "SHOP" | "SIGN_UP" | "CALL";
  cta_url?: string;
  scheduled_date?: Date;
  status: "draft" | "scheduled" | "published" | "failed";
  published_at?: Date;
  category?: string;
  tags?: string[];
}

interface PostsListResponse {
  success: boolean;
  message: string;
  posts: Post[];
}

export default function PostsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { locationId: paramLocationId } = useParams<{ locationId: string }>();
  const [activeTab, setActiveTab] = useState<string>("create");
  const [selectedLocationId, setSelectedLocationId] = useState<string>(paramLocationId || "1");
  
  // Interface for GBP location
  interface GBPLocation {
    id: number;
    name: string;
    address: string;
    user_id: number;
    location_id: string;
  }
  
  // Fetch GBP locations
  const { data: locationsData, isLoading: isLoadingLocations, error: locationsError } = useQuery({
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
        
        return data.locations as GBPLocation[];
      } catch (error) {
        console.error('Error fetching GBP locations:', error);
        return [] as GBPLocation[];
      }
    },
  });
  
  // State for managing post creation and editing
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [dialogTitle, setDialogTitle] = useState<string>("Create New Post");
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    image_url: "",
    cta_type: "LEARN_MORE" as "LEARN_MORE" | "BOOK" | "ORDER" | "SHOP" | "SIGN_UP" | "CALL",
    cta_url: "",
    scheduled_date: new Date(),
    status: "draft" as "draft" | "scheduled" | "published" | "failed",
    category: "",
    tags: [] as string[]
  });
  
  // State for managing tags input
  const [newTag, setNewTag] = useState<string>("");
  
  // Predefined categories
  const categories = [
    "Event", 
    "Offer", 
    "Update", 
    "News", 
    "Product", 
    "Service", 
    "Promotion", 
    "Holiday", 
    "Announcement", 
    "Other"
  ];

  // CTA types
  const ctaTypes = [
    { value: "LEARN_MORE", label: "Learn More" },
    { value: "BOOK", label: "Book" },
    { value: "ORDER", label: "Order" },
    { value: "SHOP", label: "Shop" },
    { value: "SIGN_UP", label: "Sign Up" },
    { value: "CALL", label: "Call" }
  ];
  
  // Function to handle adding a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !postForm.tags.includes(newTag.trim())) {
      setPostForm({
        ...postForm,
        tags: [...postForm.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };
  
  // Function to handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setPostForm({
      ...postForm,
      tags: postForm.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  // Function to handle category change
  const handleCategoryChange = (category: string) => {
    setPostForm({
      ...postForm,
      category
    });
  };
  
  // Function to reset the post form
  const resetPostForm = () => {
    setPostForm({
      title: "",
      content: "",
      image_url: "",
      cta_type: "LEARN_MORE",
      cta_url: "",
      scheduled_date: new Date(),
      status: "draft",
      category: "",
      tags: []
    });
    setCurrentPost(null);
    setDialogTitle("Create New Post");
  };
  
  // Create a new post
  const createPostMutation = useMutation({
    mutationFn: async (post: typeof postForm) => {
      const response = await apiRequest('POST', `/api/posts/${selectedLocationId}`, post);
      return await response.json();
    },
    onSuccess: (data: { success: boolean; message: string; post: Post }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', selectedLocationId] });
      toast({
        title: "Success",
        description: data.message || "Post created successfully",
      });
      resetPostForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update an existing post
  const updatePostMutation = useMutation({
    mutationFn: async (post: typeof postForm & { id: number }) => {
      const { id, ...postData } = post;
      const response = await apiRequest('PUT', `/api/posts/${selectedLocationId}/${id}`, postData);
      return await response.json();
    },
    onSuccess: (data: { success: boolean; message: string; post: Post }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', selectedLocationId] });
      toast({
        title: "Success",
        description: data.message || "Post updated successfully",
      });
      resetPostForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle creating or updating a post
  const handleCreateOrUpdate = () => {
    // Validate form data
    if (!postForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Post title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!postForm.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Post content is required",
        variant: "destructive",
      });
      return;
    }
    
    if (postForm.status === "scheduled" && !postForm.scheduled_date) {
      toast({
        title: "Validation Error",
        description: "Scheduled date is required for scheduled posts",
        variant: "destructive",
      });
      return;
    }
    
    if (currentPost) {
      // Update post
      updatePostMutation.mutate({
        id: currentPost.id,
        ...postForm
      });
    } else {
      // Create post
      createPostMutation.mutate(postForm);
    }
    setIsCreateDialogOpen(false);
  };
  
  // Handle deleting a post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest('DELETE', `/api/posts/${selectedLocationId}/${postId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', selectedLocationId] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle confirmation to delete a post
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  
  // State for image gallery
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  
  // Reset form state when location changes
  useEffect(() => {
    resetPostForm();
  }, [selectedLocationId]);
  
  const handleDeleteConfirm = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete.id);
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };
  
  // Handle editing a post
  const handleEditPost = (post: Post) => {
    setCurrentPost(post);
    setPostForm({
      title: post.title,
      content: post.content,
      image_url: post.image_url || "",
      cta_type: post.cta_type || "LEARN_MORE",
      cta_url: post.cta_url || "",
      scheduled_date: post.scheduled_date ? new Date(post.scheduled_date) : new Date(),
      status: post.status,
      category: post.category || "",
      tags: post.tags || []
    });
    setDialogTitle(`Edit ${post.status.charAt(0).toUpperCase() + post.status.slice(1)} Post`);
    setIsCreateDialogOpen(true);
  };
  
  // Handle confirmation to delete a post
  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle location change
  const handleLocationChange = (value: string) => {
    setSelectedLocationId(value);
    // Redirect to the new location posts page
    window.location.href = `/posts/${value}`;
  };

  // Fetch posts for the selected location
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/posts', selectedLocationId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/posts/${selectedLocationId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load posts: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load posts');
        }
        
        return data as PostsListResponse;
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
    },
    enabled: !!selectedLocationId,
  });
  
  // Filter posts by status
  const scheduledPosts = data?.posts.filter(post => post.status === "scheduled") || [];
  const publishedPosts = data?.posts.filter(post => post.status === "published") || [];
  const draftPosts = data?.posts.filter(post => post.status === "draft") || [];
  
  // Fetch images for posts from the image optimization feature
  const { data: imageGalleryData, isLoading: isLoadingImages } = useQuery({
    queryKey: ['/api/client/gbp-audit/post-images', selectedLocationId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/client/gbp-audit/location/${selectedLocationId}/post-images`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load post images: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load post images');
        }
        
        return data.images;
      } catch (error) {
        console.error('Error fetching post images:', error);
        return [];
      }
    },
    enabled: !!selectedLocationId && isImageGalleryOpen,
  });
  
  // Update gallery images when data is fetched
  useEffect(() => {
    if (imageGalleryData) {
      setGalleryImages(imageGalleryData);
    }
  }, [imageGalleryData]);
  
  // Handle selecting an image from the gallery
  const handleSelectImage = (image: any) => {
    setPostForm({
      ...postForm,
      image_url: image.url
    });
    setIsImageGalleryOpen(false);
  };
  
  // Effect to auto-select the create tab when no posts exist
  useEffect(() => {
    if (!isLoading && data && data.posts.length === 0) {
      setActiveTab("create");
    }
  }, [data, isLoading]);
  
  return (
    <div className="w-full pl-[70px] pr-[150px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">Post Management</h1>
        <div className="flex gap-2">
          <Button 
            className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
            onClick={() => { 
              resetPostForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Post
          </Button>
        </div>
      </div>
      
      {/* GBP Selector */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center mb-2">
          <h2 className="text-xl font-bold text-black">Select Google Business Profile</h2>
        </div>
        <div className="flex gap-4 items-center">
          <Label htmlFor="gbp-location" className="whitespace-nowrap text-black font-medium">
            GBP Location:
          </Label>
          <Select
            value={selectedLocationId}
            onValueChange={handleLocationChange}
            disabled={isLoadingLocations}
          >
            <SelectTrigger id="gbp-location" className="w-full md:w-96 bg-white text-black border-gray-300">
              <SelectValue placeholder="Select a Google Business Profile" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingLocations ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#F28C38] mr-2" />
                  <span>Loading GBP locations...</span>
                </div>
              ) : locationsData && locationsData.length > 0 ? (
                locationsData.map(location => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name} - {location.address}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="0" disabled>
                  No Google Business Profiles found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#F28C38]" />
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
          Error loading posts: {(error as Error).message}
        </div>
      ) : (
        <>
          {/* Delete Post Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-black">Are you sure you want to delete this post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  className="text-black bg-white"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Create/Edit Post Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-[900px] bg-white">
              <DialogHeader>
                <DialogTitle className="text-black">{dialogTitle}</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new post for your Google Business Profile.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-black">Title</Label>
                    <Input
                      id="title"
                      className="w-full mt-1 bg-white text-black border-gray-300"
                      value={postForm.title}
                      onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                      placeholder="Enter post title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content" className="text-black">Content</Label>
                    <Textarea
                      id="content"
                      className="w-full mt-1 min-h-[150px] bg-white text-black border-gray-300"
                      value={postForm.content}
                      onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                      placeholder="Enter post content"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="image_url" className="text-black">Image</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="image_url"
                        className="w-full bg-white text-black border-gray-300"
                        value={postForm.image_url}
                        onChange={(e) => setPostForm({...postForm, image_url: e.target.value})}
                        placeholder="Enter image URL or select from gallery"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        className="flex-shrink-0 border-gray-300 hover:bg-[#F28C38] hover:text-white"
                        onClick={() => setIsImageGalleryOpen(true)}
                      >
                        Browse Images
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cta_type" className="text-black">CTA Type (optional)</Label>
                      <Select
                        value={postForm.cta_type}
                        onValueChange={(val) => setPostForm({...postForm, cta_type: val as any})}
                      >
                        <SelectTrigger id="cta_type" className="w-full mt-1 bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select CTA Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ctaTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="cta_url" className="text-black">CTA URL (optional)</Label>
                      <Input
                        id="cta_url"
                        className="w-full mt-1 bg-white text-black border-gray-300"
                        value={postForm.cta_url}
                        onChange={(e) => setPostForm({...postForm, cta_url: e.target.value})}
                        placeholder="Enter CTA URL"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-black">Category</Label>
                      <Select
                        value={postForm.category}
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger id="category" className="w-full mt-1 bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status" className="text-black">Status</Label>
                      <Select
                        value={postForm.status}
                        onValueChange={(val) => setPostForm({...postForm, status: val as "draft" | "scheduled" | "published" | "failed"})}
                      >
                        <SelectTrigger id="status" className="w-full mt-1 bg-white text-black border-gray-300">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="published">Publish Now</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {postForm.status === "scheduled" && (
                    <div>
                      <Label htmlFor="scheduled_date" className="text-black">Scheduled Date</Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        className="w-full mt-1 bg-white text-black border-gray-300"
                        value={postForm.scheduled_date ? format(postForm.scheduled_date, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : new Date();
                          setPostForm({...postForm, scheduled_date: date});
                        }}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="tags" className="text-black">Tags</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="tags"
                        className="flex-1 bg-white text-black border-gray-300"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Enter tag"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddTag}
                        className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
                      >
                        Add
                      </Button>
                    </div>
                    {postForm.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {postForm.tags.map(tag => (
                          <Badge key={tag} className="bg-[#F28C38] flex items-center gap-1 text-white">
                            <Tag size={14} />
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              <X size={14} />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Post Preview */}
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="font-medium text-lg mb-2 text-black">Post Preview</h3>
                  <p className="text-sm text-gray-500 mb-4">How your post will appear in Google Business Profile</p>
                  
                  <div className="border rounded-md overflow-hidden">
                    <div className="p-4 bg-gray-50">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                        <span className="text-sm text-gray-500">Just now</span>
                      </div>
                      
                      <div className="mb-3 text-black">
                        {postForm.content || "Your post content will appear here. Add content to see how it will look."}
                      </div>
                      
                      {postForm.cta_type && (
                        <div className="mb-4">
                          <Button 
                            variant="outline" 
                            className="bg-[#F28C38] hover:bg-[#F5A461] text-white border-none text-sm h-8"
                          >
                            {postForm.cta_type.replace(/_/g, ' ')}
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center text-gray-500">
                        <button className="mr-4 flex items-center">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
                          </svg>
                          0
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Preview */}
                  {postForm.image_url && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-black">Image Preview</h4>
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={postForm.image_url} 
                          alt="Post preview" 
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="bg-white text-black border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
                  onClick={handleCreateOrUpdate}
                >
                  {currentPost ? 'Update Post' : 'Create Post'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Main Content */}
          <div className="bg-white rounded-lg overflow-hidden shadow">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start space-x-0">
                <TabsTrigger value="create">
                  <Plus size={16} className="mr-2" />
                  Create Post
                </TabsTrigger>
                <TabsTrigger value="scheduled">
                  <CalendarIcon size={16} className="mr-2" />
                  Scheduled
                  {scheduledPosts.length > 0 && (
                    <Badge className="ml-2 bg-[#F28C38] text-white">{scheduledPosts.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="published">
                  Published
                  {publishedPosts.length > 0 && (
                    <Badge className="ml-2 bg-[#F28C38] text-white">{publishedPosts.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="draft">
                  Drafts
                  {draftPosts.length > 0 && (
                    <Badge className="ml-2 bg-[#F28C38] text-white">{draftPosts.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart size={16} className="mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-black">Create New Post</h2>
                        <p className="text-gray-500 mt-1">Fill in the details to create a new post for your Google Business Profile</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="create-title" className="text-black mb-2 block">Title</Label>
                        <Input
                          id="create-title"
                          className="bg-white text-black border-gray-300"
                          value={postForm.title}
                          onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                          placeholder="Enter post title"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="create-content" className="text-black mb-2 block">Content</Label>
                        <Textarea
                          id="create-content"
                          className="min-h-[100px] bg-white text-black border-gray-300"
                          value={postForm.content}
                          onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                          placeholder="Enter post content"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="create-image" className="text-black mb-2 block">Image</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="create-image"
                            className="bg-white text-black border-gray-300"
                            value={postForm.image_url}
                            onChange={(e) => setPostForm({...postForm, image_url: e.target.value})}
                            placeholder="Enter image URL or select from gallery"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-shrink-0 border-gray-300 hover:bg-[#F28C38] hover:text-white"
                            onClick={() => setIsImageGalleryOpen(true)}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Gallery
                          </Button>
                        </div>
                        {postForm.image_url && (
                          <div className="mt-2 border rounded-md overflow-hidden">
                            <img
                              src={postForm.image_url}
                              alt="Post preview"
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="create-cta-type" className="text-black mb-2 block">Call to Action</Label>
                        <Select
                          value={postForm.cta_type}
                          onValueChange={(val) => setPostForm({...postForm, cta_type: val as any})}
                        >
                          <SelectTrigger id="create-cta-type" className="bg-white text-black border-gray-300">
                            <SelectValue placeholder="Select CTA type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ctaTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="create-cta-url" className="text-black mb-2 block">CTA URL</Label>
                        <Input
                          id="create-cta-url"
                          className="bg-white text-black border-gray-300"
                          value={postForm.cta_url}
                          onChange={(e) => setPostForm({...postForm, cta_url: e.target.value})}
                          placeholder="Enter your call to action URL"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="create-category" className="text-black mb-2 block">Category</Label>
                        <Select
                          value={postForm.category}
                          onValueChange={handleCategoryChange}
                        >
                          <SelectTrigger id="create-category" className="bg-white text-black border-gray-300">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="create-tags" className="text-black mb-2 block">Tags</Label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input
                              id="create-tags"
                              className="flex-1 bg-white text-black border-gray-300"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Enter tag"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddTag();
                                }
                              }}
                            />
                            <Button 
                              type="button" 
                              onClick={handleAddTag}
                              className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
                            >
                              Add
                            </Button>
                          </div>
                          {postForm.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {postForm.tags.map(tag => (
                                <Badge key={tag} className="bg-[#F28C38] flex items-center gap-1 text-white">
                                  <Tag size={14} />
                                  {tag}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => handleRemoveTag(tag)}
                                  >
                                    <X size={14} />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-black mb-2 block">Post Status</Label>
                        <div className="flex items-center space-x-4 flex-wrap">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="draft"
                              name="status"
                              className="mr-2"
                              checked={postForm.status === "draft"}
                              onChange={() => setPostForm({...postForm, status: "draft"})}
                            />
                            <Label htmlFor="draft" className="text-black">Draft</Label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="scheduled"
                              name="status"
                              className="mr-2"
                              checked={postForm.status === "scheduled"}
                              onChange={() => setPostForm({...postForm, status: "scheduled"})}
                            />
                            <Label htmlFor="scheduled" className="text-black">Schedule</Label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="published"
                              name="status"
                              className="mr-2"
                              checked={postForm.status === "published"}
                              onChange={() => setPostForm({...postForm, status: "published"})}
                            />
                            <Label htmlFor="published" className="text-black">Publish Now</Label>
                          </div>
                        </div>
                        
                        {postForm.status === "scheduled" && (
                          <div className="mt-4">
                            <Input
                              type="date"
                              className="bg-white text-black border-gray-300"
                              value={postForm.scheduled_date ? format(postForm.scheduled_date, 'yyyy-MM-dd') : ''}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : new Date();
                                setPostForm({...postForm, scheduled_date: date});
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Button 
                          type="button"
                          className="bg-[#F28C38] hover:bg-[#F5A461] text-white w-full"
                          onClick={handleCreateOrUpdate}
                        >
                          Create Post
                        </Button>
                        
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mt-2 w-full flex items-center justify-center bg-white text-[#F28C38] border-[#F28C38]"
                          onClick={() => {}}
                        >
                          <AlertCircle size={16} className="mr-2" /> Generate with AI
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold mb-4 text-black">Post Preview</h2>
                    <p className="text-gray-500 mb-6">How your post will appear in Google Business Profile</p>
                    
                    <div className="border rounded-md overflow-hidden bg-white">
                      <div className="p-4">
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                          <span className="text-sm text-gray-500">Just now</span>
                        </div>
                        
                        <div className="mb-4 text-black">
                          {postForm.content || "Your post content will appear here. Add content to see how it will look."}
                        </div>
                        
                        {postForm.image_url && (
                          <div className="mb-4">
                            <img
                              src={postForm.image_url}
                              alt="Post preview"
                              className="w-full h-48 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <Button className="bg-[#F28C38] hover:bg-[#F5A461] text-white">
                            {postForm.cta_type?.replace(/_/g, ' ') || "LEARN MORE"}
                          </Button>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <Button variant="ghost" size="sm" className="mr-2 h-8 px-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
                            </svg>
                            0
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="scheduled" className="p-6">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-black">Scheduled Posts</h2>
                  <p className="text-gray-500 mb-6">View and manage your scheduled posts</p>
                  
                  {scheduledPosts.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-gray-500">No scheduled posts</p>
                      <Button 
                        className="mt-4 bg-[#F28C38] hover:bg-[#F5A461] text-white"
                        onClick={() => { 
                          resetPostForm();
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Create Post
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {scheduledPosts.map(post => (
                        <div key={post.id} className="border rounded-md p-4">
                          <div className="flex justify-between">
                            <h3 className="font-bold text-black">{post.title}</h3>
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPost(post)}
                                className="h-8 px-2 text-gray-700 hover:text-[#F28C38]"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePost(post)}
                                className="h-8 px-2 text-gray-700 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-700 my-2">{post.content.slice(0, 100)}...</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-[#F28C38] text-white">
                              Scheduled: {post.scheduled_date ? format(new Date(post.scheduled_date as any), 'MMM dd, yyyy') : 'N/A'}
                            </Badge>
                            {post.category && (
                              <Badge variant="outline" className="border-[#F28C38] text-black">
                                {post.category}
                              </Badge>
                            )}
                            {post.tags && post.tags.length > 0 && post.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="flex items-center gap-1 border-[#F28C38] text-black">
                                <Tag size={12} className="text-[#F28C38]" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="published" className="p-6">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-black">Published Posts</h2>
                  <p className="text-gray-500 mb-6">View your published posts</p>
                  
                  {publishedPosts.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-gray-500">No published posts</p>
                      <Button 
                        className="mt-4 bg-[#F28C38] hover:bg-[#F5A461] text-white"
                        onClick={() => { 
                          resetPostForm();
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Create Post
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {publishedPosts.map(post => (
                        <div key={post.id} className="border rounded-md p-4">
                          <div className="flex justify-between">
                            <h3 className="font-bold text-black">{post.title}</h3>
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPost(post)}
                                className="h-8 px-2 text-gray-700 hover:text-[#F28C38]"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePost(post)}
                                className="h-8 px-2 text-gray-700 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-700 my-2">{post.content.slice(0, 100)}...</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-[#F28C38] text-white">
                              Published: {post.published_at ? format(new Date(post.published_at as any), 'MMM dd, yyyy') : 'N/A'}
                            </Badge>
                            {post.category && (
                              <Badge variant="outline" className="border-[#F28C38] text-black">
                                {post.category}
                              </Badge>
                            )}
                            {post.tags && post.tags.length > 0 && post.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="flex items-center gap-1 border-[#F28C38] text-black">
                                <Tag size={12} className="text-[#F28C38]" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="draft" className="p-6">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-black">Draft Posts</h2>
                  <p className="text-gray-500 mb-6">View and manage your draft posts</p>
                  
                  {draftPosts.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-gray-500">No draft posts</p>
                      <Button 
                        className="mt-4 bg-[#F28C38] hover:bg-[#F5A461] text-white"
                        onClick={() => { 
                          resetPostForm();
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Create Post
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {draftPosts.map(post => (
                        <div key={post.id} className="border rounded-md p-4">
                          <div className="flex justify-between">
                            <h3 className="font-bold text-black">{post.title}</h3>
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPost(post)}
                                className="h-8 px-2 text-gray-700 hover:text-[#F28C38]"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePost(post)}
                                className="h-8 px-2 text-gray-700 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-700 my-2">{post.content.slice(0, 100)}...</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-[#F28C38] text-white">
                              Draft
                            </Badge>
                            {post.category && (
                              <Badge variant="outline" className="border-[#F28C38] text-black">
                                {post.category}
                              </Badge>
                            )}
                            {post.tags && post.tags.length > 0 && post.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="flex items-center gap-1 border-[#F28C38] text-black">
                                <Tag size={12} className="text-[#F28C38]" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="p-6">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-black">Post Analytics</h2>
                  <p className="text-gray-500 mb-6">View performance metrics for your posts</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 border rounded bg-white">
                      <div className="text-xl font-bold text-[#F28C38]">324</div>
                      <div className="text-gray-500">Total Views</div>
                    </div>
                    <div className="p-4 border rounded bg-white">
                      <div className="text-xl font-bold text-[#F28C38]">87</div>
                      <div className="text-gray-500">Total Engagements</div>
                    </div>
                    <div className="p-4 border rounded bg-white">
                      <div className="text-xl font-bold text-[#F28C38]">2.7%</div>
                      <div className="text-gray-500">Engagement Rate</div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4 text-black">Top Performing Posts</h3>
                    <div className="border rounded-md overflow-hidden bg-white">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="py-2 px-4 text-left text-black">Post Title</th>
                            <th className="py-2 px-4 text-left text-black">Views</th>
                            <th className="py-2 px-4 text-left text-black">Engagements</th>
                            <th className="py-2 px-4 text-left text-black">Published Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="py-2 px-4 text-black">Summer Promotion Announcement</td>
                            <td className="py-2 px-4 text-black">143</td>
                            <td className="py-2 px-4 text-black">38</td>
                            <td className="py-2 px-4 text-black">Jun 15, 2023</td>
                          </tr>
                          <tr className="border-t">
                            <td className="py-2 px-4 text-black">New Service Launch</td>
                            <td className="py-2 px-4 text-black">112</td>
                            <td className="py-2 px-4 text-black">27</td>
                            <td className="py-2 px-4 text-black">May 22, 2023</td>
                          </tr>
                          <tr className="border-t">
                            <td className="py-2 px-4 text-black">Customer Appreciation Day</td>
                            <td className="py-2 px-4 text-black">69</td>
                            <td className="py-2 px-4 text-black">22</td>
                            <td className="py-2 px-4 text-black">Apr 10, 2023</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-black">Engagement by Post Type</h3>
                    <div className="h-[300px] border rounded-md p-4 flex items-center justify-center bg-white">
                      <div className="text-center text-gray-500">Chart placeholder: Bar chart showing engagement by post type</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Best Posting Times */}
          <div className="mt-8 bg-white rounded-lg overflow-hidden shadow p-6">
            <h2 className="text-xl font-bold mb-2 text-black">Best Posting Times</h2>
            <p className="text-gray-500 mb-4">Recommended times to post based on historical engagement</p>
            
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#F28C38] text-white py-2 px-3">
                <CalendarIcon size={14} className="mr-2" />
                Wednesday 11:00 AM
              </Badge>
              <Badge className="bg-[#F28C38] text-white py-2 px-3">
                <CalendarIcon size={14} className="mr-2" />
                Tuesday 2:30 PM
              </Badge>
              <Badge className="bg-[#F28C38] text-white py-2 px-3">
                <CalendarIcon size={14} className="mr-2" />
                Friday 3:00 PM
              </Badge>
              <Badge className="bg-[#F28C38] text-white py-2 px-3">
                <CalendarIcon size={14} className="mr-2" />
                Saturday 11:30 AM
              </Badge>
            </div>
          </div>

          {/* Image Gallery Dialog */}
          <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="text-black">Select an Image for Your Post</DialogTitle>
                <DialogDescription>
                  Choose from your optimized images to include in your post.
                </DialogDescription>
              </DialogHeader>
              
              {isLoadingImages ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-[#F28C38]" />
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <ImageIcon className="h-6 w-6 text-[#F28C38]" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-black">No images found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No optimized images are available. Upload images in the Image Optimization section.
                  </p>
                  <div className="mt-6">
                    <Button 
                      type="button" 
                      className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
                      onClick={() => {
                        setIsImageGalleryOpen(false);
                        window.location.href = '/image-optimization';
                      }}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Go to Image Optimization
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {galleryImages.map((image: any) => (
                    <div 
                      key={image.id} 
                      className="border rounded-md overflow-hidden cursor-pointer hover:border-[#F28C38] transition-colors"
                      onClick={() => handleSelectImage(image)}
                    >
                      <div className="relative h-40">
                        <img 
                          src={image.url} 
                          alt={image.title || 'Gallery image'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                          }}
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium truncate text-black">{image.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">{image.uploadDate || 'Unknown date'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsImageGalleryOpen(false)}
                  className="bg-white text-black border-gray-300"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}