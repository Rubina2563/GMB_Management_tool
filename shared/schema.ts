import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role type
export type UserRole = 'admin' | 'client';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type OptimizationImpact = 'high' | 'medium' | 'low';
export type OptimizationStatus = 'pending' | 'approved' | 'rejected' | 'applied';
export type CampaignStatus = 'active' | 'paused' | 'completed';
export type UpdateFrequency = 'daily' | 'weekly' | 'fortnightly' | 'monthly';
export type GeoGridShape = 'square' | 'circular';
export type LLMProvider = 'openai' | 'claude' | 'grok' | 'deepseek';
export type FaqMatchStatus = 'pending' | 'approved' | 'rejected' | 'manual';
export type NlpProvider = 'spacy' | 'natural' | 'openai';
export type DescriptionTone = 'professional' | 'friendly' | 'persuasive' | 'informative' | 'conversational';

// Subscription plan type
export type SubscriptionPlanCode = 'free' | 'basic' | 'pro';

// Subscription status type
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

// Subscription plans table schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").$type<SubscriptionPlanCode>().notNull(),
  price: integer("price").notNull(), // Price in cents (e.g., 4900 for $49/month)
  features: text("features").notNull(), // JSON string of features
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  first_name: text("first_name"),
  role: text("role").$type<UserRole>().default("client").notNull(),
  subscription_plan: text("subscription_plan").$type<SubscriptionPlanCode>().default("free").notNull(),
  subscription_status: text("subscription_status").$type<SubscriptionStatus>().default("active").notNull(),
  subscription_expiry: timestamp("subscription_expiry"),
  selected_campaign_id: integer("selected_campaign_id"),
  selected_client_id: integer("selected_client_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// API keys table schema
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  data_for_seo_key: text("data_for_seo_key"),
  data_for_seo_email: text("data_for_seo_email"),
  google_api_key: text("google_api_key"),
  google_client_id: text("google_client_id"),
  google_client_secret: text("google_client_secret"),
  serp_api_key: text("serp_api_key"),
  // Google Business Profile API fields
  gbp_client_id: text("gbp_client_id"),
  gbp_client_secret: text("gbp_client_secret"),
  gbp_redirect_uri: text("gbp_redirect_uri"),
  // Google OAuth tokens
  gbp_access_token: text("gbp_access_token"),
  gbp_refresh_token: text("gbp_refresh_token"),
  gbp_token_expiry: text("gbp_token_expiry"),
  // Language Model API fields
  language_model_provider: text("language_model_provider").$type<LLMProvider>(),
  // Geo Grid API preference (dataforseo or google-places)
  geo_grid_api_preference: text("geo_grid_api_preference"),
  // NLP for FAQ matching
  nlp_provider: text("nlp_provider").$type<NlpProvider>().default("natural"),
  use_advanced_nlp: boolean("use_advanced_nlp").default(true),
  openai_api_key: text("openai_api_key"),
  claude_api_key: text("claude_api_key"),
  grok_api_key: text("grok_api_key"),
  deepseek_api_key: text("deepseek_api_key"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// GBP Locations table schema
export const gbpLocations = pgTable("gbp_locations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  location_id: text("location_id").notNull(), // Google Business Profile location ID (legacy)
  google_location_id: text("google_location_id"), // Google Business Profile location ID from API
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  website: text("website"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  category: text("category"), // Primary business category
  status: text("status").default("connected").notNull(),
  last_updated: timestamp("last_updated").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// GBP Data table schema for storing additional data like reviews, insights, etc.
export const gbpData = pgTable("gbp_data", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").notNull().references(() => gbpLocations.id),
  data_type: text("data_type").notNull(), // 'reviews', 'insights', 'posts', etc.
  data: json("data").notNull(), // Structured JSON data
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// GBP Posts table schema
export const gbpPosts = pgTable("gbp_posts", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").notNull().references(() => gbpLocations.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  image_url: text("image_url"),
  cta_type: text("cta_type"), // 'LEARN_MORE', 'BOOK', 'ORDER', 'SHOP', 'SIGN_UP', 'CALL'
  cta_url: text("cta_url"),
  scheduled_date: timestamp("scheduled_date"),
  status: text("status").$type<PostStatus>().default("draft").notNull(),
  category: text("category"),
  tags: text("tags").array(),
  published_at: timestamp("published_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// GBP Optimization Suggestions table
export const gbpOptimizations = pgTable("gbp_optimizations", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").notNull().references(() => gbpLocations.id),
  type: text("type").notNull(), // 'profile', 'category', 'keyword'
  suggestion: text("suggestion").notNull(),
  description: text("description").notNull(),
  current_value: text("current_value"),
  suggested_value: text("suggested_value").notNull(),
  impact: text("impact").$type<OptimizationImpact>().default("medium").notNull(),
  status: text("status").$type<OptimizationStatus>().default("pending").notNull(),
  applied_at: timestamp("applied_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// GBP Categories Optimization table
export const gbpCategories = pgTable("gbp_categories", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").notNull().references(() => gbpLocations.id),
  category_name: text("category_name").notNull(),
  is_primary: boolean("is_primary").default(false).notNull(),
  is_current: boolean("is_current").default(false).notNull(),
  ranking_score: integer("ranking_score").default(0).notNull(), // 0-100
  status: text("status").$type<OptimizationStatus>().default("pending").notNull(),
  applied_at: timestamp("applied_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// GBP Keywords Optimization table
export const gbpKeywords = pgTable("gbp_keywords", {
  id: serial("id").primaryKey(),
  location_id: integer("location_id").notNull().references(() => gbpLocations.id),
  keyword: text("keyword").notNull(),
  difficulty: integer("difficulty").default(5).notNull(), // 1-10
  volume: integer("volume").default(0).notNull(),
  priority: integer("priority").default(3).notNull(), // 1-5
  is_current: boolean("is_current").default(false).notNull(),
  status: text("status").$type<OptimizationStatus>().default("pending").notNull(),
  applied_at: timestamp("applied_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Campaigns table schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  status: text("status").$type<CampaignStatus>().default("active").notNull(),
  geo_grid_size: integer("geo_grid_size").default(7).notNull(), // e.g., 7x7
  distance: integer("distance").default(1).notNull(), // in km
  shape: text("shape").$type<GeoGridShape>().default("square").notNull(),
  update_frequency: text("update_frequency").$type<UpdateFrequency>().default("weekly").notNull(),
  email_notifications: boolean("email_notifications").default(true).notNull(),
  notification_recipients: text("notification_recipients"), // JSON string of email recipients
  credit_cost: integer("credit_cost").default(10).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Campaign Locations junction table (many-to-many)
export const campaignLocations = pgTable("campaign_locations", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id),
  location_id: integer("location_id").notNull().references(() => gbpLocations.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Campaign Keywords junction table (many-to-many)
export const campaignKeywords = pgTable("campaign_keywords", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id),
  keyword: text("keyword").notNull(),
  is_primary: boolean("is_primary").default(false).notNull(),
  tag: text("tag").default("general").notNull(),
  volume: integer("volume").default(0),
  difficulty: integer("difficulty").default(5),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Campaign Rankings data
export const campaignRankings = pgTable("campaign_rankings", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id),
  keyword_id: integer("keyword_id").notNull().references(() => campaignKeywords.id),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  rank: integer("rank").notNull(),
  search_volume: integer("search_volume").default(0),
  rank_change: integer("rank_change").default(0),
  competitors: text("competitors"), // JSON string of competitor names
  date_checked: timestamp("date_checked").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Campaign Audits
export const campaignAudits = pgTable("campaign_audits", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id),
  audit_type: text("audit_type").notNull(), // 'automated' or 'premium'
  score: integer("score").default(0), // 0-100
  details: text("details").notNull(), // JSON string with audit details
  recommendations: text("recommendations").notNull(), // JSON string with recommendations
  completed_at: timestamp("completed_at"),
  order_date: timestamp("order_date").defaultNow().notNull(),
  credit_cost: integer("credit_cost").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Health check response schema
export const healthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  uptime: z.string(),
  message: z.string(),
  serverRuntime: z.string().optional(),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration schema with validation
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  first_name: z.string().optional(),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Auth response schema
export const authResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    first_name: z.string().optional(),
    role: z.enum(['admin', 'client']),
    subscription_plan: z.enum(['free', 'basic', 'pro']).optional(),
    subscription_status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional(),
  }).optional(),
  token: z.string().optional(),
});

// API key validation patterns
const apiKeyPatterns = {
  dataForSEO: /^[A-Za-z0-9_-]{8,64}$/,  // DataForSEO keys can be shorter than originally expected
  googleAPI: /^[A-Za-z0-9_-]{39}$/,
  serpAPI: /^[A-Za-z0-9]{32,64}$/,
};

// API Keys schema
export const apiKeysSchema = z.object({
  data_for_seo_key: z.string()
    .regex(apiKeyPatterns.dataForSEO, "Invalid DataForSEO API key format")
    .optional()
    .or(z.literal("")),
  data_for_seo_email: z.string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  google_api_key: z.string()
    .regex(apiKeyPatterns.googleAPI, "Invalid Google API key format")
    .optional()
    .or(z.literal("")),
  google_client_id: z.string()
    .optional()
    .or(z.literal("")),
  google_client_secret: z.string()
    .optional()
    .or(z.literal("")),
  serp_api_key: z.string()
    .regex(apiKeyPatterns.serpAPI, "Invalid SERP API key format")
    .optional()
    .or(z.literal("")),
  // Google Business Profile API fields
  gbp_client_id: z.string()
    .optional()
    .or(z.literal("")),
  gbp_client_secret: z.string()
    .optional()
    .or(z.literal("")),
  gbp_redirect_uri: z.string()
    .optional()
    .or(z.literal("")),
  // Google OAuth tokens
  gbp_access_token: z.string()
    .optional()
    .or(z.literal("")),
  gbp_refresh_token: z.string()
    .optional()
    .or(z.literal("")),
  gbp_token_expiry: z.string()
    .optional()
    .or(z.literal("")),
  // Language Model API fields
  language_model_provider: z.enum(['openai', 'claude', 'grok', 'deepseek'])
    .optional()
    .or(z.literal("")),
  openai_api_key: z.string()
    .optional()
    .or(z.literal("")),
  claude_api_key: z.string()
    .optional()
    .or(z.literal("")),
  grok_api_key: z.string()
    .optional()
    .or(z.literal("")),
  deepseek_api_key: z.string()
    .optional()
    .or(z.literal("")),
  // Geo Grid API preference
  geo_grid_api_preference: z.enum(['dataforseo', 'google-places'])
    .optional()
    .or(z.literal("")),
  // NLP Provider for FAQ matching
  nlp_provider: z.enum(['spacy', 'natural', 'openai'])
    .optional()
    .or(z.literal("")),
  use_advanced_nlp: z.boolean()
    .optional(),
});

// API Keys response schema
export const apiKeysResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  api_keys: apiKeysSchema.optional(),
});

// User management schemas
export const userListSchema = z.object({
  users: z.array(z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    first_name: z.string().optional(),
    role: z.enum(['admin', 'client']),
    subscription_plan: z.enum(['free', 'basic', 'pro']),
    subscription_status: z.enum(['active', 'expired', 'cancelled', 'pending']),
    subscription_expiry: z.string().nullable(),
    created_at: z.string(),
  })),
  success: z.boolean(),
  message: z.string(),
});

export const userUpdateSchema = z.object({
  id: z.number(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  role: z.enum(['admin', 'client']).optional(),
  subscription_plan: z.enum(['free', 'basic', 'pro']).optional(),
  subscription_status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional(),
  subscription_expiry: z.date().optional().nullable(),
  selected_campaign_id: z.number().optional().nullable(),
  selected_client_id: z.number().optional().nullable(),
});

// Subscription plans schema
export const subscriptionPlanSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.enum(['free', 'basic', 'pro']),
  price: z.number(),
  features: z.string(),
});

export const subscriptionPlansListSchema = z.object({
  plans: z.array(subscriptionPlanSchema),
  success: z.boolean(),
  message: z.string(),
});

// Insert user schema (for validation)
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  first_name: true,
  role: true,
  subscription_plan: true,
  subscription_status: true,
  subscription_expiry: true,
});

// Insert API keys schema
export const insertApiKeysSchema = createInsertSchema(apiKeys).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// GBP Location schema
export const insertGbpLocationSchema = createInsertSchema(gbpLocations).omit({
  id: true,
  created_at: true,
  last_updated: true,
});

// GBP Data schema
export const insertGbpDataSchema = createInsertSchema(gbpData).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// GBP Connect schema
export const gbpConnectSchema = z.object({
  location_id: z.string().min(1, "Location ID is required"),
});

// GBP Location response schema 
export const gbpLocationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  location_id: z.string(),
  google_location_id: z.string().nullable(),
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  category: z.string().nullable(),
  status: z.string(),
  last_updated: z.string(),
  created_at: z.string(),
});

// GBP Locations list response
export const gbpLocationsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  locations: z.array(gbpLocationSchema).optional(),
});

