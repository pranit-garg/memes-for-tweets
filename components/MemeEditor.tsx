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
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Text customization settings - default to smaller text that doesn't cover image
  const [topSettings, setTopSettings] = useState<TextSettings>({
    fontSize: 40, // percentage of auto-calculated size (smaller default)
    yOffset: 0,   // 0 = at edge, higher = more toward center
  });
  const [bottomSettings, setBottomSettings] = useState<TextSettings>({
    fontSize: 40,
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

      // Calculate text sizing - SMALLER to not cover image content
      // Base size is ~1/14 of width, user can scale from 20% to 100% of that
      const baseFontSize = Math.min(canvas.width / 14, canvas.height / 16);
      const padding = canvas.width * 0.02; // Minimal padding - text at absolute edge
      const maxTextWidth = canvas.width - padding * 2;

      // Draw top text - at the ABSOLUTE TOP EDGE
      if (topText.trim()) {
        const fontSize = baseFontSize * (topSettings.fontSize / 50);
        // yOffset moves text DOWN from the top edge (toward center)
        const yPos = padding + (topSettings.yOffset / 100) * (canvas.height * 0.2);
        drawMemeText(ctx, topText, canvas.width / 2, yPos, fontSize, maxTextWidth, false);
      }

      // Draw bottom text - at the ABSOLUTE BOTTOM EDGE
      if (bottomText.trim()) {
        const fontSize = baseFontSize * (bottomSettings.fontSize / 50);
        // yOffset moves text UP from the bottom edge (toward center)
        const yPos = canvas.height - padding - (bottomSettings.yOffset / 100) * (canvas.height * 0.2);
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
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleShareToTwitter = () => {
    const tweetText = encodeURIComponent(
      `Made this meme in 10 seconds 🔥\n\nmemes-for-tweets.vercel.app`
    );
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 text-[#FFD700] hover:text-white flex items-center gap-2 font-bold transition-colors"
      >
        <span className="text-xl">←</span>
        <span>BACK 2 MEMES</span>
      </button>

      {/* Main editor box */}
      <div className="rage-box bg-white p-0 overflow-hidden">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-[#9932CC] to-[#FF69B4] px-4 py-3 border-b-4 border-black">
          <h2 className="impact-text text-white text-xl tracking-wide text-center drop-shadow-md">
            ✏️ EDIT UR MEME ✏️
          </h2>
          <p className="text-white/80 text-sm text-center">
            {match.templateName}
          </p>
        </div>

        {/* Preview */}
        <div className="p-4 bg-[#f0f0f0] border-b-4 border-black">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full border-4 border-black shadow-lg"
            />
          </div>
        </div>

        {/* Text inputs */}
        <div className="p-4 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-bold text-black mb-2 uppercase">
              📝 Top Text
            </label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Enter top text..."
              className="w-full p-3 text-black bg-[#FFFACD] border-4 border-black
                       focus:bg-white focus:ring-2 focus:ring-[#FFD700]
                       outline-none transition-all placeholder:text-gray-400"
              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue', cursive" }}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2 uppercase">
              📝 Bottom Text
            </label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="Enter bottom text..."
              className="w-full p-3 text-black bg-[#FFFACD] border-4 border-black
                       focus:bg-white focus:ring-2 focus:ring-[#FFD700]
                       outline-none transition-all placeholder:text-gray-400"
              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue', cursive" }}
            />
          </div>

          {/* Advanced controls toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-2 text-sm text-gray-600 hover:text-black 
                       flex items-center justify-center gap-2 transition-colors border-2 border-dashed border-gray-300"
          >
            <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
            {showAdvanced ? 'Hide' : 'Show'} text controls
          </button>

          {/* Advanced controls */}
          {showAdvanced && (
            <div className="p-4 bg-[#f0f0f0] border-4 border-black space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-black">TOP SIZE</label>
                  <span className="text-xs bg-black text-[#00FF00] px-2 py-1 font-mono">{topSettings.fontSize}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={topSettings.fontSize}
                  onChange={(e) => setTopSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                  className="w-full h-4 bg-gray-300 rounded-none appearance-none cursor-pointer accent-[#FF4444]"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-black">TOP POSITION</label>
                  <span className="text-xs bg-black text-[#00FF00] px-2 py-1 font-mono">{topSettings.yOffset === 0 ? 'EDGE' : `+${topSettings.yOffset}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={topSettings.yOffset}
                  onChange={(e) => setTopSettings(prev => ({ ...prev, yOffset: Number(e.target.value) }))}
                  className="w-full h-4 bg-gray-300 rounded-none appearance-none cursor-pointer accent-[#FF4444]"
                />
              </div>

              <hr className="border-2 border-black" />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-black">BOTTOM SIZE</label>
                  <span className="text-xs bg-black text-[#00FF00] px-2 py-1 font-mono">{bottomSettings.fontSize}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={bottomSettings.fontSize}
                  onChange={(e) => setBottomSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                  className="w-full h-4 bg-gray-300 rounded-none appearance-none cursor-pointer accent-[#FF4444]"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-black">BOTTOM POSITION</label>
                  <span className="text-xs bg-black text-[#00FF00] px-2 py-1 font-mono">{bottomSettings.yOffset === 0 ? 'EDGE' : `+${bottomSettings.yOffset}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={bottomSettings.yOffset}
                  onChange={(e) => setBottomSettings(prev => ({ ...prev, yOffset: Number(e.target.value) }))}
                  className="w-full h-4 bg-gray-300 rounded-none appearance-none cursor-pointer accent-[#FF4444]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-t-4 border-black space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleCopyToClipboard}
              className="flex-1 py-3 px-4 bg-[#1E90FF] text-white font-bold
                         border-4 border-black glossy-btn
                         flex items-center justify-center gap-2 uppercase"
            >
              {copySuccess ? (
                <>
                  <span>✓</span>
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>COPY</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 py-3 px-4 bg-[#00FF00] text-black font-bold
                         border-4 border-black glossy-btn
                         disabled:bg-gray-400 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 uppercase"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>DOWNLOAD</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleShareToTwitter}
            className="w-full py-3 px-4 bg-black text-white font-bold
                       border-4 border-[#1DA1F2] hover:bg-[#1DA1F2] transition-colors
                       flex items-center justify-center gap-2 uppercase"
          >
            <span>🐦</span>
            <span>SHARE 2 TWITTER</span>
          </button>
        </div>
      </div>
    </div>
  );
}
