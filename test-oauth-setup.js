/**
 * Test script for GBP OAuth setup
 * 
 * This script performs a complete test of the Google Business Profile OAuth setup:
 * 1. Generates an OAuth URL
 * 2. Tests the OAuth status endpoint
 * 3. Simulates an OAuth callback
 */
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOAuthSetup() {
  try {
    console.log('========== TESTING GBP OAUTH SETUP ==========');
    
    // Step 1: Login as admin
    console.log('\n1️⃣ Logging in as admin user...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'  // Correct password from demo credentials
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const authToken = loginResponse.data.token;
    console.log('✓ Successfully logged in, auth token received');
    
    // Step 2: Check current API keys
    console.log('\n2️⃣ Checking current API keys...');
    const apiKeysResponse = await axios.get('http://localhost:5000/api/api-keys', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!apiKeysResponse.data.success) {
      throw new Error('Failed to get API keys: ' + apiKeysResponse.data.message);
    }
    
    const apiKeys = apiKeysResponse.data.api_keys;
    console.log('Current GBP OAuth credentials:');
    console.log('- Client ID:', apiKeys.gbp_client_id || 'Not set');
    console.log('- Client Secret:', apiKeys.gbp_client_secret ? '********' : 'Not set');
    console.log('- Redirect URI:', apiKeys.gbp_redirect_uri || 'Not set');
    
    // Step 3: Try to generate OAuth URL
    console.log('\n3️⃣ Attempting to generate OAuth URL...');
    
    let authUrl;
    try {
      const oauthResponse = await axios.get('http://localhost:5000/api/gbp/oauth/url', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (oauthResponse.data.success) {
        authUrl = oauthResponse.data.auth_url;
        console.log('✓ Successfully generated OAuth URL:');
        console.log(authUrl);
        
        // Extract state parameter
        const urlObj = new URL(authUrl);
        const state = urlObj.searchParams.get('state');
        console.log('- State parameter:', state);
      } else {
        console.log('✗ Failed to generate OAuth URL:', oauthResponse.data.message);
      }
    } catch (error) {
      console.log('✗ Error generating OAuth URL:', error.response?.data?.message || error.message);
    }
    
    // Step 4: Check OAuth status
    console.log('\n4️⃣ Checking OAuth connection status...');
    
    try {
      const statusResponse = await axios.get('http://localhost:5000/api/gbp/oauth/status', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (statusResponse.data.success) {
        const status = statusResponse.data.oauth_status;
        console.log('✓ OAuth status:');
        console.log('- Has credentials:', status.has_credentials);
        console.log('- Is connected:', status.is_connected);
        console.log('- Is expired:', status.is_expired);
        console.log('- Expiry date:', status.expiry || 'N/A');
      } else {
        console.log('✗ Failed to check OAuth status:', statusResponse.data.message);
      }
    } catch (error) {
      console.log('✗ Error checking OAuth status:', error.response?.data?.message || error.message);
    }
    
    // Step 5: Test OAuth callback handling
    if (authUrl) {
      console.log('\n5️⃣ Testing OAuth callback...');
      console.log('To complete the OAuth flow manually:');
      console.log('1. Open the generated URL in a browser');
      console.log('2. Complete the Google authentication process');
      console.log('3. Verify that the callback is properly redirected back to the application');
      
      // Note: We don't actually make the callback request here as it requires user interaction
      // This is just for documentation purposes
    }
    
    console.log('\n========== GBP OAUTH TESTING COMPLETE ==========');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data?.message || error.message);
  }
}

// For ESM, use an immediately invoked async function
(async () => {
  await testOAuthSetup();
})();