'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MemeMatch, TextBox } from '@/lib/claude';

interface EnrichedMatch extends MemeMatch {
  templateUrl: string;
  width: number;
  height: number;
  boxCount: number;
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

// Panel layout configurations for different meme formats
const PANEL_LAYOUTS: Record<string, { panels: Array<{ x: number; y: number; width: number; height: number; align: 'left' | 'center' | 'right' }> }> = {
  // Expanding Brain - 4 vertical panels, text on left side
  'multi-panel-4-vertical': {
    panels: [
      { x: 0.25, y: 0.125, width: 0.45, height: 0.25, align: 'center' },
      { x: 0.25, y: 0.375, width: 0.45, height: 0.25, align: 'center' },
      { x: 0.25, y: 0.625, width: 0.45, height: 0.25, align: 'center' },
      { x: 0.25, y: 0.875, width: 0.45, height: 0.25, align: 'center' },
    ],
  },
  // 3-panel vertical (like Gru's Plan)
  'multi-panel-3-vertical': {
    panels: [
      { x: 0.5, y: 0.167, width: 0.9, height: 0.33, align: 'center' },
      { x: 0.5, y: 0.5, width: 0.9, height: 0.33, align: 'center' },
      { x: 0.5, y: 0.833, width: 0.9, height: 0.33, align: 'center' },
    ],
  },
  // Standard top-bottom
  'top-bottom': {
    panels: [
      { x: 0.5, y: 0.08, width: 0.95, height: 0.4, align: 'center' },
      { x: 0.5, y: 0.92, width: 0.95, height: 0.4, align: 'center' },
    ],
  },
};

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
  verticalAlign: 'top' | 'center' | 'bottom' = 'center'
) {
  ctx.font = `bold ${fontSize}px Impact, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';

  const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
  const lineHeight = fontSize * 1.1;
  const totalHeight = lines.length * lineHeight;

  let startY: number;
  switch (verticalAlign) {
    case 'top':
      startY = y;
      break;
    case 'bottom':
      startY = y - totalHeight + lineHeight;
      break;
    case 'center':
    default:
      startY = y - totalHeight / 2 + lineHeight / 2;
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

function getLayoutForFormat(format: string, boxCount: number): typeof PANEL_LAYOUTS['top-bottom'] {
  // Multi-panel memes
  if (format === 'multi-panel') {
    if (boxCount === 4) return PANEL_LAYOUTS['multi-panel-4-vertical'];
    if (boxCount === 3) return PANEL_LAYOUTS['multi-panel-3-vertical'];
  }
  // Default to top-bottom
  return PANEL_LAYOUTS['top-bottom'];
}

function getPositionLabel(position: string, index: number, total: number): string {
  if (position.startsWith('panel')) {
    const num = position.replace('panel', '');
    return `Panel ${num} text`;
  }
  if (position === 'top') return 'Top text';
  if (position === 'bottom') return 'Bottom text';
  if (position === 'left') return 'Left text';
  if (position === 'right') return 'Right text';
  return `Text ${index + 1}`;
}

export default function MemeEditor({ match, onDownload, onBack }: MemeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize text values from textBoxes
  const initialTexts = match.textBoxes?.map(tb => tb.text) ||
    [match.suggestedTopText || '', match.suggestedBottomText || ''];

  const [texts, setTexts] = useState<string[]>(initialTexts);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Settings for each text box
  const [textSettings, setTextSettings] = useState<TextSettings[]>(
    initialTexts.map(() => ({ fontSize: 40, yOffset: 0 }))
  );

  const isMultiPanel = match.format === 'multi-panel' || match.boxCount > 2;

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

      const layout = getLayoutForFormat(match.format, match.boxCount);
      const baseFontSize = Math.min(canvas.width / 14, canvas.height / (16 * Math.max(1, texts.length / 2)));

      texts.forEach((text, index) => {
        if (!text.trim()) return;

        const settings = textSettings[index] || { fontSize: 40, yOffset: 0 };
        const fontSize = baseFontSize * (settings.fontSize / 50);

        // Get panel position from layout
        const panel = layout.panels[index];
        if (panel) {
          const x = panel.x * canvas.width;
          const y = (panel.y + settings.yOffset / 200) * canvas.height;
          const maxTextWidth = panel.width * canvas.width;

          drawMemeText(ctx, text, x, y, fontSize, maxTextWidth, 'center');
        } else {
          // Fallback: distribute vertically
          const yPercent = (index + 1) / (texts.length + 1);
          const y = yPercent * canvas.height;
          const maxTextWidth = canvas.width * 0.9;

          drawMemeText(ctx, text, canvas.width / 2, y, fontSize, maxTextWidth, 'center');
        }
      });
    };

    img.src = match.templateUrl;
  }, [match.templateUrl, match.format, match.boxCount, texts, textSettings]);

  useEffect(() => {
    renderMeme();
  }, [renderMeme]);

  const handleTextChange = (index: number, value: string) => {
    setTexts(prev => {
      const newTexts = [...prev];
      newTexts[index] = value;
      return newTexts;
    });
  };

  const handleSettingChange = (index: number, key: keyof TextSettings, value: number) => {
    setTextSettings(prev => {
      const newSettings = [...prev];
      newSettings[index] = { ...newSettings[index], [key]: value };
      return newSettings;
    });
  };

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

        {/* Text inputs - dynamic based on textBoxes */}
        <div className="p-4 space-y-4">
          {texts.map((text, index) => {
            const position = match.textBoxes?.[index]?.position || (index === 0 ? 'top' : 'bottom');
            const label = getPositionLabel(position, index, texts.length);

            return (
              <div key={index}>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  {label}
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  className="w-full p-3 input"
                />
              </div>
            );
          })}

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

          {/* Advanced controls - per text box */}
          {showAdvanced && (
            <div className="p-4 bg-[var(--bg-secondary)] rounded-lg space-y-4">
              {texts.map((_, index) => {
                const position = match.textBoxes?.[index]?.position || (index === 0 ? 'top' : 'bottom');
                const label = getPositionLabel(position, index, texts.length);
                const settings = textSettings[index] || { fontSize: 40, yOffset: 0 };

                return (
                  <div key={index} className="space-y-2">
                    {texts.length > 2 && (
                      <div className="text-xs text-[var(--text-muted)] font-medium">{label}</div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                          <span>{texts.length <= 2 ? `${label.split(' ')[0]} size` : 'Size'}</span>
                          <span>{settings.fontSize}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={settings.fontSize}
                          onChange={(e) => handleSettingChange(index, 'fontSize', Number(e.target.value))}
                          className="w-full accent-[var(--accent)]"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                          <span>{texts.length <= 2 ? `${label.split(' ')[0]} position` : 'Position'}</span>
                          <span>{settings.yOffset}%</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={settings.yOffset}
                          onChange={(e) => handleSettingChange(index, 'yOffset', Number(e.target.value))}
                          className="w-full accent-[var(--accent)]"
                        />
                      </div>
                    </div>
                    {index < texts.length - 1 && texts.length > 2 && (
                      <div className="border-b border-[var(--border)] pt-2" />
                    )}
                  </div>
                );
              })}
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
