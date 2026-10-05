import { requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { listObjectKeys } from '@/lib/r2';
import { MediaAsset } from '@/models';

export async function GET() {
  try {
    await requirePermission('media.read');
    await connectDb();
    const [remote, assets] = await Promise.all([listObjectKeys(), MediaAsset.find().select('objectKey status').lean()]);
    const remoteSet = new Set(remote.keys);
    const databaseSet = new Set(assets.map((asset) => String(asset.objectKey)));
    const missing = assets.filter((asset) => asset.status === 'active' && !remoteSet.has(String(asset.objectKey))).map((asset) => String(asset.objectKey));
    const orphaned = remote.keys.filter((key) => !databaseSet.has(key));
    return Response.json({ scanned: remote.keys.length, capped: remote.capped, missing: { count: missing.length, sample: missing.slice(0, 100) }, orphaned: { count: orphaned.length, sample: orphaned.slice(0, 100) } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}
