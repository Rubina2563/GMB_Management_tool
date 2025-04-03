import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  StarIcon, 
  MessageSquareReplyIcon, 
  SendIcon, 
  FilterIcon, 
  SortAscIcon,
  BellIcon,
  RefreshCcwIcon,
  SparklesIcon,
  CheckIcon,
  CalendarIcon,
  PencilIcon,
  UserIcon
} from "lucide-react";
import { colors } from "@/lib/colors";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_photo?: string;
  rating: number;
  comment: string;
  created_at: string;
  reply?: string;
  replied_at?: string;
  sentiment?: {
    score: number;
    magnitude: number;
    analysis: string;
  };
}

interface ReviewsData {
  reviews: Review[];
  totalCount: number;
  averageRating: number;
  ratingCounts: Record<string, number>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export default function ReviewManagementPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract locationId from the URL
  // In a real app this would be from the route params
  // For now we'll use a hardcoded value
  const locationId = "location_123"; // Mock location ID
  
  const [activeTab, setActiveTab] = useState<string>("all-reviews");
  const [sortBy, setSortBy] = useState<string>("date");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [replyMode, setReplyMode] = useState<"manual" | "ai">("manual");
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [creditBalance, setCreditBalance] = useState<number>(10); // Default value, will be updated
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  // Custom modal states
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [aiModalReviewId, setAiModalReviewId] = useState<string>("");
  const [aiModalReplyText, setAiModalReplyText] = useState<string>("");
  
