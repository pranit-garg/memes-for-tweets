'use client';

import { useRef, useEffect, useState } from 'react';
import { MemeMatch } from '@/lib/claude';

interface EnrichedMatch extends MemeMatch {
  templateUrl: string;
  width: number;
  height: number;
}

interface MemeGridProps {
  matches: EnrichedMatch[];
  onSelect: (match: EnrichedMatch) => void;
  selectedId?: string;
}

// Component to render meme preview with text overlay
function MemePreview({ match }: { match: EnrichedMatch }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Set canvas size - square aspect for grid
      const size = 300;
      canvas.width = size;
      canvas.height = size;

      // Calculate scaling to fit image in square
      const scale = Math.min(size / img.width, size / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (size - scaledWidth) / 2;
      const offsetY = (size - scaledHeight) / 2;

      // Clear and fill background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, size, size);

      // Draw image centered
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Configure text style - SMALL font for thumbnails to not obscure image
      const fontSize = Math.max(10, Math.min(13, size / 24));
      ctx.font = `bold ${fontSize}px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif`;
      ctx.textAlign = 'center';

      const padding = 2; // Minimal padding - absolute edge
      const maxTextWidth = size - padding * 2;

      // Helper to wrap text - more aggressive for thumbnails
      const wrapText = (text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        return lines.slice(0, 2); // Max 2 lines for preview
      };

      // Helper to draw meme text with outline at ABSOLUTE edges
      const drawMemeText = (text: string, y: number, isTop: boolean) => {
        const lines = wrapText(text.toUpperCase(), maxTextWidth);
        const lineHeight = fontSize * 1.05;

        lines.forEach((line, index) => {
          const lineY = isTop
            ? y + index * lineHeight
            : y - (lines.length - 1 - index) * lineHeight;

          // Draw thick black outline
          ctx.strokeStyle = 'black';
          ctx.lineWidth = fontSize * 0.18;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          for (let i = 0; i < 3; i++) {
            ctx.strokeText(line, size / 2, lineY);
          }

          // Draw white fill
          ctx.fillStyle = 'white';
          ctx.fillText(line, size / 2, lineY);
        });
      };

      // Get text from textBoxes or fallback to top/bottom
      const topText = match.textBoxes?.[0]?.text || match.suggestedTopText || '';
      const bottomText = match.textBoxes?.[1]?.text || match.suggestedBottomText || '';

      // Draw top text at ABSOLUTE TOP - minimal offset from edge
      if (topText) {
        ctx.textBaseline = 'top';
        drawMemeText(topText, padding, true);
      }

      // Draw bottom text at ABSOLUTE BOTTOM
      if (bottomText) {
        ctx.textBaseline = 'bottom';
        drawMemeText(bottomText, size - padding, false);
      }

      setIsLoaded(true);
    };

    img.onerror = () => {
      // Draw placeholder on error
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Failed to load', 150, 150);
      setIsLoaded(true);
    };

    img.src = match.templateUrl;
  }, [match]);

  return (
    <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function MemeGrid({
  matches,
  onSelect,
  selectedId,
}: MemeGridProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="impact-text text-3xl text-[#FFD700] meme-shadow">
          🎉 PICK UR MEME 🎉
        </h2>
        <p className="text-white/70 text-sm mt-1">click one 2 customize it</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {matches.map((match, index) => (
          <button
            key={match.templateId}
            onClick={() => onSelect(match)}
            className={`rage-box card-hover p-0 overflow-hidden
                       ${selectedId === match.templateId ? 'ring-4 ring-[#FFD700]' : ''}`}
          >
            {/* Number badge */}
            <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-[#FF4444] border-2 border-black flex items-center justify-center">
              <span className="impact-text text-white text-lg">{index + 1}</span>
            </div>
            
            <MemePreview match={match} />

            {/* Info bar */}
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-3 border-t-4 border-black">
              <h3 className="font-bold text-[#FFD700] text-sm truncate mb-1">
                {match.templateName}
              </h3>
              <p className="text-xs text-white/60 line-clamp-2">
                {match.reasoning}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
