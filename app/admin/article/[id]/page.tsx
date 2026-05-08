'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function ArticleEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [params.id]);

  async function fetchArticle() {
    try {
      const response = await fetch(`/api/articles/${params.id}`);
      const data = await response.json();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Article</h1>
                <p className="text-sm text-gray-500">
                  Status:{' '}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      article.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {article.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreview(!preview)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {preview ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={() => saveArticle()}
                disabled={saving}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              {article.status !== 'published' && (
                <button
                  onClick={publish}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            {preview ? (
              <div className="bg-white rounded-lg shadow p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {article.title}
                </h1>
                {article.excerpt && (
                  <p className="text-lg text-gray-600 mb-6">{article.excerpt}</p>
                )}
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={article.title}
                    onChange={(e) =>
                      setArticle({ ...article, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt
                  </label>
                  <textarea
                    value={article.excerpt || ''}
                    onChange={(e) =>
                      setArticle({ ...article, excerpt: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content (Markdown)
                  </label>
                  <textarea
                    value={article.content}
                    onChange={(e) =>
                      setArticle({ ...article, content: e.target.value })
                    }
                    rows={20}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Fact Box */}
            {metadata.factBox && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Key Facts</h3>
                <div
                  className="text-sm text-gray-700 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: metadata.factBox }}
                />
              </div>
            )}

            {/* Sources */}
            {article.sources && article.sources.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Sources ({article.sources.length})
                </h3>
                <div className="space-y-2">
                  {article.sources.map((source) => (
                    <div key={source.id} className="text-sm">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener"
                        className="text-blue-600 hover:text-blue-800 line-clamp-2"
                      >
                        {source.title}
                      </a>
                      <span
                        className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                          source.credibility === 'high'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {source.credibility}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Post */}
            {article.sourcePostUrl && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Source Facebook Post
                </h3>
                <a
                  href={article.sourcePostUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-sm text-blue-600 hover:text-blue-800 break-all"
                >
                  {article.sourcePostUrl}
                </a>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Article Info</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Category:</span>{' '}
                  {article.category}
                </p>
                <p>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(article.createdAt).toLocaleString()}
                </p>
                {article.publishedAt && (
                  <p>
                    <span className="font-medium">Published:</span>{' '}
                    {new Date(article.publishedAt).toLocaleString()}
                  </p>
                )}
                <p>
                  <span className="font-medium">Slug:</span> /article/{article.slug}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
