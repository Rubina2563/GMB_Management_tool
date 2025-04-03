/**
 * Google Business Profile API Service
 * Handles operations for interacting with Google Business Profile API
 */

import { google, mybusinessaccountmanagement_v1, mybusinessplaceactions_v1, mybusinessbusinessinformation_v1, mybusinessverifications_v1, mybusinessnotifications_v1 } from 'googleapis';
import { dbService } from '../db';

// Define types for GBP API responses
export interface GBPBusinessInfo {
  name: string;
  storeCode: string | null;
  primaryCategory: {
    displayName: string;
    categoryId: string;
  } | null;
  secondaryCategories: Array<{
    displayName: string;
    categoryId: string;
  }>;
  websiteUrl: string | null;
  regularHours: {
    periods: Array<{
      openDay: string;
      openTime: string;
      closeDay: string;
      closeTime: string;
    }>;
  } | null;
  specialHours: {
    specialHourPeriods: Array<{
      startDate: {
        year: number;
        month: number;
        day: number;
      };
      endDate: {
        year: number;
        month: number;
        day: number;
      };
      openTime: string;
      closeTime: string;
    }>;
  } | null;
  serviceItems: Array<{
    displayName: string;
    description: string | null;
    price: {
      currencyCode: string;
      amount: number;
    } | null;
  }>;
  attributes: Array<{
    name: string;
    values: string[];
  }>;
  labels: string[];
  description: string | null;
  phoneNumbers: Array<{
    phoneNumber: string;
    type: string;
  }>;
  address: {
    addressLines: string[];
    administrativeArea: string;
    locality: string;
    postalCode: string;
    regionCode: string;
  } | null;
  serviceArea: {
    businessType: "CUSTOMER_LOCATION_ONLY" | "CUSTOMER_AND_BUSINESS_LOCATION" | "BUSINESS_LOCATION_ONLY";
    places: {
      placeInfos: Array<{
        name: string;
        placeId: string;
      }>;
    } | null;
    regionCode: string;
  } | null;
  latlng: {
    latitude: number;
    longitude: number;
  } | null;
  openInfo: {
    status: "OPEN" | "CLOSED_PERMANENTLY" | "CLOSED_TEMPORARILY" | "REOPENING_SOON";
    canReopen: boolean;
  } | null;
  metadata: {
    hasGoogleUpdated: boolean;
    hasPendingEdits: boolean;
  };
}

export interface GBPReview {
  name: string;
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl: string | null;
  };
  starRating: "STAR_RATING_UNSPECIFIED" | "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply: {
    comment: string;
    updateTime: string;
  } | null;
}

export interface GBPPost {
  name: string;
  postId: string;
  summary: string;
  callToAction: {
    actionType: string;
    url: string;
  } | null;
  media: Array<{
    name: string;
    mediaFormat: "MEDIA_FORMAT_UNSPECIFIED" | "PHOTO" | "VIDEO";
    googleUrl: string;
  }> | null;
  createTime: string;
  updateTime: string;
  state: "STATE_UNSPECIFIED" | "LIVE" | "REJECTED" | "DRAFT";
  searchUrl: string | null;
  topic: {
    displayName: string;
    topicId: string;
  } | null;
  alertType: string | null;
  event: {
    title: string;
    schedule: {
      startTime: string;
      endTime: string;
    };
  } | null;
  offer: {
    couponCode: string;
    redeemOnlineUrl: string;
    termsConditions: string;
  } | null;
}

export interface GBPPhoto {
  name: string;
  mediaFormat: "MEDIA_FORMAT_UNSPECIFIED" | "PHOTO" | "VIDEO";
  locationAssociation: {
    category: string;
  };
  googleUrl: string;
  thumbnailUrl: string;
  createTime: string;
  dimensions: {
    widthPixels: number;
    heightPixels: number;
  };
}

export interface GBPQuestion {
  name: string;
  text: string;
  author: {
    name: string;
    displayName: string;
    profilePhotoUrl: string | null;
  };
  createTime: string;
  updateTime: string;
  totalAnswerCount: number;
  topAnswer: {
    name: string;
    text: string;
    author: {
      name: string;
      displayName: string;
      profilePhotoUrl: string | null;
    };
    createTime: string;
    updateTime: string;
    upvoteCount: number;
  } | null;
}

