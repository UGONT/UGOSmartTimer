import { useTimerStore } from './store/useTimerStore';
import { GanSmartCube } from './hardware/GanSmartCube';
import { TimerDisplay } from './components/TimerDisplay';

function App() {
  const { isConnected, lastMove, activeCube, connectCube, disconnectCube } = useTimerStore();

  const handleConnectGAN = async () => {
    // Instanciamos nuestro adaptador y dejamos que el store gestione el ciclo de vida
    const ganCube = new GanSmartCube();
    await connectCube(ganCube);
  };

  return (
    <div style={{ 
      backgroundColor: '#121212', 
      color: 'white', 
      minHeight: '100vh', 
      padding: '40px 20px', 
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1 style={{ marginBottom: '10px' }}>UGOSmartTimer 🧩</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>Tu espacio de desarrollo listo para hardware interactivo.</p>

      {/* Tarjeta de Conexión */}
      <div style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '20px', 
        borderRadius: '12px', 
        backgroundColor: '#1e1e1e', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        marginBottom: '20px',
        border: '1px solid #333'
      }}>
        <h3 style={{ marginTop: 0 }}>🔗 Estado del Hardware</h3>
        
        {!isConnected ? (
          <div>
            <p style={{ color: '#aaa', fontSize: '14px' }}>Conecta tu dispositivo GAN para comenzar a registrar tus tiempos de forma inteligente.</p>
            <button 
              onClick={handleConnectGAN}
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: '#0070f3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0060df')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0070f3')}
            >
              Conectar Cubo GAN (Bluetooth)
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '15px' }}>
                🟢 Conectado: {activeCube?.name}
              </span>
            </div>
            <button 
              onClick={disconnectCube}
              style={{ 
                width: '100%', 
                padding: '10px', 
                backgroundColor: '#ff3333', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                cursor: 'pointer'
              }}
            >
              Desconectar
            </button>
          </div>
        )}
      </div>

      {/* Tarjeta de Monitoreo de Giros */}
      <TimerDisplay />
    </div>
  );
}

export default App;