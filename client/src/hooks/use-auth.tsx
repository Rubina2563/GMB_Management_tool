import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { refreshToken } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null; // Explicitly only allow SelectUser | null, not undefined
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isClient: boolean;
  isAuthenticated: boolean;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionExpiry: Date | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Set up a timer to refresh the token periodically
  useEffect(() => {
    // Only attempt to refresh if we have a token
    if (localStorage.getItem('auth_token')) {
      const refreshInterval = setInterval(async () => {
        try {
          // Attempt to refresh the token
          const response = await refreshToken();
          
          // If successful, update the token in localStorage
          if (response?.token) {
            localStorage.setItem('auth_token', response.token);
            
            // Refetch the user data with the new token
            refetch();
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If the refresh fails, don't clear the token yet - let the apiRequest
          // handle 401s and retry logic
        }
      }, 45 * 60 * 1000); // Refresh every 45 minutes
      
      // Clean up interval on unmount
      return () => clearInterval(refreshInterval);
    }
  }, [refetch]);

  // Ensure user is never undefined
  const userData = user || null;

  const isAuthenticated = !!user;
  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isClient = isAuthenticated && user?.role === 'client';
  
  // Subscription related properties
  const isSubscribed = isAuthenticated && 
    user?.subscription_status === 'active' && 
    (user?.subscription_plan === 'basic' || user?.subscription_plan === 'pro');
  
  const subscriptionPlan = user?.subscription_plan || null;
  const subscriptionStatus = user?.subscription_status || null;
  const subscriptionExpiry = user?.subscription_expiry ? new Date(user.subscription_expiry) : null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await res.json();
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      return data.user;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
      
      // Redirect to the appropriate dashboard based on user role
      if (user.role === 'admin') {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/client/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      const data = await res.json();
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      return data.user;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.username}!`,
      });
      
      // Redirect to the appropriate dashboard based on user role
      if (user.role === 'admin') {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/client/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Call logout API endpoint
      await apiRequest("POST", "/api/auth/logout");
      
      // Remove token from localStorage, regardless of API response
      localStorage.removeItem('auth_token');
    },
    onSuccess: () => {
      // Update auth state
      queryClient.setQueryData(["/api/auth/me"], null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      
      // Redirect to auth page
      setLocation("/auth");
    },
    onError: (error: Error) => {
      // Even if the API call fails, remove the token and log out the user
      localStorage.removeItem('auth_token');
      queryClient.setQueryData(["/api/auth/me"], null);
      
      toast({
        title: "Logout completed",
        description: "You have been logged out",
      });
      
      setLocation("/auth");
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: userData,
        isLoading,
        error,
        isAdmin,
        isClient,
        isAuthenticated,
        isSubscribed,
        subscriptionPlan,
        subscriptionStatus,
        subscriptionExpiry,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}