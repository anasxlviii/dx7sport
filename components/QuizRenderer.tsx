'use client';

import { useState, useEffect } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
  imageUrl?: string;
  clueLogos?: string[];
}

interface CrosswordClue {
  number: number;
  clue: string;
  row: number;
  col: number;
  answer: string;
}

interface CrosswordData {
  grid: (string | null)[][];
  clues: {
    across: CrosswordClue[];
    down: CrosswordClue[];
  };
}

interface Props {
  data: {
    type: 'multiple_choice' | 'crossword';
    questions?: QuizQuestion[];
    crossword?: CrosswordData;
  };
}

function getDifficultyLabel(index: number, total: number): { label: string; color: string } {
  const pct = index / total;
  if (pct < 0.25) return { label: 'سهل', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' };
  if (pct < 0.5) return { label: 'متوسط', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' };
  if (pct < 0.75) return { label: 'صعب', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' };
  return { label: 'خبير', color: 'text-red-400 border-red-400/30 bg-red-400/10' };
}

// ──────────────────────────────────────────────────────────────
//  CROSSWORD COMPONENT
// ──────────────────────────────────────────────────────────────
function CrosswordGame({ crossword }: { crossword: CrosswordData }) {
  const [userGrid, setUserGrid] = useState<(string | null)[][]>(
    crossword.grid.map((row) => row.map((cell) => (cell ? '' : null)))
  );
  const [validated, setValidated] = useState(false);
  const [correctCells, setCorrectCells] = useState<boolean[][]>([]);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  const handleValidate = () => {
    const result: boolean[][] = crossword.grid.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (cell === null) return true; // Black cell — always "correct"
        return userGrid[rIdx][cIdx]?.toUpperCase() === cell.toUpperCase();
      })
    );
    setCorrectCells(result);
    setValidated(true);

    let correct = 0;
    let total = 0;
    crossword.grid.forEach((row, rIdx) =>
      row.forEach((cell, cIdx) => {
        if (cell !== null) {
          total++;
          if (result[rIdx][cIdx]) correct++;
        }
      })
    );
    setScore({ correct, total });
  };

  const handleReset = () => {
    setUserGrid(crossword.grid.map((row) => row.map((cell) => (cell ? '' : null))));
    setValidated(false);
    setCorrectCells([]);
    setScore(null);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Grid */}
        <div className="lg:col-span-7 bg-zinc-950 p-6 md:p-12 border border-zinc-900 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime/5 to-transparent pointer-events-none" />
          <div
            className="grid gap-1.5 relative z-10"
            style={{ gridTemplateColumns: `repeat(${crossword.grid[0].length}, minmax(0, 1fr))` }}
          >
            {userGrid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const clueNumber = crossword.clues.across.find(c => c.row === rIdx && c.col === cIdx)?.number || 
                                   crossword.clues.down.find(c => c.row === rIdx && c.col === cIdx)?.number;
                
                return (
                  <div key={`${rIdx}-${cIdx}`} className="aspect-square w-10 md:w-14 relative">
                    {cell === null ? (
                      <div className="w-full h-full bg-black/60 border border-zinc-900/50" />
                    ) : (
                      <>
                        {clueNumber && (
                          <span className="absolute top-0.5 right-1 text-[8px] md:text-[10px] font-black text-lime/50 z-20">
                            {clueNumber}
                          </span>
                        )}
                        <input
                          type="text"
                          maxLength={1}
                          value={userGrid[rIdx][cIdx] || ''}
                          disabled={validated}
                          onChange={(e) => {
                            const newGrid = userGrid.map((r) => [...r]);
                            newGrid[rIdx][cIdx] = e.target.value.toUpperCase();
                            setUserGrid(newGrid);
                          }}
                          className={`w-full h-full text-white text-center font-black text-xl focus:outline-none border transition-all
                            ${
                              validated
                                ? correctCells[rIdx]?.[cIdx]
                                  ? 'bg-lime/20 border-lime text-lime'
                                  : 'bg-red-500/20 border-red-500 text-red-400'
                                : 'bg-zinc-900 border-zinc-800 focus:bg-lime/20 focus:ring-2 focus:ring-lime/50'
                            }`}
                        />
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Score banner after validation */}
          {score && (
            <div className="mt-8 relative z-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2">نتيجتك</p>
              <p className="text-4xl font-black text-lime">
                {score.correct} / {score.total}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {score.correct === score.total ? '🏆 ممتاز! كل الإجابات صحيحة' : `${score.total - score.correct} خطأ — حاول مجدداً`}
              </p>
            </div>
          )}
        </div>

        {/* Clues */}
        <div className="lg:col-span-5 space-y-10">
          <div className="bg-black/40 p-6 border border-zinc-900">
            <h4 className="text-[11px] font-black text-lime uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <span className="w-1 h-3 bg-lime" /> أفقياً (Across)
            </h4>
            <ul className="space-y-3">
              {crossword.clues.across.map((c) => (
                <li
                  key={c.number}
                  className="text-sm font-bold text-gray-400 leading-relaxed bg-zinc-950/50 p-4 border border-zinc-900 hover:border-zinc-700 transition-colors cursor-default"
                >
                  <span className="text-lime mr-3 font-black opacity-50">{c.number}.</span> {c.clue}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-black/40 p-6 border border-zinc-900">
            <h4 className="text-[11px] font-black text-lime uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <span className="w-1 h-3 bg-lime" /> رأسياً (Down)
            </h4>
            <ul className="space-y-3">
              {crossword.clues.down.map((c) => (
                <li
                  key={c.number}
                  className="text-sm font-bold text-gray-400 leading-relaxed bg-zinc-950/50 p-4 border border-zinc-900 hover:border-zinc-700 transition-colors cursor-default"
                >
                  <span className="text-lime mr-3 font-black opacity-50">{c.number}.</span> {c.clue}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 mt-12">
        {!validated ? (
          <button
            onClick={handleValidate}
            className="px-16 py-5 bg-lime text-black font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-105 transition-all shadow-[0_20px_40px_rgba(158,255,0,0.2)] active:scale-95"
          >
            تحقق من الحل
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="px-16 py-5 bg-zinc-900 text-white font-black uppercase tracking-[0.3em] hover:bg-zinc-800 hover:scale-105 transition-all border border-zinc-700 active:scale-95"
          >
            إعادة المحاولة
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
//  MULTIPLE CHOICE COMPONENT
// ──────────────────────────────────────────────────────────────
export function QuizRenderer({ data }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showStreakAnim, setShowStreakAnim] = useState(false);

  if (data.type === 'crossword' && data.crossword) {
    return <CrosswordGame crossword={data.crossword} />;
  }

  const questions = data.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const difficulty = getDifficultyLabel(currentQuestionIndex, questions.length);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((ms) => Math.max(ms, newStreak));
      if (newStreak >= 3) {
        setShowStreakAnim(true);
        setTimeout(() => setShowStreakAnim(false), 1500);
      }
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowHint(false);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="dxt-card p-12 text-center animate-in zoom-in duration-500 bg-gradient-to-br from-zinc-950 to-black border-lime/30 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="relative z-10">
          <h2 className="text-5xl font-black italic text-lime mb-8 uppercase tracking-tighter">النتيجة النهائية</h2>
          <div className="w-40 h-40 rounded-full border-4 border-lime flex flex-col items-center justify-center mx-auto mb-6 bg-lime/10 shadow-[0_0_50px_rgba(158,255,0,0.2)]">
            <span className="text-5xl font-black text-white leading-none">{score}</span>
            <span className="text-[10px] font-black text-lime mt-1 opacity-50 uppercase tracking-widest">من {questions.length}</span>
          </div>
          <div className="flex justify-center gap-8 mb-10">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{pct}%</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">دقة</p>
            </div>
            <div className="w-px bg-zinc-800" />
            <div className="text-center">
              <p className="text-2xl font-black text-lime">🔥 {maxStreak}</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">أفضل تسلسل</p>
            </div>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-[0.3em] mb-12 max-w-md mx-auto leading-relaxed">
            {score === questions.length
              ? 'أداء أسطوري! أنت خبير كروي حقيقي.'
              : pct >= 70
              ? 'عمل ممتاز! أنت تعرف كرة القدم جيداً.'
              : 'عمل جيد، لكن يمكنك تحسين مستواك أكثر.'}
          </p>
          <button
            onClick={() => {
              setCurrentQuestionIndex(0);
              setScore(0);
              setShowResult(false);
              setSelectedOption(null);
              setStreak(0);
              setMaxStreak(0);
            }}
            className="px-16 py-5 bg-lime text-black font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(158,255,0,0.3)] active:scale-95"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="animate-in slide-in-from-bottom-12 duration-1000 relative">
      {/* Streak animation overlay */}
      {showStreakAnim && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-in zoom-in duration-300">
          <div className="text-8xl font-black text-lime drop-shadow-[0_0_40px_rgba(158,255,0,0.8)] animate-bounce">
            🔥 {streak}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.5em]">المستوى الحالي</p>
            <h4 className="text-xl font-black text-white italic">التحدي رقم {currentQuestionIndex + 1}</h4>
          </div>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-400/10 px-3 py-1.5 border border-orange-400/20 rounded-sm animate-pulse">
                🔥 {streak} متتالية
              </span>
            )}
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 border rounded-sm ${difficulty.color}`}>
              {difficulty.label}
            </span>
            <span className="text-[10px] font-black text-lime uppercase tracking-[0.3em] bg-lime/10 px-5 py-2 border border-lime/20 rounded-sm">
              {score} / {questions.length} نقطة
            </span>
          </div>
        </div>
        <div className="h-1 w-full bg-zinc-900 overflow-hidden">
          <div
            className="h-full bg-lime transition-all duration-700 ease-out shadow-[0_0_15px_#b3d400]"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
        {/* Visual Clue */}
        <div className="bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center p-12 relative group overflow-hidden shadow-2xl min-h-[450px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(158,255,0,0.05)_0%,_transparent_70%)]" />

          {currentQuestion.clueLogos && currentQuestion.clueLogos.length > 0 && (
            <div className="grid grid-cols-3 gap-6 mb-12 relative z-10 w-full max-w-sm">
              {currentQuestion.clueLogos.map((logo, idx) => (
                <div
                  key={idx}
                  className="aspect-square bg-black/40 border border-zinc-800 p-3 hover:border-lime/50 transition-all hover:scale-110 duration-500 group/logo shadow-xl"
                >
                  <img src={logo} alt="Club" className="w-full h-full object-contain transition-all" />
                </div>
              ))}
            </div>
          )}

          <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
            {currentQuestion.imageUrl ? (
              <div key={currentQuestion.question} className="relative group/img flex items-center justify-center min-h-[300px] w-full">
                {/* Background glow for dark logos on black */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
                </div>

                <img
                  src={currentQuestion.imageUrl || '/favicon.png'}
                  alt="Quiz clue"
                  loading="eager"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/favicon.png') {
                      target.src = '/favicon.png';
                    }
                  }}
                  className={`max-w-[320px] max-h-[320px] w-auto h-auto object-contain transition-all duration-1000 relative z-10 ${
                    !selectedOption && (
                      currentQuestion.question.toLowerCase().includes('guess') || 
                      currentQuestion.question.includes('خمن') || 
                      currentQuestion.question.includes('من هو') || 
                      currentQuestion.question.includes('ما هو') ||
                      currentQuestion.question.includes('الفريق') ||
                      currentQuestion.question.includes('الشعار') ||
                      currentQuestion.question.includes('اللاعب')
                    )
                      ? 'opacity-80 scale-100'
                      : 'opacity-100 scale-100 drop-shadow-[0_0_30px_rgba(158,255,0,0.3)]'
                  }`}
                />
                {/* Question mark overlay removed for clarity */}
              </div>
            ) : !currentQuestion.clueLogos ? (
              <div className="text-[120px] opacity-5 animate-bounce">⚽</div>
            ) : null}
          </div>

          <div className="mt-8 text-center relative z-10">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.5em]">استخدم الدلائل البصرية للإجابة</p>
          </div>
        </div>

        {/* Question & Options */}
        <div className="space-y-10 py-6">
          <div className="relative">
            <div className="absolute -left-8 top-0 text-6xl text-lime/10 font-black italic leading-none">"</div>
            <h3 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter italic">
              {currentQuestion.question}
            </h3>
          </div>

          {currentQuestion.hint && (
            <div className="pt-8 border-t border-zinc-900">
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-3 text-[11px] font-black text-zinc-500 hover:text-lime uppercase tracking-[0.4em] transition-all group/hint"
                >
                  <span className="w-5 h-5 rounded-full border border-zinc-800 flex items-center justify-center group-hover/hint:border-lime transition-colors">?</span>
                  كشف تلميح احترافي
                </button>
              ) : (
                <div className="bg-lime/5 p-6 border-l-4 border-lime animate-in slide-in-from-left-4 duration-500">
                  <p className="text-base font-bold text-gray-300 leading-relaxed italic">
                    <span className="text-lime font-black mr-2">HINT:</span> {currentQuestion.hint}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
        {currentQuestion.options.map((option) => {
          let btnStyle =
            'p-8 text-right font-black transition-all border-2 relative overflow-hidden group shadow-lg ';
          if (!selectedOption) {
            btnStyle += 'border-zinc-900 bg-zinc-950 text-white hover:border-lime hover:bg-zinc-900 hover:-translate-y-1';
          } else {
            if (option === currentQuestion.correctAnswer) {
              btnStyle += 'border-lime bg-lime text-black shadow-[0_20px_40px_rgba(158,255,0,0.3)] z-10 scale-105';
            } else if (option === selectedOption) {
              btnStyle += 'border-red-500/50 bg-red-500/10 text-red-500 opacity-80';
            } else {
              btnStyle += 'border-zinc-900/50 bg-zinc-950/50 text-zinc-800 scale-95 opacity-30 grayscale';
            }
          }

          return (
            <button
              key={option}
              disabled={!!selectedOption}
              onClick={() => handleOptionClick(option)}
              className={btnStyle}
            >
              <div className="flex items-center justify-between gap-4 relative z-10">
                <span className="text-xl italic tracking-tighter">{option}</span>
                {selectedOption && option === currentQuestion.correctAnswer && (
                  <span className="text-xs font-black">✓ صح</span>
                )}
                {selectedOption && option === selectedOption && option !== currentQuestion.correctAnswer && (
                  <span className="text-xs font-black">✗ خطأ</span>
                )}
              </div>
              {!selectedOption && (
                <div className="absolute inset-0 bg-gradient-to-l from-lime/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              )}
            </button>
          );
        })}
      </div>

      {selectedOption && (
        <div className="flex justify-center pb-12">
          <button
            onClick={handleNext}
            className="group relative px-20 py-6 bg-white text-black font-black uppercase tracking-[0.5em] text-sm hover:bg-lime transition-all active:scale-95 shadow-2xl hover:shadow-lime/30"
          >
            <span className="relative z-10">
              {currentQuestionIndex + 1 < questions.length ? 'التالي' : 'النتيجة النهائية'}
            </span>
            <div className="absolute inset-0 bg-lime opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}
    </div>
  );
}
