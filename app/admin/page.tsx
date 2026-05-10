'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  category: string;
  excerpt: string;
  createdAt: string;
  publishedAt: string | null;
}

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [runningGhost, setRunningGhost] = useState(false);

  async function triggerGhostReporter() {
    if (!confirm('Are you sure you want to trigger the Ghost Reporter? It will fetch the latest news and generate articles automatically.')) return;
    setRunningGhost(true);
    try {
      const response = await fetch('/api/pipeline?secret=dx7-ghost-2024');
      const data = await response.json();
      if (data.status === 'success') {
        alert('Ghost Reporter sweep completed! Check your drafts for new articles.');
        fetchArticles();
      } else {
        alert('Ghost Reporter encountered an issue: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to trigger Ghost Reporter. Please check the logs.');
    } finally {
      setRunningGhost(false);
    }
  }

  useEffect(() => {
    fetchArticles();
  }, [filter, search]);

  async function fetchArticles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/articles?${params}`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteArticle(id: number) {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      setArticles(articles.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-red-100 text-red-800',
  };

  const categoryLabels = {
    news: 'أخبار',
    comparison: 'مقارنات',
    poll: 'استطلاع',
    match_report: 'تقرير مباراة',
    transfer: 'انتقالات',
  };

  const statusLabels = {
    all: 'الكل',
    draft: 'مسودة',
    published: 'منشور',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-xs font-bold text-lime uppercase tracking-[0.3em] mb-2">مركز القيادة</h2>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">لوحة التحكم</h1>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/entertainment"
            className="bg-zinc-900 text-white border border-zinc-800 px-6 py-2.5 font-bold uppercase tracking-widest text-xs hover:border-lime hover:text-lime transition-all"
          >
            🎮 إدارة التسلية
          </Link>
          <button
            onClick={triggerGhostReporter}
            disabled={runningGhost}
            className="bg-purple-900 text-white border border-purple-800 px-6 py-2.5 font-bold uppercase tracking-widest text-xs hover:border-purple-500 hover:bg-purple-800 transition-all disabled:opacity-50"
          >
            {runningGhost ? '👻 جاري البحث...' : '👻 تشغيل المراسل الشبح'}
          </button>
          <Link
            href="/admin/new"
            className="bg-lime text-black px-6 py-2.5 font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
          >
            + إضافة مقال جديد
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="dxt-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="بحث في الأخبار..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-border-subtle px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime transition-colors"
              dir="auto"
            />
          </div>
          <div className="flex gap-2 p-1 bg-black border border-border-subtle">
            {['all', 'draft', 'published'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === status
                    ? 'bg-lime text-black'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {statusLabels[status as keyof typeof statusLabels]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="text-center py-24">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-lime border-t-transparent rounded-full"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="dxt-card p-24 text-center border-dashed">
          <p className="text-gray-500 uppercase tracking-widest font-bold">لا توجد سجلات متاحة حالياً.</p>
        </div>
      ) : (
        <div className="dxt-card overflow-hidden">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-black/50">
              <tr>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  عنوان المقال
                </th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  القسم
                </th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  الحالة
                </th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  التاريخ
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-lime/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="max-w-md">
                      <Link
                        href={`/admin/article/${article.id}`}
                        className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-lime transition-colors"
                      >
                        {article.title}
                      </Link>
                      {article.excerpt && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic font-medium">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {categoryLabels[article.category as keyof typeof categoryLabels] || article.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                        article.status === 'published'
                          ? 'border-lime text-lime'
                          : article.status === 'draft'
                          ? 'border-gray-700 text-gray-500'
                          : 'border-red-900 text-red-500'
                      }`}
                    >
                      {statusLabels[article.status as keyof typeof statusLabels] || article.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {new Date(article.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-left text-sm font-medium">
                    <Link
                      href={`/admin/article/${article.id}`}
                      className="text-white hover:text-lime ml-6 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      تعديل
                    </Link>
                    <button
                      onClick={() => deleteArticle(article.id)}
                      className="text-red-900 hover:text-red-600 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
