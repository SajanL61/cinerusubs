import { hashPassword } from './auth.js';
import { starterContent } from './contentDefaults.js';
import { connectDb, disconnectDb } from './db.js';
import { Category, Content, Inventory, InventoryMovement, Product, Setting, User, Variant } from './models.js';

async function owner() {
  const email = process.env.OWNER_EMAIL?.toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME || 'Store Owner';
  if (!email || !password || password.length < 12) throw new Error('Set OWNER_EMAIL and OWNER_PASSWORD (at least 12 characters).');
  if (await User.exists({ email })) throw new Error('A user with this email already exists.');
  await User.create({ name, email, passwordHash:await hashPassword(password), role:'owner', permissions:['*'] });
  console.log(`Owner created for ${email}. Clear OWNER_PASSWORD from your shell history/environment.`);
}

async function seed() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production.');
  const category = await Category.findOneAndUpdate(
    { slug:'development-essentials' },
    { $setOnInsert:{ name:'Development Essentials', description:'Clearly labelled demonstration catalogue.', visible:true, displayOrder:1 } },
    { upsert:true, new:true }
  );
  const product = await Product.findOneAndUpdate(
    { slug:'development-everyday-tee' },
    { $setOnInsert:{ name:'Development Sample — Everyday Tee', description:'A demonstration garment used to verify size, colour, pricing and stock workflows. Not real business inventory.', category:category._id, tags:['development sample','tee'], clothingType:'T-shirt', material:'Demo data — owner must replace', fit:'Regular', care:'Demo data — owner must replace', status:'published', featured:true, publishedAt:new Date(), images:[{ url:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80', alt:'Development sample T-shirt' }] } },
    { upsert:true, new:true }
  );
  const colours = ['Sand','Forest'];
  const sizes = ['S','M','L'];
  for (const colour of colours) for (const size of sizes) {
    const sku = `DEV-TEE-${colour.slice(0,2).toUpperCase()}-${size}`;
    const variant = await Variant.findOneAndUpdate(
      { sku },
      { $setOnInsert:{ product:product._id, options:{ Colour:colour, Size:size }, optionKey:`Colour:${colour}|Size:${size}`, price:size === 'L' ? 375000 : 350000, lowStockThreshold:2, active:true } },
      { upsert:true, new:true }
    );
    const inventory = await Inventory.findOneAndUpdate(
      { variant:variant._id },
      { $setOnInsert:{ sku, onHand:size === 'M' ? 1 : 6, reserved:0 } },
      { upsert:true, new:true }
    );
    await InventoryMovement.updateOne(
      { operationKey:`seed:${variant._id}` },
      { $setOnInsert:{ variant:variant._id, sku, type:'receipt', quantity:inventory.onHand, reason:'Development seed', operationKey:`seed:${variant._id}`, before:{ onHand:0, reserved:0, damaged:0 }, after:{ onHand:inventory.onHand, reserved:0, damaged:0 } } },
      { upsert:true }
    );
  }
  await Setting.findOneAndUpdate(
    { key:'store' },
    { $setOnInsert:{ value:{ name:'Development Clothing Store', whatsapp:'', contact:{}, social:{} } } },
    { upsert:true }
  );
  await Setting.findOneAndUpdate(
    { key:'homepage' },
    { $setOnInsert:{ value:{ announcement:'Development store — owner setup required before launch', heroTitle:'Everyday pieces, considered well.', heroText:'Explore a development catalogue built around real sizes, colours and availability.' } } },
    { upsert:true }
  );
  for (const page of starterContent) {
    await Content.findOneAndUpdate(
      { key:page.key },
      { $setOnInsert:{ title:page.title, body:page.body, status:'draft' } },
      { upsert:true }
    );
  }
  console.log('Development sample catalogue seeded without overwriting existing records.');
}

const command = process.argv[2];
connectDb()
  .then(async () => {
    if (command === 'create-owner') await owner();
    else if (command === 'seed') await seed();
    else throw new Error('Use create-owner or seed');
  })
  .then(disconnectDb)
  .catch(async error => {
    console.error(error.message);
    await disconnectDb();
    process.exit(1);
  });
