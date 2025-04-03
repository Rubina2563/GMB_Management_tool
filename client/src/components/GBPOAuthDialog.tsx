import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GBPOAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GBPOAuthDialog({ isOpen, onClose, onSuccess }: GBPOAuthDialogProps) {
  const [loading, setLoading] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const { toast } = useToast();

  // Listen for messages from the OAuth popup window
  useEffect(() => {
    if (!isOpen) return;
    
    function handleOAuthMessage(event: MessageEvent) {
      // Verify origin matches our app
      if (event.origin !== window.location.origin) return;
      
      // Process the message from the OAuth window
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'oauth-success') {
          setLoading(false);
          toast({
            title: "Connection Successful",
            description: "Your Google Business Profile has been connected successfully.",
          });
          onSuccess();
          onClose();
        } else if (event.data.type === 'oauth-error') {
          setLoading(false);
          toast({
            title: "Connection Failed",
            description: event.data.error || "Could not connect to Google Business Profile.",
            variant: "destructive",
          });
        }
      }
    }
    
    // Add event listener for messages
    window.addEventListener('message', handleOAuthMessage);
    
    // Clean up event listener when dialog is closed
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      
      // Close the OAuth window if it's still open when the dialog is closed
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
    };
  }, [isOpen, onClose, onSuccess, toast, authWindow]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      
      // Request OAuth URL from the server
      const response = await apiRequest({
        url: '/api/gbp/oauth/url',
        method: 'GET',
      });
      
      if (response.success && response.auth_url) {
        // Open the OAuth URL in a new window
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const newAuthWindow = window.open(
          response.auth_url,
          'gbp-oauth',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Check if window was blocked by popup blocker
        if (!newAuthWindow) {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site to connect your Google Business Profile.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        setAuthWindow(newAuthWindow);
        
        // Start a timer to detect if the window was closed before completion
        const checkWindowClosedInterval = setInterval(() => {
          if (newAuthWindow.closed) {
            clearInterval(checkWindowClosedInterval);
            
            // Only show a message if we're still in the loading state
            // (this means we didn't receive a success/error message)
            if (loading) {
              setLoading(false);
              toast({
                title: "Authentication Cancelled",
                description: "The Google authentication process was cancelled.",
                variant: "destructive",
              });
            }
          }
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to generate OAuth URL');
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to Google Business Profile. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Google Business Profile</DialogTitle>
          <DialogDescription>
            Connect your Google Business Profile to access and manage your business locations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col items-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <img 
              src="https://www.gstatic.com/images/branding/product/2x/google_business_profile_64dp.png" 
              alt="Google Business Profile" 
              className="w-16 h-16 mb-2" 
            />
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              You'll be redirected to Google to authorize access to your business profiles.
              This allows the application to retrieve your business locations and data.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={loading} className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Connecting..." : "Connect to Google"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}