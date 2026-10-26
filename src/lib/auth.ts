import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'aayan_admin_session';

export function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    return null;
  }
  return secret.trim();
}

export function signToken(payload: { username: string; timestamp: number }): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('Authentication secret is not configured on the server');
  }
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64');
}

export function verifyToken(token: string): { username: string; timestamp: number } | null {
  try {
    const secret = getSessionSecret();
    if (!secret) return null;

    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const { data, signature } = JSON.parse(raw);
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      const parsed = JSON.parse(data);
      // Valid for 7 days
      if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  const verified = verifyToken(sessionCookie.value);
  if (!verified) return null;
  return { username: verified.username };
}

export function hashPassword(password: string): string {
  const salt = process.env.ADMIN_SALT || 'aayan_sec_salt_2025';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export { COOKIE_NAME };
