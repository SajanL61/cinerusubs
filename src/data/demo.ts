import type { MovieRecord, SeriesRecord, SubtitleRecord, TranslatorRecord } from '@/types/content';

const commonCast = [
  { name: 'Open Film Ensemble', slug: 'open-film-ensemble', role: 'Cast' },
  { name: 'Community Artists', slug: 'community-artists', role: 'Cast' },
];

export const demoMovies: MovieRecord[] = [
  {
    id: '66a000000000000000000001', title: 'Big Buck Bunny', sinhalaTitle: 'බිග් බක් බනී', slug: 'big-buck-bunny-2008',
    overview: 'A gentle giant of a rabbit turns the tables on three woodland troublemakers in Blender Foundation’s celebrated open movie.',
    year: 2008, releaseDate: '2008-04-10', runtime: 10, ageRating: 'PG', genres: ['Animation', 'Comedy'], languages: ['English'],
    countries: ['Netherlands'], releaseType: 'WEBRip', videoQuality: 'FHD', posterUrl: '/media/big-buck-bunny-poster.svg', backdropUrl: '/media/big-buck-bunny-backdrop.svg',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ', imdbId: 'tt1254207', imdbRating: 6.4, tmdbRating: 6.5,
    cast: commonCast, crew: [{ name: 'Sacha Goedegebure', slug: 'sacha-goedegebure', role: 'Director' }], rightsStatus: 'licensed',
    featured: true, trending: true, editorPick: true, viewCount: 18420, subtitleDownloadCount: 4821, publicationStatus: 'published',
    qualities: ['4K', '1080P'], subtitleLanguages: ['Sinhala', 'English', 'Tamil'], releaseStatus: 'Released',
  },
  {
    id: '66a000000000000000000002', title: 'Sintel', sinhalaTitle: 'සින්ටෙල්', slug: 'sintel-2010',
    overview: 'A determined young woman crosses a vast fantasy world while searching for the dragon she once rescued.',
    year: 2010, releaseDate: '2010-09-27', runtime: 15, ageRating: 'PG-13', genres: ['Animation', 'Fantasy'], languages: ['English'],
    countries: ['Netherlands'], releaseType: 'BluRay', videoQuality: '4K', posterUrl: '/media/sintel-poster.svg', backdropUrl: '/media/sintel-backdrop.svg',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/eRsGyueVLvQ', imdbId: 'tt1727587', imdbRating: 7.4, tmdbRating: 7.4,
    cast: commonCast, crew: [{ name: 'Colin Levy', slug: 'colin-levy', role: 'Director' }], rightsStatus: 'licensed',
    featured: true, trending: true, editorPick: true, viewCount: 15340, subtitleDownloadCount: 3980, publicationStatus: 'published',
    qualities: ['4K', '1080P'], subtitleLanguages: ['Sinhala', 'English'], releaseStatus: 'Released',
  },
  {
    id: '66a000000000000000000003', title: 'Tears of Steel', sinhalaTitle: 'වානේ කඳුළු', slug: 'tears-of-steel-2012',
    overview: 'Scientists and warriors gather in a transformed Amsterdam to prevent destructive robots from rewriting the future.',
    year: 2012, releaseDate: '2012-09-26', runtime: 12, ageRating: 'PG-13', genres: ['Science Fiction', 'Action'], languages: ['English'],
    countries: ['Netherlands'], releaseType: 'WEB-DL', videoQuality: '4K', posterUrl: '/media/tears-of-steel-poster.svg', backdropUrl: '/media/tears-of-steel-backdrop.svg',
    trailerUrl: 'https://www.youtube-nocookie.com/embed/R6MlUcmOul8', imdbId: 'tt2285752', imdbRating: 5.5, tmdbRating: 5.5,
    cast: commonCast, crew: [{ name: 'Ian Hubert', slug: 'ian-hubert', role: 'Director' }], rightsStatus: 'licensed',
    featured: false, trending: true, editorPick: false, viewCount: 12780, subtitleDownloadCount: 3220, publicationStatus: 'published',
    qualities: ['4K', '1080P'], subtitleLanguages: ['Sinhala', 'English'], releaseStatus: 'Released',
  },
  {
    id: '66a000000000000000000004', title: 'The General', sinhalaTitle: 'ජෙනරාල්', slug: 'the-general-1926',
    overview: 'A railway engineer pursues a stolen locomotive through the American Civil War in Buster Keaton’s precision-built silent comedy.',
    year: 1926, releaseDate: '1926-12-31', runtime: 79, ageRating: 'U', genres: ['Comedy', 'Adventure'], languages: ['Silent'],
    countries: ['United States'], releaseType: 'BluRay', videoQuality: 'FHD', posterUrl: '/media/the-general-poster.svg', backdropUrl: '/media/the-general-backdrop.svg',
    imdbId: 'tt0017925', imdbRating: 8.1, tmdbRating: 7.9,
    cast: [{ name: 'Buster Keaton', slug: 'buster-keaton', character: 'Johnnie Gray' }], crew: [{ name: 'Buster Keaton', slug: 'buster-keaton', role: 'Director' }], rightsStatus: 'public_domain',
    featured: true, trending: false, editorPick: true, viewCount: 9680, subtitleDownloadCount: 1840, publicationStatus: 'published',
    qualities: ['1080P'], subtitleLanguages: ['Sinhala', 'English'], releaseStatus: 'Released',
  },
  {
    id: '66a000000000000000000005', title: 'Sherlock Jr.', sinhalaTitle: 'ෂර්ලොක් ජූනියර්', slug: 'sherlock-jr-1924',
    overview: 'A projectionist dreams himself into the detective story on screen after being framed for a theft.',
    year: 1924, releaseDate: '1924-04-21', runtime: 45, ageRating: 'U', genres: ['Comedy', 'Mystery'], languages: ['Silent'],
    countries: ['United States'], releaseType: 'WEBRip', videoQuality: 'FHD', posterUrl: '/media/sherlock-jr-poster.svg', backdropUrl: '/media/sherlock-jr-backdrop.svg',
    imdbId: 'tt0015324', imdbRating: 8.2, tmdbRating: 8.1,
    cast: [{ name: 'Buster Keaton', slug: 'buster-keaton', character: 'Projectionist' }], crew: [{ name: 'Buster Keaton', slug: 'buster-keaton', role: 'Director' }], rightsStatus: 'public_domain',
    featured: false, trending: true, editorPick: true, viewCount: 11100, subtitleDownloadCount: 2114, publicationStatus: 'published',
    qualities: ['1080P'], subtitleLanguages: ['Sinhala', 'English'], releaseStatus: 'Released',
  },
  {
    id: '66a000000000000000000006', title: 'Night of the Living Dead', sinhalaTitle: 'ජීවමාන මළවුන්ගේ රාත්‍රිය', slug: 'night-of-the-living-dead-1968',
    overview: 'Strangers trapped in a farmhouse struggle to survive as the dead begin to rise outside.',
    year: 1968, releaseDate: '1968-10-01', runtime: 96, ageRating: '18', genres: ['Horror', 'Thriller'], languages: ['English'],
    countries: ['United States'], releaseType: 'BluRay', videoQuality: 'FHD', posterUrl: '/media/night-living-dead-poster.svg', backdropUrl: '/media/night-living-dead-backdrop.svg',
    imdbId: 'tt0063350', imdbRating: 7.8, tmdbRating: 7.6,
    cast: [{ name: 'Duane Jones', slug: 'duane-jones', character: 'Ben' }], crew: [{ name: 'George A. Romero', slug: 'george-a-romero', role: 'Director' }], rightsStatus: 'subtitle_only',
    featured: false, trending: true, editorPick: false, viewCount: 20600, subtitleDownloadCount: 6920, publicationStatus: 'published',
    qualities: ['1080P', 'BluRay'], subtitleLanguages: ['Sinhala', 'English', 'Tamil'], releaseStatus: 'Released',
  },
  {
    id: '66a000000000000000000007', title: 'A Trip to the Moon', sinhalaTitle: 'චන්ද්‍රයා වෙත ගමනක්', slug: 'a-trip-to-the-moon-1902',
    overview: 'Astronomers launch a capsule to the Moon and encounter a fantastical lunar world in cinema’s foundational science-fiction voyage.',
    year: 1902, releaseDate: '1902-09-01', runtime: 14, ageRating: 'U', genres: ['Science Fiction', 'Adventure'], languages: ['Silent'],
    countries: ['France'], releaseType: 'WEBRip', videoQuality: 'FHD', posterUrl: '/media/trip-to-moon-poster.svg', backdropUrl: '/media/trip-to-moon-backdrop.svg',
    imdbId: 'tt0000417', imdbRating: 8.1, tmdbRating: 7.9,
    cast: [{ name: 'Georges Méliès', slug: 'georges-melies', character: 'Professor Barbenfouillis' }], crew: [{ name: 'Georges Méliès', slug: 'georges-melies', role: 'Director' }], rightsStatus: 'public_domain',
    featured: false, trending: false, editorPick: true, viewCount: 8400, subtitleDownloadCount: 1290, publicationStatus: 'published',
    qualities: ['1080P'], subtitleLanguages: ['Sinhala', 'English'], releaseStatus: 'Released',
  },
  {
    id: '66a000000000000000000008', title: 'His Girl Friday', sinhalaTitle: 'හිස් ගර්ල් ෆ්‍රයිඩේ', slug: 'his-girl-friday-1940',
    overview: 'A newspaper editor uses every trick he knows to keep his star reporter—and former wife—from leaving the newsroom.',
    year: 1940, releaseDate: '1940-01-18', runtime: 92, ageRating: 'PG', genres: ['Comedy', 'Romance'], languages: ['English'],
    countries: ['United States'], releaseType: 'WEBRip', videoQuality: 'FHD', posterUrl: '/media/his-girl-friday-poster.svg', backdropUrl: '/media/his-girl-friday-backdrop.svg',
    imdbId: 'tt0032599', imdbRating: 7.8, tmdbRating: 7.4,
    cast: [{ name: 'Cary Grant', slug: 'cary-grant', character: 'Walter Burns' }, { name: 'Rosalind Russell', slug: 'rosalind-russell', character: 'Hildy Johnson' }],
    crew: [{ name: 'Howard Hawks', slug: 'howard-hawks', role: 'Director' }], rightsStatus: 'subtitle_only',
    featured: false, trending: false, editorPick: false, viewCount: 7200, subtitleDownloadCount: 960, publicationStatus: 'published',
    qualities: ['1080P'], subtitleLanguages: ['Sinhala', 'English'], releaseStatus: 'Released',
  },
];

