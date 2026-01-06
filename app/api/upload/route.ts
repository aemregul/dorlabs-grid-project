import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    // Base64'ten sadece data kısmını al
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    // ImgBB API key
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '80f6fb32d90048c0833c566100e984af';
    
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    console.log('ImgBB response:', data);
    
    if (data.success) {
      return NextResponse.json({ url: data.data.url });
    } else {
      console.error('ImgBB upload failed:', data);
      return NextResponse.json({ error: 'Upload failed', details: data }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}