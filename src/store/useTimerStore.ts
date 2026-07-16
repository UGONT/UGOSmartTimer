import { create } from 'zustand';
import type { SmartCube } from '../hardware/SmartCube';
import { randomScrambleForEvent } from 'cubing/scramble';
import { virtualCube } from '../services/VirtualCube';
import { db, type SolveRecord } from '../database/db';

type TimerStatus = 'scrambling' | 'idle' | 'running' | 'stopped';

export const getInverseMove = (move: string): string => {
  if (move.endsWith("'")) return move.slice(0, -1);
  if (move.endsWith('2')) return move;
  return move + "'";
};

export const parseMove = (m: string) => {
  const face = m[0];
  const turns = m.includes('2') ? 2 : m.includes("'") ? 3 : 1;
  return { face, turns };
};

// Matemáticas oficiales WCA
const calcAoX = (times: number[], x: number): number | null => {
  if (times.length < x) return null;
  const recent = times.slice(-x);
  const sorted = [...recent].sort((a, b) => a - b);
  sorted.pop();
  sorted.shift();
  return sorted.reduce((a, b) => a + b, 0) / (x - 2);
};

const calcBestAoX = (times: number[], x: number): number | null => {
  if (times.length < x) return null;
  let best = Infinity;
  for (let i = 0; i <= times.length - x; i++) {
    const window = times.slice(i, i + x);
    const sorted = [...window].sort((a, b) => a - b);
    sorted.pop();
    sorted.shift();
    const avg = sorted.reduce((a, b) => a + b, 0) / (x - 2);
    if (avg < best) best = avg;
  }
  return best === Infinity ? null : best;
};

interface StatsMatrix {
  current: { single: number | null; ao5: number | null; ao12: number | null; ao50: number | null; ao100: number | null };
  best: { single: number | null; ao5: number | null; ao12: number | null; ao50: number | null; ao100: number | null };
}

interface TimerState {
  activeCube: SmartCube | null;
  isConnected: boolean;
  lastMove: string;
  
  status: TimerStatus;
  startTime: number;
  time: number;
  scramble: string;
  
  scrambleMoves: string[];
  scrambleIndex: number;
  currentFaceProgress: number;
  errorStack: string[];
  moveHistory: string[];
  
  // Nuevas propiedades para paneles
  solvesList: SolveRecord[];
  solveCount: number;
  stats: StatsMatrix;

  connectCube: (cube: SmartCube) => Promise<void>;
  disconnectCube: () => void;
  generateScramble: (triggeringMove?: string) => Promise<void>;
  setIdle: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  loadStats: () => Promise<void>;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeCube: null,
  isConnected: false,
  lastMove: '',
  
  status: 'scrambling',
  startTime: 0,
  time: 0,
  scramble: 'Cargando scramble...',
  
  scrambleMoves: [],
  scrambleIndex: 0,
  currentFaceProgress: 0,
  errorStack: [],
  moveHistory: [],
  
  solvesList: [],
  solveCount: 0,
  stats: {
    current: { single: null, ao5: null, ao12: null, ao50: null, ao100: null },
    best: { single: null, ao5: null, ao12: null, ao50: null, ao100: null }
  },

  loadStats: async () => {
    const solves = await db.solves.orderBy('id').toArray();
    const times = solves.map(s => s.time);
    
    const bestSingle = times.length > 0 ? Math.min(...times) : null;
    const currentSingle = times.length > 0 ? times[times.length - 1] : null;

    set({
      solvesList: solves,
      solveCount: solves.length,
      stats: {
        current: {
          single: currentSingle,
          ao5: calcAoX(times, 5),
          ao12: calcAoX(times, 12),
          ao50: calcAoX(times, 50),
          ao100: calcAoX(times, 100),
        },
        best: {
          single: bestSingle,
          ao5: calcBestAoX(times, 5),
          ao12: calcBestAoX(times, 12),
          ao50: calcBestAoX(times, 50),
          ao100: calcBestAoX(times, 100),
        }
      }
    });
  },

  connectCube: async (cube: SmartCube) => {
    try {
      await virtualCube.init();
      await cube.connect();
      get().loadStats();
      
      cube.onMove((move) => {
        const { status, scrambleMoves, scrambleIndex, currentFaceProgress, errorStack, startTimer, stopTimer, generateScramble } = get();
        set({ lastMove: move, moveHistory: [...get().moveHistory, move] });
        
        const wasSolved = virtualCube.isSolved();
        virtualCube.applyMove(move);

        if (status === 'scrambling') {
          if (scrambleMoves.length === 0) return; 

          const { face, turns } = parseMove(move);

          if (errorStack.length > 0) {
            const lastError = errorStack[errorStack.length - 1];
            if (move === getInverseMove(lastError)) {
              const newStack = [...errorStack];
              newStack.pop();
              set({ errorStack: newStack });
            } else {
              set({ errorStack: [...errorStack, move] });
            }
          } else {
            const expectedStr = scrambleMoves[scrambleIndex];
            const exp = parseMove(expectedStr);

            if (face === exp.face) {
              const newProgress = (currentFaceProgress + turns) % 4;
              if (newProgress === exp.turns) {
                const nextIndex = scrambleIndex + 1;
                set({ 
                  scrambleIndex: nextIndex, 
                  currentFaceProgress: 0,
                  status: nextIndex === scrambleMoves.length ? 'idle' : 'scrambling'
                });
              } else if (newProgress === 0) {
                set({ currentFaceProgress: 0 });
              } else {
                set({ currentFaceProgress: newProgress });
              }
            } else {
              set({ errorStack: [move] });
            }
          }
        } else if (status === 'idle') {
          startTimer();
        } else if (status === 'running') {
          if (virtualCube.isSolved()) {
            stopTimer();
          }
        } else if (status === 'stopped') {
          if (wasSolved) {
            set({ status: 'scrambling', scramble: 'Generando mezcla...', scrambleMoves: [] });
            generateScramble(move);
          }
        }
      });

      set({ activeCube: cube, isConnected: true });
    } catch (error) {
      console.error('Error:', error);
      set({ isConnected: false, activeCube: null });
    }
  },

  disconnectCube: () => {
    const { activeCube } = get();
    if (activeCube) activeCube.disconnect();
    set({ activeCube: null, isConnected: false, lastMove: '', status: 'scrambling', time: 0 });
  },

  generateScramble: async (triggeringMove?: string) => {
    const scrambleObj = await randomScrambleForEvent('333');
    const scrambleStr = scrambleObj.toString();
    const moves = scrambleStr.split(/\s+/).filter(Boolean);
    
    virtualCube.reset();
    if (triggeringMove) virtualCube.applyMove(triggeringMove);
    
    set({ 
      scramble: scrambleStr, 
      scrambleMoves: moves,
      scrambleIndex: 0,
      currentFaceProgress: 0,
      errorStack: triggeringMove ? [triggeringMove] : [],
      moveHistory: triggeringMove ? [triggeringMove] : [],
      status: 'scrambling', 
      time: 0 
    });
  },

  setIdle: () => set({ status: 'idle' }),

  startTimer: () => {
    set({ status: 'running', startTime: performance.now(), time: 0 });
  },

  stopTimer: async () => {
    const { status, startTime, scramble, loadStats } = get();
    if (status === 'running') {
      const endTime = performance.now();
      const finalTime = endTime - startTime;
      
      set({ status: 'stopped', time: finalTime });

      try {
        await db.solves.add({
          time: finalTime,
          scramble: scramble,
          date: new Date()
        });
        await loadStats();
      } catch (err) {
        console.error('Error guardando en IndexedDB', err);
      }
    }
  }
}));