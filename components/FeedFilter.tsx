'use client';

import { useState } from 'react';
import { ArticleCard } from './ArticleCard';

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'news', label: 'أخبار عالمية' },
  { id: 'transfer', label: 'انتقالات' },
  { id: 'comparison', label: 'مقارنات' },
  { id: 'match_report', label: 'تقارير فنية' },
];

export function FeedFilter({ articles }: { articles: any[] }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredArticles = activeFilter === 'all' 
    ? articles 
    : articles.filter(a => a.category === activeFilter);

  if (articles.length === 0) return null;

  return (
    <div className="mt-24 pt-16 border-t border-zinc-900">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
        <div>
          <h2 className="text-[10px] font-black text-lime uppercase tracking-[0.5em] mb-3">تغذية شاملة</h2>
          <h3 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">مكتبة المقالات</h3>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-1 bg-zinc-950 border border-zinc-900 shadow-xl">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeFilter === cat.id 
                  ? 'bg-lime text-black shadow-[0_0_15px_rgba(179,212,0,0.3)]' 
                  : 'text-gray-500 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="border border-zinc-900 bg-zinc-950/50 p-24 text-center">
          <p className="text-gray-600 uppercase tracking-[0.3em] font-black text-xs">لا توجد أخبار في هذا القسم حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} compact={false} />
          ))}
        </div>
      )}
    </div>
  );
}
