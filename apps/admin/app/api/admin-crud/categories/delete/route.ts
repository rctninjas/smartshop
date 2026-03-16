import { upstreamJson } from '../../_lib/upstream';
import { redirectRelative } from '../../../_lib/redirect';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return redirectRelative('/admin/categories?error=1');
  }

  const response = await upstreamJson(request, `/api/categories/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    return redirectRelative('/admin/categories?error=1');
  }

  return redirectRelative('/admin/categories?deleted=1');
}
