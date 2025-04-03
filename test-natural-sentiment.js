/**
 * Test script for the natural package sentiment analysis
 * 
 * This script demonstrates how to use the natural package to analyze sentiment
 * without requiring external API services. This is useful when Google Natural
 * Language API is not available or as a fallback mechanism.
 * 
 * Usage: node test-natural-sentiment.js
 */

import natural from 'natural';
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();
const analyzer = new Analyzer("English", stemmer, "afinn");

// Sample reviews to analyze (same as the Google API test)
const sampleReviews = [
  "This restaurant is amazing! The food was delicious and the service was excellent.",
  "Terrible experience. Slow service, cold food, and overpriced.",
  "It was okay. Nothing special but not bad either.",
  "The staff was friendly but the food took forever to arrive. Probably won't go back.",
  "Best place in town! Every dish we tried was perfect and the staff treated us like family."
];

/**
 * Analyze the sentiment of a text using a dictionary-based approach
 * @param {string} text Text to analyze
 * @returns {Object} Analysis result with score and classification
 */
function analyzeSentiment(text) {
  // Tokenize the text
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Calculate the sentiment score
  let score = analyzer.getSentiment(tokens);
  
  // Normalize the score to be between -1 and 1
  // AFINN gives scores that are not bounded, so we need to normalize
  // These thresholds can be adjusted based on your specific needs
  score = Math.max(-1, Math.min(1, score));
  
  // Calculate magnitude based on the absolute values of individual word scores
  let magnitude = 0;
  tokens.forEach(token => {
    const wordScore = analyzer.getSentiment([token]);
    magnitude += Math.abs(wordScore);
  });
  
  // Normalize magnitude to be roughly comparable to Google API
  magnitude = Math.min(2, magnitude / 5);
  
  // Determine sentiment classification
  let classification;
  if (score >= 0.5) {
    classification = 'Highly positive';
  } else if (score >= 0.1) {
    classification = 'Positive';
  } else if (score > -0.1) {
    classification = 'Neutral';
  } else if (score > -0.5) {
    classification = 'Negative';
  } else {
    classification = 'Highly negative';
  }
  
  return {
    score,
    magnitude,
    classification
  };
}

/**
 * Extract key phrases from a text
 * This is a simple implementation that finds frequent words and pairs
 * @param {string} text The text to analyze
 * @returns {string[]} Array of key phrases
 */
function extractKeyPhrases(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Filter out common stop words
  const stopWords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 
                    'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 
                    'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 
                    'itself', 'they', 'them', 'their', 'theirs', 'themselves', 
                    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 
                    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 
                    'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 
                    'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 
                    'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 
                    'into', 'through', 'during', 'before', 'after', 'above', 'below', 
                    'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 
                    'under', 'again', 'further', 'then', 'once', 'here', 'there', 
                    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 
                    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 
                    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 
                    's', 't', 'can', 'will', 'just', 'don', 'don\'t', 'should', 
                    'should\'ve', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 
                    'ain', 'aren', 'aren\'t', 'couldn', 'couldn\'t', 'didn', 
                    'didn\'t', 'doesn', 'doesn\'t', 'hadn', 'hadn\'t', 'hasn', 
                    'hasn\'t', 'haven', 'haven\'t', 'isn', 'isn\'t', 'ma', 'mightn', 
                    'mightn\'t', 'mustn', 'mustn\'t', 'needn', 'needn\'t', 'shan', 
                    'shan\'t', 'shouldn', 'shouldn\'t', 'wasn', 'wasn\'t', 'weren', 
                    'weren\'t', 'won', 'won\'t', 'wouldn', 'wouldn\'t'];
                    
  const filteredTokens = tokens.filter(token => 
    !stopWords.includes(token) && token.length > 2);
  
  // Count frequency of each word
  const wordFrequency = {};
  filteredTokens.forEach(token => {
    wordFrequency[token] = (wordFrequency[token] || 0) + 1;
  });
  
  // Sort by frequency and get top words
  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
  
  // Find pairs of words that appear together
  const pairs = [];
  for (let i = 0; i < filteredTokens.length - 1; i++) {
    if (!stopWords.includes(filteredTokens[i]) && !stopWords.includes(filteredTokens[i+1])) {
      pairs.push(`${filteredTokens[i]} ${filteredTokens[i+1]}`);
    }
  }
  
  // Count frequency of pairs
  const pairFrequency = {};
  pairs.forEach(pair => {
    pairFrequency[pair] = (pairFrequency[pair] || 0) + 1;
  });
  
  // Sort by frequency and get top pairs
  const topPairs = Object.entries(pairFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  
  return [...topWords, ...topPairs];
}

async function runTests() {
  console.log('Testing local sentiment analysis with natural package\n');
  
  for (let i = 0; i < sampleReviews.length; i++) {
    const review = sampleReviews[i];
    console.log(`Review ${i+1}: "${review}"`);
    
    const result = analyzeSentiment(review);
    console.log(`Sentiment: ${result.classification}`);
    console.log(`Score: ${result.score.toFixed(2)} (Range: -1.0 to 1.0)`);
    console.log(`Magnitude: ${result.magnitude.toFixed(2)} (Strength of sentiment)`);
    
    const keyPhrases = extractKeyPhrases(review);
    console.log('Key phrases:', keyPhrases.join(', '));
    
    console.log('-----------------------------------');
  }
  
  console.log('\nTest complete!');
}

// Run the tests
runTests().catch(console.error);