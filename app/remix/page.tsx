'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Popular meme templates that work well for remixing
const REMIX_TEMPLATES = [
  {
    id: 'gamer-lean',
    name: 'Gamer Lean',
    description: 'Person leaning forward intensely at screen',
    previewUrl: 'https://i.imgflip.com/2bmnqx.jpg',
    prompt: 'person leaning forward intensely while sitting, focused expression, holding controller or at computer',
  },
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    description: 'Rejecting one thing, approving another',
    previewUrl: 'https://i.imgflip.com/30b1gx.jpg',
    prompt: 'two panel meme, top panel person rejecting/disgusted, bottom panel person approving/happy',
  },
  {
    id: 'distracted-boyfriend',
    name: 'Distracted Boyfriend',
    description: 'Looking at something new while ignoring current thing',
    previewUrl: 'https://i.imgflip.com/1ur9b0.jpg',
    prompt: 'person looking back at something new while partner looks disapprovingly',
  },
  {
    id: 'thinking',
    name: 'Roll Safe Think',
    description: 'Tapping head with "clever" expression',
    previewUrl: 'https://i.imgflip.com/1h7in3.jpg',
    prompt: 'person tapping their temple/head with knowing smug expression, thinking pose',
  },
  {
    id: 'this-is-fine',
    name: 'This Is Fine',
    description: 'Sitting calmly while everything burns',
    previewUrl: 'https://i.imgflip.com/wxica.jpg',
    prompt: 'character sitting calmly at table while room is on fire, drinking coffee',
  },
  {
    id: 'surprised',
    name: 'Surprised Face',
    description: 'Shocked reaction face',
    previewUrl: 'https://i.imgflip.com/2kbn1e.jpg',
    prompt: 'character with extremely surprised shocked expression, wide eyes open mouth',
  },
];

interface BrandProfile {
  avatarUrl: string | null;
  avatarDescription: string;
  brandColors: {
    primary: string;
    secondary: string;
  };
  characterStyle: string;
}

