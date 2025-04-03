/**
 * Google Business Profile Authorization Service
 * Handles OAuth 2.0 flow for GBP API access
 */

import { google } from 'googleapis';
import { dbService } from '../db';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

class GBPAuthService {
  /**
   * Get OAuth URL for authentication
   * @param userId User ID making the request
   * @returns OAuth URL for authentication
   */
  async getAuthUrl(userId: number): Promise<string> {
    try {
      // Get API keys for the user
      const apiKeys = await dbService.getApiKeys(userId);
      
      if (!apiKeys || !apiKeys.google_client_id || !apiKeys.google_client_secret || !apiKeys.gbp_redirect_uri) {
        throw new Error("Google OAuth credentials not found");
      }
      
      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        apiKeys.google_client_id,
        apiKeys.google_client_secret,
        apiKeys.gbp_redirect_uri
      );
      
      // Generate authentication URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/business.manage',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ],
        prompt: 'consent'
      });
      
      return authUrl;
    } catch (error: any) {
      console.error('Error generating auth URL:', error.message);
      throw error;
    }
  }
  
  /**
   * Exchange authorization code for tokens
   * @param userId User ID making the request
   * @param code Authorization code from Google
   * @returns Token response
   */
  async exchangeCodeForTokens(userId: number, code: string): Promise<TokenResponse> {
    try {
      // Get API keys for the user
      const apiKeys = await dbService.getApiKeys(userId);
      
      if (!apiKeys || !apiKeys.google_client_id || !apiKeys.google_client_secret || !apiKeys.gbp_redirect_uri) {
        throw new Error("Google OAuth credentials not found");
      }
      
      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        apiKeys.google_client_id,
        apiKeys.google_client_secret,
        apiKeys.gbp_redirect_uri
      );
      
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Failed to obtain tokens from Google");
      }
      
      // Return tokens
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000
      };
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error.message);
      throw error;
    }
  }
  
  /**
   * Get OAuth2 client with valid tokens
   * @param userId User ID making the request
   * @returns Authenticated OAuth2 client
   */
  async getAuthClient(userId: number): Promise<any> {
    try {
      // Get API keys for the user
      const apiKeys = await dbService.getApiKeys(userId);
      
      if (!apiKeys || !apiKeys.google_client_id || !apiKeys.google_client_secret || !apiKeys.gbp_redirect_uri) {
        throw new Error("Google OAuth credentials not found");
      }
      
      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        apiKeys.google_client_id,
        apiKeys.google_client_secret,
        apiKeys.gbp_redirect_uri
      );
      
      // Check if we have tokens for the user
      // In a real implementation, these would be stored in the database
      // For now we'll check if they exist in the apiKeys object
      if (!apiKeys.gbp_access_token || !apiKeys.gbp_refresh_token) {
        throw new Error("User not authenticated with Google");
      }
      
      // Set credentials
      oauth2Client.setCredentials({
        access_token: apiKeys.gbp_access_token,
        refresh_token: apiKeys.gbp_refresh_token,
        expiry_date: apiKeys.gbp_token_expiry ? parseInt(apiKeys.gbp_token_expiry) : undefined
      });
      
      // Handle token refresh if needed
      oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
          // Save new access token to database
          await dbService.updateApiKeys(userId, {
            ...apiKeys,
            gbp_access_token: tokens.access_token,
            gbp_token_expiry: tokens.expiry_date?.toString() || (Date.now() + 3600 * 1000).toString()
          });
        }
      });
      
      return oauth2Client;
    } catch (error: any) {
      console.error('Error getting auth client:', error.message);
      throw error;
    }
  }
  
  /**
   * Save OAuth tokens to database
   * @param userId User ID making the request
   * @param tokens Token response from Google
   */
  async saveTokens(userId: number, tokens: TokenResponse): Promise<void> {
    try {
      // Get existing API keys
      const apiKeys = await dbService.getApiKeys(userId);
      
      if (!apiKeys) {
        throw new Error("User API keys not found");
      }
      
      // Update tokens
      await dbService.updateApiKeys(userId, {
        ...apiKeys,
        gbp_access_token: tokens.access_token,
        gbp_refresh_token: tokens.refresh_token,
        gbp_token_expiry: tokens.expiry_date.toString()
      });
    } catch (error: any) {
      console.error('Error saving tokens:', error.message);
      throw error;
    }
  }
}

export const gbpAuthService = new GBPAuthService();