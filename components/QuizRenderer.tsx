'use client';

import { useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
  imageUrl?: string;
}

interface CrosswordData {
  grid: (string | null)[][];
  clues: {
    across: string[];
    down: string[];
  };
}

interface Props {
  data: {
    type: 'multiple_choice' | 'crossword';
    questions?: QuizQuestion[];
    crossword?: CrosswordData;
  };
}

export function QuizRenderer({ data }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Crossword state
  const [userGrid, setUserGrid] = useState<(string | null)[][]>(data.crossword?.grid.map(row => row.map(cell => cell ? '' : null)) || []);

  if (data.type === 'crossword' && data.crossword) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Grid View */}
          <div className="bg-zinc-950 p-4 md:p-8 border border-zinc-900 flex justify-center">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data.crossword.grid[0].length}, minmax(0, 1fr))` }}>
              {userGrid.map((row, rIdx) => 
                row.map((cell, cIdx) => (
                  <div key={`${rIdx}-${cIdx}`} className="aspect-square w-8 md:w-12 relative">
                    {cell === null ? (
                      <div className="w-full h-full bg-black border border-zinc-900" />
                    ) : (
                      <input
                        type="text"
                        maxLength={1}
                        value={userGrid[rIdx][cIdx] || ''}
                        onChange={(e) => {
                          const newGrid = [...userGrid];
                          newGrid[rIdx][cIdx] = e.target.value.toUpperCase();
                          setUserGrid(newGrid);
                        }}
                        className="w-full h-full bg-zinc-900 text-white text-center font-black text-lg focus:outline-none focus:bg-lime/20 focus:border-lime border border-zinc-800 transition-colors"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clues */}
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-lime uppercase tracking-widest mb-4">أفقياً (Across)</h4>
              <ul className="space-y-2">
                {data.crossword.clues.across.map((clue, i) => (
                  <li key={i} className="text-sm font-bold text-gray-400 leading-relaxed bg-zinc-950 p-3 border border-zinc-900">{clue}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-lime uppercase tracking-widest mb-4">رأسياً (Down)</h4>
              <ul className="space-y-2">
                {data.crossword.clues.down.map((clue, i) => (
                  <li key={i} className="text-sm font-bold text-gray-400 leading-relaxed bg-zinc-950 p-3 border border-zinc-900">{clue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
           <button 
             onClick={() => alert('ميزة التحقق من الحل قيد التطوير!')}
             className="px-12 py-4 bg-lime text-black font-black uppercase tracking-widest hover:bg-white transition-all"
           >
             تحقق من الحل
           </button>
        </div>
      </div>
    );
  }

  // Multiple Choice logic
  const questions = data.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
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
    return (
      <div className="dxt-card p-12 text-center animate-in zoom-in duration-500 bg-gradient-to-br from-zinc-950 to-black border-lime/30">
        <h2 className="text-4xl font-black italic text-lime mb-6">انتهى التحدي</h2>
        <div className="w-32 h-32 rounded-full border-4 border-lime flex items-center justify-center mx-auto mb-8 bg-lime/5">
           <span className="text-4xl font-black text-white">{score}</span>
        </div>
        <p className="text-gray-500 font-bold uppercase tracking-widest mb-10">لقد أجبت بشكل صحيح على {score} من {questions.length} أسئلة</p>
        <button
          onClick={() => { setCurrentQuestionIndex(0); setScore(0); setShowResult(false); setSelectedOption(null); }}
          className="px-12 py-4 bg-lime text-black font-black uppercase tracking-widest hover:bg-white transition-colors shadow-[0_0_30px_rgba(179,212,0,0.3)]"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-4">
           <div className="w-1.5 h-6 bg-lime" />
           <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
             السؤال {currentQuestionIndex + 1} / {questions.length}
           </span>
        </div>
        <span className="text-[10px] font-black text-lime uppercase tracking-[0.3em] bg-lime/10 px-4 py-1.5 border border-lime/20 rounded-full">
          النقاط: {score}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
        {/* Visual Clue (Logo or Image) */}
        <div className="aspect-square bg-zinc-950 border border-zinc-900 flex items-center justify-center p-8 relative group overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-t from-lime/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           {currentQuestion.imageUrl ? (
             <img 
               src={currentQuestion.imageUrl} 
               alt="Quiz clue" 
               className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700" 
             />
           ) : (
             <div className="text-8xl opacity-10 group-hover:opacity-30 transition-opacity">⚽</div>
           )}
        </div>

        <div className="space-y-6">
          <h3 className="text-3xl font-black text-white leading-tight">
            {currentQuestion.question}
          </h3>
          
          {currentQuestion.hint && (
            <div className="pt-4 border-t border-zinc-900">
              {!showHint ? (
                <button 
                  onClick={() => setShowHint(true)}
                  className="text-[10px] font-black text-zinc-600 hover:text-lime underline uppercase tracking-[0.3em] transition-colors"
                >
                  احصل على تلميح ذكي؟
                </button>
              ) : (
                <div className="bg-lime/5 p-4 border border-lime/20">
                   <p className="text-sm font-bold text-lime italic leading-relaxed">
                     💡 {currentQuestion.hint}
                   </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {currentQuestion.options.map((option) => {
          let btnStyle = "p-6 text-right font-black transition-all border-2 relative overflow-hidden group ";
          if (!selectedOption) {
            btnStyle += "border-zinc-900 bg-zinc-950 text-white hover:border-lime/50 hover:bg-zinc-900";
          } else {
            if (option === currentQuestion.correctAnswer) {
              btnStyle += "border-lime bg-lime/20 text-lime shadow-[0_0_30px_rgba(179,212,0,0.1)]";
            } else if (option === selectedOption) {
              btnStyle += "border-red-500 bg-red-500/20 text-red-500 opacity-80";
            } else {
              btnStyle += "border-zinc-900 bg-zinc-950 text-zinc-800 scale-95 opacity-40";
            }
          }

          return (
            <button
              key={option}
              disabled={!!selectedOption}
              onClick={() => handleOptionClick(option)}
              className={btnStyle}
            >
              <div className="relative z-10">{option}</div>
              {!selectedOption && (
                <div className="absolute inset-0 bg-lime/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              )}
            </button>
          );
        })}
      </div>

      {selectedOption && (
        <div className="flex justify-center">
          <button
            onClick={handleNext}
            className="group relative px-12 py-5 bg-white text-black font-black uppercase tracking-[0.4em] text-xs hover:bg-lime transition-all active:scale-95 shadow-xl"
          >
            <span className="relative z-10">
              {currentQuestionIndex + 1 < questions.length ? "السؤال التالي >>" : "استعراض النتائج"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
