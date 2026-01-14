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

  // Load usage from cookie on mount
  useEffect(() => {
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

      // Track previous IDs for feedback
      if (feedback) {
        setPreviousIds([...previousIds, ...matches.map((m) => m.templateId)]);
      } else {
        setPreviousIds([]);
        setTweet(tweetText);
      }

      setMatches(data.matches);
      setSelectedMatch(null);

      // Show info message if tweet was modified
      if (data.message) {
        setInfoMessage(data.message);
      }

      // Update usage locally
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
    // Could track downloads here
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleStartOver}
            className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
          >
            Memes for Tweets
          </button>
          <UsageCounter remaining={usage.remaining} isPremium={usage.isPremium} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero section - only show when no matches */}
        {matches.length === 0 && !selectedMatch && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              Turn your tweets into memes
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Paste your tweet and let AI find the perfect meme template.
              Edit the text, download, and share.
            </p>
          </div>
        )}

        {/* Tweet input */}
        {!selectedMatch && (
          <div className="mb-8">
            <TweetInput
              onSubmit={(t) => handleMatchMemes(t)}
              isLoading={isLoading}
              disabled={!usage.isPremium && usage.remaining <= 0}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Info message (when tweet was modified) */}
        {infoMessage && !selectedMatch && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm">{infoMessage}</p>
            </div>
          </div>
        )}

        {/* Meme editor */}
        {selectedMatch && (
          <MemeEditor
            match={selectedMatch}
            onDownload={handleDownload}
            onBack={handleBack}
          />
        )}

        {/* Meme grid */}
        {!selectedMatch && matches.length > 0 && (
          <div className="space-y-6">
            <MemeGrid
              matches={matches}
              onSelect={handleSelectMatch}
            />

            <div className="text-center">
              <FeedbackButton
                onFeedback={handleFeedback}
                isLoading={isFeedbackLoading}
              />
            </div>
          </div>
        )}

        {/* Paywall reached message */}
        {!usage.isPremium && usage.remaining <= 0 && matches.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You&apos;ve used all your free memes. Upgrade to continue creating.
            </p>
            <a
              href="/upgrade"
              className="inline-block py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500
                         text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Upgrade to Premium
            </a>
          </div>
        )}
      </main>

      {/* Upgrade modal */}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
