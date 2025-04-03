/**
 * Location Service
 * 
 * Provides methods for managing and retrieving GBP location data
 */

import { storage } from '../storage';

export class LocationService {
  /**
   * Get location data by ID
   * @param locationId The location ID to retrieve
   * @returns Location data or null if not found
   */
  async getLocation(locationId: number | string): Promise<any> {
    try {
      // Fetch location data from database
      const location = await storage.getLocationById(locationId);
      
      if (!location) {
        console.log(`No location found for ID: ${locationId}`);
        return null;
      }
      
      console.log(`Location found for ID ${locationId}:`, location.name);
      
      // Add additional metrics related to reviews, posts, and photos
      const reviewData = await this.getReviewMetrics(locationId);
      const postCount = await this.getPostCount(locationId);
      const photoCount = await this.getPhotoCount(locationId);
      
      return {
        ...location,
        rating: reviewData.averageRating,
        review_count: reviewData.count,
        response_rate: reviewData.responseRate,
        post_count: postCount,
        photo_count: photoCount
      };
    } catch (error) {
      console.error(`Error getting location ${locationId}:`, error);
      return null;
    }
  }

  /**
   * Get all locations for a user
   * @param userId The user ID to fetch locations for
   * @returns Array of locations
   */
  async getLocationsForUser(userId: number): Promise<any[]> {
    try {
      return await storage.getLocationsByUserId(userId);
    } catch (error) {
      console.error('Error getting locations for user:', error);
      return [];
    }
  }

  /**
   * Get review metrics for a location
   * @param locationId The location ID to check
   * @returns Review metrics including count, average rating, and response rate
   */
  private async getReviewMetrics(locationId: number | string): Promise<{
    count: number;
    averageRating: number;
    responseRate: number;
  }> {
    try {
      const reviews = await storage.getReviewsByLocationId(locationId);
      
      if (!reviews || reviews.length === 0) {
        return {
          count: 0,
          averageRating: 0,
          responseRate: 0
        };
      }
      
      const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
      const responseRate = this.calculateResponseRate(reviews);
      
      return {
        count: reviews.length,
        averageRating,
        responseRate
      };
    } catch (error) {
      console.error('Error getting review metrics:', error);
      return {
        count: 0,
        averageRating: 0,
        responseRate: 0
      };
    }
  }

  /**
   * Calculate the response rate for a set of reviews
   * @param reviews Array of reviews
   * @returns Response rate as a percentage
   */
  private calculateResponseRate(reviews: any[]): number {
    const reviewsWithResponses = reviews.filter(review => review.response !== null && review.response !== '');
    return reviews.length > 0 ? (reviewsWithResponses.length / reviews.length) * 100 : 0;
  }

  /**
   * Get the count of posts for a location
   * @param locationId The location ID to check
   * @returns Count of posts
   */
  private async getPostCount(locationId: number | string): Promise<number> {
    try {
      const posts = await storage.getPostsByLocationId(locationId);
      return posts?.length || 0;
    } catch (error) {
      console.error('Error getting post count:', error);
      return 0;
    }
  }

  /**
   * Get the count of photos for a location
   * @param locationId The location ID to check
   * @returns Count of photos
   */
  private async getPhotoCount(locationId: number | string): Promise<number> {
    try {
      const photos = await storage.getPhotosByLocationId(locationId);
      return photos?.length || 0;
    } catch (error) {
      console.error('Error getting photo count:', error);
      return 0;
    }
  }
}