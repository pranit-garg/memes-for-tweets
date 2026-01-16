'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Remix modes - different ways to creatively transform a meme
type RemixMode = 
  | 'style'      // Change the art style (pixel art, anime, watercolor, etc.)
  | 'context'    // Same joke format, different setting/subject
  | 'mashup'     // Combine two memes into one
  | 'modernize'  // Update an old meme for current times
  | 'subvert'    // Flip the expected punchline
  | 'genre'      // Apply a genre/aesthetic (vaporwave, corporate, dark academia)
  | 'custom';    // Freeform creative remix

interface RemixModeInfo {
  id: RemixMode;
  name: string;
  icon: string;
  description: string;
  examples: string[];
  promptHint: string;
}

const REMIX_MODES: RemixModeInfo[] = [
  {
    id: 'style',
    name: 'Style Transfer',
    icon: '🎨',
    description: 'Same meme, completely different art style',
    examples: ['Pixel art Drake', 'Anime Distracted Boyfriend', 'Watercolor This is Fine'],
    promptHint: 'Recreate this meme in [STYLE] art style',
  },
  {
    id: 'context',
    name: 'New Context',
    icon: '🔄',
    description: 'Same joke structure, different setting or subject',
    examples: ['Drake but with food choices', 'Distracted Boyfriend in medieval times', 'Corporate version of any meme'],
    promptHint: 'Apply the joke format to [NEW CONTEXT]',
  },
  {
    id: 'mashup',
    name: 'Meme Mashup',
    icon: '🔀',
    description: 'Combine elements from two different memes',
    examples: ['Drake + Expanding Brain', 'Distracted Boyfriend meets Woman Yelling at Cat'],
    promptHint: 'Combine [MEME 1] with [MEME 2]',
  },
  {
    id: 'modernize',
    name: 'Modernize',
    icon: '📱',
    description: 'Update a classic meme for 2024+',
    examples: ['Bad Luck Brian but about AI', 'Success Kid but about WFH', 'Doge in the age of crypto'],
    promptHint: 'Update this classic meme for modern times with [TOPIC]',
  },
  {
    id: 'subvert',
    name: 'Subvert Expectations',
    icon: '🔃',
    description: 'Flip the expected punchline or meaning',
    examples: ['Drake approving the "wrong" thing', 'Wholesome version of dark meme', 'Positive spin on negative format'],
    promptHint: 'Subvert this meme by [TWIST]',
  },
  {
    id: 'genre',
    name: 'Apply Aesthetic',
    icon: '✨',
    description: 'Apply a specific aesthetic or genre',
    examples: ['Vaporwave Drake', 'Corporate Memphis style', 'Dark academia aesthetic', 'Y2K aesthetic'],
    promptHint: 'Apply [AESTHETIC] aesthetic to this meme',
  },
  {
    id: 'custom',
    name: 'Custom Remix',
    icon: '🎯',
    description: 'Describe exactly how you want to remix it',
    examples: ['Your creative vision', 'Specific character or brand', 'Unique mashup idea'],
    promptHint: 'Freeform: describe your creative vision',
  },
];