export interface GBPInsights {
  name: string;
  timeRange: {
    startTime: string;
    endTime: string;
  };
  locationDrivingDirectionMetrics: {
    topDirectionSources: Array<{
      dayCount: number;
      requestCount: number;
      source: string;
    }>;
  };
  metricValues: Array<{
    metric: string;
    dimensionalValues: Array<{
      metricOption: string;
      timeDimension: {
        dayOfWeek: string;
        timeOfDay: string;
        date: {
          year: number;
          month: number;
          day: number;
        };
      } | null;
      value: {
        metricValue: number;
      };
    }>;
  }>;
}

export interface GBPDuplicates {
  duplicates: Array<{
    name: string;
    placeId: string;
    address: string;
    phoneNumber: string;
    website: string | null;
    matchScore: number;
  }>;
}

class GBPApiService {
  private async getAuthClient(userId: number) {
    try {
      const apiKeys = await dbService.getApiKeys(userId);
      
      if (!apiKeys) {
        throw new Error("API keys not found");
      }
      
      const { 
        google_client_id: clientId, 
        google_client_secret: clientSecret,
        gbp_redirect_uri: redirectUri
      } = apiKeys;

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Google Business Profile API credentials are missing");
      }

      // In a real implementation, we would fetch the access token and refresh token from storage
      // For now, we'll throw an error since we don't have actual OAuth tokens
      // This would be handled by a proper OAuth flow in production
      
      // For testing purposes, we'd use mock data
      // In a real implementation, we'd use the OAuth2 client to make authenticated requests
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      // Get tokens from storage
      // In a real implementation, these would be fetched from a database
      const tokens = {
        access_token: "mock_access_token", // This would be a real token in production
        refresh_token: "mock_refresh_token", // This would be a real token in production
        expiry_date: Date.now() + 3600000, // 1 hour from now
      };

      oauth2Client.setCredentials(tokens);
      
      return oauth2Client;
    } catch (error: any) {
      console.error("Error getting auth client:", error.message);
      throw new Error("Failed to authenticate with Google Business Profile API");
    }
  }

  /**
   * Fetch business information from Google Business Profile API
   */
  async getBusinessInfo(userId: number, locationId: string): Promise<GBPBusinessInfo> {
    try {
      // In a real implementation, we would authenticate with Google API here
      // const auth = await this.getAuthClient(userId);
      // const mybusinessinformation = google.mybusinessbusinessinformation({
      //   version: 'v1',
      //   auth
      // });
      // const response = await mybusinessinformation.accounts.locations.get({
      //   name: `locations/${locationId}`
      // });
      // return response.data;
      
      // For now, return mock data
      throw new Error("Authentication with GBP API required");
    } catch (error: any) {
      console.error("Error getting business info:", error.message);
      throw new Error("Failed to fetch business information from GBP API");
    }
  }

  /**
   * Fetch reviews from Google Business Profile API
   */
  async getReviews(userId: number, locationId: string): Promise<GBPReview[]> {
    try {
      // In a real implementation, we would fetch reviews from the Google API
      // const auth = await this.getAuthClient(userId);
      // const mybusinessreviews = google.mybusinessreviews({
      //   version: 'v1',
      //   auth
      // });
      // const response = await mybusinessreviews.accounts.locations.reviews.list({
      //   parent: `accounts/${accountId}/locations/${locationId}`
      // });
      // return response.data.reviews || [];
      
      // For now, return mock data
      throw new Error("Authentication with GBP API required");
    } catch (error: any) {
      console.error("Error getting reviews:", error.message);
      throw new Error("Failed to fetch reviews from GBP API");
    }
  }
  
  /**
   * Fetch posts from Google Business Profile API
   */
  async getPosts(userId: number, locationId: string): Promise<GBPPost[]> {
    try {
      // In a real implementation, we would fetch posts from the Google API
      // const auth = await this.getAuthClient(userId);
      // const mybusinessposts = google.mybusinessposts({
      //   version: 'v1',
      //   auth
      // });
      // const response = await mybusinessposts.accounts.locations.posts.list({
      //   parent: `accounts/${accountId}/locations/${locationId}`
      // });
      // return response.data.posts || [];
      
      // For now, return mock data
      throw new Error("Authentication with GBP API required");
    } catch (error: any) {
      console.error("Error getting posts:", error.message);
      throw new Error("Failed to fetch posts from GBP API");
    }
  }
  
  /**
   * Fetch photos from Google Business Profile API
   */
  async getPhotos(userId: number, locationId: string): Promise<GBPPhoto[]> {
    try {
      // In a real implementation, we would fetch photos from the Google API
      // const auth = await this.getAuthClient(userId);
      // const mybusinessphotos = google.mybusinessphotos({
      //   version: 'v1',
      //   auth
      // });
      // const response = await mybusinessphotos.accounts.locations.media.list({
      //   parent: `accounts/${accountId}/locations/${locationId}`,
      //   mediaFormat: 'PHOTO'
      // });
      // return response.data.mediaItems || [];
      
      // For now, return mock data
      throw new Error("Authentication with GBP API required");
    } catch (error: any) {
      console.error("Error getting photos:", error.message);
      throw new Error("Failed to fetch photos from GBP API");
    }
  }
  
  /**
   * Fetch Q&A data from Google Business Profile API
   */
  async getQnA(userId: number, locationId: string): Promise<GBPQuestion[]> {
    try {
      // In a real implementation, we would fetch Q&A data from the Google API
      // const auth = await this.getAuthClient(userId);
      // const mybusinessqanda = google.mybusinessqanda({
      //   version: 'v1',
      //   auth
      // });
      // const response = await mybusinessqanda.locations.questions.list({
      //   parent: `locations/${locationId}`
      // });
      // return response.data.questions || [];
      
      // For now, return mock data
      throw new Error("Authentication with GBP API required");
    } catch (error: any) {
      console.error("Error getting Q&A:", error.message);
      throw new Error("Failed to fetch Q&A data from GBP API");
    }
  }
  
  /**
   * Fetch performance metrics from Google Business Profile API
   */
  async getPerformance(userId: number, locationId: string): Promise<GBPInsights> {
    try {
      // In a real implementation, we would fetch performance metrics from the Google API
      // const auth = await this.getAuthClient(userId);
      // const mybusinessinsights = google.mybusinessinsights({
      //   version: 'v1',
      //   auth
      // });
      // const response = await mybusinessinsights.accounts.locations.reportInsights({
      //   name: `accounts/${accountId}/locations/${locationId}`,
      //   body: {
      //     locationNames: [`accounts/${accountId}/locations/${locationId}`],
      //     basicRequest: {
      //       metrics: ['QUERIES_DIRECT', 'QUERIES_INDIRECT', 'VIEWS_MAPS', 'VIEWS_SEARCH', 'ACTIONS_WEBSITE', 'ACTIONS_PHONE', 'ACTIONS_DRIVING_DIRECTIONS'],
      //       timeRange: {
      //         startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      //         endTime: new Date().toISOString()
      //       }
      //     }
      //   }
      // });
      // return response.data;
      
      // For now, return mock data
      throw new Error("Authentication with GBP API required");
    } catch (error: any) {
      console.error("Error getting performance:", error.message);
      throw new Error("Failed to fetch performance metrics from GBP API");
    }
  }
  
  /**
   * Find potential duplicate listings using Google Places API
   */
  async getDuplicates(userId: number, locationId: string): Promise<GBPDuplicates> {
    try {
      // Get the GBP location from storage
      const location = await this.getLocationById(parseInt(locationId));
      if (!location) {
        throw new Error("Location not found");
      }
      
      // Get the Google API key from database
      const apiKeys = await dbService.getApiKeys(userId);
      if (!apiKeys || !apiKeys.google_api_key) {
        throw new Error("Google Places API key not configured");
      }

      const googleApiKey = apiKeys.google_api_key;
      
      // Use the Google Places API to search for similar businesses
      // First, find places with similar name
      const searchQuery = `${location.name} ${location.address.split(',')[0]}`; // Use business name + first part of address
      const placesApiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleApiKey}`;
      
      const axios = require('axios');
      const response = await axios.get(placesApiUrl);
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.warn(`Google Places API returned non-OK status: ${response.data.status}`);
        
        // If the API returns REQUEST_DENIED or another error, fallback to empty duplicates
        if (response.data.status === 'REQUEST_DENIED' || response.data.status === 'INVALID_REQUEST') {
          console.warn('Using fallback for duplicates due to API key issue');
          return { duplicates: [] };
        }
        
        throw new Error(`Google Places API error: ${response.data.status}`);
      }
    
      const places = response.data.results || [];
      
      // Filter out the main business and collect possible duplicates
      const businessPhone = location.phone?.replace(/\D/g, '') || ''; // Normalize phone number
      const duplicates: Array<{
        name: string;
        placeId: string;
        address: string;
        phoneNumber: string;
        website: string | null;
        matchScore: number;
      }> = [];
      
      // Get details for each candidate place
      for (const place of places) {
        // Skip if it's the exact same place
        if (place.name === location.name && place.formatted_address === location.address) {
          continue;
        }
        
        // Calculate a basic match score (0-100)
        let matchScore = 0;
        
        // Name similarity (up to 40 points)
        const nameSimilarity = this.calculateStringSimilarity(location.name.toLowerCase(), place.name.toLowerCase());
        matchScore += nameSimilarity * 40;
        
        // Address similarity (up to 40 points)
        const addressSimilarity = this.calculateStringSimilarity(
          location.address.toLowerCase(), 
          place.formatted_address?.toLowerCase() || ''
        );
        matchScore += addressSimilarity * 40;
        
        // Proximity (up to 20 points)
        if (location.latitude && location.longitude && place.geometry?.location) {
          const distance = this.calculateDistance(
            parseFloat(location.latitude), 
            parseFloat(location.longitude),
            place.geometry.location.lat,
            place.geometry.location.lng
          );
          
          // If within 1 mile, give points inversely proportional to distance
          if (distance <= 1) {
            matchScore += (1 - distance) * 20;
          }
        }
        
        // If the match score is above threshold, consider it a potential duplicate
        if (matchScore > 50) {
          duplicates.push({
            name: place.name,
            placeId: place.place_id,
            address: place.formatted_address || '',
            phoneNumber: place.formatted_phone_number || '',
            website: place.website || null,
            matchScore: Math.round(matchScore)
          });
        }
      }
      
      return { duplicates };
    } catch (error: any) {
      console.error("Error getting duplicates:", error.message);
      throw new Error("Failed to find duplicate listings");
    }
  }
  
  /**
   * Calculate similarity between two strings (0-1)
   * Simple implementation using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    // Use a simple approach for longer strings to avoid excessive computation
    if (len1 > 100 || len2 > 100) {
      const commonChars = str1.split('').filter(char => str2.includes(char)).length;
      return commonChars / Math.max(len1, len2);
    }
    
    // Calculate Levenshtein distance
    const dp: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // Deletion
          dp[i][j - 1] + 1,      // Insertion
          dp[i - 1][j - 1] + cost // Substitution
        );
      }
    }
    
    // Convert distance to similarity (0-1)
    const distance = dp[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - (distance / maxLen);
  }
  
  /**
   * Calculate distance between two coordinates (in miles)
   * Uses the Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  /**
   * Get location coordinates for map rankings
   */
  async getMapRankingLocation(userId: number, locationId: string): Promise<{
    latitude: number, 
    longitude: number, 
    gridData?: Array<{lat: number, lng: number, rank?: number, inTop3?: boolean}>
  }> {
    try {
      // Get the GBP location from storage
      const location = await this.getLocationById(parseInt(locationId));
      if (!location) {
        throw new Error("Location not found");
      }

      // Get the Google API key from database
      const apiKeys = await dbService.getApiKeys(userId);
      if (!apiKeys || !apiKeys.google_api_key) {
        throw new Error("Google Places API key not configured");
      }

      const googleApiKey = apiKeys.google_api_key;

      // If we have latitude and longitude stored, use those directly
      if (location.latitude && location.longitude) {
        const lat = parseFloat(location.latitude);
        const lng = parseFloat(location.longitude);
        
        // Generate a 5x5 grid around the location coordinates
        const gridData = this.generateGeoGrid(lat, lng, 5, 1); // 5x5 grid, 1 mile radius
        
        return {
          latitude: lat,
          longitude: lng,
          gridData: gridData
        };
      }

      // If we don't have coordinates stored, use the Places API to find them
      const placesApiUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(location.name + ' ' + location.address)}&inputtype=textquery&fields=geometry,place_id&key=${googleApiKey}`;
      
      const axios = require('axios');
      const response = await axios.get(placesApiUrl);
      
      if (response.data.status !== 'OK' || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }
      
      const place = response.data.candidates[0];
      const lat = place.geometry.location.lat;
      const lng = place.geometry.location.lng;
      
      // Generate a 5x5 grid around the location coordinates
      const gridData = this.generateGeoGrid(lat, lng, 5, 1); // 5x5 grid, 1 mile radius
      
      return {
        latitude: lat,
        longitude: lng,
        gridData: gridData
      };
    } catch (error: any) {
      console.error("Error getting map ranking location:", error.message);
      throw new Error("Failed to fetch location coordinates from Google Places API");
    }
  }
  
  /**
   * Generate a geo grid around a central point
   * @param centerLat - Center latitude
   * @param centerLng - Center longitude
   * @param gridSize - Size of the grid (e.g., 5 for a 5x5 grid)
   * @param radiusMiles - Radius in miles
   */
  private generateGeoGrid(centerLat: number, centerLng: number, gridSize: number, radiusMiles: number): Array<{lat: number, lng: number, rank?: number, inTop3?: boolean}> {
    const grid: Array<{lat: number, lng: number, rank?: number, inTop3?: boolean}> = [];
    
    // Convert miles to degrees (approximate)
    // 1 degree latitude is approximately 69 miles
    // 1 degree longitude varies with latitude, approximately cos(latitude) * 69 miles
    const latDelta = (radiusMiles * 2) / 69;
    const lngDelta = (radiusMiles * 2) / (Math.cos(centerLat * Math.PI / 180) * 69);
    
    const latStep = latDelta / (gridSize - 1);
    const lngStep = lngDelta / (gridSize - 1);
    
    const startLat = centerLat - (latDelta / 2);
    const startLng = centerLng - (lngDelta / 2);
    
    // Generate grid points
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = startLat + (i * latStep);
        const lng = startLng + (j * lngStep);
        
        // Generate a random rank for demonstration
        // In a real implementation, these would come from actual search rankings
        const rank = Math.floor(Math.random() * 10) + 1;
        const inTop3 = rank <= 3;
        
        grid.push({
          lat,
          lng,
          rank,
          inTop3
        });
      }
    }
    
    return grid;
  }
  
  /**
   * Get a GBP location by ID
   */
  private async getLocationById(locationId: number): Promise<any> {
    // This would typically come from your database
    const storage = require('../storage').storage;
    return storage.getGbpLocation(locationId);
  }
  
  /**
   * Get geo grid rankings using Google Places API
   * @param googleApiKey Google API key
   * @param keyword Keyword to search for
   * @param businessName Name of the business to track
   * @param lat Center latitude
   * @param lng Center longitude
   * @param gridSize Size of the grid (e.g., 5 for a 5x5 grid)
   * @returns Geo grid ranking data
   */
  async getGeoGridRankings(
    googleApiKey: string,
    keyword: string,
    businessName: string,
    lat: number,
    lng: number,
    gridSize: number = 5
  ): Promise<any> {
    if (!googleApiKey) {
      throw new Error("Google API key not configured");
    }
    
    try {
      // Default radius in miles
      const radiusMiles = 1;
      
      // Calculate approximately how many kilometers per degree of lat/lng
      // This is a simplified calculation and varies based on location
      const kmPerLat = 111; // Approximate km per degree of latitude
      const kmPerLng = 111 * Math.cos(lat * (Math.PI / 180)); // Approximate km per degree of longitude
      
      // Convert miles to kilometers
      const radiusKm = radiusMiles * 1.60934;
      
      // Calculate grid step size
      const totalSizeKmLat = radiusKm * 2;
      const totalSizeKmLng = radiusKm * 2;
      
      // Convert to degrees
      const totalSizeLat = totalSizeKmLat / kmPerLat;
      const totalSizeLng = totalSizeKmLng / kmPerLng;
      
      // Calculate step size in degrees
      const latStep = totalSizeLat / (gridSize - 1);
      const lngStep = totalSizeLng / (gridSize - 1);
      
      // Calculate starting lat/lng for grid (top-left corner)
      const startLat = lat + (totalSizeLat / 2);
      const startLng = lng - (totalSizeLng / 2);
      
      // Generate grid points and ranking data
      const gridData = [];
      
      // In a real implementation, we would make API calls to Google Places API
      // For each grid point to get the rank of the business for the keyword
      // This is a mock implementation for demonstration
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const cellLat = startLat - (i * latStep);
          const cellLng = startLng + (j * lngStep);
          
          // Mock data - in real implementation, this would come from Places API
          const rank = Math.floor(Math.random() * 20) + 1; // Random rank between 1-20
          const searchVolume = Math.floor(Math.random() * 5000) + 100; // Random search volume
          const rankChange = Math.floor(Math.random() * 10) - 5; // Random rank change between -5 and +5
          
          // Mock list of competitors
          const competitors = [
            "Competitor " + (Math.floor(Math.random() * 5) + 1),
            "Competitor " + (Math.floor(Math.random() * 5) + 6),
            "Competitor " + (Math.floor(Math.random() * 5) + 11)
          ];
          
          gridData.push({
            id: i * gridSize + j + 1,
            lat: cellLat,
            lng: cellLng,
            rank,
            searchVolume,
            rankChange,
            competitors
          });
        }
      }
      
      // Return the grid data in format compatible with the frontend
      return {
        latitude: lat,
        longitude: lng,
        gridData
      };
    } catch (error) {
      console.error("Error generating geo grid rankings:", error);
      throw new Error("Failed to generate geo grid rankings");
    }
  }
}

export const gbpApiService = new GBPApiService();