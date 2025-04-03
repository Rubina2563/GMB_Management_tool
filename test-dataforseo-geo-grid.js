/**
 * Test script for DataForSEO API Geo Grid Rankings
 * 
 * This script tests the DataForSEO API for geo grid rankings, simulating
 * the grid-based local ranking checks needed for the application.
 * 
 * Usage: node test-dataforseo-geo-grid.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Generate a grid of geo points around a center
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @param {number} gridSize - Number of points in grid (e.g., 3 creates a 3x3 grid)
 * @returns {Array<{lat: number, lng: number}>} Array of lat/lng coordinates
 */
function generateGeoGrid(centerLat, centerLng, radiusKm, gridSize) {
  const points = [];
  const earthRadius = 6371; // Earth's radius in km
  
  // Create a grid of points
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Calculate normalized coordinates from -1 to 1
      const normalizedX = 2 * (i / (gridSize - 1)) - 1;
      const normalizedY = 2 * (j / (gridSize - 1)) - 1;
      
      // Calculate distance from center
      const distanceKm = radiusKm * Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
      
      // If beyond radius, skip this point
      if (distanceKm > radiusKm) continue;
      
      // Calculate bearing angle in radians
      const bearing = Math.atan2(normalizedY, normalizedX);
      
      // Convert to new lat/lng using haversine formula
      const latRad = centerLat * Math.PI / 180;
      const lngRad = centerLng * Math.PI / 180;
      
      const angularDistance = distanceKm / earthRadius;
      
      const newLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(angularDistance) +
        Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
      );
      
      const newLngRad = lngRad + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
      );
      
      // Convert back to degrees
      const newLat = newLatRad * 180 / Math.PI;
      const newLng = newLngRad * 180 / Math.PI;
      
      points.push({
        lat: newLat,
        lng: newLng
      });
    }
  }
  
  return points;
}

/**
 * Fetch local search results for a specific location
 * @param {string} login - DataForSEO API login
 * @param {string} password - DataForSEO API password
 * @param {string} keyword - Search keyword
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Array>} Search results
 */
async function fetchLocalResults(login, password, keyword, lat, lng) {
  console.log(`Fetching results for "${keyword}" at location ${lat}, ${lng}`);
  
  try {
    // Step 1: Create a search task
    const taskId = await createSearchTask(login, password, keyword);
    
    if (!taskId) {
      console.error('Failed to create search task');
      return [];
    }
    
    // Step 2: Wait for task to complete
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
    
    // Step 3: Get the results
    const results = await getTaskResults(login, password, taskId);
    return results;
  } catch (error) {
    console.error('Error fetching local results:', error.message);
    return [];
  }
}

/**
 * Create a search task
 * @param {string} login - DataForSEO login 
 * @param {string} password - DataForSEO password
 * @param {string} keyword - Search keyword
 * @returns {Promise<string|null>} Task ID if successful
 */
async function createSearchTask(login, password, keyword) {
  try {
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const url = 'https://api.dataforseo.com/v3/serp/google/organic/task_post';
    
    // Prepare request data with location code for San Francisco
    const data = {
      "data": [{
        "keyword": keyword,
        "location_code": 1023191, // San Francisco
        "language_code": "en",
        "device": "desktop",
        "os": "windows",
        "depth": 20
      }]
    };
    
    // Make API request
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check for task ID
    if (response.status === 200 && 
        response.data.tasks && 
        response.data.tasks.length > 0 &&
        response.data.tasks[0].id) {
      console.log(`Task created with ID: ${response.data.tasks[0].id}`);
      return response.data.tasks[0].id;
    }
    
    console.error('No task ID found in response');
    return null;
  } catch (error) {
    console.error('Error creating search task:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

/**
 * Get task results
 * @param {string} login - DataForSEO login
 * @param {string} password - DataForSEO password
 * @param {string} taskId - Task ID
 * @returns {Promise<Array>} Search results
 */
async function getTaskResults(login, password, taskId) {
  try {
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const url = `https://api.dataforseo.com/v3/serp/google/organic/task_get/${taskId}`;
    
    // Make API request
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Extract results
    if (response.status === 200 &&
        response.data.tasks &&
        response.data.tasks.length > 0) {
      
      if (response.data.tasks[0].status_message === "Ok.") {
        if (response.data.tasks[0].result && 
            response.data.tasks[0].result.length > 0 &&
            response.data.tasks[0].result[0].items) {
          return response.data.tasks[0].result[0].items;
        } else {
          console.log('No items in results');
          console.log('Result data:', JSON.stringify(response.data.tasks[0].result, null, 2));
        }
      } else {
        console.log('Task not complete, status:', response.data.tasks[0].status_message);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error getting task results:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return [];
  }
}

/**
 * Find ranking position of a business in search results
 * @param {Array} results - Search results
 * @param {string} businessName - Name of the business to find
 * @returns {number} Ranking position (1-based) or -1 if not found
 */
function findBusinessRanking(results, businessName) {
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

/**
 * Run a simpler test with just one location
 */
async function runSimpleTest() {
  // Get credentials from environment
  const login = process.env.DATA_FOR_SEO_EMAIL;
  const password = process.env.DATA_FOR_SEO_KEY;
  
  // Test parameters
  const keyword = 'coffee shop';
  const businessName = 'Starbucks';
  const centerLat = 37.7749; // San Francisco
  const centerLng = -122.4194;
  
  // Smaller grid for the test
  const gridSize = 2; // Just 4 points
  const radiusKm = 2;
  
  console.log(`\n🔍 Testing geo grid for "${keyword}" around San Francisco (${centerLat}, ${centerLng})`);
  console.log(`Searching for "${businessName}" within ${radiusKm}km radius in a ${gridSize}x${gridSize} grid`);
  
  // Generate grid points
  const gridPoints = generateGeoGrid(centerLat, centerLng, radiusKm, gridSize);
  console.log(`Generated ${gridPoints.length} grid points`);
  
  // Test results for each point
  const results = [];
  
  // Just use the first point for testing
  const testPoint = gridPoints[0];
  console.log(`Testing point at (${testPoint.lat}, ${testPoint.lng})`);
  
  // Get search results
  const searchResults = await fetchLocalResults(login, password, keyword, testPoint.lat, testPoint.lng);
  console.log(`Found ${searchResults.length} search results`);
  
  // Find business ranking
  const rank = findBusinessRanking(searchResults, businessName);
  console.log(`${businessName} ranking: ${rank === -1 ? 'Not found' : rank}`);
  
  results.push({
    lat: testPoint.lat,
    lng: testPoint.lng,
    rank: rank
  });
  
  console.log('\n✅ Test completed');
  console.log('Geo grid results:', results);
}

// Run the test
runSimpleTest().catch(console.error);