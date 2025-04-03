import React, { useState, useEffect } from 'react';
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
  Clock,
  Globe,
  Phone,
  MapPin,
  BarChart4,
  Briefcase,
  Search,
  Link as LinkIcon
} from "lucide-react";

interface CitationReportProps {
  campaignId?: number;
}

const CitationReport: React.FC<CitationReportProps> = ({ campaignId }) => {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch citation report data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/client/local-links/citation-report', campaignId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/client/local-links/citation-report?campaignId=${campaignId || ''}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch citation report data');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching citation report data:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (data?.data?.lastChecked) {
      setLastUpdated(data.data.lastChecked);
    }
  }, [data]);

  const getCitationStatusIcon = (isClaimed: boolean) => {
    return isClaimed ? 
      <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
      <Clock className="h-5 w-5 text-amber-600" />;
  };

  const getNapConsistencyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-black">Citation Report</CardTitle>
          <CardDescription className="text-black">Loading citation data...</CardDescription>
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
          <CardTitle className="text-black">Citation Report</CardTitle>
          <CardDescription className="text-black">Failed to load citation data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-black text-lg mb-4">There was an error loading your citation data</p>
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

  const reportData = data.data;
  const { campaignDetails, backlinksData, citationMetrics } = reportData;

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-black text-2xl">Citation Report</CardTitle>
              <CardDescription className="text-black text-lg">
                Complete overview of your business citations
              </CardDescription>
            </div>
            <Button 
              className="bg-[#F28C38] text-white hover:bg-[#E67D29]"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-black">Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-black">{campaignDetails.businessName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-black">{campaignDetails.website}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-black">{campaignDetails.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-black">{campaignDetails.phoneNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-black">NAP Consistency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-black">Business Name</span>
                    <span className="text-black font-semibold">{citationMetrics.napConsistency.nameConsistency}%</span>
                  </div>
                  <Progress className="h-2" value={citationMetrics.napConsistency.nameConsistency} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-black">Address</span>
                    <span className="text-black font-semibold">{citationMetrics.napConsistency.addressConsistency}%</span>
                  </div>
                  <Progress 
                    className={`h-2 ${getNapConsistencyColor(citationMetrics.napConsistency.addressConsistency)}`} 
                    value={citationMetrics.napConsistency.addressConsistency} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-black">Phone Number</span>
                    <span className="text-black font-semibold">{citationMetrics.napConsistency.phoneConsistency}%</span>
                  </div>
                  <Progress 
                    className={`h-2 ${getNapConsistencyColor(citationMetrics.napConsistency.phoneConsistency)}`} 
                    value={citationMetrics.napConsistency.phoneConsistency} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BarChart4 className="h-8 w-8 text-[#F28C38] mb-2" />
                  <h4 className="text-black font-semibold text-lg">{citationMetrics.totalBacklinks}</h4>
                  <p className="text-gray-600">Total Backlinks</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <LinkIcon className="h-8 w-8 text-[#F28C38] mb-2" />
                  <h4 className="text-black font-semibold text-lg">{citationMetrics.totalCitations}</h4>
                  <p className="text-gray-600">Directory Citations</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                  <h4 className="text-black font-semibold text-lg">{citationMetrics.claimedCitations}</h4>
                  <p className="text-gray-600">Claimed Citations</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <XCircle className="h-8 w-8 text-amber-600 mb-2" />
                  <h4 className="text-black font-semibold text-lg">{citationMetrics.unclaimedCitations}</h4>
                  <p className="text-gray-600">Unclaimed Citations</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-black">Citations and Backlinks</CardTitle>
              <CardDescription className="text-black">
                All citations and backlinks to your business website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black">Source</TableHead>
                      <TableHead className="text-black">Type</TableHead>
                      <TableHead className="text-black">Status</TableHead>
                      <TableHead className="text-black">Domain Authority</TableHead>
                      <TableHead className="text-black">Last Checked</TableHead>
                      <TableHead className="text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backlinksData.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-black">
                          <div className="text-sm">{new URL(item.sourceUrl).hostname}</div>
                          <div className="text-xs text-gray-500">{item.anchorText}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isCitation ? "default" : "outline"} className={item.isCitation ? "bg-blue-500 text-white" : "border-blue-500 text-blue-700"}>
                            {item.isCitation ? "Citation" : "Backlink"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.isCitation ? (
                            <div className="flex items-center">
                              {getCitationStatusIcon(item.isClaimed)}
                              <span className="ml-1.5 text-black">
                                {item.isClaimed ? "Claimed" : "Unclaimed"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-black">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-black">{item.domainAuthority}</TableCell>
                        <TableCell className="text-black">{item.lastChecked}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="text-blue-600">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {item.isCitation && !item.isClaimed && (
                              <Button size="sm" className="bg-[#F28C38] text-white hover:bg-[#E67D29]">
                                Claim
                              </Button>
                            )}
                          </div>
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
              <CardTitle className="text-black">Top Citation Sources</CardTitle>
              <CardDescription className="text-black">
                Most authoritative sources linking to your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {citationMetrics.topCitationSources.map((source: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <Globe className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-black font-medium">{new URL(source.sourceUrl).hostname}</p>
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline" className="border-black text-black">
                        DA: {source.domainAuthority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {lastUpdated}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CitationReport;