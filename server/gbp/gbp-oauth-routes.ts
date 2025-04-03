/**
 * Google Business Profile OAuth Routes
 * Handles API routes for GBP OAuth authentication flow
 */
import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { GBPOAuthService } from './gbp-oauth-service';
import { storage } from '../storage';
import { OAuth2Client } from 'google-auth-library';

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
 * Generate OAuth URL for Google Business Profile
 * GET /api/gbp/oauth/url
 */
router.get('/url', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user's API keys to find GBP OAuth credentials
    const apiKeys = await storage.getApiKeys(userId);
    if (!apiKeys) {
      return res.status(400).json({
        success: false,
        message: 'No API keys found for user, please configure GBP API credentials first'
      });
    }

    // Check if required Google Business Profile credentials are available
    if (!apiKeys.gbp_client_id || !apiKeys.gbp_client_secret || !apiKeys.gbp_redirect_uri) {
      return res.status(400).json({
        success: false,
        message: 'Missing required GBP OAuth credentials (client ID, client secret, or redirect URI)'
      });
    }

    // Initialize the OAuth service
    const oauthService = new GBPOAuthService(
      apiKeys.gbp_client_id,
      apiKeys.gbp_client_secret,
      apiKeys.gbp_redirect_uri
    );

    // Generate authorization URL with user ID in state parameter
    const authUrl = oauthService.generateAuthUrl(userId);
    
    console.log('Generated OAuth URL for user', userId, ':', authUrl);

    res.status(200).json({
      success: true,
      auth_url: authUrl
    });
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate OAuth URL'
    });
  }
});

/**
 * Handle OAuth callback for Google Business Profile
 * GET /api/gbp/oauth/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    console.log('OAuth callback received with parameters:', req.query);
    const { code, state, error } = req.query;
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error returned:', error);
      return res.status(400).send(`
        <html>
          <head>
            <title>Authentication Error</title>
            <script>
              window.onload = function() {
                window.opener && window.opener.postMessage(
                  { type: 'oauth-error', error: '${error}' },
                  window.location.origin
                );
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </head>
          <body>
            <h3>Authentication Error</h3>
            <p>Error: ${error}</p>
            <p>Closing window...</p>
          </body>
        </html>
      `);
    }
    
    const userId = state ? parseInt(state as string, 10) : null;

    if (!code || !userId) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Invalid Parameters</title>
            <script>
              window.onload = function() {
                window.opener && window.opener.postMessage(
                  { type: 'oauth-error', error: 'Missing code or user ID' },
                  window.location.origin
                );
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </head>
          <body>
            <h3>Invalid Parameters</h3>
            <p>Missing required OAuth parameters.</p>
            <p>Closing window...</p>
          </body>
        </html>
      `);
    }

    // Get user's API keys to find GBP OAuth credentials
    const apiKeys = await storage.getApiKeys(userId);
    if (!apiKeys) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Configuration Error</title>
            <script>
              window.onload = function() {
                window.opener && window.opener.postMessage(
                  { type: 'oauth-error', error: 'No API keys found for user' },
                  window.location.origin
                );
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </head>
          <body>
            <h3>Configuration Error</h3>
            <p>No API keys found for user.</p>
            <p>Closing window...</p>
          </body>
        </html>
      `);
    }

    // Check if required Google Business Profile credentials are available
    if (!apiKeys.gbp_client_id || !apiKeys.gbp_client_secret || !apiKeys.gbp_redirect_uri) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Configuration Error</title>
            <script>
              window.onload = function() {
                window.opener && window.opener.postMessage(
                  { type: 'oauth-error', error: 'Missing required GBP OAuth credentials' },
                  window.location.origin
                );
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </head>
          <body>
            <h3>Configuration Error</h3>
            <p>Missing required GBP OAuth credentials.</p>
            <p>Closing window...</p>
          </body>
        </html>
      `);
    }

    // Initialize the OAuth service
    const oauthService = new GBPOAuthService(
      apiKeys.gbp_client_id,
      apiKeys.gbp_client_secret,
      apiKeys.gbp_redirect_uri
    );

    // Exchange code for tokens
    const tokens = await oauthService.getTokensFromCode(code as string);

    // Save tokens to database
    await storage.updateApiKeys(userId, {
      ...apiKeys,
      gbp_access_token: tokens.access_token,
      gbp_refresh_token: tokens.refresh_token || apiKeys.gbp_refresh_token, // Keep existing refresh token if not provided
      gbp_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
    });

    // Return success page with postMessage to parent window
    return res.status(200).send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <script>
            window.onload = function() {
              window.opener && window.opener.postMessage(
                { type: 'oauth-success' },
                window.location.origin
              );
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </head>
        <body>
          <h3>Authentication Successful</h3>
          <p>You have successfully connected your Google Business Profile.</p>
          <p>This window will close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return res.status(500).send(`
      <html>
        <head>
          <title>Authentication Error</title>
          <script>
            window.onload = function() {
              window.opener && window.opener.postMessage(
                { type: 'oauth-error', error: '${error.message || 'Unknown error'}' },
                window.location.origin
              );
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </head>
        <body>
          <h3>Authentication Error</h3>
          <p>Error: ${error.message || 'An unknown error occurred'}</p>
          <p>Closing window...</p>
        </body>
      </html>
    `);
  }
});

/**
 * Refresh GBP OAuth tokens
 * POST /api/gbp/oauth/refresh
 */
