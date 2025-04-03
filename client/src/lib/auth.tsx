import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  logoutUser as apiLogoutUser,
  isAuthenticated,
  loginWithGoogle
} from './api';
import { apiRequest } from './queryClient';
import { LoginData, RegisterData } from '@shared/schema';

// User interface
interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  role: 'admin' | 'client';
  subscription_plan?: string;
  subscription_status?: string;
  subscription_expiry?: string | null;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isSubscribed: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to pre-fetch critical data after authentication
  const prefetchCriticalData = async () => {
    // Create an array of fetch promises to execute in parallel
    const fetchPromises = [
      // Locations (needed for various features)
      apiRequest('GET', '/api/gbp/locations'),
      // API keys (needed for various integrations)
      apiRequest('GET', '/api/api-keys'),
      // Dashboard data (needed for main client view)
      apiRequest('GET', '/api/client/dashboard')
    ];

    try {
      // Execute all requests in parallel and wait for all to complete
      // before setting user state to ensure sidebar loads with content
      const responses = await Promise.all(fetchPromises);
      
      // Process responses in parallel by mapping them to parsing promises
      const parsePromises = responses.map(async (response, index) => {
        const data = await response.json();
        // Store in query cache based on the endpoint
        const queryKey = index === 0 ? '/api/gbp/locations' : 
                         index === 1 ? '/api/api-keys' : 
                         '/api/client/dashboard';
        
        queryClient.setQueryData([queryKey], data);
        return data;
      });
      
      // Wait for all parsing and caching to complete
      await Promise.all(parsePromises);
      console.log('Critical data pre-fetched in parallel');
      return true;
    } catch (error) {
      console.error('Error pre-fetching critical data:', error);
      return false;
    }
  };

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          setIsLoading(true);
          const response = await getCurrentUser();
          if (response.success && response.user) {
            // Pre-fetch critical data first
            await prefetchCriticalData();
            
            // Only set user after data is loaded to ensure concurrent loading
            setUser(response.user);
          }
        } catch (error) {
          // If token is invalid, clear it
          apiLogoutUser();
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [queryClient]);

  // Login function
  const login = async (data: LoginData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await loginUser(data);
      
      if (response.success && response.user) {
        // Pre-fetch all critical data before setting user
        // This ensures the sidebar and main content load together
        await prefetchCriticalData();
        
        // Only set user after data is loaded
        setUser(response.user);
        
        toast({
          title: "Success",
          description: "You have successfully logged in",
          variant: "default",
        });
      }
    } catch (error: any) {
      setError(error);
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "An error occurred during login",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await registerUser(data);
      
      if (response.success && response.user) {
        // Pre-fetch all critical data before setting user
        // This ensures the sidebar and main content load together
        await prefetchCriticalData();
        
        // Only set user after data is loaded
        setUser(response.user);
        
        toast({
          title: "Success",
          description: "Your account has been created successfully",
          variant: "default",
        });
      }
    } catch (error: any) {
      setError(error);
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "An error occurred during registration",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    apiLogoutUser();
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
      variant: "default",
    });
  };

  // Context value
  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
    isSubscribed: user?.subscription_status === 'active',
    login,
    register,
    logout,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};