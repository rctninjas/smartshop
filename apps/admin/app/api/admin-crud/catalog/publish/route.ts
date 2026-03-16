import { NextResponse } from 'next/server';
import { parseBoolean } from '../../_lib/parsers';
import { upstreamJson } from '../../_lib/upstream';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return NextResponse.redirect(new URL('/admin/catalog?error=1', request.url));
  }

  const isPublished = parseBoolean(formData.get('isPublished'));
  const response = await upstreamJson(request, `/api/catalog/${id}/publish`, {
    method: 'PATCH',
    body: { isPublished }
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL('/admin/catalog?error=1', request.url));
  }

  return NextResponse.redirect(new URL('/admin/catalog?saved=1', request.url));
}
