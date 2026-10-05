import 'server-only';
import type { Model } from 'mongoose';
import { connectDb } from '@/lib/db';
import {
  AuditLog, Comment, ContactMessage, DownloadEvent, Genre, HomepageSection, Language, MediaAsset, Movie, Report,
  SearchEvent, Series, SiteSetting, Subtitle, TakedownRequest, TranslatorProfile, User,
} from '@/models';

type ResourceKey = 'movies' | 'series' | 'subtitles' | 'translators' | 'users' | 'comments' | 'reports' | 'homepage' | 'taxonomies' | 'media' | 'takedowns' | 'settings' | 'audit' | 'messages';
type ResourceDefinition = { model: Model<Record<string, unknown>>; searchField: string; select: string; titleField: string; secondaryField?: string };

const resources: Record<ResourceKey, ResourceDefinition> = {
  movies: { model: Movie, searchField: 'title', select: 'title slug year publicationStatus rightsStatus updatedAt', titleField: 'title', secondaryField: 'slug' },
  series: { model: Series, searchField: 'title', select: 'title slug year publicationStatus rightsStatus updatedAt', titleField: 'title', secondaryField: 'slug' },
  subtitles: { model: Subtitle, searchField: 'fileName', select: 'fileName language format status verified downloadCount updatedAt', titleField: 'fileName', secondaryField: 'language' },
  translators: { model: TranslatorProfile, searchField: 'displayName', select: 'displayName slug verified totalSubtitles totalDownloads updatedAt', titleField: 'displayName', secondaryField: 'slug' },
  users: { model: User, searchField: 'email', select: 'name displayName email role active lastLoginAt updatedAt', titleField: 'displayName', secondaryField: 'email' },
  comments: { model: Comment, searchField: 'body', select: 'body targetType status likeCount createdAt updatedAt', titleField: 'body', secondaryField: 'targetType' },
  reports: { model: Report, searchField: 'reason', select: 'reason targetType status details createdAt updatedAt', titleField: 'reason', secondaryField: 'targetType' },
  homepage: { model: HomepageSection, searchField: 'title', select: 'title key type enabled displayOrder updatedAt', titleField: 'title', secondaryField: 'key' },
  taxonomies: { model: Genre, searchField: 'name', select: 'name slug visible displayOrder updatedAt', titleField: 'name', secondaryField: 'slug' },
  media: { model: MediaAsset, searchField: 'fileName', select: 'fileName objectKey kind status size updatedAt', titleField: 'fileName', secondaryField: 'objectKey' },
  takedowns: { model: TakedownRequest, searchField: 'contentUrl', select: 'requester email contentUrl reason status createdAt updatedAt', titleField: 'contentUrl', secondaryField: 'requester' },
  settings: { model: SiteSetting, searchField: 'key', select: 'key value updatedAt', titleField: 'key' },
  audit: { model: AuditLog, searchField: 'action', select: 'action entity entityId createdAt metadata', titleField: 'action', secondaryField: 'entity' },
  messages: { model: ContactMessage, searchField: 'email', select: 'requester email message status createdAt updatedAt', titleField: 'requester', secondaryField: 'email' },
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function getAdminCollection(resource: ResourceKey, query = '', page = 1) {
  await connectDb();
  const definition = resources[resource];
  const filter = query ? { [definition.searchField]: { $regex: escapeRegex(query.slice(0, 80)), $options: 'i' } } : {};
  const [rawItems, total] = await Promise.all([
    definition.model.find(filter).select(definition.select).sort({ updatedAt: -1, createdAt: -1 }).skip((page - 1) * 30).limit(30).lean(),
    definition.model.countDocuments(filter),
  ]);
  const items = rawItems.map((item) => item as unknown as Record<string, unknown>);
  if (resource === 'taxonomies') {
    const languages = await Language.find(filter).select(definition.select).sort({ displayOrder: 1, name: 1 }).limit(30).lean();
    items.push(...languages.map((item) => ({ ...(item as unknown as Record<string, unknown>), taxonomyType: 'Language' })));
  }
  return { items: items.map((item) => JSON.parse(JSON.stringify(item)) as Record<string, unknown>), total, titleField: definition.titleField, secondaryField: definition.secondaryField };
}

export async function getAdminAnalytics() {
  await connectDb();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [downloads, searches, topDownloads, topSearches] = await Promise.all([
    DownloadEvent.countDocuments({ createdAt: { $gte: since } }), SearchEvent.countDocuments({ createdAt: { $gte: since } }),
    DownloadEvent.aggregate<{ _id: { kind: string; targetId: unknown }; count: number }>([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { kind: '$kind', targetId: '$targetId' }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    SearchEvent.aggregate<{ _id: string; count: number }>([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$normalizedQuery', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
  ]);
  return { downloads, searches, topDownloads, topSearches };
}

export async function getAdminOverview() {
  await connectDb();
  const [movies, series, subtitles, users, openReports, openTakedowns, downloads, recentAudit] = await Promise.all([
    Movie.countDocuments(), Series.countDocuments(), Subtitle.countDocuments(), User.countDocuments(), Report.countDocuments({ status: { $in: ['new', 'reviewing'] } }),
    TakedownRequest.countDocuments({ status: { $in: ['new', 'reviewing'] } }), DownloadEvent.countDocuments(), AuditLog.find().select('action entity entityId createdAt').sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  return { movies, series, subtitles, users, openReports, openTakedowns, downloads, recentAudit: recentAudit.map((item) => JSON.parse(JSON.stringify(item)) as Record<string, unknown>) };
}

export async function getStorageStats() {
  await connectDb();
  const rows = await MediaAsset.aggregate<{ _id: string; bytes: number; count: number }>([
    { $match: { status: { $ne: 'disabled' } } },
    { $group: { _id: '$kind', bytes: { $sum: { $ifNull: ['$size', 0] } }, count: { $sum: 1 } } },
    { $sort: { bytes: -1 } },
  ]);
  return { rows, totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0), totalFiles: rows.reduce((sum, row) => sum + row.count, 0) };
}

export type { ResourceKey };
