/**
 * Test script for DataForSEO API integration
 * 
 * This script tests the connection to the DataForSEO API using the
 * credentials from the .env file. It demonstrates how to authenticate
 * and make a basic API call to verify connectivity.
 * 
 * Usage: node test-dataforseo-api.js
 * 
 * Make sure the DATA_FOR_SEO_EMAIL and DATA_FOR_SEO_KEY variables
 * are set in the .env file
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Test DataForSEO API credentials
 * @param {string} login - DataForSEO API login (email)
 * @param {string} password - DataForSEO API password
 */
async function testDataForSEOApi(login, password) {
  console.log('\n🔍 Testing DataForSEO API connectivity...');
  
  try {
    // First, check if we have credentials
    if (!login || !password) {
      console.error('❌ DataForSEO API credentials not found in environment variables');
      console.error('Please set DATA_FOR_SEO_EMAIL and DATA_FOR_SEO_KEY in the .env file');
      return false;
    }
    
    // Create authentication header (Basic Auth)
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // Test a simple endpoint that doesn't require complex parameters
    console.log('Testing connection to the DataForSEO API...');
    const url = 'https://api.dataforseo.com/v3/merchant/google_business_info/locations';
    
    const response = await axios.get(url, { headers });
    
    if (response.status === 200) {
      console.log('✅ Successfully connected to DataForSEO API!');
      console.log('Response status code:', response.status);
      console.log('Status message:', response.data?.status_message);
      
      // Print how many locations are available
      if (response.data?.tasks?.length > 0 && 
          response.data.tasks[0]?.result?.length > 0) {
        const locationsCount = response.data.tasks[0].result.length;
        console.log(`Found ${locationsCount} available locations`);
      }
      
      return true;
    } else {
      console.error('❌ Failed to connect with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to DataForSEO API:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

/**
 * Make a simulated local rankings API call
 * @param {string} login - DataForSEO API login (email)
 * @param {string} password - DataForSEO API password
 */
async function testLocalRankings(login, password) {
  console.log('\n🔍 Testing DataForSEO Local Rankings API...');
  
  try {
    // Create authentication header
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // Local Search API endpoint with simple params
    const url = 'https://api.dataforseo.com/v3/serp/google/organic/task_post';
    
    // Create a simple search task
    const data = {
      "data": [{
        "keyword": "coffee shop",
        "location_code": 1023191,  // San Francisco
        "language_code": "en",
        "device": "desktop",
        "os": "windows",
        "depth": 20
      }]
    };
    
    console.log('Posting search task with keyword:', data.data[0].keyword);
    const response = await axios.post(url, data, { headers });
    
    if (response.status === 200) {
      console.log('✅ Successfully posted search task!');
      console.log('Response status code:', response.status);
      console.log('Status message:', response.data?.status_message);
      
      // Check for task ID
      if (response.data?.tasks?.length > 0 && 
          response.data.tasks[0]?.id) {
        const taskId = response.data.tasks[0].id;
        console.log('Task ID:', taskId);
        console.log('Search task successfully created!');
        return true;
      } else {
        console.error('❌ No task ID found in response');
        return false;
      }
    } else {
      console.error('❌ Failed to post search task with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error posting search task to DataForSEO API:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

/**
 * Run tests for DataForSEO API integration
 */
async function runTests() {
  // Get API credentials from environment variables
  const login = process.env.DATA_FOR_SEO_EMAIL;
  const password = process.env.DATA_FOR_SEO_KEY;
  
  // Test API connectivity first
  const connectionSuccess = await testDataForSEOApi(login, password);
  
  if (connectionSuccess) {
    // If connection successful, try testing local rankings API
    await testLocalRankings(login, password);
  }
  
  console.log('\n👋 Tests completed!');
}

// Run the tests
runTests().catch(console.error);