export const demoSeries: SeriesRecord[] = [
  {
    id: '66b000000000000000000001', title: 'Open Cinema Sessions', sinhalaTitle: 'විවෘත සිනමා සැසි', slug: 'open-cinema-sessions',
    overview: 'A CineruSubs editorial series examining open filmmaking, restoration, subtitles and the craft behind accessible cinema.',
    year: 2026, ageRating: 'U', genres: ['Documentary'], languages: ['English', 'Sinhala'], countries: ['Sri Lanka'],
    posterUrl: '/media/open-cinema-poster.svg', backdropUrl: '/media/open-cinema-backdrop.svg', tmdbRating: 8.2, status: 'Returning series',
    rightsStatus: 'owned', featured: true, trending: true,
    seasons: [{ id: '66c000000000000000000001', seasonNumber: 1, title: 'Season 1', episodes: [
      { id: '66d000000000000000000001', seasonNumber: 1, episodeNumber: 1, title: 'Why Subtitles Matter', slug: 'why-subtitles-matter', overview: 'Translators discuss timing, tone and cultural context.', runtime: 24, releaseDate: '2026-08-14', thumbnailUrl: '/media/open-cinema-backdrop.svg', subtitleLanguages: ['Sinhala', 'English'], rightsStatus: 'owned' },
      { id: '66d000000000000000000002', seasonNumber: 1, episodeNumber: 2, title: 'Restoring a Silent Frame', slug: 'restoring-a-silent-frame', overview: 'A practical look at the care behind public-domain film restoration.', runtime: 28, releaseDate: '2026-08-21', thumbnailUrl: '/media/the-general-backdrop.svg', subtitleLanguages: ['Sinhala', 'English'], rightsStatus: 'owned' },
      { id: '66d000000000000000000003', seasonNumber: 1, episodeNumber: 3, title: 'Open Movies, Global Audiences', slug: 'open-movies-global-audiences', overview: 'How open licenses make creative work easier to study and translate.', runtime: 31, releaseDate: '2026-08-28', thumbnailUrl: '/media/sintel-backdrop.svg', subtitleLanguages: ['Sinhala', 'English', 'Tamil'], rightsStatus: 'owned' },
    ] }],
  },
  {
    id: '66b000000000000000000002', title: 'Frame by Frame', sinhalaTitle: 'රාමුවෙන් රාමුවට', slug: 'frame-by-frame',
    overview: 'Short visual essays about editing, sound, performance and the small choices that shape memorable scenes.',
    year: 2026, ageRating: 'PG', genres: ['Documentary', 'Education'], languages: ['Sinhala'], countries: ['Sri Lanka'],
    posterUrl: '/media/frame-by-frame-poster.svg', backdropUrl: '/media/frame-by-frame-backdrop.svg', status: 'Limited series', rightsStatus: 'owned', featured: false, trending: true,
    seasons: [{ id: '66c000000000000000000002', seasonNumber: 1, title: 'Volume One', episodes: [
      { id: '66d000000000000000000004', seasonNumber: 1, episodeNumber: 1, title: 'The First Cut', slug: 'the-first-cut', overview: 'How one edit changes the emotional meaning of a scene.', runtime: 18, releaseDate: '2026-09-12', thumbnailUrl: '/media/frame-by-frame-backdrop.svg', subtitleLanguages: ['Sinhala', 'English'], rightsStatus: 'owned' },
    ] }],
  },
];

