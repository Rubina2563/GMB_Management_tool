import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formatDistanceToNow } from "date-fns";
import { generateToken, comparePassword, authenticateToken, requireAdmin, hashPassword, verifyToken } from "./auth";
import { connectGBP, getGBPLocations } from "./gbp/connect";
import { rankingsService } from "./rankings/rankings-service";
import { reviewsService } from "./reviews/reviews-service";
import citationsRoutes from "./citations/citations-routes";
import citationAuditRoutes from "./citations/citation-audit-routes";
import keywordsRoutes from "./keywords/keywords-routes";
import optimizationsRoutes from "./optimizations/optimizations-routes";
import insightsRoutes from "./optimizations/insights-routes";
import campaignsRoutes from "./campaigns/campaigns-routes";
import clientCampaignsRoutes from "./routes/campaign-routes";
import gbpAuditRoutes from "./gbp/audit-routes";
import gbpAuditApiRoutes from "./gbp/gbp-audit-routes";
import gbpSelectRoutes from './gbp/gbp-select-routes';
import gbpOAuthRoutes from "./gbp/gbp-oauth-routes";
import gbpFaqRoutes from "./gbp/faq-routes";
import gbpDescriptionGeneratorRoutes from "./gbp/description-generator-routes";
import googleAuthRoutes from "./auth/google-auth-routes";
import dashboardRoutes from "./dashboard/dashboard-routes";
import adminRoutes from "./routes/admin";
import rankingsRoutes from "./routes/rankings-routes";
import localOrganicRankingsRoutes from "./routes/local-organic-rankings-routes";
import localLinksRoutes from "./routes/local-links-routes";
import { performanceRoutes } from "./performance/performance-routes";
import nlpRoutes from "./nlp/nlp-routes";
import { LocationService } from "./gbp";
import { NlpService } from "./nlp/nlp-service";
import { competitorsRoutes } from "./competitors/competitors-routes";
import axios from "axios";
import { 
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  apiKeysSchema,
  gbpConnectSchema,
  gbpPostSchema,
  insertGbpPostSchema,
  gbpPostsListSchema,
  gbpPostResponseSchema,
  generatePostSchema,
  generatedPostSchema,
  AuthResponse,
  ApiKeysResponse,
  ApiKeysData,
  GbpLocationsResponse,
  GbpDataResponse,
  GbpPostsList,
  GbpPostResponse,
  GeneratePostData,
  GeneratedPost,
  PostStatus,
  ForgotPasswordData
} from "../shared/schema";
import reviewsRoutes from "./reviews/reviews-routes";
import sentimentRoutes from "./reviews/sentiment-routes";
import languageModelRoutes from "./language-model/language-model-routes";
import dataForSEORoutes from "./dataforseo/dataforseo-routes";
import { router as postAnalyticsRoutes } from "./posts/post-analytics-routes";
import { router as citationsRoutes } from "./citations/citations-routes";

