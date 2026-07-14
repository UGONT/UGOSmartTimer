import { useEffect, useState, useRef } from 'react';
import { useTimerStore } from '../store/useTimerStore';

export function TimerDisplay() {
  const { status, startTime, time, scramble, stopTimer, generateScramble, setIdle } = useTimerStore();
  const [displayTime, setDisplayTime] = useState(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    generateScramble();
  }, []);

  const updateTimer = () => {
    if (status === 'running') {
      setDisplayTime(performance.now() - startTime);
      requestRef.current = requestAnimationFrame(updateTimer);
    }
  };

  useEffect(() => {
    if (status === 'running') {
      requestRef.current = requestAnimationFrame(updateTimer);
    } else if (status === 'stopped') {
      setDisplayTime(time);
      cancelAnimationFrame(requestRef.current);
    } else {
      setDisplayTime(0);
    }
    
    return () => cancelAnimationFrame(requestRef.current);
  }, [status, startTime, time]);

  // NUEVA LÓGICA DE TECLADO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Evita que la página baje si presionas espacio
        
        // Obtenemos el estado más reciente directamente del store
        const currentStatus = useTimerStore.getState().status;
        
        if (currentStatus === 'scrambling') {
          // Terminé de mezclar físicamente -> Pasar a Listo
          setIdle();
        } else if (currentStatus === 'running') {
          // Abortar el solve a la mitad (DNF o error)
          stopTimer();
        } else if (currentStatus === 'stopped') {
          // Pedir otra mezcla
          generateScramble();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIdle, stopTimer, generateScramble]);

  const formatTime = (ms: number) => (ms / 1000).toFixed(3);

  // Mensajes de ayuda dinámicos según el estado
  const getHelperText = () => {
    switch (status) {
      case 'scrambling': return '🧩 Mezcla tu cubo y presiona ESPACIO cuando estés listo';
      case 'idle': return '🔥 ¡Listo! Haz tu primer giro para iniciar el cronómetro';
      case 'running': return '⏱️ Resolviendo... (Espacio para abortar)';
      case 'stopped': return '✅ ¡Cubo resuelto! Presiona ESPACIO para una nueva mezcla';
      default: return '';
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px', width: '100%' }}>
      <div style={{ fontSize: '24px', color: '#ffcc00', marginBottom: '30px', fontWeight: 'bold', letterSpacing: '1px' }}>
        {scramble}
      </div>
      
      <div style={{ 
        fontSize: '140px', 
        fontWeight: 'bold', 
        fontFamily: 'monospace',
        color: status === 'running' ? '#4caf50' : status === 'idle' ? '#ff3333' : 'white',
        lineHeight: 1,
        transition: 'color 0.2s'
      }}>
        {formatTime(displayTime)}
      </div>

      <div style={{ marginTop: '30px', color: '#888', fontSize: '16px', fontWeight: 'bold' }}>
        {getHelperText()}
      </div>
    </div>
  );
}