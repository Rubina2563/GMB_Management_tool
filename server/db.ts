import Database from 'better-sqlite3';
import { InsertUser, User, ApiKeysData } from '@shared/schema';
import { hashPassword } from './auth';

// Initialize SQLite database
const db = new Database('users.db');

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    subscription_plan TEXT NOT NULL DEFAULT 'free',
    subscription_status TEXT NOT NULL DEFAULT 'active',
    subscription_expiry TIMESTAMP,
    selected_campaign_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create API keys table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data_for_seo_key TEXT,
    data_for_seo_email TEXT,
    google_api_key TEXT,
    google_client_id TEXT,
    google_client_secret TEXT,
    gbp_client_id TEXT,
    gbp_client_secret TEXT,
    gbp_redirect_uri TEXT,
    serp_api_key TEXT,
    language_model_provider TEXT,
    openai_api_key TEXT,
    claude_api_key TEXT,
    grok_api_key TEXT,
    deepseek_api_key TEXT,
    geo_grid_api_preference TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create campaigns table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    geo_grid_size INTEGER NOT NULL DEFAULT 7,
    distance INTEGER NOT NULL DEFAULT 1,
    shape TEXT NOT NULL DEFAULT 'square',
    update_frequency TEXT NOT NULL DEFAULT 'weekly',
    email_notifications BOOLEAN NOT NULL DEFAULT 1,
    notification_recipients TEXT,
    credit_cost INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create campaign locations table
db.exec(`
  CREATE TABLE IF NOT EXISTS campaign_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (location_id) REFERENCES gbp_locations(id)
  )
`);

// Create campaign keywords table
db.exec(`
  CREATE TABLE IF NOT EXISTS campaign_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT 0,
    tag TEXT NOT NULL DEFAULT 'general',
    volume INTEGER DEFAULT 0,
    difficulty INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  )
`);

// Create campaign rankings table
db.exec(`
  CREATE TABLE IF NOT EXISTS campaign_rankings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    keyword_id INTEGER NOT NULL,
    lat TEXT NOT NULL,
    lng TEXT NOT NULL,
    rank INTEGER NOT NULL,
    search_volume INTEGER DEFAULT 0,
    rank_change INTEGER DEFAULT 0,
    competitors TEXT,
    date_checked TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (keyword_id) REFERENCES campaign_keywords(id)
  )
`);

// Create campaign audits table
db.exec(`
  CREATE TABLE IF NOT EXISTS campaign_audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    audit_type TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    details TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    completed_at TIMESTAMP,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    credit_cost INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  )
`);

