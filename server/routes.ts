import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { performComprehensiveAnalysis } from "./services/analysis.js";
import { registerUser, loginUser, verifyToken, extractTokenFromRequest } from "./services/auth.js";
import { registerSchema, loginSchema, insertAnalysisSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = async (req: any, res: any, next: any) => {
    const token = extractTokenFromRequest(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors 
        });
      }

      const { email, password, name } = validation.data;
      const result = await registerUser(email, password, name);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json({
        user: result.user,
        token: result.token
      });
    } catch (error) {
      console.error('Register route error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors 
        });
      }

      const { email, password } = validation.data;
      const result = await loginUser(email, password);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json({
        user: result.user,
        token: result.token
      });
    } catch (error) {
      console.error('Login route error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateUser, async (req, res) => {
    res.json({ user: req.user });
  });

  // Analysis routes
  app.post('/api/analysis', authenticateUser, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Content is required' });
      }

      // Perform comprehensive analysis
      const analysisResult = await performComprehensiveAnalysis(content);

      // Save analysis to storage
      const analysis = await storage.createAnalysis({
        userId: req.user.id,
        content,
        results: analysisResult,
        factualityScore: analysisResult.factualityScore
      });

      // Update usage statistics
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      await storage.incrementUsage(req.user.id, currentMonth);

      res.json({
        analysisId: analysis.id,
        ...analysisResult
      });
    } catch (error) {
      console.error('Analysis route error:', error);
      res.status(500).json({ message: 'Analysis failed' });
    }
  });

  app.get('/api/analysis/history', authenticateUser, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getUserAnalyses(req.user.id, limit);
      res.json({ analyses });
    } catch (error) {
      console.error('History route error:', error);
      res.status(500).json({ message: 'Failed to fetch history' });
    }
  });

  app.get('/api/analysis/:id', authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis || analysis.userId !== req.user.id) {
        return res.status(404).json({ message: 'Analysis not found' });
      }

      res.json({ analysis });
    } catch (error) {
      console.error('Get analysis route error:', error);
      res.status(500).json({ message: 'Failed to fetch analysis' });
    }
  });

  // User stats routes
  app.get('/api/user/stats', authenticateUser, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json({ stats });
    } catch (error) {
      console.error('Stats route error:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  app.get('/api/user/usage', authenticateUser, async (req, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const usage = await storage.getUsage(req.user.id, currentMonth);
      res.json({ 
        usage: {
          current: usage?.analysisCount || 0,
          limit: 100 // Monthly limit
        }
      });
    } catch (error) {
      console.error('Usage route error:', error);
      res.status(500).json({ message: 'Failed to fetch usage' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        gemini: !!process.env.GEMINI_API_KEY,
        exa: !!process.env.EXA_API_KEY
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
