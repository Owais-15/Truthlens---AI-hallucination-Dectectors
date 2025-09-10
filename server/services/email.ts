import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Email service health monitoring
let emailServiceStatus = {
  isHealthy: false,
  lastCheck: new Date(),
  lastError: null as string | null,
  totalSent: 0,
  totalFailed: 0
};

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[EMAIL] SendGrid API key not configured - email verification disabled');
    return false;
  }

  try {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@truthlens.app',
      subject: 'Verify Your TruthLens Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Welcome to TruthLens!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for creating your TruthLens account. To complete your registration and start fact-checking AI-generated content, please verify your email address.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
          
          <p>This link will expire in 24 hours for security reasons.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't create this account, please ignore this email.
            <br>
            <strong>TruthLens</strong> - AI-Powered Fact Checking
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    emailServiceStatus.totalSent++;
    console.log(`[EMAIL] Verification email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send verification email:', {
      error: error.message,
      code: error.code,
      response: error.response?.body,
      details: error.response?.body?.errors
    });
    
    // Log specific SendGrid error details for debugging
    if (error.response?.body?.errors) {
      error.response.body.errors.forEach((err: any, index: number) => {
        console.error(`[EMAIL] SendGrid Error ${index + 1}:`, err);
      });
    }
    
    emailServiceStatus.totalFailed++;
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[EMAIL] SendGrid API key not configured - password reset emails disabled');
    return false;
  }

  try {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@truthlens.app',
      subject: 'Reset Your TruthLens Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your TruthLens account password. If you made this request, click the button below to create a new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          
          <p><strong>If you didn't request this password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>TruthLens</strong> - AI-Powered Fact Checking
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    emailServiceStatus.totalSent++;
    console.log(`[EMAIL] Password reset email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send password reset email:', {
      error: error.message,
      code: error.code,
      response: error.response?.body,
      details: error.response?.body?.errors
    });
    
    // Log specific SendGrid error details for debugging
    if (error.response?.body?.errors) {
      error.response.body.errors.forEach((err: any, index: number) => {
        console.error(`[EMAIL] SendGrid Error ${index + 1}:`, err);
      });
    }
    
    emailServiceStatus.totalFailed++;
    return false;
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

// Email service health check and validation
export async function validateEmailService(): Promise<{ isValid: boolean; error?: string; details?: any }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return { isValid: false, error: 'SENDGRID_API_KEY not configured' };
    }

    if (!process.env.FROM_EMAIL) {
      return { isValid: false, error: 'FROM_EMAIL not configured - set this to your verified sender email' };
    }

    // Test SendGrid API key validity
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        isValid: false, 
        error: `SendGrid API key validation failed: ${response.status}`, 
        details: errorData 
      };
    }

    emailServiceStatus.isHealthy = true;
    emailServiceStatus.lastCheck = new Date();
    emailServiceStatus.lastError = null;

    return { isValid: true };
  } catch (error: any) {
    emailServiceStatus.isHealthy = false;
    emailServiceStatus.lastError = error.message;
    emailServiceStatus.lastCheck = new Date();
    
    return { 
      isValid: false, 
      error: `Email service validation failed: ${error.message}`,
      details: error
    };
  }
}

// Get email service status and metrics
export function getEmailServiceStatus() {
  return {
    ...emailServiceStatus,
    successRate: emailServiceStatus.totalSent > 0 
      ? ((emailServiceStatus.totalSent - emailServiceStatus.totalFailed) / emailServiceStatus.totalSent * 100).toFixed(2) + '%'
      : 'N/A',
    configuration: {
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      hasFromEmail: !!process.env.FROM_EMAIL,
      fromEmail: process.env.FROM_EMAIL || 'Not configured',
      baseUrl: process.env.BASE_URL || 'http://localhost:5000'
    }
  };
}

// Send test email for deployment verification
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const validation = await validateEmailService();
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const msg = {
      to: toEmail,
      from: process.env.FROM_EMAIL || 'noreply@truthlens.app',
      subject: 'TruthLens Email Service Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Email Service Test</h2>
          <p>This is a test email to verify that your TruthLens email service is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>TruthLens</strong> - Email Service Test
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    emailServiceStatus.totalSent++;
    console.log(`[EMAIL] Test email sent successfully to ${toEmail}`);
    return { success: true };
  } catch (error: any) {
    emailServiceStatus.totalFailed++;
    console.error('[EMAIL] Test email failed:', {
      error: error.message,
      code: error.code,
      response: error.response?.body
    });
    return { success: false, error: error.message };
  }
}