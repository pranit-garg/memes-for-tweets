import { cookies } from 'next/headers';

const USAGE_COOKIE = 'meme-usage-count';
const PREMIUM_COOKIE = 'meme-premium';
const FREE_LIMIT = 10;

export async function getUsageCount(): Promise<number> {
  const cookieStore = await cookies();
  const usage = cookieStore.get(USAGE_COOKIE);
  return usage ? parseInt(usage.value, 10) : 0;
}

export async function incrementUsage(): Promise<number> {
  const cookieStore = await cookies();
  const current = await getUsageCount();
  const newCount = current + 1;

  cookieStore.set(USAGE_COOKIE, newCount.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return newCount;
}

export async function hasRemainingFree(): Promise<boolean> {
  const count = await getUsageCount();
  return count < FREE_LIMIT;
}

export async function isPremium(): Promise<boolean> {
  const cookieStore = await cookies();
  const premium = cookieStore.get(PREMIUM_COOKIE);
  return premium?.value === 'true';
}

export async function setPremium(value: boolean): Promise<void> {
  const cookieStore = await cookies();
  if (value) {
    cookieStore.set(PREMIUM_COOKIE, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } else {
    cookieStore.delete(PREMIUM_COOKIE);
  }
}

export async function canGenerate(): Promise<{
  allowed: boolean;
  remaining: number;
  isPremium: boolean;
}> {
  const premium = await isPremium();
  if (premium) {
    return { allowed: true, remaining: -1, isPremium: true };
  }

  const count = await getUsageCount();
  const remaining = Math.max(0, FREE_LIMIT - count);

  return {
    allowed: remaining > 0,
    remaining,
    isPremium: false,
  };
}

export function getRemainingFromCookie(cookieValue: string | undefined): number {
  if (!cookieValue) return FREE_LIMIT;
  const count = parseInt(cookieValue, 10);
  return Math.max(0, FREE_LIMIT - count);
}

export function isPremiumFromCookie(cookieValue: string | undefined): boolean {
  return cookieValue === 'true';
}
