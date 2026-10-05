import { ArrowRight, ChevronDown, Facebook, Heart, Instagram, Menu, MessageCircle, Search, ShieldCheck, ShoppingBag, UserRound, X, Youtube } from 'lucide-react';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { api } from './api';
import { useCart } from './store';

export type Bootstrap = { store: { name: string; logo?: string; whatsapp?: string; contact?: Record<string, string>; social?: Record<string, string> }; homepage?: any; categories: Array<{ id: string; name: string; slug: string; image?: { url: string; alt?: string } }> };

type MegaFacets = { colours: string[]; sizes: string[] };
type MegaProductResult = { items: Array<{ variants: Array<{ options: Record<string, string> }> }> };
const swatches:Record<string,string>={black:'#1f2526',cream:'#e8dfcf',blue:'#6f8fae',navy:'#172a46',olive:'#667153',rose:'#b87a78',sand:'#c7b69b',forest:'#17483e',white:'#f7f7f4',red:'#ba3a43',yellow:'#d8bd58',grey:'#8a9394',gray:'#8a9394',brown:'#725444',beige:'#d9c9ad'};
const swatchFor = (colour: string) => swatches[colour.toLowerCase()] || '#9aa6a4';

export function Layout({ bootstrap, search = '', pathname = '/', children }: PropsWithChildren<{ bootstrap: Bootstrap; search?: string; pathname?: string }>) {
  const [cart] = useCart();
  const [open, setOpen] = useState(false);
  const [megaSlug, setMegaSlug] = useState<string | null>(null);
  const [megaFacets, setMegaFacets] = useState<MegaFacets | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const navigationParams = new URLSearchParams(search);
  const currentCategory = navigationParams.get('category') || '';
  const currentSale = navigationParams.get('sale') === 'true';
  const isShopPage = pathname === '/shop' || pathname === '/search';
  const megaCategory = bootstrap.categories.find(category => category.slug === megaSlug);
  const megaPeers = bootstrap.categories.filter(category => category.slug !== megaSlug).slice(0, 4);
  useEffect(() => {
    if (!open && !megaSlug) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      const trigger = megaSlug ? triggerRefs.current.get(megaSlug) : undefined;
      setMegaSlug(null);
      setTimeout(() => trigger?.focus(), 0);
    };
    addEventListener('keydown', close);
    return () => removeEventListener('keydown', close);
  }, [open, megaSlug]);
  useEffect(() => {
    if (!megaSlug) { setMegaFacets(null); return; }
    let current = true;
    setMegaFacets(null);
    api<MegaProductResult>(`/products?category=${encodeURIComponent(megaSlug)}&limit=48`).then(result => {
      if (!current) return;
      const variants = result.items.flatMap(product => product.variants);
      const colours = Array.from(new Set(variants.map(variant => variant.options.Colour || variant.options.colour).filter((value): value is string => Boolean(value)))).sort();
      const sizeOrder = ['XXS','XS','S','M','L','XL','2XL','3XL','One Size'];
      const sizes = Array.from(new Set(variants.map(variant => variant.options.Size || variant.options.size).filter((value): value is string => Boolean(value)))).sort((a,b) => {
        const left=sizeOrder.indexOf(a); const right=sizeOrder.indexOf(b);
        return (left<0?99:left)-(right<0?99:right)||a.localeCompare(b);
      });
      setMegaFacets({ colours, sizes });
    }).catch(() => current && setMegaFacets({ colours:[], sizes:[] }));
    return () => { current = false; };
  }, [megaSlug]);
  useEffect(() => {
    const compact = matchMedia('(max-width:1000px)');
    const closeDesktopMenu = () => { if (compact.matches) setMegaSlug(null); };
    closeDesktopMenu();
    compact.addEventListener('change', closeDesktopMenu);
    return () => compact.removeEventListener('change', closeDesktopMenu);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  const openMobile = () => { setMegaSlug(null); setOpen(true); };
  const closeMega = (restoreFocus = false) => {
    const trigger = megaSlug ? triggerRefs.current.get(megaSlug) : undefined;
    setMegaSlug(null);
    if (restoreFocus) setTimeout(() => trigger?.focus(), 0);
  };
  const socialLinks = [
    { key:'instagram', label:'Instagram', icon:Instagram },
    { key:'facebook', label:'Facebook', icon:Facebook },
    { key:'youtube', label:'YouTube', icon:Youtube }
  ].flatMap(item => {
    const href = bootstrap.store.social?.[item.key];
    return href && /^https:\/\//i.test(href) ? [{ ...item, href }] : [];
  });
  return <div className="site-shell">
    <div className="announcement"><span>{bootstrap.homepage?.announcement || 'Thoughtful everyday style, made simple.'}</span><div><span>Sri Lanka (LKR)</span><a href="/track">Order tracking</a><a href="/contact">Contact</a></div></div>
    <div className="storefront-header"><header className={`site-header ${megaCategory?'mega-open':''}`}><button className="icon mobile-only" aria-label="Open navigation" aria-expanded={open} aria-controls="mobile-navigation" onClick={openMobile}><Menu /></button><a className="wordmark" href="/">{bootstrap.store.logo ? <img src={bootstrap.store.logo} alt={bootstrap.store.name} /> : <><span>STYLE</span>HUB</>}</a><nav className="desktop-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/shop">Shop</a><a href="/shop?sort=newest">New arrivals</a><a className="sale-link" href="/shop?sale=true">Sale</a></nav><form className="header-search" action="/shop"><Search/><input name="q" aria-label="Search products" placeholder="Search for products…"/></form><div className="header-actions"><a className="icon mobile-search" href="/search" aria-label="Search"><Search /></a><a className="icon desktop-account" href="/admin/login" aria-label="Account"><UserRound/></a><a className="icon" href="/wishlist" aria-label="Wishlist"><Heart /></a><a className="icon cart-link" href="/cart" aria-label={`Cart with ${cart.reduce((s, i) => s + i.quantity, 0)} items`}><ShoppingBag /><span>{cart.reduce((s, i) => s + i.quantity, 0)}</span></a></div></header>
      <div className="category-rail"><nav aria-label="Product categories"><a href="/shop?sort=newest">New in</a><a className={isShopPage&&!currentCategory&&!currentSale?'is-current':undefined} aria-current={isShopPage&&!currentCategory&&!currentSale?'page':undefined} href="/shop">All clothing</a>{bootstrap.categories.map(category => <button type="button" className={`category-trigger ${isShopPage&&currentCategory===category.slug?'is-current':''} ${megaSlug===category.slug?'is-open':''}`} key={category.slug} ref={element=>{if(element)triggerRefs.current.set(category.slug,element);else triggerRefs.current.delete(category.slug)}} aria-current={isShopPage&&currentCategory===category.slug?'page':undefined} aria-haspopup="true" aria-expanded={megaSlug===category.slug} aria-controls={`mega-${category.slug}`} onClick={()=>setMegaSlug(current=>current===category.slug?null:category.slug)} onKeyDown={event=>{if(event.key!=='ArrowDown')return;event.preventDefault();setMegaSlug(category.slug);setTimeout(()=>globalThis.document.getElementById(`mega-${category.slug}`)?.querySelector<HTMLAnchorElement>('a')?.focus(),0)}}>{category.name}<ChevronDown/></button>)}<a className={`sale-link ${isShopPage&&currentSale&&!currentCategory?'is-current':''}`} aria-current={isShopPage&&currentSale&&!currentCategory?'page':undefined} href="/shop?sale=true">Sale</a></nav></div>
      {megaCategory&&<section className="mega-menu" id={`mega-${megaCategory.slug}`} aria-label={`${megaCategory.name} category menu`}><div className="mega-menu-inner"><div className="mega-menu-head"><div><span>Explore the collection</span><strong>{megaCategory.name}</strong></div><a href={`/shop?category=${megaCategory.slug}`}>View every {megaCategory.name.toLowerCase()} piece <ArrowRight/></a><button type="button" aria-label="Close category menu" onClick={()=>closeMega(true)}><X/></button></div><div className="mega-menu-grid">
        <section className="mega-link-group"><h2>Shop {megaCategory.name}</h2><a className="mega-primary-link" href={`/shop?category=${megaCategory.slug}`}>View all <ArrowRight/></a><a href={`/shop?category=${megaCategory.slug}&sort=newest`}>New arrivals</a><a href={`/shop?category=${megaCategory.slug}&available=true`}>Ready to order</a><a href={`/shop?category=${megaCategory.slug}&sale=true`}>Sale offers</a><a href="/size-guide">Size guide</a><a href="/delivery">Delivery information</a></section>
        <section className="mega-link-group mega-discover"><h2>Explore categories</h2>{megaPeers.map(category=><a href={`/shop?category=${category.slug}`} key={category.slug}><span className="mega-round-image" style={{backgroundImage:`url(${JSON.stringify(category.image?.url||'/assets/fashion-hero-v1.png')})`}}/><span><strong>{category.name}</strong><small>Discover the edit</small></span><ArrowRight/></a>)}</section>
        <section className="mega-link-group mega-options">{megaFacets?<><h2>Available colours</h2>{megaFacets.colours.length?megaFacets.colours.map(colour=><a href={`/shop?category=${megaCategory.slug}&colour=${encodeURIComponent(colour)}`} key={colour}><i style={{background:swatchFor(colour)}}/><span>{colour}</span></a>):<p className="mega-options-empty">Colour choices appear on each product.</p>}<h2 className="mega-size-title">Available sizes</h2>{megaFacets.sizes.length?<div className="mega-size-grid">{megaFacets.sizes.map(size=><a href={`/shop?category=${megaCategory.slug}&size=${encodeURIComponent(size)}`} key={size}>{size}</a>)}</div>:<a href="/size-guide">View the size guide <ArrowRight/></a>}</>:<><h2>Available options</h2><div className="mega-options-loading" aria-label="Loading available colours and sizes"><i/><i/><i/><i/><i/></div></>}</section>
        <a className="mega-feature" href={`/shop?category=${megaCategory.slug}`} style={{backgroundImage:`linear-gradient(180deg,transparent 32%,rgba(4,27,24,.78)),url(${JSON.stringify(megaCategory.image?.url||'/assets/fashion-hero-v1.png')})`}}><span>Curated for you</span><strong>{megaCategory.name}<br/>collection</strong><small>Explore live sizes and colours</small><b>Shop now <ArrowRight/></b></a>
      </div></div></section>}
    </div>
    {megaCategory&&<button type="button" tabIndex={-1} className="mega-backdrop" aria-label="Close category menu" onClick={()=>closeMega(true)}/>} 
    {open && <div className="drawer-backdrop" onClick={() => setOpen(false)}><aside className="drawer" id="mobile-navigation" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} aria-label="Mobile navigation"><button className="icon drawer-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button><nav><a href="/">Home</a><a href="/shop">Shop all</a><span className="drawer-label">Shop categories</span>{bootstrap.categories.map(category=><details className="drawer-category" key={category.slug}><summary><span className="drawer-category-image" style={{backgroundImage:`url(${JSON.stringify(category.image?.url||'/assets/fashion-hero-v1.png')})`}}/>{category.name}<ChevronDown/></summary><div><a href={`/shop?category=${category.slug}`}>View all</a><a href={`/shop?category=${category.slug}&sort=newest`}>New arrivals</a><a href={`/shop?category=${category.slug}&available=true`}>In stock</a><a href={`/shop?category=${category.slug}&sale=true`}>Sale</a></div></details>)}<a className="sale-link" href="/shop?sale=true">Sale</a><a href="/track">Track order</a></nav></aside></div>}
    <main>{children}</main>
    <footer>
      <div className="footer-brand"><strong><span>STYLE</span>HUB</strong><p>Considered everyday clothing with clear LKR pricing, real variant availability and a straightforward way to order.</p>{socialLinks.length > 0 && <div className="social-row">{socialLinks.map(item => <a key={item.key} href={item.href} target="_blank" rel="noreferrer" aria-label={`${bootstrap.store.name} on ${item.label}`}><item.icon/></a>)}</div>}</div>
      <div className="footer-links"><strong>Shop</strong><a href="/shop">All products</a>{bootstrap.categories.map(c => <a key={c.slug} href={`/shop?category=${c.slug}`}>{c.name}</a>)}<a className="sale-link" href="/shop?sale=true">Sale</a></div>
      <div className="footer-links"><strong>Help</strong><a href="/track">Track order</a><a href="/delivery">Delivery information</a><a href="/returns">Returns & exchanges</a><a href="/size-guide">Size guide</a><a href="/faq">FAQs</a></div>
      <div className="footer-links"><strong>About</strong><a href="/about">Our story</a><a href="/contact">Contact us</a><a href="/privacy">Privacy notice</a><a href="/terms">Terms & conditions</a></div>
      <div className="footer-care"><span className="footer-care-icon"><MessageCircle/></span><strong>Need a little help?</strong><p>Ask about a product, sizing or an existing order. The store team will review your enquiry.</p><a href="/contact">Contact customer care <ArrowRight/></a><small><ShieldCheck/> Guest checkout · Private order tracking</small></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} STYLEHUB Development Demo. Owner setup required before public launch.</span><nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></nav></div>
    </footer>
    {bootstrap.store.whatsapp && <a className="whatsapp" href={`https://wa.me/${bootstrap.store.whatsapp}?text=${encodeURIComponent(`Hello ${bootstrap.store.name}, I have a question.`)}`} target="_blank" rel="noreferrer" aria-label="Contact us on WhatsApp">WhatsApp</a>}
  </div>;
}

export function Empty({ title, children }: PropsWithChildren<{ title: string }>) { return <section className="empty"><h1>{title}</h1><p>{children}</p></section>; }
export function Status({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: string }>) { return <span className={`status ${tone}`}>{children}</span>; }
