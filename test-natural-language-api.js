/**
 * Test script for Google Natural Language API
 * 
 * This script tests the connection to the Google Natural Language API
 * using the credentials from environment variables.
 * 
 * Usage: node test-natural-language-api.js
 * 
 * Make sure you have the following environment variables set:
 * - GOOGLE_MAPS_API_KEY or NEW_GOOGLE_MAPS_API_KEY
 */

import * as dotenv from 'dotenv';
import { LanguageServiceClient } from '@google-cloud/language';
dotenv.config();

async function testNaturalLanguage() {
  try {
    console.log('Testing Google Natural Language API');
    
    // Sample text to analyze
    const text = 'I love this place! The service was excellent and the food was amazing.';
    
    console.log(`Text to analyze: "${text}"`);
    
    // Create a client with explicit credentials
    const client = new LanguageServiceClient();
    
    // Prepare the request
    const document = {
      content: text,
      type: 'PLAIN_TEXT',
    };
    
    // Analyze sentiment
    const [result] = await client.analyzeSentiment({document});
    const sentiment = result.documentSentiment;
    
    console.log('✅ Google Natural Language API connection successful!');
    console.log('Document sentiment:', {
      score: sentiment.score,  // -1.0 (negative) to 1.0 (positive)
      magnitude: sentiment.magnitude,  // Overall strength of emotion
    });
    
    // Analyze entities
    const [entityResult] = await client.analyzeEntities({document});
    const entities = entityResult.entities;
    
    console.log('\nEntities detected:');
    entities.forEach(entity => {
      console.log(`- ${entity.name} (${entity.type}): confidence ${entity.salience}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error testing Google Natural Language API:', error.message);
    if (error.details) console.error('Error details:', error.details);
    console.log('\nTrying alternative implementation...');
    
    // Try simple REST API approach as alternative
    return await testNaturalLanguageWithAxios();
  }
}

async function testNaturalLanguageWithAxios() {
  try {
    console.log('\nTesting Google Natural Language API using REST approach');
    
    // Try to import axios
    const axios = (await import('axios')).default;
    
    // Sample text to analyze
    const text = 'I love this place! The service was excellent and the food was amazing.';
    
    // Try the API keys in order
    const apiKeys = [
      process.env.GOOGLE_MAPS_API_KEY,
      process.env.NEW_GOOGLE_MAPS_API_KEY,
      process.env.GOOGLE_MAPS_PLATFORM_API_KEY
    ].filter(Boolean);
    
    if (apiKeys.length === 0) {
      console.error('❌ No Google API keys found in environment variables');
      return false;
    }
    
    for (const apiKey of apiKeys) {
      console.log(`Attempting with API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
      
      const url = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${apiKey}`;
      const data = {
        document: {
          type: 'PLAIN_TEXT',
          content: text
        },
        encodingType: 'UTF8'
      };
      
      try {
        const response = await axios.post(url, data);
        
        if (response.status === 200) {
          console.log('✅ Google Natural Language API connection successful with REST approach!');
          console.log('Document sentiment:', {
            score: response.data.documentSentiment.score,
            magnitude: response.data.documentSentiment.magnitude
          });
          return true;
        }
      } catch (innerError) {
        console.error(`Failed with this key: ${innerError.message}`);
        if (innerError.response) {
          console.error('Response data:', innerError.response.data);
          console.error('Response status:', innerError.response.status);
        }
        // Continue trying with next key
      }
    }
    
    console.error('❌ All API keys failed for Natural Language API');
    return false;
  } catch (error) {
    console.error('❌ Error in alternative implementation:', error.message);
    return false;
  }
}

/**
 * Run the test
 */
async function runTest() {
  try {
    const result = await testNaturalLanguage();
    
    console.log('\n--- Test Summary ---');
    console.log(`Google Natural Language API: ${result ? '✅ Successful' : '❌ Failed'}`);
    
    if (!result) {
      console.log('\n--- Troubleshooting Tips ---');
      console.log('1. Make sure the Natural Language API is enabled in your Google Cloud Console');
      console.log('2. Verify that billing is enabled for your project');
      console.log('3. Check that your API key has access to the Natural Language API');
      console.log('4. Consider using application default credentials instead of an API key');
    }
  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }
}

// Run the test
runTest();