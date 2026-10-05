import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import { Empty, Layout, type Bootstrap } from './components';
import { ContentBody, type ContentDocument } from './content';
import { AdminLogin, AdminOrders, AdminPlaceholder, AdminProductNew, AdminProducts } from './pages/Admin';
import { AdminContent } from './pages/AdminContent';
import { AdminDashboardControl, AdminInventoryControl } from './pages/AdminOperations';
import { AdminTransactionsControl } from './pages/AdminTransactions';
import { Checkout, Track } from './pages/Checkout';
import { Cart, Home, ProductDetail, Shop, Wishlist } from './pages/Store';

const defaultBootstrap: Bootstrap = { store: { name:'Development Clothing Store' }, categories:[] };
const policyMap: Record<string, string> = { '/about':'about', '/contact':'contact', '/size-guide':'size-guide', '/delivery':'delivery', '/returns':'returns', '/faq':'faq', '/privacy':'privacy', '/terms':'terms' };
const contentLinks = [
  { key:'about', label:'Our story', group:'About' },
  { key:'contact', label:'Contact us', group:'About' },
  { key:'delivery', label:'Delivery information', group:'Customer care' },
  { key:'returns', label:'Returns & exchanges', group:'Customer care' },
  { key:'size-guide', label:'Size guide', group:'Customer care' },
  { key:'faq', label:'Frequently asked questions', group:'Customer care' },
  { key:'privacy', label:'Privacy notice', group:'Policies' },
  { key:'terms', label:'Terms & conditions', group:'Policies' }
] as const;

function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get('email') || '').trim();
    const mobile = String(fields.get('mobile') || '').trim();
    setBusy(true); setError(''); setSent(false);
    try {
      await api('/enquiries', { method:'POST', body:JSON.stringify({
        name:String(fields.get('name') || '').trim(),
        message:String(fields.get('message') || '').trim(),
        website:String(fields.get('website') || ''),
        ...(email ? { email } : {}),
        ...(mobile ? { mobile } : {})
      }) });
      form.reset();
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your message could not be sent. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="contact-card" aria-labelledby="contact-form-title">
    <div className="contact-card-heading"><span>Send an enquiry</span><h2 id="contact-form-title">How can we help?</h2><p>Tell us what you need and include an order reference when your question is about an existing order.</p></div>
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form-row"><label>Full name<input name="name" minLength={2} maxLength={100} autoComplete="name" required placeholder="Your name"/></label><label>Email address <small>Optional</small><input name="email" type="email" autoComplete="email" placeholder="you@example.com"/></label></div>
      <label>Mobile number <small>Optional</small><input name="mobile" inputMode="tel" autoComplete="tel" pattern="\+?[0-9]{9,15}" placeholder="e.g. +94771234567"/></label>
      <label>Message<textarea name="message" minLength={10} maxLength={2000} rows={6} required placeholder="Product, size, order reference, or question…"/></label>
      <label className="contact-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {sent && <p className="form-success" role="status">Thank you. Your enquiry has been received by the store team.</p>}
      <button className="button" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}</button>
    </form>
  </section>;
}

function ContentPage({ contentKey }: { contentKey: string }) {
  const [data, setData] = useState<ContentDocument>();
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    setData(undefined); setMissing(false);
    api<ContentDocument>(`/content/${contentKey}`).then(setData).catch(() => setMissing(true));
  }, [contentKey]);
  if (missing) return <Empty title="Owner review required">This page is still an unpublished draft. The owner can review and publish it from Admin → Website content.</Empty>;
  if (!data) return <div className="loading">Loading…</div>;
  const current = contentLinks.find(link => link.key === contentKey);
  return <div className="content-page">
    <header className="content-hero"><div><nav aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>{current?.label || data.title}</span></nav><p>{current?.group || 'Store information'}</p><h1>{data.title}</h1><span className="content-hero-rule"/></div></header>
    <div className="content-layout">
      <aside className="content-side-nav" aria-label="Information pages"><span>Explore</span>{contentLinks.map(link => <a key={link.key} href={`/${link.key}`} className={link.key === contentKey ? 'active' : ''} aria-current={link.key === contentKey ? 'page' : undefined}>{link.label}</a>)}</aside>
      <article className="content-article"><ContentBody body={data.body}/>{contentKey === 'contact' && <ContactForm/>}</article>
    </div>
  </div>;
}

export function App({ url, initialData }: { url?: string; initialData?: any }) {
  const currentUrl = new URL(url ?? (typeof location === 'undefined' ? 'http://local/' : location.href), 'http://local');
  const path = currentUrl.pathname.replace(/\/$/, '') || '/';
  const [bootstrap, setBootstrap] = useState<Bootstrap>(initialData?.bootstrap || defaultBootstrap);
  useEffect(() => { if (!initialData?.bootstrap) api<Bootstrap>('/bootstrap').then(setBootstrap).catch(() => {}); }, []);

  if (path === '/admin/login') return <AdminLogin/>;
  if (path === '/admin') return <AdminDashboardControl/>;
  if (path === '/admin/products') return <AdminProducts/>;
  if (path === '/admin/products/new') return <AdminProductNew/>;
  if (path === '/admin/inventory') return <AdminInventoryControl/>;
  if (path === '/admin/transactions') return <AdminTransactionsControl/>;
  if (path === '/admin/orders') return <AdminOrders/>;
  if (path === '/admin/content') return <AdminContent/>;
  if (path.startsWith('/admin/')) return <AdminPlaceholder title={path.split('/').pop()!.replaceAll('-', ' ')}/>;

  let page: React.ReactNode;
  if (path === '/') page = <Home bootstrap={bootstrap} initial={initialData}/>;
  else if (path === '/shop' || path === '/search') page = <Shop initial={initialData} bootstrap={bootstrap} search={currentUrl.search}/>;
  else if (path.startsWith('/products/')) page = <ProductDetail bootstrap={bootstrap} product={initialData?.product}/>;
  else if (path === '/cart') page = <Cart/>;
  else if (path === '/checkout') page = <Checkout bootstrap={bootstrap}/>;
  else if (path === '/wishlist') page = <Wishlist/>;
  else if (path === '/track') page = <Track/>;
  else if (policyMap[path]) page = <ContentPage contentKey={policyMap[path]}/>;
  else page = <Empty title="Page not found">The page may have moved. <a href="/shop">Return to the collection</a>.</Empty>;
  return <Layout bootstrap={bootstrap} search={currentUrl.search} pathname={path}>{page}</Layout>;
}
