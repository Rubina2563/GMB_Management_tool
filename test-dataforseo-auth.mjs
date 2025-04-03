/**
 * Test script for DataForSEO API authentication
 * 
 * This script tests the new auth method for DataForSEO API
 * to ensure it works properly with environment variables.
 * 
 * Usage: node test-dataforseo-auth.mjs
 */

// Import modules
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

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
      method: 'post',
      url: 'https://api.dataforseo.com/v3/serp/google/organic/task_post',
      auth: {
        username: login,
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify([
        {
          "keyword": "local seo",
          "location_code": 2840,
          "language_code": "en",
          "device": "desktop"
        }
      ])
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