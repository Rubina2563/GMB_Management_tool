/**
 * Test script for natural language sentiment analysis using the 'natural' package
 * 
 * This script demonstrates how to use the 'natural' package to analyze the sentiment
 * of text content without requiring external API services. This is useful for
 * analyzing customer reviews to understand positive and negative sentiments.
 */

import natural from 'natural';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a sentiment analyzer
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

// Function to analyze sentiment
function analyzeSentiment(text) {
  try {
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
      tokens: tokens.length
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

// Main function to run the tests
async function runTests() {
  console.log("==== Native Sentiment Analysis Test ====\n");
  
  // Process each sample review
  for (const review of sampleReviews) {
    console.log(`Testing: ${review.title}`);
    console.log(`Text: "${review.text}"`);
    
    const result = analyzeSentiment(review.text);
    
    if (result) {
      console.log(`\nResult: ${result.analysis}`);
      console.log(`Score: ${result.score} (between -1.0 and 1.0)`);
      console.log(`Tokens: ${result.tokens}`);
      console.log('\n---------------------------------------------------\n');
    } else {
      console.log("Analysis failed.\n");
      break;
    }
  }
}

// Run the tests
runTests();
