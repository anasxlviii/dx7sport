'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  category: string;
  createdAt: string;
}

export default function EntertainmentAdmin() {
  const [quizzes, setQuizzes] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    setLoading(true);
    try {
      const response = await fetch(`/api/articles?category=quiz`);
      const data = await response.json();
      setQuizzes(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function seedQuizzes() {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (data.success) {
        fetchQuizzes();
      }
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <Link href="/admin" className="text-xs font-bold text-lime uppercase tracking-widest hover:text-white transition-colors">
            ← العودة للوحة التحكم
          </Link>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mt-4">قسم التسلية والألغاز</h1>
        </div>
        <button
          onClick={() => setIsConfirmOpen(true)}
          disabled={seeding}
          className="bg-zinc-900 text-lime border border-lime px-6 py-2.5 font-bold uppercase tracking-widest text-xs hover:bg-lime hover:text-black transition-all disabled:opacity-50"
        >
          {seeding ? 'جاري الإضافة...' : '🚀 إضافة ألعاب تجريبية'}
        </button>
      </div>


      <div className="grid grid-cols-1 gap-6">
        <div className="dxt-card p-8 border-lime/10 bg-gradient-to-br from-zinc-950 to-black">
          <h2 className="text-xl font-black text-white mb-4 italic">كيف يعمل قسم التسلية؟</h2>
          <p className="text-gray-400 text-sm leading-loose max-w-3xl">
            هذا القسم مخصص لإدارة الألعاب التفاعلية مثل "خمن اللاعب" و "خمن الفريق". 
            يمكنك توليد ألغاز جديدة باستخدام الذكاء الاصطناعي من خلال صفحة 
            <Link href="/admin/new" className="text-lime mx-1 underline">توليد مقال جديد</Link> 
            واختيار نوع "Quiz". سيقوم النظام تلقائياً بإنشاء الأسئلة والخيارات والتلميحات.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-lime border-t-transparent rounded-full"></div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="dxt-card p-24 text-center border-dashed border-zinc-800">
            <p className="text-gray-600 uppercase tracking-widest font-black text-xs">لا توجد ألعاب حالياً. اضغط على الزر أعلاه لإضافة ألعاب تجريبية.</p>
          </div>
        ) : (
          <div className="dxt-card overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-900">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">عنوان اللعبة</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">تاريخ الإنشاء</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-lime/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <Link href={`/admin/article/${quiz.id}`} className="text-sm font-bold text-white group-hover:text-lime transition-colors">
                        {quiz.title}
                      </Link>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {new Date(quiz.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-8 py-6 text-left">
                      <Link href={`/admin/article/${quiz.id}`} className="text-white hover:text-lime text-xs font-black uppercase tracking-widest transition-colors">
                        تعديل الأسئلة
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={seedQuizzes}
        title="إضافة ألعاب تجريبية"
        message="سيتم إضافة 3 ألعاب تجريبية (Quizzes) إلى الموقع. هل أنت متأكد؟"
        confirmLabel="إضافة"
        isDestructive={false}
      />
    </div>
  );
}
