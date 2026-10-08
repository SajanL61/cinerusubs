import mongoose, { type Model, Schema } from 'mongoose';
import { RIGHTS_STATUSES } from '@/types/content';

type LooseDocument = Record<string, unknown>;
const existingOrCreate = (name: string, schema: Schema) =>
  (mongoose.models[name] as Model<LooseDocument> | undefined) ?? mongoose.model<LooseDocument>(name, schema);

const slug = { type: String, required: true, unique: true, lowercase: true, trim: true, index: true };
const objectKey = { type: String, trim: true };
const publication = { type: String, enum: ['draft', 'scheduled', 'published', 'archived'], default: 'draft', index: true };
const rights = { type: String, enum: RIGHTS_STATUSES, required: true, default: 'subtitle_only', index: true };
const personCreditSchema = new Schema(
  { name: { type: String, required: true }, slug: { type: String, required: true }, role: String, character: String, profileKey: String },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    displayName: { type: String, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'editor', 'translator', 'moderator', 'viewer', 'user'],
      default: 'user',
      index: true,
    },
    permissions: [{ type: String }],
    avatarKey: String,
    locale: { type: String, enum: ['en', 'si'], default: 'en' },
    preferences: { subtitleLanguages: [String], contentLanguages: [String], reducedMotion: Boolean },
    active: { type: Boolean, default: true, index: true },
    emailVerifiedAt: Date,
    passwordChangedAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true },
);

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, select: false },
    csrfHash: { type: String, required: true, select: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    lastSeenAt: Date,
    ipHash: String,
    userAgentHash: String,
  },
  { timestamps: true },
);

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    originalTitle: String,
    sinhalaTitle: String,
    slug,
    overview: { type: String, required: true, maxlength: 8_000 },
    year: { type: Number, required: true, index: true },
    releaseDate: Date,
    runtime: { type: Number, min: 0 },
    ageRating: String,
    genres: [{ type: String, index: true }],
    languages: [{ type: String, index: true }],
    countries: [{ type: String, index: true }],
    releaseType: { type: String, trim: true, maxlength: 32 },
    videoQuality: { type: String, trim: true, maxlength: 16 },
    posterKey: objectKey,
    posterUrl: String,
    backdropKey: objectKey,
    backdropUrl: String,
    trailerUrl: String,
    imdbId: { type: String, sparse: true, index: true },
    tmdbId: { type: String, sparse: true, index: true },
    imdbRating: { type: Number, min: 0, max: 10 },
    tmdbRating: { type: Number, min: 0, max: 10 },
    cast: [personCreditSchema],
    crew: [personCreditSchema],
    rightsStatus: rights,
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    editorPick: { type: Boolean, default: false, index: true },
    viewCount: { type: Number, default: 0, min: 0 },
    subtitleDownloadCount: { type: Number, default: 0, min: 0 },
    publicationStatus: publication,
    publishedAt: Date,
    scheduledAt: Date,
    releaseStatus: { type: String, default: 'released' },
    seo: { title: String, description: String, canonical: String, noindex: Boolean },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, optimisticConcurrency: true },
);
movieSchema.index({ title: 'text', originalTitle: 'text', sinhalaTitle: 'text', overview: 'text' });
movieSchema.index({ publicationStatus: 1, publishedAt: -1 });
movieSchema.index({ publicationStatus: 1, trending: -1, viewCount: -1 });
movieSchema.index({ genres: 1, languages: 1, year: -1 });

const seriesSchema = new Schema(
  {
    title: { type: String, required: true }, originalTitle: String, sinhalaTitle: String, slug, overview: { type: String, required: true },
    year: { type: Number, required: true, index: true }, ageRating: String, genres: [{ type: String, index: true }],
    languages: [{ type: String, index: true }], countries: [{ type: String, index: true }], posterKey: String, posterUrl: String,
    backdropKey: String, backdropUrl: String, trailerUrl: String, imdbId: String, tmdbId: String, imdbRating: Number, tmdbRating: Number,
    cast: [personCreditSchema], crew: [personCreditSchema], status: { type: String, default: 'returning' }, rightsStatus: rights,
    featured: { type: Boolean, default: false, index: true }, trending: { type: Boolean, default: false, index: true },
    viewCount: { type: Number, default: 0 }, publicationStatus: publication, publishedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, optimisticConcurrency: true },
);
seriesSchema.index({ title: 'text', originalTitle: 'text', sinhalaTitle: 'text', overview: 'text' });
seriesSchema.index({ publicationStatus: 1, trending: -1, viewCount: -1 });

