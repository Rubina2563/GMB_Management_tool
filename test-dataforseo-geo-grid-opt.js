/**
 * Test script for DataForSEO API Optimized Geo Grid
 * 
 * This script tests the optimized approach for generating geo grid rankings
 * that uses a single API call with simulated rankings at different grid points.
 * 
 * Usage: node test-dataforseo-geo-grid-opt.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Test optimized geo grid approach
 */
async function testOptimizedGeoGrid() {
  try {
    // Get API credentials from env vars
    const login = process.env.DATA_FOR_SEO_EMAIL;
    const password = process.env.DATA_FOR_SEO_KEY;
    
    if (!login || !password) {
      console.error('❌ Missing API credentials. Please set DATA_FOR_SEO_EMAIL and DATA_FOR_SEO_KEY in .env file');
      return;
    }
    
    console.log('\n🔍 Testing optimized geo grid approach...');
    
    // Grid parameters
    const centerLat = 37.7749; // San Francisco
    const centerLng = -122.4194;
    const keyword = 'coffee shop';
    const businessName = 'Starbucks';
    const gridSize = 3; // 3x3 grid
    const radiusKm = 2; // 2km radius
    
    console.log(`Grid center: (${centerLat}, ${centerLng})`);
    console.log(`Keyword: "${keyword}", Business: "${businessName}"`);
    
    // Step 1: Generate grid points
    const points = generateGeoGrid(centerLat, centerLng, radiusKm, gridSize);
    console.log(`Generated ${points.length} grid points`);
    
    // Step 2: Get ranking at center point
    console.log('\n📍 Getting ranking at center point...');
    const centerRank = await getPointRanking(
      login, password, keyword, businessName, centerLat, centerLng
    );
    
    if (centerRank <= 0) {
      console.log(`❓ "${businessName}" not found at center location`);
      console.log('Trying with a different location as fallback...');
      
      // Try with hardcoded location as fallback
      const fallbackRank = await findBusinessRanking(
        login, password, keyword, businessName, "San Francisco"
      );
      
      if (fallbackRank <= 0) {
        console.log(`❌ "${businessName}" not found in fallback location either`);
        return;
      }
      
      console.log(`✅ Found "${businessName}" at rank ${fallbackRank} in fallback location`);
      
      // Continue with the fallback rank
      simulateGeoGrid(points, centerLat, centerLng, fallbackRank, radiusKm);
    } else {
      console.log(`✅ Found "${businessName}" at rank ${centerRank}`);
      
      // Step 3: Simulate rankings for all points
      simulateGeoGrid(points, centerLat, centerLng, centerRank, radiusKm);
    }
    
  } catch (error) {
    console.error('❌ Error in geo grid test:', error.message);
  }
}

/**
 * Get ranking for a specific point
 */
async function getPointRanking(login, password, keyword, businessName, lat, lng) {
  // In a full implementation, we would use reverse geocoding
  // For now, use a hardcoded location
  const locationName = "San Francisco";
  
  // Get ranking for this point
  return await findBusinessRanking(login, password, keyword, businessName, locationName);
}

/**
 * Find business ranking in a specific location
 */