// Popular memes to remix (curated selection with good remix potential)
const REMIXABLE_MEMES = [
  { id: 'drake', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg', structure: 'reject A / approve B' },
  { id: 'distracted', name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg', structure: 'temptation pulling away from duty' },
  { id: 'expanding-brain', name: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg', structure: 'escalating enlightenment/absurdity' },
  { id: 'woman-cat', name: 'Woman Yelling at Cat', url: 'https://i.imgflip.com/345v97.jpg', structure: 'angry accusation vs calm denial' },
  { id: 'this-is-fine', name: 'This Is Fine', url: 'https://i.imgflip.com/wxica.jpg', structure: 'denial amid chaos' },
  { id: 'gru-plan', name: "Gru's Plan", url: 'https://i.imgflip.com/26jxvz.jpg', structure: 'plan backfires unexpectedly' },
  { id: 'panik-kalm', name: 'Panik Kalm Panik', url: 'https://i.imgflip.com/3qqcim.png', structure: 'emotional rollercoaster' },
  { id: 'buff-doge', name: 'Buff Doge vs Cheems', url: 'https://i.imgflip.com/43a45p.png', structure: 'then vs now comparison' },
  { id: 'trade-offer', name: 'Trade Offer', url: 'https://i.imgflip.com/54hjww.jpg', structure: 'unfair exchange proposal' },
  { id: 'uno-draw25', name: 'UNO Draw 25', url: 'https://i.imgflip.com/3lmzyx.jpg', structure: 'refusing reasonable option' },
  { id: 'bernie', name: 'Bernie Asking', url: 'https://i.imgflip.com/4inzti.png', structure: 'repeated request/plea' },
  { id: 'always-has-been', name: 'Always Has Been', url: 'https://i.imgflip.com/46e43q.png', structure: 'revelation of truth' },
  { id: 'change-my-mind', name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg', structure: 'confident hot take' },
  { id: 'two-buttons', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg', structure: 'impossible choice/dilemma' },
  { id: 'clown-makeup', name: 'Clown Applying Makeup', url: 'https://i.imgflip.com/38el31.jpg', structure: 'escalating self-delusion' },
  { id: 'stonks', name: 'Stonks', url: 'https://i.imgflip.com/30bib0.jpg', structure: 'ironic success' },
  { id: 'bike-fall', name: 'Bike Fall', url: 'https://i.imgflip.com/1b42wl.jpg', structure: 'self-sabotage' },
  { id: 'pikachu', name: 'Surprised Pikachu', url: 'https://i.imgflip.com/2kbn1e.jpg', structure: 'obvious outcome surprises' },
  { id: 'disaster-girl', name: 'Disaster Girl', url: 'https://i.imgflip.com/23ls.jpg', structure: 'enjoying chaos you caused' },
  { id: 'galaxy-brain', name: 'Galaxy Brain', url: 'https://i.imgflip.com/2fw4hb.jpg', structure: 'ironic genius take' },
];

// Art styles for style transfer
const ART_STYLES = [
  { id: 'pixel', name: 'Pixel Art', icon: '👾', description: 'Retro 16-bit game aesthetic' },
  { id: 'anime', name: 'Anime', icon: '🎌', description: 'Japanese animation style' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨', description: 'Soft, flowing paint' },
  { id: 'oil-painting', name: 'Oil Painting', icon: '🖼️', description: 'Classical Renaissance style' },
  { id: 'sketch', name: 'Pencil Sketch', icon: '✏️', description: 'Hand-drawn look' },
  { id: 'comic', name: 'Comic Book', icon: '💥', description: 'Bold lines, halftone dots' },
  { id: 'minimalist', name: 'Minimalist', icon: '⬜', description: 'Clean, simple shapes' },
  { id: '3d-render', name: '3D Render', icon: '🎮', description: 'CGI/Pixar style' },
  { id: 'claymation', name: 'Claymation', icon: '🎭', description: 'Stop-motion clay look' },
  { id: 'stained-glass', name: 'Stained Glass', icon: '🏛️', description: 'Cathedral window aesthetic' },
  { id: 'woodcut', name: 'Woodcut', icon: '🪵', description: 'Medieval print style' },
  { id: 'neon', name: 'Neon/Synthwave', icon: '🌆', description: '80s retro future' },
];

// Aesthetics for genre mode
const AESTHETICS = [
  { id: 'vaporwave', name: 'Vaporwave', description: 'Pink/purple, glitch, nostalgic' },
  { id: 'corporate', name: 'Corporate Memphis', description: 'Flat illustrations, HR vibes' },
  { id: 'dark-academia', name: 'Dark Academia', description: 'Gothic, scholarly, moody' },
  { id: 'cottagecore', name: 'Cottagecore', description: 'Rural, cozy, nature' },
  { id: 'y2k', name: 'Y2K', description: 'Early 2000s futurism' },
  { id: 'liminal', name: 'Liminal Space', description: 'Unsettling, empty, dreamlike' },
  { id: 'weirdcore', name: 'Weirdcore', description: 'Surreal, nostalgic, uncanny' },
  { id: 'frutiger-aero', name: 'Frutiger Aero', description: 'Mid-2000s glossy tech' },
  { id: 'brutalist', name: 'Brutalist', description: 'Raw concrete, stark' },
  { id: 'maximalist', name: 'Maximalist', description: 'More is more, chaotic' },
];

export default function RemixStudio() {
  const [step, setStep] = useState<'mode' | 'meme' | 'customize' | 'generate' | 'result'>('mode');
  const [selectedMode, setSelectedMode] = useState<RemixModeInfo | null>(null);
  const [selectedMeme, setSelectedMeme] = useState<typeof REMIXABLE_MEMES[0] | null>(null);
  const [secondMeme, setSecondMeme] = useState<typeof REMIXABLE_MEMES[0] | null>(null); // For mashup
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [contextDescription, setContextDescription] = useState('');
  const [modernTopic, setModernTopic] = useState('');
  const [subversionTwist, setSubversionTwist] = useState('');
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateRemix = async () => {
    if (!selectedMeme || !selectedMode) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/remix-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode.id,
          meme: selectedMeme,
          secondMeme: selectedMode.id === 'mashup' ? secondMeme : null,
          style: selectedStyle,
          aesthetic: selectedAesthetic,
          customPrompt,
          contextDescription,
          modernTopic,
          subversionTwist,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate remix');
      }

      setGeneratedImage(data.imageUrl);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remix-${selectedMeme?.id || 'meme'}-${selectedMode?.id || 'custom'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(generatedImage, '_blank');
    }
  };

  const resetToStart = () => {
    setStep('mode');
    setSelectedMode(null);
    setSelectedMeme(null);
    setSecondMeme(null);
    setSelectedStyle('');
    setSelectedAesthetic('');
    setCustomPrompt('');
    setContextDescription('');
    setModernTopic('');
    setSubversionTwist('');
    setGeneratedImage(null);
    setError('');
  };

  const canProceedFromCustomize = () => {
    if (!selectedMode) return false;
    switch (selectedMode.id) {
      case 'style': return !!selectedStyle;
      case 'context': return !!contextDescription;
      case 'mashup': return !!secondMeme;
      case 'modernize': return !!modernTopic;
      case 'subvert': return !!subversionTwist;
      case 'genre': return !!selectedAesthetic;
      case 'custom': return !!customPrompt;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🎭</span>
            <span className="text-lg font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
              memes for tweets
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
              ✨ Remix Studio
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        {step === 'mode' && (
          <div className="text-center mb-8 fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Meme Remix Studio
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
              Take any popular meme and make it fresh. Change the style, context, 
              mashup two memes, or create something entirely new.
            </p>
          </div>
        )}

        {/* Step 1: Choose Remix Mode */}
        {step === 'mode' && (
          <div className="space-y-6 fade-in">
            <h2 className="text-xl font-semibold text-white text-center">How do you want to remix?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REMIX_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode);
                    setStep('meme');
                  }}
                  className="card p-5 text-left hover:scale-[1.02] transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{mode.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                        {mode.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {mode.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mode.examples.slice(0, 2).map((ex, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Base Meme */}
        {step === 'meme' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep('mode')} className="text-[var(--text-secondary)] hover:text-white">
                ← Back
              </button>
              <div className="text-center">
                <span className="text-2xl mr-2">{selectedMode?.icon}</span>
                <span className="text-white font-medium">{selectedMode?.name}</span>
              </div>
              <div className="w-16" />
            </div>

            <h2 className="text-xl font-semibold text-white text-center">
              {selectedMode?.id === 'mashup' && secondMeme 
                ? 'Now pick the second meme to mashup'
                : 'Pick a meme to remix'}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {REMIXABLE_MEMES.map((meme) => {
                const isSelected = selectedMeme?.id === meme.id;
                const isSecond = secondMeme?.id === meme.id;
                const disabled = selectedMode?.id === 'mashup' && selectedMeme?.id === meme.id;
                
                return (
                  <button
                    key={meme.id}
                    onClick={() => {
                      if (disabled) return;
                      if (selectedMode?.id === 'mashup' && selectedMeme && !secondMeme) {
                        setSecondMeme(meme);
                        setStep('customize');
                      } else {
                        setSelectedMeme(meme);
                        if (selectedMode?.id === 'mashup') {
                          // Stay on meme selection for second meme
                        } else {
                          setStep('customize');
                        }
                      }
                    }}
                    disabled={disabled}
                    className={`card p-2 transition-all ${
                      isSelected || isSecond
                        ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/10'
                        : disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                    }`}
                  >
                    <div className="aspect-square rounded overflow-hidden bg-[var(--bg-tertiary)] mb-2 relative">
                      <Image
                        src={meme.url}
                        alt={meme.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                      {(isSelected || isSecond) && (
                        <div className="absolute inset-0 bg-[var(--accent)]/20 flex items-center justify-center">
                          <span className="text-2xl">{isSelected ? '1️⃣' : '2️⃣'}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white font-medium truncate">{meme.name}</p>
                  </button>
                );
              })}
            </div>

            {selectedMode?.id === 'mashup' && selectedMeme && !secondMeme && (
              <p className="text-center text-[var(--text-secondary)]">
                ✓ First meme selected: <span className="text-white">{selectedMeme.name}</span>. Now pick the second one!
              </p>
            )}
          </div>
        )}

        {/* Step 3: Customize the Remix */}
        {step === 'customize' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
              <button onClick={() => {
                if (selectedMode?.id === 'mashup') {
                  setSecondMeme(null);
                }
                setStep('meme');
              }} className="text-[var(--text-secondary)] hover:text-white">
                ← Back
              </button>
              <div className="text-center">
                <span className="text-lg font-medium text-white">{selectedMeme?.name}</span>
                {secondMeme && <span className="text-[var(--text-secondary)]"> + {secondMeme.name}</span>}
              </div>
              <div className="w-16" />
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Style Transfer Options */}
              {selectedMode?.id === 'style' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white text-center">Choose an art style</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ART_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`card p-4 text-center transition-all ${
                          selectedStyle === style.id
                            ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/10'
                            : 'hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{style.icon}</span>
                        <span className="text-sm text-white font-medium">{style.name}</span>
                        <span className="text-xs text-[var(--text-muted)] block mt-1">{style.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Context Remix */}
              {selectedMode?.id === 'context' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white text-center">Describe the new context</h2>
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    Same joke structure ({selectedMeme?.structure}), different setting
                  </p>
                  <textarea
                    value={contextDescription}
                    onChange={(e) => setContextDescription(e.target.value)}
                    placeholder="e.g., 'In a medieval fantasy setting', 'With programming languages instead of people', 'In an office environment with different departments', 'With cats as all the characters'..."
                    className="w-full h-32 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  />
                </div>
              )}

              {/* Mashup - show selected memes */}
              {selectedMode?.id === 'mashup' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white text-center">Mashup Preview</h2>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                        <Image src={selectedMeme?.url || ''} alt="Meme 1" width={128} height={128} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-sm text-white mt-2">{selectedMeme?.name}</p>
                    </div>
                    <span className="text-3xl">🔀</span>
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                        <Image src={secondMeme?.url || ''} alt="Meme 2" width={128} height={128} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-sm text-white mt-2">{secondMeme?.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    We&apos;ll combine the essence of both memes into something new
                  </p>
                </div>
              )}

              {/* Modernize */}
              {selectedMode?.id === 'modernize' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white text-center">What modern topic?</h2>
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    Update this classic meme for 2024+ themes
                  </p>
                  <textarea
                    value={modernTopic}
                    onChange={(e) => setModernTopic(e.target.value)}
                    placeholder="e.g., 'AI and ChatGPT', 'Work from home culture', 'Social media addiction', 'Crypto/NFTs', 'Dating apps', 'Climate anxiety'..."
                    className="w-full h-32 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  />
                </div>
              )}

              {/* Subvert */}
              {selectedMode?.id === 'subvert' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white text-center">How should we flip it?</h2>
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    Subvert the expected meaning of {selectedMeme?.name}
                  </p>
                  <textarea
                    value={subversionTwist}
                    onChange={(e) => setSubversionTwist(e.target.value)}
                    placeholder="e.g., 'Make it wholesome instead of sarcastic', 'Reverse which option is good/bad', 'Make the usually-wrong character right', 'Add a positive twist to negative format'..."
                    className="w-full h-32 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  />
                </div>
              )}

              {/* Genre/Aesthetic */}
              {selectedMode?.id === 'genre' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white text-center">Choose an aesthetic</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AESTHETICS.map((aes) => (
                      <button
                        key={aes.id}
                        onClick={() => setSelectedAesthetic(aes.id)}
                        className={`card p-4 text-left transition-all ${
                          selectedAesthetic === aes.id
                            ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/10'
                            : 'hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        <span className="text-sm text-white font-medium">{aes.name}</span>
                        <span className="text-xs text-[var(--text-muted)] block mt-1">{aes.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom */}
              {selectedMode?.id === 'custom' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white text-center">Describe your vision</h2>
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    Be creative! Describe exactly how you want to remix {selectedMeme?.name}
                  </p>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'Make it look like a Renaissance painting but keep the meme energy', 'Replace all characters with cats in business suits', 'Turn it into a motivational poster', 'Make it look like a movie poster'..."
                    className="w-full h-40 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  />
                </div>
              )}

              {error && (
                <div className="p-4 card bg-red-500/10 border-red-500/30 text-red-400 text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('meme')}
                  className="flex-1 py-3 bg-[var(--bg-tertiary)] text-white rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition-colors"
                >
                  ← Change Meme
                </button>
                <button
                  onClick={handleGenerateRemix}
                  disabled={!canProceedFromCustomize() || isGenerating}
                  className="flex-1 py-3 btn-primary disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    '✨ Generate Remix'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && generatedImage && (
          <div className="space-y-6 fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Your Remix is Ready! 🎉</h1>
              <p className="text-[var(--text-secondary)]">
                {selectedMode?.name} of {selectedMeme?.name}
                {secondMeme && ` + ${secondMeme.name}`}
              </p>
            </div>

            <div className="max-w-lg mx-auto">
              <div className="card p-4">
                <div className="rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                  <Image
                    src={generatedImage}
                    alt="Generated remix"
                    width={512}
                    height={512}
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setGeneratedImage(null);
                    setStep('customize');
                  }}
                  className="flex-1 py-3 bg-[var(--bg-tertiary)] text-white rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition-colors"
                >
                  🎲 Regenerate
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 btn-primary"
                >
                  ⬇️ Download
                </button>
              </div>

              <button
                onClick={resetToStart}
                className="w-full mt-3 py-3 bg-[var(--bg-tertiary)] text-white rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition-colors"
              >
                🔄 Start New Remix
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
