import 'server-only';
import { connectDb } from '@/lib/db';
import { useDemoData } from '@/lib/env';
import { Episode, MediaVersion, Movie, Season, Series, Subtitle, TranslatorProfile } from '@/models';
import { demoMovies, demoSeries, demoSubtitles, demoTranslators } from '@/data/demo';
import type { DiscoverFilters, MovieRecord, SeriesRecord, SubtitleRecord, TranslatorRecord } from '@/types/content';

const normalize = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase();

function filterMovies(items: MovieRecord[], filters: DiscoverFilters = {}) {
  let result = [...items];
  if (filters.q) {
    const q = normalize(filters.q);
    result = result.filter((movie) => [movie.title, movie.originalTitle, movie.sinhalaTitle, movie.overview, ...movie.genres, ...movie.languages]
      .filter(Boolean).some((value) => normalize(String(value)).includes(q)));
  }
  if (filters.genre) result = result.filter((movie) => movie.genres.some((genre) => normalize(genre) === normalize(filters.genre!)));
  if (filters.language) result = result.filter((movie) => movie.languages.some((language) => normalize(language) === normalize(filters.language!)));
  if (filters.country) result = result.filter((movie) => movie.countries.some((country) => normalize(country) === normalize(filters.country!)));
  if (filters.year) result = result.filter((movie) => String(movie.year) === filters.year);
  if (filters.rating) result = result.filter((movie) => (movie.imdbRating ?? movie.tmdbRating ?? 0) >= Number(filters.rating));
  if (filters.quality) result = result.filter((movie) => movie.qualities.some((quality) => normalize(quality).includes(normalize(filters.quality!))));
  if (filters.subtitleLanguage) result = result.filter((movie) => movie.subtitleLanguages.some((language) => normalize(language) === normalize(filters.subtitleLanguage!)));
  const sort = filters.sort ?? 'trending';
  result.sort((a, b) => sort === 'newest' ? b.year - a.year
    : sort === 'rating' ? (b.imdbRating ?? b.tmdbRating ?? 0) - (a.imdbRating ?? a.tmdbRating ?? 0)
      : sort === 'downloads' ? b.subtitleDownloadCount - a.subtitleDownloadCount
        : sort === 'views' || sort === 'popularity' ? b.viewCount - a.viewCount
          : Number(b.trending) - Number(a.trending) || b.viewCount - a.viewCount);
  return result;
}

function toMovieRecord(document: Record<string, unknown>): MovieRecord {
  const releaseDate = document.releaseDate ? new Date(document.releaseDate as string).toISOString().slice(0, 10) : `${document.year}-01-01`;
  return {
    id: String(document._id), title: String(document.title), originalTitle: document.originalTitle ? String(document.originalTitle) : undefined,
    sinhalaTitle: document.sinhalaTitle ? String(document.sinhalaTitle) : undefined, slug: String(document.slug), overview: String(document.overview),
    year: Number(document.year), releaseDate, runtime: Number(document.runtime ?? 0), ageRating: String(document.ageRating ?? 'NR'),
    genres: (document.genres as string[] | undefined) ?? [], languages: (document.languages as string[] | undefined) ?? [], countries: (document.countries as string[] | undefined) ?? [],
    posterUrl: String(document.posterUrl ?? '/media/fallback-poster.svg'), backdropUrl: String(document.backdropUrl ?? '/media/fallback-backdrop.svg'),
    trailerUrl: document.trailerUrl ? String(document.trailerUrl) : undefined, imdbId: document.imdbId ? String(document.imdbId) : undefined,
    tmdbId: document.tmdbId ? String(document.tmdbId) : undefined, imdbRating: document.imdbRating ? Number(document.imdbRating) : undefined,
    tmdbRating: document.tmdbRating ? Number(document.tmdbRating) : undefined, cast: (document.cast as MovieRecord['cast'] | undefined) ?? [],
    crew: (document.crew as MovieRecord['crew'] | undefined) ?? [], rightsStatus: document.rightsStatus as MovieRecord['rightsStatus'],
    featured: Boolean(document.featured), trending: Boolean(document.trending), editorPick: Boolean(document.editorPick), viewCount: Number(document.viewCount ?? 0),
    subtitleDownloadCount: Number(document.subtitleDownloadCount ?? 0), publicationStatus: document.publicationStatus as MovieRecord['publicationStatus'],
    qualities: [], subtitleLanguages: [], releaseStatus: String(document.releaseStatus ?? 'Released'),
  };
}

