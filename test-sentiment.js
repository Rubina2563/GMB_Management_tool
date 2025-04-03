/**
 * Test script for Google Natural Language API sentiment analysis
 * 
 * This script tests the Natural Language API for sentiment analysis of reviews
 * using the NEW_GOOGLE_MAPS_API_KEY which we've confirmed works.
 * 
 * Usage: node test-sentiment.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// Sample reviews to analyze
const sampleReviews = [
  "This restaurant is amazing! The food was delicious and the service was excellent.",
  "Terrible experience. Slow service, cold food, and overpriced.",
  "It was okay. Nothing special but not bad either.",
  "The staff was friendly but the food took forever to arrive. Probably won't go back.",
  "Best place in town! Every dish we tried was perfect and the staff treated us like family."
];

/**
 * Analyze sentiment of a text using Google Natural Language API
 * @param {string} text The text to analyze
 * @param {string} apiKey Google API key for Natural Language API
 * @returns {Promise<Object>} Sentiment analysis result
 */
async function analyzeSentiment(text, apiKey) {
  try {
    const url = `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${apiKey}`;
    const data = {
      document: {
        type: 'PLAIN_TEXT',
        content: text
      },
      encodingType: 'UTF8'
    };
    
    const response = await axios.post(url, data);
    
    if (response.status === 200) {
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
        }))
      };
    } else {
      throw new Error(`Request failed with status code ${response.status}`);
    }
  } catch (error) {
    console.error('Error analyzing sentiment:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

/**
 * Run tests for sentiment analysis
 */
async function runTests() {
  const apiKey = process.env.NEW_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('API key not found in environment variables!');
    console.error('Please set NEW_GOOGLE_MAPS_API_KEY.');
    return;
  }
  
  console.log('Testing Google Natural Language API for sentiment analysis\n');
  
  for (let i = 0; i < sampleReviews.length; i++) {
    const review = sampleReviews[i];
    console.log(`Review ${i+1}: "${review}"`);
    
    const result = await analyzeSentiment(review, apiKey);
    
    if (result) {
      console.log(`Sentiment: ${result.classification}`);
      console.log(`Score: ${result.score} (Range: -1.0 to 1.0)`);
      console.log(`Magnitude: ${result.magnitude} (Strength of sentiment)`);
      
      if (result.sentences.length > 1) {
        console.log('Sentence-level analysis:');
        result.sentences.forEach(sentence => {
          console.log(`- "${sentence.text}": Score ${sentence.score}, Magnitude ${sentence.magnitude}`);
        });
      }
    } else {
      console.log('Failed to analyze sentiment');
    }
    
    console.log('-----------------------------------');
  }
  
  console.log('\nTest complete!');
}

// Run the tests
runTests().catch(console.error);