import { useTimerStore } from './store/useTimerStore';
import { GanSmartCube } from './hardware/GanSmartCube';
import { TimerDisplay } from './components/TimerDisplay';
import { HistoryPanel } from './components/HistoryPanel';
import { StatsMatrixPanel } from './components/StatsMatrixPanel';

function App() {
  const { isConnected, activeCube, connectCube, disconnectCube } = useTimerStore();

  const handleConnectGAN = async () => {
    const ganCube = new GanSmartCube();
    await connectCube(ganCube);
  };

  return (
    <div style={{ 
      backgroundColor: '#121212', 
      color: 'white', 
      height: '100vh', // Forzamos el alto estricto de la pantalla
      width: '100vw', // Forzamos el ancho estricto
      boxSizing: 'border-box',
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Evita barras de scroll en toda la ventana
    }}>
      
      {/* Cabecera del hardware */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px 30px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>UGOSmartTimer 🧩</h2>
        
        {!isConnected ? (
          <button onClick={handleConnectGAN} style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Conectar Cubo GAN
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '14px' }}>🟢 {activeCube?.name}</span>
            <button onClick={disconnectCube} style={{ padding: '8px 15px', backgroundColor: '#ff3333', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Desconectar
            </button>
          </div>
        )}
      </div>

      {/* Grid Principal - Estirado a los bordes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr 300px', // Ancho de las columnas (ajusta si las quieres más anchas)
        gap: '40px', // Separación considerable para que el centro respire
        alignItems: 'start',
        width: '100%',
        flex: 1, // Toma todo el alto sobrante de la pantalla
        minHeight: 0 // Truco de Flexbox para que los hijos respeten el límite
      }}>
        
        {/* Panel Izquierdo (Estirado hasta abajo) */}
        <div style={{ height: '100%' }}>
          <HistoryPanel />
        </div>

        {/* Temporizador Central */}
        <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center' }}>
          <TimerDisplay />
        </div>

        {/* Panel Derecho (Se ajusta a su propio contenido) */}
        <StatsMatrixPanel />

      </div>
    </div>
  );
}

export default App;