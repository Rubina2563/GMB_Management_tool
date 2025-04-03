import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import DownloadReportButton from '@/components/DownloadReportButton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description: string;
}

const ReportsPage: React.FC = () => {
  // Get reports data from the API
  const { data: reportsData, isLoading: isLoadingReports, error: reportsError } = useQuery({
    queryKey: ['/api/client/reports'],
    refetchOnWindowFocus: false,
  });

  // Get locations data for report generation
  const { data: locationsData, isLoading: isLoadingLocations, error: locationsError } = useQuery({
    queryKey: ['/api/gbp/locations'],
    refetchOnWindowFocus: false,
  });
  
  // Loading state
  if (isLoadingReports || isLoadingLocations) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-2">Reports</h1>
        <p className="text-gray-500 mb-6">Generate actionable PDF reports for your Google Business Profile</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-2/4 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (reportsError || locationsError) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-2">Reports</h1>
        <p className="text-gray-500 mb-6">Generate actionable PDF reports for your Google Business Profile</p>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load report data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No reports or locations available
  if (!reportsData?.reports || !reportsData.reports.length || !locationsData?.locations?.length) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-2">Reports</h1>
        <p className="text-gray-500 mb-6">Generate actionable PDF reports for your Google Business Profile</p>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            {!locationsData?.locations?.length
              ? "You don't have any locations connected. Please add a location to generate reports."
              : "No report types available. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render reports using the API data
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">Reports</h1>
      <p className="text-gray-500 mb-6">Generate actionable PDF reports for your Google Business Profile</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsData.reports.map((report: Report) => (
          <Card key={report.id} className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>{report.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription className="text-sm">{report.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <DownloadReportButton
                reportType={report.id}
                locationId={locationsData?.locations?.[0]?.id}
                comprehensive={true}
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;