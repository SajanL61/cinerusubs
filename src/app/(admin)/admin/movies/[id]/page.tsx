import { isValidObjectId } from 'mongoose';
import { notFound } from 'next/navigation';
import { MovieForm } from '@/components/admin/movie-form';
import { requirePagePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { Movie } from '@/models';
export const metadata={title:'Edit movie'};
export default async function EditMoviePage({params}:PageProps<'/admin/movies/[id]'>){await requirePagePermission('content.update','/admin/movies');const{id}=await params;if(!isValidObjectId(id))notFound();await connectDb();const movie=await Movie.findById(id).lean();if(!movie)notFound();const initial=JSON.parse(JSON.stringify(movie));return <><header className="admin-page-head"><div><span>Catalog editor</span><h1>Edit {String(movie.title)}</h1><p>Changes are validated, permission-checked and written to the audit trail.</p></div></header><MovieForm initial={initial}/></>;}
