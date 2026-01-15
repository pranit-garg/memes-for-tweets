'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MemeMatch, TextBox } from '@/lib/claude';

interface EnrichedMatch extends MemeMatch {
  templateUrl: string;
  width: number;
  height: number;
}

interface MemeEditorProps {
  match: EnrichedMatch;
  onDownload: () => void;
  onBack: () => void;
}

// Dynamically calculate optimal font size to fit text
function calculateOptimalFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  minSize: number,
  maxSize: number
): { fontSize: number; lines: string[] } {
  let fontSize = maxSize;
  let lines: string[] = [];

  while (fontSize >= minSize) {
    ctx.font = `bold ${fontSize}px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    const totalHeight = lines.length * fontSize * 1.15;

    if (totalHeight <= maxHeight && lines.every(line => ctx.measureText(line).width <= maxWidth)) {
      break;
    }
    fontSize -= 2;
  }

  return { fontSize: Math.max(fontSize, minSize), lines };
}

// Wrap text to fit within maxWidth
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
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

  return lines;
}

// Draw meme-style text with thick outline and shadow
function drawMemeText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  startY: number,
  fontSize: number,
  isBottom: boolean
) {
  const lineHeight = fontSize * 1.15;
  
  // Calculate actual starting Y for bottom text (work upward)
  const actualStartY = isBottom
    ? startY - (lines.length - 1) * lineHeight
    : startY;

  lines.forEach((line, index) => {
    const y = actualStartY + index * lineHeight;
    const text = line.toUpperCase();

    // Add subtle shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw thick black outline
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize * 0.12;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 2;

    // Draw stroke multiple times for extra thickness
    for (let i = 0; i < 3; i++) {
      ctx.strokeText(text, x, y);
    }

    // Reset shadow for fill
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw white fill
    ctx.fillStyle = 'white';
    ctx.fillText(text, x, y);
  });
}

export default function MemeEditor({
  match,
  onDownload,
  onBack,
}: MemeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize text from textBoxes or fallback to top/bottom
  const initialTopText = match.textBoxes?.[0]?.text || match.suggestedTopText || '';
  const initialBottomText = match.textBoxes?.[1]?.text || match.suggestedBottomText || '';
  
  const [topText, setTopText] = useState(initialTopText);
  const [bottomText, setBottomText] = useState(initialBottomText);
  const [isDownloading, setIsDownloading] = useState(false);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>(
    match.textBoxes || [
      { position: 'top', text: initialTopText },
      { position: 'bottom', text: initialBottomText },
    ]
  );

  // Update textBoxes when top/bottom text changes
  useEffect(() => {
    setTextBoxes(prev => {
      const newBoxes = [...prev];
      if (newBoxes[0]) newBoxes[0] = { ...newBoxes[0], text: topText };
      if (newBoxes[1]) newBoxes[1] = { ...newBoxes[1], text: bottomText };
      return newBoxes;
    });
  }, [topText, bottomText]);

  const renderMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Set canvas size to match image (max 600px width for quality)
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Text rendering settings
      ctx.textAlign = 'center';
      
      const padding = canvas.width * 0.04;
      const maxTextWidth = canvas.width - padding * 2;
      
      // Calculate available height for each text area (top 25%, bottom 25%)
      const textAreaHeight = canvas.height * 0.22;
      const minFontSize = Math.max(16, canvas.width / 25);
      const maxFontSize = Math.max(28, canvas.width / 8);

      // Draw top text
      if (topText.trim()) {
        ctx.textBaseline = 'top';
        const { fontSize, lines } = calculateOptimalFontSize(
          ctx, topText, maxTextWidth, textAreaHeight, minFontSize, maxFontSize
        );
        ctx.font = `bold ${fontSize}px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif`;
        
        const topY = padding + fontSize * 0.1;
        drawMemeText(ctx, lines, canvas.width / 2, topY, fontSize, false);
      }

      // Draw bottom text
      if (bottomText.trim()) {
        ctx.textBaseline = 'bottom';
        const { fontSize, lines } = calculateOptimalFontSize(
          ctx, bottomText, maxTextWidth, textAreaHeight, minFontSize, maxFontSize
        );
        ctx.font = `bold ${fontSize}px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif`;
        
        const bottomY = canvas.height - padding - fontSize * 0.1;
        drawMemeText(ctx, lines, canvas.width / 2, bottomY, fontSize, true);
      }
    };

    img.src = match.templateUrl;
  }, [match.templateUrl, topText, bottomText]);

  useEffect(() => {
    renderMeme();
  }, [renderMeme]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDownloading(true);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `meme-${match.templateId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      onDownload();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleShareToTwitter = () => {
    const tweetText = encodeURIComponent(
      `Made this meme in 10 seconds\n\nmemes-for-tweets.vercel.app`
    );
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to memes
      </button>

      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">
          Edit your meme
        </h2>
        <p className="text-sm text-gray-500 mb-5 text-center">
          {match.templateName}
        </p>

        {/* Preview first, inputs below */}
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            className="max-w-full rounded-xl shadow-lg border border-gray-200"
          />
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Top Text
            </label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Enter top text..."
              className="w-full p-3 text-black border border-gray-200 rounded-xl
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                       outline-none transition-all placeholder:text-gray-400
                       font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Bottom Text
            </label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="Enter bottom text..."
              className="w-full p-3 text-black border border-gray-200 rounded-xl
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                       outline-none transition-all placeholder:text-gray-400
                       font-medium"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <button
            onClick={handleCopyToClipboard}
            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-semibold
                       rounded-xl hover:bg-gray-200 transition-colors
                       flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600
                       text-white font-semibold rounded-xl
                       hover:from-green-600 hover:to-emerald-700 transition-all
                       disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleShareToTwitter}
          className="w-full py-3 px-6 bg-black text-white font-semibold
                     rounded-xl hover:bg-gray-800 transition-colors
                     flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share to X
        </button>
      </div>
    </div>
  );
}
