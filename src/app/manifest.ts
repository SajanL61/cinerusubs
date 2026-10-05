import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return { name: 'CineruSubs', short_name: 'CineruSubs', description: 'Movies, TV series and Sinhala subtitles.', start_url: '/', display: 'standalone', background_color: '#080a0f', theme_color: '#080a0f', icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }] };
}
