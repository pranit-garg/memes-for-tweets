'use client';

import { useState } from 'react';

interface FeedbackButtonProps {
  onFeedback: (feedback: string) => void;
  isLoading: boolean;
}

const feedbackOptions = [
  { id: 'literal', label: 'Too literal', description: 'I want something more clever' },
  { id: 'tone', label: 'Wrong tone', description: 'The vibe is off' },
  { id: 'obscure', label: 'Too obscure', description: 'I want more recognizable memes' },
  { id: 'different', label: 'Just different', description: 'Show me other options' },
];

export default function FeedbackButton({
  onFeedback,
  isLoading,
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: typeof feedbackOptions[0]) => {
    onFeedback(option.description);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="text-gray-500 hover:text-gray-700 text-sm font-medium
                   flex items-center gap-1 disabled:opacity-50"
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
            Finding more...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Not quite right? Try again
          </>
        )}
      </button>

      {isOpen && !isLoading && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-10 w-64">
          <p className="text-xs text-gray-500 px-2 py-1 mb-1">
            What&apos;s wrong with these?
          </p>
          {feedbackOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg
                       transition-colors"
            >
              <span className="font-medium text-gray-800 text-sm">
                {option.label}
              </span>
              <span className="text-gray-500 text-xs block">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