const seasonSchema = new Schema(
  {
    series: { type: Schema.Types.ObjectId, ref: 'Series', required: true, index: true }, seasonNumber: { type: Number, required: true },
    title: String, overview: String, posterKey: String, releaseDate: Date, publicationStatus: publication,
  },
  { timestamps: true },
);
seasonSchema.index({ series: 1, seasonNumber: 1 }, { unique: true });

const episodeSchema = new Schema(
  {
    series: { type: Schema.Types.ObjectId, ref: 'Series', required: true, index: true },
    season: { type: Schema.Types.ObjectId, ref: 'Season', required: true, index: true },
    seasonNumber: { type: Number, required: true }, episodeNumber: { type: Number, required: true }, title: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true }, overview: String, runtime: Number, releaseDate: Date, thumbnailKey: String,
    thumbnailUrl: String, rightsStatus: rights, publicationStatus: publication, viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
episodeSchema.index({ series: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });
episodeSchema.index({ series: 1, slug: 1 }, { unique: true });

const subtitleSchema = new Schema(
  {
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', index: true }, series: { type: Schema.Types.ObjectId, ref: 'Series', index: true },
    episode: { type: Schema.Types.ObjectId, ref: 'Episode', index: true }, language: { type: String, required: true, index: true },
    languageCode: { type: String, required: true, lowercase: true, index: true }, translator: { type: Schema.Types.ObjectId, ref: 'TranslatorProfile', required: true, index: true },
    releaseMatches: [{ type: String }], fps: Number, format: { type: String, enum: ['srt', 'ass', 'vtt', 'zip'], required: true },
    hearingImpaired: { type: Boolean, default: false }, fileKey: { type: String, required: true }, fileName: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 1 }, version: { type: Number, default: 1, min: 1 }, verified: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false }, downloadCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['draft', 'published', 'disabled'], default: 'draft', index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }, checksum: String,
  },
  { timestamps: true, optimisticConcurrency: true },
);
subtitleSchema.index({ movie: 1, languageCode: 1, status: 1, createdAt: -1 });
subtitleSchema.index({ episode: 1, languageCode: 1, status: 1, createdAt: -1 });
subtitleSchema.index({ translator: 1, status: 1, createdAt: -1 });

const translatorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true }, slug, displayName: { type: String, required: true },
    avatarKey: String, avatarUrl: String, bio: { type: String, maxlength: 2_000 }, verified: { type: Boolean, default: false, index: true },
    totalSubtitles: { type: Number, default: 0 }, totalDownloads: { type: Number, default: 0 }, averageRating: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const mediaAssetSchema = new Schema(
  {
    objectKey: { type: String, required: true, unique: true }, bucket: { type: String, required: true }, kind: { type: String, enum: ['poster', 'backdrop', 'subtitle', 'media', 'avatar', 'other'], required: true, index: true },
    fileName: String, mimeType: String, size: { type: Number, min: 0 }, checksum: String, status: { type: String, enum: ['pending', 'active', 'missing', 'orphan', 'disabled'], default: 'pending', index: true },
    linkedModel: String, linkedId: Schema.Types.ObjectId, uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }, metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);
mediaAssetSchema.index({ kind: 1, status: 1, createdAt: -1 });