export async function getMovies(filters: DiscoverFilters = {}) {
  if (useDemoData) return filterMovies(demoMovies, filters);
  await connectDb();
  const query: Record<string, unknown> = { publicationStatus: 'published' };
  if (filters.genre) query.genres = filters.genre;
  if (filters.language) query.languages = filters.language;
  if (filters.country) query.countries = filters.country;
  if (filters.year) query.year = Number(filters.year);
  if (filters.q) query.$text = { $search: filters.q.replace(/[{}$]/g, '') };
  const rows = await Movie.find(query).sort({ trending: -1, publishedAt: -1 }).limit(96).lean();
  return filterMovies(rows.map((row) => toMovieRecord(row as Record<string, unknown>)), filters);
}

export async function getMovieBySlug(slug: string) {
  if (useDemoData) return demoMovies.find((movie) => movie.slug === slug) ?? null;
  await connectDb();
  const row = await Movie.findOne({ slug, publicationStatus: 'published' }).lean();
  return row ? toMovieRecord(row as Record<string, unknown>) : null;
}

export async function getSeries(): Promise<SeriesRecord[]> {
  if (useDemoData) return demoSeries;
  await connectDb();
  const seriesRows = await Series.find({ publicationStatus: 'published' }).sort({ trending: -1, publishedAt: -1 }).lean();
  return Promise.all(seriesRows.map(async (row) => {
    const seasonRows = await Season.find({ series: row._id, publicationStatus: 'published' }).sort({ seasonNumber: 1 }).lean();
    const seasons = await Promise.all(seasonRows.map(async (season) => ({
      id: String(season._id), seasonNumber: Number(season.seasonNumber), title: String(season.title ?? `Season ${season.seasonNumber}`),
      episodes: (await Episode.find({ season: season._id, publicationStatus: 'published' }).sort({ episodeNumber: 1 }).lean()).map((episode) => ({
        id: String(episode._id), seasonNumber: Number(episode.seasonNumber), episodeNumber: Number(episode.episodeNumber), title: String(episode.title),
        slug: String(episode.slug), overview: String(episode.overview ?? ''), runtime: Number(episode.runtime ?? 0), releaseDate: episode.releaseDate ? new Date(episode.releaseDate as Date).toISOString().slice(0, 10) : '',
        thumbnailUrl: String(episode.thumbnailUrl ?? '/media/fallback-backdrop.svg'), subtitleLanguages: [], rightsStatus: episode.rightsStatus as SeriesRecord['rightsStatus'],
      })),
    })));
    return {
      id: String(row._id), title: String(row.title), originalTitle: row.originalTitle ? String(row.originalTitle) : undefined,
      sinhalaTitle: row.sinhalaTitle ? String(row.sinhalaTitle) : undefined, slug: String(row.slug), overview: String(row.overview), year: Number(row.year),
      ageRating: String(row.ageRating ?? 'NR'), genres: (row.genres as string[] | undefined) ?? [], languages: (row.languages as string[] | undefined) ?? [],
      countries: (row.countries as string[] | undefined) ?? [], posterUrl: String(row.posterUrl ?? '/media/fallback-poster.svg'), backdropUrl: String(row.backdropUrl ?? '/media/fallback-backdrop.svg'),
      imdbRating: row.imdbRating ? Number(row.imdbRating) : undefined, tmdbRating: row.tmdbRating ? Number(row.tmdbRating) : undefined,
      status: String(row.status ?? 'Unknown'), rightsStatus: row.rightsStatus as SeriesRecord['rightsStatus'], seasons, featured: Boolean(row.featured), trending: Boolean(row.trending),
    } satisfies SeriesRecord;
  }));
}

export async function getSeriesBySlug(slug: string) {
  return (await getSeries()).find((series) => series.slug === slug) ?? null;
}

