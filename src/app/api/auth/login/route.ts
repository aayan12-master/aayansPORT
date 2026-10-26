import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;
    const envSecret = process.env.ADMIN_SECRET || process.env.ADMIN_JWT_SECRET;

    // Fail securely if server environment variables are not configured
    if (!envUser || !envPass || !envSecret) {
      console.error('[Auth] Server authentication is unconfigured: ADMIN_USERNAME, ADMIN_PASSWORD, or ADMIN_SECRET missing.');
      return NextResponse.json(
        { success: false, error: 'Authentication service is misconfigured' },
        { status: 500 }
      );
    }

    const bufUser = Buffer.from(username);
    const bufEnvUser = Buffer.from(envUser);
    const bufPass = Buffer.from(password);
    const bufEnvPass = Buffer.from(envPass);

    const userMatch =
      bufUser.length === bufEnvUser.length &&
      crypto.timingSafeEqual(bufUser, bufEnvUser);

    const passMatch =
      bufPass.length === bufEnvPass.length &&
      crypto.timingSafeEqual(bufPass, bufEnvPass);

    if (!userMatch || !passMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ username, timestamp: Date.now() });

    const response = NextResponse.json({
      success: true,
      user: { username },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

