'use client';
export const runtime = 'edge';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewArticlePage() {
  const router = useRouter();
  const [postContent, setPostContent] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Array<{ name: string; status: string; error?: string }>>([]);
  const [error, setError] = useState('');
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard Paste Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only trigger if hovering over the image box OR if no other input is focused
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      
      if (isHoveringImage || !isInputFocused) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (!blob) continue;

            const reader = new FileReader();
            reader.onload = (event) => {
              setImageBase64(event.target?.result as string);
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isHoveringImage]);

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
        body: JSON.stringify({ 
          postContent, 
          postUrl: postUrl || undefined,
          imageBase64: imageBase64 || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSteps(data.steps);
        setTimeout(() => {
          router.push(`/admin/article/${data.article.id}`);
        }, 1000);
      } else {
        setSteps(data.steps || []);
        setError(data.error || 'Pipeline failed');
      }
    } catch (err) {
      setError('Failed to run pipeline. Please check your API keys.');
      setSteps(steps.map(s => ({ ...s, status: 'failed' })));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      {/* Header */}
      <div className="mb-12">
        <Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-lime hover:text-white transition-colors">
          ← العودة للوحة التحكم
        </Link>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mt-6">توليد الذكاء الكروي</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">
          حول البيانات المرئية أو النصية إلى تقارير رياضية شاملة
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-8">
          <div className="dxt-card p-8">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">
              الخيار 1: استخبارات بصرية (ارفع صورة أو الصق Ctrl+V)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setIsHoveringImage(true)}
              onMouseLeave={() => setIsHoveringImage(false)}
              className={`border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 relative group ${
                imageBase64 ? 'border-lime bg-lime/5' : 'border-zinc-800 hover:border-lime/50 bg-black'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
              {imageBase64 ? (
                <div className="relative w-full">
                  <img src={imageBase64} alt="Preview" className="w-full h-48 object-cover border border-lime/30" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <p className="text-[10px] font-black text-white uppercase tracking-widest bg-black px-4 py-2 border border-zinc-800">اضغط للتغيير أو الصق صورة جديدة</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setImageBase64(null); }}
                    className="absolute top-2 left-2 bg-black/80 text-red-500 text-[10px] font-black px-2 py-1 border border-red-900 z-20"
                  >
                    إزالة
                  </button>
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
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">
              الخيار 2: رابط المصدر (Facebook/Web)
            </label>
            <input
              type="url"
              placeholder="https://www.facebook.com/..."
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              disabled={running}
              className="w-full bg-black border border-border-subtle px-6 py-3 text-sm text-white focus:outline-none focus:border-lime transition-all disabled:opacity-50"
              dir="ltr"
            />
          </div>

          <div className="dxt-card p-8">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">
              الخيار 3: نص الخبر أو الكلمات المفتاحية
            </label>
            <textarea
              placeholder="مثال: انتقال مبابي لريال مدريد، آخر أخبار تشافي..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              disabled={running}
              rows={5}
              className="w-full bg-black border border-border-subtle px-6 py-4 text-sm text-white focus:outline-none focus:border-lime transition-all disabled:opacity-50 font-medium"
            />
          </div>

          {error && (
            <div className="p-4 border border-red-900 bg-red-950/20 text-red-500 text-xs font-black uppercase tracking-widest">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={runPipeline}
            disabled={running || (!postContent.trim() && !postUrl.trim() && !imageBase64)}
            className="w-full bg-lime text-black py-5 font-black uppercase tracking-[0.3em] text-sm hover:bg-white transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(179,212,0,0.2)]"
          >
            {running ? 'جاري معالجة المعلومات...' : 'توليد المقال والحقائق'}
          </button>
        </div>

        {/* Status / Steps */}
        <div className="space-y-8">
          {steps.length > 0 ? (
            <div className="dxt-card p-10 border-lime/20 h-full">
              <h2 className="text-xs font-black text-lime uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                <span className="w-2 h-2 bg-lime rounded-full animate-pulse" />
                حالة العمليات
              </h2>
              <div className="space-y-10">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-6 group">
                    <div className={`w-10 h-10 flex items-center justify-center border font-black text-xs transition-all ${
                      step.status === 'completed' ? 'border-lime bg-lime text-black' :
                      step.status === 'running' ? 'border-white text-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.2)]' :
                      step.status === 'failed' ? 'border-red-600 text-red-600 bg-red-950/20' :
                      'border-border-subtle text-gray-700'
                    }`}>
                      {step.status === 'completed' ? '✓' :
                       step.status === 'running' ? '>>' :
                       step.status === 'failed' ? '!!' :
                       i + 1}
                    </div>
                    <div className="flex-1 pt-2">
                      <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                        step.status === 'failed' ? 'text-red-600' : 
                        step.status === 'running' ? 'text-white' :
                        step.status === 'completed' ? 'text-gray-400' :
                        'text-gray-800'
                      }`}>
                        {step.name}
                      </span>
                      {step.status === 'running' && (
                        <div className="mt-4 w-full h-1 bg-zinc-900 overflow-hidden">
                          <div className="h-full bg-lime animate-[progress_2s_ease-in-out_infinite]" />
                        </div>
                      )}
                      {step.error && (
                        <p className="text-[10px] text-red-600 font-bold uppercase mt-2 italic border-r-2 border-red-600 pr-3">{step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dxt-card p-12 border-dashed border-zinc-800 bg-zinc-950/30 flex flex-col items-center justify-center text-center h-full opacity-40">
               <div className="w-20 h-20 border border-zinc-800 rounded-full flex items-center justify-center mb-8">
                  <span className="text-4xl">📡</span>
               </div>
               <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] leading-relaxed">
                  في انتظار المدخلات... <br />
                  اختر أحد الخيارات لتفعيل معالج الذكاء الاصطناعي
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
