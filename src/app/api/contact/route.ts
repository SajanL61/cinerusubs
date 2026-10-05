import { z } from 'zod';
import { connectDb } from '@/lib/db';
import { useDemoData } from '@/lib/env';
import { apiError } from '@/lib/http';
import { enforceRateLimit } from '@/lib/rate-limit';
import { ContactMessage } from '@/models';

const schema=z.object({requester:z.string().trim().min(2).max(100),email:z.email(),message:z.string().trim().min(20).max(4000),website:z.literal('').optional()}).strict();
export async function POST(request:Request){try{await enforceRateLimit(request,'contact',5,60*60_000);const input=schema.parse(await request.json());if(!useDemoData){await connectDb();await ContactMessage.create({requester:input.requester,email:input.email,message:input.message})}return Response.json({accepted:true},{status:201})}catch(error){return apiError(error)}}
