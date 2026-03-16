import { NextResponse } from 'next/server';
import { parseJsonArray, parseNullableNumber, parseNumber } from '../../_lib/parsers';
import { upstreamJson } from '../../_lib/upstream';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return NextResponse.json(
      {
        ok: false,
        status: 400,
        code: 'ADMIN_CATALOG_ID_REQUIRED',
        message: 'Product id is required'
      },
      { status: 400 }
    );
  }

  const variants = parseJsonArray<Array<{ sku: string; color: string; size: string; stock?: number }>[number]>(
    formData.get('variants')
  );
  const images = parseJsonArray<
    Array<{
      url: string;
      originalUrl?: string;
      previewSmUrl?: string;
      previewMediumUrl?: string;
      sortOrder?: number;
    }>[number]
  >(formData.get('images'));
  const attributesSnapshot = (() => {
    const raw = formData.get('attributesSnapshot');
    if (typeof raw !== 'string' || raw.trim() === '') {
      return {};
    }
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  })();

  const response = await upstreamJson(request, `/api/catalog/${id}`, {
    method: 'PATCH',
    body: {
      title: String(formData.get('title') ?? ''),
      itemNumber: String(formData.get('itemNumber') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      description: String(formData.get('description') ?? ''),
      categoryId: String(formData.get('categoryId') ?? ''),
      price: parseNumber(formData.get('price')),
      sale: parseNullableNumber(formData.get('sale')),
      variants,
      images,
      attributesSnapshot
    }
  });

  if (!response.ok) {
    let errorPayload: { code?: string; message?: string } = {};
    try {
      errorPayload = (await response.json()) as { code?: string; message?: string };
    } catch {
      errorPayload = {};
    }
    return NextResponse.json(
      {
        ok: false,
        status: response.status,
        code: errorPayload.code ?? 'ADMIN_CATALOG_UPDATE_FAILED',
        message: errorPayload.message ?? 'Failed to update product'
      },
      { status: response.status }
    );
  }

  return NextResponse.json({
    ok: true,
    redirectTo: `/admin/catalog/${id}?saved=1`
  });
}