// Track the start time of the server
const serverStartTime = new Date();

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;
    const serverRuntime = formatDistanceToNow(serverStartTime, { addSuffix: false });
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: uptimeString,
      message: "Server is running properly",
      serverRuntime
    });
  });
  
  // Test API keys configuration endpoint - Public, no auth required
  app.get('/api/test-api-config', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'API configuration test endpoint is working',
      features: {
        dataForSEO: {
          testingEndpoint: '/api/test-dataforSEO',
          fields: ['data_for_seo_key', 'data_for_seo_email']
        },
        googlePlaces: {
          testingEndpoint: '/api/test-google-places',
          fields: ['google_api_key', 'google_client_id', 'google_client_secret'] 
        },
        googleBusinessProfile: {
          testingEndpoint: '/api/test-gbp-api',
          fields: ['gbp_client_id', 'gbp_client_secret', 'gbp_redirect_uri']
        }
      }
    });
  });

  // User Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      // Validate the request body
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // First hash the password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user in database with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      
      // Generate token
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        subscription_expiry: user.subscription_expiry,
        created_at: user.created_at
      });

      // Return success response
      const authResponse: AuthResponse = {
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      };

      res.status(201).json(authResponse);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  });

  // User Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      // Validate the request body
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(validatedData.username);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Compare password
      const passwordMatch = await comparePassword(validatedData.password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        subscription_expiry: user.subscription_expiry,
        created_at: user.created_at
      });

      // Set cookie with the token
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1 hour
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      // Return success response with more user data including subscription info
      const authResponse: AuthResponse = {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          subscription_plan: user.subscription_plan,
          subscription_status: user.subscription_status
        },
        token
      };

      res.status(200).json(authResponse);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  });

  // Get current user info
  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json({
      success: true,
      user: req.user
    });
  });
  
  // Refresh token endpoint
  app.post('/api/auth/refresh-token', async (req: any, res) => {
    try {
      // Get the token from authorization header or cookie
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1] || req.cookies.auth_token;
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      // Use verifyToken from auth.ts
      const user = verifyToken(token);
      
      if (!user) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
      }
      
      // Get user from storage
      const fullUser = await storage.getUser(user.id);
      
      if (!fullUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Remove password from user object
      const { password, ...userWithoutPassword } = fullUser;
      
      // Generate new token
      const newToken = generateToken(userWithoutPassword);
      
      // Set cookie with the new token
      res.cookie('auth_token', newToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1 hour, matching TOKEN_EXPIRATION
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      // Return user info and token
      const authResponse: AuthResponse = {
        success: true,
        message: 'Token refreshed successfully',
        user: userWithoutPassword,
        token: newToken
      };
      
      res.json(authResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to refresh token'
      });
    }
  });
  
  // Forgot Password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      // Validate the request body
      const validatedData = forgotPasswordSchema.parse(req.body);
      
      // In a real implementation, this would:
      // 1. Check if the email exists in the database
      // 2. Generate a password reset token
      // 3. Send an email with a reset link
      
      // For this mock implementation, we'll just check if the email exists
      const user = await storage.getUserByEmail(validatedData.email);
      
      // Always return success to prevent email enumeration attacks
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error: any) {
      // Return a generic error message to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    // Clear the auth token cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  // Protected endpoint example
  app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({
      success: true,
      message: 'You have access to this protected resource',
      data: {
        message: 'This is protected data',
        timestamp: new Date().toISOString()
      }
    });
  });

  // Get API keys for current user
  app.get('/api/api-keys', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const apiKeys = await storage.getApiKeys(userId);
      
      const response: ApiKeysResponse = {
        success: true,
        message: 'API keys retrieved successfully',
        api_keys: apiKeys || {
          data_for_seo_key: "",
          data_for_seo_email: "",
          google_api_key: "",
          google_client_id: "",
          google_client_secret: "",
          serp_api_key: ""
        }
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve API keys'
      });
    }
  });

  // Save API keys for current user
  app.post('/api/api-keys', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body
      const validatedData = apiKeysSchema.parse(req.body);
      
      // Save API keys
      const savedKeys = await storage.saveApiKeys(userId, validatedData);
      
      const response: ApiKeysResponse = {
        success: true,
        message: 'API keys saved successfully',
        api_keys: savedKeys
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to save API keys'
      });
    }
  });

  // Update API keys for current user
  app.put('/api/api-keys', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body
      const validatedData = apiKeysSchema.parse(req.body);
      
      // Update API keys
      const updatedKeys = await storage.updateApiKeys(userId, validatedData);
      
      const response: ApiKeysResponse = {
        success: true,
        message: 'API keys updated successfully',
        api_keys: updatedKeys
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update API keys'
      });
    }
  });
  
  // DataForSEO API Test Endpoint
  app.post('/api/test-dataforSEO', authenticateToken, async (req: any, res: Response) => {
    try {
      const { api_key, email } = req.body;
      
      if (!api_key || !email) {
        return res.status(400).json({
          success: false,
          message: "API key and email are required."
        });
      }
      
      // Validate the format of credentials
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailPattern.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format."
        });
      }
      
      // Create the Base64 encoded credentials for Basic Authentication
      // Format: Base64(<DATAFORSEO_EMAIL>:<DATAFORSEO_API_KEY>)
      const credentials = Buffer.from(`${email}:${api_key}`).toString('base64');
      
      // In a production implementation, we would make an actual API call to DataForSEO
      // For example, to the Backlinks API endpoint: /v3/backlinks/summary
      // using the Authorization header: Authorization: Basic <Base64-encoded credentials>
      
      // Simulate API testing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration - we'll assume success based on key length and format
      // In production, we would actually call the DataForSEO API to verify the credentials
      const isValidKey = api_key.length >= 10; // Minimum length check
      
      if (isValidKey) {
        // Return success response with the credentials info
        res.json({
          success: true,
          message: "DataForSEO API credentials are valid.",
          data: {
            accountType: "Professional",
            credits: 1000,
            unlimitedAccess: false,
            authType: "Basic Authentication",
            encodedCredentials: `Basic ${credentials.substring(0, 10)}...` // Only show a part for security
          }
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid DataForSEO API credentials. Please check your API key."
        });
      }
    } catch (error: any) {
      console.error("DataForSEO API test error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to test DataForSEO API."
      });
    }
  });
  
  // Google Places API Search Endpoint
  app.post('/api/search-places', authenticateToken, async (req: any, res: Response) => {
    try {
      const { query, api_key } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required."
        });
      }
      
      if (!api_key) {
        return res.status(400).json({
          success: false,
          message: "Google API key is required."
        });
      }
      
      // Make an actual API call to Google Places API
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${api_key}`;
      
      try {
        // Use axios to make the API call
        const response = await axios.get(url);
        
        if (response.data.status === 'OK') {
          const places = response.data.results;
          
          // Return search results
          res.json({
            success: true,
            message: "Places search completed.",
            places: places
          });
        } else if (response.data.status === 'ZERO_RESULTS') {
          res.json({
            success: true,
            message: "No places found for your search query.",
            places: []
          });
        } else {
          throw new Error(`Google Places API Error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
        }
      } catch (apiError: any) {
        // Check if it's an API key issue
        if (apiError.response && (apiError.response.data.status === 'REQUEST_DENIED' || 
            apiError.response.data.status === 'INVALID_REQUEST')) {
          return res.status(401).json({
            success: false,
            message: `Google Places API error: ${apiError.response.data.error_message || 'Invalid API key or permission denied'}`,
            requiresValidApiKey: true
          });
        }
        
        // Other API errors
        throw apiError;
      }
    } catch (error: any) {
      console.error("Google Places API search error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to search for places."
      });
    }
  });
  
  // Google Places API Test Endpoint
  app.post('/api/test-google-places', authenticateToken, async (req: any, res: Response) => {
    try {
      const { api_key } = req.body;
      
      if (!api_key) {
        return res.status(400).json({
          success: false,
          message: "API key is required."
        });
      }
      
      // Make a test query to the Google Places API
      const testQuery = "cafe";
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(testQuery)}&key=${api_key}`;
      
      try {
        // Use axios to make the API call
        const response = await axios.get(url);
        
        if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
          // API key is valid
          res.json({
            success: true,
            message: "Google Places API key is valid.",
            data: {
              status: response.data.status,
              resultsCount: response.data.results ? response.data.results.length : 0,
              apis: ["Places API"]
            }
          });
        } else {
          // API key is invalid or has issues
          res.status(401).json({
            success: false,
            message: `Google Places API error: ${response.data.status} - ${response.data.error_message || 'Invalid API key or permission denied'}`
          });
        }
      } catch (apiError: any) {
        // Check if it's an API key issue
        if (apiError.response && (apiError.response.data.status === 'REQUEST_DENIED' || 
            apiError.response.data.status === 'INVALID_REQUEST')) {
          return res.status(401).json({
            success: false,
            message: `Google Places API error: ${apiError.response.data.error_message || 'Invalid API key or permission denied'}`
          });
        }
        
        // Other API errors
        throw apiError;
      }
    } catch (error: any) {
      console.error("Google Places API test error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to test Google Places API."
      });
    }
  });
  
  // Google Business Profile API Test Endpoint
  app.post('/api/test-gbp-api', authenticateToken, async (req: any, res: Response) => {
    try {
      const { client_id, client_secret, redirect_uri } = req.body;
      
      if (!client_id || !client_secret || !redirect_uri) {
        return res.status(400).json({
          success: false,
          message: "Client ID, Client Secret, and Redirect URI are required."
        });
      }
      
      // Validate the format of credentials
      const clientIdPattern = /^[\w\-\.]+\.apps\.googleusercontent\.com$/;
      
      if (!clientIdPattern.test(client_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Client ID format. It should end with .apps.googleusercontent.com"
        });
      }
      
      if (!redirect_uri.startsWith('http')) {
        return res.status(400).json({
          success: false,
          message: "Invalid Redirect URI format. It should be a valid URL."
        });
      }
      
      // For a production implementation, we would make an actual API call to Google OAuth
      // For now, we'll validate the format and return a success response
      
      // Generate the OAuth URL that would be used to authorize with Google
      const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
        `client_id=${encodeURIComponent(client_id)}` +
        `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/business.manage')}` +
        `&access_type=offline` +
        `&response_type=code` +
        `&prompt=consent`;
      
      // Return success response
      res.json({
        success: true,
        message: "Google Business Profile API credentials appear valid.",
        data: {
          auth_url: authUrl,
          scopes: ["https://www.googleapis.com/auth/business.manage"],
          next_steps: "Use this auth_url to authorize your application to access Google Business Profile data."
        }
      });
    } catch (error: any) {
      console.error("Google Business Profile API test error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to test Google Business Profile API."
      });
    }
  });

  // =========================================
  // Admin-only endpoints
  // =========================================
  
  // Get all users (admin only)
  app.get('/api/admin/users', requireAdmin, async (req: any, res) => {
    try {
      // In a real implementation, this would query the database
      // For this mock version, we'll return mock data
      const users = await storage.getAllUsers();
      
      // Remove passwords from user objects
      const safeUsers = users.map((user: any) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        users: safeUsers,
        totalUsers: safeUsers.length,
        newUsersToday: 0, // This would be calculated in a real implementation
        activeUsers: safeUsers.length // This would be calculated in a real implementation
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  });
  
  // Get API key usage statistics (admin only)
  app.get('/api/admin/api-keys-stats', requireAdmin, async (req: any, res) => {
    try {
      // In a real implementation, this would query the database
      // For this mock version, we'll return mock data
      const apiKeys = await storage.getAllApiKeys();
      
      // Count valid keys (this would have more sophisticated logic in a real implementation)
      const totalKeys = apiKeys.length;
      const activeKeys = apiKeys.length; // This would be calculated in a real implementation
      const expiredKeys = 0; // This would be calculated in a real implementation
      
      res.status(200).json({
        success: true,
        message: 'API key statistics retrieved successfully',
        stats: {
          totalKeys,
          activeKeys,
          expiredKeys
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve API key statistics'
      });
    }
  });
  
  // Create a new user (admin only)
  app.post('/api/admin/users', requireAdmin, async (req: any, res) => {
    try {
      // Validate the request body
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user in database with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: userWithoutPassword
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create user'
      });
    }
  });
  
  // Set up Google Business Profile API credentials (admin only)
  app.post('/api/admin/google-business-profile/setup', requireAdmin, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { gbp_client_id, gbp_client_secret, gbp_redirect_uri } = req.body;
      
      if (!gbp_client_id || !gbp_client_secret || !gbp_redirect_uri) {
        return res.status(400).json({
          success: false,
          message: 'Client ID, Client Secret, and Redirect URI are required'
        });
      }
      
      // Validate format (basic validation)
      const clientIdPattern = /^[\w\-\.]+\.apps\.googleusercontent\.com$/;
      if (!clientIdPattern.test(gbp_client_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Client ID format. It should end with .apps.googleusercontent.com'
        });
      }
      
      if (!gbp_redirect_uri.startsWith('http')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Redirect URI format. It should be a valid URL.'
        });
      }
      
      // Get existing API keys for this user
      const existingApiKeys = await storage.getApiKeys(userId);
      
      // Update or create API keys with GBP credentials
      let updatedApiKeys;
      if (existingApiKeys) {
        updatedApiKeys = await storage.updateApiKeys(userId, {
          ...existingApiKeys,
          gbp_client_id,
          gbp_client_secret,
          gbp_redirect_uri
        });
      } else {
        updatedApiKeys = await storage.saveApiKeys(userId, {
          gbp_client_id,
          gbp_client_secret,
          gbp_redirect_uri,
          data_for_seo_key: "",
          data_for_seo_email: "",
          google_api_key: "",
          google_client_id: "",
          google_client_secret: "",
          serp_api_key: ""
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Google Business Profile API credentials saved successfully',
        api_keys: {
          gbp_client_id: updatedApiKeys.gbp_client_id,
          gbp_redirect_uri: updatedApiKeys.gbp_redirect_uri,
          // Don't send the client secret back to the client
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set up Google Business Profile API'
      });
    }
  });

  // =========================================
  // GBP Integration endpoints
  // =========================================

  // Connect GBP location
  app.post('/api/gbp/connect', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body
      const validatedData = gbpConnectSchema.parse(req.body);
      
      // Connect to GBP and fetch location data
      const location = await connectGBP(userId, validatedData.location_id);
      
      res.status(200).json({
        success: true,
        message: 'GBP location connected successfully',
        location
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to connect GBP location'
      });
    }
  });

  // Get GBP locations for current user
  app.get('/api/gbp/locations', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get GBP locations for the user
      const locations = await getGBPLocations(userId);
      
      const response: GbpLocationsResponse = {
        success: true,
        message: 'GBP locations retrieved successfully',
        locations
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve GBP locations'
      });
    }
  });

  // Get GBP location by ID
  app.get('/api/gbp/locations/:locationId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = parseInt(req.params.locationId);
      
      if (isNaN(locationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID'
        });
      }
      
      // Get GBP location
      const location = await storage.getGbpLocation(locationId);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'GBP location not found'
        });
      }
      
      // Ensure the user owns this location
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Get additional data for the location
      const googleData = await storage.getGbpData(locationId, 'google_data');
      const serpData = await storage.getGbpData(locationId, 'serp_insights');
      
      const locationWithData = {
        ...location,
        google_data: googleData?.data || null,
        serp_insights: serpData?.data || null
      };
      
      res.status(200).json({
        success: true,
        message: 'GBP location retrieved successfully',
        location: locationWithData
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve GBP location'
      });
    }
  });
  
  // Optimize GBP location (AI-powered suggestions)
  app.post('/api/gbp/optimize', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { locationId, optimizationType = 'all' } = req.body;
      
      if (!locationId) {
        return res.status(400).json({
          success: false,
          message: 'Location ID is required'
        });
      }
      
      // Get GBP location
      const location = await storage.getGbpLocation(parseInt(locationId));
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'GBP location not found'
        });
      }
      
      // Ensure the user owns this location
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Mock OpenAI API response with sample optimization suggestions
      // In a real implementation, this would call the OpenAI API
      
      // Generate suggestions based on the optimization type
      let suggestions;
      
      switch (optimizationType) {
        case 'description':
          suggestions = {
            original: location.description || "This is a business location providing various services.",
            improved: "Experience premium services at our established location. We offer personalized solutions with attention to detail and a commitment to excellence that has made us a trusted name in the industry for over 10 years.",
            changes: [
              "Added descriptive language that highlights premium quality",
              "Included information about business longevity for credibility",
              "Emphasized personalization and attention to detail"
            ],
            impact_score: 85
          };
          break;
          
        case 'category':
          suggestions = {
            current_categories: ["Business Service", "General"],
            recommended_categories: ["Professional Services", "Consulting Agency", "Business Consultant"],
            changes: [
              "Added more specific categories that match your business type",
              "Improved discoverability for relevant search queries",
              "Aligned categories with high-performing competitors"
            ],
            impact_score: 92
          };
          break;
          
        case 'keywords':
          suggestions = {
            current_keywords: ["business", "service", "local"],
            recommended_keywords: ["professional consulting", "business strategy", "expert advice", "premium services", "industry specialists"],
            changes: [
              "Added more descriptive industry-specific keywords",
              "Included service-focused terms that potential clients search for",
              "Incorporated premium positioning keywords to attract ideal clients"
            ],
            impact_score: 88
          };
          break;
          
        default:
          // All optimizations together
          suggestions = {
            description: {
              original: location.description || "This is a business location providing various services.",
              improved: "Experience premium services at our established location. We offer personalized solutions with attention to detail and a commitment to excellence that has made us a trusted name in the industry for over 10 years.",
              impact_score: 85
            },
            categories: {
              current: ["Business Service", "General"],
              recommended: ["Professional Services", "Consulting Agency", "Business Consultant"],
              impact_score: 92
            },
            keywords: {
              current: ["business", "service", "local"],
              recommended: ["professional consulting", "business strategy", "expert advice", "premium services", "industry specialists"],
              impact_score: 88
            },
            overall_impact_score: 90,
            priority_changes: [
              "Update business categories for better industry alignment",
              "Enhance business description with specific services and credibility factors",
              "Add more targeted keywords to improve search visibility"
            ]
          };
      }
      
      res.status(200).json({
        success: true,
        message: 'Optimization suggestions generated successfully',
        optimization_type: optimizationType,
        location_name: location.name,
        suggestions
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate optimization suggestions'
      });
    }
  });

  // =========================================
  // Geo-Grid Rankings endpoints
  // =========================================
  
  // Get geo-grid rankings
  app.get('/api/rankings/geo-grid', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { keyword, location, radius } = req.query;
      
      if (!keyword || !location || !radius) {
        return res.status(400).json({
          success: false,
          message: 'Keyword, location, and radius are required'
        });
      }
      
      // Get geo-grid rankings
      const geoGridData = await rankingsService.getGeoGridRankings(
        userId,
        keyword as string,
        location as string,
        parseInt(radius as string)
      );
      
      res.status(200).json({
        success: true,
        message: 'Geo-grid rankings retrieved successfully',
        data: geoGridData
      });
    } catch (error: any) {
      res.status(error.message === 'DataForSEO API key not configured' ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to retrieve geo-grid rankings'
      });
    }
  });
  
  // Get ranking trends
  app.get('/api/rankings/trends', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { keyword } = req.query;
      
      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: 'Keyword is required'
        });
      }
      
      // Get ranking trends
      const trendsData = await rankingsService.getRankingTrends(
        userId,
        keyword as string
      );
      
      res.status(200).json({
        success: true,
        message: 'Ranking trends retrieved successfully',
        data: trendsData
      });
    } catch (error: any) {
      res.status(error.message === 'DataForSEO API key not configured' ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to retrieve ranking trends'
      });
    }
  });
  
  // Get competitor data
  app.get('/api/rankings/competitors', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get competitor data
      const competitorData = await rankingsService.getCompetitorData(userId);
      
      res.status(200).json({
        success: true,
        message: 'Competitor data retrieved successfully',
        data: competitorData
      });
    } catch (error: any) {
      res.status(error.message === 'DataForSEO API key not configured' ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to retrieve competitor data'
      });
    }
  });

  // =========================================
  // Review Management endpoints
  // =========================================
  
  // Get reviews for a location
  app.get('/api/reviews/:locationId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = req.params.locationId;
      const { sortBy, filterRating } = req.query;
      
      // Get reviews for the location
      const reviewsData = await reviewsService.getReviews(
        userId,
        locationId,
        sortBy as string,
        filterRating ? parseInt(filterRating as string) : undefined
      );
      
      res.status(200).json({
        success: true,
        message: 'Reviews retrieved successfully',
        data: reviewsData
      });
    } catch (error: any) {
      res.status(error.message === 'Google API key not configured' ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to retrieve reviews'
      });
    }
  });
  
  // Reply to a review
  app.post('/api/reviews/:locationId/:reviewId/reply', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = req.params.locationId;
      const reviewId = req.params.reviewId;
      const { replyText } = req.body;
      
      if (!replyText) {
        return res.status(400).json({
          success: false,
          message: 'Reply text is required'
        });
      }
      
      // Reply to the review
      const updatedReview = await reviewsService.replyToReview(
        userId,
        locationId,
        reviewId,
        replyText
      );
      
      res.status(200).json({
        success: true,
        message: 'Reply submitted successfully',
        review: updatedReview
      });
    } catch (error: any) {
      res.status(error.message === 'Google API key not configured' ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to reply to review'
      });
    }
  });
  
  // Send a review request
  app.post('/api/reviews/:locationId/request', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = req.params.locationId;
      const { name, email, phone } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required'
        });
      }
      
      // Send review request
      const request = await reviewsService.sendReviewRequest(
        userId,
        locationId,
        { name, email, phone }
      );
      
      res.status(200).json({
        success: true,
        message: 'Review request sent successfully',
        request
      });
    } catch (error: any) {
      res.status(error.message === 'Google API key not configured' ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to send review request'
      });
    }
  });
  
  // Get review requests for a location
  app.get('/api/reviews/:locationId/requests', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = req.params.locationId;
      
      // Get review requests
      const requests = await reviewsService.getReviewRequests(userId, locationId);
      
      res.status(200).json({
        success: true,
        message: 'Review requests retrieved successfully',
        requests
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve review requests'
      });
    }
  });

  // =========================================
  // GBP Posts Management endpoints
  // =========================================

  // Get all posts for a location
  app.get('/api/posts/:locationId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = parseInt(req.params.locationId);
      
      if (isNaN(locationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID'
        });
      }
      
      // Validate location ownership
      const location = await storage.getGbpLocation(locationId);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
      
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Get posts for the location
      const posts = await storage.getGbpPosts(locationId);
      
      const response: GbpPostsList = {
        success: true,
        message: 'Posts retrieved successfully',
        posts: posts.map(post => ({
          id: post.id,
          location_id: post.location_id,
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          cta_type: post.cta_type,
          cta_url: post.cta_url,
          scheduled_date: post.scheduled_date,
          status: post.status,
          category: post.category,
          tags: post.tags || [],
          published_at: post.published_at
        }))
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve posts'
      });
    }
  });

  // Get a specific post
  app.get('/api/posts/:locationId/:postId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = parseInt(req.params.locationId);
      const postId = parseInt(req.params.postId);
      
      if (isNaN(locationId) || isNaN(postId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID or post ID'
        });
      }
      
      // Validate location ownership
      const location = await storage.getGbpLocation(locationId);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
      
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Get the post
      const post = await storage.getGbpPost(postId);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Validate that the post belongs to the specified location
      if (post.location_id !== locationId) {
        return res.status(400).json({
          success: false,
          message: 'Post does not belong to the specified location'
        });
      }
      
      const response: GbpPostResponse = {
        success: true,
        message: 'Post retrieved successfully',
        post: {
          id: post.id,
          location_id: post.location_id,
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          cta_type: post.cta_type,
          cta_url: post.cta_url,
          scheduled_date: post.scheduled_date,
          status: post.status,
          category: post.category,
          tags: post.tags || [],
          published_at: post.published_at
        }
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve post'
      });
    }
  });

  // Create a new post
  app.post('/api/posts/:locationId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = parseInt(req.params.locationId);
      
      if (isNaN(locationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID'
        });
      }
      
      // Validate location ownership
      const location = await storage.getGbpLocation(locationId);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
      
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Validate request body
      const validatedData = insertGbpPostSchema.parse({
        ...req.body,
        location_id: locationId
      });
      
      // Create the post
      const post = await storage.createGbpPost(validatedData);
      
      const response: GbpPostResponse = {
        success: true,
        message: 'Post created successfully',
        post: {
          id: post.id,
          location_id: post.location_id,
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          cta_type: post.cta_type,
          cta_url: post.cta_url,
          scheduled_date: post.scheduled_date,
          status: post.status,
          category: post.category,
          tags: post.tags || [],
          published_at: post.published_at
        }
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create post'
      });
    }
  });

  // Update a post
  app.put('/api/posts/:locationId/:postId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = parseInt(req.params.locationId);
      const postId = parseInt(req.params.postId);
      
      if (isNaN(locationId) || isNaN(postId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID or post ID'
        });
      }
      
      // Validate location ownership
      const location = await storage.getGbpLocation(locationId);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
      
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Get the post
      const existingPost = await storage.getGbpPost(postId);
      
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Validate that the post belongs to the specified location
      if (existingPost.location_id !== locationId) {
        return res.status(400).json({
          success: false,
          message: 'Post does not belong to the specified location'
        });
      }
      
      // Validate request body
      const validatedData = gbpPostSchema.partial().parse(req.body);
      
      // Update the post
      const post = await storage.updateGbpPost(postId, validatedData);
      
      const response: GbpPostResponse = {
        success: true,
        message: 'Post updated successfully',
        post: {
          id: post!.id,
          location_id: post!.location_id,
          title: post!.title,
          content: post!.content,
          image_url: post!.image_url,
          cta_type: post!.cta_type,
          cta_url: post!.cta_url,
          scheduled_date: post!.scheduled_date,
          status: post!.status,
          category: post!.category,
          tags: post!.tags || [],
          published_at: post!.published_at
        }
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update post'
      });
    }
  });

  // Update post status
  app.put('/api/posts/:locationId/:postId/status', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = parseInt(req.params.locationId);
      const postId = parseInt(req.params.postId);
      const { status } = req.body;
      
      if (isNaN(locationId) || isNaN(postId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID or post ID'
        });
      }
      
      if (!status || !['draft', 'scheduled', 'published', 'failed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: draft, scheduled, published, failed'
        });
      }
      
      // Validate location ownership
      const location = await storage.getGbpLocation(locationId);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
      
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Get the post
      const existingPost = await storage.getGbpPost(postId);
      
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Validate that the post belongs to the specified location
      if (existingPost.location_id !== locationId) {
        return res.status(400).json({
          success: false,
          message: 'Post does not belong to the specified location'
        });
      }
      
      // Update the post status
      const post = await storage.updateGbpPostStatus(postId, status as PostStatus);
      
      const response: GbpPostResponse = {
        success: true,
        message: 'Post status updated successfully',
        post: {
          id: post!.id,
          location_id: post!.location_id,
          title: post!.title,
          content: post!.content,
          image_url: post!.image_url,
          cta_type: post!.cta_type,
          cta_url: post!.cta_url,
          scheduled_date: post!.scheduled_date,
          status: post!.status,
          category: post!.category,
          tags: post!.tags || [],
          published_at: post!.published_at
        }
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update post status'
      });
    }
  });

  // Delete a post
  app.delete('/api/posts/:locationId/:postId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = parseInt(req.params.locationId);
      const postId = parseInt(req.params.postId);
      
      if (isNaN(locationId) || isNaN(postId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID or post ID'
        });
      }
      
      // Validate location ownership
      const location = await storage.getGbpLocation(locationId);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
      
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Get the post
      const existingPost = await storage.getGbpPost(postId);
      
      if (!existingPost) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      // Validate that the post belongs to the specified location
      if (existingPost.location_id !== locationId) {
        return res.status(400).json({
          success: false,
          message: 'Post does not belong to the specified location'
        });
      }
      
      // Delete the post
      const deleted = await storage.deleteGbpPost(postId);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete post'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete post'
      });
    }
  });

  // Generate post content using AI
  app.post('/api/posts/:locationId/generate', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locationId = parseInt(req.params.locationId);
      
      if (isNaN(locationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID'
        });
      }
      
      // Validate location ownership
      const location = await storage.getGbpLocation(locationId);
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }
      
      if (location.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this location'
        });
      }
      
      // Validate request body
      const validatedData = generatePostSchema.parse(req.body);
      
      // Mock AI-generated content
      // In a real implementation, this would call the OpenAI API
      const mockGeneratedPost: GeneratedPost = {
        title: `${location.name} ${validatedData.service_type} - ${validatedData.tone} tone`,
        content: `This is an AI-generated post about ${validatedData.service_type} for ${location.name}. Created based on prompt: "${validatedData.prompt}". The business is located at ${location.address}.`,
        image_prompt: `A professional image related to ${validatedData.service_type} for ${location.name} in a ${validatedData.tone} style`
      };
      
      res.status(200).json({
        success: true,
        message: 'Post content generated successfully',
        generated_post: mockGeneratedPost
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to generate post content'
      });
    }
  });

  // =========================================
  // Citations endpoints
  // =========================================
  
  // Mount the citations routes
  app.use('/api/citations', citationsRoutes);
  
  // Mount the citation audit routes
  app.use('/api/client/citations', citationAuditRoutes);

  // Mount the keywords routes
  app.use('/api/keywords', keywordsRoutes);
  
  // Mount the optimization routes
  app.use('/api/gbp', optimizationsRoutes);
  
  // Mount the campaigns routes
  app.use('/api/campaigns', campaignsRoutes);
  
  // Mount the reviews routes
  app.use('/api/client/reviews', reviewsRoutes);
  
  // Mount sentiment analysis routes
  app.use('/api/client/reviews', sentimentRoutes);
  
  // Mount the GBP audit routes
  app.use('/api/client/gbp', gbpAuditRoutes);
  
  // Mount the GBP audit API routes for detailed business data
  app.use('/api/client/gbp-audit', gbpAuditApiRoutes);
  
  // Register client GBP FAQ routes
  app.use('/api/client/gbp-faq', gbpFaqRoutes);
  
  // Register the insights routes
  app.use('/api/client/optimization', insightsRoutes);
  app.use('/api/client/dashboard', dashboardRoutes);
  
  // Register post analytics routes
  app.use('/api/client/posts', postAnalyticsRoutes);
  app.use('/api/client/citations', citationsRoutes);
  app.use('/api/client/performance', performanceRoutes);
  
  // Register competitors routes for comparing performance against local competitors
  // Competitor routes are now registered at the bottom of the file with proper service initialization
  
  // =========================================
  // Dashboard endpoints
  // =========================================

  // Admin Dashboard Data
  app.get('/api/admin/dashboard', authenticateToken, requireAdmin, (req, res) => {
    // Mock data for admin dashboard
    const adminDashboardData = {
      success: true,
      data: {
        totalUsers: 125,
        activeSubscriptions: {
          basic: 45,
          pro: 62,
          free: 18,
          total: 125
        },
        apiUsage: {
          total: 28750,
          currentMonthPercentChange: 12.5,
          breakdown: {
            serp: 15320,
            gbp: 8430,
            citations: 5000
          }
        },
        recentActivity: [
          {
            id: 1,
            type: 'new_user',
            description: 'New user registered: sarah.johnson@example.com',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
          },
          {
            id: 2,
            type: 'subscription_change',
            description: 'User upgraded to Pro: mark.smith@example.com',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
          },
          {
            id: 3,
            type: 'api_limit',
            description: 'API usage limit approaching for user: techcompany@example.com',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
          },
          {
            id: 4,
            type: 'account_issue',
            description: 'Failed login attempts detected: john.doe@example.com',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
          },
          {
            id: 5,
            type: 'new_user',
            description: 'New user registered: alex.wong@example.com',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
          }
        ],
        systemHealth: {
          status: 'healthy',
          uptime: '99.98%',
          apiLatency: '42ms',
          databaseStatus: 'optimal'
        }
      }
    };
    
    res.json(adminDashboardData);
  });

  // Use the dashboard routes imported at the top of the file
  app.use('/api/client/dashboard', dashboardRoutes);
  
  // Use the admin routes imported at the top of the file
  app.use('/api/admin', adminRoutes);
  
  // Language Model routes for AI content generation
  app.use('/api/client/language-model', languageModelRoutes);
  
  // Google Business Profile OAuth routes
  app.use('/api/gbp/oauth', gbpOAuthRoutes);
  
  // Google Authentication routes for user login
  app.use('/api/auth/google', googleAuthRoutes);
  
  // DataForSEO API routes for rank tracking
  app.use('/api/admin/dataforseo', dataForSEORoutes);
  app.use('/api/client/dataforseo', dataForSEORoutes);
  app.use('/api/client/gbp-audit', gbpAuditApiRoutes);
  
  // GBP Select Routes - for profile selection
  app.use('/api/client/gbp', gbpSelectRoutes);
  
  // Client Campaign Routes - for campaign management
  app.use('/api/client/campaigns', clientCampaignsRoutes);
  
  // Keyword analysis and optimization routes
  app.use('/api/client/keywords', keywordsRoutes);
  
  // Rankings Routes - for geo-grid rankings
  app.use('/api/client/rankings', rankingsRoutes);
  
  // Register local organic rankings routes
  app.use('/api/client/local-organic-rankings', localOrganicRankingsRoutes);
  
  // Local Links routes
  app.use('/api/client/local-links', localLinksRoutes);
  
  // Description Generator routes
  app.use('/api/client', gbpDescriptionGeneratorRoutes);
  
  // NLP routes
  app.use('/api/nlp', nlpRoutes);
  
  // Mount the competitors routes
  const locationService = new LocationService(storage);
  const nlpService = new NlpService();
  app.use('/api/client/competitors', competitorsRoutes(locationService, nlpService));

  const httpServer = createServer(app);

  return httpServer;
}