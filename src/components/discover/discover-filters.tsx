'use client';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const filters = [
  { key: 'type', label: 'Type', options: [['', 'All content'], ['movie', 'Movies'], ['tv', 'TV Series']] },
  { key: 'genre', label: 'Genre', options: [['', 'All genres'], ['Animation', 'Animation'], ['Action', 'Action'], ['Adventure', 'Adventure'], ['Comedy', 'Comedy'], ['Documentary', 'Documentary'], ['Horror', 'Horror'], ['Science Fiction', 'Science Fiction']] },
  { key: 'language', label: 'Language', options: [['', 'All languages'], ['English', 'English'], ['Sinhala', 'Sinhala'], ['Tamil', 'Tamil'], ['Silent', 'Silent']] },
  { key: 'country', label: 'Country', options: [['', 'All countries'], ['Sri Lanka', 'Sri Lanka'], ['United States', 'United States'], ['Netherlands', 'Netherlands'], ['France', 'France']] },
  { key: 'year', label: 'Year', options: [['', 'Any year'], ['2026', '2026'], ['2012', '2012'], ['2010', '2010'], ['2008', '2008'], ['1968', '1968'], ['1940', '1940'], ['1926', '1926'], ['1924', '1924'], ['1902', '1902']] },
  { key: 'rating', label: 'Rating', options: [['', 'Any rating'], ['8', '8.0+'], ['7', '7.0+'], ['6', '6.0+']] },
  { key: 'quality', label: 'Quality', options: [['', 'Any quality'], ['4K', '4K'], ['1080P', '1080P'], ['BluRay', 'BluRay']] },
  { key: 'subtitleLanguage', label: 'Subtitles', options: [['', 'Any subtitle'], ['Sinhala', 'Sinhala'], ['English', 'English'], ['Tamil', 'Tamil']] },
] as const;

export function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.push(`/discover${next.size ? `?${next}` : ''}`);
  };
  return <aside className="discover-filters"><header><SlidersHorizontal/><div><b>Refine discovery</b><span>Filters update the shareable URL</span></div></header><div className="discover-filter-grid">{filters.map((filter) => <label key={filter.key}><span>{filter.label}</span><select value={searchParams.get(filter.key) ?? ''} onChange={(event) => update(filter.key, event.target.value)}>{filter.options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>)}</div><button onClick={() => router.push('/discover')}><RotateCcw/>Reset filters</button></aside>;
}
