import { useTimerStore } from '../store/useTimerStore';

export function HistoryPanel() {
  const solvesList = useTimerStore((state) => state.solvesList);

  return (
    <div style={{
      width: '100%',
      height: '100%', // Ocupa todo el alto que el layout le permita
      backgroundColor: '#1e1e1e',
      borderRadius: '12px',
      border: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Prohibido hacer scroll
    }}>
      <div style={{ padding: '15px', borderBottom: '1px solid #333', fontWeight: 'bold', textAlign: 'center', color: '#aaa' }}>
        Tiempos ({solvesList.length})
      </div>
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', // Corta los elementos extra en lugar de generar barra de scroll
        padding: '10px' 
      }}>
        {/* Mostramos los solves más recientes arriba */}
        {[...solvesList].reverse().map((solve, index) => (
          <div key={solve.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderBottom: '1px solid #2a2a2a',
            fontSize: '15px',
            fontFamily: 'monospace'
          }}>
            <span style={{ color: '#666' }}>{solvesList.length - index}.</span>
            <span style={{ color: 'white', fontWeight: 'bold' }}>{(solve.time / 1000).toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}