/**
 * Google Business Profile OAuth Service
 * 
 * This service handles OAuth 2.0 authentication with Google Business Profile API
 * to obtain and refresh access tokens for API operations.
 */
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface Tokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export class GBPOAuthService {
  private oauthClient: OAuth2Client;
  private scopes: string[];
  private redirectUri: string;

  /**
   * Initialize Google OAuth2 client with credentials
   * @param clientId - Google OAuth client ID
   * @param clientSecret - Google OAuth client secret
   * @param redirectUri - OAuth redirect URI
   */
  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.oauthClient = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    this.redirectUri = redirectUri;
    
    // Define required scopes for Google Business Profile API
    this.scopes = [
      'https://www.googleapis.com/auth/business.manage',        // Main scope for Business Profile management
      'https://www.googleapis.com/auth/userinfo.email',         // Get user email
      'https://www.googleapis.com/auth/userinfo.profile',       // Get basic profile info
      'openid'                                                  // OpenID Connect
    ];
    
    // Log OAuth configuration for debugging
    console.log('OAuth Service initialized with:');
    console.log('- Redirect URI:', this.redirectUri);
    console.log('- Scopes:', this.scopes);
  }

  /**
   * Generate OAuth authorization URL
   * @param userId - User ID to include in state parameter
   * @returns URL for OAuth consent screen
   */
  generateAuthUrl(userId?: number): string {
    return this.oauthClient.generateAuthUrl({
      access_type: 'offline',           // Will return a refresh token
      scope: this.scopes,
      prompt: 'consent',                // Force consent screen to ensure refresh token
      state: userId ? userId.toString() : undefined,  // Pass user ID in state for callback
      include_granted_scopes: true      // Include previously granted scopes
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param code - Authorization code from OAuth callback
   * @returns Object containing access_token, refresh_token, and expiry_date
   */
  async getTokensFromCode(code: string): Promise<Tokens> {
    try {
      const { tokens } = await this.oauthClient.getToken(code);
      
      // Store tokens in the OAuth client for future use
      this.oauthClient.setCredentials(tokens);
      
      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      };
    } catch (error: any) {
      console.error('Error getting tokens from code:', error);
      throw new Error(`Failed to get tokens: ${error.message}`);
    }
  }

  /**
   * Refresh access token using a refresh token
   * @param refreshToken - Refresh token to use
   * @returns New tokens object
   */
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      // Set the refresh token in credentials
      this.oauthClient.setCredentials({
        refresh_token: refreshToken
      });
      
      // Refresh access token
      const { credentials } = await this.oauthClient.refreshAccessToken();
      
      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token,
        expiry_date: credentials.expiry_date
      };
    } catch (error: any) {
      console.error('Error refreshing tokens:', error);
      throw new Error(`Failed to refresh tokens: ${error.message}`);
    }
  }

  /**
   * Set OAuth credentials directly
   * @param tokens - Tokens object containing access_token, refresh_token and expiry_date
   */
  setCredentials(tokens: Tokens): void {
    this.oauthClient.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });
  }

  /**
   * Get configured OAuth client
   * @returns Configured OAuth2Client
   */
  getOAuth2Client(): OAuth2Client {
    return this.oauthClient;
  }

  /**
   * Revoke access tokens
   * @param token - Token to revoke (access or refresh)
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await this.oauthClient.revokeToken(token);
    } catch (error: any) {
      console.error('Error revoking token:', error);
      throw new Error(`Failed to revoke token: ${error.message}`);
    }
  }
}