// GBP Data response
export const gbpDataResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.record(z.any()).optional(),
});

// GBP Post schemas
export const gbpPostSchema = z.object({
  id: z.number().optional(),
  location_id: z.number(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  image_url: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  cta_type: z.enum(["LEARN_MORE", "BOOK", "ORDER", "SHOP", "SIGN_UP", "CALL"]).optional(),
  cta_url: z.string().url("Please enter a valid CTA URL").optional().or(z.literal("")),
  scheduled_date: z.date().optional(),
  status: z.enum(["draft", "scheduled", "published", "failed"]).default("draft"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published_at: z.date().optional().nullable(),
});

export const insertGbpPostSchema = createInsertSchema(gbpPosts).omit({
  id: true,
  created_at: true,
  updated_at: true,
  published_at: true
});

export const gbpPostsListSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  posts: z.array(gbpPostSchema),
});

export const gbpPostResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  post: gbpPostSchema.optional(),
});

export const generatePostSchema = z.object({
  location_id: z.number(),
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  service_type: z.string().min(3, "Service type must be at least 3 characters"),
  tone: z.enum(["professional", "casual", "friendly", "formal"]).default("professional"),
});

export const generatedPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  image_prompt: z.string().optional(),
});

// GBP Optimization schemas
export const optimizationSchema = z.object({
  id: z.number().optional(),
  location_id: z.number(),
  type: z.string(),
  suggestion: z.string(),
  description: z.string(),
  current_value: z.string().optional().nullable(),
  suggested_value: z.string(),
  impact: z.enum(["high", "medium", "low"]),
  status: z.enum(["pending", "approved", "rejected", "applied"]).default("pending"),
});

