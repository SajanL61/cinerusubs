import { DATABASE_NAME } from '@/lib/db';
import { useDemoData } from '@/lib/env';
export function GET(){return Response.json({status:'ok',service:'cinerusubs',database:useDemoData?'demo':DATABASE_NAME,time:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}})}
