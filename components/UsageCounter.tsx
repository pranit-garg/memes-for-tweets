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
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#9932CC] to-[#FF69B4] text-white text-sm font-bold border-3 border-black">
        <span className="animate-pulse">⭐</span>
        <span className="impact-text tracking-wide">PREMIUM</span>
        <span className="animate-pulse">⭐</span>
      </div>
    );
  }

  const percentage = (remaining / 10) * 100;
  const isLow = remaining <= 3;

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-bold ${isLow ? 'text-[#FF4444]' : 'text-white'}`}>
          {remaining} free match{remaining !== 1 ? 'es' : ''} left
        </span>
        {isLow && remaining > 0 && (
          <a
            href="/upgrade"
            className="text-[#FFD700] hover:text-white font-bold animate-pulse"
          >
            [UPGRADE]
          </a>
        )}
      </div>
      <div className="w-32 h-3 bg-black border-2 border-white overflow-hidden">
        <div
          className={`h-full transition-all ${
            isLow 
              ? 'bg-gradient-to-r from-[#FF4444] to-[#FF8C00]' 
              : 'bg-gradient-to-r from-[#00FF00] to-[#00CED1]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
