import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, aspect } = await request.json();

    if (!image || !prompt) {
      return NextResponse.json({ error: 'Image and prompt required' }, { status: 400 });
    }

    const FAL_KEY = process.env.FAL_KEY;
    
    if (!FAL_KEY) {
      console.error("FAL_KEY not found in environment");
      return NextResponse.json({ error: 'FAL API key not configured' }, { status: 500 });
    }

    console.log("=== FAL.AI GENERATION ===");

    // Aspect ratio'yu FAL.AI formatına çevir
    const getImageSize = (aspect: string) => {
      switch (aspect) {
        case "16:9":
          return "landscape_16_9";
        case "9:16":
          return "portrait_16_9";
        case "1:1":
          return "square";
        default:
          return "landscape_16_9";
      }
    };

    const requestBody = {
      prompt: prompt,
      image_urls: [image],
      guidance_scale: 7.5, // Increased from 3.5 for better prompt adherence
      num_inference_steps: 35, // Increased from 28 for better quality
      image_size: getImageSize(aspect),
      num_images: 1,
      enable_safety_checker: false,
    };

    // SYNC endpoint for direct response
    const response = await fetch("https://fal.run/fal-ai/flux-2/edit", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("FAL.AI Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("FAL.AI Error Response:", errorText);
      return NextResponse.json({ 
        error: `FAL.AI error: ${response.status}` 
      }, { status: 500 });
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      return NextResponse.json({ 
        success: true, 
        imageUrl: data.images[0].url 
      });
    }

    return NextResponse.json({ 
      error: "No image generated" 
    }, { status: 500 });

  } catch (error) {
    console.error('FAL.AI API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'FAL.AI generation failed' 
    }, { status: 500 });
  }
}