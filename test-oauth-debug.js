/**
 * OAuth Debug Script
 * 
 * This script tests the Google OAuth configuration and diagnoses common issues.
 * It helps troubleshoot the 403 error that can occur during authentication.
 * 
 * Usage: node test-oauth-debug.js
 */
import 'dotenv/config';
import { google } from 'googleapis';

async function debugOAuth() {
  console.log('=== Google OAuth Debug Tool ===');
  console.log('\nChecking environment variables:');
  
  // Check if env variables exist
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  
  console.log(`GOOGLE_CLIENT_ID: ${clientId ? '✓ Found' : '✗ Missing'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${clientSecret ? '✓ Found' : '✗ Missing'}`);
  console.log(`GOOGLE_REDIRECT_URI: ${redirectUri ? '✓ Found' : '✗ Missing'}`);
  
  if (redirectUri) {
    console.log(`  Value: ${redirectUri}`);
    
    // Parse the domain to check if it's a valid URL
    try {
      const url = new URL(redirectUri);
      console.log(`  Domain: ${url.hostname}`);
      console.log(`  Path: ${url.pathname}`);
      
      // Check if it's a Replit domain
      if (url.hostname.includes('repl')) {
        console.log('  ✓ Appears to be a Replit domain');
      } else {
        console.log('  ⚠️ Not a Replit domain - make sure this domain is authorized in Google Cloud Console');
      }
      
      // Check if the path looks correct
      if (url.pathname.includes('callback') || url.pathname.includes('oauth')) {
        console.log('  ✓ Path appears to be a valid callback endpoint');
      } else {
        console.log('  ⚠️ Path may not be a valid callback endpoint');
      }
    } catch (error) {
      console.log(`  ✗ Not a valid URL: ${error.message}`);
    }
  }
  
  // If we have enough info, test creating an OAuth client
  if (clientId && clientSecret && redirectUri) {
    try {
      console.log('\nTesting OAuth client creation:');
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      console.log('  ✓ OAuth client created successfully');
      
      // Generate a test URL
      const scopes = [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
      ];
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        include_granted_scopes: true
      });
      
      console.log('  ✓ Authorization URL generated successfully');
      console.log(`\nTest authorization URL:\n${authUrl}`);
      console.log('\nNotes:');
      console.log('- If clicking this URL results in a 403 error, check the OAuth consent screen settings in Google Cloud Console');
      console.log('- Make sure the app is either in "Testing" mode with your email added as a test user, or "In production" if it has been verified');
      console.log('- Verify that the Business Profile API is enabled for your project');
      console.log('- Confirm that the redirect URI in Google Cloud Console exactly matches the value printed above');
    } catch (error) {
      console.log(`  ✗ Failed to create OAuth client: ${error.message}`);
    }
  } else {
    console.log('\n✗ Cannot test OAuth client - missing required environment variables');
  }
  
  // Check for Replit domain variables
  console.log('\nChecking Replit environment:');
  const replitSlug = process.env.REPLIT_SLUG;
  const replitOwner = process.env.REPL_OWNER;
  const replitId = process.env.REPL_ID;
  
  console.log(`REPLIT_SLUG: ${replitSlug || 'Not available'}`);
  console.log(`REPL_OWNER: ${replitOwner || 'Not available'}`);
  console.log(`REPL_ID: ${replitId || 'Not available'}`);
  
  if (replitSlug && replitOwner) {
    const constructedUrl = `https://${replitSlug}.${replitOwner.toLowerCase()}.repl.co/api/gbp/oauth/callback`;
    console.log(`\nConstructed Replit URL: ${constructedUrl}`);
    
    if (redirectUri && redirectUri !== constructedUrl) {
      console.log('⚠️ Warning: GOOGLE_REDIRECT_URI does not match the constructed Replit URL');
      console.log('   This might be intentional, but make sure the URL in Google Cloud Console matches the one being used');
    }
  }
  
  console.log('\n=== Debugging Complete ===');
  console.log('Next steps:');
  console.log('1. Make sure the redirect URI in the .env file matches what is configured in Google Cloud Console');
  console.log('2. Check the OAuth consent screen and verify the app is properly published/in testing');
  console.log('3. Ensure necessary APIs are enabled in the Google Cloud Console project');
  console.log('4. If still seeing 403 errors, verify your Google account has been added as a test user in the OAuth consent screen settings');
}

debugOAuth().catch(error => {
  console.error('Error during OAuth debugging:', error);
});