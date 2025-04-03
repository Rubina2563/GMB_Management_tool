import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { refreshToken } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export default function AuthTestPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, loginMutation } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testProtectedEndpoint = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Try to access a protected endpoint
      const response = await apiRequest("GET", "/api/protected");
      const data = await response.json();
      
      setTestResult(JSON.stringify(data, null, 2));
      
      toast({
        title: "Success!",
        description: "Successfully accessed protected endpoint",
        variant: "default",
      });
    } catch (error) {
      setTestResult(error instanceof Error ? error.message : String(error));
      
      toast({
        title: "Failed!",
        description: "Could not access protected endpoint",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const testTokenRefresh = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Try to refresh the token
      const response = await refreshToken();
      
      if (response?.token) {
        setTestResult(`Token refreshed successfully. New token: ${response.token.substring(0, 15)}...`);
        
        localStorage.setItem('auth_token', response.token);
        
        toast({
          title: "Success!",
          description: "Token refreshed successfully",
          variant: "default",
        });
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      setTestResult(error instanceof Error ? error.message : String(error));
      
      toast({
        title: "Failed!",
        description: "Could not refresh token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const testLogin = async () => {
    try {
      await loginMutation.mutateAsync({ 
        username: "admin", 
        password: "admin123" 
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Authentication State</CardTitle>
            <CardDescription>Your current login status and user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}</p>
              {user && (
                <>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>User ID:</strong> {user.id}</p>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            {!isAuthenticated ? (
              <Button onClick={testLogin} disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Logging in..." : "Login as Admin"}
              </Button>
            ) : (
              <>
                <Button onClick={testProtectedEndpoint} disabled={isLoading}>
                  {isLoading ? "Testing..." : "Test Protected Endpoint"}
                </Button>
                
                <Button onClick={testTokenRefresh} disabled={isLoading} variant="outline">
                  {isLoading ? "Refreshing..." : "Test Token Refresh"}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
        
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>Test Result</CardTitle>
              <CardDescription>Response from the authentication test</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-secondary/50 rounded-md overflow-auto">
                {testResult}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}