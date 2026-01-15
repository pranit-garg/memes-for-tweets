'use client';

import { useState } from 'react';

interface FeedbackButtonProps {
  onFeedback: (feedback: string) => void;
  isLoading: boolean;
}

const feedbackOptions = [
  { id: 'literal', label: '🤔 Too literal', description: 'I want something more clever' },
  { id: 'tone', label: '😐 Wrong vibe', description: 'The tone is off' },
  { id: 'obscure', label: '❓ Too obscure', description: 'I want more recognizable memes' },
  { id: 'different', label: '🔄 Just different', description: 'Show me other options' },
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
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="text-[#FFD700] hover:text-white text-sm font-bold
                   flex items-center gap-2 disabled:opacity-50 transition-colors"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            <span>FINDING MORE MEMES...</span>
          </>
        ) : (
          <>
            <span>🔄</span>
            <span>NOT QUITE RIGHT? TRY AGAIN</span>
          </>
        )}
      </button>

      {isOpen && !isLoading && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 rage-box bg-white p-0 z-10 w-72">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF4444] to-[#FF8C00] px-3 py-2 border-b-4 border-black">
            <p className="text-white font-bold text-sm text-center">
              😤 WHATS WRONG? 😤
            </p>
          </div>
          
          {/* Options */}
          <div className="p-2">
            {feedbackOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className="w-full text-left px-3 py-3 hover:bg-[#FFFACD] 
                         transition-colors border-b-2 border-dashed border-gray-200 last:border-0"
              >
                <span className="font-bold text-black text-sm block">
                  {option.label}
                </span>
                <span className="text-gray-600 text-xs">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
