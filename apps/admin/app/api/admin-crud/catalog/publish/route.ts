import { parseBoolean } from '../../_lib/parsers';
import { upstreamJson } from '../../_lib/upstream';
import { redirectRelative } from '../../../_lib/redirect';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return redirectRelative('/admin/catalog?error=1');
  }

  const isPublished = parseBoolean(formData.get('isPublished'));
  const response = await upstreamJson(request, `/api/catalog/${id}/publish`, {
    method: 'PATCH',
    body: { isPublished }
  });

  if (!response.ok) {
    return redirectRelative('/admin/catalog?error=1');
  }

  return redirectRelative('/admin/catalog?saved=1');
}
