'use client';

import { useState } from 'react';

interface TweetInputProps {
  onSubmit: (tweet: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function TweetInput({
  onSubmit,
  isLoading,
  disabled,
}: TweetInputProps) {
  const [tweet, setTweet] = useState('');
  const maxLength = 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tweet.trim() && !isLoading && !disabled) {
      onSubmit(tweet.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      {/* Rage box container */}
      <div className="rage-box p-1 bg-white">
        <div className="relative">
          {/* Label bar */}
          <div className="bg-gradient-to-r from-[#1E90FF] to-[#00CED1] px-3 py-2 border-b-4 border-black">
            <span className="impact-text text-white text-sm tracking-wide drop-shadow-md">
              📝 ENTER UR TWEET HERE 📝
            </span>
          </div>
          
          <textarea
            value={tweet}
            onChange={(e) => setTweet(e.target.value)}
            placeholder="paste ur tweet here lol..."
            maxLength={maxLength}
            disabled={disabled}
            className="w-full h-32 p-4 text-lg text-black bg-white
                       border-0 outline-none resize-none
                       disabled:bg-gray-200 disabled:cursor-not-allowed
                       placeholder:text-gray-400 placeholder:italic
                       focus:bg-[#FFFACD]
                       transition-colors"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue', cursive" }}
          />
          
          {/* Character counter - old school style */}
          <div className="absolute bottom-2 right-3 px-2 py-1 bg-black text-[#00FF00] text-xs font-mono">
            {tweet.length}/{maxLength}
          </div>
        </div>
      </div>

      {/* Big chunky submit button */}
      <button
        type="submit"
        disabled={!tweet.trim() || isLoading || disabled}
        className={`mt-4 w-full py-4 px-6 
                   impact-text text-xl tracking-wider
                   border-4 border-black
                   transition-all
                   ${!tweet.trim() || isLoading || disabled 
                     ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                     : 'bg-gradient-to-r from-[#FF4444] via-[#FF8C00] to-[#FFD700] text-white glossy-btn cursor-pointer'
                   }
                   flex items-center justify-center gap-3`}
      >
        {isLoading ? (
          <>
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <span>FINDING EPIC MEMES...</span>
            <span className="animate-pulse">🔍</span>
          </>
        ) : (
          <>
            <span>🎯</span>
            <span>MATCH MY TWEET</span>
            <span>🎯</span>
          </>
        )}
      </button>

      {/* Subtext */}
      <p className="text-center mt-3 text-sm text-white/70">
        ↑ click da button 4 epic memes ↑
      </p>
    </form>
  );
}
