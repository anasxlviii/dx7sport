'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState } from 'react';
import { AdComponent } from './AdComponent';
import { QuizRenderer } from './QuizRenderer';

interface Props {
  content: string;
  galleryImages: Array<{ id: number; url: string; alt: string }>;
  adMidArticle?: string;
  adMidEnabled?: boolean;
  quizData?: any;
}

/**
 * Renders article markdown with:
 * - Premium Arabic typography & Flow
 * - Scroll-reveal animations for paragraphs
 * - Gallery images injected between sections
 * - Adsterra ad code injected dynamically
 */
export function ArticleRenderer({ content, galleryImages, adMidArticle, adMidEnabled, quizData }: Props) {
  const [isGameActive, setIsGameActive] = useState(false);
  const sections = splitIntoSections(content);
  let imgIdx = 0;

  // Animation logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-4');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal-p').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [content]);

  return (
    <div className="space-y-0" dir="rtl">
      {sections.map((section, i) => (
        <div key={i} className="reveal-p opacity-0 translate-y-4 transition-all duration-700 ease-out">
          {/* Article Section */}
          <div
            className="
              prose prose-invert max-w-none
              [&_p]:text-gray-200 [&_p]:leading-[2.4] [&_p]:text-[1.1rem] [&_p]:font-medium [&_p]:mb-10 [&_p]:tracking-wide [&_p]:text-justify
              [&_h2]:text-white [&_h2]:font-black [&_h2]:italic [&_h2]:uppercase [&_h2]:tracking-tight
              [&_h2]:text-3xl [&_h2]:mt-16 [&_h2]:mb-6 [&_h2]:border-r-8 [&_h2]:border-lime [&_h2]:pr-6 [&_h2]:leading-snug
              [&_h3]:text-lime [&_h3]:font-black [&_h3]:text-xl [&_h3]:mt-12 [&_h3]:mb-5 [&_h3]:uppercase [&_h3]:tracking-wide
              [&_strong]:text-lime [&_strong]:font-black [&_strong]:text-[1.1em]
              [&_em]:text-gray-300 [&_em]:font-semibold [&_em]:not-italic [&_em]:bg-white/5 [&_em]:px-1
              [&_a]:text-lime [&_a]:font-bold [&_a]:underline-offset-4 hover:[&_a]:text-white transition-colors
              [&_ul]:space-y-4 [&_ul]:my-8 [&_ul]:pr-6 [&_ul]:list-none
              [&_li]:text-gray-200 [&_li]:font-medium [&_li]:leading-relaxed [&_li]:text-[1.05rem] [&_li]:relative
              [&_li::before]:content-['—'] [&_li::before]:text-lime [&_li::before]:font-black [&_li::before]:absolute [&_li::before]:-right-6
              [&_blockquote]:border-r-8 [&_blockquote]:border-lime [&_blockquote]:pr-8 [&_blockquote]:py-6
              [&_blockquote]:bg-gradient-to-l [&_blockquote]:from-lime/10 [&_blockquote]:to-transparent
              [&_blockquote]:text-white [&_blockquote]:font-bold [&_blockquote]:text-[1.2rem]
              [&_blockquote]:not-italic [&_blockquote]:my-12 [&_blockquote]:leading-[2]
              [&_hr]:border-zinc-800 [&_hr]:my-12
              [&_img]:w-full [&_img]:h-auto [&_img]:border [&_img]:border-border-subtle [&_img]:shadow-2xl
            "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section}
            </ReactMarkdown>
          </div>

          {/* Gallery image after every 2nd section */}
          {(i + 1) % 2 === 0 && imgIdx < galleryImages.length && (() => {
            const img = galleryImages[imgIdx++];
            return (
              <figure className="my-16 reveal-p opacity-0 translate-y-4 transition-all duration-700 ease-out" key={`img-${img.id}`}>
                <div className="relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <img
                    src={img.url}
                    alt={img.alt || ''}
                    className="w-full max-h-[600px] object-cover border border-border-subtle group-hover:scale-105 transition-transform duration-1000"
                  />
                </div>
                {img.alt && (
                  <figcaption className="text-[12px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-4 text-center">
                    {img.alt}
                  </figcaption>
                )}
              </figure>
            );
          })()}

          {/* Mid-article ad after section 4 */}
          {i === 3 && adMidEnabled && adMidArticle && (
            <div className="reveal-p opacity-0 translate-y-4 transition-all duration-700 ease-out">
              <AdSlot key="mid-ad" code={adMidArticle} label="إعلان مُقترح" />
            </div>
          )}
        </div>
      ))}

      {/* Quiz Section */}
      {quizData && (
        <div className="mt-16 reveal-p opacity-0 translate-y-4 transition-all duration-700 ease-out">
          {!isGameActive ? (
            <div className="dxt-card p-12 text-center bg-gradient-to-br from-zinc-950 to-black border-lime/30 shadow-[0_0_50px_rgba(179,212,0,0.1)]">
              <div className="w-20 h-20 bg-lime/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎮</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4 italic">هل أنت مستعد للتحدي؟</h3>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-10">اختبر معلوماتك الكروية الآن واربح النقاط</p>
              
              <button
                onClick={() => setIsGameActive(true)}
                className="
                  group relative px-12 py-5 bg-lime text-black font-black uppercase tracking-[0.3em] text-sm
                  shadow-[0_0_30px_rgba(179,212,0,0.5)] hover:shadow-[0_0_60px_rgba(179,212,0,0.8)]
                  transition-all active:scale-95 overflow-hidden
                "
              >
                <span className="relative z-10">إلعب الآن</span>
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </div>
          ) : (
            <div className="fixed inset-0 z-[100] bg-black p-4 md:p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-xl font-black italic text-lime">DX7 ARENA</h2>
                   <button 
                     onClick={() => setIsGameActive(false)}
                     className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest bg-zinc-900 px-4 py-2 border border-zinc-800"
                   >
                     إنهاء اللعبة ✕
                   </button>
                </div>
                <QuizRenderer data={quizData} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remaining gallery images */}
      {imgIdx < galleryImages.length && (
        <div className="mt-16 pt-12 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-6 reveal-p opacity-0 translate-y-4 transition-all duration-700 ease-out">
          {galleryImages.slice(imgIdx).map(img => (
            <div key={img.id} className="relative group overflow-hidden border border-border-subtle">
              <img src={img.url} alt={img.alt || ''} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Safely injects a raw ad script into the DOM using a ref */
function AdSlot({ code, label }: { code: string; label: string }) {
  return (
    <div className="my-16 flex flex-col items-center">
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-800 mb-6 border-b border-zinc-900 pb-2 px-8">{label}</p>
      <div className="w-full flex justify-center min-h-[90px]">
        <AdComponent code={code} />
      </div>
    </div>
  );
}

/**
 * Splits markdown into sections at H2/H3 headings.
 */
function splitIntoSections(content: string): string[] {
  const lines = content.split('\n');
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if ((line.startsWith('## ') || line.startsWith('### ')) && current.length > 0) {
      const s = current.join('\n').trim();
      if (s) sections.push(s);
      current = [line];
    } else {
      current.push(line);
    }
  }
  const last = current.join('\n').trim();
  if (last) sections.push(last);

  return sections;
}
