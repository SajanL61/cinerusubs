import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Settings'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="settings" title="Site settings" description="View persisted platform configuration. Secrets remain environment-only." permission="settings.read" query={p.q}/>;}