  // Fetch reviews
  const { 
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError
  } = useQuery({
    queryKey: ['/api/reviews', locationId, sortBy, filterRating],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (filterRating && filterRating !== 'all') queryParams.append('filterRating', filterRating);
      
      const response = await fetch(`/api/reviews/${locationId}?${queryParams.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      return data.data as ReviewsData;
    }
  });
  
  // Fetch credit balance
  const {
    data: creditsData
  } = useQuery({
    queryKey: ['/api/client/reviews/credits'],
    queryFn: async () => {
      const response = await fetch('/api/client/reviews/credits', {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }
      
      const data = await response.json();
      if (data.success) {
        setCreditBalance(data.credits);
      }
      return data;
    }
  });
  
  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, replyText }: { reviewId: string, replyText: string }) => {
      const response = await apiRequest('POST', `/api/reviews/${locationId}/${reviewId}/reply`, { replyText });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews', locationId] });
      toast({
        title: "Reply submitted",
        description: "Your reply has been submitted successfully.",
      });
      setReplyText("");
      setSelectedReview(null);
      setDialogOpen(false);
      setReplyMode("manual");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit reply",
        variant: "destructive",
      });
    }
  });
  
  // AI suggestion generation
  const generateAISuggestion = async (reviewId: string) => {
    try {
      setIsGeneratingAI(true);
      
      const response = await fetch(`/api/client/reviews/${locationId}/${reviewId}/ai-suggest`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Set the reply text
        setReplyText(data.reply);
        setCreditBalance(data.credits || creditBalance);
        
        toast({
          title: "AI reply generated",
          description: "AI reply has been generated and is ready for your review.",
          style: { backgroundColor: colors.orange.base, color: 'white' },
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate AI reply. Try again or use manual input.",
          style: { backgroundColor: colors.accent.red, color: 'white' },
        });
        // Switch back to manual mode if AI fails
        setReplyMode("manual");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI reply. Try again or use manual input.",
        style: { backgroundColor: colors.accent.red, color: 'white' },
      });
    } finally {
      // Reset generating state
      setIsGeneratingAI(false);
    }
  };
  
  // Handle reply submission
  const handleSubmitReply = () => {
    if (!selectedReview) return;
    
    replyMutation.mutate({
      reviewId: selectedReview.id,
      replyText
    });
  };
  
  // Handle manual reply mode selection
  const handleManualReplyMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReplyMode("manual");
  };
  
  // Handle AI reply generation directly
  const handleAIReplyMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set mode
    setReplyMode("ai");
    
    // Only proceed if we have a selected review
    if (!selectedReview) return;
    
    // Show loading state
    setIsGeneratingAI(true);
    setReplyText("Generating AI reply...");
    
    // Direct fetch call to avoid any issues with React Query
    fetch(`/api/client/reviews/${locationId}/${selectedReview.id}/ai-suggest`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      // Keep dialog open
      setDialogOpen(true);
      
      if (data.success) {
        // Update the reply text
        setReplyText(data.reply);
        
        // Update credits
        setCreditBalance(data.credits || creditBalance);
        
        toast({
          title: "AI reply generated",
          description: "AI reply has been generated and is ready for your review.",
          style: { backgroundColor: colors.orange.base, color: 'white' },
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate AI reply. Try again or use manual input.",
          style: { backgroundColor: colors.accent.red, color: 'white' },
        });
      }
    })
    .catch(error => {
      console.error("Error generating AI reply:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI reply. Try again or use manual input.",
        style: { backgroundColor: colors.accent.red, color: 'white' },
      });
    })
    .finally(() => {
      // Always reset generating state but keep dialog open
      setIsGeneratingAI(false);
      setDialogOpen(true);
    });
  };
  
  // Generate AI reply
  const generateAIReply = () => {
    if (!selectedReview) return;
    
    // Clear any existing text and set loading state
    setReplyText("");
    setIsGeneratingAI(true);
    
    // Make API call
    fetch(`/api/client/reviews/${locationId}/${selectedReview.id}/ai-suggest`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update the reply text
        setReplyText(data.reply);
        
        // Update credits
        setCreditBalance(data.credits || creditBalance);
        
        toast({
          title: "AI reply generated",
          description: "AI reply has been generated and is ready for your review.",
          style: { backgroundColor: colors.orange.base, color: 'white' },
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate AI reply. Try again or use manual input.",
          style: { backgroundColor: colors.accent.red, color: 'white' },
        });
      }
    })
    .catch(error => {
      console.error("Error generating AI reply:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI reply. Try again or use manual input.",
        style: { backgroundColor: colors.accent.red, color: 'white' },
      });
    })
    .finally(() => {
      // Always reset generating state
      setIsGeneratingAI(false);
    });
  };
  
  // Helper to render star ratings
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <StarIcon 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };
  
  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Listen for submenu clicks
  useEffect(() => {
    const handleSubMenuClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.id) {
        setActiveTab(customEvent.detail.id);
      }
    };
    
    window.addEventListener('submenuClicked', handleSubMenuClick);
    
    return () => {
      window.removeEventListener('submenuClicked', handleSubMenuClick);
    };
  }, []);
  
  // Open AI suggestion modal
  const openAISuggestionModal = (reviewId: string) => {
    setAiModalReviewId(reviewId);
    setAiModalReplyText("");
    setIsGeneratingAI(true);
    setShowAIModal(true);
    
    // Simulate API call (in a real app, this would be an actual API call)
    setTimeout(() => {
      const review = reviewsData?.reviews.find(r => r.id === reviewId);
      let mockReply = "";
      
      if (review) {
        if (review.rating >= 4) {
          mockReply = `Thank you for your positive feedback, ${review.reviewer_name}! We're thrilled that you had such a great experience with us. We strive to provide excellent service to all our customers, and it's rewarding to know we've succeeded in your case. We look forward to serving you again soon!`;
        } else if (review.rating >= 3) {
          mockReply = `Thank you for taking the time to share your experience, ${review.reviewer_name}. We appreciate your feedback and are glad you found aspects of our service satisfactory. We're always looking to improve, so we'll take your comments into consideration. We hope to serve you again and exceed your expectations next time.`;
        } else {
          mockReply = `We appreciate your feedback, ${review.reviewer_name}, and we're sorry to hear that your experience didn't meet your expectations. We take all feedback seriously and would like to learn more about your concerns. Please contact our customer service team directly so we can address the specific issues you encountered and make things right.`;
        }
      }
      
      setAiModalReplyText(mockReply);
      setIsGeneratingAI(false);
    }, 1500);
  };
  
  // Handle submit of AI modal
  const handleSubmitAIReply = () => {
    if (!aiModalReviewId || !aiModalReplyText) return;
    
    replyMutation.mutate({
      reviewId: aiModalReviewId,
      replyText: aiModalReplyText
    });
    
    setShowAIModal(false);
  };
  
  return (
    <div className="w-full pl-[70px] pr-[150px] py-8">
      {/* AI Generation modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold" style={{ color: colors.text.dark }}>
                AI-Generated Reply
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAIModal(false)}
                style={{ color: colors.text.dark }}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Review the AI-generated reply below. You can edit it before submitting or generate a new reply.
              </p>
              
              <div className="relative">
                <Textarea 
                  className="w-full min-h-[150px] p-3 border rounded-md"
                  placeholder="AI is generating a reply..."
                  value={aiModalReplyText}
                  onChange={(e) => setAiModalReplyText(e.target.value)}
                  disabled={isGeneratingAI}
                />
                
                {isGeneratingAI && (
                  <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <SparklesIcon className="h-8 w-8 animate-pulse text-[#F28C38]" />
                      <p className="text-sm mt-2 text-[#1C2526]">Generating...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {!isGeneratingAI && (
              <Button 
                variant="outline"
                onClick={() => {
                  setIsGeneratingAI(true);
                  // In a real app, this would call the API again
                  setTimeout(() => {
                    const review = reviewsData?.reviews.find(r => r.id === aiModalReviewId);
                    if (review) {
                      let newReply = `Thank you for your ${review.rating >= 4 ? 'wonderful' : review.rating >= 3 ? 'honest' : 'valuable'} feedback, ${review.reviewer_name}. We ${review.rating >= 4 ? 'appreciate your kind words and are delighted' : review.rating >= 3 ? 'appreciate your feedback and are pleased' : 'take your concerns seriously and regret'} to hear about your experience. Our team is committed to ${review.rating >= 4 ? 'maintaining this level of service' : review.rating >= 3 ? 'continuously improving' : 'addressing the issues you mentioned'}. We hope to ${review.rating >= 4 ? 'see you again soon' : review.rating >= 3 ? 'serve you better next time' : 'have the opportunity to make things right'}.`;
                      setAiModalReplyText(newReply);
                    }
                    setIsGeneratingAI(false);
                  }, 1500);
                }}
                style={{ 
                  color: colors.orange.base
                }}
                className="hover:bg-[#F28C38]/10"
              >
                <RefreshCcwIcon className="h-4 w-4 mr-2" />
                Regenerate Reply
              </Button>
            )}
            
            <div className="flex justify-end gap-3 mt-4">
              <Button 
                variant="outline"
                onClick={() => setShowAIModal(false)}
                style={{ color: colors.text.dark }}
              >
                Cancel
              </Button>
              <Button 
                disabled={!aiModalReplyText || isGeneratingAI || replyMutation.isPending}
                style={{
                  backgroundColor: colors.orange.base,
                  color: 'white'
                }}
                className="hover:bg-[#F5A461]"
                onClick={handleSubmitAIReply}
              >
                {replyMutation.isPending ? 'Submitting...' : 'Submit Reply'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.text.dark }}>Review Management</h1>
      </div>
      
      <Tabs defaultValue="all-reviews" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all-reviews">
            All Reviews
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Reviews
          </TabsTrigger>
          <TabsTrigger value="replied">
            Replied Reviews
          </TabsTrigger>
          <TabsTrigger value="settings">
            Review Settings
          </TabsTrigger>
        </TabsList>
        
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FilterIcon className="h-4 w-4 text-gray-500" />
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">★★★★★ (5 stars)</SelectItem>
                  <SelectItem value="4">★★★★☆ (4 stars)</SelectItem>
                  <SelectItem value="3">★★★☆☆ (3 stars)</SelectItem>
                  <SelectItem value="2">★★☆☆☆ (2 stars)</SelectItem>
                  <SelectItem value="1">★☆☆☆☆ (1 star)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <SortAscIcon className="h-4 w-4 text-gray-500" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="rating-asc">Lowest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-4 w-4 text-[#F28C38]" />
            <span className="text-sm font-medium">{creditBalance} AI Credits</span>
          </div>
        </div>
        
        <TabsContent value="all-reviews" className="mt-0">
          {reviewsLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
          ) : reviewsError ? (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-500">Error loading reviews. Please try again.</p>
            </div>
          ) : !reviewsData || reviewsData.reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-24 w-24 text-gray-300">
                <MessageSquareReplyIcon className="h-full w-full" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-6">
                Your customers haven't left any reviews yet. Reviews will appear here once customers provide feedback.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviewsData.reviews.map((review) => (
                <Card key={review.id} className="overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-8 divide-x border-b">
                      <div className="col-span-1 p-4 flex flex-col items-center justify-center bg-white">
                        <div className="flex flex-col items-center mb-2">
                          <span className="text-3xl font-bold mb-1 text-black">{review.rating}</span>
                          <div className="flex">{renderStars(review.rating)}</div>
                        </div>
                        <span className="text-xs text-black">{formatDate(review.created_at)}</span>
                      </div>
                      
                      <div className="col-span-7 p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden mr-3 flex items-center justify-center">
                              {review.reviewer_photo ? (
                                <img 
                                  src={review.reviewer_photo} 
                                  alt={review.reviewer_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <h3 className="font-semibold">{review.reviewer_name}</h3>
                          </div>
                          
                          {review.sentiment && (
                            <Badge className={
                              review.sentiment.score > 0.3 ? "bg-green-100 text-green-800" : 
                              review.sentiment.score < -0.3 ? "bg-red-100 text-red-800" : 
                              "bg-gray-100 text-gray-800"
                            }>
                              {review.sentiment.score > 0.3 ? "Positive" : 
                               review.sentiment.score < -0.3 ? "Negative" : 
                               "Neutral"}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="mb-4 text-black">{review.comment}</p>
                        
                        {review.reply ? (
                          <div className="bg-white p-3 rounded-md border border-gray-200">
                            <div className="flex items-center mb-2">
                              <MessageSquareReplyIcon className="h-4 w-4 mr-2 text-[#F28C38]" />
                              <span className="font-medium text-sm">Your Reply</span>
                              {review.replied_at && (
                                <span className="text-xs text-black ml-2">
                                  {formatDate(review.replied_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-black">{review.reply}</p>
                          </div>
                        ) : (
                          <div className="flex space-x-3">
                            <Button 
                              size="sm"
                              variant="outline"
                              style={{ color: colors.orange.base }}
                              className="hover:bg-[#F28C38]/10"
                              onClick={() => {
                                openAISuggestionModal(review.id);
                              }}
                            >
                              <SparklesIcon className="h-4 w-4 mr-2" />
                              Generate AI Reply
                            </Button>
                            
                            <Button 
                              size="sm"
                              style={{ backgroundColor: colors.orange.base, color: 'white' }}
                              className="hover:bg-[#F5A461]"
                              onClick={() => {
                                setSelectedReview(review);
                                setReplyText("");
                                setDialogOpen(true);
                              }}
                            >
                              <MessageSquareReplyIcon className="h-4 w-4 mr-2" />
                              Reply
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-black mb-2">Pending Reviews</h3>
            <p className="text-black mb-6">
              This tab will display reviews that are waiting for your response.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="replied" className="mt-0">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-black mb-2">Replied Reviews</h3>
            <p className="text-black mb-6">
              This tab will display reviews that you have already responded to.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-black mb-2">Review Settings</h3>
            <p className="text-black mb-6">
              Configure your review management settings here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Reply Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reply to {selectedReview?.reviewer_name}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-4">
                <div className="flex mb-2">
                  {selectedReview && renderStars(selectedReview.rating)}
                </div>
                <p className="text-sm text-black">{selectedReview?.comment}</p>
              </div>
              
              <div className="flex justify-between border-t border-b py-2 mb-4">
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant={replyMode === "manual" ? "default" : "outline"}
                    onClick={handleManualReplyMode}
                    className={replyMode === "manual" ? "bg-[#F28C38] hover:bg-[#F5A461]" : ""}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Manual
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant={replyMode === "ai" ? "default" : "outline"}
                    onClick={handleAIReplyMode}
                    className={replyMode === "ai" ? "bg-[#F28C38] hover:bg-[#F5A461]" : ""}
                    disabled={isGeneratingAI}
                  >
                    {isGeneratingAI ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-1 border-2 border-white rounded-full border-t-transparent"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        AI-Powered
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center">
                  <SparklesIcon className="h-4 w-4 text-[#F28C38] mr-1" />
                  <span className="text-xs text-black">{creditBalance} credits remaining</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mb-4">
            <Textarea 
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[120px]"
              disabled={isGeneratingAI}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={replyMutation.isPending || isGeneratingAI}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={!replyText || replyMutation.isPending || isGeneratingAI}
              onClick={(e) => {
                e.preventDefault();
                handleSubmitReply();
              }}
              className="bg-[#F28C38] hover:bg-[#F5A461]"
            >
              {replyMutation.isPending ? 'Submitting...' : 'Submit Reply'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}