export const categoryOptimizationSchema = z.object({
  id: z.number().optional(),
  location_id: z.number(), 
  category_name: z.string(),
  is_primary: z.boolean().default(false),
  is_current: z.boolean().default(false),
  ranking_score: z.number().min(0).max(100),
  status: z.enum(["pending", "approved", "rejected", "applied"]).default("pending"),
});

export const keywordOptimizationSchema = z.object({
  id: z.number().optional(),
  location_id: z.number(),
  keyword: z.string(),
  difficulty: z.number().min(1).max(10),
  volume: z.number().min(0),
  priority: z.number().min(1).max(5),
  is_current: z.boolean().default(false),
  status: z.enum(["pending", "approved", "rejected", "applied"]).default("pending"),
});

export const optimizationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  suggestions: z.array(optimizationSchema).optional(),
});

export const categoryOptimizationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  categories: z.array(categoryOptimizationSchema).optional(),
});

export const keywordOptimizationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  keywords: z.array(keywordOptimizationSchema).optional(),
});

// Campaign schemas
export const campaignSchema = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  name: z.string().min(3, "Name must be at least 3 characters long"),
  status: z.enum(["active", "paused", "completed"]).default("active"),
  geo_grid_size: z.number().min(3).max(15).default(7),
  distance: z.number().min(0.1).max(10).default(1),
  shape: z.enum(["square", "circular"]).default("square"),
  update_frequency: z.enum(["daily", "weekly", "fortnightly", "monthly"]).default("weekly"),
  email_notifications: z.boolean().default(true),
  notification_recipients: z.string().optional(),
  credit_cost: z.number().default(10),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const campaignKeywordSchema = z.object({
  id: z.number().optional(),
  campaign_id: z.number(),
  keyword: z.string().min(2, "Keyword must be at least 2 characters long"),
  is_primary: z.boolean().default(false),
  tag: z.string().default("general"),
  volume: z.number().default(0),
  difficulty: z.number().default(5),
});