export async function getSubtitles(languageCode?: string): Promise<SubtitleRecord[]> {
  if (useDemoData) return demoSubtitles.filter((subtitle) => !languageCode || subtitle.languageCode === languageCode);
  await connectDb();
  const rows = await Subtitle.find({ status: 'published', ...(languageCode ? { languageCode } : {}) }).populate('translator').sort({ createdAt: -1 }).limit(100).lean();
  return rows.map((row) => ({
    id: String(row._id), movieId: row.movie ? String(row.movie) : undefined, seriesId: row.series ? String(row.series) : undefined, episodeId: row.episode ? String(row.episode) : undefined,
    contentSlug: '', contentTitle: 'Linked title', contentPosterUrl: '/media/fallback-poster.svg', language: String(row.language), languageCode: String(row.languageCode),
    translatorId: String((row.translator as Record<string, unknown> | undefined)?._id ?? ''), translatorName: String((row.translator as Record<string, unknown> | undefined)?.displayName ?? 'CineruSubs Translator'),
    translatorSlug: String((row.translator as Record<string, unknown> | undefined)?.slug ?? ''), translatorAvatarUrl: (row.translator as Record<string, unknown> | undefined)?.avatarUrl ? String((row.translator as Record<string, unknown>).avatarUrl) : undefined,
    releaseMatches: (row.releaseMatches as string[] | undefined) ?? [], fps: row.fps ? Number(row.fps) : undefined, format: row.format as SubtitleRecord['format'],
    hearingImpaired: Boolean(row.hearingImpaired), fileName: String(row.fileName), fileSize: Number(row.fileSize), version: Number(row.version), verified: Boolean(row.verified),
    downloadCount: Number(row.downloadCount), status: row.status as SubtitleRecord['status'], createdAt: new Date(row.createdAt as Date).toISOString(), updatedAt: new Date(row.updatedAt as Date).toISOString(),
  }));
}

export async function getSubtitlesForMovie(movieId: string) {
  return (await getSubtitles()).filter((subtitle) => subtitle.movieId === movieId);
}

export async function getTranslatorBySlug(slug: string): Promise<TranslatorRecord | null> {
  if (useDemoData) return demoTranslators.find((translator) => translator.slug === slug) ?? null;
  await connectDb();
  const row = await TranslatorProfile.findOne({ slug }).lean();
  if (!row) return null;
  return { id: String(row._id), slug: String(row.slug), displayName: String(row.displayName), avatarUrl: row.avatarUrl ? String(row.avatarUrl) : undefined, bio: String(row.bio ?? ''), joinedAt: new Date(row.createdAt as Date).toISOString(), verified: Boolean(row.verified), totalSubtitles: Number(row.totalSubtitles ?? 0), totalDownloads: Number(row.totalDownloads ?? 0), averageRating: Number(row.averageRating ?? 0) };
}

export async function getTranslatorSubtitles(translatorId: string) {
  return (await getSubtitles()).filter((subtitle) => subtitle.translatorId === translatorId);
}

export async function getSearchSuggestions(query: string) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const [movies, series, subtitles] = await Promise.all([getMovies({ q }), getSeries(), getSubtitles()]);
  const movieItems = movies.slice(0, 6).map((movie) => ({ type: 'movie', title: movie.title, subtitle: `${movie.year} · ${movie.genres[0] ?? 'Movie'}`, slug: movie.slug, image: movie.posterUrl }));
  const seriesItems = series.filter((item) => [item.title, item.sinhalaTitle, ...item.genres].filter(Boolean).some((value) => normalize(String(value)).includes(q))).slice(0, 4).map((item) => ({ type: 'series', title: item.title, subtitle: `${item.year} · TV Series`, slug: item.slug, image: item.posterUrl }));
  const translatorItems = demoTranslators.filter((item) => normalize(item.displayName).includes(q)).slice(0, 3).map((item) => ({ type: 'translator', title: item.displayName, subtitle: 'Subtitle translator', slug: item.slug, image: item.avatarUrl }));
  const subtitleItems = subtitles.filter((item) => normalize(item.contentTitle).includes(q)).slice(0, 3).map((item) => ({ type: 'subtitle', title: `${item.contentTitle} · ${item.language}`, subtitle: `${item.format.toUpperCase()} · ${item.downloadCount.toLocaleString()} downloads`, slug: item.contentSlug, image: item.contentPosterUrl }));
  return [...movieItems, ...seriesItems, ...translatorItems, ...subtitleItems].slice(0, 10);
}

export async function getActiveMediaVersions(contentId: string, contentType: 'movie' | 'episode') {
  if (useDemoData) return [];
  await connectDb();
  return MediaVersion.find({ contentId, contentType, active: true }).select('quality resolution releaseType fileSize rightsStatus').sort({ fileSize: -1 }).lean();
}
