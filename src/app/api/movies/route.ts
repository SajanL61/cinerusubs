import { z } from 'zod';
import { apiError } from '@/lib/http';
import { getMovies } from '@/services/catalog';

const querySchema = z.object({ q: z.string().max(100).optional(), genre: z.string().max(60).optional(), language: z.string().max(60).optional(), country: z.string().max(60).optional(), year: z.string().regex(/^\d{4}$/).optional(), rating: z.string().optional(), quality: z.string().max(30).optional(), subtitleLanguage: z.string().max(40).optional(), sort: z.enum(['trending','newest','rating','popularity','views','downloads']).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(48).default(24) });
export async function GET(request:Request){try{const raw=Object.fromEntries(new URL(request.url).searchParams);const query=querySchema.parse(raw);const movies=await getMovies(query);const start=(query.page-1)*query.limit;return Response.json({items:movies.slice(start,start+query.limit),page:query.page,pages:Math.ceil(movies.length/query.limit),total:movies.length},{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'}})}catch(error){return apiError(error)}}
