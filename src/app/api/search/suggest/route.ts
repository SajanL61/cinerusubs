import { z } from 'zod';
import { apiError } from '@/lib/http';
import { enforceRateLimit } from '@/lib/rate-limit';
import { getSearchSuggestions } from '@/services/catalog';

export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, 'search-suggest', 90, 60_000);
    const q = z.string().trim().min(2).max(100).parse(new URL(request.url).searchParams.get('q'));
    const items = await getSearchSuggestions(q);
    return Response.json({ items }, { headers: { 'Cache-Control': 'private, max-age=30' } });
  } catch (error) { return apiError(error); }
}
