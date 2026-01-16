'use client';

interface UsageCounterProps {
  remaining: number;
  isPremium: boolean;
}

export default function UsageCounter({ remaining, isPremium }: UsageCounterProps) {
  if (isPremium) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-full">
        <span className="text-[var(--accent)] text-xs font-medium">Pro</span>
      </div>
    );
  }

  const percentage = (remaining / 10) * 100;
  const isLow = remaining <= 3;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <span className={`text-xs ${isLow ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
          {remaining} left
        </span>
      </div>
      <div className="w-16 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all rounded-full ${
            isLow ? 'bg-[var(--accent)]' : 'bg-[var(--success)]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
