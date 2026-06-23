import crypto from 'crypto';

const RESET_SECRET = process.env.RESET_SECRET || 'maintpro-reset-default-secret';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function sign(data: string) {
  return crypto.createHmac('sha256', RESET_SECRET).update(data).digest('hex');
}

export function generateResetToken(userId: string): string {
  const timestamp = Date.now();
  const payload = `${userId}|${timestamp}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}|${signature}`).toString('base64');
}

export function verifyResetToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, timestampStr, signature] = decoded.split('|');
    if (!userId || !timestampStr || !signature) return null;

    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > TOKEN_TTL_MS) return null;

    const expected = sign(`${userId}|${timestampStr}`);
    if (signature !== expected) return null;

    return { userId };
  } catch {
    return null;
  }
}
