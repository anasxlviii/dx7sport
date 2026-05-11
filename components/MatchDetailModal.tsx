'use client';

import React, { useEffect, useState } from 'react';

interface MatchDetailModalProps {
  eventId: string | null;
  onClose: () => void;
}

export default function MatchDetailModal({ eventId, onClose }: MatchDetailModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchDetails = async (isAi = false) => {
    if (!eventId) return;
    
    if (isAi) setAiLoading(true);
    else setLoading(true);

    try {
      const url = isAi ? `/api/match-details/${eventId}/ai` : `/api/match-details/${eventId}`;
      const method = isAi ? 'POST' : 'GET';
      
      const res = await fetch(url, { method });
      const data = await res.json();
      
      // NUCLEAR SAFETY FILTER: Block Israeli entities
      const safetyKeywords = ['israel', 'maccabi', 'hapoel', 'beitar', 'tel aviv', 'haifa', 'jerusalem'];
      const isUnsafe = safetyKeywords.some(kw => 
        data.strLeague?.toLowerCase().includes(kw) || 
        data.strHomeTeam?.toLowerCase().includes(kw) || 
        data.strAwayTeam?.toLowerCase().includes(kw)
      );

      if (isUnsafe) {
        setDetails(null);
        onClose();
        return;
      }

      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchDetails();
    }
  }, [eventId]);

  if (!eventId) return null;

  const hasNoData = details && !details.strHomeGoalDetails && !details.strHomeYellowCards && !details.strHomeLineupGoalkeeper;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
             <div className={`w-1.5 h-1.5 rounded-full ${details?.is_ai_generated ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'bg-lime shadow-[0_0_10px_#b3d400]'}`} />
             <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
               {details?.is_ai_generated ? 'تقرير مراسل الشبح (AI)' : 'تفاصيل المباراة المباشرة'}
             </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-lime transition-colors uppercase text-[10px] font-black tracking-widest"
          >
            إغلاق ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6 text-center">
              <div className="w-12 h-12 border-2 border-lime/10 border-t-lime rounded-full animate-spin" />
              <div className="space-y-2">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">جاري جلب البيانات</p>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">انتظر قليلاً من فضلك</p>
              </div>
            </div>
          ) : details ? (
            <div className="flex flex-col gap-12">
              {/* Score Header */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-lime/5 via-transparent to-lime/5 opacity-50" />
                <div className="relative flex items-center justify-around text-center py-10 border border-zinc-900 bg-black/40">
                  <div className="flex flex-col items-center gap-5 w-1/3">
                    <img src={details.strHomeTeamBadge} alt="" className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
                    <span className="text-base font-black text-white uppercase italic tracking-tighter leading-tight">{details.strHomeTeam}</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-7xl font-black italic text-lime tracking-tighter dxt-numeral leading-none">
                      {details.intHomeScore} - {details.intAwayScore}
                    </div>
                    <div className="px-3 py-1 bg-zinc-900 rounded text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      {details.strStatus === 'Match Finished' ? 'انتهت المباراة' : 'مباراة جارية'}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-5 w-1/3">
                    <img src={details.strAwayTeamBadge} alt="" className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
                    <span className="text-base font-black text-white uppercase italic tracking-tighter leading-tight">{details.strAwayTeam}</span>
                  </div>
                </div>
              </div>

              {/* Goals & Events */}
              {(details.strHomeGoalDetails || details.strAwayGoalDetails || 
                details.strHomeYellowCards || details.strAwayYellowCards || 
                details.strHomeRedCards || details.strAwayRedCards) && (
                <div className="grid grid-cols-2 gap-12 relative">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-zinc-900 opacity-50" />
                   
                   <div className="flex flex-col gap-8">
                      <div className="flex items-center gap-3 mb-2">
                         <span className="w-1 h-3 bg-lime" />
                         <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">أحداث الأرض</h3>
                      </div>
                      <EventList events={details.strHomeGoalDetails} type="goal" />
                      <EventList events={details.strHomeYellowCards} type="yellow" />
                      <EventList events={details.strHomeRedCards} type="red" />
                   </div>

                   <div className="flex flex-col gap-8 text-right">
                      <div className="flex items-center gap-3 mb-2 justify-end">
                         <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">أحداث الضيف</h3>
                         <span className="w-1 h-3 bg-lime" />
                      </div>
                      <EventList events={details.strAwayGoalDetails} type="goal" align="right" />
                      <EventList events={details.strAwayYellowCards} type="yellow" align="right" />
                      <EventList events={details.strAwayRedCards} type="red" align="right" />
                   </div>
                </div>
              )}

              {/* Lineups Preview */}
              {(details.strHomeLineupGoalkeeper || details.strAwayLineupGoalkeeper) && (
                <div className="pt-10 border-t border-zinc-900">
                   <h3 className="text-[11px] font-black text-lime uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                     <span className="flex-shrink-0">التشكيلة المتوقعة / الرسمية</span>
                     <div className="h-px flex-1 bg-zinc-900" />
                   </h3>
                   <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-zinc-900 pb-2">{details.strHomeTeam}</p>
                         <div className="space-y-4">
                            <LineupSection title="حراسة المرمى" player={details.strHomeLineupGoalkeeper} />
                            <LineupSection title="الدفاع" player={details.strHomeLineupDefense} />
                            <LineupSection title="الوسط" player={details.strHomeLineupMidfield} />
                            <LineupSection title="الهجوم" player={details.strHomeLineupForward} />
                         </div>
                      </div>
                      <div className="space-y-6 text-right">
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-zinc-900 pb-2 text-right">{details.strAwayTeam}</p>
                         <div className="space-y-4">
                            <LineupSection title="حراسة المرمى" player={details.strAwayLineupGoalkeeper} align="right" />
                            <LineupSection title="الدفاع" player={details.strAwayLineupDefense} align="right" />
                            <LineupSection title="الوسط" player={details.strAwayLineupMidfield} align="right" />
                            <LineupSection title="الهجوم" player={details.strAwayLineupForward} align="right" />
                         </div>
                      </div>
                   </div>
                </div>
              )}
              
              {/* Footer / SofaScore Link */}
              <div className="pt-8 text-center border-t border-zinc-900">
                 <a 
                  href={`https://www.sofascore.com/search?q=${encodeURIComponent(details.strHomeTeam + ' ' + details.strAwayTeam)}`}
                  target="_blank"
                  className="text-[9px] font-black text-zinc-600 hover:text-lime transition-colors uppercase tracking-[0.3em]"
                 >
                    مشاهدة التفاصيل الكاملة على SofaScore →
                 </a>
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

function LineupSection({ title, player, align = 'left' }: { title: string, player: string, align?: 'left' | 'right' }) {
  if (!player) return null;
  return (
    <div className={`space-y-1 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">{title}</p>
      <p className="text-xs font-bold text-gray-300 leading-relaxed italic">{player}</p>
    </div>
  );
}

function EventList({ events, type, align = 'left' }: { events: string, type: 'goal' | 'yellow' | 'red', align?: 'left' | 'right' }) {
  if (!events) return null;
  
  const items = events.split(';').filter(Boolean);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          <div className={`w-2.5 h-2.5 rounded-sm shadow-sm ${
            type === 'goal' ? 'bg-lime shadow-lime/50' : 
            type === 'yellow' ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-red-500 shadow-red-500/50'
          }`} />
          <span className="text-xs font-black text-white italic tracking-tighter dxt-numeral leading-none">{item}</span>
        </div>
      ))}
    </div>
  );
}
