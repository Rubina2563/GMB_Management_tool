/**
 * Test script for combined sentiment analysis service
 * 
 * This script demonstrates a robust sentiment analysis system with a fallback strategy:
 * 1. Try Google Natural Language API (primary)
 * 2. If that fails, use natural package (fallback)
 * 
 * Usage: node test-combined-sentiment.js
 */

import axios from 'axios';
import natural from 'natural';
import * as dotenv from 'dotenv';
dotenv.config();

// Configure natural package
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();
const analyzer = new Analyzer("English", stemmer, "afinn");

// Sample reviews to analyze
const sampleReviews = [
  "This restaurant is amazing! The food was delicious and the service was excellent.",
  "Terrible experience. Slow service, cold food, and overpriced.",
  "It was okay. Nothing special but not bad either.",
  "The staff was friendly but the food took forever to arrive. Probably won't go back.",
  "Best place in town! Every dish we tried was perfect and the staff treated us like family."
];

/**
 * Combined sentiment analysis with fallback strategy
 * @param {string} text The text to analyze
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeSentiment(text) {
  try {
    // First try Google Natural Language API
    const googleResult = await analyzeWithGoogleApi(text);
    console.log('[Method used: Google Natural Language API]');
    return googleResult;
  } catch (error) {
    console.log('Google API failed:', error.message);
    console.log('[Falling back to local sentiment analysis]');
    
    // Fallback to local implementation
    return analyzeWithNatural(text);
  }
}

/**
 * Google Natural Language API sentiment analysis
 * @param {string} text The text to analyze
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeWithGoogleApi(text) {
  const apiKey = process.env.NEW_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google API key not found');
  }
  
  const url = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${apiKey}`;
  const data = {
    document: {
      type: 'PLAIN_TEXT',
      content: text
    },
    encodingType: 'UTF8'
  };
  
  const response = await axios.post(url, data);
  
  if (response.status !== 200) {
    throw new Error(`Google API returned status code ${response.status}`);
  }
  
  const sentiment = response.data.documentSentiment;
  const sentences = response.data.sentences;
  
  // Determine sentiment classification
  let classification;
  if (sentiment.score >= 0.5) {
    classification = 'Highly positive';
  } else if (sentiment.score >= 0.1) {
    classification = 'Positive';
  } else if (sentiment.score > -0.1) {
    classification = 'Neutral';
  } else if (sentiment.score > -0.5) {
    classification = 'Negative';
  } else {
    classification = 'Highly negative';
  }
  
  return {
    score: sentiment.score,
    magnitude: sentiment.magnitude,
    classification,
    sentences: sentences.map(s => ({
      text: s.text.content,
      score: s.sentiment.score,
      magnitude: s.sentiment.magnitude
    })),
    keyPhrases: extractKeyPhrases(text) // Add key phrases from local analysis
  };
}

/**
 * Local sentiment analysis with natural package
 * @param {string} text The text to analyze
 * @returns {Object} Analysis result
 */
function analyzeWithNatural(text) {
  // Tokenize the text
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Calculate the sentiment score
  let score = analyzer.getSentiment(tokens);
  
  // Normalize the score to be between -1 and 1
  score = Math.max(-1, Math.min(1, score));
  
  // Calculate magnitude based on absolute values of word scores
  let magnitude = 0;
  tokens.forEach(token => {
    const wordScore = analyzer.getSentiment([token]);
    magnitude += Math.abs(wordScore);
  });
  
  // Normalize magnitude to be comparable to Google API
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
  
  // Analyze sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentimentBySentence = sentences.map(sentence => {
    const sentenceTokens = tokenizer.tokenize(sentence.toLowerCase());
    const sentenceScore = analyzer.getSentiment(sentenceTokens);
    return {
      text: sentence.trim(),
      score: Math.max(-1, Math.min(1, sentenceScore)),
      magnitude: Math.min(1, sentenceTokens.length / 10)
    };
  });
  
  return {
    score,
    magnitude,
    classification,
    sentences: sentimentBySentence,
    keyPhrases: extractKeyPhrases(text)
  };
}

/**
 * Extract key phrases from text
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
                    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'];
                    
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

/**
 * Run the test
 */
async function runTests() {
  console.log('Testing combined sentiment analysis service\n');
  
  for (let i = 0; i < sampleReviews.length; i++) {
    const review = sampleReviews[i];
    console.log(`Review ${i+1}: "${review}"`);
    
    try {
      const result = await analyzeSentiment(review);
      
      console.log(`Sentiment: ${result.classification}`);
      console.log(`Score: ${result.score.toFixed(2)} (Range: -1.0 to 1.0)`);
      console.log(`Magnitude: ${result.magnitude.toFixed(2)} (Strength of sentiment)`);
      
      if (result.sentences.length > 1) {
        console.log('Sentence-level analysis:');
        result.sentences.forEach(sentence => {
          console.log(`- "${sentence.text}": Score ${sentence.score.toFixed(2)}, Magnitude ${sentence.magnitude.toFixed(2)}`);
        });
      }
      
      if (result.keyPhrases && result.keyPhrases.length > 0) {
        console.log('Key phrases:', result.keyPhrases.join(', '));
      }
    } catch (error) {
      console.error(`Failed to analyze review: ${error.message}`);
    }
    
    console.log('-----------------------------------');
  }
  
  // Test the fallback mechanism by disabling the API key temporarily
  console.log('\nTesting fallback mechanism:');
  const originalKey = process.env.NEW_GOOGLE_MAPS_API_KEY;
  process.env.NEW_GOOGLE_MAPS_API_KEY = '';
  
  try {
    const result = await analyzeSentiment(sampleReviews[0]);
    console.log(`Sentiment: ${result.classification}`);
    console.log(`Score: ${result.score.toFixed(2)}`);
  } catch (error) {
    console.error(`Fallback test failed: ${error.message}`);
  }
  
  // Restore the original key
  process.env.NEW_GOOGLE_MAPS_API_KEY = originalKey;
  
  console.log('\nTest complete!');
}

// Run the tests
runTests().catch(console.error);