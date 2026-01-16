import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RemixTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

interface BrandProfile {
  avatarDescription: string;
  brandColors: {
    primary: string;
    secondary: string;
  };
  characterStyle: string;
  avatarUrl?: string | null;
}

interface RemixRequest {
  template: RemixTemplate;
  profile: BrandProfile;
}

// Convert hex color to descriptive name
function hexToColorName(hex: string): string {
  const colors: Record<string, string> = {
    '#FF0000': 'red', '#FF4500': 'orange-red', '#FFA500': 'orange',
    '#FFFF00': 'yellow', '#00FF00': 'lime green', '#008000': 'green',
    '#00FFFF': 'cyan', '#0000FF': 'blue', '#4B0082': 'indigo',
    '#8B5CF6': 'purple', '#EE82EE': 'violet', '#FF00FF': 'magenta',
    '#FFC0CB': 'pink', '#FFFFFF': 'white', '#000000': 'black',
    '#808080': 'gray', '#A52A2A': 'brown', '#1E1E2E': 'dark blue-gray',
  };
  
  // Find closest color match
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  let closestColor = 'colored';
  let minDistance = Infinity;
  
  for (const [hexColor, name] of Object.entries(colors)) {
    const r2 = parseInt(hexColor.slice(1, 3), 16);
    const g2 = parseInt(hexColor.slice(3, 5), 16);
    const b2 = parseInt(hexColor.slice(5, 7), 16);
    
    const distance = Math.sqrt(
      Math.pow(r - r2, 2) + Math.pow(g - g2, 2) + Math.pow(b - b2, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = name;
    }
  }
  
  return closestColor;
}

// Build the image generation prompt
function buildRemixPrompt(template: RemixTemplate, profile: BrandProfile): string {
  const primaryColor = hexToColorName(profile.brandColors.primary);
  const secondaryColor = hexToColorName(profile.brandColors.secondary);
  
  const styleGuides: Record<string, string> = {
    cartoon: 'in a clean cartoon style with bold outlines, vibrant colors',
    realistic: 'in a semi-realistic digital art style',
    anime: 'in anime/manga art style with expressive features',
    sketch: 'in a hand-drawn sketch style with pencil textures',
    pixel: 'in pixel art style, retro 16-bit aesthetic',
    minimalist: 'in a minimalist flat design style with simple shapes',
  };
  
  const styleGuide = styleGuides[profile.characterStyle] || styleGuides.cartoon;
  
  return `Create a meme image ${styleGuide}.

The image should show: ${profile.avatarDescription} doing the following pose/action: ${template.prompt}

Key elements:
- The character should be: ${profile.avatarDescription}
- Main color theme: ${primaryColor} and ${secondaryColor}
- Any props or background elements should incorporate these brand colors
- The character should have the personality and essence described, not just be a generic character
- Make sure the character is clearly the main focus
- The pose/action should match the classic "${template.name}" meme format

Style requirements:
- ${styleGuide}
- Professional quality suitable for social media
- Clear, readable composition
- The character should be expressive and engaging

Do NOT include any text overlays or captions in the image.`;
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Image generation is not configured. Please add OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    const body: RemixRequest = await request.json();
    const { template, profile } = body;

    // Validate request
    if (!template || !profile) {
      return NextResponse.json(
        { error: 'Missing template or profile data' },
        { status: 400 }
      );
    }

    if (!profile.avatarDescription || profile.avatarDescription.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a more detailed avatar description' },
        { status: 400 }
      );
    }

    // Build the prompt
    const prompt = buildRemixPrompt(template, profile);
    console.log('Generating remix with prompt:', prompt.slice(0, 200) + '...');

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log('Remix generated successfully');

    return NextResponse.json({
      imageUrl,
      prompt: prompt.slice(0, 100) + '...', // Return truncated prompt for debugging
    });

  } catch (error) {
    console.error('Remix generation error:', error);

    // Handle OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 400 && error.message.includes('safety')) {
        return NextResponse.json(
          { error: 'The image could not be generated due to content policy. Please try a different description.' },
          { status: 400 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate remix. Please try again.' },
      { status: 500 }
    );
  }
}
