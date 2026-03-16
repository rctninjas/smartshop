import { NextResponse } from 'next/server';
import type { CategoryAttributeFieldDto } from '@smartshop/types';
import { parseJsonArray } from '../../../_lib/parsers';
import { upstreamJson } from '../../../_lib/upstream';

export async function POST(request: Request) {
  const formData = await request.formData();
  const categoryId = String(formData.get('categoryId') ?? '');
  if (!categoryId) {
    return NextResponse.redirect(new URL('/categories?error=1', request.url));
  }

  const fields = parseJsonArray<CategoryAttributeFieldDto>(formData.get('fields'));

  const draftResponse = await upstreamJson(request, `/api/categories/${categoryId}/attributes/schema/draft`, {
    method: 'POST'
  });
  if (!draftResponse.ok) {
    return NextResponse.redirect(new URL(`/categories/${categoryId}?error=1`, request.url));
  }

  const updateResponse = await upstreamJson(request, `/api/categories/${categoryId}/attributes/schema/draft`, {
    method: 'PATCH',
    body: { fields }
  });
  if (!updateResponse.ok) {
    return NextResponse.redirect(new URL(`/categories/${categoryId}?error=1`, request.url));
  }

  return NextResponse.redirect(new URL(`/categories/${categoryId}?draftSaved=1`, request.url));
}
