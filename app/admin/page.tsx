'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PipelineLogModal from '@/components/PipelineLogModal';
import ConfirmModal from '@/components/ConfirmModal';
import { Trash2, EyeOff, Share2, CheckSquare, Square } from 'lucide-react';

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
  const [pipelineResults, setPipelineResults] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  
  // Selection & Bulk State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  
  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  async function triggerGhostReporter() {
    setConfirmModal({
      isOpen: true,
      title: 'تشغيل المراسل الشبح',
      message: 'هل أنت متأكد من رغبتك في تشغيل المراسل الشبح؟ سيقوم بالبحث عن آخر الأخبار وتوليد مقالات تلقائياً.',
      isDestructive: false,
      onConfirm: async () => {
        setRunningGhost(true);
        setPipelineResults([]);
        try {
          const response = await fetch('/api/pipeline?secret=dx7-ghost-2024');
          const data = await response.json();
          if (data.status === 'success' || data.results) {
            setPipelineResults(data.results || []);
            setShowLogModal(true);
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
    });
  }

  useEffect(() => {
    fetchArticles();
    setSelectedIds([]); // Reset selection on filter/search change
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
    setConfirmModal({
      isOpen: true,
      title: 'حذف المقال',
      message: 'هل أنت متأكد من رغبتك في حذف هذا المقال نهائياً؟ لا يمكن التراجع عن هذه العملية.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/articles/${id}`, { method: 'DELETE' });
          setArticles(articles.filter(a => a.id !== id));
          setSelectedIds(prev => prev.filter(sid => sid !== id));
        } catch (error) {
          console.error('Failed to delete article:', error);
        }
      }
    });
  }

  async function bulkDelete() {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'حذف جماعي',
      message: `هل أنت متأكد من رغبتك في حذف ${selectedIds.length} مقال؟ سيتم مسحهم نهائياً من قاعدة البيانات.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsBulkActionLoading(true);
        try {
          await Promise.all(selectedIds.map(id => fetch(`/api/articles/${id}`, { method: 'DELETE' })));
          setArticles(articles.filter(a => !selectedIds.includes(a.id)));
          setSelectedIds([]);
        } catch (error) {
          console.error('Bulk delete failed:', error);
        } finally {
          setIsBulkActionLoading(false);
        }
      }
    });
  }

  async function bulkUpdateStatus(newStatus: 'published' | 'draft') {
    if (selectedIds.length === 0) return;
    setIsBulkActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => 
        fetch(`/api/articles/${id}`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      ));
      fetchArticles();
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk update failed:', error);
    } finally {
      setIsBulkActionLoading(false);
    }
  }

  function toggleSelection(id: number) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === articles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(articles.map(a => a.id));
    }
  }

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="text-xs font-bold text-lime uppercase tracking-[0.3em] mb-2">مركز القيادة</h2>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">لوحة التحكم</h1>
        </div>
        <div className="flex flex-wrap gap-4">
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

      {/* Bulk Actions & Filters Container */}
      <div className="space-y-4 mb-8">
        {selectedIds.length > 0 && (
          <div className="bg-lime/10 border border-lime/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-lime uppercase tracking-widest">
                تم تحديد {selectedIds.length} عنصر
              </span>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase"
              >
                إلغاء التحديد
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateStatus('published')}
                disabled={isBulkActionLoading}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:border-lime border border-zinc-800 transition-all"
              >
                <Share2 size={12} /> إعادة نشر
              </button>
              <button
                onClick={() => bulkUpdateStatus('draft')}
                disabled={isBulkActionLoading}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:border-zinc-500 border border-zinc-800 transition-all"
              >
                <EyeOff size={12} /> إخفاء
              </button>
              <button
                onClick={bulkDelete}
                disabled={isBulkActionLoading}
                className="flex items-center gap-2 bg-red-900/20 text-red-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-900 hover:text-white border border-red-900/30 transition-all"
              >
                <Trash2 size={12} /> حذف المحدد
              </button>
            </div>
          </div>
        )}

        <div className="dxt-card p-6">
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
        <div className="dxt-card overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-black/50">
              <tr>
                <th className="px-6 py-5 text-right">
                  <button onClick={toggleSelectAll} className="text-zinc-600 hover:text-lime transition-colors">
                    {selectedIds.length === articles.length ? <CheckSquare size={18} className="text-lime" /> : <Square size={18} />}
                  </button>
                </th>
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
                <tr key={article.id} className={`hover:bg-lime/[0.02] transition-colors group ${selectedIds.includes(article.id) ? 'bg-lime/[0.03]' : ''}`}>
                  <td className="px-6 py-6">
                    <button onClick={() => toggleSelection(article.id)} className="text-zinc-700 hover:text-lime transition-colors">
                      {selectedIds.includes(article.id) ? <CheckSquare size={18} className="text-lime" /> : <Square size={18} />}
                    </button>
                  </td>
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
      
      <PipelineLogModal 
        isOpen={showLogModal} 
        onClose={() => setShowLogModal(false)} 
        logs={pipelineResults} 
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}

