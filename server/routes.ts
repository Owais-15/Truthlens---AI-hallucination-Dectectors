import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from 'bcrypt';
import { storage } from "./storage.js";
import { performComprehensiveAnalysis } from "./services/analysis.js";
import { registerUser, loginUser, verifyToken, extractTokenFromRequest } from "./services/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail, generateSecureToken, isTokenExpired } from "./services/email.js";
import { generateTwoFactorSecret, verifyTwoFactorToken, generateBackupCodes } from "./services/twoFactor.js";
import { 
  registerSchema, 
  loginSchema, 
  insertAnalysisSchema, 
  updateProfileSchema,
  changePasswordSchema,
  resetPasswordSchema,
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  subscriptionSchema,
  type User 
} from "@shared/schema";
import Stripe from "stripe";

interface AuthenticatedRequest extends Request {
  user: User;
}

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

  app.get('/api/auth/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // Analysis routes
  app.post('/api/analysis', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

  app.get('/api/analysis/history', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getUserAnalyses(req.user.id, limit);
      res.json({ analyses });
    } catch (error) {
      console.error('History route error:', error);
      res.status(500).json({ message: 'Failed to fetch history' });
    }
  });

  app.get('/api/analysis/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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
  app.get('/api/user/stats', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json({ stats });
    } catch (error) {
      console.error('Stats route error:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  app.get('/api/user/usage', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
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

  // Profile management routes
  app.put('/api/user/profile', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors 
        });
      }

      const updates = validation.data;
      
      // If email is being changed, check if it's already taken
      if (updates.email && updates.email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(updates.email);
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        // Reset email verification if email changes
        updates.emailVerified = false;
      }

      const updatedUser = await storage.updateUser(req.user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Send verification email if email was changed
      if (updates.email && updates.email !== req.user.email) {
        const token = generateSecureToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await storage.createVerificationToken(req.user.id, token, 'email_verification', expiresAt);
        await sendVerificationEmail(updates.email, updates.name || req.user.name, token);
      }

      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Profile update route error:', error);
      res.status(500).json({ message: 'Profile update failed' });
    }
  });

  app.put('/api/user/password', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = changePasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors 
        });
      }

      const { currentPassword, newPassword } = validation.data;
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, req.user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      const updatedUser = await storage.updateUser(req.user.id, { 
        password: hashedNewPassword 
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change route error:', error);
      res.status(500).json({ message: 'Password change failed' });
    }
  });

  // Email verification routes
  app.post('/api/auth/send-verification', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user.emailVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.createVerificationToken(req.user.id, token, 'email_verification', expiresAt);
      
      const emailSent = await sendVerificationEmail(req.user.email, req.user.name, token);
      
      res.json({ 
        message: 'Verification email sent',
        emailSent: emailSent
      });
    } catch (error) {
      console.error('Send verification route error:', error);
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  });

  app.get('/api/auth/verify-email', async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Invalid verification token' });
      }

      const verificationToken = await storage.getVerificationToken(token);
      if (!verificationToken || verificationToken.type !== 'email_verification') {
        return res.status(400).json({ message: 'Invalid verification token' });
      }

      if (isTokenExpired(verificationToken.expiresAt)) {
        await storage.deleteVerificationToken(token);
        return res.status(400).json({ message: 'Verification token expired' });
      }

      // Mark user as verified
      await storage.updateUser(verificationToken.userId, { emailVerified: true });
      await storage.deleteVerificationToken(token);

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification route error:', error);
      res.status(500).json({ message: 'Email verification failed' });
    }
  });

  // Two-factor authentication routes
  app.post('/api/user/2fa/setup', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is already enabled' });
      }

      const twoFactorSetup = await generateTwoFactorSecret(req.user.email);
      
      res.json({
        qrCodeUrl: twoFactorSetup.qrCodeUrl,
        manualEntryKey: twoFactorSetup.manualEntryKey,
        secret: twoFactorSetup.secret
      });
    } catch (error) {
      console.error('2FA setup route error:', error);
      res.status(500).json({ message: '2FA setup failed' });
    }
  });

  app.post('/api/user/2fa/enable', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = twoFactorSetupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors 
        });
      }

      const { secret, token } = validation.data;
      
      // Verify the token with the secret
      const isValid = verifyTwoFactorToken(secret, token);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Enable 2FA for the user
      const backupCodes = generateBackupCodes();
      await storage.updateUser(req.user.id, {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        preferences: {
          ...req.user.preferences,
          backupCodes
        }
      });

      res.json({ 
        message: '2FA enabled successfully',
        backupCodes
      });
    } catch (error) {
      console.error('2FA enable route error:', error);
      res.status(500).json({ message: 'Failed to enable 2FA' });
    }
  });

  app.post('/api/user/2fa/disable', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = twoFactorVerifySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors 
        });
      }

      const { token } = validation.data;
      
      if (!req.user.twoFactorEnabled || !req.user.twoFactorSecret) {
        return res.status(400).json({ message: '2FA is not enabled' });
      }

      // Verify the token
      const isValid = verifyTwoFactorToken(req.user.twoFactorSecret, token);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Disable 2FA
      await storage.updateUser(req.user.id, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        preferences: {
          ...req.user.preferences,
          backupCodes: undefined
        }
      });

      res.json({ message: '2FA disabled successfully' });
    } catch (error) {
      console.error('2FA disable route error:', error);
      res.status(500).json({ message: 'Failed to disable 2FA' });
    }
  });

  // Data export route
  app.get('/api/user/export', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userData = await storage.exportUserData(req.user.id);
      
      // Remove sensitive information from export
      const sanitizedData = {
        ...userData,
        user: {
          ...userData.user,
          password: '[REDACTED]',
          twoFactorSecret: userData.user.twoFactorSecret ? '[REDACTED]' : null
        }
      };

      res.json({
        exportedAt: new Date().toISOString(),
        data: sanitizedData
      });
    } catch (error) {
      console.error('Data export route error:', error);
      res.status(500).json({ message: 'Data export failed' });
    }
  });

  // Subscription routes
  app.get('/api/user/subscription', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let subscription = await storage.getUserSubscription(req.user.id);
      
      // Create default free subscription if none exists
      if (!subscription) {
        subscription = await storage.createSubscription(req.user.id, 'free', 100);
      }

      res.json({ subscription });
    } catch (error) {
      console.error('Get subscription route error:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  // Stripe subscription creation
  app.post('/api/create-subscription', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe not configured' });
      }

      const { planId } = req.body;
      
      // Define plan pricing and limits
      const planConfig: Record<string, { amount: number; interval: 'month' | 'year'; analysisLimit: number; planType: string }> = {
        'pro-monthly': { amount: 1900, interval: 'month', analysisLimit: 500, planType: 'pro' },
        'pro-yearly': { amount: 19000, interval: 'year', analysisLimit: 500, planType: 'pro' },
        'enterprise-monthly': { amount: 9900, interval: 'month', analysisLimit: 10000, planType: 'enterprise' }
      };

      const config = planConfig[planId];
      if (!config) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId = req.user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: { userId: req.user.id.toString() }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeInfo(req.user.id, { stripeCustomerId });
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `TruthLens ${config.planType.charAt(0).toUpperCase() + config.planType.slice(1)} Plan`,
                description: `${config.analysisLimit} fact-checks per month`,
              },
              unit_amount: config.amount,
              recurring: {
                interval: config.interval,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/dashboard?success=true`,
        cancel_url: `${req.headers.origin}/subscribe?canceled=true`,
        metadata: {
          userId: req.user.id.toString(),
          planType: config.planType,
          analysisLimit: config.analysisLimit.toString(),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Create subscription route error:', error);
      res.status(500).json({ message: 'Subscription creation failed' });
    }
  });

  app.post('/api/user/subscription', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = subscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors 
        });
      }

      const { planType } = validation.data;
      
      // Define plan limits
      const planLimits = {
        free: 100,
        pro: 1000,
        enterprise: 10000
      };

      const analysisLimit = planLimits[planType as keyof typeof planLimits] || 100;
      
      let subscription = await storage.getUserSubscription(req.user.id);
      
      if (subscription) {
        subscription = await storage.updateSubscription(req.user.id, {
          planType,
          analysisLimit
        });
      } else {
        subscription = await storage.createSubscription(req.user.id, planType, analysisLimit);
      }

      res.json({ subscription });
    } catch (error) {
      console.error('Update subscription route error:', error);
      res.status(500).json({ message: 'Subscription update failed' });
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