// Database service with CRUD operations
export const dbService = {
  // Get user by ID
  getUser: async (id: number): Promise<User | undefined> => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
    return user;
  },

  // Get user by username
  getUserByUsername: async (username: string): Promise<User | undefined> => {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
    return user;
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<User | undefined> => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    return user;
  },

  // Create a new user
  createUser: async (userData: InsertUser): Promise<User> => {
    // Hash the password
    const hashedPassword = await hashPassword(userData.password);
    
    // Insert user into database
    const stmt = db.prepare(`
      INSERT INTO users (
        username, 
        email, 
        password, 
        role, 
        subscription_plan, 
        subscription_status, 
        subscription_expiry
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userData.username, 
      userData.email, 
      hashedPassword,
      userData.role || 'client',
      userData.subscription_plan || 'free',
      userData.subscription_status || 'active',
      userData.subscription_expiry || null
    );
    
    // Get the created user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
    
    return user;
  },

  // Get API keys for user
  getApiKeys: async (userId: number): Promise<ApiKeysData | undefined> => {
    const result = db.prepare(`
      SELECT 
        data_for_seo_key, 
        data_for_seo_email,
        google_api_key, 
        google_client_id,
        google_client_secret,
        gbp_client_id,
        gbp_client_secret,
        gbp_redirect_uri,
        gbp_access_token,
        gbp_refresh_token,
        gbp_token_expiry,
        serp_api_key,
        language_model_provider,
        openai_api_key,
        claude_api_key,
        grok_api_key,
        deepseek_api_key,
        geo_grid_api_preference
      FROM api_keys 
      WHERE user_id = ?
    `).get(userId);
    
    if (!result) return undefined;
    
    // Using explicit interface to match the query result
    interface DBApiKeys {
      data_for_seo_key: string | null;
      data_for_seo_email: string | null;
      google_api_key: string | null;
      google_client_id: string | null;
      google_client_secret: string | null;
      gbp_client_id: string | null;
      gbp_client_secret: string | null;
      gbp_redirect_uri: string | null;
      gbp_access_token: string | null;
      gbp_refresh_token: string | null;
      gbp_token_expiry: string | null;
      serp_api_key: string | null;
      language_model_provider: string | null;
      openai_api_key: string | null;
      claude_api_key: string | null;
      grok_api_key: string | null;
      deepseek_api_key: string | null;
      geo_grid_api_preference: string | null;
    }
    
    const apiKeys = result as DBApiKeys;
    
    return {
      data_for_seo_key: apiKeys.data_for_seo_key || "",
      data_for_seo_email: apiKeys.data_for_seo_email || "",
      google_api_key: apiKeys.google_api_key || "",
      google_client_id: apiKeys.google_client_id || "",
      google_client_secret: apiKeys.google_client_secret || "",
      gbp_client_id: apiKeys.gbp_client_id || "",
      gbp_client_secret: apiKeys.gbp_client_secret || "",
      gbp_redirect_uri: apiKeys.gbp_redirect_uri || "",
      gbp_access_token: apiKeys.gbp_access_token || "",
      gbp_refresh_token: apiKeys.gbp_refresh_token || "",
      gbp_token_expiry: apiKeys.gbp_token_expiry || "",
      serp_api_key: apiKeys.serp_api_key || "",
      language_model_provider: (apiKeys.language_model_provider as "openai" | "claude" | "grok" | "deepseek" | "") || "",
      openai_api_key: apiKeys.openai_api_key || "",
      claude_api_key: apiKeys.claude_api_key || "",
      grok_api_key: apiKeys.grok_api_key || "",
      deepseek_api_key: apiKeys.deepseek_api_key || "",
      geo_grid_api_preference: (apiKeys.geo_grid_api_preference as "dataforseo" | "google-places" | "") || ""
    };
  },

  // Save API keys for user
  saveApiKeys: async (userId: number, keys: ApiKeysData): Promise<ApiKeysData> => {
    // Check if API keys already exist for this user
    const existingKeys = await dbService.getApiKeys(userId);
    
    if (existingKeys) {
      // Update existing keys
      return dbService.updateApiKeys(userId, keys);
    }
    
    // Insert new API keys
    const stmt = db.prepare(`
      INSERT INTO api_keys (
        user_id, 
        data_for_seo_key, 
        data_for_seo_email,
        google_api_key, 
        google_client_id,
        google_client_secret,
        gbp_client_id,
        gbp_client_secret,
        gbp_redirect_uri,
        gbp_access_token,
        gbp_refresh_token,
        gbp_token_expiry,
        serp_api_key,
        language_model_provider,
        openai_api_key,
        claude_api_key,
        grok_api_key,
        deepseek_api_key,
        geo_grid_api_preference
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      userId,
      keys.data_for_seo_key || null,
      keys.data_for_seo_email || null,
      keys.google_api_key || null,
      keys.google_client_id || null,
      keys.google_client_secret || null,
      keys.gbp_client_id || null,
      keys.gbp_client_secret || null,
      keys.gbp_redirect_uri || null,
      keys.gbp_access_token || null,
      keys.gbp_refresh_token || null,
      keys.gbp_token_expiry || null,
      keys.serp_api_key || null,
      keys.language_model_provider || null,
      keys.openai_api_key || null,
      keys.claude_api_key || null,
      keys.grok_api_key || null,
      keys.deepseek_api_key || null,
      keys.geo_grid_api_preference || null
    );
    
    return dbService.getApiKeys(userId) as ApiKeysData;
  },

  // Update API keys for user
  updateApiKeys: async (userId: number, keys: ApiKeysData): Promise<ApiKeysData> => {
    const stmt = db.prepare(`
      UPDATE api_keys 
      SET 
        data_for_seo_key = ?, 
        data_for_seo_email = ?,
        google_api_key = ?, 
        google_client_id = ?,
        google_client_secret = ?,
        gbp_client_id = ?,
        gbp_client_secret = ?,
        gbp_redirect_uri = ?,
        gbp_access_token = ?,
        gbp_refresh_token = ?,
        gbp_token_expiry = ?,
        serp_api_key = ?,
        language_model_provider = ?,
        openai_api_key = ?,
        claude_api_key = ?,
        grok_api_key = ?,
        deepseek_api_key = ?,
        geo_grid_api_preference = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    
    stmt.run(
      keys.data_for_seo_key || null,
      keys.data_for_seo_email || null,
      keys.google_api_key || null,
      keys.google_client_id || null,
      keys.google_client_secret || null,
      keys.gbp_client_id || null,
      keys.gbp_client_secret || null,
      keys.gbp_redirect_uri || null,
      keys.gbp_access_token || null,
      keys.gbp_refresh_token || null,
      keys.gbp_token_expiry || null,
      keys.serp_api_key || null,
      keys.language_model_provider || null,
      keys.openai_api_key || null,
      keys.claude_api_key || null,
      keys.grok_api_key || null,
      keys.deepseek_api_key || null,
      keys.geo_grid_api_preference || null,
      userId
    );
    
    return dbService.getApiKeys(userId) as ApiKeysData;
  },

  // Get all users - for admin dashboard
  getAllUsers: async (): Promise<User[]> => {
    const users = db.prepare('SELECT * FROM users').all() as User[];
    return users;
  },

  // Get all API keys - for admin dashboard
  getAllApiKeys: async () => {
    const apiKeys = db.prepare(`
      SELECT 
        ak.*, 
        u.username, 
        u.email 
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
    `).all();
    
    return apiKeys;
  },

  // Update user role - for admin functionality
  updateUserRole: async (userId: number, role: 'admin' | 'client'): Promise<User | undefined> => {
    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    stmt.run(role, userId);
    
    return dbService.getUser(userId);
  },
  
  // Update user subscription - for subscription management
  updateUserSubscription: async (
    userId: number, 
    plan: 'free' | 'basic' | 'pro', 
    status: 'active' | 'expired' | 'cancelled' | 'pending',
    expiry: Date | null
  ): Promise<User | undefined> => {
    const stmt = db.prepare(`
      UPDATE users 
      SET 
        subscription_plan = ?, 
        subscription_status = ?, 
        subscription_expiry = ?
      WHERE id = ?
    `);
    
    stmt.run(
      plan,
      status,
      expiry ? expiry.toISOString() : null,
      userId
    );
    
    return dbService.getUser(userId);
  },

  // Delete user - for admin functionality
  deleteUser: async (userId: number): Promise<boolean> => {
    // First delete related API keys
    const deleteApiKeys = db.prepare('DELETE FROM api_keys WHERE user_id = ?');
    deleteApiKeys.run(userId);
    
    // Then delete the user
    const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');
    const result = deleteUser.run(userId);
    
    return result.changes > 0;
  },

  // Update user's selected campaign
  updateUserSelectedCampaign: async (userId: number, campaignId: number | null): Promise<User | undefined> => {
    const stmt = db.prepare('UPDATE users SET selected_campaign_id = ? WHERE id = ?');
    stmt.run(campaignId, userId);
    
    return dbService.getUser(userId);
  }
};