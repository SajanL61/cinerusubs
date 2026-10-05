import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Movies'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="movies" title="Movies" description="Create, review, schedule and publish movie metadata with explicit distribution rights." permission="content.read" createHref="/admin/movies/new" query={p.q} page={Number(p.page)||1}/>;}