export const insertCampaignKeywordSchema = createInsertSchema(campaignKeywords).omit({
  id: true,
  created_at: true,
});

export const campaignLocationSchema = z.object({
  id: z.number().optional(),
  campaign_id: z.number(),
  location_id: z.number(),
});

export const insertCampaignLocationSchema = createInsertSchema(campaignLocations).omit({
  id: true,
  created_at: true,
});

export const campaignRankingSchema = z.object({
  id: z.number().optional(),
  campaign_id: z.number(),
  keyword_id: z.number(),
  lat: z.string(),
  lng: z.string(),
  rank: z.number(),
  search_volume: z.number().default(0),
  rank_change: z.number().default(0),
  competitors: z.string().optional(),
  date_checked: z.date().default(() => new Date()),
});

export const campaignAuditSchema = z.object({
  id: z.number().optional(),
  campaign_id: z.number(),
  audit_type: z.enum(["automated", "premium"]),
  score: z.number().min(0).max(100),
  details: z.string(),
  recommendations: z.string(),
  completed_at: z.date().optional(),
  order_date: z.date().default(() => new Date()),
  credit_cost: z.number().default(0),
});

// Response schemas
export const campaignsListSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  campaigns: z.array(campaignSchema),
});

export const campaignResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  campaign: campaignSchema.optional(),
});

