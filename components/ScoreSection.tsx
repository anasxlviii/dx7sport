import React from 'react';
import { SportsEvent } from '@/lib/pipeline/sportsdb';

interface ScoreSectionProps {
  scores: SportsEvent[];
}

export function ScoreSection({ scores }: ScoreSectionProps) {
  if (!scores || scores.length === 0) return null;

  return (
    <section className="py-12 border-b border-zinc-900 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-lime rounded-full animate-pulse shadow-[0_0_10px_rgba(179,212,0,0.8)]" />
          <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">نتائج الدوريات الكبرى</h2>
        </div>
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">مباشر من الملاعب</div>
      </div>

      <div className="relative group">
        <div className="flex overflow-x-auto gap-4 px-4 sm:px-6 lg:px-8 pb-4 no-scrollbar scroll-smooth">
          {scores.map((event) => (
            <div 
              key={event.idEvent}
              className="flex-shrink-0 w-[300px] bg-zinc-950 border border-zinc-900 p-6 hover:border-lime/30 transition-all group/card relative"
            >
              <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-900 text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                {event.strLeague}
              </div>
              
              <div className="flex flex-col gap-4 mt-2">
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white truncate max-w-[150px]">{event.strHomeTeam}</span>
                  <span className="text-2xl font-black italic text-lime leading-none">
                    {event.intHomeScore || '0'}
                  </span>
                </div>
                
                {/* Divider / vs */}
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-zinc-900" />
                    <span className="text-[9px] font-black text-zinc-700 italic">VS</span>
                    <div className="h-px flex-1 bg-zinc-900" />
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white truncate max-w-[150px]">{event.strAwayTeam}</span>
                  <span className="text-2xl font-black italic text-lime leading-none">
                    {event.intAwayScore || '0'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-900/50 flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                  {new Date(event.strTimestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                </span>
                <div className="w-1.5 h-1.5 bg-zinc-800 group-hover/card:bg-lime transition-colors rounded-full" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Faders for horizontal scroll */}
        <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
}
