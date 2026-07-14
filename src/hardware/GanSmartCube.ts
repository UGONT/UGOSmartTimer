import { connectGanCube } from 'gan-web-bluetooth';
import { Subscription } from 'rxjs';
import type { SmartCube } from './SmartCube';

export class GanSmartCube implements SmartCube {
  name: string = 'GAN Smart Cube';
  private rawCube: any = null;
  private moveSubscription: Subscription | null = null;

  async connect(): Promise<void> {
    try {
      // connectGanCube solicita el dispositivo a través de la Web Bluetooth API.
      // ¡Nota! El navegador exige que esto se dispare por una acción directa del usuario (clic).
      // Le pasamos una función asíncrona que ignora el dispositivo (_device) 
// y simplemente devuelve tu MAC estática.
this.rawCube = await connectGanCube(async (_device) => '0C:3D:5E:99:52:8E');
      this.name = this.rawCube.name || 'GAN Smart Cube';
      console.log(`Conectado exitosamente a: ${this.name}`);
    } catch (error) {
      console.error('Error al intentar conectar con el cubo GAN:', error);
      throw error;
    }
  }

  onMove(callback: (move: string) => void): void {
    if (!this.rawCube) {
      console.warn('No hay ningún cubo conectado para escuchar movimientos.');
      return;
    }

    if (this.moveSubscription) {
      this.moveSubscription.unsubscribe();
    }

    // Cambiamos moves$ por events$
    this.moveSubscription = this.rawCube.events$.subscribe({
      next: (event: any) => {
        // Filtramos para reaccionar SOLO cuando el evento es un movimiento
        if (event && event.type === 'MOVE' && typeof event.move === 'string') {
          callback(event.move);
        }
      },
      error: (err: any) => {
        console.error('Error en el flujo de eventos del cubo GAN:', err);
      }
    });
  
  }

  disconnect(): void {
    // 1. Cancelamos la suscripción de RxJS para liberar memoria
    if (this.moveSubscription) {
      this.moveSubscription.unsubscribe();
      this.moveSubscription = null;
    }

    // 2. Desconectamos el dispositivo físicamente si la librería lo permite
    if (this.rawCube) {
      if (typeof this.rawCube.disconnect === 'function') {
        this.rawCube.disconnect();
      }
      this.rawCube = null;
      console.log('Cubo GAN desconectado correctamente.');
    }
  }
}