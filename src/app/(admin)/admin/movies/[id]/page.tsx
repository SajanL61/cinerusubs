import { isValidObjectId } from 'mongoose';
import { notFound } from 'next/navigation';
import { MovieForm } from '@/components/admin/movie-form';
import { requirePagePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { Movie } from '@/models';
import { MediaVersionManager, type VersionRow } from '@/components/admin/media-version-manager';
import { getAdminMediaVersions } from '@/services/admin';
export const metadata={title:'Edit movie'};
export default async function EditMoviePage({params}:PageProps<'/admin/movies/[id]'>){const{user}=await requirePagePermission('content.update','/admin/movies');const{id}=await params;if(!isValidObjectId(id))notFound();await connectDb();const[movie,versions]=await Promise.all([Movie.findById(id).lean(),user.permissions.includes('media.read')?getAdminMediaVersions(id):Promise.resolve([])]);if(!movie)notFound();const initial=JSON.parse(JSON.stringify(movie));return <><header className="admin-page-head"><div><span>Catalog editor</span><h1>Edit {String(movie.title)}</h1><p>Changes are validated, permission-checked and written to the audit trail.</p></div></header><MovieForm initial={initial}/>{user.permissions.includes('media.upload')&&<MediaVersionManager contentId={id} initialVersions={versions as unknown as VersionRow[]}/>}</>;}
