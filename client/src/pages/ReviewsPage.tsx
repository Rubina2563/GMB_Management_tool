import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
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
import { colors, gradients } from "@/lib/colors";

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

interface ReviewRequest {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'sent' | 'opened' | 'clicked' | 'responded' | 'failed';
  sent_at: string;
  opened_at?: string;
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

export default function ReviewsPage() {
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
  
  // For review request form
  const [requestName, setRequestName] = useState<string>("");
  const [requestEmail, setRequestEmail] = useState<string>("");
  const [requestPhone, setRequestPhone] = useState<string>("");
  
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
  
  // Fetch review requests
  const {
    data: requestsData,
    isLoading: requestsLoading
  } = useQuery({
    queryKey: ['/api/reviews/requests', locationId],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${locationId}/requests`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch review requests');
      }
      
      const data = await response.json();
      return data.requests as ReviewRequest[];
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
  
  // Fetch sentiment analysis using Google Natural Language API
  const {
    data: sentimentData,
    isLoading: sentimentLoading,
    error: sentimentError
  } = useQuery({
    queryKey: ['/api/client/reviews/sentiment', locationId],
    queryFn: async () => {
      const response = await fetch(`/api/client/reviews/${locationId}/sentiment`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle case where Google API is not configured
          toast({
            title: "API Configuration Required",
            description: "Google Natural Language API not configured. Advanced sentiment analysis is unavailable.",
            variant: "destructive"
          });
          return null;
        }
        throw new Error('Failed to fetch sentiment analysis');
      }
      
      const data = await response.json();
      if (data.success) {
        return data.sentimentAnalysis;
      }
      return null;
    },
    // Only run this query if we have reviews data
    enabled: !!reviewsData && reviewsData.reviews.length > 0,
    // Don't refetch unnecessarily
    staleTime: 5 * 60 * 1000 // 5 minutes
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
  
  // Send review request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (requestData: { name: string, email: string, phone?: string }) => {
      const response = await apiRequest('POST', `/api/reviews/${locationId}/request`, requestData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/requests', locationId] });
      toast({
        title: "Request sent",
        description: "Review request has been sent successfully.",
      });
      setRequestName("");
      setRequestEmail("");
      setRequestPhone("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send review request",
        variant: "destructive",
      });
    }
  });
  
  // AI suggestion generation - not using React Query for this anymore
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
  
  // Handle send review request
  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestName || !requestEmail) {
      toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    
    sendRequestMutation.mutate({
      name: requestName,
      email: requestEmail,
      phone: requestPhone || undefined
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
  
  // Generate AI reply using language model API
  const generateAIReply = async () => {
    if (!selectedReview) return;
    
    // Clear any existing text and set loading state
    setReplyText("");
    setIsGeneratingAI(true);
    
    try {
      // Prepare the prompt with review details
      const prompt = `Write a professional reply to this customer review from ${selectedReview.reviewer_name}. 
      Rating: ${selectedReview.rating} out of 5 stars
      Review: "${selectedReview.comment}"
      
      The reply should be friendly, professional, and address the specific points in the review.`;
      
      // Make API call to the language model service
      const response = await fetch('/api/client/language-model/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'review-reply',
          prompt
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate AI reply");
      }
      
      const data = await response.json();
      
      if (data.success && data.content) {
        // Update the reply text
        setReplyText(data.content);
        
        // Deduct credits
        setCreditBalance(prevBalance => Math.max(0, prevBalance - 2));
        
        toast({
          title: "AI reply generated",
          description: "AI reply has been generated and is ready for your review.",
          style: { backgroundColor: colors.orange.base, color: 'white' },
        });
      } else {
        throw new Error("No content returned from AI service");
      }
    } catch (error: any) {
      console.error("Error generating AI reply:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI reply. Try again or use manual input.",
        style: { backgroundColor: colors.accent.red, color: 'white' },
      });
      
      // Add a basic reply as a fallback
      setReplyText(`Thank you for your ${selectedReview.rating >= 4 ? 'positive' : 'valuable'} feedback. We appreciate you taking the time to share your experience with us.`);
    } finally {
      // Always reset generating state
      setIsGeneratingAI(false);
    }
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
  
  // Calculate percentages for the sentiment analysis
  const calculateSentimentPercentages = () => {
    if (!reviewsData) return { positive: 0, neutral: 0, negative: 0 };
    
    const total = reviewsData.sentiment.positive + reviewsData.sentiment.neutral + reviewsData.sentiment.negative;
    if (total === 0) return { positive: 0, neutral: 0, negative: 0 };
    
    return {
      positive: Math.round((reviewsData.sentiment.positive / total) * 100),
      neutral: Math.round((reviewsData.sentiment.neutral / total) * 100),
      negative: Math.round((reviewsData.sentiment.negative / total) * 100)
    };
  };
  
  const sentimentPercentages = calculateSentimentPercentages();
  
  // Function to generate AI reply using language model API
  const handleGenerateAIReply = async () => {
    // Show loading state
    setIsGeneratingAI(true);
    
    // Get the review
    const review = reviewsData?.reviews.find(r => r.id === aiModalReviewId);
    if (!review) {
      toast({
        title: "Error",
        description: "Review not found. Please try again.",
        style: { backgroundColor: colors.accent.red, color: 'white' },
      });
      setIsGeneratingAI(false);
      return;
    }
    
    try {
      // Prepare the prompt
      const prompt = `Write a professional reply to this customer review from ${review.reviewer_name}. 
      Rating: ${review.rating} out of 5 stars
      Review: "${review.comment}"
      
      The reply should be friendly, professional, and address the specific points in the review.`;
      
      // Make the API call
      const response = await fetch('/api/client/language-model/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'review-reply',
          prompt
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate AI reply");
      }
      
      const data = await response.json();
      
      if (data.success && data.content) {
        // Set the AI modal reply text
        setAiModalReplyText(data.content);
        
        // Deduct credits
        setCreditBalance(prevBalance => Math.max(0, prevBalance - 2));
        
        toast({
          title: "AI reply generated",
          description: "AI reply has been generated and is ready for your review.",
          style: { backgroundColor: colors.orange.base, color: 'white' },
        });
      } else {
        throw new Error("No content returned from AI service");
      }
    } catch (error: any) {
      console.error("Error generating AI reply:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI reply. Try again or use manual input.",
        style: { backgroundColor: colors.accent.red, color: 'white' },
      });
      
      // Fallback to simple reply if needed
      if (!aiModalReplyText) {
        const fallbackReply = `Thank you for your ${review.rating >= 4 ? 'positive' : 'valuable'} feedback, ${review.reviewer_name}. We appreciate you taking the time to share your experience with us.`;
        setAiModalReplyText(fallbackReply);
      }
    } finally {
      // Reset loading state
      setIsGeneratingAI(false);
    }
  };
  
  // Function to submit AI reply from custom modal
  const handleSubmitAIReply = () => {
    // Find the review
    const review = reviewsData?.reviews.find(r => r.id === aiModalReviewId);
    if (!review) return;
    
    // Set as selected review and set reply text
    setSelectedReview(review);
    setReplyText(aiModalReplyText);
    
    // Submit reply
    replyMutation.mutate({
      reviewId: aiModalReviewId,
      replyText: aiModalReplyText
    });
    
    // Close modal
    setShowAIModal(false);
  };
  
  return (
    <div className="p-6" style={{ background: colors.background.white }}>
      {/* Custom AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 relative">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowAIModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center mb-4">
              <SparklesIcon className="h-6 w-6 mr-3" style={{ color: "#6B5B95" }} />
              <h2 className="text-xl font-bold" style={{ color: colors.text.dark }}>AI-Generated Reply</h2>
            </div>
            
            <p className="text-sm mb-4" style={{ color: colors.text.dark }}>
              Generate an AI response to this review using 2 credits
            </p>
            
            {/* Review Content */}
            {reviewsData && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex mb-2">
                  {renderStars(reviewsData.reviews.find(r => r.id === aiModalReviewId)?.rating || 5)}
                  <span className="ml-2 text-sm" style={{ color: colors.text.secondary }}>
                    {formatDate(reviewsData.reviews.find(r => r.id === aiModalReviewId)?.created_at || new Date().toISOString())}
                  </span>
                </div>
                <p className="text-sm italic" style={{ color: colors.text.dark }}>
                  "{reviewsData.reviews.find(r => r.id === aiModalReviewId)?.comment}"
                </p>
                <div className="mt-2 text-xs" style={{ color: colors.text.secondary }}>
                  By: {reviewsData.reviews.find(r => r.id === aiModalReviewId)?.reviewer_name}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium" style={{ color: colors.text.dark }}>AI Reply</h3>
              <div className="text-sm" style={{ color: colors.text.secondary }}>
                Credits: {creditBalance}
              </div>
            </div>
            
            {!aiModalReplyText && !isGeneratingAI && (
              <Button
                className="w-full mb-4 hover:bg-[#4A3C7A] transition-colors"
                style={{
                  backgroundColor: "#6B5B95",
                  color: "white",
                  border: "none"
                }}
                onClick={handleGenerateAIReply}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate AI Reply (2 credits)
                  </>
                )}
              </Button>
            )}
            
            <Textarea 
              placeholder={isGeneratingAI ? "Generating AI reply..." : "AI reply will appear here"}
              value={aiModalReplyText}
              onChange={(e) => setAiModalReplyText(e.target.value)}
              rows={5}
              className="w-full mb-4 bg-white border-gray-200"
              style={{ color: colors.text.dark }}
              disabled={isGeneratingAI}
            />
            
            {aiModalReplyText && !isGeneratingAI && (
              <Button
                className="w-full mb-4 hover:bg-[#4A3C7A] transition-colors"
                style={{
                  backgroundColor: "#6B5B95",
                  color: "white",
                  border: "none"
                }}
                onClick={handleGenerateAIReply}
                disabled={isGeneratingAI}
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
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.text.dark }}>Review Management</h1>
      </div>
      
      <Tabs defaultValue="all-reviews" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all-reviews">
            All Reviews
          </TabsTrigger>
          <TabsTrigger value="sentiment-analysis">
            Sentiment Analysis
          </TabsTrigger>
          <TabsTrigger value="review-requests">
            Review Requests
          </TabsTrigger>
        </TabsList>
        
        {/* All Reviews Tab */}
        <TabsContent value="all-reviews" className="space-y-6">
          <Card style={{ 
            background: colors.background.white,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${colors.text.secondary}20`
          }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle style={{ color: colors.text.dark }}>Reviews</CardTitle>
                <div className="flex gap-2">
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-36 bg-white border-gray-200">
                      <FilterIcon className="h-4 w-4 mr-2" style={{ color: colors.orange.base }} />
                      <SelectValue placeholder="Filter Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36 bg-white border-gray-200">
                      <SortAscIcon className="h-4 w-4 mr-2" style={{ color: colors.orange.base }} />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Most Recent</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription style={{ color: colors.text.dark }}>
                {reviewsData ? 
                  `${reviewsData.totalCount} reviews with an average rating of ${reviewsData.averageRating.toFixed(1)}` 
                  : 'Loading reviews...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.orange.base }}></div>
                </div>
              ) : reviewsError ? (
                <div className="text-center p-8" style={{ color: colors.accent.red }}>
                  Error loading reviews. Please try again.
                </div>
              ) : (
                <div className="space-y-6">
                  {reviewsData?.reviews.map((review) => (
                    <motion.div 
                      key={review.id}
                      className="rounded-lg p-4 shadow-md"
                      style={{
                        background: colors.background.light,
                        border: `1px solid ${colors.orange.base}20`,
                        borderLeft: `4px solid ${colors.orange.base}`
                      }}
                      whileHover={{ 
                        scale: 1.01,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        borderLeft: `6px solid ${colors.orange.base}`
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20 
                      }}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center gap-3">
                          {review.reviewer_photo ? (
                            <img 
                              src={review.reviewer_photo} 
                              alt={review.reviewer_name}
                              className="w-10 h-10 rounded-full"
                              style={{ border: `2px solid ${colors.orange.base}` }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ 
                                background: `${colors.orange.base}20`,
                                border: `2px solid ${colors.orange.base}`
                              }}
                            >
                              <span className="text-lg font-semibold" style={{ color: colors.orange.base }}>
                                {review.reviewer_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium" style={{ color: colors.text.dark }}>{review.reviewer_name}</div>
                            <div className="flex">{renderStars(review.rating)}</div>
                          </div>
                        </div>
                        <div className="text-sm flex items-center" style={{ color: colors.text.dark }}>
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {formatDate(review.created_at)}
                        </div>
                      </div>
                      
                      <div className="mt-3" style={{ color: colors.text.dark }}>
                        {review.comment}
                      </div>
                      
                      {review.sentiment && (
                        <div className="mt-2 inline-flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ 
                              background: review.sentiment.score > 0.3 
                                ? colors.orange.base 
                                : (review.sentiment.score < -0.3 
                                  ? colors.accent.red 
                                  : colors.text.secondary)
                            }}
                          ></div>
                          <span className="text-xs" style={{ color: colors.text.dark }}>
                            {review.sentiment.analysis}
                          </span>
                        </div>
                      )}
                      
                      {review.reply && (
                        <div className="mt-3 pl-4 border-l-2" style={{ borderColor: colors.orange.base }}>
                          <div className="text-sm font-medium" style={{ color: colors.text.dark }}>Your reply:</div>
                          <div className="text-sm mt-1" style={{ color: colors.text.dark }}>{review.reply}</div>
                          {review.replied_at && (
                            <div className="text-xs mt-1 flex items-center" style={{ color: colors.text.dark }}>
                              <CheckIcon className="h-3 w-3 mr-1" style={{ color: colors.orange.light }} />
                              {formatDate(review.replied_at)}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!review.reply && (
                        <div className="mt-3 flex gap-2">
                          {/* Regular Reply Button with Dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                style={{ 
                                  backgroundColor: colors.orange.base,
                                  color: 'white',
                                  border: 'none'
                                }}
                                className="hover:bg-[#F5A461] transition-colors"
                              >
                                <MessageSquareReplyIcon className="h-4 w-4 mr-2" />
                                Reply
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-[500px]" style={{ background: colors.background.white, borderRadius: '8px' }}>
                              <AlertDialogHeader>
                                <AlertDialogTitle style={{ color: colors.text.dark }}>Reply to Review</AlertDialogTitle>
                                <AlertDialogDescription style={{ color: colors.text.dark }}>
                                  Your reply will be public and visible to anyone who can see this review.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              
                              <div className="border rounded-lg p-3 mt-2" style={{ 
                                background: colors.background.light,
                                borderColor: colors.text.secondary + '30'
                              }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium" style={{ color: colors.text.dark }}>{review.reviewer_name}</span>
                                  <div className="flex">{renderStars(review.rating)}</div>
                                </div>
                                <div style={{ color: colors.text.dark }}>{review.comment}</div>
                              </div>
                              
                              <div className="my-4">
                                <Label htmlFor="manual-reply-text" style={{ color: colors.text.dark }}>Your Reply</Label>
                                <Textarea 
                                  id="manual-reply-text"
                                  placeholder="Write your response here..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  rows={4}
                                  className="mt-2 bg-white border-gray-200"
                                  style={{ color: colors.text.dark }}
                                />
                              </div>
                              
                              <AlertDialogFooter>
                                <AlertDialogCancel 
                                  onClick={() => {
                                    setReplyText("");
                                  }}
                                  style={{ 
                                    background: colors.background.light, 
                                    color: colors.text.dark,
                                    borderColor: colors.text.secondary + '40'
                                  }}
                                  className="hover:bg-gray-100"
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => {
                                    // Set the selected review and submit
                                    setSelectedReview(review);
                                    setTimeout(() => {
                                      handleSubmitReply();
                                    }, 50);
                                  }} 
                                  disabled={!replyText.trim() || replyMutation.isPending}
                                  style={{ 
                                    backgroundColor: colors.orange.base,
                                    color: 'white'
                                  }}
                                  className="hover:bg-[#F5A461]"
                                >
                                  {replyMutation.isPending ? 'Submitting...' : 'Submit Reply'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          {/* Simple AI Reply Button */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            style={{ 
                              backgroundColor: "#6B5B95",
                              color: 'white',
                              border: 'none'
                            }}
                            className="hover:bg-[#4A3C7A] transition-colors"
                            onClick={() => {
                              // Set the selected review 
                              setSelectedReview(review);
                              // Reset any existing text
                              setAiModalReplyText("");
                              // Save review ID
                              setAiModalReviewId(review.id);
                              // Open AI modal
                              setShowAIModal(true);
                            }}
                          >
                            <SparklesIcon className="h-4 w-4 mr-2" />
                            AI Reply
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment-analysis" className="space-y-6">
          <Card style={{ 
            background: colors.background.white,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${colors.text.secondary}20`
          }}>
            <CardHeader>
              <CardTitle style={{ color: colors.text.dark }}>Sentiment Analysis</CardTitle>
              <CardDescription style={{ color: colors.text.dark }}>
                Analysis of customer sentiment based on review content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.orange.base }}></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Sentiment Chart Section */}
                  <div className="p-4 rounded-lg" style={{ background: colors.background.light }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.dark }}>Overall Sentiment</h3>
                    <div className="h-64">
                      {reviewsData && (
                        <Bar
                          data={{
                            labels: ['Positive', 'Neutral', 'Negative'],
                            datasets: [
                              {
                                label: 'Sentiment Analysis',
                                data: [
                                  // If we have sentiment data from Google API, use it, otherwise fall back to existing data
                                  sentimentData ? sentimentData.sentimentDistribution.positive : reviewsData.sentiment.positive,
                                  sentimentData ? sentimentData.sentimentDistribution.neutral : reviewsData.sentiment.neutral,
                                  sentimentData ? sentimentData.sentimentDistribution.negative : reviewsData.sentiment.negative
                                ],
                                backgroundColor: [
                                  colors.orange.base,
                                  colors.text.secondary,
                                  colors.accent.red
                                ],
                                borderWidth: 0,
                                borderRadius: 6,
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    // Use the same source of data as the chart
                                    const positive = sentimentData ? sentimentData.sentimentDistribution.positive : reviewsData.sentiment.positive;
                                    const neutral = sentimentData ? sentimentData.sentimentDistribution.neutral : reviewsData.sentiment.neutral;
                                    const negative = sentimentData ? sentimentData.sentimentDistribution.negative : reviewsData.sentiment.negative;
                                    const total = positive + neutral + negative;
                                    const percentage = Math.round((context.raw as number) / total * 100);
                                    return `${context.raw} reviews (${percentage}%)`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                  color: colors.text.dark
                                }
                              },
                              x: {
                                grid: {
                                  display: false
                                },
                                ticks: {
                                  color: colors.text.dark
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg" style={{ background: colors.background.light }}>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.dark }}>Rating Distribution</h3>
                      {reviewsData && Object.entries(reviewsData.ratingCounts)
                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                        .map(([rating, count]) => (
                          <div key={rating} className="flex items-center mb-3">
                            <div className="flex w-24">
                              {Array(Number(rating)).fill(0).map((_, i) => (
                                <StarIcon key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              ))}
                            </div>
                            <div className="w-full ml-4">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full"
                                  style={{ 
                                    width: `${(count / reviewsData.totalCount) * 100}%`,
                                    background: colors.orange.base 
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="ml-4 w-12 text-right text-sm" style={{ color: colors.text.dark }}>
                              {count}
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    <div className="p-4 rounded-lg" style={{ background: colors.background.light }}>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.dark }}>
                        Common Themes
                        {sentimentData && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            (Powered by Google Natural Language API)
                          </span>
                        )}
                      </h3>
                      
                      {sentimentLoading ? (
                        <div className="flex justify-center items-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors.orange.base }}></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* If we have sentiment data from Google API, show extracted key phrases */}
                          {sentimentData ? (
                            <>
                              {sentimentData.keyPhrases.positive.length > 0 && sentimentData.keyPhrases.positive.slice(0, 2).map((phrase, index) => (
                                <div key={`positive-${index}`} className="flex justify-between items-center p-2 rounded" style={{ background: `${colors.orange.base}10` }}>
                                  <span className="text-sm" style={{ color: colors.text.dark }}>{phrase}</span>
                                  <Badge style={{ background: colors.orange.base, color: 'white' }}>Positive</Badge>
                                </div>
                              ))}
                              
                              {sentimentData.keyPhrases.neutral.length > 0 && sentimentData.keyPhrases.neutral.slice(0, 1).map((phrase, index) => (
                                <div key={`neutral-${index}`} className="flex justify-between items-center p-2 rounded" style={{ background: `${colors.text.secondary}10` }}>
                                  <span className="text-sm" style={{ color: colors.text.dark }}>{phrase}</span>
                                  <Badge style={{ background: colors.text.secondary, color: colors.text.dark }}>Neutral</Badge>
                                </div>
                              ))}
                              
                              {sentimentData.keyPhrases.negative.length > 0 && sentimentData.keyPhrases.negative.slice(0, 1).map((phrase, index) => (
                                <div key={`negative-${index}`} className="flex justify-between items-center p-2 rounded" style={{ background: `${colors.accent.red}10` }}>
                                  <span className="text-sm" style={{ color: colors.text.dark }}>{phrase}</span>
                                  <Badge style={{ background: colors.accent.red, color: 'white' }}>Negative</Badge>
                                </div>
                              ))}
                              
                              {/* If no phrases are found in any category */}
                              {sentimentData.keyPhrases.positive.length === 0 && 
                               sentimentData.keyPhrases.neutral.length === 0 && 
                               sentimentData.keyPhrases.negative.length === 0 && (
                                <div className="text-center p-2 text-sm" style={{ color: colors.text.secondary }}>
                                  No common themes detected in the reviews
                                </div>
                              )}
                            </>
                          ) : (
                            // Fallback to static data when sentiment API data is not available
                            <>
                              <div className="flex justify-between items-center p-2 rounded" style={{ background: `${colors.orange.base}10` }}>
                                <span className="text-sm" style={{ color: colors.text.dark }}>Service Quality</span>
                                <Badge style={{ background: colors.orange.base, color: 'white' }}>Positive</Badge>
                              </div>
                              <div className="flex justify-between items-center p-2 rounded" style={{ background: `${colors.orange.base}10` }}>
                                <span className="text-sm" style={{ color: colors.text.dark }}>Response Time</span>
                                <Badge style={{ background: colors.orange.base, color: 'white' }}>Positive</Badge>
                              </div>
                              <div className="flex justify-between items-center p-2 rounded" style={{ background: `${colors.text.secondary}10` }}>
                                <span className="text-sm" style={{ color: colors.text.dark }}>Product Quality</span>
                                <Badge style={{ background: colors.text.secondary, color: colors.text.dark }}>Neutral</Badge>
                              </div>
                              <div className="flex justify-between items-center p-2 rounded" style={{ background: `${colors.accent.red}10` }}>
                                <span className="text-sm" style={{ color: colors.text.dark }}>Price</span>
                                <Badge style={{ background: colors.accent.red, color: 'white' }}>Negative</Badge>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-6">
                        <h4 className="text-md font-medium mb-2" style={{ color: colors.text.dark }}>Keyword Frequency</h4>
                        <div className="flex flex-wrap gap-2">
                          {/* If we have sentiment data from Google API, show the extracted key phrases as keyword badges */}
                          {sentimentData ? (
                            <>
                              {sentimentData.keyPhrases.positive.map((phrase, index) => (
                                <Badge 
                                  key={`kw-positive-${index}`} 
                                  className="py-1 px-3" 
                                  style={{ 
                                    background: `${colors.orange.base}20`, 
                                    color: colors.text.dark, 
                                    border: `1px solid ${colors.orange.base}` 
                                  }}
                                >
                                  {phrase}
                                </Badge>
                              ))}
                              
                              {sentimentData.keyPhrases.neutral.map((phrase, index) => (
                                <Badge 
                                  key={`kw-neutral-${index}`} 
                                  className="py-1 px-3" 
                                  style={{ 
                                    background: `${colors.text.secondary}20`, 
                                    color: colors.text.dark, 
                                    border: `1px solid ${colors.text.secondary}` 
                                  }}
                                >
                                  {phrase}
                                </Badge>
                              ))}
                              
                              {sentimentData.keyPhrases.negative.map((phrase, index) => (
                                <Badge 
                                  key={`kw-negative-${index}`} 
                                  className="py-1 px-3" 
                                  style={{ 
                                    background: `${colors.accent.red}20`, 
                                    color: colors.text.dark, 
                                    border: `1px solid ${colors.accent.red}` 
                                  }}
                                >
                                  {phrase}
                                </Badge>
                              ))}
                              
                              {/* If no key phrases were found */}
                              {sentimentData.keyPhrases.positive.length === 0 && 
                               sentimentData.keyPhrases.neutral.length === 0 && 
                               sentimentData.keyPhrases.negative.length === 0 && (
                                <div className="text-center w-full p-2 text-sm" style={{ color: colors.text.secondary }}>
                                  No key phrases detected in the reviews
                                </div>
                              )}
                            </>
                          ) : (
                            // Fallback to static data when sentiment API data is not available
                            <>
                              <Badge className="py-1 px-3" style={{ background: `${colors.orange.base}20`, color: colors.text.dark, border: `1px solid ${colors.orange.base}` }}>excellent (24)</Badge>
                              <Badge className="py-1 px-3" style={{ background: `${colors.orange.base}20`, color: colors.text.dark, border: `1px solid ${colors.orange.base}` }}>friendly (18)</Badge>
                              <Badge className="py-1 px-3" style={{ background: `${colors.orange.base}20`, color: colors.text.dark, border: `1px solid ${colors.orange.base}` }}>helpful (16)</Badge>
                              <Badge className="py-1 px-3" style={{ background: `${colors.text.secondary}20`, color: colors.text.dark, border: `1px solid ${colors.text.secondary}` }}>average (10)</Badge>
                              <Badge className="py-1 px-3" style={{ background: `${colors.accent.red}20`, color: colors.text.dark, border: `1px solid ${colors.accent.red}` }}>expensive (8)</Badge>
                              <Badge className="py-1 px-3" style={{ background: `${colors.accent.red}20`, color: colors.text.dark, border: `1px solid ${colors.accent.red}` }}>slow (5)</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Review Requests Tab */}
        <TabsContent value="review-requests" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2" style={{ 
              background: colors.background.white,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: `1px solid ${colors.text.secondary}20`
            }}>
              <CardHeader>
                <CardTitle style={{ color: colors.text.dark }}>Review Requests</CardTitle>
                <CardDescription style={{ color: colors.text.dark }}>
                  Track the status of requests sent to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.orange.base }}></div>
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.text.secondary}20` }}>
                    <table className="min-w-full divide-y" style={{ borderColor: colors.text.secondary + '20' }}>
                      <thead style={{ background: colors.background.light }}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.dark }}>
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.dark }}>
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.dark }}>
                            Sent Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.dark }}>
                            Opened Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white" style={{ borderColor: colors.text.secondary + '10' }}>
                        {requestsData?.map((request) => (
                          <motion.tr 
                            key={request.id}
                            whileHover={{ 
                              backgroundColor: colors.background.light,
                              transition: { duration: 0.2 }
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium" style={{ color: colors.text.dark }}>{request.name}</div>
                              <div className="text-sm" style={{ color: colors.text.dark }}>{request.email}</div>
                              {request.phone && <div className="text-xs" style={{ color: colors.text.dark }}>{request.phone}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge style={{
                                background: request.status === 'responded' 
                                  ? colors.orange.base 
                                  : (request.status === 'failed' 
                                    ? colors.accent.red 
                                    : (request.status === 'opened' || request.status === 'clicked' 
                                      ? '#22C55E' // green color 
                                      : colors.text.secondary)),
                                color: request.status === 'sent' ? colors.text.dark : 'white'
                              }}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.text.dark }}>
                              <div className="flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {formatDate(request.sent_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.text.dark }}>
                              {request.opened_at ? (
                                <div className="flex items-center">
                                  <CheckIcon className="h-3 w-3 mr-1" style={{ color: '#22C55E' }} />
                                  {formatDate(request.opened_at)}
                                </div>
                              ) : '-'}
                            </td>
                          </motion.tr>
                        ))}
                        
                        {!requestsData?.length && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center" style={{ color: colors.text.dark }}>
                              No review requests found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card style={{ 
              background: colors.background.white,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: `1px solid ${colors.text.secondary}20`
            }}>
              <CardHeader>
                <CardTitle style={{ color: colors.text.dark }}>Send New Request</CardTitle>
                <CardDescription style={{ color: colors.text.dark }}>
                  Invite a customer to leave a review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name" style={{ color: colors.text.dark }}>Customer Name *</Label>
                    <Input 
                      id="customer-name"
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                      required
                      className="bg-white border-gray-200"
                      style={{ color: colors.text.dark }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer-email" style={{ color: colors.text.dark }}>Email Address *</Label>
                    <Input 
                      id="customer-email"
                      type="email"
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      required
                      className="bg-white border-gray-200"
                      style={{ color: colors.text.dark }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone" style={{ color: colors.text.dark }}>Phone Number (Optional)</Label>
                    <Input 
                      id="customer-phone"
                      value={requestPhone}
                      onChange={(e) => setRequestPhone(e.target.value)}
                      className="bg-white border-gray-200"
                      style={{ color: colors.text.dark }}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full hover:bg-[#F5A461] transition-colors"
                    disabled={sendRequestMutation.isPending}
                    style={{ 
                      backgroundColor: colors.orange.base,
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <SendIcon className="h-4 w-4 mr-2" />
                    {sendRequestMutation.isPending ? 'Sending...' : 'Send Request'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}