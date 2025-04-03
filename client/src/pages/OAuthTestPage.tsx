import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OAuthTestPage() {
  const [status, setStatus] = useState<string>('');
  const [oauthUrl, setOAuthUrl] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Get OAuth credentials test
  const { data: credentialsData, isLoading: isLoadingCredentials, refetch: refetchCredentials } = useQuery({
    queryKey: ['/api/gbp/oauth/test-credentials'],
    enabled: false
  });

  const testCredentials = async () => {
    setStatus('Testing OAuth credentials...');
    try {
      await refetchCredentials();
      setStatus('Credentials test complete');
    } catch (error) {
      console.error('Error testing credentials:', error);
      setStatus('Error testing credentials');
      setErrorDetails(JSON.stringify(error, null, 2));
    }
  };

  // Get OAuth URL
  const getOAuthUrl = async () => {
    setStatus('Generating OAuth URL...');
    try {
      const response = await fetch('/api/gbp/oauth/url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setOAuthUrl(data.auth_url);
        setStatus('OAuth URL generated successfully');
      } else {
        setStatus(`Error: ${data.message || 'Failed to generate OAuth URL'}`);
        setErrorDetails(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Error getting OAuth URL:', error);
      setStatus('Error connecting to server');
      setErrorDetails(JSON.stringify(error, null, 2));
    }
  };
  
  // Get direct OAuth URL from environment variables
  const getDirectOAuthUrl = async () => {
    setStatus('Generating direct OAuth URL from environment variables...');
    try {
      const response = await fetch('/api/gbp/oauth/test-env-direct', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setOAuthUrl(data.auth_url);
        setStatus('Direct OAuth URL generated successfully');
        setErrorDetails(JSON.stringify(data.credentials, null, 2));
      } else {
        setStatus(`Error: ${data.message || 'Failed to generate direct OAuth URL'}`);
        setErrorDetails(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Error getting direct OAuth URL:', error);
      setStatus('Error connecting to server');
      setErrorDetails(JSON.stringify(error, null, 2));
    }
  };

  const initiateOAuth = () => {
    if (!oauthUrl) {
      setStatus('Please generate an OAuth URL first');
      return;
    }
    
    setStatus('Opening OAuth consent screen...');
    window.open(oauthUrl, 'oauth-window', 'width=600,height=700');
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">OAuth Debug Tool</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Test OAuth Credentials</CardTitle>
          <CardDescription>
            Checks if OAuth credentials are properly configured in the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {credentialsData && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold mb-2">Credentials Status:</h3>
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(credentialsData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={testCredentials}
            disabled={isLoadingCredentials}
          >
            {isLoadingCredentials ? 'Testing...' : 'Test Credentials'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 2: Generate OAuth URL</CardTitle>
          <CardDescription>
            Generates the OAuth authorization URL for Google Business Profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {oauthUrl && (
            <div className="mt-4">
              <Label htmlFor="oauth-url">OAuth URL:</Label>
              <Input 
                id="oauth-url" 
                readOnly 
                value={oauthUrl} 
                className="mt-1 font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={getOAuthUrl}>
            Normal URL
          </Button>
          <Button onClick={getDirectOAuthUrl} variant="secondary">
            Direct from ENV
          </Button>
          <Button onClick={initiateOAuth} disabled={!oauthUrl} variant="outline">
            Open Auth Window
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 3: Login Bypass</CardTitle>
          <CardDescription>
            Bypass the OAuth flow by clicking this button to go directly to the login bypass page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Use this option if you're encountering persistent 403 errors with the OAuth flow.
            This will get you into the app for now while you fix the OAuth configuration.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => window.location.href = '/login-bypass'}
            variant="destructive"
          >
            Bypass OAuth Login
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Status & Diagnostics</CardTitle>
          <CardDescription>
            Shows the current status and any error details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <strong>Status:</strong> {status || 'Ready'}
          </div>
          
          {errorDetails && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Error Details:</h3>
              <pre className="whitespace-pre-wrap text-sm bg-red-50 p-3 rounded-md border border-red-200 overflow-x-auto">
                {errorDetails}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}