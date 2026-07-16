import { useEffect, useRef } from 'react';
import 'cubing/twisty';
import { useTimerStore } from '../store/useTimerStore';

const TwistyPlayer = 'twisty-player' as any;

export function CubeVisualizer() {
  const moveHistory = useTimerStore((state) => state.moveHistory);
  const twistyRef = useRef<any>(null);

  // Sincronizar únicamente las piezas físicas (giros)
  useEffect(() => {
    if (twistyRef.current) {
      twistyRef.current.alg = moveHistory.join(' ');
      twistyRef.current.timestamp = 'end';
    }
  }, [moveHistory]);

  return (
    <div style={{ width: '250px', height: '250px', margin: '0 auto 30px auto' }}>
      <TwistyPlayer 
        ref={twistyRef}
        puzzle="3x3x3"
        control-panel="none"
        background="none"
        viewer-link="none"
        hint-facelets="none"
        // Ángulos fijos perfectos para visibilidad
        camera-latitude="30"
        camera-longitude="45"
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}