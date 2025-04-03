/**
 * Test script for DataForSEO API Live Search Endpoint
 * 
 * This script tests the DataForSEO live search endpoint which
 * returns results immediately without using the task system.
 * 
 * Usage: node test-dataforseo-live.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Test DataForSEO live search endpoint
 */
async function testLiveSearch() {
  try {
    // Get API credentials from env vars
    const login = process.env.DATA_FOR_SEO_EMAIL;
    const password = process.env.DATA_FOR_SEO_KEY;
    
    if (!login || !password) {
      console.error('❌ Missing API credentials. Please set DATA_FOR_SEO_EMAIL and DATA_FOR_SEO_KEY in .env file');
      return;
    }
    
    console.log('\n🔍 Testing DataForSEO Live Search...');
    
    // Create authentication header
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // API endpoint for live search - try regular instead of advanced
    const url = 'https://api.dataforseo.com/v3/serp/google/organic/live/regular';
    
    // Search parameters with proper formatting
    const data = {
      "data": [{
        "keyword": "coffee shop",
        "location_name": "San Francisco,California,United States",
        "language_name": "English",
        "device": "desktop",
        "os": "windows"
      }]
    };
    
    console.log(`Searching for: "${data.data[0].keyword}" in location "${data.data[0].location_name}"`);
    
    // Make the API request
    const response = await axios.post(url, data, { headers });
    
    // Check for results
    if (response.status === 200 && 
        response.data?.tasks?.length > 0 &&
        response.data.tasks[0]?.status_message === "Ok.") {
      
      console.log('✅ Search request successful!');
      
      // Extract organic results
      if (response.data.tasks[0]?.result?.length > 0 &&
          response.data.tasks[0].result[0]?.items?.length > 0) {
        
        const results = response.data.tasks[0].result[0].items;
        console.log(`Found ${results.length} search results!`);
        
        // Look for a business in the results
        const businessName = "Starbucks";
        const position = findBusinessInResults(results, businessName);
        
        if (position > 0) {
          console.log(`🌟 "${businessName}" found at position ${position}!`);
        } else {
          console.log(`❓ "${businessName}" not found in search results`);
        }
        
        // Print the first 3 results
        console.log('\n📋 Top 3 search results:');
        for (let i = 0; i < Math.min(3, results.length); i++) {
          const result = results[i];
          console.log(`${result.position}. ${result.title}`);
          console.log(`   URL: ${result.url}`);
          if (result.description) {
            console.log(`   Description: ${result.description.substring(0, 100)}...`);
          }
          if (result.rating?.rating_value) {
            console.log(`   Rating: ${result.rating.rating_value}/5 (${result.rating.rating_count} reviews)`);
          }
          console.log();
        }
      } else {
        console.log('❌ No items found in result');
        console.log('Result data:', JSON.stringify(response.data.tasks[0]?.result, null, 2));
      }
    } else {
      console.error('❌ Search request failed');
      console.error('Status message:', response.data?.tasks?.[0]?.status_message);
      console.error('Response data:', JSON.stringify(response.data, null, 2));
    }
    
    console.log('👋 Live search test completed!');
    
  } catch (error) {
    console.error('❌ Error in DataForSEO live search test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

/**
 * Find a business in search results
 * @param {Array} results - Search results
 * @param {string} businessName - Name of the business to find
 * @returns {number} Position (1-based) or -1 if not found
 */
function findBusinessInResults(results, businessName) {
  if (!results || results.length === 0) {
    return -1;
  }
  
  // Normalize business name for matching
  const normalizedBusinessName = businessName.toLowerCase();
  
  // First pass: Look for exact substring match
  for (let i = 0; i < results.length; i++) {
    if (results[i].title && 
        results[i].title.toLowerCase().includes(normalizedBusinessName)) {
      return results[i].position;
    }
  }
  
  // Second pass: Look for partial word matches
  for (let i = 0; i < results.length; i++) {
    if (results[i].title) {
      const title = results[i].title.toLowerCase();
      const businessWords = normalizedBusinessName.split(/\s+/);
      
      // Check if any significant word from business name appears in title
      for (const word of businessWords) {
        if (word.length > 3 && title.includes(word)) {
          return results[i].position;
        }
      }
    }
  }
  
  return -1;
}

// Run the test
testLiveSearch().catch(console.error);