'use client';

import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const params = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const isLogin = mode === 'login';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'The request could not be completed.');
      const requested = params.get('returnTo');
      const destination = requested?.startsWith('/') && !requested.startsWith('//') ? requested : result.user?.role !== 'user' ? '/admin' : '/profile';
      router.push(destination); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The request could not be completed.'); setPending(false); }
  }

  return <form className="auth-form" onSubmit={submit}>
    {!isLogin && <><label htmlFor="name">Full name</label><div className="auth-field"><UserRound/><input id="name" name="name" autoComplete="name" minLength={2} maxLength={120} required placeholder="Your name"/></div></>}
    <label htmlFor="email">Email address</label><div className="auth-field"><Mail/><input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></div>
    <div className="auth-label-row"><label htmlFor="password">Password</label></div>
    <div className="auth-field"><LockKeyhole/><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={isLogin ? 1 : 12} required placeholder={isLogin ? 'Your password' : '12+ characters'} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff/> : <Eye/>}</button></div>
    {!isLogin && <p className="password-hint">Use at least 12 characters with uppercase, lowercase and a number.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="auth-submit" disabled={pending} type="submit">{pending && <LoaderCircle className="spin"/>}{pending ? 'Please wait' : isLogin ? 'Sign in' : 'Create account'}</button>
    <p className="auth-switch">{isLogin ? 'New to CineruSubs?' : 'Already have an account?'} <Link href={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Sign in'}</Link></p>
  </form>;
}
