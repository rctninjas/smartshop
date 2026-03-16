import { NextResponse } from 'next/server';
import type { ProductImageUploadDto } from '@smartshop/types';

const fallbackApiUrl = 'http://localhost:4000';

function resolveApiBaseUrl() {
  return process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl;
}

type UploadResult =
  | { ok: true; image: ProductImageUploadDto }
  | { ok: false; status: number; code: string; message: string };

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        status: 400,
        code: 'ADMIN_CATALOG_IMAGE_FILE_REQUIRED',
        message: 'Image file is required'
      },
      { status: 400 }
    );
  }

  const uploadForm = new FormData();
  uploadForm.set('file', file);

  const upstream = await fetch(`${resolveApiBaseUrl()}/api/catalog/images/upload`, {
    method: 'POST',
    headers: {
      cookie: request.headers.get('cookie') ?? ''
    },
    body: uploadForm,
    cache: 'no-store'
  });

  if (!upstream.ok) {
    let errorPayload: { code?: string; message?: string } = {};
    try {
      errorPayload = (await upstream.json()) as { code?: string; message?: string };
    } catch {
      errorPayload = {};
    }

    return NextResponse.json(
      {
        ok: false,
        status: upstream.status,
        code: errorPayload.code ?? 'ADMIN_CATALOG_IMAGE_UPLOAD_FAILED',
        message: errorPayload.message ?? 'Failed to upload image'
      } satisfies UploadResult,
      { status: upstream.status }
    );
  }

  const image = (await upstream.json()) as ProductImageUploadDto;
  return NextResponse.json({
    ok: true,
    image
  } satisfies UploadResult);
}
