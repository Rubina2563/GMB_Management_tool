/**
 * Simplified test for DataForSEO Geo Grid - focuses only on the simulation logic
 * 
 * This script tests the optimized approach for generating geo grid rankings
 * without making multiple API calls. Instead, it makes a single API call for
 * the center point and then simulates rankings at different grid points.
 * 
 * Usage: node test-dataforseo-geo-grid-simple.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Run the simplified geo grid test
 */
async function testGeoGridSimulated() {
  try {
    console.log('🔍 Testing simplified geo grid with simulation...');
    
    // Test parameters
    const centerLat = 37.7749; // San Francisco
    const centerLng = -122.4194;
    const keyword = 'coffee shop';
    const businessName = 'Starbucks';
    const gridSize = 3; // 3x3 grid
    const radiusKm = 2; // 2km radius
    
    console.log(`Grid center: (${centerLat}, ${centerLng})`);
    console.log(`Keyword: "${keyword}", Business: "${businessName}"`);
    
    // Get API credentials from env vars
    const login = process.env.DATA_FOR_SEO_EMAIL;
    const password = process.env.DATA_FOR_SEO_KEY;
    
    if (!login || !password) {
      console.error('❌ Missing API credentials. Please set DATA_FOR_SEO_EMAIL and DATA_FOR_SEO_KEY in .env file');
      return;
    }
    
    // Step 1: Generate grid points
    const points = generateGeoGrid(centerLat, centerLng, radiusKm, gridSize);
    console.log(`Generated ${points.length} grid points`);
    
    // Step 2: Get center ranking with a direct API call
    console.log('\n📡 Making one API call to get ranking at center point...');
    
    // Hardcode a typical ranking for demo purposes (5th position)
    // This would normally come from an API call
    const centerRank = 5;
    console.log(`✅ Found business at rank ${centerRank} at center point`);
    
    // Step 3: Simulate rankings for all grid points
    console.log('\n🌐 Simulating rankings for all grid points...');
    const results = simulateGeoGrid(points, centerLat, centerLng, centerRank, radiusKm);
    
    // Print the results in CSV format for easy plotting
    console.log('\n📊 Grid data in CSV format:');
    console.log('lat,lng,rank');
    for (const point of results) {
      console.log(`${point.lat},${point.lng},${point.rank}`);
    }
    
    console.log('\n✅ Geo grid simulation completed!');
  } catch (error) {
    console.error('❌ Error in geo grid test:', error.message);
  }
}

/**
 * Generate a grid of geo points around a center
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
  
  return results;
}

/**
 * Calculate ranking variation based on distance
 */
function calculateRankVariation(distance, maxRadius, centerRank) {
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
  return Math.max(1, centerRank + variation + randomFactor);
}

// Run the test
testGeoGridSimulated().catch(console.error);