import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

/**
 * Temporary placeholder for the Reports feature
 * This will be shown until the reports feature is rebuilt
 */
const ReportsPagePlaceholder: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">Reports</h1>
      <p className="text-gray-500 mb-6">PDF Reports feature is currently under maintenance</p>
      
      <Alert variant="destructive" className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Reports Temporarily Unavailable</AlertTitle>
        <AlertDescription>
          The reports feature is currently being rebuilt to provide better, more accurate data.
          Please check back later.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              We're working on an improved reports system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The new reports feature will include:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>More accurate data</li>
              <li>Better visualizations</li>
              <li>Customizable reports</li>
              <li>Improved PDF generation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPagePlaceholder;