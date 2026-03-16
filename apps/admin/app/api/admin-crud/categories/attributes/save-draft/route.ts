import type { CategoryAttributeFieldDto } from '@smartshop/types';
import { parseJsonArray } from '../../../_lib/parsers';
import { upstreamJson } from '../../../_lib/upstream';
import { redirectRelative } from '../../../../_lib/redirect';

export async function POST(request: Request) {
  const formData = await request.formData();
  const categoryId = String(formData.get('categoryId') ?? '');
  if (!categoryId) {
    return redirectRelative('/admin/categories?error=1');
  }

  const fields = parseJsonArray<CategoryAttributeFieldDto>(formData.get('fields'));

  const draftResponse = await upstreamJson(request, `/api/categories/${categoryId}/attributes/schema/draft`, {
    method: 'POST'
  });
  if (!draftResponse.ok) {
    return redirectRelative(`/admin/categories/${categoryId}?error=1`);
  }

  const updateResponse = await upstreamJson(request, `/api/categories/${categoryId}/attributes/schema/draft`, {
    method: 'PATCH',
    body: { fields }
  });
  if (!updateResponse.ok) {
    return redirectRelative(`/admin/categories/${categoryId}?error=1`);
  }

  return redirectRelative(`/admin/categories/${categoryId}?draftSaved=1`);
}
