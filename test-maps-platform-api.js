/**
 * Test script for Google Maps Platform API integration
 * 
 * This script tests various Google Maps Platform APIs including:
 * - Geocoding API
 * - Places API
 * - Directions API
 * 
 * Usage: node test-maps-platform-api.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Test Google Maps Platform Geocoding API
 * @param {string} apiKey - Google Maps Platform API key
 */
async function testGeocodingApi(apiKey) {
  try {
    console.log('Testing Google Maps Platform Geocoding API');
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`
    );
    
    if (response.status === 200 && response.data.status === 'OK') {
      console.log('✅ Geocoding API connection successful!');
      console.log('Response status:', response.data.status);
      console.log('First result:', response.data.results[0]?.formatted_address);
      return true;
    } else {
      console.error(`❌ Geocoding API error: ${response.data.status}`);
      console.error(`Error message: ${response.data.error_message || 'No specific error message'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Geocoding API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

/**
 * Test Google Maps Platform Places API
 * @param {string} apiKey - Google Maps Platform API key
 */
async function testPlacesApi(apiKey) {
  try {
    console.log('\nTesting Google Maps Platform Places API');
    
    // Test nearby search endpoint
    const nearbyResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.7749,-122.4194&radius=1500&type=restaurant&key=${apiKey}`
    );
    
    if (nearbyResponse.status === 200 && 
        (nearbyResponse.data.status === 'OK' || nearbyResponse.data.status === 'ZERO_RESULTS')) {
      console.log('✅ Places API (Nearby Search) connection successful!');
      console.log('Response status:', nearbyResponse.data.status);
      console.log('Results count:', nearbyResponse.data.results?.length || 0);
      
      // Test place details endpoint
      if (nearbyResponse.data.results?.length > 0) {
        const placeId = nearbyResponse.data.results[0].place_id;
        console.log(`First place name: ${nearbyResponse.data.results[0].name}`);
        
        const detailsResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,formatted_phone_number&key=${apiKey}`
        );
        
        if (detailsResponse.status === 200 && detailsResponse.data.status === 'OK') {
          console.log('✅ Places API (Place Details) connection successful!');
          console.log('Place details:', JSON.stringify({
            name: detailsResponse.data.result.name,
            address: detailsResponse.data.result.formatted_address,
            rating: detailsResponse.data.result.rating,
            phone: detailsResponse.data.result.formatted_phone_number
          }, null, 2));
        } else {
          console.error(`❌ Places API (Place Details) error: ${detailsResponse.data.status}`);
        }
      }
      
      return true;
    } else {
      console.error(`❌ Places API error: ${nearbyResponse.data.status}`);
      console.error(`Error message: ${nearbyResponse.data.error_message || 'No specific error message'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Places API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

/**
 * Test Google Maps Platform Directions API
 * @param {string} apiKey - Google Maps Platform API key
 */
async function testDirectionsApi(apiKey) {
  try {
    console.log('\nTesting Google Maps Platform Directions API');
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=Chicago,IL&destination=Los+Angeles,CA&key=${apiKey}`
    );
    
    if (response.status === 200 && response.data.status === 'OK') {
      console.log('✅ Directions API connection successful!');
      console.log('Response status:', response.data.status);
      console.log('Routes found:', response.data.routes.length);
      console.log('First leg distance:', response.data.routes[0]?.legs[0]?.distance?.text);
      console.log('First leg duration:', response.data.routes[0]?.legs[0]?.duration?.text);
      return true;
    } else {
      console.error(`❌ Directions API error: ${response.data.status}`);
      console.error(`Error message: ${response.data.error_message || 'No specific error message'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Directions API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

/**
 * Run all tests for Google Maps Platform APIs
 */
async function runTests() {
  // Get API key from environment variable
  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Google Maps Platform API key not found in environment variables!');
    console.error('Please set GOOGLE_MAPS_PLATFORM_API_KEY environment variable.');
    return;
  }
  
  // Run tests
  const geocodingResult = await testGeocodingApi(apiKey);
  const placesResult = await testPlacesApi(apiKey);
  const directionsResult = await testDirectionsApi(apiKey);
  
  // Display summary
  console.log('\n--- Test Summary ---');
  console.log(`Geocoding API: ${geocodingResult ? '✅ Successful' : '❌ Failed'}`);
  console.log(`Places API: ${placesResult ? '✅ Successful' : '❌ Failed'}`);
  console.log(`Directions API: ${directionsResult ? '✅ Successful' : '❌ Failed'}`);
  
  if (!geocodingResult || !placesResult || !directionsResult) {
    console.log('\n--- Troubleshooting Tips ---');
    console.log('1. Verify the following APIs are enabled in your Google Cloud Console:');
    console.log('   - Geocoding API');
    console.log('   - Places API');
    console.log('   - Directions API');
    console.log('2. Check your API key for restrictions');
    console.log('3. Ensure billing is enabled for your Google Cloud project');
  } else {
    console.log('\n✅ All Google Maps Platform APIs are working correctly!');
  }
}

// Run the tests
runTests().catch(console.error);