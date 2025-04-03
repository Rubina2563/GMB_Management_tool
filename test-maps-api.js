import 'dotenv/config';
import axios from 'axios';

// Get the API key from environment variables
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error('Error: GOOGLE_MAPS_API_KEY is not set in .env file');
  process.exit(1);
}

// Test coordinates
const lat = 40.7128;
const lng = -74.0060;

async function testGoogleMapsAPI() {
  try {
    console.log('Testing Google Maps Static API with coordinates:', { lat, lng });
    
    // Test Static Maps API (simpler than JavaScript API)
    const staticMapsUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=12&size=400x400&key=${apiKey}`;
    
    console.log('Testing URL (first 100 chars):', staticMapsUrl.substring(0, 100) + '...');
    
    const response = await axios.get(staticMapsUrl, { responseType: 'arraybuffer' });
    
    if (response.status === 200) {
      console.log('✅ Static Maps API call successful!');
      console.log('Response size:', response.data.length, 'bytes');
      
      // If the response is small (less than 1KB), it might be an error page
      if (response.data.length < 1000) {
        console.warn('⚠️ Response seems small, might be an error image');
      } else {
        console.log('✅ Response size looks good, likely a valid map image');
      }
    } else {
      console.error('❌ Static Maps API call failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing Maps API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

testGoogleMapsAPI();