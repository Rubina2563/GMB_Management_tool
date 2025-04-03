/**
 * Initialize OAuth Credentials
 * 
 * This utility script loads Google OAuth credentials from environment variables
 * and stores them in the database for the admin user.
 */
import dotenv from 'dotenv';
import { storage } from './storage';

dotenv.config();

async function initOAuthCredentials() {
  try {
    console.log('Initializing OAuth credentials from environment variables...');
    
    // Load environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    let redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    // If we're missing the redirect URI but we have a REPLIT_SLUG, construct it
    if (!redirectUri && process.env.REPLIT_SLUG && process.env.REPL_OWNER) {
      const replitSlug = process.env.REPLIT_SLUG;
      const replitOwner = process.env.REPL_OWNER;
      redirectUri = `https://${replitSlug}.${replitOwner.toLowerCase()}.repl.co/api/gbp/oauth/callback`;
      console.log(`Constructed redirect URI from Replit environment: ${redirectUri}`);
    }
    
    if (!clientId || !clientSecret) {
      console.log('Missing OAuth client ID or client secret. Skipping initialization.');
      return;
    }
    
    if (!redirectUri) {
      console.log('Missing redirect URI and unable to construct one. Skipping initialization.');
      return;
    }
    
    console.log('Using redirect URI:', redirectUri);
    
    // Get admin user (ID 1)
    const adminUserId = 1;
    
    // Get existing API keys for admin
    const existingKeys = await storage.getApiKeys(adminUserId);
    
    if (!existingKeys) {
      console.log('No API keys found for admin user. Creating new API keys entry.');
      
      // Create new API keys entry with OAuth credentials
      await storage.saveApiKeys(adminUserId, {
        data_for_seo_key: "",
        data_for_seo_email: "",
        google_api_key: process.env.VITE_GOOGLE_MAPS_API_KEY || "",
        google_client_id: clientId,
        google_client_secret: clientSecret,
        gbp_client_id: clientId, // Use same credentials for GBP
        gbp_client_secret: clientSecret,
        gbp_redirect_uri: redirectUri,
        gbp_access_token: "",
        gbp_refresh_token: "",
        gbp_token_expiry: "",
        serp_api_key: "",
        language_model_provider: "",
        openai_api_key: "",
        claude_api_key: "",
        grok_api_key: "",
        deepseek_api_key: "",
        geo_grid_api_preference: ""
      });
    } else {
      console.log('Updating OAuth credentials for admin user.');
      
      // Update existing API keys with OAuth credentials
      await storage.updateApiKeys(adminUserId, {
        ...existingKeys,
        google_client_id: clientId,
        google_client_secret: clientSecret,
        gbp_client_id: clientId, // Use same credentials for GBP
        gbp_client_secret: clientSecret,
        gbp_redirect_uri: redirectUri
      });
    }
    
    console.log('OAuth credentials initialized successfully!');
  } catch (error) {
    console.error('Error initializing OAuth credentials:', error);
  }
}

export { initOAuthCredentials };