import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Globe,
  PlusCircle,
  TrendingUp
} from "lucide-react";

interface CompetitorGapAnalysisProps {
  campaignId?: number;
}

const CompetitorGapAnalysis: React.FC<CompetitorGapAnalysisProps> = ({ campaignId }) => {
  // Fetch competitor gap analysis data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/client/local-links/competitor-gap', campaignId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/client/local-links/competitor-gap?campaignId=${campaignId || ''}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch competitor gap analysis data');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching competitor gap data:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity.toLowerCase()) {
      case 'high': return 'bg-[#F28C38] text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCompetitorPresence = (presenceArray: any[], competitorId: number) => {
    const found = presenceArray.find(p => p.competitorId === competitorId);
    return found?.present ? true : false;
  };

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">Competitor Gap Analysis</CardTitle>
          <CardDescription className="text-black">Loading competitor data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 text-[#F28C38] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data?.data) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">Competitor Gap Analysis</CardTitle>
          <CardDescription className="text-black">Failed to load competitor data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-black text-lg mb-4">There was an error loading competitor gap data</p>
          <Button 
            className="bg-[#F28C38] text-white hover:bg-[#E67D29]"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { competitors, citationOpportunities } = data.data;

  // Count high opportunity citations
  const highOpportunityCount = citationOpportunities.filter(
    (opp: any) => opp.opportunity.toLowerCase() === 'high' && !opp.yourPresence
  ).length;

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-black text-2xl">Competitor Gap Analysis</CardTitle>
              <CardDescription className="text-black text-lg">
                Find citation opportunities based on competitor analysis
              </CardDescription>
            </div>
            <Button 
              className="bg-[#F28C38] text-white hover:bg-[#E67D29]"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <PlusCircle className="h-8 w-8 text-[#F28C38] mb-2" />
                  <h4 className="text-black font-semibold text-lg">{highOpportunityCount}</h4>
                  <p className="text-gray-600">High Priority Opportunities</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Globe className="h-8 w-8 text-[#F28C38] mb-2" />
                  <h4 className="text-black font-semibold text-lg">{citationOpportunities.length}</h4>
                  <p className="text-gray-600">Total Citation Opportunities</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className="h-8 w-8 text-[#F28C38] mb-2" />
                  <h4 className="text-black font-semibold text-lg">{competitors.length}</h4>
                  <p className="text-gray-600">Competitors Analyzed</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-black">Competitors</CardTitle>
              <CardDescription className="text-black">
                Businesses analyzed for citation opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black">Name</TableHead>
                      <TableHead className="text-black">Website</TableHead>
                      <TableHead className="text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((competitor: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-black">
                          {competitor.name}
                        </TableCell>
                        <TableCell className="text-black">
                          {competitor.website}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="text-blue-600">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-black">Citation Opportunities</CardTitle>
              <CardDescription className="text-black">
                Directories where your competitors are listed but you're not
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black">Directory</TableHead>
                      <TableHead className="text-black">Category</TableHead>
                      <TableHead className="text-black">Domain Authority</TableHead>
                      <TableHead className="text-black">Opportunity</TableHead>
                      <TableHead className="text-black">Your Presence</TableHead>
                      {competitors.map((comp: any, idx: number) => (
                        <TableHead key={idx} className="text-black text-center">
                          {comp.name.split(' ')[0]}
                        </TableHead>
                      ))}
                      <TableHead className="text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citationOpportunities.map((opp: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-black">
                          {opp.directory}
                        </TableCell>
                        <TableCell className="text-black">
                          {opp.category}
                        </TableCell>
                        <TableCell className="text-black">
                          {opp.domainAuthority}
                        </TableCell>
                        <TableCell>
                          <Badge className={getOpportunityColor(opp.opportunity)}>
                            {opp.opportunity.charAt(0).toUpperCase() + opp.opportunity.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {opp.yourPresence ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        {competitors.map((comp: any, idx: number) => (
                          <TableCell key={idx} className="text-center">
                            {getCompetitorPresence(opp.competitorPresence, comp.id) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              className={`${!opp.yourPresence ? "bg-[#F28C38] text-white hover:bg-[#E67D29]" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              disabled={opp.yourPresence}
                            >
                              {opp.yourPresence ? "Listed" : "Add Listing"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitorGapAnalysis;