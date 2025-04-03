import { 
  users, 
  gbpLocations, 
  gbpData,
  gbpPosts,
  gbpFaqs,
  gbpFaqReplies,
  gbpKeywords,
  type User, 
  type InsertUser, 
  type ApiKeys, 
  type ApiKeysData, 
  type InsertApiKeys, 
  type UserRole, 
  type SubscriptionPlanCode, 
  type SubscriptionStatus, 
  type UserUpdate,
  type GbpLocation,
  type InsertGbpLocation,
  type GbpData,
  type InsertGbpData,
  type GbpPost,
  type InsertGbpPost,
  type Faq,
  type InsertFaq,
  type FaqReply,
  type InsertFaqReply,
  type FaqMatchStatus,
  type PostStatus,
  type LLMProvider,
  type KeywordOptimization
} from "@shared/schema";

// Type definition for geo grid API preference
type GeoGridApiPreference = "dataforseo" | "google-places" | undefined;

// Helper function to handle geo grid API preference safely
export function safeGeoGridPreference(value: any): GeoGridApiPreference {
  if (value === "dataforseo" || value === "google-places") {
    return value;
  }
  // For any other values (null, undefined, empty string), return undefined
  return undefined;
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: UserRole): Promise<User | undefined>;
  updateUserSubscription(userId: number, plan: SubscriptionPlanCode, status: SubscriptionStatus, expiry: Date | null): Promise<User | undefined>;
  updateUser(userId: number, userData: UserUpdate): Promise<User | undefined>;
  deleteUser(userId: number): Promise<boolean>;
  
  // API Keys methods
  getApiKeys(userId: number): Promise<ApiKeysData | undefined>;
  saveApiKeys(userId: number, keys: ApiKeysData): Promise<ApiKeysData>;
  updateApiKeys(userId: number, keys: ApiKeysData): Promise<ApiKeysData>;
  getAllApiKeys(): Promise<any[]>; // Using any for simplicity in this implementation
  getApiKeysByUserId(userId: number): Promise<ApiKeysData | undefined>;
  updateApiKeysByUserId(userId: number, keys: Partial<ApiKeysData>): Promise<ApiKeysData | undefined>;
  
  // GBP Location methods
  getGbpLocations(userId: number): Promise<GbpLocation[]>;
  getGbpLocation(locationId: number): Promise<GbpLocation | undefined>;
  getGbpLocationById(locationId: number): Promise<GbpLocation | undefined>;
  getLocationsByUserId(userId: number): Promise<GbpLocation[]>;
  getLocationById(locationId: number | string): Promise<GbpLocation | undefined>;
  getGbpLocationByGoogleId(userId: number, googleLocationId: string): Promise<GbpLocation | undefined>;
  createGbpLocation(location: InsertGbpLocation): Promise<GbpLocation>;
  updateGbpLocation(locationId: number, location: Partial<InsertGbpLocation>): Promise<GbpLocation | undefined>;
  deleteGbpLocation(locationId: number): Promise<boolean>;
  
  // GBP Data methods
  getGbpData(locationId: number, dataType: string): Promise<GbpData | undefined>;
  createGbpData(data: InsertGbpData): Promise<GbpData>;
  updateGbpData(dataId: number, data: Partial<InsertGbpData>): Promise<GbpData | undefined>;
  deleteGbpData(dataId: number): Promise<boolean>;
  
  // GBP Posts methods
  getGbpPosts(locationId: number): Promise<GbpPost[]>;
  getPostsByLocationId(locationId: number | string): Promise<GbpPost[]>;
  getGbpPost(postId: number): Promise<GbpPost | undefined>;
  createGbpPost(post: InsertGbpPost): Promise<GbpPost>;
  updateGbpPost(postId: number, post: Partial<InsertGbpPost>): Promise<GbpPost | undefined>;
  updateGbpPostStatus(postId: number, status: PostStatus, publishedAt?: Date): Promise<GbpPost | undefined>;
  deleteGbpPost(postId: number): Promise<boolean>;
  
  // Review methods
  getReviewsByLocationId(locationId: number | string): Promise<any[]>;
  
  // Photo methods
  getPhotosByLocationId(locationId: number | string): Promise<any[]>;
  
  // GBP FAQs methods
  getFaqs(locationId: number): Promise<Faq[]>;
  getFaq(faqId: number): Promise<Faq | undefined>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(faqId: number, faq: Partial<InsertFaq>): Promise<Faq | undefined>;
  deleteFaq(faqId: number): Promise<boolean>;
  
  // GBP FAQ Replies methods
  getFaqReplies(locationId: number): Promise<FaqReply[]>;
  getFaqReply(replyId: number): Promise<FaqReply | undefined>;
  createFaqReply(reply: InsertFaqReply): Promise<FaqReply>;
  updateFaqReply(replyId: number, reply: Partial<InsertFaqReply>): Promise<FaqReply | undefined>;
  updateFaqReplyStatus(replyId: number, status: FaqMatchStatus): Promise<FaqReply | undefined>;
  deleteFaqReply(replyId: number): Promise<boolean>;
  
  // GBP Keywords methods
  getGbpKeywordsByLocationId(locationId: number): Promise<KeywordOptimization[]>;
  createGbpKeyword(keyword: Omit<KeywordOptimization, 'id'>): Promise<KeywordOptimization>;
  updateGbpKeyword(keywordId: number, keyword: Partial<Omit<KeywordOptimization, 'id'>>): Promise<KeywordOptimization | undefined>;
  deleteGbpKeyword(keywordId: number): Promise<boolean>;
  deleteGbpKeywordsByLocationId(locationId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private apiKeys: Map<number, ApiKeys>;
  private gbpLocations: Map<number, GbpLocation>;
  private gbpData: Map<number, GbpData>;
  private gbpPosts: Map<number, GbpPost>;
  private gbpFaqs: Map<number, Faq>;
  private gbpFaqReplies: Map<number, FaqReply>;
  private gbpKeywords: Map<number, KeywordOptimization>;
  private reviews: Map<number, any>;
  private photos: Map<number, any>;
  
  currentId: number;
  apiKeyId: number;
  gbpLocationId: number;
  gbpDataId: number;
  gbpPostId: number;
  gbpFaqId: number;
  gbpFaqReplyId: number;
  gbpKeywordId: number;

  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    this.gbpLocations = new Map();
    this.gbpData = new Map();
    this.gbpPosts = new Map();
    this.gbpFaqs = new Map();
    this.gbpFaqReplies = new Map();
    this.gbpKeywords = new Map();
    this.reviews = new Map();
    this.photos = new Map();
    
    this.currentId = 1;
    this.apiKeyId = 1;
    this.gbpLocationId = 1;
    this.gbpDataId = 1;
    this.gbpPostId = 1;
    this.gbpFaqId = 1;
    this.gbpFaqReplyId = 1;
    this.gbpKeywordId = 1;

    // Create demo users
    this.createDemoUsers();
  }

  async createDemoUsers() {
    // Check if users already exist
    const existingAdmin = await this.getUserByUsername("admin");
    const existingClient = await this.getUserByUsername("client");
    let clientUserId = 0;

    // Only create admin if it doesn't exist
    if (!existingAdmin) {
      await this.createUser({
        username: "admin",
        email: "admin@example.com",
        password: "$2b$10$0LrtVcSWIkhY336zeG9q8.G1Z9jId0e0r3TNyR/okOcMx1LQdRbGe", // admin123
        role: "admin",
        subscription_plan: "pro",
        subscription_status: "active",
        subscription_expiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year from now
      });
    } else {
      // Update admin password if user exists but with old password
      const adminUser = await this.getUserByUsername("admin");
      if (adminUser) {
        adminUser.password = "$2b$10$0LrtVcSWIkhY336zeG9q8.G1Z9jId0e0r3TNyR/okOcMx1LQdRbGe"; // admin123
        this.users.set(adminUser.id, adminUser);
      }
    }

    // Only create client if it doesn't exist
    if (!existingClient) {
      const client = await this.createUser({
        username: "client",
        email: "client@example.com",
        password: "$2b$10$uozTQY8Ay0X0cpSf90.IROhoMjmQgQOxXmxtc0SkeowbQdK3p9Ioi", // client123
        role: "client",
        subscription_plan: "basic",
        subscription_status: "active",
        subscription_expiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days from now
      });
      clientUserId = client.id;
    } else {
      // Update client password if user exists but with old password
      const clientUser = await this.getUserByUsername("client");
      if (clientUser) {
        clientUser.password = "$2b$10$uozTQY8Ay0X0cpSf90.IROhoMjmQgQOxXmxtc0SkeowbQdK3p9Ioi"; // client123
        this.users.set(clientUser.id, clientUser);
        clientUserId = clientUser.id;
      }
    }
    
    // Create API keys for the client
    const existingApiKeys = await this.getApiKeys(clientUserId);
    if (!existingApiKeys) {
      await this.saveApiKeys(clientUserId, {
        google_api_key: "mock-google-api-key",
        data_for_seo_key: "mock-data-for-seo-key",
        serp_api_key: "mock-serp-api-key"
      });
    }
    
    // Create demo GBP location for client
    const clientLocations = await this.getGbpLocations(clientUserId);
    if (clientLocations.length === 0) {
      const location = await this.createGbpLocation({
        user_id: clientUserId,
        location_id: "demo-location-123",
        name: "Fitness Pro Studio",
        address: "123 Main Street, Anytown, USA",
        phone: "(555) 123-4567",
        website: "https://fitnesspro.example.com",
        latitude: "40.7128",
        longitude: "-74.0060",
        status: "connected"
      });
      
      // Create sample posts for the location
      await this.createGbpPost({
        location_id: location.id,
        title: "Spring Fitness Challenge",
        content: "Join our 30-day Spring Fitness Challenge! Transform your body and mind with our expert trainers. Sign up today for exclusive perks and special pricing.",
        image_url: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b",
        cta_type: "SIGN_UP",
        cta_url: "https://fitnesspro.example.com/spring-challenge",
        status: "published"
      });
      
      await this.createGbpPost({
        location_id: location.id,
        title: "New Yoga Classes Available",
        content: "We're excited to announce our new yoga classes starting next week. Perfect for all levels from beginner to advanced. Improve flexibility, strength and mental clarity.",
        image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
        cta_type: "BOOK",
        cta_url: "https://fitnesspro.example.com/book-yoga",
        status: "scheduled",
        scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      });
      
      await this.createGbpPost({
        location_id: location.id,
        title: "Nutrition Workshop",
        content: "Learn how to fuel your workouts properly with our nutrition workshop. Our expert dietitians will help you create a personalized nutrition plan.",
        image_url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352",
        cta_type: "LEARN_MORE",
        cta_url: "https://fitnesspro.example.com/nutrition",
        status: "draft",
        category: "Event",
        tags: ["nutrition", "health", "workshop"]
      });
      
      // Adding more sample posts with tags and categories
      await this.createGbpPost({
        location_id: location.id,
        title: "Summer Membership Promotion",
        content: "Get 25% off our annual membership when you sign up this summer. Limited time offer, valid until August 31st. All membership tiers included.",
        image_url: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2",
        cta_type: "SIGN_UP",
        cta_url: "https://fitnesspro.example.com/promotion",
        status: "draft",
        category: "Promotion",
        tags: ["summer", "discount", "membership"]
      });
      
      await this.createGbpPost({
        location_id: location.id,
        title: "New Equipment Arrivals",
        content: "We've just upgraded our equipment section with the latest cardio and strength training machines. Come try them out today!",
        image_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
        cta_type: "LEARN_MORE",
        cta_url: "https://fitnesspro.example.com/equipment",
        status: "scheduled",
        scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        category: "News",
        tags: ["equipment", "upgrade", "fitness"]
      });
    }
    
    // For debugging purposes, log existing users
    console.log('Demo users created/updated. Available users:');
    const users = Array.from(this.users.values());
    console.log(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
    
    // Log created locations
    console.log('Demo locations created/updated.');
    
    // Add sample FAQ data for the first location
    const existingFaqs = await this.getFaqs(1);
    if (existingFaqs.length === 0) {
      // Create sample FAQs
      const faq1 = await this.createFaq({
        user_id: 2, // client user
        location_id: 1,
        question: "What are your business hours?",
        answer: "Our business hours are Monday to Friday 9am-6pm, Saturday 10am-4pm, and we're closed on Sundays."
      });
      
      const faq2 = await this.createFaq({
        user_id: 2,
        location_id: 1,
        question: "Do you offer any discounts for new customers?",
        answer: "Yes, we offer a 10% discount on your first purchase when you sign up for our newsletter!"
      });
      
      const faq3 = await this.createFaq({
        user_id: 2,
        location_id: 1,
        question: "Is there parking available?",
        answer: "Yes, we have a free customer parking lot at the back of our building with 20 spaces available."
      });
      
      // Create sample FAQ replies
      await this.createFaqReply({
        user_id: 2,
        location_id: 1,
        faq_id: faq1.id,
        question: "When are you open?",
        suggested_answer: "Our business hours are Monday to Friday 9am-6pm, Saturday 10am-4pm, and we're closed on Sundays.",
        status: "approved" as FaqMatchStatus,
        confidence_score: 0.95,
        faq_match: "What are your business hours?",
        gbp_question_url: null
      });
      
      await this.createFaqReply({
        user_id: 2,
        location_id: 1,
        faq_id: faq2.id,
        question: "Any discounts for first-time buyers?",
        suggested_answer: "Yes, we offer a 10% discount on your first purchase when you sign up for our newsletter!",
        status: "approved" as FaqMatchStatus,
        confidence_score: 0.88,
        faq_match: "Do you offer any discounts for new customers?",
        gbp_question_url: null
      });
      
      await this.createFaqReply({
        user_id: 2,
        location_id: 1,
        faq_id: faq3.id,
        question: "Do you have a parking lot?",
        suggested_answer: "Yes, we have a free customer parking lot at the back of our building with 20 spaces available.",
        status: "pending" as FaqMatchStatus,
        confidence_score: 0.92,
        faq_match: "Is there parking available?",
        gbp_question_url: null
      });
      
      console.log('Demo FAQs and replies created.');
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const role = insertUser.role || 'client';
    
    // Ensure role is either 'admin' or 'client'
    const validRole = role === 'admin' ? 'admin' : 'client';
    
    const user: User = { 
      ...insertUser, 
      id,
      role: validRole,
      // Use provided subscription data or set defaults with proper type casting
      subscription_plan: insertUser.subscription_plan as SubscriptionPlanCode || ('free' as SubscriptionPlanCode),
      subscription_status: insertUser.subscription_status as SubscriptionStatus || ('active' as SubscriptionStatus),
      subscription_expiry: insertUser.subscription_expiry || null,
      selected_campaign_id: null,
      selected_client_id: null,
      created_at: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getApiKeys(userId: number): Promise<ApiKeysData | undefined> {
    const apiKey = Array.from(this.apiKeys.values()).find(
      (apiKey) => apiKey.user_id === userId
    );
    
    if (!apiKey) return undefined;
    
    return {
      data_for_seo_key: apiKey.data_for_seo_key || "",
      data_for_seo_email: apiKey.data_for_seo_email || "",
      google_api_key: apiKey.google_api_key || "",
      google_client_id: apiKey.google_client_id || "",
      google_client_secret: apiKey.google_client_secret || "",
      gbp_client_id: apiKey.gbp_client_id || "",
      gbp_client_secret: apiKey.gbp_client_secret || "",
      gbp_redirect_uri: apiKey.gbp_redirect_uri || "",
      gbp_access_token: apiKey.gbp_access_token || "",
      gbp_refresh_token: apiKey.gbp_refresh_token || "",
      gbp_token_expiry: apiKey.gbp_token_expiry || "",
      serp_api_key: apiKey.serp_api_key || "",
      language_model_provider: apiKey.language_model_provider || "",
      // NLP for FAQ matching
      nlp_provider: apiKey.nlp_provider || "natural",
      use_advanced_nlp: apiKey.use_advanced_nlp !== undefined ? apiKey.use_advanced_nlp : true,
      openai_api_key: apiKey.openai_api_key || "",
      claude_api_key: apiKey.claude_api_key || "",
      grok_api_key: apiKey.grok_api_key || "",
      deepseek_api_key: apiKey.deepseek_api_key || "",
      geo_grid_api_preference: safeGeoGridPreference(apiKey.geo_grid_api_preference)
    };
  }
  
  async saveApiKeys(userId: number, keys: ApiKeysData): Promise<ApiKeysData> {
    // Check if API keys already exist for this user
    const existingKeys = await this.getApiKeys(userId);
    
    if (existingKeys) {
      // Update existing keys
      return this.updateApiKeys(userId, keys);
    }
    
    // Create new API keys
    const id = this.apiKeyId++;
    const now = new Date();
    
    const apiKey: ApiKeys = {
      id,
      user_id: userId,
      data_for_seo_key: keys.data_for_seo_key || null,
      data_for_seo_email: keys.data_for_seo_email || null,
      google_api_key: keys.google_api_key || null,
      google_client_id: keys.google_client_id || null,
      google_client_secret: keys.google_client_secret || null,
      gbp_client_id: keys.gbp_client_id || null,
      gbp_client_secret: keys.gbp_client_secret || null,
      gbp_redirect_uri: keys.gbp_redirect_uri || null,
      gbp_access_token: keys.gbp_access_token || null,
      gbp_refresh_token: keys.gbp_refresh_token || null,
      gbp_token_expiry: keys.gbp_token_expiry || null,
      serp_api_key: keys.serp_api_key || null,
      language_model_provider: keys.language_model_provider || null,
      // NLP for FAQ matching
      nlp_provider: keys.nlp_provider || 'natural',
      use_advanced_nlp: keys.use_advanced_nlp !== undefined ? keys.use_advanced_nlp : true,
      openai_api_key: keys.openai_api_key || null,
      claude_api_key: keys.claude_api_key || null,
      grok_api_key: keys.grok_api_key || null,
      deepseek_api_key: keys.deepseek_api_key || null,
      geo_grid_api_preference: keys.geo_grid_api_preference ? keys.geo_grid_api_preference : null,
      created_at: now,
      updated_at: now
    };
    
    this.apiKeys.set(id, apiKey);
    
    return {
      data_for_seo_key: apiKey.data_for_seo_key || "",
      data_for_seo_email: apiKey.data_for_seo_email || "",
      google_api_key: apiKey.google_api_key || "",
      google_client_id: apiKey.google_client_id || "",
      google_client_secret: apiKey.google_client_secret || "",
      gbp_client_id: apiKey.gbp_client_id || "",
      gbp_client_secret: apiKey.gbp_client_secret || "",
      gbp_redirect_uri: apiKey.gbp_redirect_uri || "",
      gbp_access_token: apiKey.gbp_access_token || "",
      gbp_refresh_token: apiKey.gbp_refresh_token || "",
      gbp_token_expiry: apiKey.gbp_token_expiry || "",
      serp_api_key: apiKey.serp_api_key || "",
      language_model_provider: apiKey.language_model_provider || "",
      // NLP for FAQ matching
      nlp_provider: apiKey.nlp_provider || "natural",
      use_advanced_nlp: apiKey.use_advanced_nlp !== undefined ? apiKey.use_advanced_nlp : true,
      openai_api_key: apiKey.openai_api_key || "",
      claude_api_key: apiKey.claude_api_key || "",
      grok_api_key: apiKey.grok_api_key || "",
      deepseek_api_key: apiKey.deepseek_api_key || "",
      geo_grid_api_preference: safeGeoGridPreference(apiKey.geo_grid_api_preference)
    };
  }
  
  async updateApiKeys(userId: number, keys: ApiKeysData): Promise<ApiKeysData> {
    // Find the API keys for this user
    const apiKey = Array.from(this.apiKeys.values()).find(
      (apiKey) => apiKey.user_id === userId
    );
    
    if (!apiKey) {
      // If no keys exist, create new ones
      return this.saveApiKeys(userId, keys);
    }
    
    // Update existing keys
    apiKey.data_for_seo_key = keys.data_for_seo_key || null;
    apiKey.data_for_seo_email = keys.data_for_seo_email || null;
    apiKey.google_api_key = keys.google_api_key || null;
    apiKey.google_client_id = keys.google_client_id || null;
    apiKey.google_client_secret = keys.google_client_secret || null;
    apiKey.gbp_client_id = keys.gbp_client_id || null;
    apiKey.gbp_client_secret = keys.gbp_client_secret || null;
    apiKey.gbp_redirect_uri = keys.gbp_redirect_uri || null;
    apiKey.gbp_access_token = keys.gbp_access_token || null;
    apiKey.gbp_refresh_token = keys.gbp_refresh_token || null;
    apiKey.gbp_token_expiry = keys.gbp_token_expiry || null;
    apiKey.serp_api_key = keys.serp_api_key || null;
    apiKey.language_model_provider = keys.language_model_provider || null;
    // NLP settings
    apiKey.nlp_provider = keys.nlp_provider || apiKey.nlp_provider || 'natural';
    apiKey.use_advanced_nlp = keys.use_advanced_nlp !== undefined ? keys.use_advanced_nlp : (apiKey.use_advanced_nlp !== undefined ? apiKey.use_advanced_nlp : true);
    apiKey.openai_api_key = keys.openai_api_key || null;
    apiKey.claude_api_key = keys.claude_api_key || null;
    apiKey.grok_api_key = keys.grok_api_key || null;
    apiKey.deepseek_api_key = keys.deepseek_api_key || null;
    apiKey.geo_grid_api_preference = keys.geo_grid_api_preference ? keys.geo_grid_api_preference : null;
    apiKey.updated_at = new Date();
    
    this.apiKeys.set(apiKey.id, apiKey);
    
    return {
      data_for_seo_key: apiKey.data_for_seo_key || "",
      data_for_seo_email: apiKey.data_for_seo_email || "",
      google_api_key: apiKey.google_api_key || "",
      google_client_id: apiKey.google_client_id || "",
      google_client_secret: apiKey.google_client_secret || "",
      gbp_client_id: apiKey.gbp_client_id || "",
      gbp_client_secret: apiKey.gbp_client_secret || "",
      gbp_redirect_uri: apiKey.gbp_redirect_uri || "",
      gbp_access_token: apiKey.gbp_access_token || "",
      gbp_refresh_token: apiKey.gbp_refresh_token || "",
      gbp_token_expiry: apiKey.gbp_token_expiry || "",
      serp_api_key: apiKey.serp_api_key || "",
      language_model_provider: apiKey.language_model_provider || "",
      // NLP for FAQ matching
      nlp_provider: apiKey.nlp_provider || "natural",
      use_advanced_nlp: apiKey.use_advanced_nlp !== undefined ? apiKey.use_advanced_nlp : true,
      openai_api_key: apiKey.openai_api_key || "",
      claude_api_key: apiKey.claude_api_key || "",
      grok_api_key: apiKey.grok_api_key || "",
      deepseek_api_key: apiKey.deepseek_api_key || "",
      geo_grid_api_preference: safeGeoGridPreference(apiKey.geo_grid_api_preference)
    };
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Update user role
  async updateUserRole(userId: number, role: UserRole): Promise<User | undefined> {
    const user = this.users.get(userId);
    
    if (!user) return undefined;
    
    // Update role - ensure it's a valid role
    user.role = role === 'admin' ? 'admin' : 'client';
    
    // Update user in map
    this.users.set(userId, user);
    
    return user;
  }

  // Delete user
  async deleteUser(userId: number): Promise<boolean> {
    // First check if user exists
    if (!this.users.has(userId)) return false;
    
    // Delete all API keys for this user
    const keysToDelete = Array.from(this.apiKeys.values())
      .filter(key => key.user_id === userId)
      .map(key => key.id);
    
    keysToDelete.forEach(keyId => this.apiKeys.delete(keyId));
    
    // Delete user
    return this.users.delete(userId);
  }

  // Update user subscription
  async updateUserSubscription(
    userId: number, 
    plan: SubscriptionPlanCode, 
    status: SubscriptionStatus, 
    expiry: Date | null
  ): Promise<User | undefined> {
    const user = this.users.get(userId);
    
    if (!user) return undefined;
    
    // Update subscription details
    user.subscription_plan = plan;
    user.subscription_status = status;
    user.subscription_expiry = expiry;
    
    // Update user in map
    this.users.set(userId, user);
    
    return user;
  }
  
  // Update user details
  async updateUser(userId: number, userData: UserUpdate): Promise<User | undefined> {
    const user = this.users.get(userId);
    
    if (!user) return undefined;
    
    // Update user fields if provided
    if (userData.username) user.username = userData.username;
    if (userData.email) user.email = userData.email;
    if (userData.role) user.role = userData.role;
    if (userData.subscription_plan) user.subscription_plan = userData.subscription_plan;
    if (userData.subscription_status) user.subscription_status = userData.subscription_status;
    if ('subscription_expiry' in userData) user.subscription_expiry = userData.subscription_expiry ?? null;
    if ('selected_campaign_id' in userData) user.selected_campaign_id = userData.selected_campaign_id ?? null;
    if ('selected_client_id' in userData) user.selected_client_id = userData.selected_client_id ?? null;
    
    // Update user in map
    this.users.set(userId, user);
    
    return user;
  }

  // Get all API keys
  async getAllApiKeys(): Promise<any[]> {
    // Join with users to get username and email
    return Array.from(this.apiKeys.values()).map(apiKey => {
      const user = this.users.get(apiKey.user_id);
      return {
        ...apiKey,
        username: user?.username || '',
        email: user?.email || ''
      };
    });
  }

  // GBP Location methods
  async getGbpLocations(userId: number): Promise<GbpLocation[]> {
    return Array.from(this.gbpLocations.values()).filter(
      (location) => location.user_id === userId
    );
  }

  async getGbpLocation(locationId: number): Promise<GbpLocation | undefined> {
    return this.gbpLocations.get(locationId);
  }

  async getGbpLocationByGoogleId(userId: number, googleLocationId: string): Promise<GbpLocation | undefined> {
    return Array.from(this.gbpLocations.values()).find(
      (location) => location.user_id === userId && 
      (location.google_location_id === googleLocationId || location.location_id === googleLocationId)
    );
  }

  async createGbpLocation(location: InsertGbpLocation): Promise<GbpLocation> {
    const id = this.gbpLocationId++;
    const now = new Date();
    
    const gbpLocation: GbpLocation = {
      id,
      user_id: location.user_id,
      location_id: location.location_id,
      google_location_id: location.google_location_id || null,
      name: location.name,
      address: location.address,
      phone: location.phone || null,
      website: location.website || null,
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      category: location.category || null,
      status: location.status || 'connected',
      last_updated: now,
      created_at: now
    };
    
    this.gbpLocations.set(id, gbpLocation);
    return gbpLocation;
  }

  async updateGbpLocation(locationId: number, locationData: Partial<InsertGbpLocation>): Promise<GbpLocation | undefined> {
    const location = this.gbpLocations.get(locationId);
    
    if (!location) return undefined;
    
    // Update fields if provided
    if (locationData.name) location.name = locationData.name;
    if (locationData.address) location.address = locationData.address;
    if (locationData.phone) location.phone = locationData.phone;
    if (locationData.website) location.website = locationData.website;
    if (locationData.latitude) location.latitude = locationData.latitude;
    if (locationData.longitude) location.longitude = locationData.longitude;
    if (locationData.status) location.status = locationData.status;
    if ('google_location_id' in locationData) location.google_location_id = locationData.google_location_id || null;
    if ('category' in locationData) location.category = locationData.category || null;
    
    // Always update the last_updated timestamp
    location.last_updated = new Date();
    
    this.gbpLocations.set(locationId, location);
    return location;
  }

  async deleteGbpLocation(locationId: number): Promise<boolean> {
    if (!this.gbpLocations.has(locationId)) return false;
    
    // Find all GBP data entries for this location and delete them
    const dataToDelete = Array.from(this.gbpData.values())
      .filter(data => data.location_id === locationId)
      .map(data => data.id);
    
    dataToDelete.forEach(dataId => this.gbpData.delete(dataId));
    
    // Delete the location
    return this.gbpLocations.delete(locationId);
  }
  
  // GBP Data methods
  async getGbpData(locationId: number, dataType: string): Promise<GbpData | undefined> {
    return Array.from(this.gbpData.values()).find(
      (data) => data.location_id === locationId && data.data_type === dataType
    );
  }
  
  async createGbpData(data: InsertGbpData): Promise<GbpData> {
    const id = this.gbpDataId++;
    const now = new Date();
    
    const gbpData: GbpData = {
      ...data,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.gbpData.set(id, gbpData);
    return gbpData;
  }
  
  async updateGbpData(dataId: number, dataUpdate: Partial<InsertGbpData>): Promise<GbpData | undefined> {
    const data = this.gbpData.get(dataId);
    
    if (!data) return undefined;
    
    // Update fields if provided
    if (dataUpdate.location_id) data.location_id = dataUpdate.location_id;
    if (dataUpdate.data_type) data.data_type = dataUpdate.data_type;
    if (dataUpdate.data) data.data = dataUpdate.data;
    
    // Always update the updated_at timestamp
    data.updated_at = new Date();
    
    this.gbpData.set(dataId, data);
    return data;
  }
  
  async deleteGbpData(dataId: number): Promise<boolean> {
    if (!this.gbpData.has(dataId)) return false;
    return this.gbpData.delete(dataId);
  }
  
  // GBP Posts methods
  async getGbpPosts(locationId: number): Promise<GbpPost[]> {
    return Array.from(this.gbpPosts.values())
      .filter(post => post.location_id === locationId)
      .sort((a, b) => {
        // Sort by scheduled_date (ascending) and created_at (descending)
        if (a.scheduled_date && b.scheduled_date) {
          return a.scheduled_date.getTime() - b.scheduled_date.getTime();
        } else if (a.scheduled_date) {
          return -1; // a has scheduled_date but b doesn't
        } else if (b.scheduled_date) {
          return 1; // b has scheduled_date but a doesn't
        } else {
          // Both don't have scheduled_date, sort by created_at descending
          return b.created_at.getTime() - a.created_at.getTime();
        }
      });
  }

  async getGbpPost(postId: number): Promise<GbpPost | undefined> {
    return this.gbpPosts.get(postId);
  }

  async createGbpPost(post: InsertGbpPost): Promise<GbpPost> {
    const id = this.gbpPostId++;
    const now = new Date();
    
    const gbpPost: GbpPost = {
      id,
      location_id: post.location_id,
      title: post.title,
      content: post.content,
      image_url: post.image_url || null,
      cta_type: post.cta_type || null,
      cta_url: post.cta_url || null,
      status: (post.status as PostStatus) || 'draft',
      scheduled_date: post.scheduled_date || null,
      category: post.category || null,
      tags: post.tags || [],
      published_at: null,
      created_at: now,
      updated_at: now
    };
    
    this.gbpPosts.set(id, gbpPost);
    return gbpPost;
  }

  async updateGbpPost(postId: number, postUpdate: Partial<InsertGbpPost>): Promise<GbpPost | undefined> {
    const post = this.gbpPosts.get(postId);
    
    if (!post) return undefined;
    
    // Update fields if provided
    if (postUpdate.title) post.title = postUpdate.title;
    if (postUpdate.content) post.content = postUpdate.content;
    if ('image_url' in postUpdate) post.image_url = postUpdate.image_url || null;
    if ('cta_type' in postUpdate) post.cta_type = postUpdate.cta_type || null;
    if ('cta_url' in postUpdate) post.cta_url = postUpdate.cta_url || null;
    if (postUpdate.status) post.status = postUpdate.status as PostStatus;
    if ('scheduled_date' in postUpdate) post.scheduled_date = postUpdate.scheduled_date || null;
    if ('category' in postUpdate) post.category = postUpdate.category || null;
    if ('tags' in postUpdate) post.tags = postUpdate.tags || [];
    
    // Always update the updated_at timestamp
    post.updated_at = new Date();
    
    this.gbpPosts.set(postId, post);
    return post;
  }

  async updateGbpPostStatus(postId: number, status: PostStatus, publishedAt?: Date): Promise<GbpPost | undefined> {
    const post = this.gbpPosts.get(postId);
    
    if (!post) return undefined;
    
    post.status = status;
    post.updated_at = new Date();
    
    // If post is published, set published_at
    if (status === 'published') {
      post.published_at = publishedAt || new Date();
    }
    
    this.gbpPosts.set(postId, post);
    return post;
  }

  async deleteGbpPost(postId: number): Promise<boolean> {
    if (!this.gbpPosts.has(postId)) return false;
    return this.gbpPosts.delete(postId);
  }

  // FAQ Methods Implementation
  async getFaqs(locationId: number): Promise<Faq[]> {
    return Array.from(this.gbpFaqs.values()).filter(
      (faq) => faq.location_id === locationId
    );
  }

  async getFaq(faqId: number): Promise<Faq | undefined> {
    return this.gbpFaqs.get(faqId);
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const id = this.gbpFaqId++;
    const now = new Date();
    
    const newFaq: Faq = {
      ...faq,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.gbpFaqs.set(id, newFaq);
    return newFaq;
  }

  async updateFaq(faqId: number, faq: Partial<InsertFaq>): Promise<Faq | undefined> {
    const existingFaq = this.gbpFaqs.get(faqId);
    
    if (!existingFaq) return undefined;
    
    const updatedFaq: Faq = {
      ...existingFaq,
      ...faq,
      updated_at: new Date()
    };
    
    this.gbpFaqs.set(faqId, updatedFaq);
    return updatedFaq;
  }

  async deleteFaq(faqId: number): Promise<boolean> {
    if (!this.gbpFaqs.has(faqId)) return false;
    return this.gbpFaqs.delete(faqId);
  }

  // FAQ Reply Methods Implementation
  async getFaqReplies(locationId: number): Promise<FaqReply[]> {
    return Array.from(this.gbpFaqReplies.values()).filter(
      (reply) => reply.location_id === locationId
    );
  }

  async getFaqReply(replyId: number): Promise<FaqReply | undefined> {
    return this.gbpFaqReplies.get(replyId);
  }

  async createFaqReply(reply: InsertFaqReply): Promise<FaqReply> {
    const id = this.gbpFaqReplyId++;
    const now = new Date();
    
    // Ensure status is a valid FaqMatchStatus
    const status = (reply.status as FaqMatchStatus) || 'pending';
    
    // Create a properly typed FaqReply object
    const newReply: FaqReply = {
      id,
      user_id: reply.user_id,
      location_id: reply.location_id,
      faq_id: reply.faq_id ?? null,
      question: reply.question,
      suggested_answer: reply.suggested_answer,
      faq_match: reply.faq_match ?? null,
      confidence_score: reply.confidence_score ?? null,
      gbp_question_url: reply.gbp_question_url ?? null,
      status,
      created_at: now,
      updated_at: now
    };
    
    this.gbpFaqReplies.set(id, newReply);
    return newReply;
  }

  async updateFaqReply(replyId: number, reply: Partial<InsertFaqReply>): Promise<FaqReply | undefined> {
    const existingReply = this.gbpFaqReplies.get(replyId);
    
    if (!existingReply) return undefined;
    
    // Ensure status is a valid FaqMatchStatus if provided
    const status = reply.status ? (reply.status as FaqMatchStatus) : existingReply.status;
    
    // Update individual fields to ensure type safety
    const updatedReply: FaqReply = {
      ...existingReply,
      question: reply.question ?? existingReply.question,
      suggested_answer: reply.suggested_answer ?? existingReply.suggested_answer,
      faq_id: reply.faq_id ?? existingReply.faq_id,
      faq_match: reply.faq_match ?? existingReply.faq_match,
      confidence_score: reply.confidence_score ?? existingReply.confidence_score,
      gbp_question_url: reply.gbp_question_url ?? existingReply.gbp_question_url,
      status,
      updated_at: new Date()
    };
    
    this.gbpFaqReplies.set(replyId, updatedReply);
    return updatedReply;
  }

  async updateFaqReplyStatus(replyId: number, status: FaqMatchStatus): Promise<FaqReply | undefined> {
    const existingReply = this.gbpFaqReplies.get(replyId);
    
    if (!existingReply) return undefined;
    
    const updatedReply: FaqReply = {
      ...existingReply,
      status,
      updated_at: new Date()
    };
    
    this.gbpFaqReplies.set(replyId, updatedReply);
    return updatedReply;
  }

  async deleteFaqReply(replyId: number): Promise<boolean> {
    if (!this.gbpFaqReplies.has(replyId)) return false;
    return this.gbpFaqReplies.delete(replyId);
  }

  // Helper method - alias for getGbpLocation for compatibility
  async getGbpLocationById(locationId: number): Promise<GbpLocation | undefined> {
    return this.getGbpLocation(locationId);
  }

  // API Keys helper methods
  async getApiKeysByUserId(userId: number): Promise<ApiKeysData | undefined> {
    return this.getApiKeys(userId);
  }

  async updateApiKeysByUserId(userId: number, keys: Partial<ApiKeysData>): Promise<ApiKeysData | undefined> {
    const existingKeys = await this.getApiKeys(userId);
    
    if (!existingKeys) {
      return undefined;
    }
    
    // Merge existing keys with new keys
    const updatedKeys = { ...existingKeys, ...keys };
    return this.updateApiKeys(userId, updatedKeys);
  }

  // GBP Keywords methods
  async getGbpKeywordsByLocationId(locationId: number): Promise<KeywordOptimization[]> {
    return Array.from(this.gbpKeywords.values()).filter(
      (keyword) => keyword.location_id === locationId
    );
  }

  async createGbpKeyword(keyword: Omit<KeywordOptimization, 'id'>): Promise<KeywordOptimization> {
    const id = this.gbpKeywordId++;
    const now = new Date();
    
    const newKeyword: KeywordOptimization = {
      id,
      ...keyword,
      status: keyword.status || 'pending',
      created_at: now,
      updated_at: now
    };
    
    this.gbpKeywords.set(id, newKeyword);
    return newKeyword;
  }

  async updateGbpKeyword(keywordId: number, keywordUpdate: Partial<Omit<KeywordOptimization, 'id'>>): Promise<KeywordOptimization | undefined> {
    const keyword = this.gbpKeywords.get(keywordId);
    
    if (!keyword) {
      return undefined;
    }
    
    const updatedKeyword: KeywordOptimization = {
      ...keyword,
      ...keywordUpdate,
      updated_at: new Date()
    };
    
    this.gbpKeywords.set(keywordId, updatedKeyword);
    return updatedKeyword;
  }

  async deleteGbpKeyword(keywordId: number): Promise<boolean> {
    if (!this.gbpKeywords.has(keywordId)) {
      return false;
    }
    
    this.gbpKeywords.delete(keywordId);
    return true;
  }

  async deleteGbpKeywordsByLocationId(locationId: number): Promise<boolean> {
    const keywords = await this.getGbpKeywordsByLocationId(locationId);
    
    if (keywords.length === 0) {
      return false;
    }
    
    for (const keyword of keywords) {
      this.gbpKeywords.delete(keyword.id);
    }
    
    return true;
  }

  /**
   * Get locations by user ID
   * @param userId The user ID to fetch locations for
   * @returns Array of locations
   */
  async getLocationsByUserId(userId: number): Promise<GbpLocation[]> {
    try {
      // Filter locations by user ID
      return Array.from(this.gbpLocations.values())
        .filter(location => location.user_id === userId);
    } catch (error) {
      console.error('Error getting locations by user ID:', error);
      return [];
    }
  }

  /**
   * Get location by ID
   * @param locationId The location ID to retrieve
   * @returns Location data or undefined if not found
   */
  async getLocationById(locationId: number | string): Promise<GbpLocation | undefined> {
    try {
      // Special case for string IDs like "gbp_1" - extract the number
      if (typeof locationId === 'string') {
        // If it starts with 'gbp_', extract the number
        if (locationId.startsWith('gbp_')) {
          const numericId = parseInt(locationId.replace('gbp_', ''), 10);
          if (!isNaN(numericId)) {
            console.log(`Converted string ID ${locationId} to numeric ID ${numericId}`);
            return this.getGbpLocationById(numericId);
          }
        }
        
        // Try to parse it as a number if it's not in gbp_X format
        const numericId = parseInt(locationId, 10);
        if (!isNaN(numericId)) {
          console.log(`Converted string ID ${locationId} to numeric ID ${numericId}`);
          return this.getGbpLocationById(numericId);
        }
        
        // If we can't convert to a number, check if any location has this ID as location_id
        console.log(`Searching for location with external ID: ${locationId}`);
        const location = Array.from(this.gbpLocations.values()).find(
          (loc) => loc.location_id === locationId
        );
        
        return location;
      }
      
      // Normal case for numeric IDs
      return this.getGbpLocationById(locationId);
    } catch (error) {
      console.error(`Error getting location by ID ${locationId}:`, error);
      return undefined;
    }
  }

  /**
   * Get posts by location ID
   * @param locationId The location ID to fetch posts for
   * @returns Array of posts
   */
  async getPostsByLocationId(locationId: number | string): Promise<any[]> {
    try {
      // If locationId is a string like "gbp_1", convert it to a number
      let numericLocationId = locationId;
      if (typeof locationId === 'string') {
        if (locationId.startsWith('gbp_')) {
          numericLocationId = parseInt(locationId.replace('gbp_', ''), 10);
        } else {
          numericLocationId = parseInt(locationId, 10);
        }
      }
      
      // Only proceed with filtering if we got a valid number
      if (!isNaN(numericLocationId as number)) {
        // Filter posts by location ID
        return Array.from(this.gbpPosts.values())
          .filter(post => post.location_id === numericLocationId);
      }
      
      console.log(`No valid numeric location ID found for ${locationId}, returning empty posts array`);
      return [];
    } catch (error) {
      console.error(`Error getting posts for location ID ${locationId}:`, error);
      return [];
    }
  }

  /**
   * Get reviews by location ID
   * @param locationId The location ID to fetch reviews for
   * @returns Array of reviews
   */
  async getReviewsByLocationId(locationId: number | string): Promise<any[]> {
    try {
      // If locationId is a string like "gbp_1", convert it to a number
      let numericLocationId = locationId;
      if (typeof locationId === 'string') {
        if (locationId.startsWith('gbp_')) {
          numericLocationId = parseInt(locationId.replace('gbp_', ''), 10);
        } else {
          numericLocationId = parseInt(locationId, 10);
        }
      }
      
      // Check if we got a valid number
      if (isNaN(numericLocationId as number)) {
        console.log(`No valid numeric location ID found for ${locationId}, returning empty reviews array`);
        return [];
      }
      
      // Filter reviews by location ID
      const locationReviews = Array.from(this.reviews.values())
        .filter(review => review.location_id === numericLocationId);
      
      // If no reviews exist yet, create sample data
      if (locationReviews.length === 0 && (numericLocationId as number) > 0) {
        // Create sample reviews for demo purposes
        const sampleReviews = [
          {
            id: 101,
            location_id: locationId,
            author: "John Smith",
            rating: 5,
            content: "Great service! The staff was very friendly and helpful.",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            response: "Thank you for your kind words! We're glad you had a positive experience.",
            response_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            id: 102,
            location_id: locationId,
            author: "Sarah Johnson",
            rating: 4,
            content: "Good experience overall. Would recommend to others.",
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            response: "Thanks for your feedback, Sarah! We hope to see you again soon.",
            response_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) // 9 days ago
          },
          {
            id: 103,
            location_id: locationId,
            author: "Michael Brown",
            rating: 3,
            content: "Average service. The facilities were clean but the wait was longer than expected.",
            date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            response: null,
            response_date: null
          },
          {
            id: 104,
            location_id: locationId,
            author: "Emily Wilson",
            rating: 5,
            content: "Exceptional service! The staff went above and beyond to help me.",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            response: "Thank you, Emily! We're thrilled to hear you had such a positive experience.",
            response_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
          },
          {
            id: 105,
            location_id: locationId,
            author: "David Garcia",
            rating: 2,
            content: "Disappointing experience. The service was slow and staff seemed disinterested.",
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            response: null,
            response_date: null
          }
        ];
        
        // Add the sample reviews to the reviews map
        for (const review of sampleReviews) {
          this.reviews.set(review.id, review);
        }
        
        return sampleReviews;
      }
      
      return locationReviews;
    } catch (error) {
      console.error('Error getting reviews by location ID:', error);
      return [];
    }
  }

  /**
   * Get photos by location ID
   * @param locationId The location ID to fetch photos for
   * @returns Array of photos
   */
  async getPhotosByLocationId(locationId: number | string): Promise<any[]> {
    try {
      // If locationId is a string like "gbp_1", convert it to a number
      let numericLocationId = locationId;
      if (typeof locationId === 'string') {
        if (locationId.startsWith('gbp_')) {
          numericLocationId = parseInt(locationId.replace('gbp_', ''), 10);
        } else {
          numericLocationId = parseInt(locationId, 10);
        }
      }
      
      // Check if we got a valid number
      if (isNaN(numericLocationId as number)) {
        console.log(`No valid numeric location ID found for ${locationId}, returning empty photos array`);
        return [];
      }
      
      // Filter photos by location ID
      const locationPhotos = Array.from(this.photos.values())
        .filter(photo => photo.location_id === numericLocationId);
      
      // If no photos exist yet, create sample data
      if (locationPhotos.length === 0 && (numericLocationId as number) > 0) {
        // Create sample photos for demo purposes
        const samplePhotos = [
          {
            id: 201,
            location_id: locationId,
            url: "https://images.unsplash.com/photo-1565992441121-4367c2967103",
            title: "Main entrance",
            is_cover: true,
            upload_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            type: "exterior"
          },
          {
            id: 202,
            location_id: locationId,
            url: "https://images.unsplash.com/photo-1574691250077-03a929faece5",
            title: "Reception area",
            is_cover: false,
            upload_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
            type: "interior"
          },
          {
            id: 203,
            location_id: locationId,
            url: "https://images.unsplash.com/photo-1576678927484-cc907957088c",
            title: "Staff members",
            is_cover: false,
            upload_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            type: "team"
          },
          {
            id: 204,
            location_id: locationId,
            url: "https://images.unsplash.com/photo-1564069114553-7215e1ff1890",
            title: "Product showcase",
            is_cover: false,
            upload_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            type: "product"
          },
          {
            id: 205,
            location_id: locationId,
            url: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e",
            title: "Customer experience",
            is_cover: false,
            upload_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            type: "customer"
          }
        ];
        
        // Add the sample photos to the photos map
        for (const photo of samplePhotos) {
          this.photos.set(photo.id, photo);
        }
        
        return samplePhotos;
      }
      
      return locationPhotos;
    } catch (error) {
      console.error('Error getting photos by location ID:', error);
      return [];
    }
  }
}

export const storage = new MemStorage();
