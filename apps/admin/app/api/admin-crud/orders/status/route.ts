import { upstreamJson } from '../../_lib/upstream';
import { redirectRelative } from '../../../_lib/redirect';

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return redirectRelative('/admin/orders?error=1');
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
    return redirectRelative(`/admin/orders/${id}?error=1`);
  }

  return redirectRelative(`/admin/orders/${id}?saved=1`);
}
