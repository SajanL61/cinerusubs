import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { requirePagePermission } from '@/lib/auth';

export const metadata = { title: { default: 'Administration', template: '%s · CineSeya.lk Admin' }, robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: ReactNode }) { const { user } = await requirePagePermission('admin.access','/admin'); return <AdminShell user={user}>{children}</AdminShell>; }
