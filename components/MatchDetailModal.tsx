'use client';

import React, { useEffect, useState } from 'react';

interface MatchDetailModalProps {
  eventId: string | null;
  onClose: () => void;
}

export default function MatchDetailModal({ eventId, onClose }: MatchDetailModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      setLoading(true);
      fetch(`/api/match-details/${eventId}`)
        .then(res => res.json())
        .then(data => {
          setDetails(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [eventId]);

  if (!eventId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-lime rounded-full" />
             <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">تفاصيل المباراة</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-lime transition-colors uppercase text-[10px] font-black tracking-widest"
          >
            إغلاق ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-lime/20 border-t-lime rounded-full animate-spin" />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">جاري جلب البيانات...</p>
            </div>
          ) : details ? (
            <div className="flex flex-col gap-12">
              {/* Score Header */}
              <div className="flex items-center justify-around text-center py-8 bg-zinc-900/30 border border-zinc-900">
                <div className="flex flex-col items-center gap-4 w-1/3">
                  <img src={details.strHomeTeamBadge} alt="" className="w-16 h-16 object-contain" />
                  <span className="text-sm font-black text-white uppercase italic tracking-tighter">{details.strHomeTeam}</span>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="text-6xl font-black italic text-lime tracking-tighter dxt-numeral">
                    {details.intHomeScore} - {details.intAwayScore}
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {details.strStatus === 'Match Finished' ? 'انتهت' : 'مباشر'}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-4 w-1/3">
                  <img src={details.strAwayTeamBadge} alt="" className="w-16 h-16 object-contain" />
                  <span className="text-sm font-black text-white uppercase italic tracking-tighter">{details.strAwayTeam}</span>
                </div>
              </div>

              {/* Goals & Events */}
              <div className="grid grid-cols-2 gap-8 relative">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-zinc-900" />
                 
                 <div className="flex flex-col gap-6">
                    <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">أحداث صاحب الأرض</h3>
                    <EventList events={details.strHomeGoalDetails} type="goal" />
                    <EventList events={details.strHomeYellowCards} type="yellow" />
                    <EventList events={details.strHomeRedCards} type="red" />
                 </div>

                 <div className="flex flex-col gap-6 text-right">
                    <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">أحداث الضيف</h3>
                    <EventList events={details.strAwayGoalDetails} type="goal" align="right" />
                    <EventList events={details.strAwayYellowCards} type="yellow" align="right" />
                    <EventList events={details.strAwayRedCards} type="red" align="right" />
                 </div>
              </div>

              {/* Lineups Preview */}
              <div className="pt-8 border-t border-zinc-900">
                 <h3 className="text-[10px] font-black text-lime uppercase tracking-[0.3em] mb-6">تشكيلة الفريقين</h3>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <p className="text-[9px] font-bold text-zinc-600 mb-4">{details.strHomeTeam}</p>
                       <p className="text-xs font-medium text-gray-300 leading-relaxed">{details.strHomeLineupGoalkeeper || 'غير متوفر'}</p>
                       <p className="text-xs font-medium text-gray-400 leading-relaxed opacity-60">{details.strHomeLineupDefense}</p>
                       <p className="text-xs font-medium text-gray-400 leading-relaxed opacity-60">{details.strHomeLineupMidfield}</p>
                    </div>
                    <div className="space-y-2 text-right">
                       <p className="text-[9px] font-bold text-zinc-600 mb-4">{details.strAwayTeam}</p>
                       <p className="text-xs font-medium text-gray-300 leading-relaxed">{details.strAwayLineupGoalkeeper || 'غير متوفر'}</p>
                       <p className="text-xs font-medium text-gray-400 leading-relaxed opacity-60">{details.strAwayLineupDefense}</p>
                       <p className="text-xs font-medium text-gray-400 leading-relaxed opacity-60">{details.strAwayLineupMidfield}</p>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-zinc-600 font-black uppercase tracking-widest">فشل تحميل التفاصيل.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventList({ events, type, align = 'left' }: { events: string, type: 'goal' | 'yellow' | 'red', align?: 'left' | 'right' }) {
  if (!events) return null;
  
  // SportsDB format is usually "Name1 10';Name2 20';"
  const items = events.split(';').filter(Boolean);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          <div className={`w-2 h-2 rounded-sm ${
            type === 'goal' ? 'bg-lime' : 
            type === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-[11px] font-bold text-white italic tracking-tighter dxt-numeral">{item}</span>
        </div>
      ))}
    </div>
  );
}
