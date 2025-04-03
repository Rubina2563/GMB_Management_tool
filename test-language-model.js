/**
 * Test script for Language Model API integration
 * 
 * This script tests the connection to different language model APIs using the
 * credentials from the .env file. It demonstrates how to use the various providers for
 * generating AI content for review replies and posts.
 * 
 * Usage: node test-language-model.js
 * 
 * Make sure the appropriate API key is set in the .env file:
 * - OPENAI_API_KEY for OpenAI
 * - CLAUDE_API_KEY for Claude (Anthropic)
 * - GROK_API_KEY for Grok (Tesla/xAI)
 * - DEEPSEEK_API_KEY for DeepSeek
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Prompt templates
const POST_PROMPT = 'Write a Google Business Profile post announcing a summer sale with 30% off all products.';
const REVIEW_PROMPT = 'Write a reply to this 4-star review: "Great service but the waiting time was a bit long. Food was excellent though!"';

// Available providers
const PROVIDERS = ['openai', 'claude', 'grok', 'deepseek'];

/**
 * Test the OpenAI API
 */
async function testOpenAI(prompt) {
  console.log('\n======== Testing OpenAI ========');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('❌ Error: OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  try {
    console.log('🔄 Sending request to OpenAI API...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that writes professional content for businesses.' },
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
    
    console.log('✅ Success! OpenAI API response:');
    console.log('----------------------------------------');
    console.log(response.data.choices[0].message.content.trim());
    console.log('----------------------------------------');
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.log('❌ Error making OpenAI API request:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Error data:', error.response.data);
    } else {
      console.log(error.message);
    }
    return null;
  }
}

/**
 * Test the Claude API (Anthropic)
 */
async function testClaude(prompt) {
  console.log('\n======== Testing Claude (Anthropic) ========');
  
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.log('❌ Error: CLAUDE_API_KEY not found in environment variables');
    return;
  }
  
  try {
    console.log('🔄 Sending request to Claude API...');
    
    // Note: Claude API implementation may vary. This is a simplified example.
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-2',
        max_tokens: 500,
        messages: [
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    console.log('✅ Success! Claude API response:');
    console.log('----------------------------------------');
    console.log(response.data.content[0].text);
    console.log('----------------------------------------');
    return response.data.content[0].text;
  } catch (error) {
    console.log('❌ Error making Claude API request:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Error data:', error.response.data);
    } else {
      console.log(error.message);
    }
    return null;
  }
}

/**
 * Mock function for testing a generic LLM API
 * Used for providers that may not have easily accessible APIs (Grok, DeepSeek)
 */
async function testGenericLLM(provider, prompt) {
  console.log(`\n======== Testing ${provider} ========`);
  
  const envVarName = `${provider.toUpperCase()}_API_KEY`;
  const apiKey = process.env[envVarName];
  
  if (!apiKey) {
    console.log(`❌ Error: ${envVarName} not found in environment variables`);
    return;
  }
  
  console.log(`⚠️ Note: This is a mock implementation for ${provider}`);
  console.log(`🔄 The actual implementation would use the ${provider} API`);
  
  // Return a mock response
  const mockResponses = {
    grok: `This is a simulated response from ${provider}.\n\nThe actual implementation would call the ${provider} API with your prompt:\n"${prompt}"`,
    deepseek: `This is a simulated response from ${provider}.\n\nThe actual implementation would call the ${provider} API with your prompt:\n"${prompt}"`
  };
  
  console.log('✅ Mock success! Response:');
  console.log('----------------------------------------');
  console.log(mockResponses[provider] || 'Mock response');
  console.log('----------------------------------------');
  
  return mockResponses[provider] || 'Mock response';
}

/**
 * Run tests for all available providers
 */
async function runTests() {
  console.log('🧪 Testing Language Model API Integration');
  console.log('========================================');
  
  // Test post generation
  console.log('\n📝 TESTING POST GENERATION');
  console.log('Prompt:', POST_PROMPT);
  
  for (const provider of PROVIDERS) {
    try {
      if (provider === 'openai') {
        await testOpenAI(POST_PROMPT);
      } else if (provider === 'claude') {
        await testClaude(POST_PROMPT);
      } else {
        await testGenericLLM(provider, POST_PROMPT);
      }
    } catch (error) {
      console.log(`Error testing ${provider}:`, error.message);
    }
  }
  
  // Test review reply generation
  console.log('\n💬 TESTING REVIEW REPLY GENERATION');
  console.log('Prompt:', REVIEW_PROMPT);
  
  for (const provider of PROVIDERS) {
    try {
      if (provider === 'openai') {
        await testOpenAI(REVIEW_PROMPT);
      } else if (provider === 'claude') {
        await testClaude(REVIEW_PROMPT);
      } else {
        await testGenericLLM(provider, REVIEW_PROMPT);
      }
    } catch (error) {
      console.log(`Error testing ${provider}:`, error.message);
    }
  }
  
  console.log('\n✨ Language Model API Tests Complete ✨');
}

// Run all tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});