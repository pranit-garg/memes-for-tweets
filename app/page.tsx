'use client';

import { useState, useEffect } from 'react';
import TweetInput from '@/components/TweetInput';
import MemeGrid from '@/components/MemeGrid';
import MemeEditor from '@/components/MemeEditor';
import UsageCounter from '@/components/UsageCounter';
import UpgradeModal from '@/components/UpgradeModal';
import FeedbackButton from '@/components/FeedbackButton';
import { MemeMatch } from '@/lib/claude';

interface EnrichedMatch extends MemeMatch {
  templateUrl: string;
  width: number;
  height: number;
}

interface UsageState {
  remaining: number;
  isPremium: boolean;
}

export default function Home() {
  const [tweet, setTweet] = useState('');
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<EnrichedMatch | null>(null);
  const [previousIds, setPreviousIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [usage, setUsage] = useState<UsageState>({ remaining: 10, isPremium: false });

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_USAGE_LIMITS === 'true') {
      setUsage({ remaining: -1, isPremium: true });
      return;
    }

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const usageCount = parseInt(getCookie('meme-usage-count') || '0', 10);
    const isPremium = getCookie('meme-premium') === 'true';

    setUsage({
      remaining: Math.max(0, 10 - usageCount),
      isPremium,
    });
  }, []);

  const handleMatchMemes = async (tweetText: string, feedback?: string) => {
    setError('');
    setInfoMessage('');
    const loading = feedback ? setIsFeedbackLoading : setIsLoading;
    loading(true);

    try {
      const response = await fetch('/api/match-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweet: tweetText,
          feedback,
          previousIds: feedback ? previousIds : undefined,
        }),
      });

      const data = await response.json();

      if (response.status === 402) {
        setShowUpgrade(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to match memes');
      }

      if (feedback) {
        setPreviousIds([...previousIds, ...matches.map((m) => m.templateId)]);
      } else {
        setPreviousIds([]);
        setTweet(tweetText);
      }

      setMatches(data.matches);
      setSelectedMatch(null);

      if (data.message) {
        setInfoMessage(data.message);
      }

      if (!usage.isPremium) {
        setUsage((prev) => ({
          ...prev,
          remaining: Math.max(0, prev.remaining - 1),
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      loading(false);
    }
  };

  const handleSelectMatch = (match: EnrichedMatch) => {
    setSelectedMatch(match);
  };

  const handleBack = () => {
    setSelectedMatch(null);
  };

  const handleDownload = () => {
    console.log('Meme downloaded');
  };

  const handleFeedback = (feedback: string) => {
    handleMatchMemes(tweet, feedback);
  };

  const handleStartOver = () => {
    setTweet('');
    setMatches([]);
    setSelectedMatch(null);
    setPreviousIds([]);
    setError('');
    setInfoMessage('');
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleStartOver}
            className="flex items-center gap-2 group"
          >
            <span className="text-2xl">🎭</span>
            <span className="text-lg font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
              memes for tweets
            </span>
          </button>
          <UsageCounter remaining={usage.remaining} isPremium={usage.isPremium} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero - only show when no matches */}
        {matches.length === 0 && !selectedMatch && (
          <div className="text-center mb-10 fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Find the perfect meme
              <span className="text-[var(--accent)]">.</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-md mx-auto">
              Paste your tweet, get matched to the right template, download and post.
            </p>
          </div>
        )}

        {/* Tweet input */}
        {!selectedMatch && (
          <div className="mb-8 fade-in">
            <TweetInput
              onSubmit={(t) => handleMatchMemes(t)}
              isLoading={isLoading}
              disabled={!usage.isPremium && usage.remaining <= 0}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 card bg-red-500/10 border-red-500/30 text-red-400 text-center fade-in">
            {error}
          </div>
        )}

        {/* Info message */}
        {infoMessage && !selectedMatch && (
          <div className="max-w-2xl mx-auto mb-6 p-4 card bg-[var(--accent)]/10 border-[var(--accent)]/30 fade-in">
            <p className="text-sm text-[var(--text-secondary)]">{infoMessage}</p>
          </div>
        )}

        {/* Meme editor */}
        {selectedMatch && (
          <div className="fade-in">
            <MemeEditor
              match={selectedMatch}
              onDownload={handleDownload}
              onBack={handleBack}
            />
          </div>
        )}

        {/* Meme grid */}
        {!selectedMatch && matches.length > 0 && (
          <div className="space-y-6 fade-in">
            <MemeGrid
              matches={matches}
              onSelect={handleSelectMatch}
            />

            <div className="text-center pt-2">
              <FeedbackButton
                onFeedback={handleFeedback}
                isLoading={isFeedbackLoading}
              />
            </div>
          </div>
        )}

        {/* Paywall message */}
        {!usage.isPremium && usage.remaining <= 0 && matches.length === 0 && (
          <div className="text-center py-12 fade-in">
            <p className="text-[var(--text-secondary)] mb-4">
              You&apos;ve used your free matches.
            </p>
            <a
              href="/upgrade"
              className="inline-block py-3 px-6 btn-primary"
            >
              Upgrade for unlimited — $5/mo
            </a>
          </div>
        )}
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-[var(--border)] py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            100+ templates · AI-powered matching · Made for the timeline
          </p>
        </div>
      </footer>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
