import { create } from 'zustand';
import type { SmartCube } from '../hardware/SmartCube';
import { randomScrambleForEvent } from 'cubing/scramble';
import { virtualCube } from '../services/VirtualCube';

// Añadimos 'scrambling' a los estados posibles
type TimerStatus = 'scrambling' | 'idle' | 'running' | 'stopped';

interface TimerState {
  activeCube: SmartCube | null;
  isConnected: boolean;
  lastMove: string;
  
  status: TimerStatus;
  startTime: number;
  time: number;
  scramble: string;

  connectCube: (cube: SmartCube) => Promise<void>;
  disconnectCube: () => void;
  generateScramble: () => Promise<void>;
  setIdle: () => void; // Nueva acción
  startTimer: () => void;
  stopTimer: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeCube: null,
  isConnected: false,
  lastMove: '',
  
  status: 'scrambling', // Comenzamos en modo de mezcla
  startTime: 0,
  time: 0,
  scramble: 'Cargando scramble...',

  connectCube: async (cube: SmartCube) => {
    try {
      await virtualCube.init(); // Inicializamos el motor 3D invisible
      await cube.connect();
      
      cube.onMove((move) => {
        const { status, startTimer, stopTimer } = get();
        set({ lastMove: move });
        
        // 1. Siempre sincronizamos el cubo físico con el virtual
        virtualCube.applyMove(move);

        // 2. Lógica de reaccion según el estado actual
        if (status === 'idle') {
          // El usuario terminó de mezclar, este es el primer giro del solve
          startTimer();
        } else if (status === 'running') {
          // El cronómetro corre, comprobamos en milisegundos si ya se armó
          if (virtualCube.isSolved()) {
            stopTimer(); // ¡DETENCIÓN AUTOMÁTICA!
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
    const scrambleObj = await randomScrambleForEvent('333');
    set({ scramble: scrambleObj.toString(), status: 'scrambling', time: 0 });
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