import type { Model } from 'mongoose';
import { publicAssetObjectKeyFromUrl } from '../src/lib/assets';
import { connectDb, disconnectDb } from '../src/lib/db';
import { publicAssetOrigin } from '../src/lib/env';
import { Episode, Movie, Series, TranslatorProfile } from '../src/models/index';

if (!publicAssetOrigin) throw new Error('PUBLIC_ASSET_DOMAIN is required for the public asset URL audit.');

const targets: Array<{ label: string; model: Model<Record<string, unknown>>; fields: string[] }> = [
  { label: 'movies', model: Movie as unknown as Model<Record<string, unknown>>, fields: ['posterUrl', 'backdropUrl'] },
  { label: 'series', model: Series as unknown as Model<Record<string, unknown>>, fields: ['posterUrl', 'backdropUrl'] },
  { label: 'episodes', model: Episode as unknown as Model<Record<string, unknown>>, fields: ['thumbnailUrl'] },
  { label: 'translators', model: TranslatorProfile as unknown as Model<Record<string, unknown>>, fields: ['avatarUrl'] },
];

try {
  await connectDb();
  let changedRecords = 0;
  let changedFields = 0;
  const escapedOrigin = publicAssetOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const target of targets) {
    const rows = await target.model.find({ $or: target.fields.map((field) => ({ [field]: { $regex: `^${escapedOrigin}/` } })) }).select(['_id', ...target.fields].join(' ')).lean();
    let targetChanges = 0;
    for (const row of rows) {
      const fields = target.fields.filter((field) => Boolean(publicAssetObjectKeyFromUrl(row[field])));
      if (!fields.length) continue;
      changedRecords++;
      changedFields += fields.length;
      targetChanges++;
    }
    process.stdout.write(`${target.label}: ${targetChanges} record(s) could be converted to object keys\n`);
  }
  process.stdout.write(`Read-only audit complete: ${changedRecords} record(s), ${changedFields} field(s). No database values were changed.\n`);
} finally {
  await disconnectDb();
}
