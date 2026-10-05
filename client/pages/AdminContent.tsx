import { CheckCircle2, ExternalLink, FileText, Save, Send } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { adminApi } from '../api';
import { Status } from '../components';
import { ContentBody, type ContentDocument } from '../content';
import { RequireAdmin } from './Admin';

const pageOrder = ['about','contact','delivery','returns','size-guide','faq','privacy','terms'] as const;
const pageLabels: Record<string, string> = {
  about:'Our story', contact:'Contact us', delivery:'Delivery information', returns:'Returns & exchanges',
  'size-guide':'Size guide', faq:'Frequently asked questions', privacy:'Privacy notice', terms:'Terms & conditions'
};

export function AdminContent() {
  const [pages, setPages] = useState<ContentDocument[]>([]);
  const [selected, setSelected] = useState<string>('about');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const sortedPages = useMemo(() => [...pages].sort((a,b) => pageOrder.indexOf(a.key as typeof pageOrder[number]) - pageOrder.indexOf(b.key as typeof pageOrder[number])), [pages]);
  const active = pages.find(page => page.key === selected);
  const dirty = Boolean(active && (active.title !== title || active.body !== body));

  useEffect(() => {
    adminApi<ContentDocument[]>('/content').then(result => {
      setPages(result);
      const initial = result.find(page => page.key === 'about') || result[0];
      if (initial) { setSelected(initial.key); setTitle(initial.title); setBody(initial.body); }
    }).catch(caught => setError(caught instanceof Error ? caught.message : 'Website content could not be loaded.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);

  const choosePage = (key: string) => {
    if (key === selected) return;
    if (dirty && !window.confirm('Discard the unsaved changes on this page?')) return;
    const next = pages.find(page => page.key === key);
    if (!next) return;
    setSelected(key); setTitle(next.title); setBody(next.body); setError(''); setNotice('');
  };

  const save = async (status: 'draft' | 'published') => {
    if (!active || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const updated = await adminApi<ContentDocument>(`/content/${active.key}`, { method:'PATCH', body:JSON.stringify({ title, body, status }) });
      setPages(current => current.map(page => page.key === updated.key ? updated : page));
      setNotice(status === 'published' ? 'Changes are live on the storefront.' : 'Draft saved. This page is hidden from the storefront.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The page could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save(active?.status === 'published' ? 'published' : 'draft');
  };

  return <RequireAdmin>
    <div className="admin-head"><div><p className="eyebrow">Storefront editor</p><h1>Website content</h1><p>Review, edit and publish the information linked from your storefront footer.</p></div>{active && <a className="admin-open-page" href={`/${active.key}`} target="_blank" rel="noreferrer"><ExternalLink/> View page</a>}</div>
    {error && !active && <div className="admin-warning">{error}</div>}
    {loading ? <div className="loading">Loading content…</div> : !pages.length ? <section className="admin-panel"><h2>No pages found</h2><p>Run the development seed or create the standard content records before editing.</p></section> : <div className="content-admin-layout">
      <aside className="admin-panel content-doc-list"><div className="content-doc-list-head"><FileText/><div><strong>Store pages</strong><span>{pages.filter(page => page.status === 'published').length} of {pages.length} published</span></div></div><nav>{sortedPages.map(page => <button type="button" key={page.key} className={selected === page.key ? 'active' : ''} onClick={() => choosePage(page.key)}><span>{pageLabels[page.key] || page.title}<small>/{page.key}</small></span><Status tone={page.status === 'published' ? 'good' : 'neutral'}>{page.status}</Status></button>)}</nav></aside>
      {active && <form className="admin-panel content-editor" onSubmit={submit}>
        <div className="content-editor-head"><div><span className="admin-kicker">Editing /{active.key}</span><h2>{pageLabels[active.key] || active.title}</h2></div><Status tone={active.status === 'published' ? 'good' : 'neutral'}>{active.status}</Status></div>
        <label className="content-title-field"><span>Page title</span><input value={title} onChange={event => setTitle(event.target.value)} minLength={2} maxLength={120} required/></label>
        <label className="content-body-field"><span>Page content</span><textarea value={body} onChange={event => setBody(event.target.value)} minLength={40} maxLength={30000} required spellCheck rows={22}/><small>Formatting: <b>## Heading</b>, <b>### Question</b>, <b>- List item</b>, and <b>&gt; Important note</b>. Plain text is safely displayed.</small></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="form-success" role="status"><CheckCircle2/>{notice}</p>}
        <div className="content-editor-actions"><span>{dirty ? 'Unsaved changes' : `Last saved ${active.updatedAt ? new Date(active.updatedAt).toLocaleString('en-LK') : 'recently'}`}</span><button type="button" className="button secondary" disabled={busy || (!dirty && active.status === 'draft')} onClick={() => void save('draft')}><Save/>{busy ? 'Saving…' : 'Save as draft'}</button><button type="button" className="button" disabled={busy || (!dirty && active.status === 'published')} onClick={() => void save('published')}><Send/>{busy ? 'Publishing…' : active.status === 'published' ? 'Publish changes' : 'Publish page'}</button></div>
        <section className="content-preview"><div className="content-preview-label"><span><FileText/> Live preview</span><small>Storefront typography preview</small></div><article><h1>{title || 'Untitled page'}</h1><ContentBody body={body}/></article></section>
      </form>}
    </div>}
  </RequireAdmin>;
}
