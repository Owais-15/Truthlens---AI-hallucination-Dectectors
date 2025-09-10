import { type User, type InsertUser, type Analysis, type InsertAnalysis, type Usage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis & { userId: string }): Promise<Analysis>;
  getUserAnalyses(userId: string, limit?: number): Promise<Analysis[]>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  
  // Usage operations
  getUsage(userId: string, month: string): Promise<Usage | undefined>;
  incrementUsage(userId: string, month: string): Promise<Usage>;
  getUserStats(userId: string): Promise<{
    totalAnalyses: number;
    avgAccuracy: number;
    issuesFound: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private analyses: Map<string, Analysis>;
  private usage: Map<string, Usage>;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
    this.usage = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createAnalysis(analysis: InsertAnalysis & { userId: string }): Promise<Analysis> {
    const id = randomUUID();
    const newAnalysis: Analysis = {
      ...analysis,
      id,
      createdAt: new Date(),
    };
    this.analyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async getUserAnalyses(userId: string, limit = 10): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getUsage(userId: string, month: string): Promise<Usage | undefined> {
    return Array.from(this.usage.values()).find(
      usage => usage.userId === userId && usage.month === month
    );
  }

  async incrementUsage(userId: string, month: string): Promise<Usage> {
    const existing = await this.getUsage(userId, month);
    
    if (existing) {
      const updated = { ...existing, analysisCount: (existing.analysisCount || 0) + 1 };
      this.usage.set(existing.id!, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newUsage: Usage = {
        id,
        userId,
        month,
        analysisCount: 1,
        createdAt: new Date(),
      };
      this.usage.set(id, newUsage);
      return newUsage;
    }
  }

  async getUserStats(userId: string): Promise<{
    totalAnalyses: number;
    avgAccuracy: number;
    issuesFound: number;
  }> {
    const userAnalyses = Array.from(this.analyses.values())
      .filter(analysis => analysis.userId === userId);
    
    const totalAnalyses = userAnalyses.length;
    const avgAccuracy = totalAnalyses > 0 
      ? userAnalyses.reduce((sum, analysis) => sum + analysis.factualityScore, 0) / totalAnalyses
      : 0;
    
    const issuesFound = userAnalyses.reduce((sum, analysis) => {
      const results = analysis.results as any;
      return sum + (results?.issues?.length || 0);
    }, 0);

    return { totalAnalyses, avgAccuracy, issuesFound };
  }
}

export const storage = new MemStorage();