async function findBusinessRanking(login, password, keyword, businessName, location) {
  try {
    console.log(`Searching for "${businessName}" with keyword "${keyword}" in ${location}`);
    
    // Step 1: Create a search task
    const taskId = await createSearchTask(login, password, keyword, location);
    
    if (!taskId) {
      console.error('Failed to create search task');
      return -1;
    }
    
    console.log(`Created search task with ID: ${taskId}`);
    
    // Step 2: Wait for task to complete
    console.log('Waiting 10 seconds for task to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 3: Get task results
    const results = await getTaskResults(login, password, taskId);
    
    if (!results || results.length === 0) {
      console.log('No results found for search task');
      return -1;
    }
    
    console.log(`Found ${results.length} search results`);
    
    // Step 4: Find business in results
    return findBusinessInResults(results, businessName);
  } catch (error) {
    console.error('Error finding business ranking:', error.message);
    return -1;
  }
}

/**
 * Create a search task
 */
async function createSearchTask(login, password, keyword, location) {
  try {
    // Create authentication header
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // API endpoint for task creation
    const url = 'https://api.dataforseo.com/v3/serp/google/organic/task_post';
    
    // Convert location name to location code
    const locationCode = getLocationCode(location);
    
    // Task data with search parameters
    const data = {
      "data": [{
        "keyword": keyword,
        "location_code": locationCode,
        "language_code": "en",
        "device": "desktop",
        "os": "windows",
        "depth": 20
      }]
    };
    
    // Make the API request
    const response = await axios.post(url, data, { headers });
    
    // Check for task ID
    if (response.status === 200 && 
        response.data?.tasks?.length > 0 && 
        response.data.tasks[0]?.id) {
      return response.data.tasks[0].id;
    }
    
    console.error('No task ID found in response');
    return null;
  } catch (error) {
    console.error('Error creating search task:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

/**
 * Get location code from location name
 */
function getLocationCode(location) {
  // Common location codes
  const locationMap = {
    'United States': 2840,
    'New York': 1022300,
    'Los Angeles': 1022462,
    'Chicago': 1016367,
    'San Francisco': 1023191,
    'Miami': 1020275,
    'Dallas': 1020584,
    'Houston': 1020432,
    'Atlanta': 1015212,
    'Boston': 1019026,
    'Seattle': 1024497,
    'Denver': 1019634,
    'Phoenix': 1022135,
    'Las Vegas': 1021339,
    'UK': 2826,
    'London': 1006894,
    'Canada': 2124,
    'Toronto': 1010223,
    'Australia': 2036,
    'Sydney': 1007402
  };
  
  // Try exact match
  if (location in locationMap) {
    return locationMap[location];
  }
  
  // Try case-insensitive match
  const lowerLocation = location.toLowerCase();
  for (const [key, value] of Object.entries(locationMap)) {
    if (key.toLowerCase() === lowerLocation) {
      return value;
    }
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(locationMap)) {
    if (lowerLocation.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerLocation)) {
      return value;
    }
  }
  
  // Default to US if no match
  return 2840;
}

/**
 * Get task results
 */
async function getTaskResults(login, password, taskId) {
  try {
    // Create authentication header
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // API endpoint for task retrieval
    const url = `https://api.dataforseo.com/v3/serp/google/organic/task_get/${taskId}`;
    
    // Make the API request
    const response = await axios.get(url, { headers });
    
    // Check for results
    if (response.status === 200 && 
        response.data?.tasks?.length > 0) {
      
      console.log('Task status:', response.data.tasks[0]?.status_message);
      
      if (response.data.tasks[0]?.result?.length > 0 &&
          response.data.tasks[0].result[0]?.items?.length > 0) {
        return response.data.tasks[0].result[0].items;
      } else {
        console.log('Task completed but no items found in result');
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error getting task results:', error.message);
    return [];
  }
}

/**
 * Find business in search results
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

/**
 * Generate a grid of geo points
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
 * Calculate haversine distance between two points
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Simulate geo grid rankings
 */
function simulateGeoGrid(points, centerLat, centerLng, centerRank, radiusKm) {
  console.log('\n🌐 Simulating rankings across the geo grid...');
  console.log(`Center rank: ${centerRank}, Radius: ${radiusKm}km`);
  
  const results = [];
  
  for (const point of points) {
    // Calculate distance from center
    const distance = haversineDistance(centerLat, centerLng, point.lat, point.lng);
    
    // Calculate ranking variation based on distance
    const rank = calculateRankVariation(distance, radiusKm, centerRank);
    
    results.push({
      lat: point.lat,
      lng: point.lng,
      rank: rank
    });
  }
  
  console.log(`Generated ${results.length} grid points with rankings`);
  
  // Print a few sample points
  console.log('\n📊 Sample grid points:');
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const point = results[i];
    console.log(`Point (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}): Rank ${point.rank}`);
  }
  
  // Print CSV format for easy plotting
  console.log('\n📄 Grid data in CSV format:');
  console.log('lat,lng,rank');
  results.forEach(point => {
    console.log(`${point.lat},${point.lng},${point.rank}`);
  });
}

/**
 * Calculate ranking variation based on distance
 */
function calculateRankVariation(distance, maxRadius, centerRank) {
  // If center rank is negative, return -1 (not found)
  if (centerRank < 0) return -1;
  
  // Normalize distance to 0-1 range
  const normalizedDistance = Math.min(distance / maxRadius, 1);
  
  // Calculate rank variation: 
  // - At center (distance = 0): no change
  // - At max radius (distance = maxRadius): decrease by up to 10 positions
  const maxVariation = 10;
  const variation = Math.floor(normalizedDistance * maxVariation);
  
  // Add randomness to avoid perfect circles
  const randomFactor = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  
  // Calculate new rank, ensuring it doesn't go below 1
  const newRank = Math.max(1, centerRank + variation + randomFactor);
  return newRank;
}

// Run the test
testOptimizedGeoGrid().catch(console.error);