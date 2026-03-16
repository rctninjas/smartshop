import { upstreamJson } from '../../_lib/upstream';
import { redirectRelative } from '../../../_lib/redirect';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const idFromBody = String(formData.get('id') ?? '').trim();
  const idFromQuery = requestUrl.searchParams.get('id')?.trim() ?? '';
  const id = idFromBody || idFromQuery;
  if (!id) {
    return redirectRelative('/admin/catalog?error=1');
  }

  const response = await upstreamJson(request, `/api/catalog/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    return redirectRelative('/admin/catalog?error=1');
  }

  return redirectRelative('/admin/catalog?deleted=1');
}
