import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { createServer as createHttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { ZodError } from 'zod';
import { assertProductionConfig, config, isProduction } from './config.js';
import { connectDb } from './db.js';
import { Category, Content, Inventory, Product, Session, Setting, Variant } from './models.js';
import { adminRouter } from './routes/admin.js';
import { publicRouter } from './routes/public.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), isProduction ? '../..' : '..');

async function bootstrapData() {
  const [settings, categories] = await Promise.all([Setting.find({ key: { $in: ['store', 'homepage'] } }).lean(), Category.find({ visible: true }).sort({ displayOrder: 1 }).lean()]);
  const store: any = settings.find((s:any) => s.key === 'store')?.value || {};
  return { store: { name: store.name || config.STORE_NAME, logo: store.logo || '', whatsapp: /^\d{10,15}$/.test(store.whatsapp || config.WHATSAPP_NUMBER) ? (store.whatsapp || config.WHATSAPP_NUMBER) : '', contact: store.contact || {}, social: store.social || {} }, homepage: settings.find((s:any) => s.key === 'homepage')?.value || {}, categories: categories.map((c:any) => ({ id: String(c._id), name: c.name, slug: c.slug, image: c.image })) };
}

async function ssrData(url: string) {
  const parsed = new URL(url, config.PUBLIC_ORIGIN); const data: any = { bootstrap: await bootstrapData() };
  if (parsed.pathname.startsWith('/products/')) {
    const slug = parsed.pathname.split('/').pop(); const p:any = await Product.findOne({ slug, status: 'published' }).populate('category','name slug').lean();
    if (p) { const variants:any[] = await Variant.find({ product:p._id, active:true }).lean(); const balances:any[] = await Inventory.find({variant:{$in:variants.map(v=>v._id)}}).lean(); const map=new Map(balances.map(b=>[String(b.variant),b])); data.product={id:String(p._id),name:p.name,slug:p.slug,description:p.description,category:p.category?{name:p.category.name,slug:p.category.slug}:undefined,images:p.images,tags:p.tags,material:p.material,fit:p.fit,care:p.care,featured:p.featured,variants:variants.map(v=>{const b:any=map.get(String(v._id));const available=Math.max(0,(b?.onHand||0)-(b?.reserved||0));return{id:String(v._id),sku:v.sku,options:v.options instanceof Map?Object.fromEntries(v.options):v.options,price:v.price,salePrice:v.salePrice,available,status:available===0?'out_of_stock':available<=v.lowStockThreshold?'low_stock':'in_stock',images:v.images}})}; }
  }
  return data;
}

async function main() {
  assertProductionConfig(); await connectDb();
  const app = express(); const httpServer = createHttpServer(app);
  app.disable('x-powered-by'); app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc:["'self'"],scriptSrc:isProduction?["'self'"]:["'self'","'unsafe-inline'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'data:','https:'],connectSrc:["'self'",'ws:','wss:'],fontSrc:["'self'",'data:'],objectSrc:["'none'"],baseUri:["'self'"],frameAncestors:["'none'"] } }, crossOriginEmbedderPolicy:false }));
  app.use(compression()); app.use(cookieParser()); app.use(express.json({ limit:'256kb' }));
  app.get('/health', (_req,res)=>res.json({status:'ok',database:'connected',time:new Date().toISOString()}));
  app.use('/api/admin', adminRouter); app.use('/api', publicRouter);
  app.get('/robots.txt', (_req,res)=>res.type('text').send('User-agent: *\nDisallow: /admin\nDisallow: /checkout\nDisallow: /track\nSitemap: '+config.PUBLIC_ORIGIN+'/sitemap.xml'));
  app.get('/sitemap.xml', async (_req,res)=>{const [products,categories,content]=await Promise.all([Product.find({status:'published'}).select('slug updatedAt').lean(),Category.find({visible:true}).select('slug updatedAt').lean(),Content.find({status:'published'}).select('key updatedAt').lean()]);const urls=['', 'shop',...products.map((p:any)=>`products/${p.slug}`),...categories.map((c:any)=>`shop?category=${c.slug}`),...content.map((c:any)=>c.key)].map(u=>`<url><loc>${config.PUBLIC_ORIGIN}/${u}</loc></url>`).join('');res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`)});
  let vite: any;
  if (!isProduction) { const { createServer } = await import('vite'); vite = await createServer({ server:{middlewareMode:true}, appType:'custom' }); app.use(vite.middlewares); }
  else app.use('/assets', express.static(path.resolve(root,'dist/client/assets'),{immutable:true,maxAge:'1y'}));
  app.use(async (req,res,next)=>{ if(req.method!=='GET'||req.path.startsWith('/api'))return next(); try { const url=req.originalUrl; let template:string; let render:(u:string,d:any)=>string;
      if(!isProduction){template=await fs.readFile(path.resolve(root,'index.html'),'utf8');template=await vite.transformIndexHtml(url,template);({render}=await vite.ssrLoadModule('/client/entry-server.tsx'));}else{template=await fs.readFile(path.resolve(root,'dist/client/index.html'),'utf8');({render}=await import(path.resolve(root,'dist/ssr/entry-server.js')));}
      const initialData=await ssrData(url);const html=render(url,initialData);let title=config.STORE_NAME;let description='Browse clothing and order securely online.';if(initialData.product){title=`${initialData.product.name} | ${config.STORE_NAME}`;description=initialData.product.description.slice(0,155)}
      const head=`<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${config.PUBLIC_ORIGIN}${new URL(url,config.PUBLIC_ORIGIN).pathname}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">${req.path.startsWith('/admin')||['/checkout','/track'].includes(req.path)?'<meta name="robots" content="noindex,nofollow">':''}`;
      const serialized=JSON.stringify(initialData).replace(/</g,'\\u003c');res.set('Content-Type','text/html').set(req.path.startsWith('/admin')||['/checkout','/track'].includes(req.path)?'Cache-Control':'X-SSR','no-store').status(initialData.product===undefined&&req.path.startsWith('/products/')?404:200).send(template.replace('<!--head-outlet-->',head).replace('<!--ssr-outlet-->',html).replace('</body>',`<script id="initial-data" type="application/json">${serialized}</script></body>`));
    }catch(error){if(vite)vite.ssrFixStacktrace(error as Error);next(error)}});
  app.use((error:any,_req:Request,res:Response,next:NextFunction)=>{void next;const status=error.status|| (error instanceof ZodError?422:500);if(status>=500)console.error('Request failed',{message:error.message,code:error.code});res.status(status).json({error:{code:error.code||(error instanceof ZodError?'VALIDATION_ERROR':'INTERNAL_ERROR'),message:status>=500?'The service could not complete this request':error.message,fields:error instanceof ZodError?error.flatten().fieldErrors:undefined}})});
  const io=new SocketServer(httpServer,{path:'/live',cors:{origin:config.PUBLIC_ORIGIN,credentials:true}});io.use(async(socket,next)=>{try{const cookie=socket.handshake.headers.cookie||'';const raw=cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith('admin_session='))?.split('=')[1];if(!raw)return next(new Error('unauthorized'));const {createHash}=await import('node:crypto');const tokenHash=createHash('sha256').update(`${config.SESSION_SECRET}:${decodeURIComponent(raw)}`).digest('hex');const session=await Session.findOne({tokenHash,expiresAt:{$gt:new Date()}});if(!session)return next(new Error('unauthorized'));socket.data.user=String(session.user);next()}catch{next(new Error('unauthorized'))}});io.on('connection',socket=>socket.join(`admin:${socket.data.user}`));
  httpServer.listen(config.PORT,()=>console.log(`Clothing store listening at ${config.PUBLIC_ORIGIN}`));
}
function escapeHtml(value:string){return value.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!))}
main().catch(error=>{console.error('Startup failed:',error.message);process.exit(1)});
