import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;

    if (!file || !key) {
      return NextResponse.json({ success: false, reason: 'Missing file or key' }, { status: 400 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file, file.name);

    const response = await fetch(
      `https://s-ul.eu/api/v1/upload?wizard=true&key=${key}`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    console.warn(response);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, reason: 'Upload failed', error: error }, { status: 500 });
  }
}
