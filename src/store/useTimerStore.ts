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

// Traductor matemático: Convierte strings en cuartos de vuelta
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
  
  // Tracking simplificado y robusto
  scrambleMoves: string[];
  scrambleIndex: number;
  currentFaceProgress: number; // Acumulador de cuartos de vuelta
  errorStack: string[];        // Ahora soporta múltiples errores seguidos

  connectCube: (cube: SmartCube) => Promise<void>;
  disconnectCube: () => void;
  generateScramble: () => Promise<void>;
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
        const { status, scrambleMoves, scrambleIndex, currentFaceProgress, errorStack, startTimer, stopTimer } = get();
        set({ lastMove: move });
        
        virtualCube.applyMove(move);

        if (status === 'scrambling') {
          const { face, turns } = parseMove(move);

          if (errorStack.length > 0) {
            // Lógica para deshacer errores acumulados
            const lastError = errorStack[errorStack.length - 1];
            if (move === getInverseMove(lastError)) {
              const newStack = [...errorStack];
              newStack.pop();
              set({ errorStack: newStack });
            } else {
              set({ errorStack: [...errorStack, move] }); // Acumula el nuevo error
            }
          } else {
            // Lógica de avance de mezcla con Matemática Modular
            const expectedStr = scrambleMoves[scrambleIndex];
            const exp = parseMove(expectedStr);

            if (face === exp.face) {
              const newProgress = (currentFaceProgress + turns) % 4;
              
              if (newProgress === exp.turns) {
                // Paso completado
                const nextIndex = scrambleIndex + 1;
                set({ 
                  scrambleIndex: nextIndex, 
                  currentFaceProgress: 0,
                  status: nextIndex === scrambleMoves.length ? 'idle' : 'scrambling'
                });
              } else if (newProgress === 0) {
                // El usuario se arrepintió y deshizo su giro a medias
                set({ currentFaceProgress: 0 });
              } else {
                // Progreso a medias (ej. hizo U, pero le falta otro para el U2)
                set({ currentFaceProgress: newProgress });
              }
            } else {
              // Tocó la cara equivocada, es un error
              set({ errorStack: [move] });
            }
          }
        } else if (status === 'idle') {
          startTimer();
        } else if (status === 'running') {
          if (virtualCube.isSolved()) {
            stopTimer();
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

  generateScramble: async () => {
    virtualCube.reset(); // LIMPIAMOS LA MEMORIA VIRTUAL AQUÍ
    
    const scrambleObj = await randomScrambleForEvent('333');
    const scrambleStr = scrambleObj.toString();
    const moves = scrambleStr.split(/\s+/).filter(Boolean);
    
    set({ 
      scramble: scrambleStr, 
      scrambleMoves: moves,
      scrambleIndex: 0,
      currentFaceProgress: 0,
      errorStack: [],
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