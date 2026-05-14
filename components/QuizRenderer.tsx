'use client';

import { useState, useEffect, useRef } from 'react';

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
  const rows = crossword.grid.length;
  const cols = crossword.grid[0].length;
  const allClues = [...crossword.clues.across, ...crossword.clues.down];

  const [userGrid, setUserGrid] = useState<(string | null)[][]>(() =>
    crossword.grid.map((row) => row.map((cell) => (cell ? '' : null)))
  );
  const [validated, setValidated] = useState(false);
  const [correctCells, setCorrectCells] = useState<boolean[][]>([]);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [activeRow, setActiveRow] = useState(() => firstCell().row);
  const [activeCol, setActiveCol] = useState(() => firstCell().col);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [elapsed, setElapsed] = useState(0);
  const [wordResults, setWordResults] = useState<Record<string, boolean>>({});
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [completedClues, setCompletedClues] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Init refs grid
  useEffect(() => {
    inputRefs.current = Array.from({ length: rows }, () => Array(cols).fill(null));
  }, [rows, cols]);

  function firstCell() {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (crossword.grid[r][c] !== null) return { row: r, col: c };
    return { row: 0, col: 0 };
  }

  // Timer
  useEffect(() => {
    if (validated || isComplete) return;
    const interval = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [validated, isComplete]);

  function cellKey(r: number, c: number) { return `${r},${c}`; }
  function clueKey(type: string, num: number) { return `${type}-${num}`; }

  function getClueAt(row: number, col: number, dir: 'across' | 'down'): CrosswordClue | null {
    if (dir === 'across')
      return crossword.clues.across.find(c => c.row === row && c.col <= col && c.col + c.answer.length > col) || null;
    return crossword.clues.down.find(c => c.col === col && c.row <= row && c.row + c.answer.length > row) || null;
  }

  function getActiveClue(): CrosswordClue | null {
    return getClueAt(activeRow, activeCol, direction);
  }

  function getWordCells(clue: CrosswordClue, dir: 'across' | 'down'): { row: number; col: number }[] {
    const cells: { row: number; col: number }[] = [];
    if (dir === 'across')
      for (let i = 0; i < clue.answer.length; i++)
        if (crossword.grid[clue.row][clue.col + i] !== null)
          cells.push({ row: clue.row, col: clue.col + i });
    else
      for (let i = 0; i < clue.answer.length; i++)
        if (crossword.grid[clue.row + i][clue.col] !== null)
          cells.push({ row: clue.row + i, col: clue.col });
    return cells;
  }

  function isCellInActiveWord(r: number, c: number): boolean {
    const clue = getActiveClue();
    if (!clue) return false;
    const cells = getWordCells(clue, direction);
    return cells.some(cell => cell.row === r && cell.col === c);
  }

  function isCellInCompletedWord(r: number, c: number): boolean {
    for (const key of completedClues) {
      const [type, numStr] = key.split('-');
      const num = Number(numStr);
      const clueList = type === 'across' ? crossword.clues.across : crossword.clues.down;
      const clue = clueList.find(cl => cl.number === num);
      if (!clue) continue;
      const dir = type as 'across' | 'down';
      const cells = getWordCells(clue, dir);
      if (cells.some(cell => cell.row === r && cell.col === c)) return true;
    }
    return false;
  }

  function findNextCellInWord(r: number, c: number, dir: 'across' | 'down'): { row: number; col: number } | null {
    const clue = getClueAt(r, c, dir);
    if (!clue) return null;
    const cells = getWordCells(clue, dir);
    const idx = cells.findIndex(cell => cell.row === r && cell.col === c);
    if (idx === -1) return null;
    for (let i = idx + 1; i < cells.length; i++) {
      if (!userGrid[cells[i].row][cells[i].col]) return cells[i];
    }
    return null;
  }

  function findPrevCellInWord(r: number, c: number, dir: 'across' | 'down'): { row: number; col: number } | null {
    const clue = getClueAt(r, c, dir);
    if (!clue) return null;
    const cells = getWordCells(clue, dir);
    const idx = cells.findIndex(cell => cell.row === r && cell.col === c);
    if (idx === -1) return null;
    for (let i = idx - 1; i >= 0; i--) {
      if (!userGrid[cells[i].row][cells[i].col]) return null;
      return cells[i];
    }
    return null;
  }

  function focusCell(r: number, c: number) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (crossword.grid[r][c] === null) return;
    setActiveRow(r);
    setActiveCol(c);
    const el = inputRefs.current[r]?.[c];
    if (el) setTimeout(() => el.focus(), 0);
  }

  function handleCellChange(r: number, c: number, value: string) {
    const letter = value.slice(-1).toUpperCase();
    if (crossword.grid[r][c] === null) return;
    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = letter;
    setUserGrid(newGrid);

    if (letter) {
      const next = findNextCellInWord(r, c, direction);
      if (next) focusCell(next.row, next.col);
    }
  }

  function handleKeyDown(r: number, c: number, e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp') { e.preventDefault(); moveTo(r - 1, c, 'up'); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveTo(r + 1, c, 'down'); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); moveTo(r, c - 1, 'left'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); moveTo(r, c + 1, 'right'); }
    else if (e.key === 'Backspace') {
      if (userGrid[r][c]) {
        const newGrid = userGrid.map(row => [...row]);
        newGrid[r][c] = '';
        setUserGrid(newGrid);
      } else {
        const prev = findPrevCellInWord(r, c, direction);
        if (prev) {
          const newGrid = userGrid.map(row => [...row]);
          newGrid[prev.row][prev.col] = '';
          setUserGrid(newGrid);
          focusCell(prev.row, prev.col);
        }
      }
    }
    else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const clues = crossword.clues.across.filter(cl => cl.row === r && cl.col <= c && cl.col + cl.answer.length > c);
      const clued = crossword.clues.down.filter(cl => cl.col === c && cl.row <= r && cl.row + cl.answer.length > r);
      if (clues.length > 0 && clued.length > 0) {
        setDirection(d => d === 'across' ? 'down' : 'across');
      }
    }
  }

  function moveTo(r: number, c: number, _dir: string) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (crossword.grid[r][c] === null) {
      const dr = _dir === 'up' ? -1 : _dir === 'down' ? 1 : 0;
      const dc = _dir === 'left' ? -1 : _dir === 'right' ? 1 : 0;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return;
      moveTo(nr, nc, _dir);
      return;
    }
    focusCell(r, c);
  }

  function handleCellClick(r: number, c: number) {
    if (crossword.grid[r][c] === null) return;
    if (activeRow === r && activeCol === c) {
      setDirection(d => d === 'across' ? 'down' : 'across');
    } else {
      const hasAcross = crossword.clues.across.some(cl => cl.row === r && cl.col <= c && cl.col + cl.answer.length > c);
      const hasDown = crossword.clues.down.some(cl => cl.col === c && cl.row <= r && cl.row + cl.answer.length > r);
      if (hasAcross && !hasDown) setDirection('across');
      else if (hasDown && !hasAcross) setDirection('down');
      focusCell(r, c);
    }
  }

  function handleClueClick(clue: CrosswordClue, dir: 'across' | 'down') {
    setDirection(dir);
    focusCell(clue.row, clue.col);
  }

  function validateWord(clue: CrosswordClue, dir: 'across' | 'down') {
    const cells = getWordCells(clue, dir);
    const key = clueKey(dir, clue.number);
    const allCorrect = cells.every(cell =>
      userGrid[cell.row][cell.col]?.toUpperCase() === crossword.grid[cell.row][cell.col]?.toUpperCase()
    );
    setWordResults(w => ({ ...w, [key]: allCorrect }));
    if (allCorrect) {
      setCompletedClues(s => new Set(s).add(key));
      checkAllCompleted();
    }
    return allCorrect;
  }

  function checkAllCompleted() {
    const total = allClues.length;
    if (completedClues.size >= total) {
      setIsComplete(true);
    }
  }

  function revealHint() {
    const clue = getActiveClue();
    if (!clue) return;
    const cells = getWordCells(clue, direction);
    const wrongCells = cells.filter(cell =>
      !revealedCells.has(cellKey(cell.row, cell.col)) &&
      userGrid[cell.row][cell.col]?.toUpperCase() !== crossword.grid[cell.row][cell.col]?.toUpperCase()
    );
    if (wrongCells.length === 0) return;
    const target = wrongCells[0];
    const newGrid = userGrid.map(row => [...row]);
    newGrid[target.row][target.col] = crossword.grid[target.row][target.col]!;
    setUserGrid(newGrid);
    setRevealedCells(s => new Set(s).add(cellKey(target.row, target.col)));
    focusCell(target.row, target.col);
  }

  function handleValidateAll() {
    const result: boolean[][] = crossword.grid.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (cell === null) return true;
        return userGrid[rIdx][cIdx]?.toUpperCase() === cell.toUpperCase();
      })
    );
    setCorrectCells(result);
    setValidated(true);

    let correct = 0;
    let total = 0;
    crossword.grid.forEach((row, rIdx) =>
      row.forEach((cell, cIdx) => {
        if (cell !== null) { total++; if (result[rIdx][cIdx]) correct++; }
      })
    );
    setScore({ correct, total });
    setIsComplete(correct === total);

    allClues.forEach(cl => {
      const a = crossword.clues.across.includes(cl);
      const d = crossword.clues.down.includes(cl);
      if (a) validateWord(cl, 'across');
      if (d) validateWord(cl, 'down');
    });
  }

  function handleReset() {
    setUserGrid(crossword.grid.map((row) => row.map((cell) => (cell ? '' : null))));
    setValidated(false);
    setCorrectCells([]);
    setScore(null);
    setElapsed(0);
    setWordResults({});
    setRevealedCells(new Set());
    setCompletedClues(new Set());
    setIsComplete(false);
    const fc = firstCell();
    setActiveRow(fc.row);
    setActiveCol(fc.col);
    setDirection('across');
  }

  function isWordCorrect(clue: CrosswordClue, dir: 'across' | 'down'): boolean | null {
    const key = clueKey(dir, clue.number);
    if (wordResults[key] !== undefined) return wordResults[key];
    return null;
  }

  function activeClueCls(clue: CrosswordClue, dir: 'across' | 'down'): string {
    const active = getActiveClue();
    if (active?.number === clue.number && ((dir === 'across' && crossword.clues.across.includes(active)) || (dir === 'down' && crossword.clues.down.includes(active))))
      return 'border-lime/50 bg-lime/5';
    return 'border-zinc-900 bg-zinc-950/50';
  }

  // ------ Render ------
  const activeClue = getActiveClue();

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Timer & Stats Bar */}
      <div className="flex items-center justify-between gap-4 bg-zinc-950 border border-zinc-900 p-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${validated || isComplete ? 'bg-zinc-600' : 'bg-lime animate-pulse'}`} />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
            {validated || isComplete ? 'تم' : 'لعب'}
          </span>
        </div>
        <div className="flex items-center gap-6">
          {activeClue && (
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              <span className="text-lime">{direction === 'across' ? 'أفقي' : 'رأسي'}</span> · {activeClue.clue}
            </span>
          )}
          <span className="text-lg font-black text-lime tabular-nums" dir="ltr">{fmt(elapsed)}</span>
        </div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
          {completedClues.size}/{allClues.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Grid */}
        <div className="lg:col-span-7 bg-zinc-950 p-6 md:p-12 border border-zinc-900 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime/5 to-transparent pointer-events-none" />
          <div
            className="grid gap-1.5 relative z-10"
            dir="ltr"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {userGrid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isBlack = cell === null;
                const isActive = activeRow === rIdx && activeCol === cIdx;
                const inActiveWord = !isBlack && isCellInActiveWord(rIdx, cIdx);
                const inCompleted = !isBlack && isCellInCompletedWord(rIdx, cIdx);
                const isRevealed = revealedCells.has(cellKey(rIdx, cIdx));
                const cellCorrect = correctCells[rIdx]?.[cIdx];

                const clueNumber = crossword.clues.across.find(c => c.row === rIdx && c.col === cIdx)?.number ||
                                   crossword.clues.down.find(c => c.row === rIdx && c.col === cIdx)?.number;

                let cellStyle = 'bg-zinc-900 border-zinc-800';
                if (validated) {
                  cellStyle = cellCorrect ? 'bg-lime/20 border-lime text-lime' : 'bg-red-500/20 border-red-500 text-red-400';
                } else if (isActive) {
                  cellStyle = 'bg-lime/20 border-lime ring-2 ring-lime/50';
                } else if (inActiveWord) {
                  cellStyle = 'bg-lime/10 border-lime/30';
                } else if (inCompleted) {
                  cellStyle = 'bg-emerald-900/20 border-emerald-700/30';
                }

                return (
                  <div key={`${rIdx}-${cIdx}`} className="aspect-square w-10 md:w-14 relative">
                    {isBlack ? (
                      <div className="w-full h-full bg-black/60 border border-zinc-900/50" />
                    ) : (
                      <>
                        {clueNumber && (
                          <span className="absolute top-0.5 right-1 text-[8px] md:text-[10px] font-black text-lime/50 z-20 select-none">
                            {clueNumber}
                          </span>
                        )}
                        <input
                          ref={el => { inputRefs.current[rIdx]![cIdx] = el; }}
                          type="text"
                          maxLength={1}
                          value={userGrid[rIdx][cIdx] || ''}
                          disabled={validated || isComplete}
                          onFocus={() => handleCellClick(rIdx, cIdx)}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(rIdx, cIdx, e)}
                          className={`w-full h-full text-white text-center font-black text-xl focus:outline-none border transition-all duration-150
                            ${cellStyle} ${isRevealed ? 'shadow-[inset_0_0_10px_rgba(255,255,0,0.3)]' : ''}`}
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
                {isComplete
                  ? '🏆 ممتاز! كل الإجابات صحيحة'
                  : validated
                    ? `${score.total - score.correct} خطأ — حاول مجدداً`
                    : ''}
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
            <ul className="space-y-2">
              {crossword.clues.across.map((c) => {
                const wc = isWordCorrect(c, 'across');
                return (
                  <li
                    key={c.number}
                    onClick={() => handleClueClick(c, 'across')}
                    className={`text-sm font-bold leading-relaxed p-4 border transition-all cursor-pointer hover:border-zinc-600 ${activeClueCls(c, 'across')}
                      ${wc === true ? 'text-lime border-lime/30 bg-lime/5' : wc === false ? 'text-red-400 border-red-500/30 bg-red-500/5' : 'text-gray-400'}`}
                  >
                    <span className="text-lime mr-3 font-black opacity-50">{c.number}.</span> {c.clue}
                    {wc === true && <span className="mr-2 text-lime">✓</span>}
                    {wc === false && <span className="mr-2 text-red-400">✗</span>}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="bg-black/40 p-6 border border-zinc-900">
            <h4 className="text-[11px] font-black text-lime uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <span className="w-1 h-3 bg-lime" /> رأسياً (Down)
            </h4>
            <ul className="space-y-2">
              {crossword.clues.down.map((c) => {
                const wc = isWordCorrect(c, 'down');
                return (
                  <li
                    key={c.number}
                    onClick={() => handleClueClick(c, 'down')}
                    className={`text-sm font-bold leading-relaxed p-4 border transition-all cursor-pointer hover:border-zinc-600 ${activeClueCls(c, 'down')}
                      ${wc === true ? 'text-lime border-lime/30 bg-lime/5' : wc === false ? 'text-red-400 border-red-500/30 bg-red-500/5' : 'text-gray-400'}`}
                  >
                    <span className="text-lime mr-3 font-black opacity-50">{c.number}.</span> {c.clue}
                    {wc === true && <span className="mr-2 text-lime">✓</span>}
                    {wc === false && <span className="mr-2 text-red-400">✗</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
        {!validated && !isComplete && (
          <>
            <button
              onClick={handleValidateAll}
              className="px-12 py-5 bg-lime text-black font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-105 transition-all shadow-[0_20px_40px_rgba(158,255,0,0.2)] active:scale-95"
            >
              تحقق من الحل
            </button>
            <button
              onClick={revealHint}
              className="px-8 py-5 bg-zinc-900 text-lime font-black uppercase tracking-[0.3em] hover:bg-zinc-800 hover:scale-105 transition-all border border-zinc-700 active:scale-95 text-sm"
            >
              💡 تلميح
            </button>
            {activeClue && (
              <button
                onClick={() => { validateWord(activeClue, direction); }}
                className="px-8 py-5 bg-zinc-900 text-gray-300 font-black uppercase tracking-[0.3em] hover:bg-zinc-800 hover:scale-105 transition-all border border-zinc-700 active:scale-95 text-sm"
              >
                تحقق من الكلمة
              </button>
            )}
          </>
        )}
        {(validated || isComplete) && (
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
