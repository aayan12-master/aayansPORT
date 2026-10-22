import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_SECRET = process.env.ADMIN_SECRET || 'aayan_sec_researcher_auth_token_secret_key_2025';
const COOKIE_NAME = 'aayan_admin_session';

export function signToken(payload: { username: string; timestamp: number }): string {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64');
}

export function verifyToken(token: string): { username: string; timestamp: number } | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const { data, signature } = JSON.parse(raw);
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
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

export { COOKIE_NAME };
