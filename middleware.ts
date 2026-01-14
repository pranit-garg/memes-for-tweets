import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRemainingFromCookie, isPremiumFromCookie } from '@/lib/usage';

const FREE_LIMIT = 10;

export function middleware(request: NextRequest) {
  // Only check usage for the match-meme endpoint
  if (request.nextUrl.pathname === '/api/match-meme') {
    const usageCookie = request.cookies.get('meme-usage-count')?.value;
    const premiumCookie = request.cookies.get('meme-premium')?.value;

    const isPremium = isPremiumFromCookie(premiumCookie);
    const remaining = getRemainingFromCookie(usageCookie);

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
