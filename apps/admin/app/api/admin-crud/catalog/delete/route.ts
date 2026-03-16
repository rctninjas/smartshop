import { NextResponse } from 'next/server';
import { upstreamJson } from '../../_lib/upstream';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const idFromBody = String(formData.get('id') ?? '').trim();
  const idFromQuery = requestUrl.searchParams.get('id')?.trim() ?? '';
  const id = idFromBody || idFromQuery;
  if (!id) {
    return NextResponse.redirect(new URL('/catalog?error=1', request.url));
  }

  const response = await upstreamJson(request, `/api/catalog/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL('/catalog?error=1', request.url));
  }

  return NextResponse.redirect(new URL('/catalog?deleted=1', request.url));
}
