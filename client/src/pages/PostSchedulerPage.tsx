import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CalendarDaysIcon, ChevronLeft, ChevronRight, ChevronsUpDown, Clock, Edit2, MoreHorizontal, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { format, isToday, isPast, startOfToday, endOfDay, eachDayOfInterval, startOfWeek, endOfWeek, addWeeks, addMonths, addDays, startOfMonth, endOfMonth, isWithinInterval, isSameDay, parseISO, setHours, setMinutes, getHours, getMinutes } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocationContext } from '@/lib/location-context';

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

interface GBPLocation {
  id: number;
  name: string;
  address: string;
  user_id: number;
  location_id: string;
}

export default function PostSchedulerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { locationId: paramLocationId } = useParams<{ locationId: string }>();
  
  // Use the location context
  const { selectedLocationId, setSelectedLocationId, locations } = useLocationContext();
  
  // Determine which location ID to use
  const effectiveLocationId = paramLocationId || (selectedLocationId?.toString() || "1");
  
  // State for the calendar view
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day' | 'list'>('week');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [postToReschedule, setPostToReschedule] = useState<Post | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState<Date | null>(null);
  
  // Fetch posts for the selected location
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/posts', effectiveLocationId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/posts/${effectiveLocationId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load posts: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load posts');
        }
        
        return data.posts as Post[];
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
    },
    enabled: !!effectiveLocationId,
  });
  
  // Filter posts by status
  const scheduledPosts = data?.filter(post => post.status === "scheduled") || [];
  const publishedPosts = data?.filter(post => post.status === "published") || [];
  
  // Mutation for updating post status
  const updatePostStatusMutation = useMutation({
    mutationFn: async ({ postId, status }: { postId: number, status: 'published' | 'draft' }) => {
      const response = await fetch(`/api/posts/${effectiveLocationId}/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', effectiveLocationId] });
      toast({
        title: 'Success!',
        description: 'Post status updated successfully',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update post status',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for deleting posts
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/posts/${effectiveLocationId}/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', effectiveLocationId] });
      toast({
        title: 'Success!',
        description: 'Post deleted successfully',
        variant: 'default',
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for rescheduling posts
  const reschedulePostMutation = useMutation({
    mutationFn: async ({ postId, scheduledDate }: { postId: number, scheduledDate: string }) => {
      const response = await fetch(`/api/posts/${effectiveLocationId}/${postId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ scheduled_date: scheduledDate }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reschedule post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', effectiveLocationId] });
      toast({
        title: 'Success!',
        description: 'Post rescheduled successfully',
        variant: 'default',
      });
      setIsRescheduleDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reschedule post',
        variant: 'destructive',
      });
    },
  });
  
  // Get days for the current week view
  const getWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Week starts on Monday
    return eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 1 })
    });
  };
  
  // Get days for the current month view
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({
      start: monthStart,
      end: monthEnd
    });
  };
  
  // Get hour slots for day view
  const getDayHours = () => {
    // Create slots for all 24 hours
    return Array.from({ length: 24 }, (_, i) => {
      return setHours(currentDate, i);
    });
  };
  
  // Get posts for a specific day
  const getPostsForDay = (day: Date) => {
    return scheduledPosts.filter(post => {
      if (!post.scheduled_date) return false;
      try {
        const postDate = parseISO(post.scheduled_date);
        return isSameDay(postDate, day);
      } catch (error) {
        return false;
      }
    });
  };
  
  // Get posts for a specific hour
  const getPostsForHour = (hour: Date) => {
    return scheduledPosts.filter(post => {
      if (!post.scheduled_date) return false;
      try {
        const postDate = parseISO(post.scheduled_date);
        return isSameDay(postDate, currentDate) && getHours(postDate) === getHours(hour);
      } catch (error) {
        return false;
      }
    });
  };
  
  // Navigation handlers
  const goToPrevious = () => {
    if (activeView === 'month') {
      setCurrentDate(prev => addMonths(prev, -1));
    } else if (activeView === 'week') {
      setCurrentDate(prev => addWeeks(prev, -1));
    } else if (activeView === 'day') {
      setCurrentDate(prev => addDays(prev, -1));
    }
  };
  
  const goToNext = () => {
    if (activeView === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (activeView === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else if (activeView === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };
  
  // Handle post deletion
  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle post rescheduling
  const handleReschedulePost = (post: Post) => {
    setPostToReschedule(post);
    if (post.scheduled_date) {
      setNewScheduleDate(new Date(post.scheduled_date));
    } else {
      setNewScheduleDate(new Date());
    }
    setIsRescheduleDialogOpen(true);
  };
  
  // Handle post edit
  const handleEditPost = (post: Post) => {
    // Redirect to the post edit page
    window.location.href = `/client/posts/edit/${post.id}`;
  };
  
  // Handle confirm delete
  const confirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete.id);
    }
  };
  
  // Handle confirm reschedule
  const confirmReschedule = () => {
    if (postToReschedule && newScheduleDate) {
      reschedulePostMutation.mutate({
        postId: postToReschedule.id,
        scheduledDate: newScheduleDate.toISOString(),
      });
    }
  };
  
  // Handle location change
  const handleLocationChange = (value: string) => {
    setSelectedLocationId(parseInt(value));
    window.history.pushState(null, '', `/client/posts/scheduler/${value}`);
  };
  
  return (
    <div className="w-full pl-[70px] pr-[150px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">Post Scheduler</h1>
        <div className="flex gap-2">
          <Select
            value={effectiveLocationId.toString()}
            onValueChange={handleLocationChange}
          >
            <SelectTrigger className="w-[180px] bg-[#F28C38] hover:bg-[#F5A461] text-white">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations?.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline" 
            className="bg-gray-100 text-black hover:bg-gray-200"
            onClick={() => window.location.href = `/client/posts/${effectiveLocationId}`}
          >
            Create New Post
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scheduled">
            Scheduled Posts
          </TabsTrigger>
          <TabsTrigger value="published">
            Published Posts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scheduled">
          <Card className="bg-white text-black">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Scheduled Posts</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={`${activeView === 'list' ? 'bg-[#F28C38] text-white' : 'bg-gray-100 text-black'}`}
                    onClick={() => setActiveView('list')}
                  >
                    List
                  </Button>
                  <Select 
                    value={activeView !== 'list' ? activeView : 'week'} 
                    onValueChange={(value: 'month' | 'week' | 'day') => setActiveView(value)}
                    disabled={activeView === 'list'}
                  >
                    <SelectTrigger className="w-[150px] bg-[#F28C38] hover:bg-[#F5A461] text-white">
                      <SelectValue placeholder="Calendar View" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month View</SelectItem>
                      <SelectItem value="week">Week View</SelectItem>
                      <SelectItem value="day">Day View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                View and manage your scheduled posts
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-[#F28C38] border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading posts...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Error loading posts. Please try again.
                </div>
              ) : scheduledPosts.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-gray-500">No scheduled posts</p>
                  <Button
                    className="mt-4 bg-[#F28C38] hover:bg-[#F5A461] text-white"
                    onClick={() => window.location.href = `/client/posts/${effectiveLocationId}`}
                  >
                    Create a Post
                  </Button>
                </div>
              ) : activeView === 'list' ? (
                <div className="space-y-3">
                  {scheduledPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg border border-gray-200 gap-3"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-black">{post.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{post.content.substring(0, 60)}...</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-[#F28C38] text-white">
                            Scheduled
                          </Badge>
                          <Badge variant="outline" className="text-gray-600 border-gray-300">
                            <Calendar className="mr-1 h-3 w-3" />
                            {post.scheduled_date ? format(new Date(post.scheduled_date), 'MMM dd, yyyy') : 'Not scheduled'}
                          </Badge>
                          {post.category && (
                            <Badge variant="outline" className="border-[#F28C38] text-black">
                              {post.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPost(post)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReschedulePost(post)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeletePost(post)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      onClick={goToPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {activeView === 'month' ? 'Previous Month' : 
                       activeView === 'week' ? 'Previous Week' : 'Previous Day'}
                    </Button>
                    <h3 className="text-lg font-medium">
                      {activeView === 'month' ? format(currentDate, 'MMMM yyyy') :
                       activeView === 'week' ? `Week of ${format(getWeekDays()[0], 'MMM d')} - ${format(getWeekDays()[6], 'MMM d, yyyy')}` :
                       format(currentDate, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <Button
                      variant="ghost"
                      onClick={goToNext}
                    >
                      {activeView === 'month' ? 'Next Month' : 
                       activeView === 'week' ? 'Next Week' : 'Next Day'}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  {activeView === 'month' && (
                    <div className="border rounded-md overflow-hidden shadow-sm">
                      <div className="grid grid-cols-7">
                        {/* Month header for days of week */}
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <div key={day} className="py-3 px-2 text-center font-medium text-gray-700 bg-gray-100 border-b border-r last:border-r-0">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Month days grid */}
                      <div className="grid grid-cols-7">
                        {getMonthDays().map((day, index) => (
                          <div key={index} className="border-b border-r last:border-r-0 min-h-[120px] relative">
                            <div 
                              className={`py-2 px-3 ${
                                isToday(day) 
                                  ? 'bg-[#F28C38] text-white' 
                                  : isPast(day) ? 'bg-gray-50' : 'bg-white'
                              }`}
                            >
                              <div className="font-bold text-lg">{format(day, 'd')}</div>
                              <div className="text-xs">{format(day, 'EEE')}</div>
                            </div>
                            
                            <div className="p-1 overflow-y-auto max-h-[80px]">
                              {getPostsForDay(day).map(post => (
                                <div 
                                  key={post.id} 
                                  className="mb-1 px-2 py-1 bg-[#F9E4D1] hover:bg-[#F5A461] transition-colors rounded text-sm shadow-sm cursor-pointer"
                                  onClick={() => handleEditPost(post)}
                                >
                                  <div className="font-medium truncate">{post.title}</div>
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {post.scheduled_date && format(new Date(post.scheduled_date), 'h:mm a')}
                                  </div>
                                </div>
                              ))}
                              
                              {getPostsForDay(day).length === 0 && !isPast(day) && (
                                <div 
                                  className="flex justify-center items-center h-10 opacity-0 hover:opacity-100 transition-opacity"
                                  onClick={() => window.location.href = `/client/posts/${effectiveLocationId}`}
                                >
                                  <div className="text-xs text-gray-400 cursor-pointer hover:text-[#F28C38] transition-colors">+ Add post</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeView === 'week' && (
                    <div className="border rounded-md overflow-hidden shadow-sm">
                      <div className="grid grid-cols-7">
                        {/* Week header */}
                        {getWeekDays().map((day, index) => (
                          <div 
                            key={index} 
                            className={`py-3 px-4 text-center border-b border-r last:border-r-0 ${
                              isToday(day) ? 'bg-[#F28C38] text-white' : 'bg-gray-100'
                            }`}
                          >
                            <div className="text-sm font-medium">{format(day, 'EEEE')}</div>
                            <div className="text-xl font-bold mt-1">{format(day, 'd')}</div>
                            <div className="text-xs mt-1 opacity-80">{format(day, 'MMMM')}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Week grid with hours */}
                      <div className="grid grid-cols-7 divide-x relative">
                        {/* Time indicators (left column) */}
                        <div className="absolute left-0 top-0 w-full h-full">
                          {Array.from({ length: 12 }, (_, i) => (
                            <div key={i} className="border-t h-20 relative">
                              <div className="absolute -top-2.5 -left-8 w-8 text-right text-xs text-gray-500">
                                {format(setHours(currentDate, i + 8), 'h a')}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Days columns */}
                        {getWeekDays().map((day, dayIndex) => (
                          <div key={dayIndex} className="min-h-[480px] relative"> {/* 12 hours * 40px = 480px */}
                            {/* Empty state with hover interaction */}
                            {getPostsForDay(day).length === 0 && !isPast(day) && (
                              <div 
                                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
                                onClick={() => window.location.href = `/client/posts/${effectiveLocationId}`}
                              >
                                <div className="bg-gray-50 hover:bg-[#F9E4D1] transition-colors rounded-full p-2 shadow-sm">
                                  <Plus className="h-6 w-6 text-gray-500 hover:text-[#F28C38]" />
                                </div>
                              </div>
                            )}
                            
                            {/* Posts for this day positioned by time */}
                            {getPostsForDay(day).map(post => {
                              const postDate = new Date(post.scheduled_date || '');
                              const hours = getHours(postDate);
                              const minutes = getMinutes(postDate);
                              const top = ((hours - 8) * 60 + minutes) * (20/60); // 20px per hour, offset by 8 (8am)
                              
                              return (
                                <div 
                                  key={post.id} 
                                  className="absolute left-1 right-1 bg-[#F9E4D1] hover:bg-[#F5A461] px-2 py-1 rounded shadow-sm transition-colors z-20 cursor-pointer overflow-hidden"
                                  style={{ 
                                    top: `${top}px`, 
                                    minHeight: '40px',
                                    maxHeight: '60px'
                                  }}
                                  onClick={() => handleEditPost(post)}
                                >
                                  <div className="font-medium text-sm truncate">{post.title}</div>
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {post.scheduled_date && format(new Date(post.scheduled_date), 'h:mm a')}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeView === 'day' && (
                    <div className="border rounded-md shadow-sm overflow-hidden">
                      <div className="p-4 bg-[#F28C38] text-white border-b">
                        <h3 className="text-xl font-bold">{format(currentDate, 'EEEE')}</h3>
                        <p className="text-sm opacity-90">{format(currentDate, 'MMMM d, yyyy')}</p>
                      </div>
                      
                      <div className="flex">
                        {/* Time column */}
                        <div className="w-24 bg-gray-50 border-r">
                          <div className="h-12 border-b flex items-end justify-center pb-1">
                            <span className="text-xs font-medium text-gray-500">TIME</span>
                          </div>
                          {getDayHours().map((hour, index) => (
                            <div key={index} className="h-24 border-b flex items-center justify-center">
                              <div className="text-sm text-gray-600 font-medium">
                                {format(hour, 'h:mm a')}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Schedule column */}
                        <div className="flex-1 relative">
                          <div className="h-12 border-b flex items-end px-4 pb-1 bg-gray-100">
                            <span className="text-sm font-medium text-gray-700">SCHEDULE</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-auto text-[#F28C38] hover:text-[#F5A461] hover:bg-transparent"
                              onClick={() => window.location.href = `/client/posts/${effectiveLocationId}`}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              New Post
                            </Button>
                          </div>
                          
                          {/* Gridlines */}
                          <div className="absolute inset-0 top-12 pointer-events-none">
                            {getDayHours().map((_, index) => (
                              <div key={index} className="border-b h-24"></div>
                            ))}
                          </div>
                          
                          {/* Current time indicator */}
                          {isSameDay(currentDate, new Date()) && (
                            <div 
                              className="absolute left-0 right-0 border-t-2 border-red-500 z-10 flex items-center"
                              style={{ 
                                top: `${12 + (getHours(new Date()) * 60 + getMinutes(new Date())) * (24/60)}px` 
                              }}
                            >
                              <div className="w-2 h-2 rounded-full bg-red-500 -mt-1 ml-4"></div>
                              <div className="text-xs text-red-500 ml-1">{format(new Date(), 'h:mm a')}</div>
                            </div>
                          )}
                          
                          {/* Posts */}
                          <div className="relative min-h-[576px]"> {/* 24 hours * 24px = 576px */}
                            {getDayHours().map((hour) => (
                              getPostsForHour(hour).map(post => {
                                const postDate = new Date(post.scheduled_date || '');
                                const minutes = getMinutes(postDate);
                                const top = minutes * (24/60); // position within the hour slot
                                
                                return (
                                  <div 
                                    key={post.id} 
                                    className="absolute left-2 right-2 bg-[#F9E4D1] hover:bg-[#F5A461] rounded px-3 py-2 shadow-sm transition-colors z-20 cursor-pointer"
                                    style={{ 
                                      top: `${12 + (getHours(postDate) * 24) + top}px`, 
                                      minHeight: '40px'
                                    }}
                                    onClick={() => handleEditPost(post)}
                                  >
                                    <div className="font-medium">{post.title}</div>
                                    <div className="flex items-center text-xs text-gray-600 mt-1">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {format(postDate, 'h:mm a')}
                                    </div>
                                  </div>
                                );
                              })
                            ))}
                            
                            {/* No posts indicator */}
                            {!getDayHours().some(hour => getPostsForHour(hour).length > 0) && (
                              <div className="flex items-center justify-center h-full text-gray-400 italic">
                                No posts scheduled for this day
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="published">
          <Card className="bg-white text-black">
            <CardHeader className="pb-3">
              <CardTitle>Published Posts</CardTitle>
              <CardDescription>
                View your published posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-[#F28C38] border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading posts...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Error loading posts. Please try again.
                </div>
              ) : publishedPosts.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-gray-500">No published posts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg border border-gray-200 gap-3"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-black">{post.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{post.content.substring(0, 60)}...</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-green-500 text-white">
                            Published
                          </Badge>
                          <Badge variant="outline" className="text-gray-600 border-gray-300">
                            <Calendar className="mr-1 h-3 w-3" />
                            {post.published_at ? format(new Date(post.published_at), 'MMM dd, yyyy') : 'Unknown date'}
                          </Badge>
                          {post.category && (
                            <Badge variant="outline" className="border-[#F28C38] text-black">
                              {post.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Post Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {postToDelete && (
              <div className="bg-gray-100 p-3 rounded-md">
                <h4 className="font-medium">{postToDelete.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{postToDelete.content.substring(0, 100)}...</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reschedule Post Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Post</DialogTitle>
            <DialogDescription>
              Select a new date and time for your post.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {postToReschedule && (
              <div className="bg-gray-100 p-3 rounded-md">
                <h4 className="font-medium">{postToReschedule.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{postToReschedule.content.substring(0, 60)}...</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">New Schedule Date</label>
              <input
                type="datetime-local"
                value={newScheduleDate ? format(newScheduleDate, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => setNewScheduleDate(new Date(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRescheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#F28C38] hover:bg-[#F5A461] text-white"
              onClick={confirmReschedule}
              disabled={!newScheduleDate}
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}