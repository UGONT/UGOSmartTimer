import { create } from 'zustand';
import type { SmartCube } from '../hardware/SmartCube';
import { randomScrambleForEvent } from 'cubing/scramble';
import { virtualCube } from '../services/VirtualCube';

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

  connectCube: (cube: SmartCube) => Promise<void>;
  disconnectCube: () => void;
  generateScramble: (triggeringMove?: string) => Promise<void>;
  setIdle: () => void;
  startTimer: () => void;
  stopTimer: () => void;
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

  connectCube: async (cube: SmartCube) => {
    try {
      await virtualCube.init();
      await cube.connect();
      
      cube.onMove((move) => {
        const { status, scrambleMoves, scrambleIndex, currentFaceProgress, errorStack, startTimer, stopTimer, generateScramble } = get();
        set({ lastMove: move });
        
        // 1. Guardar el estado de resuelto ANTES de aplicar el movimiento de activación
        const wasSolved = virtualCube.isSolved();

        // 2. Sincronizar el cubo virtual con el giro físico
        virtualCube.applyMove(move);

        if (status === 'scrambling') {
          if (scrambleMoves.length === 0) return; // Evitar carreras asíncronas mientras se genera la mezcla

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
          // CONTROL INTELIGENTE DE NUEVA MEZCLA:
          // Solo genera la mezcla si el cubo físico estaba completamente armado antes de girar.
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
    // Generar la mezcla en segundo plano para evitar tirones asíncronos
    const scrambleObj = await randomScrambleForEvent('333');
    const scrambleStr = scrambleObj.toString();
    const moves = scrambleStr.split(/\s+/).filter(Boolean);
    
    virtualCube.reset();
    
    if (triggeringMove) {
      virtualCube.applyMove(triggeringMove);
    }
    
    set({ 
      scramble: scrambleStr, 
      scrambleMoves: moves,
      scrambleIndex: 0,
      currentFaceProgress: 0,
      errorStack: triggeringMove ? [triggeringMove] : [],
      status: 'scrambling', 
      time: 0 
    });
  },

  setIdle: () => set({ status: 'idle' }),

  startTimer: () => {
    set({ status: 'running', startTime: performance.now(), time: 0 });
  },

  stopTimer: () => {
    const { status, startTime } = get();
    if (status === 'running') {
      const endTime = performance.now();
      set({ status: 'stopped', time: endTime - startTime });
    }
  }
}));