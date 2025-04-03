import React, { useState } from 'react';
import { GlowButton } from '@/components/ui/glow-button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GlowDownloadReportButtonProps {
  reportType: string;
  locationId: number | string;
  className?: string;
  comprehensive?: boolean; // Include data from all tabs
}

/**
 * Enhanced download report button using glow animation for better user interaction
 */
const GlowDownloadReportButton: React.FC<GlowDownloadReportButtonProps> = ({ 
  reportType, 
  locationId,
  className = '',
  comprehensive = false
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Request the PDF report, adding comprehensive param if needed
      const url = `/api/client/reports/${locationId}?type=${reportType}${comprehensive ? '&comprehensive=true' : ''}`;
      console.log('Downloading report from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        throw new Error(`Failed to generate report: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      console.log('Report blob received, size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Report generated with zero size');
      }
      
      // Create a download link
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `GBP_${reportType}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      
      toast({
        title: 'Report Downloaded',
        description: 'Your PDF report has been generated and downloaded.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <GlowButton 
      variant="primary" 
      onClick={handleDownload} 
      disabled={isDownloading}
      className={className}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Download Report
        </>
      )}
    </GlowButton>
  );
};

export default GlowDownloadReportButton;