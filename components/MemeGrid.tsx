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
    <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-gray-100">
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Pick a meme
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matches.map((match) => (
          <button
            key={match.templateId}
            onClick={() => onSelect(match)}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.02]
                       ${
                         selectedId === match.templateId
                           ? 'border-blue-500 bg-blue-50 shadow-lg'
                           : 'border-gray-200 hover:border-blue-300'
                       }`}
          >
            <MemePreview match={match} />

            <div className="mt-3 space-y-1">
              <h3 className="font-semibold text-gray-800 text-sm truncate">
                {match.templateName}
              </h3>

              <p className="text-xs text-gray-500 line-clamp-2">
                {match.reasoning}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
