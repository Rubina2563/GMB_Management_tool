import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  FilterIcon,
  SortAscIcon,
  SendIcon, 
  MailIcon,
  ClockIcon,
  CheckIcon,
  XCircleIcon,
  RefreshCcwIcon,
  UserIcon,
  PhoneIcon,
  MailOpenIcon,
  CheckCircleIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  CreditCardIcon,
  ClipboardIcon
} from "lucide-react";
import { colors } from "@/lib/colors";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { TemplateVariables } from '@/components/TemplateVariables';

interface ReviewRequest {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'sent' | 'opened' | 'clicked' | 'responded' | 'failed';
  sent_at: string;
  opened_at?: string;
}

export default function RequestReviewsPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract locationId from the URL
  // In a real app this would be from the route params
  // For now we'll use a hardcoded value
  const locationId = "location_123"; // Mock location ID
  
  const [activeTab, setActiveTab] = useState<string>("new-request");
  const [sortBy, setSortBy] = useState<string>("date");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // For review request form
  const [requestName, setRequestName] = useState<string>("");
  const [requestEmail, setRequestEmail] = useState<string>("");
  const [requestPhone, setRequestPhone] = useState<string>("");
  const [requestMessage, setRequestMessage] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  
  // Handle template selection
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    
    // Update the message based on the template
    if (value === 'default') {
      setRequestMessage("Thank you for choosing our business. We'd love to hear about your experience!");
    } else if (value === 'follow-up') {
      setRequestMessage("We hope you've been well since your recent visit. We'd appreciate your feedback when you have a moment.");
    }
  };
  
  // For template management
  const [showNewTemplateModal, setShowNewTemplateModal] = useState<boolean>(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState<boolean>(false);
  const [editTemplate, setEditTemplate] = useState<{
    id: string;
    name: string;
    subject: string;
    body: string;
  } | null>(null);
  
  // For form management
  const [showNewFormModal, setShowNewFormModal] = useState<boolean>(false);
  const [showEditFormModal, setShowEditFormModal] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
  } | null>(null);
  
  // Helper for field type icons
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <UserIcon className="h-4 w-4 text-blue-500" />;
      case 'email':
        return <MailIcon className="h-4 w-4 text-purple-500" />;
      case 'tel':
        return <PhoneIcon className="h-4 w-4 text-green-500" />;
      case 'date':
        return <ClockIcon className="h-4 w-4 text-orange-500" />;
      case 'select':
        return <CheckIcon className="h-4 w-4 text-indigo-500" />;
      case 'rating':
        return <div className="text-yellow-500 text-lg">★</div>;
      case 'textarea':
        return <div className="text-gray-500 h-4 w-4">¶</div>;
      default:
        return <div className="h-4 w-4 border border-gray-300 rounded-sm"></div>;
    }
  };
  
  // Helper for field type names
  const getFieldTypeName = (type: string) => {
    switch (type) {
      case 'text':
        return 'Text Field';
      case 'email':
        return 'Email Address';
      case 'tel':
        return 'Phone Number';
      case 'date':
        return 'Date Picker';
      case 'select':
        return 'Dropdown';
      case 'rating':
        return 'Star Rating';
      case 'textarea':
        return 'Text Area';
      default:
        return type;
    }
  };
  
  // Mock credit count for display
  const credits = 50;
  
  // Fetch review requests
  const {
    data: requestsData,
    isLoading: requestsLoading
  } = useQuery({
    queryKey: ['/api/reviews/requests', locationId, sortBy, filterStatus],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (filterStatus && filterStatus !== 'all') queryParams.append('filterStatus', filterStatus);
      
      const response = await fetch(`/api/reviews/${locationId}/requests?${queryParams.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch review requests');
      }
      
      const data = await response.json();
      return data.requests as ReviewRequest[];
    }
  });
  
  // Send review request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (requestData: { name: string, email: string, phone?: string, message?: string }) => {
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
      setRequestMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send review request",
        variant: "destructive",
      });
    }
  });
  
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
      phone: requestPhone || undefined,
      message: requestMessage || undefined
    });
  };
  
  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
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
  
  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'opened':
        return <Badge className="bg-yellow-100 text-yellow-800">Opened</Badge>;
      case 'clicked':
        return <Badge className="bg-purple-100 text-purple-800">Clicked</Badge>;
      case 'responded':
        return <Badge className="bg-green-100 text-green-800">Responded</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <SendIcon className="h-4 w-4 text-blue-500" />;
      case 'opened':
        return <MailOpenIcon className="h-4 w-4 text-yellow-500" />;
      case 'clicked':
        return <MailIcon className="h-4 w-4 text-purple-500" />;
      case 'responded':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="w-full pl-[70px] pr-[150px] py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.text.dark }}>Request Reviews</h1>
      </div>
      
      <Tabs defaultValue="new-request" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="new-request">
            New Request
          </TabsTrigger>
          <TabsTrigger value="history">
            Request History
          </TabsTrigger>
          <TabsTrigger value="templates">
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="settings">
            Request Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-request" className="mt-0">
          <Card className="bg-white text-black border border-gray-200">
            <CardHeader>
              <CardTitle className="text-black">Send Review Request</CardTitle>
              <CardDescription className="text-gray-600">
                Send an email inviting a customer to leave a review for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendRequest} className="space-y-4">
                <div className="space-y-4 mb-4">
                  <div className="space-y-2">
                    <Label>Email Template</Label>
                    <Select 
                      value={selectedTemplate} 
                      onValueChange={handleTemplateChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select email template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Template</SelectItem>
                        <SelectItem value="follow-up">Follow-up Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Preview Template</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          // Find the template to edit
                          let templateToEdit;
                          if (selectedTemplate === 'default') {
                            templateToEdit = {
                              id: 'default',
                              name: 'Default Template',
                              subject: "We'd love to hear about your experience!",
                              body: `Hello [Customer Name],

Thank you for choosing [Business Name]. We hope you had a great experience with us!

We'd appreciate it if you could take a moment to share your feedback. Your review helps us improve our service and helps other potential customers make informed decisions.

Thank you for your time!

Best regards,
[Business Name] Team`
                            };
                          } else if (selectedTemplate === 'follow-up') {
                            templateToEdit = {
                              id: 'follow-up',
                              name: 'Follow-up Template',
                              subject: "Following up on your recent visit",
                              body: `Hello [Customer Name],

We hope you've been well since your recent visit to [Business Name].

If you haven't had a chance yet, we'd still love to hear your feedback about your experience with us. Your review would be incredibly helpful for our team and future customers.

Thank you for considering!

Best regards,
[Business Name] Team`
                            };
                          }
                          
                          if (templateToEdit) {
                            setEditTemplate(templateToEdit);
                            setShowEditTemplateModal(true);
                            setActiveTab("templates");
                          }
                        }}
                      >
                        Customize Template
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-600 border border-gray-200 rounded p-2 bg-white">
                      <strong>Subject:</strong> {selectedTemplate === 'default' ? "We'd love to hear about your experience!" : "Following up on your recent visit"}
                      <div className="mt-2">
                        <p>Hello <span className="text-blue-500">[Customer Name]</span>,</p>
                        <br/>
                        <p>{selectedTemplate === 'default' 
                          ? `Thank you for choosing [Business Name]. We hope you had a great experience with us!` 
                          : `We hope you've been well since your recent visit to [Business Name].`}</p>
                        <br/>
                        <p>{selectedTemplate === 'default' 
                          ? `We'd appreciate it if you could take a moment to share your feedback. Your review helps us improve our service and helps other potential customers make informed decisions.` 
                          : `If you haven't had a chance yet, we'd still love to hear your feedback about your experience with us. Your review would be incredibly helpful for our team and future customers.`}</p>
                        <br/>
                        <p>{selectedTemplate === 'default' ? "Thank you for your time!" : "Thank you for considering!"}</p>
                        <br/>
                        <p>Best regards,<br/>[Business Name] Team</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Customer Name <span className="text-red-500">*</span></Label>
                    <Input 
                      id="name"
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input 
                      id="email"
                      type="email"
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input 
                    id="phone"
                    type="tel"
                    value={requestPhone}
                    onChange={(e) => setRequestPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message (Optional)</Label>
                  <Textarea 
                    id="message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Add a personalized message to your review request email"
                    rows={4}
                    className="bg-white text-black border-gray-300"
                  />
                </div>
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    style={{ backgroundColor: colors.orange.base, color: 'white' }}
                    className="hover:bg-[#F5A461]"
                    disabled={sendRequestMutation.isPending}
                  >
                    {sendRequestMutation.isPending ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Send Review Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <FilterIcon className="h-4 w-4 text-gray-500" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="clicked">Clicked</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              style={{ backgroundColor: colors.orange.base, color: 'white' }}
              className="hover:bg-[#F5A461]"
              onClick={() => setActiveTab("new-request")}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
          
          {requestsLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
          ) : !requestsData || requestsData.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-24 w-24 text-black opacity-20">
                <MailIcon className="h-full w-full" />
              </div>
              <h3 className="text-xl font-medium text-black mb-2">No Review Requests Yet</h3>
              <p className="text-black mb-6">
                You haven't sent any review requests yet. Use the "New Request" tab to invite your customers to leave reviews.
              </p>
              <Button
                style={{ backgroundColor: colors.orange.base, color: 'white' }}
                className="hover:bg-[#F5A461]"
                onClick={() => setActiveTab("new-request")}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Send Your First Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requestsData?.map((request) => (
                <Card key={request.id} className="overflow-hidden bg-white text-black border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-white rounded-full border border-gray-200">
                          {getStatusIcon(request.status)}
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-1">
                            <h3 className="font-semibold mr-2">{request.name}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="flex items-center text-sm text-black mb-1">
                            <MailIcon className="h-3.5 w-3.5 mr-1" />
                            <span>{request.email}</span>
                          </div>
                          
                          {request.phone && (
                            <div className="flex items-center text-sm text-black mb-1">
                              <PhoneIcon className="h-3.5 w-3.5 mr-1" />
                              <span>{request.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-xs text-black mt-1">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            <span>Sent: {formatDate(request.sent_at)}</span>
                            
                            {request.opened_at && (
                              <span className="ml-3">
                                <MailOpenIcon className="h-3 w-3 inline mr-1" />
                                Opened: {formatDate(request.opened_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          style={{ backgroundColor: colors.orange.base, color: 'white' }}
                          className="hover:bg-[#F5A461]"
                          onClick={() => {
                            toast({
                              title: "Request Resent",
                              description: `Review request has been resent to ${request.name}.`
                            });
                          }}
                        >
                          <RefreshCcwIcon className="h-3.5 w-3.5 mr-1" />
                          Resend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="templates" className="mt-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-medium text-black">Email Templates</h3>
              <p className="text-sm text-gray-600">
                Configure and manage your review request email templates
              </p>
            </div>
            <Button
              style={{ backgroundColor: colors.orange.base, color: 'white' }}
              className="hover:bg-[#F5A461]"
              onClick={() => setShowNewTemplateModal(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Default Template Card */}
            <Card className="bg-white text-black border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between text-black">
                  <div className="flex items-center">
                    <span className="mr-2">Default Template</span>
                    <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                  </div>
                  <Button 
                    size="sm" 
                    style={{ backgroundColor: colors.orange.base, color: 'white' }}
                    className="hover:bg-[#F5A461] h-8"
                    onClick={() => {
                      setEditTemplate({
                        id: 'default',
                        name: 'Default Template',
                        subject: "We'd love to hear about your experience!",
                        body: `Hello [Customer Name],

Thank you for choosing [Business Name]. We hope you had a great experience with us!

We'd appreciate it if you could take a moment to share your feedback. Your review helps us improve our service and helps other potential customers make informed decisions.

Thank you for your time!

Best regards,
[Business Name] Team`
                      });
                      setShowEditTemplateModal(true);
                    }}
                  >
                    <EditIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 bg-white">
                  <p className="text-sm mb-2"><strong>Subject:</strong> We'd love to hear about your experience!</p>
                  <div className="text-sm text-black">
                    <p>Hello [Customer Name],</p>
                    <br/>
                    <p>Thank you for choosing [Business Name]. We hope you had a great experience with us!</p>
                    <br/>
                    <p>We'd appreciate it if you could take a moment to share your feedback. Your review helps us improve our service and helps other potential customers make informed decisions.</p>
                    <br/>
                    <p className="text-center p-2 bg-[#F28C38] text-white rounded my-2">
                      [Leave a Review Button]
                    </p>
                    <br/>
                    <p>Thank you for your time!</p>
                    <br/>
                    <p>Best regards,<br/>[Business Name] Team</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Custom Template Card Example */}
            <Card className="bg-white text-black border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between text-black">
                  <div className="flex items-center">
                    <span className="mr-2">Follow-up Template</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      style={{ backgroundColor: colors.orange.base, color: 'white' }}
                      className="hover:bg-[#F5A461] h-8"
                      onClick={() => {
                        setEditTemplate({
                          id: 'follow-up',
                          name: 'Follow-up Template',
                          subject: "Following up on your recent visit",
                          body: `Hello [Customer Name],

We hope you've been well since your recent visit to [Business Name].

If you haven't had a chance yet, we'd still love to hear your feedback about your experience with us. Your review would be incredibly helpful for our team and future customers.

Thank you for considering!

Best regards,
[Business Name] Team`
                        });
                        setShowEditTemplateModal(true);
                      }}
                    >
                      <EditIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 bg-white">
                  <p className="text-sm mb-2"><strong>Subject:</strong> Following up on your recent visit</p>
                  <div className="text-sm text-black">
                    <p>Hello [Customer Name],</p>
                    <br/>
                    <p>We hope you've been well since your recent visit to [Business Name].</p>
                    <br/>
                    <p>If you haven't had a chance yet, we'd still love to hear your feedback about your experience with us. Your review would be incredibly helpful for our team and future customers.</p>
                    <br/>
                    <p className="text-center p-2 bg-[#F28C38] text-white rounded my-2">
                      [Leave a Review Button]
                    </p>
                    <br/>
                    <p>Thank you for considering!</p>
                    <br/>
                    <p>Best regards,<br/>[Business Name] Team</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Edit Template Modal */}
          {showEditTemplateModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-black">
                    Edit Template: {editTemplate?.name}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowEditTemplateModal(false)}
                    className="text-black"
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={editTemplate?.name || ''}
                      onChange={(e) => setEditTemplate({...editTemplate!, name: e.target.value})}
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template-subject">Email Subject</Label>
                    <Input
                      id="template-subject"
                      value={editTemplate?.subject || ''}
                      onChange={(e) => setEditTemplate({...editTemplate!, subject: e.target.value})}
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template-body">Email Body</Label>
                    <Textarea
                      id="template-body"
                      value={editTemplate?.body || ''}
                      onChange={(e) => setEditTemplate({...editTemplate!, body: e.target.value})}
                      rows={12}
                      className="bg-white text-black border-gray-300 font-mono"
                    />
                  </div>
                  
                  <TemplateVariables
                    onInsertVariable={(variable) => {
                      const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
                      if (textarea && editTemplate) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const newText = text.substring(0, start) + variable + text.substring(end);
                        setEditTemplate({...editTemplate, body: newText});
                        setTimeout(() => {
                          textarea.focus();
                          textarea.selectionStart = start + variable.length;
                          textarea.selectionEnd = start + variable.length;
                        }, 10);
                      }
                    }}
                  />
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditTemplateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      style={{ backgroundColor: colors.orange.base, color: 'white' }}
                      className="hover:bg-[#F5A461]"
                      onClick={() => {
                        toast({
                          title: "Template Updated",
                          description: "Your template has been successfully updated."
                        });
                        setShowEditTemplateModal(false);
                      }}
                    >
                      Save Template
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* New Template Modal */}
          {showNewTemplateModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-black">
                    Create New Template
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowNewTemplateModal(false)}
                    className="text-black"
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-template-name">Template Name</Label>
                    <Input
                      id="new-template-name"
                      placeholder="e.g., Holiday Special, Follow-up Template"
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-template-subject">Email Subject</Label>
                    <Input
                      id="new-template-subject"
                      placeholder="e.g., We'd love to hear your feedback!"
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-template-body">Email Body</Label>
                    <Textarea
                      id="new-template-body"
                      placeholder="Write your email content here. You can use variables like [Customer Name], [Business Name], etc."
                      rows={12}
                      className="bg-white text-black border-gray-300 font-mono"
                    />
                  </div>
                  
                  <TemplateVariables
                    onInsertVariable={(variable) => {
                      const textarea = document.getElementById('new-template-body') as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const newText = text.substring(0, start) + variable + text.substring(end);
                        textarea.value = newText;
                        setTimeout(() => {
                          textarea.focus();
                          textarea.selectionStart = start + variable.length;
                          textarea.selectionEnd = start + variable.length;
                        }, 10);
                      }
                    }}
                  />
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewTemplateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      style={{ backgroundColor: colors.orange.base, color: 'white' }}
                      className="hover:bg-[#F5A461]"
                      onClick={() => {
                        toast({
                          title: "Template Created",
                          description: "Your new template has been successfully created."
                        });
                        setShowNewTemplateModal(false);
                      }}
                    >
                      Create Template
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-medium text-black">Custom Review Forms</h3>
              <p className="text-sm text-gray-600">
                Create and manage custom forms for collecting reviews
              </p>
            </div>
            <Button
              style={{ backgroundColor: colors.orange.base, color: 'white' }}
              className="hover:bg-[#F5A461]"
              onClick={() => setShowNewFormModal(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Form
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Default Form Card */}
            <Card className="bg-white text-black border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between text-black">
                  <div className="flex items-center">
                    <span className="mr-2">Basic Review Form</span>
                    <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                  </div>
                  <Button 
                    size="sm" 
                    style={{ backgroundColor: colors.orange.base, color: 'white' }}
                    className="hover:bg-[#F5A461] h-8"
                    onClick={() => {
                      setEditForm({
                        id: 'default',
                        name: 'Basic Review Form',
                        fields: [
                          { id: 'name', label: 'Full Name', type: 'text', required: true },
                          { id: 'email', label: 'Email Address', type: 'email', required: true },
                          { id: 'rating', label: 'Rating', type: 'rating', required: true },
                          { id: 'review', label: 'Your Review', type: 'textarea', required: true }
                        ]
                      });
                      setShowEditFormModal(true);
                    }}
                  >
                    <EditIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-500">Basic form with name, email, rating, and review text</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="border rounded-md p-4 bg-white">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name <span className="text-red-500">*</span></Label>
                      <Input className="bg-gray-50" disabled placeholder="John Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address <span className="text-red-500">*</span></Label>
                      <Input className="bg-gray-50" disabled placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Rating <span className="text-red-500">*</span></Label>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-2xl text-gray-300 cursor-not-allowed">★</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Your Review <span className="text-red-500">*</span></Label>
                      <Textarea className="bg-gray-50" disabled rows={3} placeholder="Tell us about your experience..." />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Custom Form Example */}
            <Card className="bg-white text-black border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between text-black">
                  <div className="flex items-center">
                    <span className="mr-2">Detailed Service Feedback</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      style={{ backgroundColor: colors.orange.base, color: 'white' }}
                      className="hover:bg-[#F5A461] h-8"
                      onClick={() => {
                        setEditForm({
                          id: 'service-feedback',
                          name: 'Detailed Service Feedback',
                          fields: [
                            { id: 'name', label: 'Full Name', type: 'text', required: true },
                            { id: 'email', label: 'Email Address', type: 'email', required: true },
                            { id: 'phone', label: 'Phone Number', type: 'tel', required: false },
                            { id: 'service-date', label: 'Service Date', type: 'date', required: true },
                            { id: 'service-type', label: 'Service Type', type: 'select', required: true, options: ['Consultation', 'Installation', 'Repair', 'Other'] },
                            { id: 'rating', label: 'Overall Rating', type: 'rating', required: true },
                            { id: 'staff-rating', label: 'Staff Friendliness', type: 'rating', required: true },
                            { id: 'review', label: 'Your Review', type: 'textarea', required: true }
                          ]
                        });
                        setShowEditFormModal(true);
                      }}
                    >
                      <EditIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardTitle>
                <p className="text-sm text-gray-500">Detailed form for service-based businesses</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="border rounded-md p-4 bg-white">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name <span className="text-red-500">*</span></Label>
                        <Input className="bg-gray-50" disabled placeholder="John Smith" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Address <span className="text-red-500">*</span></Label>
                        <Input className="bg-gray-50" disabled placeholder="john@example.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input className="bg-gray-50" disabled placeholder="(555) 123-4567" />
                      </div>
                      <div className="space-y-2">
                        <Label>Service Date <span className="text-red-500">*</span></Label>
                        <Input className="bg-gray-50" disabled type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Service Type <span className="text-red-500">*</span></Label>
                      <Select disabled>
                        <SelectTrigger className="bg-gray-50">
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Overall Rating <span className="text-red-500">*</span></Label>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-2xl text-gray-300 cursor-not-allowed">★</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Staff Friendliness <span className="text-red-500">*</span></Label>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-2xl text-gray-300 cursor-not-allowed">★</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Your Review <span className="text-red-500">*</span></Label>
                      <Textarea className="bg-gray-50" disabled rows={3} placeholder="Tell us about your experience..." />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Edit Form Modal */}
          {showEditFormModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-black">
                    Edit Form: {editForm?.name}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowEditFormModal(false)}
                    className="text-black"
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="form-name">Form Name</Label>
                    <Input
                      id="form-name"
                      value={editForm?.name || ''}
                      onChange={(e) => setEditForm({...editForm!, name: e.target.value})}
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Form Fields</Label>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8"
                        onClick={() => {
                          setEditForm({
                            ...editForm!,
                            fields: [...editForm!.fields, { 
                              id: `field-${Date.now()}`,
                              label: 'New Field',
                              type: 'text',
                              required: false
                            }]
                          });
                        }}
                      >
                        <PlusIcon className="h-3.5 w-3.5 mr-1" />
                        Add Field
                      </Button>
                    </div>
                    
                    <div className="border rounded-md divide-y">
                      {editForm?.fields?.map((field: {
                        id: string;
                        label: string;
                        type: string;
                        required: boolean;
                        options?: string[];
                      }, index: number) => (
                        <div key={field.id} className="p-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium flex items-center">
                              {getFieldTypeIcon(field.type)}
                              <span className="ml-2">{field.label}</span>
                              {field.required && <span className="ml-1 text-red-500">*</span>}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  // Show field edit dialog
                                  // For simplicity, we'll just toggle required
                                  const newFields = [...editForm!.fields];
                                  newFields[index] = {
                                    ...newFields[index],
                                    required: !newFields[index].required
                                  };
                                  setEditForm({...editForm!, fields: newFields});
                                }}
                              >
                                <EditIcon className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                onClick={() => {
                                  const newFields = editForm!.fields.filter((_: any, i: number) => i !== index);
                                  setEditForm({...editForm!, fields: newFields});
                                }}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Type: {getFieldTypeName(field.type)}
                          </div>
                        </div>
                      ))}
                      
                      {(!editForm?.fields || editForm.fields.length === 0) && (
                        <div className="p-4 text-center text-gray-500">
                          No fields added yet. Click "Add Field" to create form fields.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditFormModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      style={{ backgroundColor: colors.orange.base, color: 'white' }}
                      className="hover:bg-[#F5A461]"
                      onClick={() => {
                        toast({
                          title: "Form Updated",
                          description: "Your custom form has been successfully updated."
                        });
                        setShowEditFormModal(false);
                      }}
                    >
                      Save Form
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* New Form Modal */}
          {showNewFormModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-black">
                    Create New Form
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowNewFormModal(false)}
                    className="text-black"
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-form-name">Form Name</Label>
                    <Input
                      id="new-form-name"
                      placeholder="e.g., Customer Feedback Form"
                      className="bg-white text-black border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Form Fields</Label>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8"
                        >
                          <PlusIcon className="h-3.5 w-3.5 mr-1" />
                          Add Field
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8"
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 text-center text-gray-500">
                      <div className="my-6">
                        <div className="mx-auto h-12 w-12 text-gray-300 mb-2">
                          <ClipboardIcon className="h-full w-full" />
                        </div>
                        <p className="mb-2">Start building your form by adding fields</p>
                        <p className="text-sm text-gray-400">Or use one of our templates to get started quickly</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewFormModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      style={{ backgroundColor: colors.orange.base, color: 'white' }}
                      className="hover:bg-[#F5A461]"
                      onClick={() => {
                        toast({
                          title: "Form Created",
                          description: "Your new custom form has been successfully created."
                        });
                        setShowNewFormModal(false);
                      }}
                    >
                      Create Form
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}