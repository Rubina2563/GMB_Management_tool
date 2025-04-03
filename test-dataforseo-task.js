/**
 * Test script for DataForSEO API Task Post and Get endpoints
 * 
 * This script tests DataForSEO's task-based API workflow:
 * 1. POST a search task
 * 2. GET the task results
 * 
 * Usage: node test-dataforseo-task.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Test DataForSEO API by posting a task and retrieving results
 */
async function testDataForSEOTask() {
  try {
    // Get API credentials from env vars
    const login = process.env.DATA_FOR_SEO_EMAIL;
    const password = process.env.DATA_FOR_SEO_KEY;
    
    if (!login || !password) {
      console.error('❌ Missing API credentials. Please set DATA_FOR_SEO_EMAIL and DATA_FOR_SEO_KEY in .env file');
      return;
    }
    
    console.log('\n🔍 Testing DataForSEO Task Post and Get workflow...');
    
    // Step 1: Post a search task
    console.log('\n📤 Posting search task...');
    const taskId = await postSearchTask(login, password);
    
    if (!taskId) {
      console.error('❌ Failed to create search task');
      return;
    }
    
    console.log(`✅ Search task created with ID: ${taskId}`);
    
    // Step 2: Wait for task to complete
    console.log('\n⏳ Waiting for task to complete (15 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Step 3: Check if task is ready
    console.log('\n🔄 Checking if task is ready...');
    const isReady = await checkTaskReady(login, password, taskId);
    
    if (!isReady) {
      console.log('Task not ready yet, but proceeding to get results anyway');
    } else {
      console.log('✅ Task is ready!');
    }
    
    // Step 4: Get task results
    console.log('\n📥 Getting task results...');
    const results = await getTaskResults(login, password, taskId);
    
    if (!results || results.length === 0) {
      console.log('No results found for the task');
      return;
    }
    
    console.log(`✅ Found ${results.length} search results!`);
    
    // Print the first 3 results
    console.log('\n📋 Top 3 search results:');
    for (let i = 0; i < Math.min(3, results.length); i++) {
      const result = results[i];
      console.log(`${result.position}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      if (result.description) {
        console.log(`   Description: ${result.description.substring(0, 100)}...`);
      }
      console.log();
    }
    
    console.log('👋 Task workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in DataForSEO task test:', error.message);
  }
}

/**
 * Post a search task to DataForSEO
 * @param {string} login - DataForSEO API login
 * @param {string} password - DataForSEO API password
 * @returns {Promise<string|null>} Task ID if successful, null otherwise
 */
async function postSearchTask(login, password) {
  try {
    // Create authentication header
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // API endpoint for task creation
    const url = 'https://api.dataforseo.com/v3/serp/google/organic/task_post';
    
    // Task data with search parameters
    const data = {
      "data": [{
        "keyword": "coffee shop",
        "location_code": 1023191,  // San Francisco
        "language_code": "en",
        "device": "desktop",
        "os": "windows",
        "depth": 20
      }]
    };
    
    // Make the API request
    const response = await axios.post(url, data, { headers });
    
    // Check for task ID
    if (response.status === 200 && 
        response.data?.tasks?.length > 0 && 
        response.data.tasks[0]?.id) {
      return response.data.tasks[0].id;
    }
    
    console.error('No task ID found in response');
    return null;
  } catch (error) {
    console.error('Error posting search task:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

/**
 * Get task results from DataForSEO
 * @param {string} login - DataForSEO API login
 * @param {string} password - DataForSEO API password
 * @param {string} taskId - Task ID to retrieve
 * @returns {Promise<Array|null>} Search results if successful, null otherwise
 */
async function getTaskResults(login, password, taskId) {
  try {
    // Create authentication header
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // API endpoint for task retrieval
    const url = `https://api.dataforseo.com/v3/serp/google/organic/task_get/${taskId}`;
    
    // Make the API request
    const response = await axios.get(url, { headers });
    
    // Check for results
    if (response.status === 200 && 
        response.data?.tasks?.length > 0) {
      
      // Print task status
      console.log('Task status:', response.data.tasks[0].status_message);
      
      // Check if the task completed successfully and has results
      if (response.data.tasks[0]?.result?.length > 0 &&
          response.data.tasks[0].result[0]?.items?.length > 0) {
        return response.data.tasks[0].result[0].items;
      } else {
        console.log('Task completed but no items found in result');
        if (response.data.tasks[0]?.result) {
          console.log('Result data:', JSON.stringify(response.data.tasks[0].result, null, 2));
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error getting task results:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

/**
 * Check if a task is ready for result retrieval
 * @param {string} login - DataForSEO API login
 * @param {string} password - DataForSEO API password
 * @param {string} taskId - Task ID to check
 * @returns {Promise<boolean>} True if task is ready, false otherwise
 */
async function checkTaskReady(login, password, taskId) {
  try {
    // Create authentication header
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
    
    // API endpoint for checking task status
    const url = `https://api.dataforseo.com/v3/serp/google/organic/tasks_ready`;
    
    // Make the API request
    const response = await axios.get(url, { headers });
    
    // Check if our task ID is in the ready tasks
    if (response.status === 200 && 
        response.data?.tasks?.length > 0) {
      
      // Look for our task ID in the list of ready tasks
      for (const task of response.data.tasks) {
        if (task.id === taskId) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if task is ready:', error.message);
    return false;
  }
}

// Run the test
testDataForSEOTask().catch(console.error);