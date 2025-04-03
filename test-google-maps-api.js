/**
 * Test script for Google Maps API integration
 * 
 * This script tests the connection to the Google Maps API using the
 * credentials from the .env file. It demonstrates how to authenticate
 * and make a basic API call to verify connectivity.
 * 
 * Usage: node test-google-maps-api.js
 * 
 * Make sure the GOOGLE_MAPS_API_KEY variable is set in the .env file
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Test Google Maps API connectivity
 * @param {string} apiKey - Google Maps API key
 */
async function testGoogleMapsApi(apiKey) {
  try {
    console.log('Testing Google Maps API with provided key');
    
    // Make a simple API call to test the key - geocoding is commonly available
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`);
    
    if (response.status === 200) {
      if (response.data.status === 'OK') {
        console.log('✅ Google Maps API connection successful!');
        console.log('Response status:', response.data.status);
        console.log('First result:', JSON.stringify(response.data.results[0]?.formatted_address, null, 2));
        return true;
      } else {
        console.error(`❌ Google Maps API error: ${response.data.status}`);
        console.error(`Error message: ${response.data.error_message || 'No specific error message'}`);
        return false;
      }
    } else {
      console.error(`❌ Google Maps API returned status code: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Google Maps API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

/**
 * Test Google Places API specifically
 * @param {string} apiKey - Google Maps API key
 */
async function testGooglePlacesApi(apiKey) {
  try {
    console.log('\nTesting Google Places API with provided key');
    
    // Make a simple API call to test - nearby search is a Places API feature
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.7749,-122.4194&radius=1500&type=restaurant&key=${apiKey}`
    );
    
    if (response.status === 200) {
      if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
        console.log('✅ Google Places API connection successful!');
        console.log('Response status:', response.data.status);
        console.log('Results count:', response.data.results?.length || 0);
        if (response.data.results?.length > 0) {
          console.log('First place:', JSON.stringify({
            name: response.data.results[0].name,
            address: response.data.results[0].vicinity
          }, null, 2));
        }
        return true;
      } else {
        console.error(`❌ Google Places API error: ${response.data.status}`);
        console.error(`Error message: ${response.data.error_message || 'No specific error message'}`);
        return false;
      }
    } else {
      console.error(`❌ Google Places API returned status code: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Google Places API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

/**
 * Run tests for Google Maps API integration
 */
async function runTests() {
  // Get API key from environment
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Google Maps API key not found in environment variables!');
    console.error('Please set GOOGLE_MAPS_API_KEY environment variable.');
    return;
  }
  
  // Test Maps API
  const mapsTest = await testGoogleMapsApi(apiKey);
  
  // Test Places API
  const placesTest = await testGooglePlacesApi(apiKey);
  
  // Summary
  console.log('\n--- Test Summary ---');
  console.log(`Google Maps API: ${mapsTest ? '✅ Successful' : '❌ Failed'}`);
  console.log(`Google Places API: ${placesTest ? '✅ Successful' : '❌ Failed'}`);
  
  // Provide guidance based on results
  if (!mapsTest || !placesTest) {
    console.log('\n--- Troubleshooting Tips ---');
    console.log('1. Check if the API key is correct');
    console.log('2. Verify that the following APIs are enabled in Google Cloud Console:');
    console.log('   - Maps JavaScript API');
    console.log('   - Places API');
    console.log('   - Geocoding API');
    console.log('3. Ensure the API key has no restrictions or the proper restrictions set');
  }
}

// Run the tests
runTests().catch(console.error);