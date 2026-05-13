export const runtime = 'edge';
'use client';

import { useEffect, useState } from 'react';

const AD_SLOTS = [
  {
    key: 'ad_mid_article',
    label: 'إعلان داخل المقال',
    desc: 'يظهر بين الفقرات بعد القسم الرابع',
    size: '728×90 أو مرن',
    placeholder: '<script async="async" data-cfasync="false" src="//pl...adsterra...js"></script>',
  },
  {
    key: 'ad_article_bottom',
    label: 'إعلان أسفل المقال',
    desc: 'يظهر أسفل محتوى المقال مباشرة',
    size: '728×90',
    placeholder: '<script async="async" data-cfasync="false" src="//pl...adsterra...js"></script>',
  },
  {
    key: 'ad_sidebar',
    label: 'إعلان الشريط الجانبي',
    desc: 'يظهر في الشريط الجانبي بجانب المقال',
    size: '300×250',
    placeholder: '<script async="async" data-cfasync="false" src="//pl...adsterra...js"></script>',
  },
  {
    key: 'ad_homepage_banner',
    label: 'إعلان الصفحة الرئيسية',
    desc: 'بانر عريض أسفل أبرز المقالات',
    size: '970×90 أو مرن',
    placeholder: '<script async="async" data-cfasync="false" src="//pl...adsterra...js"></script>',
  },
  {
    key: 'ad_global_head',
    label: 'أكواد Header العالمية',
    desc: 'توضع في <head> عبر جميع الصفحات (مثل Social Bar أو Pop-under)',
    size: 'N/A',
    placeholder: '<script type="text/javascript" src="//pl...adsterra...js"></script>',
  },
  {
    key: 'ad_smartlink',
    label: 'Adsterra Smartlink (Direct Link)',
    desc: 'رابط مباشر ذكي يقوم بتحويل المستخدم لأفضل العروض. سيتم استخدامه في الأزرار التفاعلية.',
    size: 'N/A',
    placeholder: 'https://smartlink-url.com/...',
  },
  {
    key: 'ad_social_bar',
    label: 'Adsterra Social Bar',
    desc: 'إعلان يظهر كإشعار ذكي في زاوية الصفحة. ضعه هنا وسيعمل تلقائياً.',
    size: 'N/A',
    placeholder: '<script type="text/javascript" src="//pl...adsterra...js"></script>',
  },
];

export default function AdsSettingsPage() {
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        const c: Record<string, string> = {};
        const e: Record<string, boolean> = {};
        for (const slot of AD_SLOTS) {
          c[slot.key] = data[slot.key] || '';
          e[slot.key] = data[`${slot.key}_enabled`] === 'true';
        }
        setCodes(c);
        setEnabled(e);
      })
      .catch(err => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const payload: Record<string, string> = {};
      for (const slot of AD_SLOTS) {
        payload[slot.key] = codes[slot.key] || '';
        payload[`${slot.key}_enabled`] = enabled[slot.key] ? 'true' : 'false';
      }
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      alert('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-xs font-bold text-lime uppercase tracking-[0.3em] mb-2">إعدادات الإعلانات</h2>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">إدارة Adsterra</h1>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-lime text-black px-8 py-3 font-black uppercase tracking-widest text-xs hover:bg-white transition-all disabled:opacity-50 active:scale-95"
        >
          {saving ? 'جاري الحفظ...' : saved ? '✓ تم الحفظ!' : 'حفظ التغييرات'}
        </button>
      </div>

      {/* Info banner */}
      <div className="border border-lime/20 bg-lime/5 p-8 mb-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-lime" />
        <div className="relative z-10 flex gap-6 items-start">
          <div className="w-10 h-10 bg-lime/10 flex items-center justify-center rounded-sm shrink-0 border border-lime/20">
            <span className="text-lime text-xl font-bold italic">!</span>
          </div>
          <div>
            <p className="text-sm font-black text-white mb-2 uppercase tracking-wide">كيفية استخدام Adsterra</p>
            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
              سجّل في <a href="https://adsterra.com" target="_blank" rel="noopener" className="text-lime underline font-bold">adsterra.com</a> ← أنشئ زوناً (Zone) لكل موقع إعلان ← انسخ الكود البرمجي كاملاً ← الصقه في الحقل المناسب أدناه ← احفظ.
              سيتم تفعيل الإعلانات تلقائياً في الموقع عند التفعيل.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-32">
          <div className="inline-block animate-spin w-10 h-10 border-2 border-lime border-t-transparent rounded-full" />
          <p className="mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">جاري تحميل الإعدادات...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {AD_SLOTS.map(slot => (
            <div key={slot.key} className={`dxt-card p-10 transition-all ${enabled[slot.key] ? 'border-lime/30 bg-lime/[0.02]' : 'opacity-70'}`}>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {enabled[slot.key] && <span className="w-2 h-2 bg-lime rounded-full shadow-[0_0_8px_rgba(179,212,0,0.8)] animate-pulse" />}
                    <h3 className="text-lg font-black uppercase text-white tracking-wide">{slot.label}</h3>
                  </div>
                  <p className="text-xs text-gray-500 max-w-lg leading-relaxed">{slot.desc}</p>
                  <span className="text-[10px] font-bold text-lime/50 uppercase tracking-[0.2em] mt-3 inline-block border border-lime/20 px-2 py-1">
                    المقاس: {slot.size}
                  </span>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => setEnabled(prev => ({ ...prev, [slot.key]: !prev[slot.key] }))}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all flex-shrink-0 ${
                    enabled[slot.key] ? 'bg-lime' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-black transition-transform ${
                      enabled[slot.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3 block">
                  كود الإعلان (script tag)
                </label>
                <textarea
                  value={codes[slot.key]}
                  onChange={e => setCodes(prev => ({ ...prev, [slot.key]: e.target.value }))}
                  placeholder={slot.placeholder}
                  rows={5}
                  dir="ltr"
                  className={`w-full bg-black border px-5 py-4 text-xs font-mono text-gray-300 focus:outline-none transition-all resize-none shadow-inner ${
                    enabled[slot.key]
                      ? 'border-lime/30 focus:border-lime bg-black'
                      : 'border-zinc-800 opacity-40 cursor-not-allowed bg-zinc-950'
                  }`}
                  disabled={!enabled[slot.key]}
                />
                {enabled[slot.key] && !codes[slot.key] && (
                  <p className="mt-2 text-[9px] font-bold text-red-500 uppercase tracking-widest">⚠️ الكود مفقود ولكن الزون مفعل</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
