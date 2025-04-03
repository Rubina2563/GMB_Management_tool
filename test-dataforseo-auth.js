/**
 * Test script for DataForSEO API authentication
 * 
 * This script tests the new auth method for DataForSEO API
 * to ensure it works properly with environment variables.
 * 
 * Usage: node test-dataforseo-auth.js
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');

/**
 * Test DataForSEO API using axios auth property
 */
async function testDataForSEOAuthMethod() {
  try {
    // Get credentials from environment variables
    const login = process.env.DATA_FOR_SEO_EMAIL;
    const password = process.env.DATA_FOR_SEO_KEY;
    
    if (!login || !password) {
      console.error('❌ Missing DATA_FOR_SEO_EMAIL or DATA_FOR_SEO_KEY environment variables');
      console.log('Please set these variables in your .env file or environment');
      return;
    }
    
    console.log(`📝 Testing DataForSEO API with login: ${login}`);
    
    // Use axios auth property for authentication
    const response = await axios({
      method: 'get',
      url: 'https://api.dataforseo.com/v3/status',
      auth: {
        username: login,
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Authentication successful!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } else {
      console.log(`❌ Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error testing DataForSEO API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testDataForSEOAuthMethod();