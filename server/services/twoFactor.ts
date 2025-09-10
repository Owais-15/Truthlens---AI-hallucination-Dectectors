import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export async function generateTwoFactorSecret(userEmail: string): Promise<TwoFactorSetup> {
  const secret = speakeasy.generateSecret({
    name: `TruthLens (${userEmail})`,
    issuer: 'TruthLens',
    length: 32,
  });

  try {
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    
    return {
      secret: secret.base32 || '',
      qrCodeUrl,
      manualEntryKey: secret.base32 || '',
    };
  } catch (error) {
    console.error('[2FA] Failed to generate QR code:', error);
    throw new Error('Failed to generate 2FA setup');
  }
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 steps before/after for clock skew
    });
    
    return verified;
  } catch (error) {
    console.error('[2FA] Token verification failed:', error);
    return false;
  }
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character backup codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

export function isValidBackupCode(userBackupCodes: string[], inputCode: string): boolean {
  const normalizedInput = inputCode.toUpperCase().replace(/\s/g, '');
  return userBackupCodes.includes(normalizedInput);
}

export function removeUsedBackupCode(userBackupCodes: string[], usedCode: string): string[] {
  const normalizedUsed = usedCode.toUpperCase().replace(/\s/g, '');
  return userBackupCodes.filter(code => code !== normalizedUsed);
}