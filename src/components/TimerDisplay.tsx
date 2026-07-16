import { useEffect, useState, useRef } from 'react';
import { useTimerStore, getInverseMove } from '../store/useTimerStore';
import { CubeVisualizer } from './CubeVisualizer';

export function TimerDisplay() {
  const { 
    status, startTime, time, scrambleMoves, scrambleIndex, currentFaceProgress, errorStack, solveCount, stopTimer, generateScramble, setIdle 
  } = useTimerStore();
  
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); 
        const currentStatus = useTimerStore.getState().status;
        if (currentStatus === 'scrambling') setIdle();
        else if (currentStatus === 'running') stopTimer();
        else if (currentStatus === 'stopped') generateScramble();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIdle, stopTimer, generateScramble]);

  const formatTime = (ms: number) => (ms / 1000).toFixed(3);

  const renderScrambleArea = () => {
    if (status === 'scrambling' && errorStack.length > 0) {
      const lastError = errorStack[errorStack.length - 1];
      const requiredUndo = getInverseMove(lastError);

      return (
        <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '28px', color: '#ff3333', fontWeight: 'bold', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            ⚠️ ERROR: {errorStack.map((err, i) => (
              <span key={i} style={{ textDecoration: i === errorStack.length - 1 ? 'underline' : 'none' }}>
                {err} {i < errorStack.length - 1 ? '➔' : ''}
              </span>
            ))}
          </div>
          <p style={{ margin: '8px 0 0 0', color: '#ffaaaa', fontSize: '14px', fontWeight: 'bold' }}>
            Deshaz el último giro haciendo: <span style={{ backgroundColor: '#ff3333', color: 'white', padding: '3px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '16px' }}>{requiredUndo}</span>
          </p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', fontSize: '26px', fontWeight: 'bold', minHeight: '80px', alignItems: 'center', padding: '0 20px' }}>
        {scrambleMoves.map((move, index) => {
          let color = '#444444';
          let borderBottom = 'none';

          if (status === 'scrambling') {
            if (index < scrambleIndex) {
              color = '#4caf50'; 
            } else if (index === scrambleIndex) {
              if (currentFaceProgress !== 0) {
                color = '#ff9800'; 
                borderBottom = '3px dashed #ff9800';
              } else {
                color = '#ffcc00'; 
                borderBottom = '3px solid #ffcc00';
              }
            }
          } else {
            color = '#ffcc00'; 
          }

          return (
            <span key={index} style={{ color, borderBottom, paddingBottom: '2px', transition: 'all 0.2s ease', display: 'inline-block' }}>
              {move}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <CubeVisualizer />
      
      {/* NÚMERO DE RESOLUCIÓN PÁLIDO */}
      <div style={{ color: '#555', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
         #{status === 'scrambling' ? solveCount + 1 : solveCount}
      </div>

      <div style={{ marginBottom: '40px' }}>{renderScrambleArea()}</div>
      
      <div style={{ fontSize: '140px', fontWeight: 'bold', fontFamily: 'monospace', color: status === 'running' ? '#4caf50' : status === 'idle' ? '#ff3333' : 'white', lineHeight: 1, transition: 'color 0.2s' }}>
        {formatTime(displayTime)}
      </div>
      
      <div style={{ marginTop: '40px', color: '#aaa', fontSize: '16px', fontWeight: '500' }}>
        {status === 'scrambling' ? '🧩 Sigue la mezcla en pantalla' : status === 'idle' ? '🔥 ¡Mezclado! Haz tu primer giro para arrancar' : status === 'running' ? '⏱️ Resolviendo... se detendrá automáticamente' : '✅ ¡Excelente tiempo! Gira tu cubo armado o presiona ESPACIO para otra mezcla'}
      </div>
    </div>
  );
}