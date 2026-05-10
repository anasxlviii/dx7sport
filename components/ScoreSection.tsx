import React from 'react';
import { SportsEvent } from '@/lib/pipeline/sportsdb';

interface ScoreSectionProps {
  scores: SportsEvent[];
  title?: string;
  isPage?: boolean;
}

export function ScoreSection({ scores, title = "نتائج الدوريات الكبرى", isPage = false }: ScoreSectionProps) {
  if (!scores || scores.length === 0) return null;

  return (
    <section className={`py-12 ${isPage ? '' : 'border-b border-zinc-900 bg-black'} overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-lime rounded-full animate-pulse shadow-[0_0_10px_rgba(179,212,0,0.8)]" />
          <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">{title}</h2>
        </div>
        {!isPage && (
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">تحديث مباشر</div>
        )}
      </div>

      <div className={`relative group ${isPage ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : ''}`}>
        {!isPage ? (
          <div className="flex overflow-x-auto gap-4 px-4 sm:px-6 lg:px-8 pb-4 no-scrollbar scroll-smooth">
            {scores.map((event) => (
              <ScoreCard key={event.idEvent} event={event} />
            ))}
          </div>
        ) : (
          scores.map((event) => (
            <ScoreCard key={event.idEvent} event={event} />
          ))
        )}
        
        {!isPage && (
          <>
            <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
            <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
          </>
        )}
      </div>
    </section>
  );
}

function ScoreCard({ event }: { event: SportsEvent }) {
  const isLive = event.strStatus === 'NS' ? false : event.strStatus !== 'Match Finished';

  return (
    <div 
      className="flex-shrink-0 w-full md:w-auto bg-zinc-950 border border-zinc-900 p-6 hover:border-lime/30 transition-all group/card relative"
      style={{ minWidth: '320px' }}
    >
      <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-900 text-[8px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-2">
        {isLive && <span className="w-1 h-1 bg-red-500 rounded-full animate-ping" />}
        {event.strLeague}
      </div>
      
      <div className="flex flex-col gap-6 mt-4">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event.strHomeTeamBadge && (
              <img src={event.strHomeTeamBadge} alt="" className="w-8 h-8 object-contain" />
            )}
            <span className="text-sm font-bold text-white truncate max-w-[140px]">{event.strHomeTeam}</span>
          </div>
          <span className="text-3xl font-black italic text-lime leading-none">
            {event.intHomeScore || '0'}
          </span>
        </div>
        
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event.strAwayTeamBadge && (
              <img src={event.strAwayTeamBadge} alt="" className="w-8 h-8 object-contain" />
            )}
            <span className="text-sm font-bold text-white truncate max-w-[140px]">{event.strAwayTeam}</span>
          </div>
          <span className="text-3xl font-black italic text-lime leading-none">
            {event.intAwayScore || '0'}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-900/50 flex items-center justify-between">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
          {event.strStatus === 'Match Finished' ? 'انتهت' : event.strStatus || 'قادمة'} | {new Date(event.strTimestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="w-1.5 h-1.5 bg-zinc-800 group-hover/card:bg-lime transition-colors rounded-full" />
      </div>
    </div>
  );
}
