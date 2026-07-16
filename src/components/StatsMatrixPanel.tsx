import { useEffect } from 'react';
import { useTimerStore } from '../store/useTimerStore';

export function StatsMatrixPanel() {
  const { stats, loadStats } = useTimerStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const format = (ms: number | null) => ms === null ? '-' : (ms / 1000).toFixed(3);

  const rows = [
    { label: 'Single', current: stats.current.single, best: stats.best.single },
    { label: 'Ao5', current: stats.current.ao5, best: stats.best.ao5 },
    { label: 'Ao12', current: stats.current.ao12, best: stats.best.ao12 },
    { label: 'Ao50', current: stats.current.ao50, best: stats.best.ao50 },
    { label: 'Ao100', current: stats.current.ao100, best: stats.best.ao100 },
  ];

  return (
    <div style={{
      width: '100%',
      backgroundColor: '#1e1e1e',
      borderRadius: '12px',
      border: '1px solid #333',
      padding: '20px',
      height: 'fit-content'
    }}>
      <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', color: '#aaa', fontSize: '16px' }}>Estadísticas</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontFamily: 'monospace', fontSize: '15px' }}>
        <thead>
          <tr>
            <th style={{ color: '#666', paddingBottom: '10px', fontWeight: 'normal' }}></th>
            <th style={{ color: '#4caf50', paddingBottom: '10px' }}>Actual</th>
            <th style={{ color: '#0070f3', paddingBottom: '10px' }}>Mejor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderBottom: '1px solid #2a2a2a' }}>
              <td style={{ color: '#aaa', padding: '12px 0', textAlign: 'left', fontWeight: 'bold' }}>{row.label}</td>
              <td style={{ color: 'white', padding: '12px 0' }}>{format(row.current)}</td>
              <td style={{ color: 'white', padding: '12px 0', fontWeight: 'bold' }}>{format(row.best)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}