router.post('/refresh', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user's API keys to find GBP OAuth tokens
    const apiKeys = await storage.getApiKeys(userId);
    if (!apiKeys) {
      return res.status(400).json({
        success: false,
        message: 'No API keys found for user'
      });
    }

    // Check if required Google Business Profile credentials and refresh token are available
    if (!apiKeys.gbp_client_id || !apiKeys.gbp_client_secret || !apiKeys.gbp_redirect_uri || !apiKeys.gbp_refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Missing required GBP OAuth credentials or refresh token'
      });
    }

    // Initialize the OAuth service
    const oauthService = new GBPOAuthService(
      apiKeys.gbp_client_id,
      apiKeys.gbp_client_secret,
      apiKeys.gbp_redirect_uri
    );

    // Refresh token
    const tokens = await oauthService.refreshTokens(apiKeys.gbp_refresh_token);

    // Save updated tokens to database
    await storage.updateApiKeys(userId, {
      ...apiKeys,
      gbp_access_token: tokens.access_token,
      gbp_refresh_token: tokens.refresh_token || apiKeys.gbp_refresh_token, // Keep existing refresh token if not provided
      gbp_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
    });

    res.status(200).json({
      success: true,
      message: 'OAuth tokens refreshed successfully'
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh OAuth tokens'
    });
  }
});

/**
 * Disconnect GBP OAuth connection
 * POST /api/gbp/oauth/disconnect
 */
router.post('/disconnect', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user's API keys
    const apiKeys = await storage.getApiKeys(userId);
    if (!apiKeys) {
      return res.status(400).json({
        success: false,
        message: 'No API keys found for user'
      });
    }

    // Remove OAuth tokens
    await storage.updateApiKeys(userId, {
      ...apiKeys,
      gbp_access_token: null,
      gbp_refresh_token: null,
      gbp_token_expiry: null
    });

    res.status(200).json({
      success: true,
      message: 'GBP OAuth connection successfully disconnected'
    });
  } catch (error: any) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect GBP OAuth connection'
    });
  }
});

/**
 * Test GBP OAuth credentials
 * GET /api/gbp/oauth/test-credentials
 */
