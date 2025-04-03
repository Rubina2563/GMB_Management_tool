import 'dotenv/config';
import axios from 'axios';

// Get the API key from environment variables
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error('Error: GOOGLE_MAPS_API_KEY is not set in .env file');
  process.exit(1);
}

// Test address to look up
const testAddress = 'Empire State Building, New York, NY';

async function testPlaceSearch() {
  try {
    console.log('Testing Google Places API Text Search with address:', testAddress);
    
    const placesApiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(testAddress)}&key=${apiKey}`;
    
    const response = await axios.get(placesApiUrl);
    
    if (response.data.status === 'OK') {
      console.log('✅ API call successful!');
      
      // Display first result details
      if (response.data.results && response.data.results.length > 0) {
        const place = response.data.results[0];
        console.log('\nLocation Details:');
        console.log('- Name:', place.name);
        console.log('- Address:', place.formatted_address);
        console.log('- Place ID:', place.place_id);
        console.log('- Coordinates:', place.geometry.location);
      } else {
        console.log('No results found for this address');
      }
    } else {
      console.error('❌ API call failed with status:', response.data.status);
      if (response.data.error_message) {
        console.error('Error message:', response.data.error_message);
      }
    }
  } catch (error) {
    console.error('❌ Error testing Places API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Test duplicate search functionality
async function testDuplicateSearch() {
  try {
    console.log('\n\nTesting Duplicate Search functionality for:', testAddress);
    
    // Mock what our implementation would do:
    // 1. Search for places with similar name
    const searchQuery = testAddress;
    const placesApiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    
    const response = await axios.get(placesApiUrl);
    
    if (response.data.status === 'OK') {
      console.log('✅ Duplicate search API call successful!');
      
      // Get results and find potential duplicates (for testing, we'll consider all results except the first)
      const places = response.data.results || [];
      
      if (places.length > 1) {
        console.log(`\nFound ${places.length - 1} potential duplicates/similar listings:`);
        
        // Skip the first result (assuming it's the primary listing)
        for (let i = 1; i < Math.min(places.length, 5); i++) {
          const place = places[i];
          console.log(`\nDuplicate #${i}:`);
          console.log('- Name:', place.name);
          console.log('- Address:', place.formatted_address);
          console.log('- Place ID:', place.place_id);
        }
      } else {
        console.log('No potential duplicates found for this address');
      }
    } else {
      console.error('❌ Duplicate search API call failed with status:', response.data.status);
    }
  } catch (error) {
    console.error('❌ Error testing duplicate search:', error.message);
  }
}

// Test geo-grid generation functionality
async function testGeoGridGeneration() {
  try {
    console.log('\n\nTesting Geo-Grid Generation');
    
    // First, get location coordinates for a test address
    const placesApiUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(testAddress)}&inputtype=textquery&fields=geometry,place_id&key=${apiKey}`;
    
    const response = await axios.get(placesApiUrl);
    
    if (response.data.status === 'OK' && response.data.candidates && response.data.candidates.length > 0) {
      const place = response.data.candidates[0];
      const lat = place.geometry.location.lat;
      const lng = place.geometry.location.lng;
      
      console.log('✅ Got coordinates for test location:', { lat, lng });
      
      // Generate a simple 3x3 grid around the location
      const gridSize = 3;
      const radiusMiles = 1;
      
      // Convert miles to degrees (approximate)
      const latDelta = (radiusMiles * 2) / 69;
      const lngDelta = (radiusMiles * 2) / (Math.cos(lat * Math.PI / 180) * 69);
      
      const latStep = latDelta / (gridSize - 1);
      const lngStep = lngDelta / (gridSize - 1);
      
      const startLat = lat - (latDelta / 2);
      const startLng = lng - (lngDelta / 2);
      
      // Generate and display the grid
      console.log(`\nGenerated ${gridSize}x${gridSize} grid (${radiusMiles} mile radius):`);
      
      for (let i = 0; i < gridSize; i++) {
        let rowStr = '';
        for (let j = 0; j < gridSize; j++) {
          const gridLat = startLat + (i * latStep);
          const gridLng = startLng + (j * lngStep);
          
          // For display purposes, just use a grid notation
          rowStr += `[${gridLat.toFixed(5)}, ${gridLng.toFixed(5)}] `;
        }
        console.log(rowStr);
      }
    } else {
      console.error('❌ Failed to get location for geo-grid test:', response.data.status);
    }
  } catch (error) {
    console.error('❌ Error testing geo-grid generation:', error.message);
  }
}

async function runTests() {
  await testPlaceSearch();
  await testDuplicateSearch();
  await testGeoGridGeneration();
}

runTests();