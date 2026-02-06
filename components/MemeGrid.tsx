'use client';

import { useRef, useEffect, useState } from 'react';
import { MemeMatch } from '@/lib/claude';

interface EnrichedMatch extends MemeMatch {
  templateUrl: string;
  width: number;
  height: number;
  boxCount: number;
}

interface MemeGridProps {
  matches: EnrichedMatch[];
  onSelect: (match: EnrichedMatch) => void;
  selectedId?: string;
}

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
      const size = 300;
      canvas.width = size;
      canvas.height = size;

      const scale = Math.min(size / img.width, size / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (size - scaledWidth) / 2;
      const offsetY = (size - scaledHeight) / 2;

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      const padding = 2;
      const maxTextWidth = size - padding * 2;

      const wrapText = (text: string, maxWidth: number, maxLines: number = 2): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines.slice(0, maxLines);
      };

      const drawTextAt = (text: string, centerY: number, fontSize: number) => {
        ctx.font = `bold ${fontSize}px Impact, 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = wrapText(text.toUpperCase(), maxTextWidth, 2);
        const lineHeight = fontSize * 1.1;
        const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
          const lineY = startY + index * lineHeight;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = fontSize * 0.18;
          ctx.lineJoin = 'round';
          for (let i = 0; i < 3; i++) {
            ctx.strokeText(line, size / 2, lineY);
          }
          ctx.fillStyle = 'white';
          ctx.fillText(line, size / 2, lineY);
        });
      };

      const isMultiPanel = match.textBoxes.length > 2 || match.format === 'multi-panel';

      if (isMultiPanel) {
        // Multi-panel: distribute text vertically across the canvas
        const panelCount = match.textBoxes.length;
        const bandHeight = (size - padding * 2) / panelCount;
        const fontSize = Math.max(8, Math.min(11, size / (panelCount * 8)));

        match.textBoxes.forEach((tb, i) => {
          if (tb.text) {
            const centerY = padding + bandHeight * i + bandHeight / 2;
            drawTextAt(tb.text, centerY, fontSize);
          }
        });
      } else {
        // Standard top/bottom layout
        const fontSize = Math.max(10, Math.min(13, size / 24));
        const topText = match.textBoxes?.[0]?.text || match.suggestedTopText || '';
        const bottomText = match.textBoxes?.[1]?.text || match.suggestedBottomText || '';

        if (topText) {
          drawTextAt(topText, padding + fontSize, fontSize);
        }
        if (bottomText) {
          drawTextAt(bottomText, size - padding - fontSize, fontSize);
        }
      }

      setIsLoaded(true);
    };

    img.onerror = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Failed to load', 150, 150);
      setIsLoaded(true);
    };

    img.src = match.templateUrl;
  }, [match]);

  return (
    <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
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
  if (matches.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-lg font-medium text-[var(--text-secondary)] mb-4 text-center">
        Pick a template
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matches.map((match) => (
          <button
            key={match.templateId}
            onClick={() => onSelect(match)}
            className={`card p-0 overflow-hidden text-left transition-all
                       hover:border-[var(--accent)]/50 hover:scale-[1.02]
                       ${selectedId === match.templateId ? 'ring-2 ring-[var(--accent)]' : ''}`}
          >
            <MemePreview match={match} />

            <div className="p-3 border-t border-[var(--border)]">
              <h3 className="font-medium text-white text-sm truncate">
                {match.templateName}
              </h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">
                {match.reasoning}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
