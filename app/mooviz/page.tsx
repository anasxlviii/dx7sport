"use client";

import React, { useState, useEffect } from 'react';

const PREDEFINED_SHOWS = [
  { en: 'Game of Thrones',     ar: 'صراع العروش',       genre: 'فانتازيا' },
  { en: 'Breaking Bad',       ar: 'بريكينغ باد',       genre: 'جريمة' },
  { en: 'House of the Dragon', ar: 'بيت التنين',        genre: 'فانتازيا' },
  { en: 'The Walking Dead',   ar: 'الموتى السائرون',    genre: 'رعب' },
  { en: 'Stranger Things',    ar: 'سترينجر ثينغز',      genre: 'خيال علمي' },
  { en: 'The Crown',          ar: 'التاج',              genre: 'دراما تاريخية' },
  { en: 'Better Call Saul',   ar: 'بيتر كول سول',       genre: 'جريمة' },
  { en: 'The Last of Us',     ar: 'ذا لاست أوف أس',     genre: 'دراما' },
  { en: 'Squid Game',         ar: 'لعبة الحبار',        genre: 'إثارة' },
  { en: 'Money Heist',        ar: 'لاكاسا دي بابيل',    genre: 'جريمة' },
  { en: 'Dark',               ar: 'دارك',               genre: 'خيال علمي' },
  { en: 'Peaky Blinders',     ar: 'بيكي بلايندرز',      genre: 'جريمة' },
  { en: 'Narcos',             ar: 'ناركوس',            genre: 'جريمة' },
  { en: 'Vikings',            ar: 'فايكنغ',            genre: 'تاريخي' },
  { en: 'The Witcher',        ar: 'ذا ويتشر',           genre: 'فانتازيا' },
  { en: 'Sherlock',           ar: 'شارلوك',            genre: 'غموض' },
  { en: 'Black Mirror',       ar: 'المرآة السوداء',    genre: 'خيال علمي' },
  { en: 'True Detective',     ar: 'المحقق الحقيقي',    genre: 'جريمة' },
  { en: 'Friends',            ar: 'الأصدقاء',          genre: 'كوميدي' },
  { en: 'Chernobyl',          ar: 'تشيرنوبل',          genre: 'دراما تاريخية' },
  { en: 'Westworld',          ar: 'ويست وورلد',        genre: 'خيال علمي' },
  { en: 'Dexter',             ar: 'ديكستر',            genre: 'جريمة' },
  { en: 'The Simpsons',       ar: 'عائلة سمبسون',      genre: 'كوميدي' },
  { en: 'Attack on Titan',    ar: 'هجوم العمالقة',     genre: 'أنمي' },
  { en: 'The Mandalorian',    ar: 'الماندالوريان',     genre: 'خيال علمي' },
  { en: 'Lost',               ar: 'الضياع',            genre: 'غموض' },
  { en: 'Prison Break',       ar: 'بريزون بريك',       genre: 'إثارة' },
  { en: 'The Boys',           ar: 'ذا بويز',           genre: 'أكشن' },
  { en: 'The Godfather',      ar: 'العراب',            genre: 'جريمة' },
  { en: 'The Dark Knight',    ar: 'فارس الظلام',       genre: 'أكشن' },
  { en: 'Interstellar',       ar: 'إنترستيلر',         genre: 'خيال علمي' },
  { en: 'Inception',          ar: 'إنسيبشن',           genre: 'إثارة' },
  { en: 'Fight Club',         ar: 'نادي القتال',       genre: 'دراما' },
  { en: 'Pulp Fiction',       ar: 'بولب فيكشن',        genre: 'جريمة' },
  { en: 'The Matrix',         ar: 'ماتريكس',           genre: 'خيال علمي' },
  { en: 'Forrest Gump',       ar: 'فورست غامب',        genre: 'دراما' },
  { en: 'The Shawshank Redemption', ar: 'الخلاص من شوشانك', genre: 'دراما' },
  { en: 'Gladiator',          ar: 'المصارع',           genre: 'تاريخي' },
  { en: 'Parasite',           ar: 'باراسايت',          genre: 'إثارة' },
  { en: 'Joker',              ar: 'جوكر',              genre: 'دراما' },
  { en: 'Avengers: Endgame',  ar: 'المنتقمون: نهاية اللعبة', genre: 'أكشن' },
  { en: 'Titanic (1997 film)', ar: 'تيتانيك',           genre: 'دراما' },
];

