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
      <div className="card p-1">
        <textarea
          value={tweet}
          onChange={(e) => setTweet(e.target.value)}
          placeholder="Paste your tweet here..."
          maxLength={maxLength}
          disabled={disabled}
          className="w-full h-28 p-4 text-base bg-transparent
                     outline-none resize-none
                     disabled:opacity-50 disabled:cursor-not-allowed
                     placeholder:text-[var(--text-muted)]"
        />
        
        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--text-muted)]">
            {tweet.length}/{maxLength}
          </span>
          
          <button
            type="submit"
            disabled={!tweet.trim() || isLoading || disabled}
            className="py-2 px-5 btn-primary text-sm
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Matching...</span>
              </>
            ) : (
              <span>Match my tweet</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
