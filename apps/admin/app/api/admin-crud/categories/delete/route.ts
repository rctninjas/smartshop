import { NextResponse } from 'next/server';
import { upstreamJson } from '../../_lib/upstream';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return NextResponse.redirect(new URL('/categories?error=1', request.url));
  }

  const response = await upstreamJson(request, `/api/categories/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL('/categories?error=1', request.url));
  }

  return NextResponse.redirect(new URL('/categories?deleted=1', request.url));
}
