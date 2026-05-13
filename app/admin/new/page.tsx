'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import slugify from 'slugify';
import { ArticleRenderer } from '@/components/ArticleRenderer';

export default function NewArticlePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  // --- AI Pipeline state ---
  const [postContent, setPostContent] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Array<{ name: string; status: string; error?: string }>>([]);
  const [error, setError] = useState('');
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Manual write state ---
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('news');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [reformulating, setReformulating] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard Paste Handler (for AI + Manual mode image uploads)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (!isInputFocused) {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (!blob) continue;
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (mode === 'ai') {
                setImageBase64(dataUrl);
              } else {
                setFeaturedImage(dataUrl);
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [mode]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function runPipeline() {
    if (!postContent.trim() && !postUrl.trim() && !imageBase64) {
      setError('Please provide text, a URL, or an image');
      return;
    }
    setRunning(true);
    setError('');
    setSteps([
      { name: 'Extract Topic (Vision/Text)', status: 'running' },
      { name: 'Live Search Grounding', status: 'pending' },
      { name: 'Generate Article', status: 'pending' },
      { name: 'Save to Database', status: 'pending' },
    ]);
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent, postUrl: postUrl || undefined, imageBase64: imageBase64 || undefined }),
      });
      const data = await response.json();
      if (data.success) {
        setSteps(data.steps);
        setTimeout(() => router.push(`/admin/article/${data.article.id}`), 1000);
      } else {
        setSteps(data.steps || []);
        setError(data.error || 'Pipeline failed');
      }
    } catch (err) {
      setError('Failed to run pipeline. Please check your API keys.');
      setSteps(steps.map(s => ({ ...s, status: 'failed' })));
    } finally { setRunning(false); }
  }

  async function handleManualFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => { setFeaturedImage(reader.result as string); };
    reader.readAsDataURL(file);
  }

  async function reformulateContent() {
    if (!content.trim()) {
      setError('اكتب المحتوى أولاً قبل إعادة الصياغة');
      return;
    }
    setReformulating(true);
    setError('');
    try {
      const res = await fetch('/api/reformulate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.article) {
        if (data.article.title) setTitle(data.article.title);
        if (data.article.excerpt) setExcerpt(data.article.excerpt);
        if (data.article.content) setContent(data.article.content);
        setSaveMsg('✓ تمت إعادة الصياغة');
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setError(data.error || 'فشلت إعادة الصياغة');
      }
    } catch {
      setError('فشل الاتصال بخادم إعادة الصياغة');
    } finally { setReformulating(false); }
  }

  async function saveManual(publishNow = false) {
    if (!title.trim() || !content.trim()) {
      setError('العنوان والمحتوى مطلوبان');
      return;
    }
    setSaving(true);
    setError('');
    setSaveMsg('');
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim(),
          category,
          status: publishNow ? 'published' : 'draft',
          featuredImage: featuredImage || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/admin/article/${data.article.id}`);
      } else {
        setError(data.error || 'فشل الحفظ');
      }
    } catch { setError('فشل الاتصال بالخادم'); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      {/* Header */}
      <div className="mb-12">
        <Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-lime hover:text-white transition-colors">← العودة للوحة التحكم</Link>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mt-6">محتوى جديد</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">أنشئ مقالاً بالذكاء الاصطناعي أو اكتبه يدوياً</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-10 bg-zinc-950 border border-border-subtle p-1 w-fit">
        <button onClick={() => setMode('ai')} className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${mode === 'ai' ? 'bg-lime text-black' : 'text-gray-500 hover:text-white'}`}>🤖 الذكاء الاصطناعي</button>
        <button onClick={() => setMode('manual')} className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-lime text-black' : 'text-gray-500 hover:text-white'}`}>✍️ كتابة يدوية</button>
      </div>

      {mode === 'ai' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Input Form */}
          <div className="space-y-8">
            <div className="dxt-card p-8">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">الخيار 1: استخبارات بصرية (ارفع صورة أو الصق Ctrl+V)</label>
              <div onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => setIsHoveringImage(true)} onMouseLeave={() => setIsHoveringImage(false)}
                className={`border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 relative group ${imageBase64 ? 'border-lime bg-lime/5' : 'border-zinc-800 hover:border-lime/50 bg-black'}`}>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {imageBase64 ? (
                  <div className="relative w-full">
                    <img src={imageBase64} alt="Preview" className="w-full h-48 object-cover border border-lime/30" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest bg-black px-4 py-2 border border-zinc-800">اضغط للتغيير أو الصق صورة جديدة</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setImageBase64(null); }}
                      className="absolute top-2 left-2 bg-black/80 text-red-500 text-[10px] font-black px-2 py-1 border border-red-900 z-20">إزالة</button>
                  </div>
                ) : (
                  <>
                    <span className="text-3xl mb-4 group-hover:scale-110 transition-transform">📸</span>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">اضغط للرفع أو الصق مباشرة</p>
                    <p className="text-[9px] text-gray-600 mt-2 uppercase">سيتعرف الذكاء الاصطناعي على اللاعبين والحدث</p>
                  </>
                )}
              </div>
            </div>
            <div className="dxt-card p-8">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">الخيار 2: رابط المصدر (Facebook/Web)</label>
              <input type="url" placeholder="https://www.facebook.com/..." value={postUrl} onChange={(e) => setPostUrl(e.target.value)} disabled={running}
                className="w-full bg-black border border-border-subtle px-6 py-3 text-sm text-white focus:outline-none focus:border-lime transition-all disabled:opacity-50" dir="ltr" />
            </div>
            <div className="dxt-card p-8">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">الخيار 3: نص الخبر أو الكلمات المفتاحية</label>
              <textarea placeholder="مثال: انتقال مبابي لريال مدريد، آخر أخبار تشافي..." value={postContent} onChange={(e) => setPostContent(e.target.value)} disabled={running}
                rows={5} className="w-full bg-black border border-border-subtle px-6 py-4 text-sm text-white focus:outline-none focus:border-lime transition-all disabled:opacity-50 font-medium" />
            </div>
            {error && <div className="p-4 border border-red-900 bg-red-950/20 text-red-500 text-xs font-black uppercase tracking-widest">⚠️ {error}</div>}
            <button onClick={runPipeline} disabled={running || (!postContent.trim() && !postUrl.trim() && !imageBase64)}
              className="w-full bg-lime text-black py-5 font-black uppercase tracking-[0.3em] text-sm hover:bg-white transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(179,212,0,0.2)]">
              {running ? 'جاري معالجة المعلومات...' : 'توليد المقال والحقائق'}
            </button>
          </div>
          {/* Status */}
          <div className="space-y-8">
            {steps.length > 0 ? (
              <div className="dxt-card p-10 border-lime/20 h-full">
                <h2 className="text-xs font-black text-lime uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                  <span className="w-2 h-2 bg-lime rounded-full animate-pulse" />حالة العمليات</h2>
                <div className="space-y-10">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-6 group">
                      <div className={`w-10 h-10 flex items-center justify-center border font-black text-xs transition-all ${step.status === 'completed' ? 'border-lime bg-lime text-black' : step.status === 'running' ? 'border-white text-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.2)]' : step.status === 'failed' ? 'border-red-600 text-red-600 bg-red-950/20' : 'border-border-subtle text-gray-700'}`}>
                        {step.status === 'completed' ? '✓' : step.status === 'running' ? '>>' : step.status === 'failed' ? '!!' : i + 1}
                      </div>
                      <div className="flex-1 pt-2">
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${step.status === 'failed' ? 'text-red-600' : step.status === 'running' ? 'text-white' : step.status === 'completed' ? 'text-gray-400' : 'text-gray-800'}`}>{step.name}</span>
                        {step.status === 'running' && <div className="mt-4 w-full h-1 bg-zinc-900 overflow-hidden"><div className="h-full bg-lime animate-[progress_2s_ease-in-out_infinite]" /></div>}
                        {step.error && <p className="text-[10px] text-red-600 font-bold uppercase mt-2 italic border-r-2 border-red-600 pr-3">{step.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="dxt-card p-12 border-dashed border-zinc-800 bg-zinc-950/30 flex flex-col items-center justify-center text-center h-full opacity-40">
                <div className="w-20 h-20 border border-zinc-800 rounded-full flex items-center justify-center mb-8"><span className="text-4xl">📡</span></div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] leading-relaxed">في انتظار المدخلات...<br />اختر أحد الخيارات لتفعيل معالج الذكاء الاصطناعي</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual Write Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="dxt-card p-8 bg-dark-surface">
              <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">العنوان *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان المقال..." dir="auto"
                className="w-full px-4 py-3 bg-black border border-border-subtle text-white font-medium text-lg focus:border-lime focus:outline-none transition-colors" />
              {title.trim() && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-600 font-mono" dir="ltr">
                  <span>🔗 /article/{slugify(title, { lower: true, strict: true })}</span>
                </div>
              )}
            </div>
            {/* Featured Image */}
            <div className="dxt-card p-8 bg-dark-surface">
              <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">صورة الغلاف</label>
              <div onClick={() => manualFileInputRef.current?.click()}
                className={`border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 relative group ${featuredImage ? 'border-lime bg-lime/5' : 'border-zinc-800 hover:border-lime/50 bg-black'}`}>
                <input ref={manualFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleManualFileChange} />
                {featuredImage ? (
                  <div className="relative w-full">
                    <img src={featuredImage} alt="Preview" className="w-full h-48 object-cover border border-lime/30" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest bg-black px-4 py-2 border border-zinc-800">اضغط للتغيير أو الصق صورة جديدة (Ctrl+V)</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setFeaturedImage(null); }}
                      className="absolute top-2 left-2 bg-black/80 text-red-500 text-[10px] font-black px-2 py-1 border border-red-900 z-20">إزالة</button>
                  </div>
                ) : (
                  <>
                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">🖼️</span>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">اضغط للرفع أو الصق مباشرة (Ctrl+V)</p>
                    <p className="text-[9px] text-gray-600 mt-2">يُفضّل صورة 1200×630 بكسل</p>
                  </>
                )}
              </div>
            </div>
            {/* Excerpt */}
            <div className="dxt-card p-8 bg-dark-surface">
              <label className="block text-xs font-bold text-lime uppercase tracking-widest mb-3">المقدمة القصيرة</label>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="ملخص للمقال (ظهور في المعاينة ومحركات البحث)..." dir="auto"
                rows={3} className="w-full px-4 py-3 bg-black border border-border-subtle text-white font-medium focus:border-lime focus:outline-none transition-colors" />
            </div>
            {/* Content + Preview Toggle */}
            <div className="dxt-card p-8 bg-dark-surface">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-lime uppercase tracking-widest">المحتوى * (Markdown)</label>
                <button onClick={() => setPreview(!preview)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all ${preview ? 'bg-lime text-black border-lime' : 'text-gray-500 border-border-subtle hover:text-white hover:border-lime'}`}>
                  {preview ? 'تعديل' : 'معاينة'}
                </button>
              </div>
              {preview ? (
                <div className="bg-black border border-border-subtle p-6 min-h-[400px]">
                  {content.trim() ? (
                    <ArticleRenderer content={content} galleryImages={[]} />
                  ) : (
                    <p className="text-gray-600 text-sm font-medium italic">لا يوجد محتوى للعرض</p>
                  )}
                </div>
              ) : (
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="اكتب المقال هنا... استخدم Markdown للتنسيق (**عريض**, ## عناوين, - قوائم)" dir="auto"
                  rows={28} className="w-full px-4 py-3 bg-black border border-border-subtle text-gray-300 font-mono text-sm focus:border-lime focus:outline-none transition-colors" />
              )}
            </div>
          </div>
          <div className="space-y-6">
            {/* Settings */}
            <div className="dxt-card p-6 bg-dark-surface">
              <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em] mb-4">إعدادات النشر</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">القسم</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black border border-border-subtle text-white text-xs focus:border-lime focus:outline-none">
                    <option value="news">أخبار</option>
                    <option value="match_report">تقرير مباراة</option>
                    <option value="transfer">انتقالات</option>
                    <option value="comparison">مقارنة</option>
                    <option value="poll">استفتاء</option>
                    <option value="quiz">مسابقة</option>
                  </select>
                </div>
                {saveMsg && <div className="p-3 border border-lime bg-lime/5 text-lime text-[10px] font-bold text-center">{saveMsg}</div>}
                {error && <div className="p-3 border border-red-900 bg-red-950/20 text-red-500 text-[10px] font-bold">⚠️ {error}</div>}
                <button onClick={() => saveManual(false)} disabled={saving || !title.trim() || !content.trim()}
                  className="w-full py-4 bg-lime text-black text-xs font-black uppercase tracking-widest hover:bg-lime/90 transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed">
                  {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
                </button>
                <button onClick={() => saveManual(true)} disabled={saving || !title.trim() || !content.trim()}
                  className="w-full py-4 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-lime transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  {saving ? 'جاري النشر...' : 'نشر مباشر ✓'}
                </button>
              </div>
            </div>
            {/* AI Reformulate */}
            <div className="dxt-card p-6 bg-dark-surface">
              <h3 className="text-xs font-black text-lime uppercase tracking-[0.2em] mb-4">🪄 إعادة الصياغة بالذكاء الاصطناعي</h3>
              <p className="text-[10px] text-gray-600 mb-4 leading-relaxed">يحسّن الذكاء الاصطناعي المقال ويضبط التنسيق والعناوين والمقدمة تلقائياً</p>
              <button onClick={reformulateContent} disabled={reformulating || !content.trim()}
                className="w-full py-3 border border-lime text-lime text-[11px] font-black uppercase tracking-widest hover:bg-lime hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {reformulating ? <><span className="w-4 h-4 border-2 border-lime border-t-transparent rounded-full animate-spin" /> جاري إعادة الصياغة...</> : '🧠 إعادة صياغة ذكية'}
              </button>
            </div>
            {/* Tips */}
            <div className="dxt-card p-6 bg-dark-surface border-dashed border-zinc-800">
              <div className="flex flex-col items-center text-center py-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">💡 تنسيق Markdown</p>
                <div className="text-xs text-gray-600 mt-3 leading-relaxed text-right w-full space-y-1">
                  <p><code className="bg-zinc-900 px-1.5 py-0.5 text-[10px]">**نص عريض**</code> نص عريض</p>
                  <p><code className="bg-zinc-900 px-1.5 py-0.5 text-[10px]">## عنوان</code> عنوان فرعي</p>
                  <p><code className="bg-zinc-900 px-1.5 py-0.5 text-[10px]">- قائمة</code> قائمة نقطية</p>
                  <p><code className="bg-zinc-900 px-1.5 py-0.5 text-[10px]">1. ترقيم</code> قائمة مرقمة</p>
                  <p><code className="bg-zinc-900 px-1.5 py-0.5 text-[10px]">[نص](رابط)</code> رابط تشعبي</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
