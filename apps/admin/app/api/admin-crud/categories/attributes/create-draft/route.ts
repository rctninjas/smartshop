import { upstreamJson } from '../../../_lib/upstream';
import { redirectRelative } from '../../../../_lib/redirect';

export async function POST(request: Request) {
  const formData = await request.formData();
  const categoryId = String(formData.get('categoryId') ?? '');
  if (!categoryId) {
    return redirectRelative('/admin/categories?error=1');
  }

  const response = await upstreamJson(request, `/api/categories/${categoryId}/attributes/schema/draft`, {
    method: 'POST'
  });

  if (!response.ok) {
    return redirectRelative(`/admin/categories/${categoryId}?error=1`);
  }

  return redirectRelative(`/admin/categories/${categoryId}?draft=1`);
}
