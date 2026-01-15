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
      {/* Header - Early web forum style */}
      <header className="border-b-4 border-black bg-gradient-to-r from-[#FFD700] via-[#FF8C00] to-[#FF4444] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleStartOver}
            className="flex items-center gap-2 group"
          >
            <span className="text-3xl">🔥</span>
            <span className="impact-text text-2xl text-black meme-shadow drop-shadow-lg">
              Memes 4 Tweets
            </span>
            <span className="text-3xl">🔥</span>
          </button>
          <UsageCounter remaining={usage.remaining} isPremium={usage.isPremium} />
        </div>
      </header>

      {/* Marquee banner - peak 2008 */}
      <div className="bg-black text-[#00FF00] py-1 overflow-hidden border-b-2 border-[#00FF00]">
        <div className="scroll-text whitespace-nowrap font-bold">
          ⭐ WELCOME TO THE MEME ZONE ⭐ 100+ EPIC TEMPLATES ⭐ MAKE YOUR TWEETS GO VIRAL ⭐ NO DOWNLOAD REQUIRED ⭐ FREE TO USE ⭐ MUCH WOW ⭐ VERY MEME ⭐ SO DANK ⭐
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero section - only show when no matches */}
        {matches.length === 0 && !selectedMatch && (
          <div className="text-center mb-8">
            {/* Retro badge */}
            <div className="inline-block mb-4 px-4 py-2 bg-[#FF4444] border-4 border-black transform -rotate-2">
              <span className="impact-text text-white text-sm tracking-wider">★ NOW WITH AI POWER ★</span>
            </div>
            
            <h1 className="impact-text text-5xl md:text-6xl text-[#FFD700] meme-shadow mb-4 leading-tight">
              FIND THE PERFECT<br />
              <span className="rainbow-text">MEME</span> IN SECONDS
            </h1>
            
            <p className="text-xl text-white/90 max-w-xl mx-auto mb-2">
              Paste ur tweet. Get matched to epic memes. Download. Post. Profit???
            </p>
            
            <div className="flex justify-center gap-4 text-3xl my-4">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>😂</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🤣</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>💀</span>
              <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>🔥</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>👌</span>
            </div>
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
          <div className="max-w-2xl mx-auto mb-6 rage-box p-4 text-red-600 text-center">
            <span className="text-2xl mr-2">❌</span>
            {error}
            <span className="text-2xl ml-2">❌</span>
          </div>
        )}

        {/* Info message (when tweet was modified) */}
        {infoMessage && !selectedMatch && (
          <div className="max-w-2xl mx-auto mb-6 rage-box p-4 bg-[#FFFACD]">
            <div className="flex items-center gap-3 text-black">
              <span className="text-2xl">⚠️</span>
              <p className="font-bold">{infoMessage}</p>
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
            <div className="rage-box inline-block p-6 bg-white">
              <p className="text-black text-lg mb-4 font-bold">
                😱 U USED ALL UR FREE MEMES 😱
              </p>
              <p className="text-gray-700 mb-4">
                Your next viral meme is waiting...
              </p>
              <a
                href="/upgrade"
                className="inline-block py-3 px-6 bg-gradient-to-r from-[#9932CC] to-[#FF69B4]
                           text-white font-bold rounded-none border-4 border-black
                           glossy-btn impact-text tracking-wide"
              >
                🌟 UNLOCK UNLIMITED 🌟
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer - visitor counter vibes */}
      <footer className="border-t-4 border-black bg-gradient-to-r from-[#1a1a2e] to-[#16213e] py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-[#00FF00] text-sm mb-2">
            🌐 You are visitor #
            <span className="font-bold text-[#FFD700]">
              {Math.floor(Math.random() * 900000 + 100000).toLocaleString()}
            </span>
            🌐
          </p>
          <p className="text-gray-400 text-xs">
            Made with 💖 and rage comics energy © 2024
          </p>
          <div className="mt-2 flex justify-center gap-2">
            <span className="px-2 py-1 bg-[#FF4444] text-white text-xs border border-black">BEST VIEWED IN NETSCAPE</span>
            <span className="px-2 py-1 bg-[#1E90FF] text-white text-xs border border-black">OPTIMIZED FOR 800x600</span>
          </div>
        </div>
      </footer>

      {/* Upgrade modal */}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