const mediaVersionSchema = new Schema(
  {
    contentId: { type: Schema.Types.ObjectId, required: true, index: true }, contentType: { type: String, enum: ['movie', 'episode'], required: true, index: true },
    quality: String, resolution: String, codec: String, container: String, audioCodec: String, audioLanguages: [String], subtitleLanguages: [String],
    releaseType: String, fileSize: { type: Number, min: 1 }, r2ObjectKey: { type: String, required: true, unique: true }, streamingManifestKey: String,
    rightsStatus: rights, regionRestrictions: [String], active: { type: Boolean, default: false, index: true }, createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);
mediaVersionSchema.index({ contentId: 1, contentType: 1, active: 1 });

const taxonomySchema = new Schema(
  { name: { type: String, required: true }, slug, description: String, localeNames: Schema.Types.Mixed, visible: { type: Boolean, default: true }, displayOrder: { type: Number, default: 0 } },
  { timestamps: true },
);

const collectionSchema = new Schema(
  { name: { type: String, required: true }, slug, description: String, posterKey: String, movieIds: [{ type: Schema.Types.ObjectId, ref: 'Movie' }], seriesIds: [{ type: Schema.Types.ObjectId, ref: 'Series' }], visible: { type: Boolean, default: true }, displayOrder: { type: Number, default: 0 } },
  { timestamps: true },
);

const commentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, targetType: { type: String, enum: ['movie', 'series', 'episode', 'subtitle'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true }, parent: { type: Schema.Types.ObjectId, ref: 'Comment' }, body: { type: String, required: true, maxlength: 2_000 },
    status: { type: String, enum: ['visible', 'hidden', 'deleted'], default: 'visible', index: true }, likeCount: { type: Number, default: 0 }, editedAt: Date,
  },
  { timestamps: true },
);
commentSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });

const commentLikeSchema = new Schema(
  { user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, comment: { type: Schema.Types.ObjectId, ref: 'Comment', required: true, index: true } },
  { timestamps: true },
);
commentLikeSchema.index({ user: 1, comment: 1 }, { unique: true });

const ratingSchema = new Schema(
  { user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, targetType: { type: String, enum: ['movie', 'series', 'subtitle'], required: true }, targetId: { type: Schema.Types.ObjectId, required: true }, value: { type: Number, min: 1, max: 10, required: true } },
  { timestamps: true },
);
ratingSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const watchlistSchema = new Schema(
  { user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, items: [{ contentType: { type: String, enum: ['movie', 'series'] }, contentId: Schema.Types.ObjectId, addedAt: { type: Date, default: Date.now } }] },
  { timestamps: true },
);

const progressSchema = new Schema(
  { user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, contentType: { type: String, enum: ['movie', 'episode'], required: true }, contentId: { type: Schema.Types.ObjectId, required: true }, seconds: { type: Number, min: 0 }, duration: { type: Number, min: 0 }, completed: { type: Boolean, default: false }, lastViewedAt: { type: Date, default: Date.now } },
  { timestamps: true },
);
progressSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true });
progressSchema.index({ user: 1, lastViewedAt: -1 });

const downloadEventSchema = new Schema(
  { user: { type: Schema.Types.ObjectId, ref: 'User', index: true }, kind: { type: String, enum: ['subtitle', 'media'], required: true, index: true }, targetId: { type: Schema.Types.ObjectId, required: true, index: true }, contentId: Schema.Types.ObjectId, ipHash: String, countryCode: String, userAgentFamily: String },
  { timestamps: true },
);
downloadEventSchema.index({ kind: 1, createdAt: -1 });

const searchEventSchema = new Schema(
  { user: { type: Schema.Types.ObjectId, ref: 'User', index: true }, query: { type: String, required: true, index: true }, normalizedQuery: { type: String, required: true, index: true }, resultCount: { type: Number, min: 0 }, ipHash: String, locale: String },
  { timestamps: true },
);
searchEventSchema.index({ normalizedQuery: 1, createdAt: -1 });

const takedownSchema = new Schema(
  { requester: { type: String, required: true }, email: { type: String, required: true }, contentUrl: { type: String, required: true }, reason: { type: String, required: true }, status: { type: String, enum: ['new', 'reviewing', 'resolved', 'rejected'], default: 'new', index: true }, notes: String, resolution: String, resolvedAt: Date, assignedTo: { type: Schema.Types.ObjectId, ref: 'User' } },
  { timestamps: true },
);

const homepageSectionSchema = new Schema(
  { key: { type: String, required: true, unique: true }, title: { type: String, required: true }, type: { type: String, required: true }, enabled: { type: Boolean, default: true, index: true }, displayOrder: { type: Number, default: 0, index: true }, contentIds: [Schema.Types.ObjectId], settings: Schema.Types.Mixed },
  { timestamps: true },
);

