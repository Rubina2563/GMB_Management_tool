/**
 * Test script for Google Natural Language API sentiment analysis
 * 
 * This script demonstrates how to use the Google Natural Language API to analyze
 * the sentiment of review texts for determining positive, negative, or neutral
 * sentiment. The API is used to generate metrics for the reviews feature.
 * 
 * Usage: node test-google-sentiment.js
 * 
 * Make sure the GOOGLE_API_KEY is set in the .env file
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Analyze sentiment of a text using Google Natural Language API
 * @param {string} text The text to analyze
 * @returns {Promise<Object>} Sentiment analysis result
 */
async function analyzeSentiment(text) {
  try {
    // Check for API key
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("No Google API key found. Set GOOGLE_API_KEY in .env file");
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
      analysis
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error.message);
    
    if (error.message.includes("API key")) {
      console.error("Please make sure you have a valid Google API key set in your .env file");
    }
    
    // Return a fallback result
    return {
      score: 0,
      magnitude: 0,
      analysis: "Error",
      error: error.message
    };
  }
}

/**
 * Run tests for sentiment analysis using sample reviews
 */
async function runTests() {
  console.log("=== Testing Google Natural Language API Sentiment Analysis ===\n");
  
  const testReviews = [
    "This place is amazing! The staff is super friendly and they always go above and beyond to help. I highly recommend their services!",
    "Not impressed with my experience. The wait was too long and the staff seemed disinterested. Wouldn't go back again.",
    "Average service. Nothing special but nothing terrible either. Prices are reasonable.",
    "Absolutely terrible experience. Rude staff, overpriced services, and the quality was poor. Stay away!",
    "Great location, friendly staff, but prices are a bit high. Overall a good experience though."
  ];
  
  console.log("Testing individual reviews:\n");
  
  let count = 1;
  for (const review of testReviews) {
    console.log(`Review ${count}:`, review);
    const result = await analyzeSentiment(review);
    
    if (result.error) {
      console.log(`ERROR: ${result.error}`);
    } else {
      console.log(`Sentiment: ${result.analysis} (Score: ${result.score.toFixed(2)}, Magnitude: ${result.magnitude.toFixed(2)})`);
    }
    
    console.log("---");
    count++;
  }
  
  console.log("\n=== Testing Batch Analysis ===\n");
  console.log("Analyzing distribution of all reviews...");
  
  try {
    // Collect all results
    const results = [];
    for (const review of testReviews) {
      const result = await analyzeSentiment(review);
      results.push(result);
    }
    
    // Calculate distribution
    const positive = results.filter(r => r.analysis === "Positive" || r.analysis === "Highly positive").length;
    const neutral = results.filter(r => r.analysis === "Neutral").length;
    const negative = results.filter(r => r.analysis === "Negative" || r.analysis === "Highly negative").length;
    const error = results.filter(r => r.analysis === "Error").length;
    
    // Show distribution
    console.log("\nSentiment Distribution:");
    console.log(`Positive: ${positive} (${Math.round((positive / testReviews.length) * 100)}%)`);
    console.log(`Neutral: ${neutral} (${Math.round((neutral / testReviews.length) * 100)}%)`);
    console.log(`Negative: ${negative} (${Math.round((negative / testReviews.length) * 100)}%)`);
    if (error > 0) {
      console.log(`Error: ${error} (${Math.round((error / testReviews.length) * 100)}%)`);
    }
  } catch (error) {
    console.error("Error in batch analysis:", error);
  }
}

// Run the tests
runTests().catch(console.error);