router.get('/test-credentials', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user's API keys to find GBP OAuth credentials
    const apiKeys = await storage.getApiKeys(userId);
    if (!apiKeys) {
      return res.status(400).json({
        success: false,
        message: 'No API keys found for user'
      });
    }

    // Check for environment variables first
    const envClientId = process.env.GOOGLE_CLIENT_ID;
    const envClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const envRedirectUri = process.env.GOOGLE_REDIRECT_URI;

    // Print diagnostics
    console.log('OAuth credentials diagnostic:');
    console.log('- Environment variables:');
    console.log('  - GOOGLE_CLIENT_ID:', envClientId ? 'Present' : 'Missing');
    console.log('  - GOOGLE_CLIENT_SECRET:', envClientSecret ? 'Present' : 'Missing');
    console.log('  - GOOGLE_REDIRECT_URI:', envRedirectUri ? 'Present' : 'Missing');
    console.log('- Database credentials:');
    console.log('  - gbp_client_id:', apiKeys.gbp_client_id ? 'Present' : 'Missing');
    console.log('  - gbp_client_secret:', apiKeys.gbp_client_secret ? 'Present' : 'Missing');
    console.log('  - gbp_redirect_uri:', apiKeys.gbp_redirect_uri ? 'Present' : 'Missing');

    // Return diagnostic information
    res.status(200).json({
      success: true,
      diagnostics: {
        environment_variables: {
          has_client_id: !!envClientId,
          has_client_secret: !!envClientSecret,
          has_redirect_uri: !!envRedirectUri,
          redirect_uri: envRedirectUri
        },
        database_credentials: {
          has_client_id: !!apiKeys.gbp_client_id,
          has_client_secret: !!apiKeys.gbp_client_secret,
          has_redirect_uri: !!apiKeys.gbp_redirect_uri,
          redirect_uri: apiKeys.gbp_redirect_uri
        },
        replit_domain: req.headers.host || 'unknown'
      }
    });
  } catch (error: any) {
    console.error('Credentials test error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test OAuth credentials'
    });
  }
});

/**
 * Check GBP OAuth connection status
 * GET /api/gbp/oauth/status
 */
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user's API keys to find GBP OAuth tokens
    const apiKeys = await storage.getApiKeys(userId);
    if (!apiKeys) {
      return res.status(400).json({
        success: false,
        message: 'No API keys found for user'
      });
    }

    // Check if credentials and tokens exist
    const hasCredentials = !!(
      apiKeys.gbp_client_id && 
      apiKeys.gbp_client_secret && 
      apiKeys.gbp_redirect_uri
    );
    
    const isConnected = !!(
      apiKeys.gbp_access_token && 
      apiKeys.gbp_refresh_token
    );
    
    // Check if token is expired
    let isExpired = false;
    if (apiKeys.gbp_token_expiry) {
      const expiryDate = new Date(apiKeys.gbp_token_expiry);
      isExpired = expiryDate < new Date();
    }

    res.status(200).json({
      success: true,
      oauth_status: {
        has_credentials: hasCredentials,
        is_connected: isConnected,
        is_expired: isExpired,
        expiry: apiKeys.gbp_token_expiry
      }
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check OAuth status'
    });
  }
});

/**
 * Test direct OAuth URL generation from environment variables
 * GET /api/gbp/oauth/test-env-direct
 * 
 * This endpoint bypasses the database and uses environment variables directly.
 * Useful for diagnosing issues with Google OAuth configuration.
 */
router.get('/test-env-direct', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get OAuth credentials directly from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({
        success: false,
        message: 'Missing required environment variables for OAuth testing',
        missing: {
          GOOGLE_CLIENT_ID: !clientId,
          GOOGLE_CLIENT_SECRET: !clientSecret,
          GOOGLE_REDIRECT_URI: !redirectUri
        }
      });
    }
    
    // Create OAuth client directly
    const oauthClient = new OAuth2Client(clientId, clientSecret, redirectUri);
    
    // Define required scopes
    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];
    
    // Generate authorization URL directly
    const authUrl = oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      include_granted_scopes: true
    });
    
    console.log('Generated direct OAuth URL from environment variables:', authUrl);
    
    res.status(200).json({
      success: true,
      auth_url: authUrl,
      credentials: {
        client_id: clientId,
        redirect_uri: redirectUri,
        scopes: scopes
      }
    });
  } catch (error: any) {
    console.error('Direct OAuth test error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test direct OAuth URL generation',
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

export default router;