const simpleSettingSchema = new Schema({ key: { type: String, required: true, unique: true }, value: Schema.Types.Mixed }, { timestamps: true });
const auditSchema = new Schema(
  { actor: { type: Schema.Types.ObjectId, ref: 'User', index: true }, action: { type: String, required: true, index: true }, entity: { type: String, required: true, index: true }, entityId: String, metadata: Schema.Types.Mixed, ipHash: String },
  { timestamps: true },
);
auditSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

const reportSchema = new Schema(
  { reporter: { type: Schema.Types.ObjectId, ref: 'User' }, targetType: { type: String, required: true }, targetId: { type: Schema.Types.ObjectId, required: true }, reason: { type: String, required: true }, details: String, status: { type: String, enum: ['new', 'reviewing', 'resolved', 'rejected'], default: 'new', index: true }, assignedTo: { type: Schema.Types.ObjectId, ref: 'User' } },
  { timestamps: true },
);
const notificationSchema = new Schema(
  { user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, type: { type: String, required: true }, payload: Schema.Types.Mixed, readAt: Date },
  { timestamps: true },
);
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

const contactMessageSchema = new Schema(
  { requester: { type: String, required: true }, email: { type: String, required: true }, message: { type: String, required: true }, status: { type: String, enum: ['new','reviewing','resolved'], default: 'new', index: true } },
  { timestamps: true },
);

const rateLimitSchema = new Schema(
  { keyHash: { type: String, required: true, index: true }, action: { type: String, required: true, index: true }, windowStart: { type: Date, required: true }, count: { type: Number, default: 1 }, expiresAt: { type: Date, required: true, expires: 0 } },
  { timestamps: true },
);
rateLimitSchema.index({ keyHash: 1, action: 1, windowStart: 1 }, { unique: true });

export const User = existingOrCreate('User', userSchema);
export const Session = existingOrCreate('Session', sessionSchema);
export const Movie = existingOrCreate('Movie', movieSchema);
export const Series = existingOrCreate('Series', seriesSchema);
export const Season = existingOrCreate('Season', seasonSchema);
export const Episode = existingOrCreate('Episode', episodeSchema);
export const Subtitle = existingOrCreate('Subtitle', subtitleSchema);
export const TranslatorProfile = existingOrCreate('TranslatorProfile', translatorSchema);
export const MediaAsset = existingOrCreate('MediaAsset', mediaAssetSchema);
export const MediaVersion = existingOrCreate('MediaVersion', mediaVersionSchema);
export const Genre = existingOrCreate('Genre', taxonomySchema);
export const Language = existingOrCreate('Language', taxonomySchema.clone());
export const Collection = existingOrCreate('Collection', collectionSchema);
export const Comment = existingOrCreate('Comment', commentSchema);
export const CommentLike = existingOrCreate('CommentLike', commentLikeSchema);
export const Rating = existingOrCreate('Rating', ratingSchema);
export const Watchlist = existingOrCreate('Watchlist', watchlistSchema);
export const ViewingProgress = existingOrCreate('ViewingProgress', progressSchema);
export const DownloadEvent = existingOrCreate('DownloadEvent', downloadEventSchema);
export const SearchEvent = existingOrCreate('SearchEvent', searchEventSchema);
export const TakedownRequest = existingOrCreate('TakedownRequest', takedownSchema);
export const SiteSetting = existingOrCreate('SiteSetting', simpleSettingSchema);
export const HomepageSection = existingOrCreate('HomepageSection', homepageSectionSchema);
export const AuditLog = existingOrCreate('AuditLog', auditSchema);
export const Report = existingOrCreate('Report', reportSchema);
export const Notification = existingOrCreate('Notification', notificationSchema);
export const ContactMessage = existingOrCreate('ContactMessage', contactMessageSchema);
export const RateLimitEvent = existingOrCreate('RateLimitEvent', rateLimitSchema);

export const cineruModels = [
  User, Session, Movie, Series, Season, Episode, Subtitle, TranslatorProfile, MediaAsset, MediaVersion, Genre, Language,
  Collection, Comment, CommentLike, Rating, Watchlist, ViewingProgress, DownloadEvent, SearchEvent, TakedownRequest, SiteSetting,
  HomepageSection, AuditLog, Report, Notification, ContactMessage, RateLimitEvent,
];

export async function ensureCineruIndexes() {
  await Promise.all(cineruModels.map((model) => model.createIndexes()));
}
