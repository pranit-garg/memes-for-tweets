import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RemixMode = 'style' | 'context' | 'mashup' | 'modernize' | 'subvert' | 'genre' | 'custom';

interface MemeInfo {
  id: string;
  name: string;
  url: string;
  structure: string;
}

interface RemixRequest {
  mode: RemixMode;
  meme: MemeInfo;
  secondMeme?: MemeInfo | null;
  style?: string;
  aesthetic?: string;
  customPrompt?: string;
  contextDescription?: string;
  modernTopic?: string;
  subversionTwist?: string;
}

// Art style descriptions for DALL-E
const STYLE_DESCRIPTIONS: Record<string, string> = {
  'pixel': '16-bit pixel art style, retro video game aesthetic, limited color palette, blocky pixels visible',
  'anime': 'anime/manga art style, expressive eyes, dynamic poses, Japanese animation aesthetic',
  'watercolor': 'watercolor painting style, soft flowing colors, paper texture, artistic brush strokes',
  'oil-painting': 'classical oil painting style like Renaissance masters, rich colors, visible brushwork, dramatic lighting',
  'sketch': 'pencil sketch style, hand-drawn lines, shading with hatching, paper texture',
  'comic': 'comic book style, bold black outlines, halftone dots, vibrant colors, action lines',
  'minimalist': 'minimalist flat design, simple geometric shapes, limited colors, clean and modern',
  '3d-render': 'Pixar/Disney 3D animation style, smooth CGI rendering, expressive characters',
  'claymation': 'stop-motion claymation style like Wallace and Gromit, clay texture, warm lighting',
  'stained-glass': 'stained glass window style, bold black outlines, jewel-toned segments, cathedral aesthetic',
  'woodcut': 'medieval woodcut print style, bold black and white, carved line texture',
  'neon': 'synthwave/vaporwave neon style, glowing neon colors, 80s retro futurism, grid backgrounds',
};

// Aesthetic descriptions
const AESTHETIC_DESCRIPTIONS: Record<string, string> = {
  'vaporwave': 'vaporwave aesthetic with pink and purple gradients, glitch effects, Greek statues, retro tech, Japanese text',
  'corporate': 'corporate Memphis flat illustration style, bright colors, abstract blob shapes, diverse stick figures',
  'dark-academia': 'dark academia aesthetic, moody lighting, old books, gothic architecture, sepia tones, scholarly',
  'cottagecore': 'cottagecore aesthetic, pastoral countryside, wildflowers, cozy cottage, soft warm lighting',
  'y2k': 'Y2K aesthetic, early 2000s futurism, chrome effects, bubble fonts, blue and silver colors',
  'liminal': 'liminal space aesthetic, empty hallways, fluorescent lighting, unsettling emptiness, dreamlike',
  'weirdcore': 'weirdcore aesthetic, surreal, low-quality images, nostalgic yet unsettling, distorted',
  'frutiger-aero': 'Frutiger Aero aesthetic, glossy bubbles, nature imagery, glass effects, mid-2000s tech',
  'brutalist': 'brutalist aesthetic, raw concrete, stark geometric shapes, monochrome, imposing',
  'maximalist': 'maximalist aesthetic, overwhelming detail, clashing patterns, more-is-more, chaotic beauty',
};

// Build prompts for different remix modes
function buildRemixPrompt(request: RemixRequest): string {
  const { mode, meme, secondMeme, style, aesthetic, customPrompt, contextDescription, modernTopic, subversionTwist } = request;

  let prompt = '';

  switch (mode) {
    case 'style':
      const styleDesc = STYLE_DESCRIPTIONS[style || ''] || 'artistic style';
      prompt = `Create the "${meme.name}" meme in ${styleDesc}.

The meme should capture the same energy and joke structure: "${meme.structure}"

Key requirements:
- Recreate the iconic composition of the ${meme.name} meme
- Apply the art style consistently throughout
- The meme format should be immediately recognizable
- Keep the same poses and expressions that make this meme work
- Do NOT include any text overlays - just the image

Make it high quality, shareable, and faithful to both the meme format and the artistic style.`;
      break;

    case 'context':
      prompt = `Recreate the "${meme.name}" meme but in a completely new context: ${contextDescription}

Original meme structure: "${meme.structure}"

Requirements:
- Keep the same comedic structure and format
- Apply it to the new context described
- The pose/composition should mirror the original meme
- Make it feel like a fresh take on a classic format
- Characters and setting should match the new context
- Do NOT include any text - the image should work on its own

The result should be immediately recognizable as the ${meme.name} format, but with an exciting new twist.`;
      break;

    case 'mashup':
      prompt = `Create a creative mashup combining two memes into one image:

Meme 1: "${meme.name}" - ${meme.structure}
Meme 2: "${secondMeme?.name}" - ${secondMeme?.structure}

Create a single cohesive image that combines elements from both memes in a clever way. This could mean:
- Characters from one meme in the pose/situation of the other
- The visual format of one with the energy of the other  
- A creative blend that honors both originals

Make it feel like a natural evolution of meme culture - something that could go viral.
Do NOT include any text overlays.`;
      break;

    case 'modernize':
      prompt = `Update the classic "${meme.name}" meme for 2024 with the theme: ${modernTopic}

Original structure: "${meme.structure}"

Create a fresh version that:
- Keeps the iconic format recognizable
- Updates the subject matter for ${modernTopic}
- Feels relevant and current
- Would resonate with today's internet culture
- Uses modern visual elements where appropriate

Make it feel like a natural evolution of this classic meme for today's world.
Do NOT include text overlays.`;
      break;

    case 'subvert':
      prompt = `Create a subverted version of the "${meme.name}" meme with this twist: ${subversionTwist}

Original meaning: "${meme.structure}"

The subversion should:
- Use the same visual format as the original
- Flip or twist the expected meaning
- Create surprise or humor through the unexpected take
- Still be recognizable as the original meme format

Make the twist clever and shareable.
Do NOT include text overlays - the image should convey the subversion visually.`;
      break;

    case 'genre':
      const aesDesc = AESTHETIC_DESCRIPTIONS[aesthetic || ''] || aesthetic;
      prompt = `Transform the "${meme.name}" meme into the ${aesthetic} aesthetic.

Apply: ${aesDesc}

The result should:
- Be immediately recognizable as the ${meme.name} meme format
- Fully embrace the ${aesthetic} aesthetic
- Feel like authentic ${aesthetic} content
- Maintain the meme's core composition and energy

Create something that fans of both the meme and the aesthetic would love.
Do NOT include text overlays.`;
      break;

    case 'custom':
      prompt = `Create a creative remix of the "${meme.name}" meme with this vision:

${customPrompt}

Original meme structure: "${meme.structure}"

Make it creative, high quality, and shareable. The result should feel fresh while honoring the original meme's spirit.
Do NOT include text overlays.`;
      break;

    default:
      throw new Error('Invalid remix mode');
  }

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Image generation is not configured. Please add OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    const body: RemixRequest = await request.json();
    const { mode, meme } = body;

    if (!mode || !meme) {
      return NextResponse.json(
        { error: 'Missing mode or meme data' },
        { status: 400 }
      );
    }

    // Build the prompt based on mode
    const prompt = buildRemixPrompt(body);
    console.log('Generating remix with prompt:', prompt.slice(0, 300) + '...');

    // Generate with DALL-E 3
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
      mode,
      meme: meme.name,
    });

  } catch (error) {
    console.error('Remix generation error:', error);

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
