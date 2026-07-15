import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';

export class VirtualCube {
  private kpuzzle: any = null;
  private currentState: any = null;
  private solvedState: any = null;

  async init() {
    if (!this.kpuzzle) {
      this.kpuzzle = await puzzles['3x3x3'].kpuzzle();
      this.solvedState = this.kpuzzle.defaultPattern();
      this.currentState = this.solvedState;
    }
  }

  // NUEVO: Resetea la memoria matemática del cubo
  reset() {
    if (this.solvedState) {
      this.currentState = this.solvedState;
    }
  }

  applyMove(move: string) {
    if (!this.kpuzzle) return;
    try {
      const alg = new Alg(move);
      this.currentState = this.currentState.applyAlg(alg);
    } catch (e) {
      console.warn("Giro no reconocido por el Virtual Cube:", move);
    }
  }

  isSolved(): boolean {
    if (!this.currentState || !this.solvedState) return false;
    return this.currentState.isIdentical(this.solvedState);
  }
}

export const virtualCube = new VirtualCube();