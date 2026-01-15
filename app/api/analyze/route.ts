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

    console.log("=== CLAUDE ANALYSIS START ===");
    console.log("Mode:", mode);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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
              text: `Analyze this image and create a detailed character/subject description for AI image generation.

FOCUS ON THESE DETAILS:

1. **FACE** (most critical for consistency):
   - Face shape (oval, square, round, heart)
   - Skin tone (specific shade: pale, fair, olive, tan, brown, dark)
   - Eye color and shape
   - Nose and lip characteristics
   - Facial hair (if any) - exact style and color
   - Age range and distinguishing marks

2. **HAIR**:
   - Exact color (chestnut brown, jet black, platinum blonde, etc.)
   - Style (straight, curly, wavy, braided, dreadlocks)
   - Length and how it falls

3. **CLOTHING & ACCESSORIES**:
   - Each visible piece with colors and materials
   - Jewelry, glasses, hats, etc.

4. **POSE & EXPRESSION**:
   - Body position
   - Facial expression and mood
   - Direction of gaze

5. **SETTING & LIGHTING**:
   - Environment/background
   - Lighting direction and quality
   - Atmosphere

OUTPUT: Write a single detailed paragraph describing this exact person/subject. Be extremely specific about facial features so AI can maintain consistency across multiple images. Start directly with the description - no preamble.`
            }
          ],
        }
      ],
    });

    let characterDescription = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        characterDescription = block.text;
        break;
      }
    }

    // Temizle
    characterDescription = characterDescription
      .replace(/^["']|["']$/g, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^(The image shows |This shows |I see |In this image, |This is |Here is |Looking at )/i, '')
      .trim();

    console.log("Character description length:", characterDescription.length);

    // Grid prompt oluştur
    const finalPrompt = buildFinalPrompt(characterDescription, mode);

    console.log("=== CLAUDE ANALYSIS COMPLETE ===");
    console.log("Final prompt preview:", finalPrompt.substring(0, 200) + "...");

    return NextResponse.json({
      prompt: finalPrompt,
      characterDescription: characterDescription
    });

  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

function buildFinalPrompt(characterDescription: string, mode: string): string {

  switch (mode) {
    case "angles":
      return `Create a seamless 3x3 grid of 9 cinematic camera angles showing: ${characterDescription}

GRID REQUIREMENTS:
- NO white borders or gaps between panels
- Each panel edge-to-edge, flowing into the next
- The SAME EXACT person in ALL 9 panels - identical face, identical features

9 CAMERA ANGLES (left to right, top to bottom):
1. WIDE SHOT - full body, environment visible
2. MEDIUM WIDE - head to knees
3. MEDIUM SHOT - waist up, classic portrait
4. MEDIUM CLOSE-UP - chest and head
5. CLOSE-UP - face fills 70% of frame
6. THREE-QUARTER VIEW - face angled 45°, dramatic
7. LOW ANGLE - camera below eye level, heroic
8. HIGH ANGLE - camera above, looking down
9. PROFILE - side view with rim lighting

CRITICAL: Face must be clearly visible in ALL panels. Same skin tone, same facial structure, same person throughout. Cinematic, photorealistic, 8K quality.`;

    case "thumbnail":
      return `Create a seamless 3x3 grid of 9 YouTube thumbnail variations showing: ${characterDescription}

GRID REQUIREMENTS:
- NO white borders or gaps between panels
- Each panel edge-to-edge, flowing into the next
- The SAME EXACT person in ALL 9 panels - identical face, identical features

9 THUMBNAIL COMPOSITIONS (each COMPLETELY DIFFERENT camera angle and pose):
1. WIDE ACTION SHOT - full body in dynamic motion, running or jumping
2. MEDIUM SHOT - waist up, pointing directly at camera with urgency
3. EXTREME CLOSE-UP - only eyes and forehead filling frame, intense stare
4. SHOCKED REACTION - hands on cheeks, mouth wide open, surprised
5. OVER-SHOULDER LOOK - turning back toward camera, mysterious glance
6. LOW ANGLE HERO - camera below looking up, powerful dominant pose
7. SIDE PROFILE - dramatic rim lighting, thoughtful or determined look
8. CELEBRATION - fist pump or arms raised high, pure joy and excitement
9. CURIOUS/CONFUSED - head tilted, one eyebrow raised, questioning expression

CRITICAL RULES:
- Each panel MUST have DIFFERENT camera angle (wide/medium/close-up/extreme close-up)
- Each panel MUST have DIFFERENT body pose and gesture
- Each panel MUST have DIFFERENT facial expression
- This is NOT about color filters - it's about VARIETY in composition
- YouTube thumbnail energy: clickbait-worthy, dramatic, eye-catching
- Photorealistic quality, professional lighting`;

    case "storyboard":
      return `Create a seamless 3x3 grid of 9 sequential storyboard panels showing: ${characterDescription}

GRID REQUIREMENTS:
- NO white borders or gaps between panels
- Each panel edge-to-edge, flowing into the next
- The SAME EXACT person in ALL 9 panels - identical face, identical features

9 STORY BEATS (read left to right, top to bottom):
1. ESTABLISHING - calm moment, wide shot
2. TENSION - notices something, medium shot
3. REACTION - close-up, concern/interest
4. ACTION BEGINS - starts moving, wide shot
5. PEAK ACTION - dynamic movement, medium
6. INTENSITY - extreme close-up, emotion
7. CLIMAX - dramatic action, full body
8. RESOLUTION - medium shot, conflict ending
9. CONCLUSION - close-up, final emotion

CRITICAL: Same character throughout. Time progresses but person stays consistent. Cinematic storyboard quality, film-like.`;

    default:
      return `Create a seamless 3x3 grid showing 9 variations of: ${characterDescription}. NO borders, NO gaps. Photorealistic, cinematic.`;
  }
}