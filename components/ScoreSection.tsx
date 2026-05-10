import React from 'react';
import { SportsEvent } from '@/lib/pipeline/sportsdb';

interface ScoreSectionProps {
  scores: SportsEvent[];
  title?: string;
  isPage?: boolean;
}

export function ScoreSection({ scores, title = "نتائج الدوريات الكبرى", isPage = false }: ScoreSectionProps) {
  if (!scores || scores.length === 0) return null;

  // Group scores by league
  const groupedScores = scores.reduce((acc, event) => {
    const league = event.strLeague;
    if (!acc[league]) acc[league] = [];
    acc[league].push(event);
    return acc;
  }, {} as Record<string, SportsEvent[]>);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      numberingSystem: 'latn' // Force normal numbers
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('ar-EG', { 
      day: 'numeric', 
      month: 'short',
      numberingSystem: 'latn' // Force normal numbers
    });
  };

  return (
    <section className={`py-12 ${isPage ? '' : 'border-b border-zinc-900 bg-black'} overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-lime rounded-full animate-pulse shadow-[0_0_10px_rgba(179,212,0,0.8)]" />
          <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">{title}</h2>
        </div>
        {!isPage && (
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">تحديث مباشر</div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        {Object.entries(groupedScores).map(([league, leagueEvents]) => (
          <div key={league} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
               <h3 className="text-sm font-black text-lime uppercase tracking-widest bg-lime/5 px-4 py-1 border-r-2 border-lime">
                 {league}
               </h3>
               <div className="h-px flex-1 bg-zinc-900" />
            </div>
            
            <div className={`grid grid-cols-1 ${isPage ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
              {leagueEvents.map((event) => (
                <ScoreCard 
                    key={event.idEvent} 
                    event={event} 
                    formatTime={formatTime} 
                    formatDate={formatDate} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScoreCard({ event, formatTime, formatDate }: { event: SportsEvent, formatTime: any, formatDate: any }) {
  const isLive = event.strStatus === 'NS' ? false : event.strStatus !== 'Match Finished';

  return (
    <div 
      className="bg-zinc-950 border border-zinc-900 p-6 hover:border-lime/30 transition-all group/card relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-lime/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex flex-col gap-6 relative z-10">
        {/* Teams Area */}
        <div className="flex flex-col gap-4">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {event.strHomeTeamBadge && (
                <img src={event.strHomeTeamBadge} alt="" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
              )}
              <span className="text-base font-black text-white truncate max-w-[140px] uppercase italic tracking-tighter">
                {event.strHomeTeam}
              </span>
            </div>
            <span className="text-4xl font-black italic text-lime leading-none dxt-numeral">
              {event.intHomeScore || '0'}
            </span>
          </div>
          
          <div className="h-px w-full bg-zinc-900/50" />

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {event.strAwayTeamBadge && (
                <img src={event.strAwayTeamBadge} alt="" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
              )}
              <span className="text-base font-black text-white truncate max-w-[140px] uppercase italic tracking-tighter">
                {event.strAwayTeam}
              </span>
            </div>
            <span className="text-4xl font-black italic text-lime leading-none dxt-numeral">
              {event.intAwayScore || '0'}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
             {isLive ? (
               <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded">
                 <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                 <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Live</span>
               </div>
             ) : (
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                 {event.strStatus === 'Match Finished' ? 'انتهت' : 'قادمة'}
               </span>
             )}
          </div>
          <span className="text-[10px] font-black text-white/40 tracking-widest dxt-numeral">
            {formatDate(event.strTimestamp)} | {formatTime(event.strTimestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
