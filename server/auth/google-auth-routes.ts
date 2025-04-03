/**
 * Google Authentication Routes
 * Handles OAuth 2.0 authentication with Google for user login and API access
 */
import express, { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { generateToken, authenticateToken } from '../auth';
import { storage } from '../storage';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Initiate Google OAuth authentication
 * GET /api/auth/google
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get OAuth credentials from database or environment variables
    const adminUser = await storage.getUserByUsername('admin');
    if (!adminUser) {
      return res.status(500).json({
        success: false,
        message: 'Admin user not found'
      });
    }
    
    const apiKeys = await storage.getApiKeys(adminUser.id);
    if (!apiKeys) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth credentials not configured'
      });
    }
    
    // Get OAuth credentials, prioritizing environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID || apiKeys.google_client_id;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || apiKeys.google_client_secret;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth credentials not configured'
      });
    }
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    // Define OAuth scopes
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];
    
    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',      // Will return a refresh token
      scope: scopes,
      prompt: 'consent',           // Force consent screen to ensure refresh token
      include_granted_scopes: true // Include previously granted scopes
    });
    
    // Redirect user to Google's OAuth consent screen
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Google authentication'
    });
  }
});

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;
    
    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(`/auth-error?error=${encodeURIComponent(error as string)}`);
    }
    
    if (!code) {
      return res.redirect('/auth-error?error=No authorization code received');
    }
    
    // Get OAuth credentials from database or environment variables
    const adminUser = await storage.getUserByUsername('admin');
    if (!adminUser) {
      return res.redirect('/auth-error?error=Admin user not found');
    }
    
    const apiKeys = await storage.getApiKeys(adminUser.id);
    if (!apiKeys) {
      return res.redirect('/auth-error?error=Google OAuth credentials not configured');
    }
    
    // Get OAuth credentials, prioritizing environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID || apiKeys.google_client_id;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || apiKeys.google_client_secret;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    
    if (!clientId || !clientSecret) {
      return res.redirect('/auth-error?error=Google OAuth credentials not configured');
    }
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    
    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const userEmail = userInfo.data.email;
    
    if (!userEmail) {
      return res.redirect('/auth-error?error=Could not retrieve user email');
    }
    
    // Find or create user by email
    let user = await storage.getUserByEmail(userEmail);
    
    if (!user) {
      // If user doesn't exist, use the email as username (or first part of email)
      const username = userEmail.split('@')[0];
      
      // Create a new user
      user = await storage.createUser({
        username,
        email: userEmail,
        password: '', // Empty password for OAuth users
        role: 'client',
        subscription_plan: 'free',
        subscription_status: 'active',
        subscription_expiry: null
      });
    }
    
    // Store tokens in database
    await storage.updateApiKeys(user.id, {
      ...apiKeys,
      google_access_token: tokens.access_token || null,
      google_refresh_token: tokens.refresh_token || null,
      google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
    });
    
    // Generate JWT token for user
    const authToken = generateToken(user);
    
    // Redirect to connection wizard with token
    res.redirect(`/connect-wizard?token=${authToken}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`/auth-error?error=${encodeURIComponent(error.message || 'Failed to authenticate with Google')}`);
  }
});

/**
 * Import Google Business Profile locations for authenticated user
 * GET /api/auth/google/import-gbp-profiles
 */
router.get('/import-gbp-profiles', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user's API keys with stored OAuth tokens
    const apiKeys = await storage.getApiKeys(userId);
    if (!apiKeys) {
      return res.status(400).json({
        success: false,
        message: 'No API keys found for user'
      });
    }

    // Check if we have access tokens
    if (!apiKeys.google_access_token) {
      return res.status(400).json({
        success: false,
        message: 'Google OAuth tokens not found. Please authenticate with Google first.'
      });
    }

    // Get OAuth credentials
    const clientId = process.env.GOOGLE_CLIENT_ID || apiKeys.google_client_id;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || apiKeys.google_client_secret;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth credentials not configured'
      });
    }

    // Create OAuth client and set credentials
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({
      access_token: apiKeys.google_access_token,
      refresh_token: apiKeys.google_refresh_token,
      expiry_date: apiKeys.google_token_expiry ? new Date(apiKeys.google_token_expiry).getTime() : undefined
    });

    // Initialize Google My Business API (using BusinessProfile)
    const mybusiness = google.mybusinessaccountmanagement({
      version: 'v1',
      auth: oauth2Client
    });

    // Try to fetch GBP accounts
    try {
      // Get all accounts
      const accountsResponse = await mybusiness.accounts.list();
      const accounts = accountsResponse.data.accounts || [];

      if (accounts.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No Google Business Profile accounts found for this user',
          locations: []
        });
      }

      // For each account, fetch locations
      const allLocations = [];
      
      for (const account of accounts) {
        try {
          // Initialize locations API
          const locations = google.mybusinessbusinessinformation({
            version: 'v1',
            auth: oauth2Client
          });
          
          const locationsResponse = await locations.accounts.locations.list({
            parent: account.name,
            pageSize: 100
          });
          
          const accountLocations = locationsResponse.data.locations || [];
          allLocations.push(...accountLocations);
        } catch (error: any) {
          console.error(`Error fetching locations for account ${account.name}:`, error);
          // Continue with other accounts
        }
      }

      // Store the locations in the database
      const locations = [];
      
      for (const location of allLocations) {
        try {
          // Extract key information from the location
          const locationData = {
            name: location.title || location.locationName || 'Unnamed Location',
            address: location.address ? JSON.stringify(location.address) : '',
            phone: location.phoneNumbers ? location.phoneNumbers[0] : '',
            website: location.websiteUri || '',
            category: location.primaryCategory ? location.primaryCategory.displayName : '',
            google_location_id: location.name?.split('/').pop() || '',
            latitude: location.latlng?.latitude || 0,
            longitude: location.latlng?.longitude || 0,
            user_id: userId
          };
          
          // Check if this location already exists
          const existingLocation = await storage.getGbpLocationByGoogleId(userId, locationData.google_location_id);
          
          if (existingLocation) {
            // Update existing location
            const updatedLocation = await storage.updateGbpLocation(existingLocation.id, locationData);
            locations.push(updatedLocation);
          } else {
            // Create new location
            const newLocation = await storage.createGbpLocation(locationData);
            locations.push(newLocation);
          }
        } catch (error: any) {
          console.error('Error storing location:', error);
          // Continue with other locations
        }
      }

      // Return the stored locations
      return res.status(200).json({
        success: true,
        message: `Successfully imported ${locations.length} GBP locations`,
        locations
      });
    } catch (error: any) {
      // Check if token is expired
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        try {
          if (!apiKeys.google_refresh_token) {
            throw new Error('No refresh token available');
          }
          
          const refreshResponse = await oauth2Client.refreshAccessToken();
          const tokens = refreshResponse.credentials;
          
          // Update tokens in database
          await storage.updateApiKeys(userId, {
            ...apiKeys,
            google_access_token: tokens.access_token || apiKeys.google_access_token,
            google_refresh_token: tokens.refresh_token || apiKeys.google_refresh_token,
            google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : apiKeys.google_token_expiry
          });
          
          // Suggest retry
          return res.status(401).json({
            success: false,
            message: 'OAuth token refreshed. Please try your request again.',
            shouldRetry: true
          });
        } catch (refreshError: any) {
          console.error('Error refreshing token:', refreshError);
          return res.status(401).json({
            success: false,
            message: 'OAuth token expired and could not be refreshed. Please re-authenticate with Google.',
            shouldReauthenticate: true
          });
        }
      }
      
      // Handle other errors
      console.error('Error fetching GBP profiles:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch Google Business Profile accounts: ' + (error.message || 'Unknown error')
      });
    }
  } catch (error: any) {
    console.error('GBP import error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import Google Business Profile locations'
    });
  }
});

export default router;