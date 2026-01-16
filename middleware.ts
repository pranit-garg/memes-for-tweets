import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// TEMPORARY: Bypass paywall for testing
const BYPASS_PAYWALL = true;

export function middleware(request: NextRequest) {
  // TEMPORARY: Skip all paywall checks
  if (BYPASS_PAYWALL) {
    return NextResponse.next();
  }

  // Only check usage for the match-meme endpoint
  if (request.nextUrl.pathname === '/api/match-meme') {
    const usageCookie = request.cookies.get('meme-usage-count')?.value;
    const premiumCookie = request.cookies.get('meme-premium')?.value;

    const isPremium = premiumCookie === 'true';
    const usageCount = usageCookie ? parseInt(usageCookie, 10) : 0;
    const remaining = Math.max(0, 10 - usageCount);

    // Allow if premium or has remaining free uses
    if (isPremium || remaining > 0) {
      return NextResponse.next();
    }

    // Block if limit reached
    return NextResponse.json(
      {
        error: 'Free limit reached',
        message: 'You have used all 10 free memes. Upgrade to premium for unlimited access.',
        upgradeUrl: '/upgrade',
      },
      { status: 402 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/match-meme'],
};