export const demoTranslators: TranslatorRecord[] = [
  { id: '66e000000000000000000001', slug: 'nethmi-perera', displayName: 'Nethmi Perera', avatarUrl: '/media/avatar-nethmi.svg', bio: 'Sinhala subtitle translator focused on animation, fantasy and accessible timing.', joinedAt: '2024-02-16', verified: true, totalSubtitles: 84, totalDownloads: 268400, averageRating: 9.4 },
  { id: '66e000000000000000000002', slug: 'kasun-jayawardena', displayName: 'Kasun Jayawardena', avatarUrl: '/media/avatar-kasun.svg', bio: 'Translator and classic-cinema enthusiast working across Sinhala and English releases.', joinedAt: '2023-11-04', verified: true, totalSubtitles: 112, totalDownloads: 411200, averageRating: 9.2 },
];

const iso = (day: number) => `2026-09-${String(day).padStart(2, '0')}T08:30:00.000Z`;
export const demoSubtitles: SubtitleRecord[] = [
  { id: '66f000000000000000000001', movieId: demoMovies[0]!.id, contentSlug: demoMovies[0]!.slug, contentTitle: demoMovies[0]!.title, contentPosterUrl: demoMovies[0]!.posterUrl, language: 'Sinhala', languageCode: 'si', translatorId: demoTranslators[0]!.id, translatorName: demoTranslators[0]!.displayName, translatorSlug: demoTranslators[0]!.slug, translatorAvatarUrl: demoTranslators[0]!.avatarUrl, releaseMatches: ['Open Movie 4K', '1080p WEB-DL'], fps: 24, format: 'zip', hearingImpaired: false, fileName: 'big-buck-bunny-si-v3.zip', fileSize: 148320, version: 3, verified: true, downloadCount: 4821, status: 'published', createdAt: iso(28), updatedAt: iso(28) },
  { id: '66f000000000000000000002', movieId: demoMovies[1]!.id, contentSlug: demoMovies[1]!.slug, contentTitle: demoMovies[1]!.title, contentPosterUrl: demoMovies[1]!.posterUrl, language: 'Sinhala', languageCode: 'si', translatorId: demoTranslators[0]!.id, translatorName: demoTranslators[0]!.displayName, translatorSlug: demoTranslators[0]!.slug, translatorAvatarUrl: demoTranslators[0]!.avatarUrl, releaseMatches: ['4K Open Movie', '1080p BluRay'], fps: 24, format: 'srt', hearingImpaired: false, fileName: 'sintel-si-v2.srt', fileSize: 92340, version: 2, verified: true, downloadCount: 3980, status: 'published', createdAt: iso(26), updatedAt: iso(27) },
  { id: '66f000000000000000000003', movieId: demoMovies[5]!.id, contentSlug: demoMovies[5]!.slug, contentTitle: demoMovies[5]!.title, contentPosterUrl: demoMovies[5]!.posterUrl, language: 'Sinhala', languageCode: 'si', translatorId: demoTranslators[1]!.id, translatorName: demoTranslators[1]!.displayName, translatorSlug: demoTranslators[1]!.slug, translatorAvatarUrl: demoTranslators[1]!.avatarUrl, releaseMatches: ['Criterion 1080p BluRay', 'Restored WEB-DL'], fps: 23.976, format: 'zip', hearingImpaired: false, fileName: 'night-of-the-living-dead-si-v4.zip', fileSize: 186400, version: 4, verified: true, downloadCount: 6920, status: 'published', createdAt: iso(24), updatedAt: iso(25) },
  { id: '66f000000000000000000004', movieId: demoMovies[3]!.id, contentSlug: demoMovies[3]!.slug, contentTitle: demoMovies[3]!.title, contentPosterUrl: demoMovies[3]!.posterUrl, language: 'English', languageCode: 'en', translatorId: demoTranslators[1]!.id, translatorName: demoTranslators[1]!.displayName, translatorSlug: demoTranslators[1]!.slug, translatorAvatarUrl: demoTranslators[1]!.avatarUrl, releaseMatches: ['Restored 1080p', 'Archive print'], fps: 24, format: 'vtt', hearingImpaired: true, fileName: 'the-general-en-hi.vtt', fileSize: 74300, version: 1, verified: true, downloadCount: 1840, status: 'published', createdAt: iso(22), updatedAt: iso(22) },
  { id: '66f000000000000000000005', movieId: demoMovies[2]!.id, contentSlug: demoMovies[2]!.slug, contentTitle: demoMovies[2]!.title, contentPosterUrl: demoMovies[2]!.posterUrl, language: 'Sinhala', languageCode: 'si', translatorId: demoTranslators[0]!.id, translatorName: demoTranslators[0]!.displayName, translatorSlug: demoTranslators[0]!.slug, translatorAvatarUrl: demoTranslators[0]!.avatarUrl, releaseMatches: ['4K Open Movie', '1080p WEB-DL'], fps: 24, format: 'ass', hearingImpaired: false, fileName: 'tears-of-steel-si.ass', fileSize: 124800, version: 1, verified: true, downloadCount: 3220, status: 'published', createdAt: iso(20), updatedAt: iso(20) },
];
