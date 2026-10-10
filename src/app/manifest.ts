import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return { name: 'CineSeya.lk', short_name: 'CineSeya', description: 'Movies, TV series and Sinhala subtitles.', start_url: '/', display: 'standalone', background_color: '#080a0f', theme_color: '#080a0f', icons: [{ src: '/brand/cineseya-icon.png', sizes: '1254x1254', type: 'image/png', purpose: 'any' }] };
}
