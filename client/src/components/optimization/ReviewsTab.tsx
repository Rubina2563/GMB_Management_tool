/**
 * ReviewsTab Component
 * 
 * Displays review analysis, prioritizes reviews that need attention,
 * and generates suggested responses using NLP.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StableDialog, StableDialogContent } from "@/components/ui/stable-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRightCircle,
  Clock,
  Copy,
  MessageSquare,
  RefreshCw,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

// Types for the component data
interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  reply?: string;
  reply_timestamp?: Date;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  sentiment: {
    score: number;
    magnitude: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  themes: string[];
  has_response: boolean;
  response_suggestion?: string;
}

interface ReviewAnalysis {
  score: number;
  reviews: Review[];
  recommendations: string[];
  priority_reviews: Review[];
  sentiment_summary: {
    positive: number;
    negative: number;
    neutral: number;
    average_rating: number;
  };
  common_themes: {
    theme: string;
    count: number;
    sentiment: number;
  }[];
}

interface ReviewsTabProps {
  locationId: number;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ locationId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for selected review and response
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'priority' | 'all' | 'sentiment'>('priority');
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  // Fetch review analysis data from the API
  const { data: reviewAnalysis, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['review-analysis', locationId],
    queryFn: async () => {
      const response = await fetch(`/api/client/reviews/analyze/${locationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch review analysis');
      }

      const data = await response.json();
      return data.data as ReviewAnalysis;
    },
  });

  // Mutation for generating a response suggestion
  const generateResponseMutation = useMutation({
    mutationFn: async ({
      reviewId,
      reviewText,
      reviewerName,
      rating,
    }: {
      reviewId: string;
      reviewText: string;
      reviewerName: string;
      rating: number;
    }) => {
      const response = await fetch('/api/client/reviews/suggest-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reviewId,
          reviewText,
          reviewerName,
          rating,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate response suggestion');
      }

      const data = await response.json();
      return data.suggestion;
    },
    onSuccess: (data) => {
      setResponseText(data);
      toast({
        title: 'Response Generated',
        description: 'A suggested response has been generated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to generate response: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle opening the response dialog
  const handleOpenResponseDialog = (review: Review) => {
    setSelectedReview(review);
    setResponseText(review.response_suggestion || '');
    setIsDialogOpen(true);
  };

  // Handle generate response
  const handleGenerateResponse = () => {
    if (!selectedReview) return;

    generateResponseMutation.mutate({
      reviewId: selectedReview.id,
      reviewText: selectedReview.comment,
      reviewerName: selectedReview.reviewer_name,
      rating: selectedReview.rating,
    });
  };

  // Handle copy response to clipboard
  const handleCopyResponse = () => {
    if (!selectedReview) return;
    
    navigator.clipboard.writeText(responseText).then(
      () => {
        if (selectedReview) {
          setCopyStatus({
            ...copyStatus,
            [selectedReview.id]: true,
          });
          
          toast({
            title: 'Copied!',
            description: 'Response copied to clipboard',
          });
          
          // Reset copy status after 3 seconds
          setTimeout(() => {
            setCopyStatus({
              ...copyStatus,
              [selectedReview.id]: false,
            });
          }, 3000);
        }
      },
      (err) => {
        toast({
          title: 'Error',
          description: 'Failed to copy text: ' + err,
          variant: 'destructive',
        });
      }
    );
  };

  // Format date
  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? "fill-orange-400 text-orange-400" : "text-gray-300"}
            fill={i < rating ? "currentColor" : "none"}
          />
        ))}
      </div>
    );
  };

  // Get sentiment color
  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'bg-green-100 text-black border-green-300';
      case 'negative':
        return 'bg-red-100 text-black border-red-300';
      default:
        return 'bg-gray-100 text-black border-gray-300';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-black border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-black border-yellow-300';
      case 'low':
        return 'bg-green-100 text-black border-green-300';
      default:
        return 'bg-gray-100 text-black border-gray-300';
    }
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // If error, show error message
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load review analysis: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate optimization percentage
  // Ensure score is between 0 and 1 before multiplying by 100
  const completionPercentage = reviewAnalysis?.score 
    ? Math.min(100, Math.max(0, Math.round(reviewAnalysis.score * 100))) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Optimization Score Card */}
      <Card className="bg-white">
        <CardHeader className="pb-2 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg text-black">Reviews Optimization</CardTitle>
              <CardDescription className="text-black">Overall progress</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-black">{completionPercentage}%</div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-100">
              <MessageSquare className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sentiment Summary */}
        <Card className="bg-white">
          <CardHeader className="pb-2 bg-white">
            <CardTitle className="text-lg text-black">Sentiment Analysis</CardTitle>
            <CardDescription className="text-black">Review sentiment breakdown</CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black">Positive</span>
                  <span className="text-sm text-black">{reviewAnalysis?.sentiment_summary.positive}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${reviewAnalysis?.sentiment_summary.positive}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black">Neutral</span>
                  <span className="text-sm text-black">{reviewAnalysis?.sentiment_summary.neutral}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-500 rounded-full"
                    style={{ width: `${reviewAnalysis?.sentiment_summary.neutral}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black">Negative</span>
                  <span className="text-sm text-black">{reviewAnalysis?.sentiment_summary.negative}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${reviewAnalysis?.sentiment_summary.negative}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Reviews */}
        <Card className="bg-white">
          <CardHeader className="pb-2 bg-white">
            <CardTitle className="text-lg text-black">Priority Reviews</CardTitle>
            <CardDescription className="text-black">Reviews needing attention</CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-black">{reviewAnalysis?.priority_reviews.length || 0}</div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {reviewAnalysis?.priority_reviews.slice(0, 2).map((review) => (
                <div key={review.id} className="flex items-center gap-2">
                  <Badge variant="outline" className={getPriorityColor(review.priority)}>
                    {review.priority}
                  </Badge>
                  <span className="text-sm truncate text-black">{review.reviewer_name}</span>
                  <div className="ml-auto">{renderStars(review.rating)}</div>
                </div>
              ))}
              {(reviewAnalysis?.priority_reviews.length || 0) > 2 && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-orange-500"
                  onClick={() => setActiveTab('priority')}
                >
                  View all priority reviews
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {reviewAnalysis && reviewAnalysis.recommendations.length > 0 && (
          <Card className="bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-lg text-black">Recommendations to Improve Reviews</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <ul className="list-disc pl-5 space-y-2">
                {reviewAnalysis.recommendations.map((recommendation, i) => (
                  <li key={i} className="text-black">{recommendation}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Common Themes */}
        {reviewAnalysis && reviewAnalysis.common_themes.length > 0 && (
          <Card className={`bg-white ${reviewAnalysis.recommendations.length === 0 ? "" : "md:col-span-2"}`}>
            <CardHeader className="bg-white">
              <CardTitle className="text-lg text-black">Common Themes in Reviews</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="space-y-3">
                {reviewAnalysis.common_themes.map((theme, i) => (
                  <div 
                    key={i} 
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: theme.sentiment > 0.2 ? '#f0fdf4' : 
                                      theme.sentiment < -0.2 ? '#fef2f2' : '#f9fafb',
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-black">{theme.theme}</span>
                      <Badge variant="outline" className="ml-2">
                        {theme.count} mentions
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center">
                      {theme.sentiment > 0.2 ? (
                        <ThumbsUp className="h-4 w-4 text-green-500 mr-2" />
                      ) : theme.sentiment < -0.2 ? (
                        <ThumbsDown className="h-4 w-4 text-red-500 mr-2" />
                      ) : (
                        <div className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-sm text-black">
                        {theme.sentiment > 0.2
                          ? 'Positive sentiment'
                          : theme.sentiment < -0.2
                          ? 'Negative sentiment'
                          : 'Neutral sentiment'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviews Listing */}
      <Card className="bg-white">
        <CardHeader className="bg-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-black">Reviews</CardTitle>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'priority' | 'all' | 'sentiment')}>
            <TabsList className="grid w-full grid-cols-3 border border-gray-300">
              <TabsTrigger value="priority" className="text-black data-[state=active]:bg-[#F28C38] data-[state=active]:text-black">
                Priority
              </TabsTrigger>
              <TabsTrigger value="all" className="text-black data-[state=active]:bg-[#F28C38] data-[state=active]:text-black">
                All Reviews
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="text-black data-[state=active]:bg-[#F28C38] data-[state=active]:text-black">
                By Sentiment
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="bg-white">
          {activeTab === 'priority' && (
            <div className="space-y-4">
              {reviewAnalysis?.priority_reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-black mb-1">No Priority Reviews</h3>
                  <p className="text-sm text-black">
                    Great job! You don't have any priority reviews that need attention.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewAnalysis?.priority_reviews.map((review) => (
                    <Card key={review.id} className="border-l-4 bg-white" style={{ borderLeftColor: 
                      review.priority === 'high' ? '#ef4444' : 
                      review.priority === 'medium' ? '#f59e0b' : 
                      '#22c55e' 
                    }}>
                      <CardHeader className="pb-2 bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-black">{review.reviewer_name}</span>
                            <Badge variant="outline" className={getPriorityColor(review.priority)}>
                              {review.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-black">{formatDate(review.timestamp)}</span>
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 bg-white">
                        <p className="text-black">{review.comment}</p>
                        {review.themes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {review.themes.map((theme, i) => (
                              <Badge 
                                key={i} 
                                variant="outline" 
                                className={`text-black border-gray-300 ${
                                  // Alternate colors for theme badges
                                  i % 4 === 0 ? 'bg-blue-100' : 
                                  i % 4 === 1 ? 'bg-purple-100' : 
                                  i % 4 === 2 ? 'bg-amber-100' : 
                                  'bg-teal-100'
                                }`}
                              >
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-between">
                        <Badge variant="outline" className={getSentimentColor(review.sentiment.label)}>
                          {review.sentiment.label.charAt(0).toUpperCase() + review.sentiment.label.slice(1)}
                        </Badge>
                        <Button
                          variant="default"
                          className="bg-[#F28C38] hover:bg-[#FB923C]"
                          onClick={() => handleOpenResponseDialog(review)}
                        >
                          Generate Response
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'all' && (
            <div className="space-y-4">
              {reviewAnalysis?.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-black mb-1">No Reviews</h3>
                  <p className="text-sm text-black">
                    You don't have any reviews yet. Reviews will appear here once customers provide feedback.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black">Reviewer</TableHead>
                      <TableHead className="text-black">Rating</TableHead>
                      <TableHead className="text-black">Date</TableHead>
                      <TableHead className="text-black">Comment</TableHead>
                      <TableHead className="text-black">Status</TableHead>
                      <TableHead className="text-black text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewAnalysis?.reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium text-black">{review.reviewer_name}</TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell className="text-black">{formatDate(review.timestamp)}</TableCell>
                        <TableCell className="max-w-xs truncate text-black">{review.comment}</TableCell>
                        <TableCell>
                          {review.has_response ? (
                            <Badge variant="outline" className="bg-green-100 text-black border-green-300">
                              Responded
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={getPriorityColor(review.priority)}>
                              {review.priority}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#F28C38] border-[#F28C38]"
                            onClick={() => handleOpenResponseDialog(review)}
                          >
                            {review.has_response ? 'View Response' : 'Generate Response'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
          
          {activeTab === 'sentiment' && (
            <div className="space-y-8">
              {/* Positive Reviews */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-black flex items-center">
                  <ThumbsUp className="h-5 w-5 mr-2 text-green-500" />
                  Positive Reviews
                </h3>
                {reviewAnalysis?.reviews.filter(r => r.sentiment.label === 'positive').length === 0 ? (
                  <p className="text-sm text-black italic">No positive reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviewAnalysis?.reviews
                      .filter(r => r.sentiment.label === 'positive')
                      .map((review) => (
                        <Card key={review.id} className="border-l-4 border-l-green-500 bg-white">
                          <CardHeader className="pb-2 bg-white">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-black">{review.reviewer_name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-black">{formatDate(review.timestamp)}</span>
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="bg-white">
                            <p className="text-black">{review.comment}</p>
                          </CardContent>
                          <CardFooter className="justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#F28C38] border-[#F28C38]"
                              onClick={() => handleOpenResponseDialog(review)}
                            >
                              {review.has_response ? 'View Response' : 'Generate Response'}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    }
                  </div>
                )}
              </div>
              
              {/* Negative Reviews */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-black flex items-center">
                  <ThumbsDown className="h-5 w-5 mr-2 text-red-500" />
                  Negative Reviews
                </h3>
                {reviewAnalysis?.reviews.filter(r => r.sentiment.label === 'negative').length === 0 ? (
                  <p className="text-sm text-black italic">No negative reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviewAnalysis?.reviews
                      .filter(r => r.sentiment.label === 'negative')
                      .map((review) => (
                        <Card key={review.id} className="border-l-4 border-l-red-500 bg-white">
                          <CardHeader className="pb-2 bg-white">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-black">{review.reviewer_name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-black">{formatDate(review.timestamp)}</span>
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="bg-white">
                            <p className="text-black">{review.comment}</p>
                          </CardContent>
                          <CardFooter className="justify-end">
                            <Button
                              variant="default"
                              className="bg-[#F28C38] hover:bg-[#FB923C] text-white"
                              onClick={() => handleOpenResponseDialog(review)}
                            >
                              {review.has_response ? 'View Response' : 'Generate Response'}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    }
                  </div>
                )}
              </div>
              
              {/* Neutral Reviews */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-black flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  Neutral Reviews
                </h3>
                {reviewAnalysis?.reviews.filter(r => r.sentiment.label === 'neutral').length === 0 ? (
                  <p className="text-sm text-black italic">No neutral reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviewAnalysis?.reviews
                      .filter(r => r.sentiment.label === 'neutral')
                      .map((review) => (
                        <Card key={review.id} className="border-l-4 border-l-gray-400 bg-white">
                          <CardHeader className="pb-2 bg-white">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-black">{review.reviewer_name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-black">{formatDate(review.timestamp)}</span>
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="bg-white">
                            <p className="text-black">{review.comment}</p>
                          </CardContent>
                          <CardFooter className="justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#F28C38] border-[#F28C38]"
                              onClick={() => handleOpenResponseDialog(review)}
                            >
                              {review.has_response ? 'View Response' : 'Generate Response'}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <StableDialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDialogOpen(false);
          setResponseText('');
          setSelectedReview(null);
        }
      }}>
        <StableDialogContent className="sm:max-w-[550px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">{selectedReview?.has_response ? 'Review Response' : 'Generate Response'}</DialogTitle>
            <DialogDescription className="text-black">
              {selectedReview?.has_response
                ? 'This review has already been responded to. You can view the previous response below.'
                : 'Create a response to this review. You can use AI to generate a suggested response.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="my-4 p-4 bg-white border border-gray-200 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-black">{selectedReview.reviewer_name}</span>
                <div>{renderStars(selectedReview.rating)}</div>
              </div>
              <p className="text-black">{selectedReview.comment}</p>
              <div className="mt-2 flex justify-between items-center">
                <Badge variant="outline" className={getSentimentColor(selectedReview.sentiment.label)}>
                  {selectedReview.sentiment.label.charAt(0).toUpperCase() + selectedReview.sentiment.label.slice(1)}
                </Badge>
                <span className="text-sm text-black">{formatDate(selectedReview.timestamp)}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter your response..."
              className="min-h-[150px] bg-white text-black border-gray-200"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!selectedReview?.has_response && (
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 border-[#F28C38] text-[#F28C38] bg-white"
                onClick={handleGenerateResponse}
                disabled={generateResponseMutation.isPending}
              >
                {generateResponseMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightCircle className="h-4 w-4" />
                    <span>Generate with AI</span>
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 bg-white text-black"
              onClick={handleCopyResponse}
            >
              <Copy className="h-4 w-4" />
              <span>{copyStatus[selectedReview?.id || ''] ? 'Copied!' : 'Copy to Clipboard'}</span>
            </Button>
            <Button
              type="button"
              variant="default"
              className="bg-[#F28C38] hover:bg-[#FB923C] text-white"
              onClick={() => {
                setIsDialogOpen(false);
                setResponseText('');
                setSelectedReview(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </StableDialogContent>
      </StableDialog>
    </div>
  );
};

export default ReviewsTab;