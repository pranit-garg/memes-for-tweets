'use client';

interface UsageCounterProps {
  remaining: number;
  isPremium: boolean;
}

export default function UsageCounter({
  remaining,
  isPremium,
}: UsageCounterProps) {
  if (isPremium) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Premium
      </div>
    );
  }

  const percentage = (remaining / 10) * 100;
  const isLow = remaining <= 3;

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className={isLow ? 'text-orange-600 font-medium' : 'text-gray-600'}>
          {remaining} free match{remaining !== 1 ? 'es' : ''} left
        </span>
        {isLow && remaining > 0 && (
          <a
            href="/upgrade"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Upgrade
          </a>
        )}
      </div>
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isLow ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
