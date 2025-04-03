/**
 * Test script for Google Natural Language API sentiment analysis using googleapis
 * 
 * This script demonstrates how to use the Google Natural Language API to 
 * analyze the sentiment of text content using the googleapis library.
 */

import { google } from 'googleapis';

// Create a test function to analyze the sentiment of sample review text
async function analyzeSentiment(text, apiKey) {
  try {
    // Check for Google API key
    if (!apiKey) {
      console.error("ERROR: Missing Google API key");
      return null;
    }

    // Initialize Google Natural Language API client
    const language = google.language({
      version: 'v1',
      auth: apiKey
    });
    
    // Make API call
    const response = await language.documents.analyzeSentiment({
      requestBody: {
        document: {
          type: 'PLAIN_TEXT',
          content: text
        }
      }
    });
    
    // Extract sentiment data
    const sentiment = response.data.documentSentiment;
    
    if (!sentiment) {
      throw new Error("No sentiment data returned");
    }
    
    const score = sentiment.score || 0;
    const magnitude = sentiment.magnitude || 0;
    
    // Determine sentiment category based on score
    let analysis = "Neutral";
    if (score > 0.3) analysis = "Positive";
    if (score > 0.6) analysis = "Highly positive";
    if (score < -0.3) analysis = "Negative";
    if (score < -0.6) analysis = "Highly negative";
    
    return {
      score,
      magnitude,
      analysis,
      details: response.data
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return null;
  }
}

// Sample review texts to analyze
const sampleReviews = [
  {
    title: "Positive Review",
    text: "The customer service was excellent! They were so helpful and friendly. I will definitely come back and recommend to my friends."
  },
  {
    title: "Neutral Review",
    text: "The product was okay. It works as expected but nothing special. Delivery was on time."
  },
  {
    title: "Negative Review",
    text: "Very disappointed with the quality. The item broke after a week and customer service was slow to respond. Would not buy again."
  },
  {
    title: "Mixed Review",
    text: "Great product quality and features but the price is too high compared to competitors. The staff were friendly though."
  }
];

// Simple fallback sentiment analysis using word lists
function simpleSentimentAnalysis(text) {
  const tokens = text.toLowerCase().split(' ');
  
  // Simple sentiment analysis based on positive and negative word counts
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'outstanding', 'fantastic', 'wonderful', 'best', 'love', 'helpful', 'friendly', 'professional'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'worst', 'horrible', 'disappointing', 'disappointed', 'slow', 'rude', 'unhelpful', 'unprofessional'];
  
  const positiveCount = tokens.filter(word => positiveWords.includes(word)).length;
  const negativeCount = tokens.filter(word => negativeWords.includes(word)).length;
  
  const score = (positiveCount - negativeCount) / Math.max(tokens.length, 1);
  const normalizedScore = Math.max(-1, Math.min(1, score * 5)); // Scale to -1 to 1
  
  // Determine sentiment category
  let analysis = "Neutral";
  if (normalizedScore > 0.3) analysis = "Positive";
  if (normalizedScore > 0.6) analysis = "Highly positive";
  if (normalizedScore < -0.3) analysis = "Negative";
  if (normalizedScore < -0.6) analysis = "Highly negative";
  
  return {
    score: normalizedScore,
    magnitude: Math.abs(normalizedScore) * 2,
    analysis,
    fallback: true
  };
}

// Main function to run the tests
async function runTests() {
  console.log("==== Google Natural Language API Sentiment Analysis Test ====\n");
  
  // Get API key from command line arguments or environment variable
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log("No Google API key provided. Using fallback sentiment analysis method.\n");
  } else {
    console.log("Using Google Natural Language API for sentiment analysis.\n");
  }
  
  // Process each sample review
  for (const review of sampleReviews) {
    console.log(`Testing: ${review.title}`);
    console.log(`Text: "${review.text}"`);
    
    let result;
    if (apiKey) {
      // Try to use Google API first
      result = await analyzeSentiment(review.text, apiKey);
    }
    
    // If Google API fails or no key is provided, use fallback
    if (!result) {
      console.log("Using fallback sentiment analysis method.");
      result = simpleSentimentAnalysis(review.text);
    }
    
    console.log(`\nResult: ${result.analysis}`);
    console.log(`Score: ${result.score} (between -1.0 and 1.0)`);
    console.log(`Magnitude: ${result.magnitude} (strength of emotion)`);
    console.log(`Method: ${result.fallback ? 'Fallback' : 'Google API'}`);
    console.log('\n---------------------------------------------------\n');
  }
}

// Run the tests
runTests();