const GENRES = [
  'فانتازيا', 'جريمة', 'رعب', 'خيال علمي', 'دراما تاريخية', 'دراما', 'إثارة',
  'غموض', 'كوميدي', 'أنمي', 'أكشن', 'تاريخي', 'رسوم متحركة', 'مغامرة'
];

export default function MoovizDesigner() {
  const [en, setEn] = useState('Game of Thrones');
  const [ar, setAr] = useState('صراع العروش');
  const [genre, setGenre] = useState('فانتازيا');
  const [imageUrl, setImageUrl] = useState('');
  const [extract, setExtract] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [type, setType] = useState<'image' | 'reel' | 'quick_reel'>('image');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [agentState, setAgentState] = useState<{ enabled: boolean; today: string; count: number; reelCount: number; logs: string[] } | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentToggling, setAgentToggling] = useState(false);
  const [agentTriggering, setAgentTriggering] = useState(false);
  const [postingToFb, setPostingToFb] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchAiDetails = async (showEn: string) => {
    if (!showEn.trim() && !customContext.trim()) {
      showNotification('يرجى إدخال العنوان بالإنجليزية أو كتابة سياق مخصص للذكاء الاصطناعي!', 'error');
      return;
    }
    setFetching(true);
    setCopied(false);
    showNotification('جاري جلب التفاصيل بالذكاء الاصطناعي وتوليد المحتوى بالكامل...', 'info');
    try {
      const res = await fetch(`/api/mooviz/news?action=custom&title=${encodeURIComponent(showEn)}&context=${encodeURIComponent(customContext)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          showNotification(`فشل الجلب: ${data.error}`, 'error');
          return;
        }
        setEn(data.en || showEn || 'Custom Post');
        setAr(data.ar || 'منشور مخصص');
        setGenre(data.genre || 'فانتازيا');
        setImageUrl(data.imageUrl || '');
        setExtract(data.extract || '');
        setCaption(data.caption || '');
        showNotification('تم جلب وتوليد التفاصيل بالذكاء الاصطناعي بنجاح!', 'success');
      } else {
        const errData = await res.json();
        showNotification(`خطأ في الاتصال بالسيرفر: ${errData.error || res.statusText}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`خطأ غير متوقع: ${err.message}`, 'error');
    } finally {
      setFetching(false);
    }
  };

  const fetchHotNews = async () => {
    setFetchingNews(true);
    setCopied(false);
    showNotification('جاري كشط Reddit والبحث عن أكثر الأخبار إثارة وجدلاً...', 'info');
    try {
      const res = await fetch('/api/mooviz/news?action=reddit');
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          showNotification(`فشل كشط الأخبار: ${data.error}`, 'error');
          return;
        }
        setEn(data.en || '');
        setAr(data.ar || '');
        setGenre(data.genre || 'فانتازيا');
        setImageUrl(data.imageUrl || '');
        setExtract(data.extract || '');
        setCaption(data.caption || '');
        showNotification(`تم جلب وتوليد خبر ساخن بنجاح: ${data.en}`, 'success');
      } else {
        const errData = await res.json();
        showNotification(`خطأ في جلب الأخبار: ${errData.error || res.statusText}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`خطأ أثناء كشط الأخبار: ${err.message}`, 'error');
    } finally {
      setFetchingNews(false);
    }
  };

  const handleSelectPredefined = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = PREDEFINED_SHOWS.find(s => s.en === val);
    if (found) {
      setEn(found.en);
      setAr(found.ar);
      setGenre(found.genre);
      fetchAiDetails(found.en);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResultImage(null);
    try {
      const res = await fetch('/api/mooviz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ en, ar, genre, extract, imageUrl, type, duration }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setResultImage(url);
        showNotification('تم توليد التصميم/الفيديو بنجاح!', 'success');
      } else {
        const errData = await res.json();
        showNotification(`فشل التوليد: ${errData.error}`, 'error');
      }
    } catch (err: any) {
      showNotification(`خطأ أثناء التوليد: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch('/api/mooviz/agent-control');
      if (res.ok) {
        const data = await res.json();
        setAgentState(data);
      }
    } catch (err) {
      console.error('Failed to fetch agent status', err);
    } finally {
      setAgentLoading(false);
    }
  };

  const toggleAgentState = async () => {
    if (!agentState) return;
    setAgentToggling(true);
    const nextEnabled = !agentState.enabled;
    showNotification(nextEnabled ? 'جاري تفعيل وكيل النشر التلقائي...' : 'جاري إيقاف وكيل النشر التلقائي مؤقتاً...', 'info');
    try {
      const res = await fetch('/api/mooviz/agent-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled })
      });
      if (res.ok) {
        const data = await res.json();
        setAgentState(prev => prev ? { ...prev, enabled: data.enabled } : null);
        showNotification(data.enabled ? 'تم تفعيل وكيل النشر التلقائي بنجاح!' : 'تم إيقاف وكيل النشر التلقائي مؤقتاً!', 'success');
        fetchAgentStatus();
      } else {
        showNotification('فشل في تعديل حالة الوكيل التلقائي', 'error');
      }
    } catch (err: any) {
      showNotification(`خطأ: ${err.message}`, 'error');
    } finally {
      setAgentToggling(false);
    }
  };

  const triggerAgentNow = async () => {
    setAgentTriggering(true);
    showNotification('جاري تشغيل وكيل النشر التلقائي في الخلفية على VPS...', 'info');
    try {
      const res = await fetch('/api/mooviz/agent-control?action=trigger', {
        method: 'POST'
      });
      if (res.ok) {
        showNotification('تم إطلاق وكيل النشر التلقائي بنجاح! راقب سجل العمليات بالأسفل.', 'success');
        setTimeout(fetchAgentStatus, 1500);
      } else {
        const errData = await res.json();
        showNotification(`خطأ في الإطلاق: ${errData.error || 'فشل الاتصال'}`, 'error');
      }
    } catch (err: any) {
      showNotification(`خطأ أثناء تشغيل الوكيل: ${err.message}`, 'error');
    } finally {
      setAgentTriggering(false);
    }
  };

  const handlePostToFacebook = async () => {
    if (!caption.trim()) {
      showNotification('يرجى كتابة أو جلب نص المنشور أولاً قبل النشر على فيسبوك!', 'error');
      return;
    }
    setPostingToFb(true);
    showNotification('جاري توليد محتوى الوسائط والرفع إلى فيسبوك مباشرة...', 'info');
    try {
      const res = await fetch('/api/mooviz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ en, ar, genre, extract, imageUrl, type, duration, action: 'post', caption }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showNotification('🎉 تم نشر التصميم على صفحة الفيسبوك بنجاح!', 'success');
          if (data.postId) {
            const postUrl = `https://facebook.com/${data.postId}`;
            showNotification(`رابط المنشور: ${postUrl}`, 'success');
          }
        } else {
          showNotification(`فشل النشر: ${data.error || 'خطأ غير معروف'}`, 'error');
        }
      } else {
        const errData = await res.json();
        showNotification(`خطأ في السيرفر أثناء النشر: ${errData.error || 'فشل الاتصال'}`, 'error');
      }
    } catch (err: any) {
      showNotification(`خطأ أثناء النشر: ${err.message}`, 'error');
    } finally {
      setPostingToFb(false);
    }
  };

  useEffect(() => {
    fetchAiDetails('Game of Thrones');
    fetchAgentStatus();
    const interval = setInterval(() => {
      fetchAgentStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12 selection:bg-cyan-500 selection:text-black relative">
      
      {/* Premium Notification Toast */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out">
          <div className={`px-6 py-3 rounded-xl border shadow-[0_0_20px_rgba(0,229,255,0.15)] flex items-center gap-3 backdrop-blur-md ${
            notification.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' 
              : notification.type === 'error' 
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-300' 
              : 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300 animate-pulse'
          }`}>
            <span className="text-base">
              {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <p className="text-xs font-black tracking-wide leading-relaxed">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        
        {/* Header section with brand colors */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-wider text-cyan-400">
              MOOVIZ <span className="text-white bg-cyan-600 px-2 py-0.5 rounded text-2xl font-bold ml-1">HUB</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">مصمم ومنسّق صور وفيديوهات المنشورات التلقائية لصفحات الفيس بوك</p>
          </div>
          <div className="flex gap-3">
            <a 
              href="/admin" 
              className="px-4 py-2 border border-zinc-800 rounded bg-zinc-950 text-xs font-bold hover:bg-zinc-900 transition text-zinc-400"
            >
              الرجوع للوحة التحكم
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Auto-Poster Agent Control Panel */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden backdrop-blur-md shadow-xl">
              
              {/* Glowing Background Accent */}
              {agentState?.enabled ? (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              ) : (
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              )}

              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <h2 className="text-xs font-bold text-cyan-400 tracking-widest uppercase">وكيل النشر التلقائي (Autonomous Agent)</h2>
                </div>
                
                {/* Glowing Status Indicator */}
                {!agentLoading && agentState && (
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${agentState.enabled ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-zinc-600 shadow-[0_0_6px_#4b5563]'}`} />
                    <span className="text-[10px] font-bold tracking-wider text-zinc-400">
                      {agentState.enabled ? 'نشط ويعمل' : 'متوقف مؤقتاً'}
                    </span>
                  </div>
                )}
              </div>

              {agentLoading ? (
                <div className="py-6 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500">جاري تحميل حالة الوكيل التلقائي...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  
                  {/* Status Toggle Switch and Manual Trigger Row */}
                  <div className="flex items-center justify-between gap-3 bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-400">حالة التشغيل:</span>
                      
                      {/* Premium Toggle Button */}
                      <button
                        onClick={toggleAgentState}
                        disabled={agentToggling}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          agentState?.enabled ? 'bg-emerald-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            agentState?.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={triggerAgentNow}
                      disabled={agentTriggering || !agentState?.enabled}
                      className="px-3 py-1.5 bg-cyan-950/80 border border-cyan-800/60 hover:bg-cyan-900 text-[10px] font-black text-cyan-400 rounded transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      {agentTriggering ? (
                        <>
                          <div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                          جاري التشغيل...
                        </>
                      ) : (
                        <>⚡ تشغيل الدورة الآن</>
                      )}
                    </button>
                  </div>

                  {/* Curation Daily Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-950/50 border border-zinc-800/60 p-2.5 rounded-lg flex flex-col gap-1">
                      <span className="text-[9px] text-zinc-500 font-medium">المنشورات اليوم</span>
                      <span className="text-sm font-bold text-white">{agentState?.count || 0} / 5</span>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/60 p-2.5 rounded-lg flex flex-col gap-1">
                      <span className="text-[9px] text-zinc-500 font-medium">فيديوهات ريلز</span>
                      <span className="text-sm font-bold text-cyan-400">{agentState?.reelCount || 0}</span>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/60 p-2.5 rounded-lg flex flex-col gap-1">
                      <span className="text-[9px] text-zinc-500 font-medium">معدل التكرار</span>
                      <span className="text-sm font-bold text-zinc-300">كل 3 ساعات</span>
                    </div>
                  </div>

                  {/* Terminal Live Logs */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 px-0.5">
                      <span>سجل عمليات السيرفر المباشر (Terminal)</span>
                      <span className="text-[8px] font-normal text-zinc-600">يتحدث تلقائياً كل 10 ثوانٍ</span>
                    </div>
                    <div className="bg-black/90 border border-zinc-800/80 rounded-lg p-3 h-40 overflow-y-auto font-mono text-[9px] text-zinc-400 leading-relaxed selection:bg-cyan-500 selection:text-black flex flex-col gap-0.5 text-left" dir="ltr">
                      {agentState?.logs && agentState.logs.length > 0 ? (
                        agentState.logs.map((logLine, idx) => (
                          <div 
                            key={idx} 
                            className={`whitespace-pre-wrap ${
                              logLine.includes('ERROR') || logLine.includes('failed') || logLine.includes('FATAL')
                                ? 'text-rose-400' 
                                : logLine.includes('posted!') || logLine.includes('successfully') || logLine.includes('Done')
                                ? 'text-emerald-400 font-semibold'
                                : logLine.includes('[ADMIN]')
                                ? 'text-cyan-400 font-semibold border-r-2 border-cyan-500 pr-1'
                                : 'text-zinc-400'
                            }`}
                          >
                            {logLine}
                          </div>
                        ))
                      ) : (
                        <div className="text-zinc-600 text-center py-12 italic">لا توجد سجلات تشغيل متوفرة حالياً.</div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
            
            {/* Quick Picker Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col gap-4">
              <h2 className="text-xs font-bold text-cyan-400 tracking-widest uppercase">مصادر المحتوى التلقائية الذكية</h2>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={fetchHotNews}
                  disabled={fetchingNews || fetching}
                  className="w-full bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 rounded-lg shadow-lg hover:shadow-red-500/20 active:scale-95 transition flex justify-center items-center gap-2 cursor-pointer text-sm"
                >
                  {fetchingNews ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري كشط وجلب خبر ساخن...
                    </>
                  ) : (
                    <>🔥 كشط وجلب خبر ساخن من Reddit</>
                  )}
                </button>
                <div className="text-center text-[10px] text-zinc-500">
                  يكشط Reddit لآخر أخبار الأفلام والمسلسلات ويقوم بالترجمة والصياغة والتحقق بالذكاء الاصطناعي
                </div>
              </div>

              <div className="border-t border-zinc-800/80 pt-3">
                <label className="block text-xs font-semibold text-zinc-400 mb-1">أو اختر عملاً كلاسيكياً من الكتالوج</label>
                <select 
                  onChange={handleSelectPredefined}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded p-2.5 outline-none focus:border-cyan-500 transition text-sm"
                >
                  {PREDEFINED_SHOWS.map((s, i) => (
                    <option key={i} value={s.en}>{s.en} ({s.ar})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customizer Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col gap-4">
              <h2 className="text-xs font-bold text-cyan-400 tracking-widest uppercase">تخصيص البيانات</h2>

              {/* Design Type (Image vs Reels) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">نوع التصميم (Design Type)</label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded">
                  <button 
                    onClick={() => { setType('image'); setResultImage(null); }}
                    className={`py-2 rounded text-[10px] font-black transition ${type === 'image' ? 'bg-cyan-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    🖼️ صورة غلاف
                  </button>
                  <button 
                    onClick={() => { setType('quick_reel'); setResultImage(null); }}
                    className={`py-2 rounded text-[10px] font-black transition ${type === 'quick_reel' ? 'bg-cyan-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    🎬 ريل سريع (3ث)
                  </button>
                  <button 
                    onClick={() => { setType('reel'); setResultImage(null); }}
                    className={`py-2 rounded text-[10px] font-black transition ${type === 'reel' ? 'bg-cyan-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    🎬 ريل فيديو
                  </button>
                </div>
              </div>

              {/* Custom Duration (Standard Reel only) */}
              {type === 'reel' && (
                <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
                    <span>مدة الفيديو بالثواني (Duration)</span>
                    <span className="text-cyan-400 font-bold">{duration} ثانية</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[8px] text-zinc-600 px-0.5">
                    <span>5 ثوانٍ</span>
                    <span>30 ثانية</span>
                    <span>60 ثانية</span>
                  </div>
                </div>
              )}

              {/* English Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">العنوان بالإنجليزية (English Title)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={en} 
                    onChange={(e) => setEn(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded p-2 text-sm outline-none focus:border-cyan-500 transition"
                    placeholder="مثال: Gladiator II"
                  />
                  <button 
                    onClick={() => fetchAiDetails(en)}
                    disabled={fetching || fetchingNews}
                    className="px-3 bg-cyan-950 border border-cyan-800 text-xs font-bold text-cyan-300 rounded hover:bg-cyan-900 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {fetching ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-cyan-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الجلب...
                      </>
                    ) : (
                      <>🪄 جلب ذكي بالذكاء الاصطناعي</>
                    )}
                  </button>
                </div>
              </div>
              {/* Custom Context */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">توجيهات أو سياق مخصص إضافي للذكاء الاصطناعي (Custom Context)</label>
                <textarea 
                  value={customContext} 
                  onChange={(e) => setCustomContext(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded p-2 text-xs outline-none focus:border-cyan-500 transition resize-none"
                  placeholder="اكتب أو الصق هنا أي تفاصيل، أخبار، مقالات، أو توجيهات خاصة تريد من الذكاء الاصطناعي صياغتها ودمجها بالكامل..."
                />
              </div>

              {/* Arabic Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">العنوان بالعربية</label>
                <input 
                  type="text" 
                  value={ar} 
                  onChange={(e) => setAr(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded p-2 text-sm outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Genre Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">التصنيف (Genre)</label>
                <select 
                  value={genre} 
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded p-2 text-sm outline-none focus:border-cyan-500 transition"
                >
                  {GENRES.map((g, i) => (
                    <option key={i} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Backdrop URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">رابط الصورة الخلفية (Backdrop URL)</label>
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded p-2 text-xs outline-none focus:border-cyan-500 transition"
                  placeholder="https://..."
                />
              </div>

              {/* Description Extract */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">نبذة قصيرة (Synopsis)</label>
                <textarea 
                  value={extract} 
                  onChange={(e) => setExtract(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded p-2 text-xs outline-none focus:border-cyan-500 transition resize-none"
                  placeholder="نبذة عن قصة المسلسل أو الفيلم..."
                />
              </div>

              {/* Action Button */}
              <button 
                onClick={handleGenerate}
                disabled={loading || fetching}
                className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black py-3 rounded-lg shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition flex justify-center items-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {type === 'reel' ? 'جاري توليد ريل فيديو (يستغرق دقيقة)...' : 'جاري توليد التصميم...'}
                  </>
                ) : type === 'reel' ? '🎬 توليد ريل فيديو' : '🪄 توليد التصميم'}
              </button>

            </div>

          </div>

          {/* Preview Side */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl w-full flex flex-col items-center min-h-[500px] justify-center relative overflow-hidden">
              
              <div className="absolute top-4 left-4">
                <span className="text-xs font-bold text-zinc-500 tracking-wider">معاينة مباشرة</span>
              </div>

              {resultImage ? (
                <div className="flex flex-col items-center gap-6 w-full max-w-[500px]">
                  
                  {/* Image/Video Preview container with shadow glow */}
                  {type === 'reel' ? (
                    <div className="relative border border-zinc-800 rounded-lg overflow-hidden shadow-2xl w-full aspect-[9/16] bg-black max-h-[550px]">
                      <video 
                        src={resultImage} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : type === 'quick_reel' ? (
                    <div className="relative border border-zinc-800 rounded-lg overflow-hidden shadow-2xl w-full aspect-square bg-black">
                      <video 
                        src={resultImage} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative border border-zinc-800 rounded-lg overflow-hidden shadow-2xl w-full aspect-square bg-zinc-950">
                      <img 
                        src={resultImage} 
                        alt="Mooviz Hub Result"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Action buttons row */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <a 
                      href={resultImage} 
                      download={`${en.toLowerCase().replace(/\s+/g, '_')}_mooviz.${type === 'image' ? 'jpg' : 'mp4'}`}
                      className="flex-1 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs font-bold text-cyan-400 rounded-lg hover:border-cyan-500 active:scale-95 transition flex items-center justify-center gap-2"
                    >
                      📥 تحميل {type === 'image' ? 'التصميم' : 'الفيديو'}
                    </a>

                    <button
                      onClick={handlePostToFacebook}
                      disabled={postingToFb || !caption.trim()}
                      className="flex-1 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-xs font-black text-white rounded-lg shadow-lg hover:shadow-cyan-500/10 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {postingToFb ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          جاري النشر...
                        </>
                      ) : (
                        <>🚀 انشر على فيسبوك الآن</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-zinc-400 font-bold text-sm">بانتظار توليد {type === 'reel' ? 'الفيديو' : 'التصميم'}</h3>
                  <p className="text-zinc-600 text-xs max-w-sm">اختر فيلماً أو مسلسلاً من القائمة الجانبية ثم اضغط على زر "توليد" لرؤية النتيجة هنا مباشرة.</p>
                </div>
              )}

            </div>

            {/* Facebook Post Caption Manager Card */}
            {(caption || fetching || fetchingNews) && (
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl w-full mt-6 flex flex-col gap-4 relative overflow-hidden backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    <h3 className="text-sm font-bold text-cyan-400">نص المنشور المقترح للفيسبوك (Facebook Post Caption)</h3>
                  </div>
                  {caption && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(caption);
                        setCopied(true);
                        showNotification('تم نسخ نص المنشور إلى الحافظة بنجاح!', 'success');
                        setTimeout(() => setCopied(false), 3000);
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                        copied 
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' 
                          : 'bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900'
                      }`}
                    >
                      {copied ? '✅ تم النسخ!' : '📋 نسخ النص'}
                    </button>
                  )}
                </div>

                {fetching || fetchingNews ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                    <span className="text-zinc-500 text-xs font-semibold text-center leading-relaxed">
                      جاري صياغة منشور طويل وجذاب بالذكاء الاصطناعي...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={10}
                      dir="rtl"
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg p-4 text-sm leading-relaxed outline-none focus:border-cyan-500 transition resize-y font-sans"
                      placeholder="سيظهر هنا نص منشور الفيسبوك المطول..."
                    />
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 px-1">
                      <span>عدد الكلمات: {caption.trim() ? caption.trim().split(/\s+/).length : 0}</span>
                      <span>عدد الحروف: {caption.length} حرف (مثالي: 500-1000)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
