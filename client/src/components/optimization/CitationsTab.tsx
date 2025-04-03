/**
 * CitationsTab Component
 * 
 * Displays citation analysis and recommendations for local SEO optimization
 * based on real data from DataForSEO.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  BarChart,
  List,
  BarChart2,
  ListFilter,
  ArrowRight,
  Clock,
  LinkIcon
} from "lucide-react";

interface CitationsTabProps {
  locationId: number;
}

interface CitationDirectory {
  name: string;
  url: string;
  da: number;
  status: 'not_listed' | 'listed' | 'in_progress' | 'completed';
  naConsistency?: {
    name: boolean;
    address: boolean;
    phone: boolean;
  };
  priority: 'high' | 'medium' | 'low';
}

interface CitationAnalysis {
  citationScore: number;
  priorityDirectories: CitationDirectory[];
  listedDirectories: CitationDirectory[];
  totalCitations: number;
  napConsistencyScore: number;
  recommendations: string[];
  industryBenchmarks?: {
    averageCitations: number;
    topDirectories: string[];
  };
}

const CitationsTab: React.FC<CitationsTabProps> = ({ locationId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch citation analysis data
  const {
    data: analysisData,
    isLoading: analysisLoading,
    isError: analysisError,
    refetch: refetchAnalysis
  } = useQuery<{ success: boolean; message: string; data: CitationAnalysis }>({
    queryKey: [`/api/client/citations/analysis/${locationId}`],
    queryFn: async () => {
      const response = await fetch(`/api/client/citations/analysis/${locationId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch citation analysis data');
      }
      
      return response.json();
    },
    refetchOnWindowFocus: false
  });
  
  // Update citation status mutation
  const updateCitationStatus = useMutation({
    mutationFn: async ({ directoryName, status }: { directoryName: string; status: 'not_listed' | 'listed' | 'in_progress' | 'completed' }) => {
      const response = await fetch('/api/client/citations/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          locationId,
          directoryName,
          status
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update citation status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the citation analysis query to refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/client/citations/analysis/${locationId}`] });
      
      toast({
        title: 'Citation status updated',
        description: 'The citation status has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update citation status',
        description: error.message || 'An error occurred while updating the citation status.',
        variant: 'destructive'
      });
    }
  });
  
  // Handle refresh analysis
  const handleRefreshAnalysis = () => {
    refetchAnalysis();
    toast({
      title: "Refreshing citation analysis",
      description: "Fetching the latest citation data.",
    });
  };
  
  // Handle update status
  const handleUpdateStatus = (directoryName: string, newStatus: 'not_listed' | 'listed' | 'in_progress' | 'completed') => {
    updateCitationStatus.mutate({ directoryName, status: newStatus });
  };
  
  // Get badge color based on priority level
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'low':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };
  
  // Get badge color based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'listed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'not_listed':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };
  
  // Display status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'listed':
        return 'Listed';
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_listed':
        return 'Not Listed';
      default:
        return 'Unknown';
    }
  };
  
  // Loading state
  if (analysisLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (analysisError || !analysisData?.data) {
    return (
      <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Citation Analysis Unavailable</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>We're currently experiencing an issue with the citation data service. Our team has been notified.</p>
          <p className="text-sm mt-2">
            You can still access all other optimization features while we resolve this. The system will automatically retry later.
          </p>
        </AlertDescription>
        <div className="flex space-x-2 mt-3">
          <Button 
            onClick={handleRefreshAnalysis} 
            variant="outline" 
            className="border-red-200 text-red-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Now
          </Button>
        </div>
      </Alert>
    );
  }
  
  const analysis = analysisData.data;
  
  return (
    <div className="space-y-6">
      {/* Header with Score and Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-black">Citation Analysis</h2>
          <p className="text-gray-600">
            Identify citation opportunities to improve local SEO
          </p>
        </div>
        <div className="flex items-center">
          <div className="mr-4 text-center">
            <div className="text-4xl font-bold text-[#F97316]">
              {analysis.citationScore}
              <span className="text-xl text-black">/100</span>
            </div>
            <p className="text-xs text-gray-600">Citation Score</p>
          </div>
          <div className="flex space-x-2">

            <Button 
              variant="outline" 
              className="border-[#F97316] text-[#F97316] hover:bg-orange-50"
              onClick={handleRefreshAnalysis}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 mr-3">
                  <BarChart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Citations</p>
                  <p className="text-2xl font-bold text-black">{analysis.totalCitations}</p>
                </div>
              </div>
              {analysis.industryBenchmarks && (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Avg: {analysis.industryBenchmarks.averageCitations}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-orange-100 mr-3">
                  <ListFilter className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority Listings</p>
                  <p className="text-2xl font-bold text-black">{analysis.priorityDirectories.length}</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                To Add
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 mr-3">
                  <BarChart2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">NAP Consistency</p>
                  <p className="text-2xl font-bold text-black">{analysis.napConsistencyScore}%</p>
                </div>
              </div>
              <div className="w-20">
                <Progress 
                  value={analysis.napConsistencyScore} 
                  className="h-2 bg-gray-100" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Priority Directories and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Directories */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-black flex items-center">
              <List className="h-5 w-5 mr-2 text-[#F97316]" />
              Priority Directories
            </CardTitle>
            <CardDescription className="text-gray-600">
              Citation directories to add or update
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {analysis.priorityDirectories.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-black">Directory</TableHead>
                        <TableHead className="text-black text-center">DA</TableHead>
                        <TableHead className="text-black text-center">Priority</TableHead>
                        <TableHead className="text-black text-center">Status</TableHead>
                        <TableHead className="text-black text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.priorityDirectories.map((directory, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-black">
                            <div className="flex items-center">
                              <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
                              {directory.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-black">{directory.da}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={getPriorityBadgeClass(directory.priority)}
                            >
                              {directory.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={getStatusBadgeClass(directory.status)}
                            >
                              {getStatusLabel(directory.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-gray-200"
                              onClick={() => window.open(directory.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Visit
                            </Button>
                            {directory.status === 'not_listed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-[#F97316] hover:bg-[#FB923C] text-white"
                                onClick={() => handleUpdateStatus(directory.name, 'in_progress')}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {directory.status === 'in_progress' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-[#F97316] hover:bg-[#FB923C] text-white"
                                onClick={() => handleUpdateStatus(directory.name, 'completed')}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-md text-gray-600 text-sm">
                  No priority directories found. You're doing well!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Action Plan */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-black flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-[#F97316]" />
              Citation Action Plan
            </CardTitle>
            <CardDescription className="text-gray-600">
              Optimization tasks to improve your local visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* NAP Consistency Action */}
              <div className="flex p-3 bg-orange-50 rounded-md">
                <div className="p-1 bg-white rounded-full mr-3 h-6 w-6 flex items-center justify-center text-[#F97316]">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-black">Fix NAP Inconsistencies</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Update your business information across all listings to ensure consistency.
                    {analysis.napConsistencyScore < 90 ? 
                      ` Your current consistency score is ${analysis.napConsistencyScore}% - needs attention.` : 
                      ` Great job! Your current consistency score is ${analysis.napConsistencyScore}%.`}
                  </p>
                  {analysis.napConsistencyScore < 100 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs bg-[#F97316] hover:bg-[#FB923C] text-white"
                    >
                      View Inconsistencies
                    </Button>
                  )}
                </div>
              </div>
              
              {/* High-Impact Directories */}
              <div className="flex p-3 bg-orange-50 rounded-md">
                <div className="p-1 bg-white rounded-full mr-3 h-6 w-6 flex items-center justify-center text-[#F97316]">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-black">Focus on High-Impact Directories</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {analysis.priorityDirectories.filter(d => d.priority === 'high').length > 0 ?
                      `You have ${analysis.priorityDirectories.filter(d => d.priority === 'high').length} high-priority directories to add.` :
                      'All high-priority directories are covered. Great work!'}
                  </p>
                  {analysis.priorityDirectories.filter(d => d.priority === 'high').length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs bg-[#F97316] hover:bg-[#FB923C] text-white"
                      onClick={() => document.getElementById('priority-directories')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      View High-Priority List
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Complete In-Progress */}
              <div className="flex p-3 bg-orange-50 rounded-md">
                <div className="p-1 bg-white rounded-full mr-3 h-6 w-6 flex items-center justify-center text-[#F97316]">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-black">Complete In-Progress Listings</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {analysis.priorityDirectories.filter(d => d.status === 'in_progress').length > 0 ?
                      `You have ${analysis.priorityDirectories.filter(d => d.status === 'in_progress').length} citation listings in progress. Complete these for immediate SEO impact.` :
                      'No in-progress citations pending.'}
                  </p>
                  {analysis.priorityDirectories.filter(d => d.status === 'in_progress').length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analysis.priorityDirectories
                        .filter(d => d.status === 'in_progress')
                        .slice(0, 3)
                        .map((dir, i) => (
                          <Badge key={i} className="bg-white text-[#F97316] hover:bg-white">
                            {dir.name}
                          </Badge>
                        ))}
                        {analysis.priorityDirectories.filter(d => d.status === 'in_progress').length > 3 && (
                          <Badge className="bg-white text-[#F97316] hover:bg-white">
                            +{analysis.priorityDirectories.filter(d => d.status === 'in_progress').length - 3} more
                          </Badge>
                        )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Industry-Specific */}
              <div className="flex p-3 bg-orange-50 rounded-md">
                <div className="p-1 bg-white rounded-full mr-3 h-6 w-6 flex items-center justify-center text-[#F97316]">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-black">Add Industry-Specific Citations</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Industry-specific directories send strong relevance signals to search engines.
                  </p>
                  {analysis.industryBenchmarks?.topDirectories && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analysis.industryBenchmarks.topDirectories.slice(0, 3).map((dir, i) => (
                        <Badge key={i} className="bg-white text-[#F97316] hover:bg-white">
                          {dir}
                        </Badge>
                      ))}
                      {analysis.industryBenchmarks.topDirectories.length > 3 && (
                        <Badge className="bg-white text-[#F97316] hover:bg-white">
                          +{analysis.industryBenchmarks.topDirectories.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Citation Monitoring */}
              <div className="flex p-3 bg-orange-50 rounded-md">
                <div className="p-1 bg-white rounded-full mr-3 h-6 w-6 flex items-center justify-center text-[#F97316]">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-black">Citation Health Monitoring</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Monitor your citation profile regularly for changes or new opportunities.
                    {analysis.totalCitations > 0 ?
                      ` Currently monitoring ${analysis.totalCitations} citation sources.` :
                      ' Set up your first citations to start monitoring.'}
                  </p>
                </div>
              </div>
              
              {/* Progress Comparison */}
              <div className="p-4 bg-blue-50 rounded-md mt-4">
                <h4 className="font-medium text-blue-800 mb-2">Your Progress vs. Industry</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Your Citations</p>
                    <Progress 
                      value={analysis.totalCitations} 
                      max={analysis.industryBenchmarks?.averageCitations || 10}
                      className="h-2 bg-gray-100" 
                    />
                    <p className="text-xs text-gray-600 mt-1">{analysis.totalCitations} completed</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Industry Average</p>
                    <Progress 
                      value={analysis.industryBenchmarks?.averageCitations || 10} 
                      max={analysis.industryBenchmarks?.averageCitations || 10}
                      className="h-2 bg-gray-100" 
                    />
                    <p className="text-xs text-gray-600 mt-1">{analysis.industryBenchmarks?.averageCitations || '--'} avg</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-100 pt-4">
            <Button 
              className="w-full bg-[#F97316] hover:bg-[#FB923C] text-white"
              onClick={() => window.location.href = "/citations"}
            >
              Run Full Citation Audit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* NAP Consistency */}
      {analysis.listedDirectories.length > 0 && (
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-black flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-[#F97316]" />
              NAP Consistency Check
            </CardTitle>
            <CardDescription className="text-gray-600">
              Check Name, Address, Phone consistency across your listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">Directory</TableHead>
                    <TableHead className="text-black text-center">Name</TableHead>
                    <TableHead className="text-black text-center">Address</TableHead>
                    <TableHead className="text-black text-center">Phone</TableHead>
                    <TableHead className="text-black text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.listedDirectories
                    .filter(directory => directory.naConsistency)
                    .map((directory, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-black">
                          {directory.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {directory.naConsistency?.name ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 inline-block" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 inline-block" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {directory.naConsistency?.address ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 inline-block" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 inline-block" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {directory.naConsistency?.phone ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 inline-block" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600 inline-block" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs bg-[#F97316] hover:bg-[#FB923C] text-white"
                            onClick={() => window.open(directory.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CitationsTab;