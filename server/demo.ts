import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { starterContent } from './contentDefaults.js';

console.log('Starting the development-only in-memory database…');
const replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
process.env.NODE_ENV = 'development';
process.env.PORT = '4001';
process.env.PUBLIC_ORIGIN = 'http://localhost:4001';
process.env.MONGODB_URI = replicaSet.getUri('clothing_store');

const { connectDb, disconnectDb } = await import('./db.js');
const { Category, Content, Inventory, InventoryMovement, Product, Setting, User, Variant } = await import('./models.js');
const { hashPassword } = await import('./auth.js');
const { randomBytes } = await import('node:crypto');
await connectDb();

const catalogue = [
  { category:'T-Shirts', categorySlug:'t-shirts', name:'Demo Classic T-Shirt', slug:'demo-classic-t-shirt', type:'T-shirt', price:299000, colours:['Forest','Cream','Black'], image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=84' },
  { category:'Shirts', categorySlug:'shirts', name:'Demo Relaxed Oxford Shirt', slug:'demo-relaxed-oxford-shirt', type:'Shirt', price:499000, colours:['Blue','Cream'], image:'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=84' },
  { category:'Pants & Jeans', categorySlug:'pants-jeans', name:'Demo Straight Fit Jeans', slug:'demo-straight-fit-jeans', type:'Jeans', price:599000, colours:['Blue','Navy'], image:'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=84' },
  { category:'Shorts', categorySlug:'shorts', name:'Demo Tailored Shorts', slug:'demo-tailored-shorts', type:'Shorts', price:389000, colours:['Sand','Olive'], image:'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=84' },
  { category:'Dresses', categorySlug:'dresses', name:'Demo Summer Midi Dress', slug:'demo-summer-midi-dress', type:'Dress', price:699000, colours:['Olive','Rose'], image:'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=84' },
  { category:'Kids', categorySlug:'kids', name:'Demo Kids Cotton Set', slug:'demo-kids-cotton-set', type:'Kids clothing', price:349000, colours:['Blue','Cream'], image:'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=900&q=84' },
  { category:'Accessories', categorySlug:'accessories', name:'Demo Everyday Sunglasses', slug:'demo-everyday-sunglasses', type:'Accessory', price:249000, colours:['Black','Sand'], image:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=84' },
  { category:'Activewear', categorySlug:'activewear', name:'Demo Essential Hoodie', slug:'demo-essential-hoodie', type:'Hoodie', price:549000, colours:['Cream','Navy'], image:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=84' }
];

for (const [index, item] of catalogue.entries()) {
  const category = await Category.create({ name:item.category, slug:item.categorySlug, description:'Development demonstration category.', visible:true, displayOrder:index + 1, image:{ url:item.image, alt:item.category } });
  const product = await Product.create({ name:item.name, slug:item.slug, description:'A clearly labelled demonstration product used to preview the complete shopping experience. Replace before launch.', category:category._id, tags:['development sample', item.type.toLowerCase()], clothingType:item.type, material:'Development sample material', fit:'Regular', care:'Development sample care instructions', status:'published', featured:index < 5, publishedAt:new Date(Date.now() - index * 86_400_000), images:[{ url:item.image, alt:item.name }] });
  const sizes = item.type === 'Accessory' ? ['One Size'] : item.type === 'Kids clothing' ? ['4Y','6Y','8Y'] : ['S','M','L','XL'];
  for (const colour of item.colours) for (const size of sizes) {
    const sku = `DEMO-${index + 1}-${colour.slice(0, 2).toUpperCase()}-${size.replace(' ', '')}`;
    const variant = await Variant.create({ product:product._id, sku, options:{ Colour:colour, Size:size }, optionKey:`Colour:${colour}|Size:${size}`, price:item.price + (size === 'XL' ? 25000 : 0), lowStockThreshold:2, active:true });
    const onHand = size === 'M' ? 2 : 6;
    await Inventory.create({ variant:variant._id, sku, onHand, reserved:0 });
    await InventoryMovement.create({ variant:variant._id, sku, type:'receipt', quantity:onHand, reason:'Development demo seed', operationKey:`demo:${variant._id}`, before:{ onHand:0, reserved:0, damaged:0 }, after:{ onHand, reserved:0, damaged:0 } });
  }
}

await Setting.create({ key:'store', value:{ name:'STYLEHUB Development Demo', whatsapp:'', contact:{}, social:{} } });
await Setting.create({ key:'homepage', value:{ announcement:'Development demo — replace sample catalogue before launch', heroImage:'/assets/fashion-hero-v1.png', heroTitle:'Wear Your Story', heroText:'High-quality everyday style for every moment.' } });
const demoOwnerPassword = `Demo-${randomBytes(8).toString('base64url')}!9`;
await User.create({ name:'Demo Owner', email:'owner@demo.local', passwordHash:await hashPassword(demoOwnerPassword), role:'owner', permissions:['*'] });
for (const page of starterContent) await Content.create({ ...page, status:'published' });
await disconnectDb();
console.log('Demo catalogue seeded. Starting the store at http://localhost:4001');
console.log(`Temporary admin: owner@demo.local / ${demoOwnerPassword}`);
await import('./index.js');

async function stop() { await replicaSet.stop(); }
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
