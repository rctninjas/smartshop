import { NextResponse } from 'next/server';
import { parseNumber } from '../../_lib/parsers';
import { upstreamJson } from '../../_lib/upstream';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return NextResponse.redirect(new URL('/categories?error=1', request.url));
  }

  const parentIdValue = String(formData.get('parentId') ?? '').trim();
  const response = await upstreamJson(request, `/api/categories/${id}`, {
    method: 'PATCH',
    body: {
      name: String(formData.get('name') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      parentId: parentIdValue || null,
      sortOrder: parseNumber(formData.get('sortOrder'))
    }
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL(`/categories/${id}?error=1`, request.url));
  }

  return NextResponse.redirect(new URL(`/categories/${id}?saved=1`, request.url));
}
