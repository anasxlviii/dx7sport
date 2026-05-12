'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArticleRenderer } from '@/components/ArticleRenderer';

interface MediaImage { id: number; url: string; alt: string; }
interface Article {
  id: number; title: string; slug: string; content: string; excerpt: string;
  status: string; category: string; sourcePostUrl: string | null;
  featuredImage: string | null; createdAt: string; publishedAt: string | null;
  metadata: string;
  sources: Array<{ id: number; url: string; title: string; credibility: string; }>;
}

export default function ArticleEditClient({ id }: { id: string }) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Image manager state
  const [images, setImages] = useState<MediaImage[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgSearchQ, setImgSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'gallery'|'search'|'upload'|'paste'>('gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (id) fetchArticle(); }, [id]);

  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imgItem = items.find(i => i.type.startsWith('image/'));
      if (!imgItem) return;
      const file = imgItem.getAsFile();
      if (file) { e.preventDefault(); await uploadFile(file); }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [id]);

  async function fetchArticle() {
    try {
      const res = await fetch(`/api/articles/${id}`);
      const data = await res.json();
      if (res.ok) { setArticle(data); fetchImages(); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchImages() {
    const res = await fetch(`/api/article-images/${id}`);
    const data = await res.json();
    if (res.ok) setImages(data.images || []);
  }

  async function saveArticle(status?: string) {
    if (!article) return;
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title, content: article.content,
          excerpt: article.excerpt, status: status || article.status,
          category: article.category, featuredImage: article.featuredImage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setArticle(data.article);
        setSaveMsg(status === 'published' ? '✓ تم النشر!' : '✓ تم الحفظ');
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } finally { setSaving(false); }
  }

  async function publish() { await saveArticle('published'); }

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setImgLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/article-images/${id}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) { setImages(prev => [...prev, data.image]); }
      else alert('فشل الرفع: ' + data.error);
    } finally { setImgLoading(false); }
  }

  async function addImageByUrl(url: string, alt = '') {
    if (!url.trim()) return;
    setImgLoading(true);
    try {
      const res = await fetch(`/api/article-images/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), alt }),
      });
      const data = await res.json();
      if (res.ok) { setImages(prev => [...prev, data.image]); setPasteUrl(''); }
      else alert('فشل إضافة الصورة: ' + data.error);
    } finally { setImgLoading(false); }
  }

  async function deleteImage(mediaId: number) {
    await fetch(`/api/article-images/${id}?mediaId=${mediaId}`, { method: 'DELETE' });
    setImages(prev => prev.filter(i => i.id !== mediaId));
  }

  function setAsFeatured(url: string) { if (article) setArticle({ ...article, featuredImage: url }); }

  async function searchImages() {
    if (!imgSearchQ.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(imgSearchQ + ' football')}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } finally { setSearching(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-lime border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">جاري التحميل...</p>
      </div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 font-bold mb-4">المقال غير موجود</p>
        <Link href="/admin" className="text-lime text-sm">← العودة للوحة التحكم</Link>
      </div>
    </div>
  );

  const metadata = article.metadata ? (() => { try { return JSON.parse(article.metadata); } catch { return {}; } })() : {};

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Header */}
      <header className="bg-dark-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-400 hover:text-lime transition-colors text-sm font-bold uppercase tracking-widest">← العودة</Link>
              <div>
                <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">تعديل المقال</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 border ${article.status === 'published' ? 'border-lime text-lime' : 'border-yellow-500 text-yellow-500'}`}>
                  {article.status === 'published' ? 'منشور' : 'مسودة'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveMsg && <span className="text-lime text-xs font-bold animate-pulse">{saveMsg}</span>}
              <button onClick={() => setPreview(!preview)} className="px-4 py-2 border border-border-subtle text-xs font-bold uppercase tracking-widest text-gray-400 hover:border-lime hover:text-lime transition-all">
                {preview ? 'تعديل' : 'معاينة'}
              </button>
              <button onClick={() => saveArticle()} disabled={saving} className="px-4 py-2 border border-lime text-xs font-bold uppercase tracking-widest text-lime hover:bg-lime/10 transition-all disabled:opacity-50">
                {saving ? '...' : (article.status === 'published' ? 'حفظ التعديلات' : 'حفظ مسودة')}
              </button>
              {article.status !== 'published' && (
                <button onClick={publish} disabled={saving} className="px-5 py-2 bg-lime text-black text-xs font-black uppercase tracking-widest hover:bg-lime/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(179,212,0,0.3)]">
                  {saving ? '...' : 'نشر المقال ✓'}
                </button>
              )}
              {article.status === 'published' && (
                <div className="flex items-center gap-2">
                  <Link href={`/article/${article.slug}`} target="_blank" className="px-4 py-2 bg-zinc-900 border border-border-subtle text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-all">
                    عرض المباشر ←
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {preview ? (
              <div className="dxt-card p-10 bg-dark-surface">
                <h1 className="text-4xl font-black italic uppercase text-white mb-6">{article.title}</h1>
                {article.featuredImage && (
                  <img src={article.featuredImage} alt="" className="w-full h-64 object-cover mb-6 border border-border-subtle" />
                )}
                {article.excerpt && <p className="text-lg text-gray-400 font-medium mb-8 border-r-2 border-lime pr-4">{article.excerpt}</p>}
                <ArticleRenderer content={article.content} galleryImages={images} />
              </div>
            ) : (
              <>
                <div className="dxt-card p-6 bg-dark-surface">
                  <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">العنوان</label>
                  <input type="text" value={article.title} onChange={e => setArticle({ ...article, title: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-border-subtle text-white font-medium focus:border-lime focus:outline-none transition-colors" dir="auto" />
                </div>
                <div className="dxt-card p-6 bg-dark-surface">
                  <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">المقدمة القصيرة</label>
                  <textarea value={article.excerpt || ''} onChange={e => setArticle({ ...article, excerpt: e.target.value })}
                    rows={3} className="w-full px-4 py-3 bg-black border border-border-subtle text-white font-medium focus:border-lime focus:outline-none transition-colors" dir="auto" />
                </div>
                <div className="dxt-card p-6 bg-dark-surface">
                  <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">المحتوى (Markdown)</label>
                  <textarea value={article.content} onChange={e => setArticle({ ...article, content: e.target.value })}
                    rows={28} className="w-full px-4 py-3 bg-black border border-border-subtle text-gray-300 font-mono text-sm focus:border-lime focus:outline-none transition-colors" dir="auto" />
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            {/* Image Manager */}
            <div className="dxt-card bg-dark-surface overflow-hidden">
              <div className="p-5 border-b border-border-subtle flex items-center justify-between">
                <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em]">إدارة الصور</h3>
              </div>
              <div className="flex border-b border-border-subtle">
                {(['gallery','search','upload','paste'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-lime border-b-2 border-lime' : 'text-gray-600 hover:text-gray-400'}`}>
                    {tab === 'gallery' ? 'المكتبة' : tab === 'search' ? 'بحث' : tab === 'upload' ? 'رفع' : 'رابط'}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {activeTab === 'gallery' && (
                  <div>
                    {article.featuredImage && (
                      <div className="relative mb-4 group">
                        <img src={article.featuredImage} alt="" className="w-full h-36 object-cover border border-lime/30" />
                        <button onClick={() => setArticle({ ...article, featuredImage: null })}
                          className="absolute top-2 left-2 bg-black/80 text-red-400 text-[10px] font-bold px-2 py-1 border border-red-800 hover:bg-red-900/30">✕ حذف</button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {images.map(img => (
                        <div key={img.id} className="relative group">
                          <img src={img.url} alt={img.alt} className="w-full h-24 object-cover border border-border-subtle" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col gap-1 items-center justify-center p-1">
                            <button onClick={() => setAsFeatured(img.url)} className="w-full text-[9px] font-bold py-1 bg-lime text-black uppercase">غلاف</button>
                            <button onClick={() => deleteImage(img.id)} className="w-full text-[9px] font-bold py-1 bg-red-900/80 text-red-300 uppercase">حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'search' && (
                  <div>
                    <div className="flex gap-2 mb-4">
                      <input type="text" placeholder="Mbappe..." value={imgSearchQ} onChange={e => setImgSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchImages()}
                        className="flex-1 px-3 py-2 bg-black border border-border-subtle text-white text-xs focus:border-lime focus:outline-none" dir="ltr" />
                      <button onClick={searchImages} disabled={searching} className="px-3 py-2 bg-lime text-black text-[10px] font-black uppercase hover:bg-lime/90 disabled:opacity-50">{searching ? '...' : 'بحث'}</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 max-h-80 overflow-y-auto">
                      {searchResults.map((r, i) => (
                        <div key={i} className="relative group cursor-pointer" onClick={() => addImageByUrl(r.url, r.title)}>
                          <img src={r.thumbnail || r.url} alt={r.title} className="w-full h-20 object-cover border border-border-subtle hover:border-lime transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'upload' && (
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={async e => { for (const f of Array.from(e.target.files || [])) await uploadFile(f); e.target.value = ''; }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={imgLoading} className="w-full py-8 border-2 border-dashed border-border-subtle hover:border-lime text-gray-500 hover:text-lime text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex flex-col items-center gap-3">
                      <span>{imgLoading ? '⏳' : '⬆'}</span>
                      <span>{imgLoading ? 'جاري الرفع...' : 'اختر صور'}</span>
                    </button>
                  </div>
                )}
                {activeTab === 'paste' && (
                  <div className="space-y-3">
                    <textarea placeholder="https://..." value={pasteUrl} onChange={e => setPasteUrl(e.target.value)} rows={5} className="w-full px-3 py-2 bg-black border border-border-subtle text-white text-xs focus:border-lime focus:outline-none" dir="ltr" />
                    <button onClick={async () => { const urls = pasteUrl.split('\n').map(u => u.trim()).filter(Boolean); for (const url of urls) await addImageByUrl(url); }} disabled={imgLoading || !pasteUrl.trim()} className="w-full py-2 bg-lime text-black text-[10px] font-black uppercase tracking-widest hover:bg-lime/90 disabled:opacity-50">إضافة</button>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata and Stats */}
            <div className="dxt-card p-6 bg-dark-surface">
              <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em] mb-4">معلومات المقال</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">القسم</span>
                  <span className="text-lime uppercase text-xs font-bold">{article.category}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">الرابط</span>
                  <span className="font-mono text-xs text-gray-400 bg-black p-2 border border-border-subtle block break-all" dir="ltr">/article/{article.slug}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
