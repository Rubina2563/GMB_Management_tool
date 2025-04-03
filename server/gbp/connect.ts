import axios from 'axios';
import { ApiKeysData, GbpLocation, InsertGbpLocation, InsertGbpData } from '@shared/schema';
import { storage } from '../storage';

// Interface for GBP location data from Google API
interface GooglePlaceDetails {
  location_id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  latitude?: string;
  longitude?: string;
  // Additional fields that might be retrieved from Google API
  business_status?: string;
  photos?: string[];
  reviews?: any[];
  rating?: number;
  opening_hours?: any;
}

// Interface for DataForSEO insights
interface DataForSEOInsights {
  rank?: number;
  visibility?: number;
  keywords?: any[];
  competitors?: any[];
  serp_features?: any[];
}

/**
 * Connect to Google Business Profile and fetch location data
 * @param userId User ID making the request
 * @param locationId Google location ID to connect
 */
export async function connectGBP(userId: number, locationId: string): Promise<GbpLocation> {
  // Retrieve API keys for the user
  const apiKeys = await storage.getApiKeys(userId);
  
  if (!apiKeys || !apiKeys.google_api_key) {
    throw new Error("Google API key not found. Please configure your API keys in the settings.");
  }
  
  // Check if location already exists
  const existingLocation = await storage.getGbpLocationByGoogleId(userId, locationId);
  if (existingLocation) {
    // Just update the last_updated timestamp and return the existing location
    const updatedLocation = await storage.updateGbpLocation(existingLocation.id, {
      status: 'connected',
    });
    
    if (!updatedLocation) {
      throw new Error("Failed to update existing location");
    }
    
    return updatedLocation;
  }
  
  // Fetch location details from Google Places API
  const placeDetails = await fetchGooglePlaceDetails(locationId, apiKeys.google_api_key);
  
  // Create a new location in the database
  const locationData: InsertGbpLocation = {
    user_id: userId,
    location_id: locationId,
    name: placeDetails.name,
    address: placeDetails.address,
    phone: placeDetails.phone || null,
    website: placeDetails.website || null,
    latitude: placeDetails.latitude || null,
    longitude: placeDetails.longitude || null,
    status: 'connected',
  };
  
  const savedLocation = await storage.createGbpLocation(locationData);
  
  // Fetch additional SERP insights if DataForSEO key is available
  if (apiKeys.data_for_seo_key) {
    try {
      const serpInsights = await fetchDataForSEOInsights(
        placeDetails.website || "", 
        apiKeys.data_for_seo_key
      );
      
      // Store SERP insights as GBP data
      await storage.createGbpData({
        location_id: savedLocation.id,
        data_type: 'serp_insights',
        data: serpInsights
      });
    } catch (error) {
      console.error('Error fetching SERP insights:', error);
      // Don't throw error here, continue with the process
    }
  }
  
  // If we have additional data from Google, save it too
  if (placeDetails.reviews || placeDetails.photos || placeDetails.opening_hours) {
    await storage.createGbpData({
      location_id: savedLocation.id,
      data_type: 'google_data',
      data: {
        reviews: placeDetails.reviews || [],
        photos: placeDetails.photos || [],
        rating: placeDetails.rating || 0,
        opening_hours: placeDetails.opening_hours || null,
        business_status: placeDetails.business_status || 'OPERATIONAL'
      }
    });
  }
  
  return savedLocation;
}

/**
 * Fetch Google Place details using the Google Places API
 */
async function fetchGooglePlaceDetails(placeId: string, apiKey: string): Promise<GooglePlaceDetails> {
  try {
    // Construct the Google Places API URL for place details
    const googleApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,geometry,business_status,photos,reviews,rating,opening_hours&key=${apiKey}`;
    
    // Make the API request
    const response = await axios.get(googleApiUrl);
    
    // Check if the API call was successful
    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }
    
    const place = response.data.result;
    
    // Return formatted place details
    return {
      location_id: placeId,
      name: place.name || "Unnamed Business",
      address: place.formatted_address || "No address available",
      phone: place.formatted_phone_number || null,
      website: place.website || null,
      latitude: place.geometry?.location?.lat?.toString() || null,
      longitude: place.geometry?.location?.lng?.toString() || null,
      business_status: place.business_status || "OPERATIONAL",
      photos: place.photos?.map((photo: any) => photo.photo_reference) || [],
      reviews: place.reviews || [],
      rating: place.rating || 0,
      opening_hours: place.opening_hours || null
    };
  } catch (error) {
    console.error("Error fetching Google Place details:", error);
    throw new Error("Failed to fetch location details from Google API");
  }
}

/**
 * Fetch SERP insights from DataForSEO API
 */
async function fetchDataForSEOInsights(website: string, apiKey: string): Promise<DataForSEOInsights> {
  if (!website) {
    return {
      rank: 0,
      visibility: 0,
      keywords: [],
      competitors: [],
      serp_features: []
    };
  }
  
  try {
    // Create Base64 encoded credentials for Basic Authentication
    // Format: <email>:<api_key> for DataForSEO
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    
    // Make the API call to DataForSEO
    try {
      const response = await axios.post(
        'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
        [{ keyword: website, location_code: 2840 }], // 2840 is USA
        { 
          headers: { 
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json' 
          } 
        }
      );
      
      // Check if the API call was successful
      if (response?.data?.tasks?.[0]?.result) {
        const data = response.data.tasks[0].result[0];
        
        // Extract relevant data
        return {
          rank: data.items?.[0]?.rank || 0,
          visibility: data.items?.[0]?.visibility_index || 0,
          keywords: data.items?.[0]?.relevant_keywords || [],
          competitors: data.items?.[0]?.competitor_domains || [],
          serp_features: data.items?.[0]?.serp_features || []
        };
      } else {
        // Handle API error
        console.warn("DataForSEO API returned empty result, falling back to minimal data");
        return {
          rank: 0,
          visibility: 0,
          keywords: [],
          competitors: [],
          serp_features: []
        };
      }
    } catch (apiError) {
      console.error("DataForSEO API call failed:", apiError);
      // If the API call fails, return minimal data to avoid breaking the app
      return {
        rank: 0,
        visibility: 0,
        keywords: [],
        competitors: [],
        serp_features: []
      };
    }
  } catch (error) {
    console.error("Error fetching DataForSEO insights:", error);
    throw new Error("Failed to fetch SERP insights from DataForSEO");
  }
}

/**
 * Get all GBP locations and data for a user
 */
export async function getGBPLocations(userId: number) {
  const locations = await storage.getGbpLocations(userId);
  
  // Fetch additional data for each location
  const locationsWithData = await Promise.all(
    locations.map(async (location) => {
      const googleData = await storage.getGbpData(location.id, 'google_data');
      const serpData = await storage.getGbpData(location.id, 'serp_insights');
      
      return {
        ...location,
        google_data: googleData?.data || null,
        serp_insights: serpData?.data || null
      };
    })
  );
  
  return locationsWithData;
}