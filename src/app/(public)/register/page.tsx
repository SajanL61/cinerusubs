import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Logo } from '@/components/ui/logo';

export const metadata: Metadata = { title: 'Create account', description: 'Create your CineruSubs account.', robots: { index: false, follow: false } };
export default function RegisterPage() { return <section className="auth-page"><div className="auth-panel"><Logo/><span className="auth-eyebrow">Join the community</span><h1>Create your account</h1><p>Build a watchlist, follow releases and support subtitle translators.</p><Suspense><AuthForm mode="register"/></Suspense></div><aside><span>Made for film lovers</span><h2>Keep every release in one place.</h2><p>Your account starts with standard viewer access. Staff permissions are assigned separately and audited.</p></aside></section>; }
