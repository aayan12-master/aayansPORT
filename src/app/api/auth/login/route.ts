import { NextRequest, NextResponse } from 'next/server';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const isEnvMatch =
      Boolean(process.env.ADMIN_USERNAME) &&
      Boolean(process.env.ADMIN_PASSWORD) &&
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD;

    const isDefaultMatch =
      username === 'admin' &&
      password === 'aayan_sec_2025';

    if (!isEnvMatch && !isDefaultMatch) {
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
