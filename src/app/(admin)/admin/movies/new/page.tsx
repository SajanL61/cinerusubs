import { MovieForm } from '@/components/admin/movie-form';
import { requirePagePermission } from '@/lib/auth';
export const metadata={title:'Add movie'};
export default async function NewMoviePage(){await requirePagePermission('content.create','/admin/movies/new');return <><header className="admin-page-head"><div><span>Catalog editor</span><h1>Add a movie</h1><p>Start with accurate metadata and the most restrictive truthful rights status.</p></div></header><MovieForm/></>;}
