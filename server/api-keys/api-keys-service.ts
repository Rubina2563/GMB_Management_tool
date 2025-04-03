/**
 * API Keys Service
 * Handles operations for API key management
 */

import { ApiKeysData } from '@shared/schema';
import { storage } from '../storage';

/**
 * API Keys Service
 * Handles operations related to API key management and validation
 */
class ApiKeysService {
  /**
   * Get API keys for a user
   * @param userId User ID
   * @returns API keys object or null if not found
   */
  async getUserApiKeys(userId: number) {
    return storage.getApiKeysByUserId(userId);
  }

  /**
   * Update API keys for a user
   * @param userId User ID
   * @param apiKeys API keys object
   * @returns Success status and message
   */
  async updateUserApiKeys(userId: number, apiKeys: Partial<ApiKeysData>) {
    try {
      const result = await storage.updateApiKeysByUserId(userId, apiKeys);
      
      if (!result) {
        return {
          success: false,
          message: 'API keys not found for user'
        };
      }
      
      return {
        success: true,
        message: 'API keys updated successfully',
        apiKeys: result
      };
    } catch (error) {
      console.error('Error updating API keys:', error);
      return {
        success: false,
        message: 'Failed to update API keys'
      };
    }
  }

  /**
   * Validate DataForSEO API credentials
   * @param email DataForSEO API email
   * @param apiKey DataForSEO API key
   * @returns Success status and message
   */
  async validateDataForSEOCredentials(email: string, apiKey: string) {
    // This is a placeholder for the actual validation
    // In a real implementation, we would make a test call to the DataForSEO API
    
    if (!email || !apiKey) {
      return {
        success: false,
        message: 'DataForSEO email and API key are required'
      };
    }
    
    // Basic format validation
    if (!email.includes('@') || apiKey.length < 8) {
      return {
        success: false,
        message: 'Invalid DataForSEO credentials format'
      };
    }
    
    return {
      success: true,
      message: 'DataForSEO credentials are valid'
    };
  }

  /**
   * Validate Google API key
   * @param apiKey Google API key
   * @returns Success status and message
   */
  async validateGoogleApiKey(apiKey: string) {
    // This is a placeholder for the actual validation
    // In a real implementation, we would make a test call to a Google API
    
    if (!apiKey) {
      return {
        success: false,
        message: 'Google API key is required'
      };
    }
    
    // Basic format validation for Google API keys (typically start with 'AIza')
    if (!apiKey.startsWith('AIza') && !apiKey.startsWith('mock-')) {
      return {
        success: false,
        message: 'Invalid Google API key format'
      };
    }
    
    return {
      success: true,
      message: 'Google API key is valid'
    };
  }

  /**
   * Check if a user has the required API keys for a specific operation
   * @param userId User ID
   * @param requiredKeys Array of required API key names
   * @returns Object with missing keys and validation status
   */
  async checkRequiredApiKeys(userId: number, requiredKeys: string[]) {
    const apiKeys = await this.getUserApiKeys(userId);
    
    if (!apiKeys) {
      return {
        success: false,
        message: 'API keys not found for user',
        missingKeys: requiredKeys
      };
    }
    
    const missingKeys: string[] = [];
    
    // Check each required key
    for (const key of requiredKeys) {
      // @ts-ignore - We're using dynamic property access
      if (!apiKeys[key]) {
        missingKeys.push(key);
      }
    }
    
    if (missingKeys.length > 0) {
      return {
        success: false,
        message: 'Some required API keys are missing',
        missingKeys
      };
    }
    
    return {
      success: true,
      message: 'All required API keys are available'
    };
  }
}

export const apiKeysService = new ApiKeysService();