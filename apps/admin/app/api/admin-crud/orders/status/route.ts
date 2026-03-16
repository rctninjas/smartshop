import { NextResponse } from 'next/server';
import { upstreamJson } from '../../_lib/upstream';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return NextResponse.redirect(new URL('/orders?error=1', request.url));
  }

  const status = String(formData.get('status') ?? '');
  const trackNumber = String(formData.get('trackNumber') ?? '').trim();

  const response = await upstreamJson(request, `/api/orders/${id}/status`, {
    method: 'PATCH',
    body: {
      status,
      ...(trackNumber ? { trackNumber } : {})
    }
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL(`/orders/${id}?error=1`, request.url));
  }

  return NextResponse.redirect(new URL(`/orders/${id}?saved=1`, request.url));
}
