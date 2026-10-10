import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Logo } from '@/components/ui/logo';

export const metadata: Metadata = { title: 'Sign in', description: 'Sign in to your CineSeya.lk account.', robots: { index: false, follow: false } };
export default function LoginPage() { return <section className="auth-page"><div className="auth-panel"><Logo large/><span className="auth-eyebrow">Welcome back</span><h1>Sign in to CineSeya.lk</h1><p>Sync your watchlist, subtitle activity, ratings and viewing progress.</p><Suspense><AuthForm mode="login"/></Suspense></div><aside><span>One account</span><h2>Your cinema, remembered.</h2><p>Private database-backed sessions. No third-party advertising profiles.</p></aside></section>; }
