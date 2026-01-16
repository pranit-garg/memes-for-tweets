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
  yOffset: number;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
  return lines;
}

function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  maxWidth: number,
  isBottom: boolean
) {
  ctx.font = `bold ${fontSize}px Impact, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = isBottom ? 'bottom' : 'top';
  
  const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
  const lineHeight = fontSize * 1.1;
  
  let startY = y;
  if (isBottom) {
    startY = y - (lines.length - 1) * lineHeight;
  }

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize * 0.15;
    ctx.lineJoin = 'round';
    
    for (let i = 0; i < 4; i++) {
      ctx.strokeText(line, x, lineY);
    }
    ctx.fillStyle = 'white';
    ctx.fillText(line, x, lineY);
  });
}

export default function MemeEditor({ match, onDownload, onBack }: MemeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const initialTopText = match.textBoxes?.[0]?.text || match.suggestedTopText || '';
  const initialBottomText = match.textBoxes?.[1]?.text || match.suggestedBottomText || '';
  
  const [topText, setTopText] = useState(initialTopText);
  const [bottomText, setBottomText] = useState(initialBottomText);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [topSettings, setTopSettings] = useState<TextSettings>({ fontSize: 40, yOffset: 0 });
  const [bottomSettings, setBottomSettings] = useState<TextSettings>({ fontSize: 40, yOffset: 0 });
  
  const [, setTextBoxes] = useState<TextBox[]>(
    match.textBoxes || [
      { position: 'top', text: initialTopText },
      { position: 'bottom', text: initialBottomText },
    ]
  );

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
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const baseFontSize = Math.min(canvas.width / 14, canvas.height / 16);
      const padding = canvas.width * 0.02;
      const maxTextWidth = canvas.width - padding * 2;

      if (topText.trim()) {
        const fontSize = baseFontSize * (topSettings.fontSize / 50);
        const yPos = padding + (topSettings.yOffset / 100) * (canvas.height * 0.2);
        drawMemeText(ctx, topText, canvas.width / 2, yPos, fontSize, maxTextWidth, false);
      }

      if (bottomText.trim()) {
        const fontSize = baseFontSize * (bottomSettings.fontSize / 50);
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
      link.download = `meme-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      onDownload();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleShare = () => {
    const text = encodeURIComponent('Made this meme in 10 seconds\n\nmemes-for-tweets.vercel.app');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-[var(--text-secondary)] hover:text-white flex items-center gap-2 text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to templates
      </button>

      <div className="card overflow-hidden">
        {/* Preview */}
        <div className="p-4 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="max-w-full rounded-lg" />
          </div>
        </div>

        {/* Text inputs */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Top text</label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Enter top text..."
              className="w-full p-3 input"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Bottom text</label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="Enter bottom text..."
              className="w-full p-3 input"
            />
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] 
                       flex items-center justify-center gap-2 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showAdvanced ? 'Hide' : 'Adjust'} text size & position
          </button>

          {/* Advanced controls */}
          {showAdvanced && (
            <div className="p-4 bg-[var(--bg-secondary)] rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Top size</span>
                    <span>{topSettings.fontSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={topSettings.fontSize}
                    onChange={(e) => setTopSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Top position</span>
                    <span>{topSettings.yOffset}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={topSettings.yOffset}
                    onChange={(e) => setTopSettings(prev => ({ ...prev, yOffset: Number(e.target.value) }))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Bottom size</span>
                    <span>{bottomSettings.fontSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={bottomSettings.fontSize}
                    onChange={(e) => setBottomSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Bottom position</span>
                    <span>{bottomSettings.yOffset}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={bottomSettings.yOffset}
                    onChange={(e) => setBottomSettings(prev => ({ ...prev, yOffset: Number(e.target.value) }))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[var(--border)] space-y-3">
          <div className="flex gap-3">
            <button onClick={handleCopy} className="flex-1 py-2.5 btn-secondary flex items-center justify-center gap-2">
              {copySuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 py-2.5 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-2.5 btn-secondary flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share to X
          </button>
        </div>
      </div>
    </div>
  );
}