export const campaignKeywordsListSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  keywords: z.array(campaignKeywordSchema),
});

export const campaignRankingsListSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  rankings: z.array(campaignRankingSchema),
});

export const campaignAuditsListSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  audits: z.array(campaignAuditSchema),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ApiKeys = typeof apiKeys.$inferSelect;
export type GbpLocation = typeof gbpLocations.$inferSelect;
export type GbpData = typeof gbpData.$inferSelect;
export type InsertApiKeys = z.infer<typeof insertApiKeysSchema>;
export type InsertGbpLocation = z.infer<typeof insertGbpLocationSchema>;
export type InsertGbpData = z.infer<typeof insertGbpDataSchema>;
export type ApiKeysData = z.infer<typeof apiKeysSchema>;
export type ApiKeysResponse = z.infer<typeof apiKeysResponseSchema>;
export type HealthCheckResponse = z.infer<typeof healthCheckSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type SubscriptionPlanType = typeof subscriptionPlans.$inferSelect;
export type UserListResponse = z.infer<typeof userListSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type SubscriptionPlanData = z.infer<typeof subscriptionPlanSchema>;
export type SubscriptionPlansResponse = z.infer<typeof subscriptionPlansListSchema>;
export type GbpConnectData = z.infer<typeof gbpConnectSchema>;
export type GbpLocationData = z.infer<typeof gbpLocationSchema>;
export type GbpLocationsResponse = z.infer<typeof gbpLocationsResponseSchema>;
export type GbpDataResponse = z.infer<typeof gbpDataResponseSchema>;
export type GbpPost = typeof gbpPosts.$inferSelect;
export type InsertGbpPost = z.infer<typeof insertGbpPostSchema>;
export type GbpPostsList = z.infer<typeof gbpPostsListSchema>;
export type GbpPostResponse = z.infer<typeof gbpPostResponseSchema>;
export type GeneratePostData = z.infer<typeof generatePostSchema>;
export type GeneratedPost = z.infer<typeof generatedPostSchema>;
export type Optimization = typeof gbpOptimizations.$inferSelect;
export type CategoryOptimization = typeof gbpCategories.$inferSelect;
export type KeywordOptimization = typeof gbpKeywords.$inferSelect;
export type OptimizationResponse = z.infer<typeof optimizationResponseSchema>;
export type CategoryOptimizationResponse = z.infer<typeof categoryOptimizationResponseSchema>;
export type KeywordOptimizationResponse = z.infer<typeof keywordOptimizationResponseSchema>;

