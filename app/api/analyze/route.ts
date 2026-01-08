import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image, mode, aspect } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: getPromptForMode(mode, aspect)
            }
          ],
        }
      ],
    });

    const generatedPrompt = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

function getPromptForMode(mode: string, aspect: string): string {
  const baseInstruction = `Look at this image carefully. Describe the main subject in detail: their exact appearance, clothing, facial features, hair, and the setting.`;

  switch (mode) {
    case 'angles':
      return `${baseInstruction}

Create a prompt for a 3x3 grid showing 9 DIFFERENT CAMERA ANGLES of this EXACT scene and character.

Requirements:
- Keep the SAME person with IDENTICAL face and clothes in ALL panels
- Each panel = different camera angle (wide, medium, close-up, low angle, high angle, etc.)
- Photorealistic quality, cinematic lighting
- ${aspect} aspect ratio

Format your response as a single image generation prompt. Include:
1. Detailed character description (face, hair, clothes, expression)
2. Setting description
3. "3x3 grid, 9 panels, different camera angles"
4. "Same character in all panels, photorealistic, NO TEXT"

Output ONLY the prompt, nothing else.`;

    case 'thumbnail':
      return `${baseInstruction}

Create a prompt for a 3x3 grid of 9 YouTube clickbait thumbnails.

Requirements:
- Keep the character recognizable in all panels
- Each panel has DIFFERENT color scheme (red, blue, yellow, green, purple, orange)
- Add SHORT text overlays (1-2 words max): "WOW!", "NO WAY!", "WHAT?!", "OMG!", "EPIC!", "INSANE!", "FINALLY!", "SECRET!", "THE END!"
- Add arrows, emojis, dramatic lighting
- ${aspect} aspect ratio

Format your response as a single image generation prompt. Include:
1. Character description
2. "3x3 grid, 9 YouTube thumbnail panels"
3. Specific color and text for each panel
4. "Clickbait style, dramatic expressions, bold text overlays"

Output ONLY the prompt, nothing else.`;

    case 'storyboard':
      return `${baseInstruction}

Create a prompt for a 3x3 grid showing 9 SEQUENTIAL STORY MOMENTS.

Requirements:
- Keep the SAME character with IDENTICAL appearance in ALL panels
- Show a story progression: beginning → middle → end
- Mix camera angles (wide establishing shots, medium shots, close-ups)
- Each panel = different moment in time, NOT the same moment
- Photorealistic, cinematic quality
- ${aspect} aspect ratio

Format your response as a single image generation prompt. Include:
1. Detailed character description (must stay consistent)
2. Setting description
3. Brief description of what happens in each panel (Panel 1: ..., Panel 2: ..., etc.)
4. "3x3 grid, 9 panels, sequential story, same character throughout"
5. "Photorealistic, cinematic, NO TEXT, NO LABELS"

Output ONLY the prompt, nothing else.`;

    default:
      return `${baseInstruction}

Create a prompt for a 3x3 grid of 9 variations of this image.
Keep the same character, vary the camera angles.
${aspect} aspect ratio, photorealistic, NO TEXT.

Output ONLY the prompt.`;
  }
}