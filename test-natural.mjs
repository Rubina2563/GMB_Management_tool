/**
 * Test script for Natural Language sentiment analysis using the natural package
 * 
 * This script demonstrates how to use the natural package to perform basic NLP
 * and sentiment analysis on review text.
 */

import natural from 'natural';

// Set up the Sentiment analyzer
const Sentiment = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Sentiment('English', stemmer, 'afinn');

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

// Function to analyze sentiment using the natural package
function analyzeSentiment(text) {
  // Tokenize the text
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text);
  
  // Get sentiment score
  const score = analyzer.getSentiment(tokens);
  
  // Normalize to -1 to 1 range
  const normalizedScore = Math.max(-1, Math.min(1, score));
  
  // Determine sentiment category based on score
  let analysis = "Neutral";
  if (normalizedScore > 0.3) analysis = "Positive";
  if (normalizedScore > 0.6) analysis = "Highly positive";
  if (normalizedScore < -0.3) analysis = "Negative";
  if (normalizedScore < -0.6) analysis = "Highly negative";
  
  // Calculate magnitude (strength of sentiment) as absolute value
  const magnitude = Math.abs(normalizedScore) * 2;
  
  return {
    score: normalizedScore,
    magnitude,
    analysis,
    tokens: tokens.length
  };
}

// Extract key phrases from text
function extractKeyPhrases(text) {
  // Create a TF-IDF (Term Frequency-Inverse Document Frequency) model
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  
  // Add documents (in this case, just one)
  tfidf.addDocument(text);
  
  // Extract terms with highest score (potential key phrases)
  const keyPhrases = [];
  tfidf.listTerms(0 /* document index */).slice(0, 10).forEach(item => {
    keyPhrases.push({term: item.term, tfidf: item.tfidf});
  });
  
  return keyPhrases;
}

// Main function to run the tests
function runTests() {
  console.log("==== Natural Package Sentiment Analysis Test ====\n");
  
  // Process each sample review
  for (const review of sampleReviews) {
    console.log(`Testing: ${review.title}`);
    console.log(`Text: "${review.text}"`);
    
    // Analyze sentiment
    const sentimentResult = analyzeSentiment(review.text);
    
    console.log(`\nResult: ${sentimentResult.analysis}`);
    console.log(`Score: ${sentimentResult.score.toFixed(2)} (between -1.0 and 1.0)`);
    console.log(`Magnitude: ${sentimentResult.magnitude.toFixed(2)} (strength of emotion)`);
    console.log(`Tokens analyzed: ${sentimentResult.tokens}`);
    
    // Extract key phrases
    const keyPhrases = extractKeyPhrases(review.text);
    
    console.log("\nKey Phrases:");
    keyPhrases.slice(0, 5).forEach(phrase => {
      console.log(`  - ${phrase.term} (score: ${phrase.tfidf.toFixed(2)})`);
    });
    
    console.log('\n---------------------------------------------------\n');
  }
}

// Run the tests
runTests();