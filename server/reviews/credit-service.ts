// Credit Service - Handles user credit management for premium features
// This is a mock implementation, in a real app this would use a database

import { storage } from '../storage';

// Credit costs
export const CREDIT_COSTS = {
  REVIEW_PULL: 1,    // 1 credit per pull
  AI_REPLY: 2,       // 2 credits per AI-generated reply (when using our API)
  DAILY_SYNC: 1      // 1 credit for daily sync
};

export class CreditService {
  // Store credits in memory - in a real implementation this would be in the database
  private userCredits: Map<number, number> = new Map();
  
  constructor() {
    // Initialize with some demo values
    this.userCredits.set(1, 500); // admin
    this.userCredits.set(2, 150); // client
  }
  
  // Get user's credit balance
  async getUserCredits(userId: number): Promise<number> {
    return this.userCredits.get(userId) || 0;
  }
  
  // Deduct credits for a service
  async deductCredits(userId: number, amount: number): Promise<boolean> {
    const currentCredits = this.userCredits.get(userId) || 0;
    
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    this.userCredits.set(userId, currentCredits - amount);
    return true;
  }
  
  // Add credits to a user account
  async addCredits(userId: number, amount: number): Promise<number> {
    const currentCredits = this.userCredits.get(userId) || 0;
    const newBalance = currentCredits + amount;
    this.userCredits.set(userId, newBalance);
    return newBalance;
  }
  
  // Check if user has enough credits for a service
  async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
    const currentCredits = this.userCredits.get(userId) || 0;
    return currentCredits >= amount;
  }
}

export const creditService = new CreditService();