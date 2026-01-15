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
      <div className="relative">
        <textarea
          value={tweet}
          onChange={(e) => setTweet(e.target.value)}
          placeholder="What's your tweet about?"
          maxLength={maxLength}
          disabled={disabled}
          className="w-full h-32 p-4 text-lg text-black border-2 border-gray-200 rounded-xl
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                     outline-none resize-none transition-all
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     placeholder:text-gray-400"
        />
        <div className="absolute bottom-3 right-3 text-sm text-gray-400">
          {tweet.length}/{maxLength}
        </div>
      </div>

      <button
        type="submit"
        disabled={!tweet.trim() || isLoading || disabled}
        className="mt-4 w-full py-3 px-6 bg-blue-600 text-white font-semibold
                   rounded-xl hover:bg-blue-700 transition-colors
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
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
            Matching your vibe...
          </>
        ) : (
          'Match My Tweet'
        )}
      </button>
    </form>
  );
}
