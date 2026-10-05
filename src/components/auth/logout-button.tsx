'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function csrfCookie() {
  return document.cookie.split('; ').find((entry) => entry.startsWith('cinerusubs_csrf='))?.split('=').slice(1).join('=') || '';
}

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <button className="logout-button" disabled={pending} onClick={async () => {
    setPending(true);
    const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'x-csrf-token': decodeURIComponent(csrfCookie()) } });
    if (response.ok) { router.push('/'); router.refresh(); } else setPending(false);
  }}><LogOut/>{pending ? 'Signing out…' : 'Sign out'}</button>;
}
