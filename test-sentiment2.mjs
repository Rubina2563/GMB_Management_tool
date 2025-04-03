/**
 * Test script for Google Natural Language API sentiment analysis using googleapis
 * 
 * This script demonstrates how to use the Google Natural Language API to 
 * analyze the sentiment of text content using the googleapis library.
 */

import { LanguageServiceClient } from '@google-cloud/language';
import natural from 'natural';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Function to analyze sentiment using Google Cloud Natural Language API
async function analyzeSentiment(text, apiKey) {
  try {
    // Check for Google API key
    if (!apiKey) {
      console.log("No Google API key provided, falling back to simple analysis");
      return simpleSentimentAnalysis(text);
    }

    console.log("Attempting to use Google Natural Language API...");
    
    // Create a client
    const client = new LanguageServiceClient({
      apiKey: apiKey
    });

    // Prepare the document for analysis
    const document = {
      content: text,
      type: 'PLAIN_TEXT',
    };

    // Call the Natural Language API to analyze sentiment
    const [result] = await client.analyzeSentiment({document});
    const sentiment = result.documentSentiment;

    // Determine sentiment category based on score
    let analysis = "Neutral";
    if (sentiment.score > 0.3) analysis = "Positive";
    if (sentiment.score > 0.6) analysis = "Highly positive";
    if (sentiment.score < -0.3) analysis = "Negative";
    if (sentiment.score < -0.6) analysis = "Highly negative";

    console.log("Successfully used Google Natural Language API");
    
    // Return formatted result
    return {
      score: sentiment.score,
      magnitude: sentiment.magnitude,
      analysis: analysis,
      provider: "google-cloud",
      details: result
    };
  } catch (error) {
    console.log("Error with Google API, falling back to simple analysis:", error.message);
    return simpleSentimentAnalysis(text);
  }
}

// Function to analyze sentiment using the natural package (fallback)
function simpleSentimentAnalysis(text) {
  try {
    // Create a sentiment analyzer
    const Analyzer = natural.SentimentAnalyzer;
    const stemmer = natural.PorterStemmer;
    const analyzer = new Analyzer("English", stemmer, "afinn");

    // Tokenize the text
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text);
    
    // Get sentiment score
    const score = analyzer.getSentiment(tokens);
    
    // Determine sentiment category based on score
    let analysis = "Neutral";
    if (score > 0.3) analysis = "Positive";
    if (score > 0.6) analysis = "Highly positive";
    if (score < -0.3) analysis = "Negative";
    if (score < -0.6) analysis = "Highly negative";
    
    // Return the analysis
    return {
      score: score,
      analysis: analysis,
      tokens: tokens.length,
      provider: "natural-js"
    };
  } catch (error) {
    console.error("Error with fallback sentiment analysis:", error);
    return {
      score: 0,
      analysis: "Neutral",
      error: error.message,
      provider: "fallback-error"
    };
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

// Main function to run the tests
async function runTests() {
  console.log("==== Sentiment Analysis Test ====\n");
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  console.log(`Google API Key available: ${apiKey ? 'Yes' : 'No'}`);
  console.log("This test will try to use Google Natural Language API and fall back to local analysis if needed\n");
  
  // Process each sample review
  for (const review of sampleReviews) {
    console.log(`Testing: ${review.title}`);
    console.log(`Text: "${review.text}"`);
    
    const result = await analyzeSentiment(review.text, apiKey);
    
    if (result) {
      console.log(`\nResult: ${result.analysis}`);
      console.log(`Score: ${result.score} (between -1.0 and 1.0)`);
      console.log(`Provider: ${result.provider}`);
      if (result.magnitude !== undefined) {
        console.log(`Magnitude: ${result.magnitude} (strength of emotion)`);
      }
      if (result.tokens !== undefined) {
        console.log(`Tokens: ${result.tokens}`);
      }
      console.log('\n---------------------------------------------------\n');
    } else {
      console.log("Analysis failed. Please check your implementation.\n");
      break;
    }
  }
}

// Run the tests
runTests().catch(error => {
  console.error("Error running tests:", error);
});