// Campaign-related types
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignLocation = typeof campaignLocations.$inferSelect;
export type CampaignKeyword = typeof campaignKeywords.$inferSelect;
export type CampaignRanking = typeof campaignRankings.$inferSelect;
export type CampaignAudit = typeof campaignAudits.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertCampaignKeyword = z.infer<typeof insertCampaignKeywordSchema>;
export type InsertCampaignLocation = z.infer<typeof insertCampaignLocationSchema>;
export type CampaignData = z.infer<typeof campaignSchema>;
export type CampaignKeywordData = z.infer<typeof campaignKeywordSchema>;
export type CampaignLocationData = z.infer<typeof campaignLocationSchema>;
export type CampaignRankingData = z.infer<typeof campaignRankingSchema>;
export type CampaignAuditData = z.infer<typeof campaignAuditSchema>;
export type CampaignsListResponse = z.infer<typeof campaignsListSchema>;
export type CampaignResponse = z.infer<typeof campaignResponseSchema>;
export type CampaignKeywordsListResponse = z.infer<typeof campaignKeywordsListSchema>;
export type CampaignRankingsListResponse = z.infer<typeof campaignRankingsListSchema>;
export type CampaignAuditsListResponse = z.infer<typeof campaignAuditsListSchema>;

// FAQ tables schema
export const gbpFaqs = pgTable("gbp_faqs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  location_id: integer("location_id").notNull().references(() => gbpLocations.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// FAQ Suggested Replies table
export const gbpFaqReplies = pgTable("gbp_faq_replies", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  location_id: integer("location_id").notNull().references(() => gbpLocations.id),
  faq_id: integer("faq_id").references(() => gbpFaqs.id),
  question: text("question").notNull(),
  suggested_answer: text("suggested_answer").notNull(),
  faq_match: text("faq_match"),
  confidence_score: real("confidence_score"),
  status: text("status").$type<FaqMatchStatus>().default("pending").notNull(),
  gbp_question_url: text("gbp_question_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas for the FAQ tables
export const insertFaqSchema = createInsertSchema(gbpFaqs).omit({ 
  id: true, 
  created_at: true,
  updated_at: true 
});

export const insertFaqReplySchema = createInsertSchema(gbpFaqReplies).omit({ 
  id: true, 
  created_at: true,
  updated_at: true 
});

// FAQ types
export type Faq = typeof gbpFaqs.$inferSelect;
export type FaqReply = typeof gbpFaqReplies.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type InsertFaqReply = z.infer<typeof insertFaqReplySchema>;

// FAQ response schemas
export const faqSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  location_id: z.number(),
  question: z.string(),
  answer: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const faqReplySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  location_id: z.number(),
  faq_id: z.number().nullable(),
  question: z.string(),
  suggested_answer: z.string(),
  faq_match: z.string().nullable(),
  confidence_score: z.number().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'manual']),
  gbp_question_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const faqsListSchema = z.object({
  faqs: z.array(faqSchema),
  success: z.boolean(),
  message: z.string(),
});

export const faqRepliesListSchema = z.object({
  replies: z.array(faqReplySchema),
  success: z.boolean(),
  message: z.string(),
});

export const faqResponseSchema = z.object({
  faq: faqSchema,
  success: z.boolean(),
  message: z.string(),
});

export const faqReplyResponseSchema = z.object({
  reply: faqReplySchema,
  success: z.boolean(),
  message: z.string(),
});

export type FaqData = z.infer<typeof faqSchema>;
export type FaqReplyData = z.infer<typeof faqReplySchema>;
export type FaqsListResponse = z.infer<typeof faqsListSchema>;
export type FaqRepliesListResponse = z.infer<typeof faqRepliesListSchema>;
export type FaqResponse = z.infer<typeof faqResponseSchema>;
export type FaqReplyResponse = z.infer<typeof faqReplyResponseSchema>;

// Description Generator schemas and types
export const descriptionGeneratorSchema = z.object({
  locationId: z.number(),
  businessDetails: z.object({
    businessName: z.string(),
    categories: z.array(z.string()),
    services: z.array(z.string()),
    products: z.array(z.string()),
    uniqueSellingPoints: z.array(z.string())
  }),
  tone: z.enum(['professional', 'friendly', 'persuasive', 'informative', 'conversational'])
});

export const descriptionResponseSchema = z.object({
  success: z.boolean(),
  descriptions: z.array(z.string()),
  canAutoUpdate: z.boolean(),
  manualInstructions: z.string()
});

export type DescriptionGeneratorData = z.infer<typeof descriptionGeneratorSchema>;
export type DescriptionResponse = z.infer<typeof descriptionResponseSchema>;
