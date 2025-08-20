import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToPinata } from '@/lib/pinataUpload';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const address = formData.get('address') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({ error: 'No address provided' }, { status: 400 })   ;
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Upload to Pinata
    console.log('Uploading banner to Pinata for address:', address);
    const result = await uploadFileToPinata(file);
    
    console.log('Banner upload result:', result);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Update profile with new banner CID
    const { error } = await supabase
      .from('profiles')
      .update({
        banner_cid: result.data.IpfsHash,
        updated_at: new Date().toISOString(),
      })
      .ilike('address', address);

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // If there was an old banner, we could optionally remove it from Pinata here
    // But we'll keep it for now to avoid breaking existing references

    return NextResponse.json({
      success: true,
      cid: result.data.IpfsHash,
      message: 'Banner uploaded successfully'
    });

  } catch (error) {
    console.error('Banner upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
