import { PiecesEnum } from "../enums";

export class ChessPosition {
  #state: ChessPositionArrayNotation;

  constructor(state: ChessPositionArrayNotation) {
    this.#state = state;
  }

  get state() { return this.#state.map(row => row.slice()) as ChessPositionArrayNotation }

  at([r, c]: Pos): PieceNotation | null {
    return this.#state?.[r]?.[c];
  }

  colorAt([r, c]: Pos): ChessColor | null {
    const piece = this.at([r, c]);
    if (!piece) return null;
    return piece.toUpperCase() == piece ? 0 : 1;
  }

  emptyAt = (pos: Pos) => this.has(pos) && !this.at(pos);

  has([r, c]: Pos) {
    return 0 <= r && r < 8 && 0 <= c && c < 8;
  }

  indexOfKing(color: ChessColor): Pos | null {
    const piece = 'Kk'[color];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.#state[r][c] == piece) {
          return [r, c];
        }
      }
    }
    return null;
  }

  isAdjacent(p1: Pos, p2: Pos) {
    if (!this.has(p1) || !this.has(p2)) return false;
    const [r1, c1] = p1;
    const [r2, c2] = p2;
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
  }

  typeAt([r, c]: Pos) {
    return this.#state?.[r]?.[c]?.toUpperCase() as PiecesEnum;
  }

  setAt([r, c]: Pos, piece: PieceNotation | null) {
    this.#state[r][c] = piece;
  }

  capture(from: Pos, to: Pos) {
    this.explode(to);
    this.explode(from);
    this.explodeArea(to);
  }

  castleKingside(color: ChessColor) {
    const r = [7, 0][color];
    this.move([r, 4], [r, 6]);
    this.move([r, 7], [r, 5]);
  }

  castleQueenside(color: ChessColor) {
    const r = [7, 0][color];
    this.move([r, 4], [r, 2]);
    this.move([r, 0], [r, 3]);
  }

  enPassant(from: Pos, to: Pos) {
    const r1 = from[0];
    const c2 = to[1];
    this.explode([r1, c2]);
    this.explode(from);
    this.explodeArea(to);
  }

  move(from: Pos, to: Pos) {
    this.setAt(to, this.at(from));
    this.setAt(from, null);
  }

  explode(pos: Pos) {
    this.setAt(pos, null);
  }

  explodeArea([r, c]: Pos) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const pos: Pos = [r + dr, c + dc];
        if (!this.has(pos) || this.emptyAt(pos) || this.typeAt(pos) == PiecesEnum.PAWN) continue;
        this.explode(pos);
      }
    }
  }



}