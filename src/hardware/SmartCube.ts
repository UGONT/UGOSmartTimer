export interface SmartCube {
  // El nombre del cubo (ej. "GAN 356 i3" o "QiYi Smart Cube")
  name: string;
  
  // Métodos básicos que todo cubo debe poder hacer
  connect(): Promise<void>;
  disconnect(): void;
  
  // Un método al que le pasaremos una función para que se ejecute 
  // cada vez que el jugador gire una cara del cubo.
  onMove(callback: (move: string) => void): void;

  onGyro(callback: (orientation: { x: number; y: number; z: number }) => void): void;
}