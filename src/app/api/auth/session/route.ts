import { currentSession } from '@/lib/auth';

export async function GET() {
  const session = await currentSession();
  return Response.json({ user: session?.user ?? null, expiresAt: session?.expiresAt ?? null }, { headers: { 'Cache-Control': 'private, no-store' } });
}
