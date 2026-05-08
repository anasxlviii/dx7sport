'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: string;
  category: string;
  sourcePostUrl: string | null;
  featuredImage: string | null;
  createdAt: string;
  publishedAt: string | null;
  metadata: string;
  sources: Array<{
    id: number;
    url: string;
    title: string;
    credibility: string;
  }>;
}

export default function ArticleEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (id) fetchArticle();
  }, [id]);

  async function fetchArticle() {
    try {
      const response = await fetch(`/api/articles/${id}`);
      const data = await response.json();
      if (!response.ok) {
        console.error(data.error);
        return;
      }
      setArticle(data);
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveArticle(status?: string) {
    if (!article) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          status: status || article.status,
          category: article.category,
          featuredImage: article.featuredImage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setArticle(data.article);
      }
    } catch (error) {
      console.error('Failed to save article:', error);
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    await saveArticle('published');
    router.push('/admin');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Article not found</p>
      </div>
    );
  }

  const metadata = article.metadata ? JSON.parse(article.metadata) : {};

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Header */}
      <header className="bg-dark-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="text-gray-400 hover:text-lime transition-colors text-sm font-bold uppercase tracking-widest flex items-center gap-2"
              >
                العودة ←
              </Link>
              <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">تعديل المقال</h1>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  الحالة:{' '}
                  <span
                    className={`px-2 py-0.5 ml-2 border ${
                      article.status === 'published'
                        ? 'border-lime text-lime'
                        : 'border-yellow-500 text-yellow-500'
                    }`}
                  >
                    {article.status === 'published' ? 'منشور' : 'مسودة'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreview(!preview)}
                className="px-4 py-2 border border-border-subtle text-xs font-bold uppercase tracking-widest text-gray-400 hover:border-lime hover:text-lime transition-all"
              >
                {preview ? 'تعديل' : 'معاينة'}
              </button>
              <button
                onClick={() => saveArticle()}
                disabled={saving}
                className="px-4 py-2 border border-lime text-xs font-bold uppercase tracking-widest text-lime hover:bg-lime/10 transition-all disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
              </button>
              {article.status !== 'published' && (
                <button
                  onClick={publish}
                  disabled={saving}
                  className="px-4 py-2 bg-lime text-black border border-lime text-xs font-black uppercase tracking-widest hover:bg-lime/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(179,212,0,0.3)]"
                >
                  {saving ? 'جاري النشر...' : 'نشر المقال'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            {preview ? (
              <div className="dxt-card p-10 bg-dark-surface">
                <h1 className="text-4xl font-black italic uppercase text-white mb-6">
                  {article.title}
                </h1>
                {article.excerpt && (
                  <p className="text-lg text-gray-400 font-medium mb-8 border-r-2 border-lime pr-4">{article.excerpt}</p>
                )}
                <div
                  dir="auto"
                  className="prose prose-invert prose-lg max-w-none prose-headings:uppercase prose-headings:italic prose-headings:font-black prose-a:text-lime prose-strong:text-lime"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="dxt-card p-6 bg-dark-surface">
                  <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={article.title}
                    onChange={(e) =>
                      setArticle({ ...article, title: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-black border border-border-subtle text-white font-medium focus:border-lime focus:outline-none transition-colors"
                    dir="auto"
                  />
                </div>

                <div className="dxt-card p-6 bg-dark-surface">
                  <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">
                    مقتطف (مقدمة قصيرة)
                  </label>
                  <textarea
                    value={article.excerpt || ''}
                    onChange={(e) =>
                      setArticle({ ...article, excerpt: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-black border border-border-subtle text-white font-medium focus:border-lime focus:outline-none transition-colors"
                    dir="auto"
                  />
                </div>

                <div className="dxt-card p-6 bg-dark-surface">
                  <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">
                    المحتوى (Markdown)
                  </label>
                  <textarea
                    value={article.content}
                    onChange={(e) =>
                      setArticle({ ...article, content: e.target.value })
                    }
                    rows={25}
                    className="w-full px-4 py-3 bg-black border border-border-subtle text-gray-300 font-mono text-sm focus:border-lime focus:outline-none transition-colors"
                    dir="auto"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fact Box */}
            {metadata.factBox && (
              <div className="dxt-card p-6 bg-dark-surface">
                <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em] mb-4">معلومات تكتيكية (Key Facts)</h3>
                <div
                  className="text-sm text-gray-400 font-medium whitespace-pre-line leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: metadata.factBox }}
                  dir="auto"
                />
              </div>
            )}

            {/* Featured Image */}
            {article.featuredImage && (
              <div className="dxt-card p-6 bg-dark-surface">
                <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em] mb-4">الصورة البارزة (Featured Image)</h3>
                <img src={article.featuredImage} alt="Featured" className="w-full h-auto border border-border-subtle" />
              </div>
            )}

            {/* Sources */}
            {article.sources && article.sources.length > 0 && (
              <div className="dxt-card p-6 bg-dark-surface">
                <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em] mb-4">
                  المصادر ({article.sources.length})
                </h3>
                <div className="space-y-4">
                  {article.sources.map((source) => (
                    <div key={source.id} className="text-sm border-b border-border-subtle pb-4 last:border-0 last:pb-0">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener"
                        className="text-gray-300 hover:text-lime line-clamp-2 font-bold mb-2 transition-colors"
                        dir="ltr"
                      >
                        {source.title}
                      </a>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                          source.credibility === 'high'
                            ? 'border-lime text-lime'
                            : 'border-gray-600 text-gray-500'
                        }`}
                      >
                        موثوقية {source.credibility}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Post */}
            {article.sourcePostUrl && (
              <div className="dxt-card p-6 bg-dark-surface">
                <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em] mb-4">
                  منشور الفيسبوك المصدر
                </h3>
                <a
                  href={article.sourcePostUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-sm text-gray-400 hover:text-lime break-all transition-colors font-mono"
                  dir="ltr"
                >
                  {article.sourcePostUrl}
                </a>
              </div>
            )}

            {/* Metadata */}
            <div className="dxt-card p-6 bg-dark-surface">
              <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em] mb-4">معلومات المقال</h3>
              <div className="space-y-4 text-sm text-gray-400">
                <p className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">القسم</span>
                  <span className="text-lime uppercase text-xs font-bold">{article.category}</span>
                </p>
                <p className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">تاريخ الإنشاء</span>
                  <span className="font-mono text-xs">{new Date(article.createdAt).toLocaleString('ar-EG')}</span>
                </p>
                {article.publishedAt && (
                  <p className="flex justify-between items-center border-b border-border-subtle pb-2">
                    <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">تاريخ النشر</span>
                    <span className="font-mono text-xs text-lime">{new Date(article.publishedAt).toLocaleString('ar-EG')}</span>
                  </p>
                )}
                <p className="flex flex-col gap-1">
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">الرابط (Slug)</span>
                  <span className="font-mono text-xs text-gray-300 bg-black p-2 border border-border-subtle break-all" dir="ltr">/article/{article.slug}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
