import { NextResponse } from 'next/server';
import { upstreamJson } from '../../../_lib/upstream';

export async function POST(request: Request) {
  const formData = await request.formData();
  const categoryId = String(formData.get('categoryId') ?? '');
  if (!categoryId) {
    return NextResponse.redirect(new URL('/categories?error=1', request.url));
  }

  const response = await upstreamJson(request, `/api/categories/${categoryId}/attributes/schema/publish`, {
    method: 'POST'
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL(`/categories/${categoryId}?error=1`, request.url));
  }

  return NextResponse.redirect(new URL(`/categories/${categoryId}?published=1`, request.url));
}
