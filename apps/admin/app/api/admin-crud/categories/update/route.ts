import { parseNumber } from '../../_lib/parsers';
import { upstreamJson } from '../../_lib/upstream';
import { redirectRelative } from '../../../_lib/redirect';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return redirectRelative('/admin/categories?error=1');
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
    return redirectRelative(`/admin/categories/${id}?error=1`);
  }

  return redirectRelative(`/admin/categories/${id}?saved=1`);
}
