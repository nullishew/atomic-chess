import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPosition } from "../ChessPosition";
import { PiecesEnum } from "../../enums";

export abstract class ChessPieceValidator {
  validator: AtomicChessValidator;
  color: ChessColor;
  moveDirs: Pos[];
  captureDirs: Pos[];
  maxMoveSteps: number;
  type: PiecesEnum;

  constructor(validator: AtomicChessValidator, type: PiecesEnum, color: ChessColor, moveDirs: Pos[], captureDirs: Pos[], maxMoveSteps: number) {
    this.validator = validator;
    this.type = type;
    this.color = color;
    this.moveDirs = moveDirs;
    this.captureDirs = captureDirs;
    this.maxMoveSteps = maxMoveSteps;
  }

  get enemyColor() { return [1, 0][this.color] }

  possibleCapturesFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    if (position.colorAt(from) != this.color) return [];
    const moves: Pos[] = [];
    const [r, c] = from;
    for (let [dr, dc] of this.captureDirs) {
      for (let i = 1; i <= this.maxMoveSteps; i++) {
        const pos: Pos = [r + i * dr, c + i * dc];
        if (!position.has(pos)) break;
        if (position.emptyAt(pos)) continue;
        if (position.colorAt(pos) != this.enemyColor) break;
        moves.push(pos);
        break;
      }
    }
    return moves;
  }

  possibleStandardMovesFrom(from: Pos): Pos[] {
    const { position, activeColor } = this.validator.data;
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

  validCapturesFrom(from: Pos): Pos[] {
    const moves = this.possibleCapturesFrom(from);
    const { position } = this.validator.data;
    return moves.filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.capture(from, to);
      return newPosition.indexOfKing(this.color) && !this.validator.isAtomicCheck(this.color, newPosition);
    })
  }

  validStandardMovesFrom(from: Pos): Pos[] {
    const moves = this.possibleStandardMovesFrom(from);
    const { position } = this.validator.data;
    return moves.filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.move(from, to);
      return !this.validator.isAtomicCheck(this.color, newPosition);
    })
  }

  validMovesFrom(from: Pos): Pos[] {
    return [
      ...this.validCapturesFrom(from),
      ...this.validStandardMovesFrom(from),
    ]
  }

}