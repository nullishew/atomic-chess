import { PiecesEnum } from "../../enums";
import { ChessColor, FENData, Pos } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";
import { getEnemyColor, isAtomicCheck } from "./AtomicChessValidator";

// base class to validate chess piece moves
export abstract class ChessPieceValidator {
  color: ChessColor;
  moveDirs: Pos[];
  captureDirs: Pos[];
  maxMoveSteps: number;
  type: PiecesEnum;

  constructor(type: PiecesEnum, color: ChessColor, moveDirs: Pos[], captureDirs: Pos[], maxMoveSteps: number) {
    this.type = type;
    this.color = color;
    this.moveDirs = moveDirs;
    this.captureDirs = captureDirs;
    this.maxMoveSteps = maxMoveSteps;
  }

  // returns an array of all possible capture from a given position, including invalid moves that place the King in Atomic check or blow up the king of the same color
  getPossibleCapturesFrom(data: FENData, from: Pos): Pos[] {
    const enemyColor = getEnemyColor(this.color);
    const { position } = data;
    if (position.colorAt(from) != this.color) return [];
    const moves: Pos[] = [];
    const [r, c] = from;
    for (let [dr, dc] of this.captureDirs) {
      for (let i = 1; i <= this.maxMoveSteps; i++) {
        const pos: Pos = [r + i * dr, c + i * dc];
        if (!position.has(pos)) break;
        if (position.emptyAt(pos)) continue;
        if (position.colorAt(pos) != enemyColor) break;
        moves.push(pos);
        break;
      }
    }
    return moves;
  }

  // returns an array of all possible standard moves from a given position, including invalid moves that place the King in Atomic check or blow up the king of the same color
  getPossibleStandardMovesFrom(data: FENData, from: Pos): Pos[] {
    const { position, activeColor } = data;
    if (position.colorAt(from) != activeColor) return [];
    const moves: Pos[] = [];
    const [r, c] = from;
    for (let [dr, dc] of this.moveDirs) {
      for (let i = 1; i <= this.maxMoveSteps; i++) {
        const pos: Pos = [r + i * dr, c + i * dc];
        if (!position.emptyAt(pos)) break;
        moves.push(pos);
      }
    }
    return moves;
  }

  // returns an array of all valid captures from a given position
  getValidCapturesFrom(data: FENData, from: Pos): Pos[] {
    const moves = this.getPossibleCapturesFrom(data, from);
    const { position } = data;
    return moves.filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.capture(from, to);
      return newPosition.indexOfKing(this.color) && !isAtomicCheck(newPosition, this.color);
    })
  }

  // returns an array of all valid standard moves from a given position
  getValidStandardMovesFrom(data: FENData, from: Pos): Pos[] {
    const moves = this.getPossibleStandardMovesFrom(data, from);
    const { position } = data;
    return moves.filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.move(from, to);
      return !isAtomicCheck(newPosition, this.color);
    })
  }

  // returns an array of all valid moves from a given position
  getValidMovesFrom(data: FENData, from: Pos): Pos[] {
    return [
      ...this.getValidCapturesFrom(data, from),
      ...this.getValidStandardMovesFrom(data, from),
    ]
  }

}