import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// In-memory rate limiting map (IP -> timestamps array)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // max 5 submissions per 15 minutes

  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait 15 minutes before sending another inquiry.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, subject, message, honeypot } = body;

    // Spam honeypot detection
    if (honeypot) {
      // Silently discard bot submissions
      return NextResponse.json({ success: true, message: 'Message recorded.' });
    }

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Valid name is required (2-100 characters).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.length > 150) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 2 || subject.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Subject is required (2-200 characters).' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.length > 3000) {
      return NextResponse.json(
        { success: false, error: 'Message must be between 10 and 3,000 characters.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO contact_submissions (sender_name, sender_email, subject, message, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim(), ip);

    return NextResponse.json({
      success: true,
      message: 'Transmission received. The security dossier has recorded your message.',
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process transmission. Please try again later.' },
      { status: 500 }
    );
  }
}
