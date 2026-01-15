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

interface TextSettings {
  fontSize: number;
  yOffset: number; // 0-100, where 0 is at edge, 100 is toward center
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

// Draw meme-style text with thick outline
function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  maxWidth: number,
  isBottom: boolean
) {
  ctx.font = `bold ${fontSize}px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = isBottom ? 'bottom' : 'top';
  
  const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
  const lineHeight = fontSize * 1.1;
  
  // Calculate starting Y
  let startY = y;
  if (isBottom) {
    // For bottom text, we start from y and go up
    startY = y - (lines.length - 1) * lineHeight;
  }

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    
    // Draw black outline (multiple passes for thickness)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize * 0.15;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 4; i++) {
      ctx.strokeText(line, x, lineY);
    }

    // Draw white fill
    ctx.fillStyle = 'white';
    ctx.fillText(line, x, lineY);
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Text customization settings
  const [topSettings, setTopSettings] = useState<TextSettings>({
    fontSize: 50, // percentage of auto-calculated size
    yOffset: 0,   // 0 = at edge, higher = more toward center
  });
  const [bottomSettings, setBottomSettings] = useState<TextSettings>({
    fontSize: 50,
    yOffset: 0,
  });
  const [, setTextBoxes] = useState<TextBox[]>(
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

      // Calculate text sizing based on image dimensions
      const baseFontSize = Math.min(canvas.width / 10, canvas.height / 12);
      const padding = canvas.width * 0.03;
      const maxTextWidth = canvas.width - padding * 2;

      // Draw top text - positioned at the VERY TOP
      if (topText.trim()) {
        const fontSize = baseFontSize * (topSettings.fontSize / 50);
        const yPos = padding + (topSettings.yOffset / 100) * (canvas.height * 0.15);
        drawMemeText(ctx, topText, canvas.width / 2, yPos, fontSize, maxTextWidth, false);
      }

      // Draw bottom text - positioned at the VERY BOTTOM
      if (bottomText.trim()) {
        const fontSize = baseFontSize * (bottomSettings.fontSize / 50);
        const yPos = canvas.height - padding - (bottomSettings.yOffset / 100) * (canvas.height * 0.15);
        drawMemeText(ctx, bottomText, canvas.width / 2, yPos, fontSize, maxTextWidth, true);
      }
    };

    img.src = match.templateUrl;
  }, [match.templateUrl, topText, bottomText, topSettings, bottomSettings]);

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

        {/* Preview */}
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            className="max-w-full rounded-xl shadow-lg border border-gray-200"
          />
        </div>

        {/* Text inputs */}
        <div className="space-y-4 mb-4">
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

        {/* Advanced controls toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full mb-4 py-2 text-sm text-gray-600 hover:text-gray-800 
                     flex items-center justify-center gap-1 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showAdvanced ? 'Hide' : 'Show'} text controls
        </button>

        {/* Advanced controls */}
        {showAdvanced && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Top Text Size</label>
                <span className="text-xs text-gray-500">{topSettings.fontSize}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={topSettings.fontSize}
                onChange={(e) => setTopSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Top Text Position</label>
                <span className="text-xs text-gray-500">{topSettings.yOffset === 0 ? 'Edge' : `+${topSettings.yOffset}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={topSettings.yOffset}
                onChange={(e) => setTopSettings(prev => ({ ...prev, yOffset: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <hr className="border-gray-200" />

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Bottom Text Size</label>
                <span className="text-xs text-gray-500">{bottomSettings.fontSize}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={bottomSettings.fontSize}
                onChange={(e) => setBottomSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Bottom Text Position</label>
                <span className="text-xs text-gray-500">{bottomSettings.yOffset === 0 ? 'Edge' : `+${bottomSettings.yOffset}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={bottomSettings.yOffset}
                onChange={(e) => setBottomSettings(prev => ({ ...prev, yOffset: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        )}

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
