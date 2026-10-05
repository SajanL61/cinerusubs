import Link from 'next/link';
import { Film } from 'lucide-react';
export default function NotFound(){return <main className="error-page"><Film/><span>404</span><h1>This scene is missing</h1><p>The title may have moved, been archived or never existed.</p><div><Link className="action-button" href="/">Go home</Link><Link className="action-button secondary" href="/discover">Discover titles</Link></div></main>}
