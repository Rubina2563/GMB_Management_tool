import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import axios from "axios";
import { loginUser } from "@/lib/api";

export default function LoginBypass() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>('checking');
  const [, navigate] = useLocation();
  const { user, isAuthenticated, login } = useAuth();
  
  // Check the current authentication status when component loads
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // Try to get the current user with credentials
        const response = await axios.get('/api/auth/me', { withCredentials: true });
        if (response.data?.success && response.data?.user) {
          setAuthStatus('authenticated');
          console.log('Already authenticated as:', response.data.user);
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.log('Not authenticated, need to login');
        setAuthStatus('unauthenticated');
      }
    }
    
    checkAuthStatus();
  }, []);

  const loginAsClient = async () => {
    try {
      setLoading(true);
      await login({
        username: "client",
        password: "client123"
      });
      
      toast({
        title: "Success",
        description: "You are now logging in as a client user.",
      });
      
      // Navigate to Posts page after successful login
      setTimeout(() => {
        navigate('/client/campaigns');
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Login failed. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loginAsAdmin = async () => {
    try {
      setLoading(true);
      await login({
        username: "admin",
        password: "admin123"
      });
      
      toast({
        title: "Success",
        description: "You are now logging in as an admin user.",
      });
      
      // Navigate to admin dashboard
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Login failed. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Direct login implementation using our API function directly
  const directLoginAsClient = async () => {
    try {
      setLoading(true);
      // Direct API call without going through the hooks
      const response = await loginUser({
        username: "client",
        password: "client123"
      });
      
      console.log('Direct login response:', response);
      
      toast({
        title: "Direct Login Success",
        description: "Direct login as client successful. Check console for details.",
      });
      
      // Explicitly refresh the query cache to update authentication state
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Navigate to Campaigns page
      setTimeout(() => {
        window.location.href = '/client/campaigns';
      }, 1000);
    } catch (error) {
      console.error("Direct login error:", error);
      toast({
        title: "Direct Login Error",
        description: "Direct login failed. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Debug Login</h1>
        
        {isAuthenticated ? (
          <div className="mb-6 text-gray-600 text-center">
            <p className="mb-2 font-semibold text-green-600">✅ Already authenticated</p>
            <p>Current user: {user?.username} (Role: {user?.role})</p>
            <div className="mt-4">
              <Button 
                onClick={() => navigate('/client/posts')}
                className="w-full bg-[#F28C38] hover:bg-[#F28C38]/90 text-white"
              >
                Go to Posts Page
              </Button>
            </div>
          </div>
        ) : (
          <p className="mb-6 text-gray-600 text-center">
            This page allows direct login with demo credentials for testing purposes.
          </p>
        )}
        
        <div className="space-y-4">
          <Button
            onClick={loginAsClient}
            disabled={loading || isAuthenticated}
            className="w-full bg-[#F28C38] hover:bg-[#F28C38]/90 text-white"
          >
            {loading ? "Logging in..." : "Login as Client"}
          </Button>
          
          <Button
            onClick={loginAsAdmin}
            disabled={loading || isAuthenticated}
            className="w-full bg-black hover:bg-black/80 text-white"
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </Button>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm text-gray-500 mb-2">Alternative direct login method:</p>
            <Button
              onClick={directLoginAsClient}
              disabled={loading || isAuthenticated}
              className="w-full bg-[#F28C38]/80 hover:bg-[#F28C38] text-white"
            >
              Direct Login as Client
            </Button>
          </div>
          
          <div className="pt-4 text-center">
            <a href="/auth" className="text-[#F28C38] hover:underline text-sm">
              Go to regular login page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}