export default function RemixStudio() {
  const [step, setStep] = useState<'profile' | 'select' | 'generate' | 'result'>('profile');
  const [profile, setProfile] = useState<BrandProfile>({
    avatarUrl: null,
    avatarDescription: '',
    brandColors: { primary: '#8B5CF6', secondary: '#1E1E2E' },
    characterStyle: 'cartoon',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<typeof REMIX_TEMPLATES[0] | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateRemix = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/remix-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          profile: {
            avatarDescription: profile.avatarDescription,
            brandColors: profile.brandColors,
            characterStyle: profile.characterStyle,
            avatarUrl: profile.avatarUrl,
          },
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
      a.download = `remix-${selectedTemplate?.id || 'meme'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(generatedImage, '_blank');
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

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['profile', 'select', 'generate', 'result'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s ? 'bg-[var(--accent)] text-white' : 
                ['profile', 'select', 'generate', 'result'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
              }`}>
                {['profile', 'select', 'generate', 'result'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 3 && <div className={`w-12 h-0.5 mx-1 ${
                ['profile', 'select', 'generate', 'result'].indexOf(step) > i ? 'bg-green-500' : 'bg-[var(--border)]'
              }`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Brand Profile */}
        {step === 'profile' && (
          <div className="space-y-8 fade-in">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Create Your Brand Profile</h1>
              <p className="text-[var(--text-secondary)]">
                Tell us about your avatar so we can remix memes in your style
              </p>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
              {/* Avatar upload */}
              <div className="card p-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Your Avatar/Character (optional)
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--accent)] transition-colors overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📷</span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Upload your profile picture, logo, or character image
                    </p>
                  </div>
                </div>
              </div>

              {/* Avatar description */}
              <div className="card p-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Describe Your Character/Avatar *
                </label>
                <textarea
                  value={profile.avatarDescription}
                  onChange={(e) => setProfile(prev => ({ ...prev, avatarDescription: e.target.value }))}
                  placeholder="e.g., A cute penguin with big eyes wearing a hoodie, or A robot with a friendly smile, or A cat wearing sunglasses..."
                  className="w-full h-24 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                />
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Be specific! The better you describe it, the better the remix.
                </p>
              </div>

              {/* Brand colors */}
              <div className="card p-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Brand Colors
                </label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.brandColors.primary}
                      onChange={(e) => setProfile(prev => ({ 
                        ...prev, 
                        brandColors: { ...prev.brandColors, primary: e.target.value }
                      }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.brandColors.secondary}
                      onChange={(e) => setProfile(prev => ({ 
                        ...prev, 
                        brandColors: { ...prev.brandColors, secondary: e.target.value }
                      }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">Secondary</span>
                  </div>
                </div>
              </div>

              {/* Art style */}
              <div className="card p-6">
                <label className="block text-sm font-medium text-white mb-3">
                  Art Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['cartoon', 'realistic', 'anime', 'sketch', 'pixel', 'minimalist'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setProfile(prev => ({ ...prev, characterStyle: style }))}
                      className={`py-2 px-3 rounded-lg text-sm capitalize transition-all ${
                        profile.characterStyle === style
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('select')}
                disabled={!profile.avatarDescription.trim()}
                className="w-full py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Template Selection →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Template */}
        {step === 'select' && (
          <div className="space-y-8 fade-in">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Choose a Meme to Remix</h1>
              <p className="text-[var(--text-secondary)]">
                Select a popular meme template to personalize with your character
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {REMIX_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`card p-3 text-left transition-all hover:scale-[1.02] ${
                    selectedTemplate?.id === template.id
                      ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/10'
                      : ''
                  }`}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-[var(--bg-tertiary)] mb-2">
                    <Image
                      src={template.previewUrl}
                      alt={template.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-white text-sm">{template.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1">{template.description}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStep('profile')}
                className="py-3 px-6 bg-[var(--bg-tertiary)] text-white rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('generate')}
                disabled={!selectedTemplate}
                className="py-3 px-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Preview →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generate */}
        {step === 'generate' && (
          <div className="space-y-8 fade-in">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Ready to Remix!</h1>
              <p className="text-[var(--text-secondary)]">
                Review your settings and generate your personalized meme
              </p>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
              {/* Preview card */}
              <div className="card p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                    <Image
                      src={selectedTemplate?.previewUrl || ''}
                      alt="Template"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{selectedTemplate?.name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{selectedTemplate?.description}</p>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Your character:</span>
                    <span className="text-white">{profile.avatarDescription.slice(0, 30)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Style:</span>
                    <span className="text-white capitalize">{profile.characterStyle}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-[var(--text-muted)]">Colors:</span>
                    <div className="flex gap-1">
                      <div 
                        className="w-5 h-5 rounded" 
                        style={{ backgroundColor: profile.brandColors.primary }}
                      />
                      <div 
                        className="w-5 h-5 rounded" 
                        style={{ backgroundColor: profile.brandColors.secondary }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 card bg-red-500/10 border-red-500/30 text-red-400 text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-3 bg-[var(--bg-tertiary)] text-white rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerateRemix}
                  disabled={isGenerating}
                  className="flex-1 py-3 btn-primary disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    '✨ Generate Remix'
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-[var(--text-muted)]">
                Generation typically takes 10-20 seconds
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && generatedImage && (
          <div className="space-y-8 fade-in">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Your Remix is Ready! 🎉</h1>
              <p className="text-[var(--text-secondary)]">
                Download and share your personalized meme
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
                    setStep('select');
                  }}
                  className="flex-1 py-3 bg-[var(--bg-tertiary)] text-white rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition-colors"
                >
                  🔄 Try Another Template
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 btn-primary"
                >
                  ⬇️ Download
                </button>
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => {
                    setGeneratedImage(null);
                    setSelectedTemplate(null);
                    setStep('profile');
                  }}
                  className="flex-1 py-3 bg-[var(--bg-tertiary)] text-white rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition-colors text-sm"
                >
                  ← Change Character
                </button>
                <button
                  onClick={handleGenerateRemix}
                  disabled={isGenerating}
                  className="flex-1 py-3 bg-[var(--bg-tertiary)] text-white rounded-xl hover:bg-[var(--bg-tertiary)]/80 transition-colors text-sm"
                >
                  🎲 Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
