/**
 * Language Model Service
 * Handles operations for language model APIs and content generation
 */

import axios from 'axios';
import { dbService } from '../db';
import { storage } from '../storage';
import { LLMProvider } from '@shared/schema';

interface LanguageModelSettings {
  provider: string;
  apiKey: string;
  lastTested: Date | null;
  isValid: boolean;
}

type ContentType = 'post' | 'review-reply';

export class LanguageModelService {
  private userSettings: Map<number, LanguageModelSettings> = new Map();

  constructor() {
    // Initialize with default settings
    this.initializeDefaultSettings();
  }

  /**
   * Initialize with default settings for testing purposes
   */
  private async initializeDefaultSettings() {
    // This is just for development - in production we would load from a database
    console.log('Initializing language model service');
  }

  /**
   * Save user's language model settings
   */
  async saveSettings(userId: number, provider: string, apiKey: string): Promise<LanguageModelSettings> {
    try {
      // Validate API key by making a test call to the API
      const isValid = await this.testAPIKey(provider, apiKey);

      // Create settings object
      const settings: LanguageModelSettings = {
        provider,
        apiKey,
        lastTested: new Date(),
        isValid
      };

      // Save settings in memory (in production, save to database)
      this.userSettings.set(userId, settings);

      // Save to database using the apiKeys table
      // This uses the existing API keys structure from server/db.ts
      const existingKeys = await dbService.getApiKeys(userId);
      
      if (existingKeys) {
        // Update existing keys
        await dbService.updateApiKeys(userId, {
          ...existingKeys,
          language_model_provider: provider,
          // Store different API keys based on provider
          openai_api_key: provider === 'openai' ? apiKey : existingKeys.openai_api_key,
          claude_api_key: provider === 'claude' ? apiKey : existingKeys.claude_api_key,
          grok_api_key: provider === 'grok' ? apiKey : existingKeys.grok_api_key,
          deepseek_api_key: provider === 'deepseek' ? apiKey : existingKeys.deepseek_api_key,
        });
      } else {
        // Create new keys
        await dbService.saveApiKeys(userId, {
          data_for_seo_key: '',
          data_for_seo_email: '',
          google_api_key: '',
          google_client_id: '',
          google_client_secret: '',
          gbp_client_id: '',
          gbp_client_secret: '',
          gbp_redirect_uri: '',
          serp_api_key: '',
          language_model_provider: provider,
          openai_api_key: provider === 'openai' ? apiKey : '',
          claude_api_key: provider === 'claude' ? apiKey : '',
          grok_api_key: provider === 'grok' ? apiKey : '',
          deepseek_api_key: provider === 'deepseek' ? apiKey : '',
        });
      }

      return settings;
    } catch (error) {
      console.error('Error saving language model settings:', error);
      throw error;
    }
  }

  /**
   * Get user's language model settings
   */
  async getSettings(userId: number): Promise<LanguageModelSettings | null> {
    try {
      // First check in-memory cache
      if (this.userSettings.has(userId)) {
        return this.userSettings.get(userId) || null;
      }

      // Otherwise load from database
      const apiKeys = await dbService.getApiKeys(userId);
      
      if (!apiKeys || !apiKeys.language_model_provider) {
        return null;
      }

      // Get the API key based on the provider
      let apiKey = '';
      switch (apiKeys.language_model_provider) {
        case 'openai':
          apiKey = apiKeys.openai_api_key || '';
          break;
        case 'claude':
          apiKey = apiKeys.claude_api_key || '';
          break;
        case 'grok':
          apiKey = apiKeys.grok_api_key || '';
          break;
        case 'deepseek':
          apiKey = apiKeys.deepseek_api_key || '';
          break;
      }

      // Create settings object
      const settings: LanguageModelSettings = {
        provider: apiKeys.language_model_provider,
        apiKey,
        lastTested: null,
        isValid: !!apiKey // Assume valid if API key exists
      };

      // Cache settings
      this.userSettings.set(userId, settings);

      return settings;
    } catch (error) {
      console.error('Error getting language model settings:', error);
      throw error;
    }
  }

  /**
   * Generate AI content (posts or review replies)
   */
  async generateContent(userId: number, type: ContentType, prompt: string): Promise<string> {
    try {
      // Get user's language model settings
      const settings = await this.getSettings(userId);
      
      if (!settings) {
        throw new Error('Language model not configured. Please set up your API keys in the admin panel.');
      }

      if (!settings.isValid) {
        throw new Error('Invalid API key. Please check your API key and try again.');
      }

      // Enhance prompt based on content type
      let enhancedPrompt = prompt;
      if (type === 'post') {
        enhancedPrompt = `Write a professional and engaging Google Business Profile post: ${prompt}. The content should be concise (under 1500 characters), engaging, and include a clear call to action.`;
      } else if (type === 'review-reply') {
        enhancedPrompt = `Write a professional, friendly, and concise reply to this customer review: ${prompt}. The reply should thank the customer, address their specific feedback, and demonstrate that you value their opinion. Keep the tone professional and positive.`;
      }

      // Generate content based on provider
      return await this.generateFromLLM(settings.provider, settings.apiKey, enhancedPrompt);
    } catch (error: any) {
      console.error('Error generating content:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Test API key by making a simple request to the provider
   */
  private async testAPIKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      // Make a simple request to test API key
      const testPrompt = "This is a test request to verify API key validity. Please respond with 'valid'.";
      await this.generateFromLLM(provider, apiKey, testPrompt);
      return true;
    } catch (error) {
      console.error(`Error validating ${provider} API key:`, error);
      return false;
    }
  }

  /**
   * Generate content from language model based on provider
   */
  private async generateFromLLM(provider: string, apiKey: string, prompt: string): Promise<string> {
    try {
      switch (provider) {
        case 'openai':
          return await this.generateFromOpenAI(apiKey, prompt);
        case 'claude':
          return await this.generateFromClaude(apiKey, prompt);
        case 'grok':
          return await this.generateFromGrok(apiKey, prompt);
        case 'deepseek':
          return await this.generateFromDeepSeek(apiKey, prompt);
        default:
          throw new Error(`Unsupported language model provider: ${provider}`);
      }
    } catch (error: any) {
      console.error(`Error generating from ${provider}:`, error);
      throw new Error(`API Error: ${error.message}`);
    }
  }

  /**
   * Generate content from OpenAI
   */
  private async generateFromOpenAI(apiKey: string, prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that writes professional and engaging content for business profiles.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'OpenAI API error');
    }
  }

  /**
   * Generate content from Claude (Anthropic)
   */
  private async generateFromClaude(apiKey: string, prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-2',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error: any) {
      console.error('Claude API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Claude API error');
    }
  }

  /**
   * Generate content from Grok (xAI)
   * Note: This is a placeholder implementation as the actual API may differ
   */
  private async generateFromGrok(apiKey: string, prompt: string): Promise<string> {
    try {
      // This is a placeholder - replace with actual API endpoint when available
      const response = await axios.post(
        'https://api.grok.ai/v1/chat/completions',
        {
          model: 'grok-1',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      // Adjust based on actual API response format
      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Grok API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Grok API error');
    }
  }

  /**
   * Generate content from DeepSeek
   * Note: This is a placeholder implementation as the actual API may differ
   */
  private async generateFromDeepSeek(apiKey: string, prompt: string): Promise<string> {
    try {
      // This is a placeholder - replace with actual API endpoint when available
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      // Adjust based on actual API response format
      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'DeepSeek API error');
    }
  }
}

export const languageModelService = new LanguageModelService();