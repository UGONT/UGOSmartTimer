import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';

export class VirtualCube {
  private kpuzzle: any = null;
  private currentState: any = null;
  private solvedState: any = null;

  // Carga las matemáticas del 3x3 (se llama una sola vez al conectar)
  async init() {
    if (!this.kpuzzle) {
      this.kpuzzle = await puzzles['3x3x3'].kpuzzle();
      this.solvedState = this.kpuzzle.defaultPattern();
      this.currentState = this.solvedState;
    }
  }

  // Aplica un giro físico al estado virtual
  applyMove(move: string) {
    if (!this.kpuzzle) return;
    try {
      const alg = new Alg(move);
      this.currentState = this.currentState.applyAlg(alg);
    } catch (e) {
      console.warn("Giro no reconocido por el Virtual Cube:", move);
    }
  }

  // Compara el estado actual con el estado resuelto perfecto
  isSolved(): boolean {
    if (!this.currentState || !this.solvedState) return false;
    return this.currentState.isIdentical(this.solvedState);
  }
}

// Exportamos una única instancia (Singleton) para usarla en toda la app
export const virtualCube = new VirtualCube();