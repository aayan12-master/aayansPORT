import { NextRequest, NextResponse } from 'next/server';
import { createContactSubmission } from '@/lib/cms';

// In-memory rate limiting map (IP -> timestamps array)
// Note: Per-instance memory limit; see architecture docs for serverless distribution considerations.
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // max 5 submissions per 15 minutes

  // Periodic pruning if map grows large to prevent memory leaks in persistent instances
  if (rateLimitMap.size > 500) {
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const active = timestamps.filter(t => now - t < windowMs);
      if (active.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, active);
      }
    }
  }

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
    const rawForwarded = req.headers.get('x-forwarded-for');
    const clientIp = rawForwarded ? rawForwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');

    if (isRateLimited(clientIp)) {
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

    await createContactSubmission({
      sender_name: name.trim(),
      sender_email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      ip_address: clientIp,
    });

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
