import axios from 'axios';
import { AuthResponse, LoginData, RegisterData, ApiKeysData, ApiKeysResponse, ForgotPasswordData } from '@shared/schema';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // Always include credentials (cookies) with requests
});

// Intercept requests to add token from localStorage if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Health check API function
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Auth API functions
export const loginUser = async (loginData: LoginData): Promise<AuthResponse> => {
  try {
    // Ensure we include credentials to allow the server to set cookies
    const response = await api.post('/auth/login', loginData, {
      withCredentials: true
    });
    
    // Store token in localStorage as a fallback
    // The server will also set an HTTP-only cookie which is more secure
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      console.log('Token stored in localStorage and cookie set by server');
    } else {
      console.warn('No token received from login API');
    }
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const registerUser = async (registerData: RegisterData): Promise<AuthResponse> => {
  try {
    // Ensure we include credentials to allow the server to set cookies
    const response = await api.post('/auth/register', registerData, {
      withCredentials: true
    });
    
    // Store token in localStorage as a fallback
    // The server will also set an HTTP-only cookie which is more secure
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      console.log('Token stored in localStorage and cookie set by server');
    } else {
      console.warn('No token received from register API');
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    // Ensure we include credentials to send the HTTP-only cookie to the server
    const response = await api.get('/auth/me', {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get user info:', error);
    throw error;
  }
};

export const refreshToken = async (): Promise<AuthResponse> => {
  try {
    // Ensure we include credentials to allow the server to set cookies
    const response = await api.post('/auth/refresh-token', {}, {
      withCredentials: true
    });
    
    // Store token in localStorage as a fallback
    // The server will also set an HTTP-only cookie which is more secure
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      console.log('Token refreshed in localStorage and cookie set by server');
    } else {
      console.warn('No token received from refresh-token API');
    }
    
    return response.data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    // Call the logout endpoint to clear the cookie on the server
    // Ensure we include credentials so the server can clear the cookie
    await api.post('/auth/logout', {}, {
      withCredentials: true
    });
    console.log('Server cookie cleared successfully');
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Always remove from localStorage, even if the API call fails
    localStorage.removeItem('auth_token');
    console.log('Token removed from localStorage');
  }
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem('auth_token') !== null;
};

export const loginWithGoogle = () => {
  // Redirect to the Google OAuth endpoint
  window.location.href = '/api/auth/google';
};

export const forgotPassword = async (data: ForgotPasswordData): Promise<{success: boolean, message: string}> => {
  try {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  } catch (error) {
    console.error('Forgot password request failed:', error);
    throw error;
  }
};

// API Keys functions
export const getApiKeys = async (): Promise<ApiKeysResponse> => {
  try {
    const response = await api.get('/api-keys');
    return response.data;
  } catch (error) {
    console.error('Failed to get API keys:', error);
    throw error;
  }
};

export const saveApiKeys = async (apiKeys: ApiKeysData): Promise<ApiKeysResponse> => {
  try {
    const response = await api.post('/api-keys', apiKeys);
    return response.data;
  } catch (error) {
    console.error('Failed to save API keys:', error);
    throw error;
  }
};

export const updateApiKeys = async (apiKeys: ApiKeysData): Promise<ApiKeysResponse> => {
  try {
    const response = await api.put('/api-keys', apiKeys);
    return response.data;
  } catch (error) {
    console.error('Failed to update API keys:', error);
    throw error;
  }
};

// Export the axios instance in case it's needed elsewhere
export default api;
