import { NextRequest, NextResponse } from 'next/server';
import { getMemeTemplates, getTemplateById } from '@/lib/imgflip';
import { matchTweetToMemes, MemeMatch } from '@/lib/claude';
import { incrementUsage, isPremium } from '@/lib/usage';

export interface MatchMemeRequest {
  tweet: string;
  feedback?: string;
  previousIds?: string[];
}

export interface MatchMemeResponse {
  matches: Array<
    MemeMatch & {
      templateUrl: string;
      width: number;
      height: number;
    }
  >;
  modified?: boolean;
  modifiedTweet?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MatchMemeRequest = await request.json();

    if (!body.tweet || body.tweet.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tweet text is required' },
        { status: 400 }
      );
    }

    if (body.tweet.length > 500) {
      return NextResponse.json(
        { error: 'Tweet text too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Get meme templates
    const templates = await getMemeTemplates();

    // Match tweet to memes using Claude
    const result = await matchTweetToMemes(
      body.tweet,
      templates,
      body.feedback,
      body.previousIds
    );

    // Enrich matches with template data
    const enrichedMatches = result.matches.map((match) => {
      const template = getTemplateById(templates, match.templateId);
      return {
        ...match,
        templateUrl: template?.url || '',
        width: template?.width || 500,
        height: template?.height || 500,
      };
    });

    // Increment usage counter (only for non-premium users)
    const premium = await isPremium();
    if (!premium) {
      await incrementUsage();
    }

    return NextResponse.json({
      matches: enrichedMatches,
      modified: result.modified,
      modifiedTweet: result.modifiedTweet,
      message: result.message,
    });
  } catch (error) {
    console.error('Match meme error:', error);

    // Even on error, try to return fallback memes
    try {
      const templates = await getMemeTemplates();
      const fallbackMatches = templates.slice(0, 3).map((t) => ({
        templateId: t.id,
        templateName: t.name,
        reasoning: 'A popular meme template',
        suggestedTopText: 'When you try something new',
        suggestedBottomText: 'And it actually works',
        textBoxes: [
          { position: 'top', text: 'When you try something new' },
          { position: 'bottom', text: 'And it actually works' },
        ],
        format: 'top-bottom',
        templateUrl: t.url,
        width: t.width,
        height: t.height,
      }));

      return NextResponse.json({
        matches: fallbackMatches,
        modified: true,
        message: 'We had trouble analyzing your tweet, but here are some popular memes to try!',
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to match memes. Please try again.' },
        { status: 500 }
      );
    }
  }
}
