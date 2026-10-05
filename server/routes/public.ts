import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { checkoutSchema } from '../../shared/contracts.js';
import { config } from '../config.js';
import { Category, Content, Enquiry, Inventory, Product, Setting, Variant } from '../models.js';
import { findTrackedOrder, placeOrder } from '../services/orders.js';

export const publicRouter = Router();
const checkoutLimit = rateLimit({ windowMs: 10 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

function publicProduct(product: any, variants: any[], balances: any[]) {
  const balanceMap = new Map(balances.map(b => [String(b.variant), b]));
  return { id: String(product._id), name: product.name, slug: product.slug, description: product.description,
    category: product.category ? { name: product.category.name, slug: product.category.slug } : undefined,
    images: product.images, tags: product.tags, material: product.material, fit: product.fit, care: product.care, featured: product.featured,
    variants: variants.map(v => { const inv = balanceMap.get(String(v._id)); const available = Math.max(0, (inv?.onHand || 0) - (inv?.reserved || 0)); return {
      id: String(v._id), sku: v.sku, options: v.options instanceof Map ? Object.fromEntries(v.options) : v.options, price: v.price, salePrice: v.salePrice,
      available, status: available === 0 ? 'out_of_stock' : available <= v.lowStockThreshold ? 'low_stock' : 'in_stock', images: v.images
    }; }) };
}

publicRouter.get('/bootstrap', async (_req, res) => {
  const [settings, categories] = await Promise.all([Setting.find({ key: { $in: ['store', 'homepage', 'delivery'] } }).lean(), Category.find({ visible: true }).sort({ displayOrder: 1 }).lean()]);
  const store = settings.find(s => s.key === 'store')?.value || {};
  res.json({ store: { name: store.name || config.STORE_NAME, logo: store.logo || '', whatsapp: /^\d{10,15}$/.test(store.whatsapp || config.WHATSAPP_NUMBER) ? (store.whatsapp || config.WHATSAPP_NUMBER) : '', contact: store.contact || {}, social: store.social || {} },
    homepage: settings.find(s => s.key === 'homepage')?.value || {}, categories: categories.map(c => ({ id: c._id, name: c.name, slug: c.slug, image: c.image })) });
});

publicRouter.get('/products', async (req, res) => {
  const query = z.object({ q: z.string().max(100).optional(), category: z.string().max(80).optional(), size: z.string().max(30).optional(), colour: z.string().max(50).optional(), available: z.enum(['true', 'false']).optional(), sale: z.enum(['true', 'false']).optional(), sort: z.enum(['newest', 'price-asc', 'price-desc', 'best-selling']).default('newest'), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(48).default(12) }).parse(req.query);
  const filter: any = { status: 'published' };
  if (query.q) filter.$text = { $search: query.q.replace(/[{}$]/g, '') };
  if (query.category) { const c = await Category.findOne({ slug: query.category, visible: true }); if (!c) return res.json({ items: [], page: 1, pages: 0, total: 0 }); filter.category = c._id; }
  let products = await Product.find(filter).populate('category', 'name slug').sort({ publishedAt: -1, _id: -1 }).lean();
  const productIds = products.map(p => p._id);
  let variants = await Variant.find({ product: { $in: productIds }, active: true }).lean();
  if (query.size) variants = variants.filter(v => v.options?.get?.('Size') === query.size || (v.options as any)?.Size === query.size);
  if (query.colour) variants = variants.filter(v => v.options?.get?.('Colour') === query.colour || (v.options as any)?.Colour === query.colour);
  const balances = await Inventory.find({ variant: { $in: variants.map(v => v._id) } }).lean();
  if (query.available === 'true') { const ids = new Set(balances.filter(b => b.onHand > b.reserved).map(b => String(b.variant))); variants = variants.filter(v => ids.has(String(v._id))); }
  if (query.sale === 'true') variants = variants.filter(v => v.salePrice != null);
  const variantProducts = new Set(variants.map(v => String(v.product))); products = products.filter(p => variantProducts.has(String(p._id)));
  const items = products.map(p => publicProduct(p, variants.filter(v => String(v.product) === String(p._id)), balances));
  if (query.sort.startsWith('price')) items.sort((a, b) => { const ap = Math.min(...a.variants.map(v => v.salePrice ?? v.price)); const bp = Math.min(...b.variants.map(v => v.salePrice ?? v.price)); return query.sort === 'price-asc' ? ap - bp : bp - ap; });
  const total = items.length; const start = (query.page - 1) * query.limit;
  res.json({ items: items.slice(start, start + query.limit), page: query.page, pages: Math.ceil(total / query.limit), total });
});

publicRouter.get('/products/:slug', async (req, res) => {
  const product: any = await Product.findOne({ slug: req.params.slug, status: 'published' }).populate('category', 'name slug').lean();
  if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  const variants = await Variant.find({ product: product._id, active: true }).lean();
  const balances = await Inventory.find({ variant: { $in: variants.map(v => v._id) } }).lean();
  res.json(publicProduct(product, variants, balances));
});

publicRouter.post('/checkout', checkoutLimit, async (req, res) => {
  const idempotencyKey = String(req.get('idempotency-key') || '');
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) return res.status(400).json({ error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'A valid Idempotency-Key header is required' } });
  const input = checkoutSchema.parse(req.body);
  const result = await placeOrder(input, idempotencyKey);
  res.status(result.replayed ? 200 : 201).json({ order: { orderNumber: result.order.orderNumber, total: result.order.total, currency: result.order.currency, paymentMethod: result.order.paymentMethod, items: result.order.items }, trackingToken: result.trackingToken, replayed: result.replayed });
});

publicRouter.post('/track', rateLimit({ windowMs: 10 * 60_000, limit: 20 }), async (req, res) => {
  const input = z.object({ orderNumber: z.string().min(8).max(40), trackingToken: z.string().min(32).max(100) }).strict().parse(req.body);
  const order = await findTrackedOrder(input.orderNumber, input.trackingToken);
  if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found or tracking link is invalid' } });
  res.set('Cache-Control', 'no-store').json(order);
});

publicRouter.get('/content/:key', async (req, res) => {
  const content: any = await Content.findOne({ key: req.params.key, status: 'published' }).lean();
  if (!content) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Content is not published' } });
  res.json({ key: content.key, title: content.title, body: content.body });
});

publicRouter.post('/enquiries', rateLimit({ windowMs: 60 * 60_000, limit: 5 }), async (req, res) => {
  const input = z.object({ name: z.string().min(2).max(100), email: z.email().optional(), mobile: z.string().regex(/^\+?[0-9]{9,15}$/).optional(), message: z.string().min(10).max(2000), website: z.literal('').optional() }).strict().parse(req.body);
  await Enquiry.create(input); res.status(201).json({ accepted: true });
});
