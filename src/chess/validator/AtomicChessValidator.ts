import { FENData, equals } from "../AtomicChess";
import { BishopValidator } from "./BishopValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";
import { ChessPosition } from "../ChessPosition";
import { KingValidator } from "./KingValidator";
import { KnightValidator } from "./KnightValidator";
import { PawnValidator } from "./PawnValidator";
import { QueenValidator } from "./QueenValidator";
import { RookValidator } from "./RookValidator";

export class AtomicChessValidator {
  pieceValidators: Record<PieceNotation, ChessPieceValidator>;
  data: FENData;

  constructor(data: FENData) {
    this.data = data;

    this.pieceValidators = {
      'K': new KingValidator(this, 0),
      'Q': new QueenValidator(this, 0),
      'B': new BishopValidator(this, 0),
      'N': new KnightValidator(this, 0),
      'R': new RookValidator(this, 0),
      'P': new PawnValidator(this, 0),
      'k': new KingValidator(this, 1),
      'q': new QueenValidator(this, 1),
      'b': new BishopValidator(this, 1),
      'n': new KnightValidator(this, 1),
      'r': new RookValidator(this, 1),
      'p': new PawnValidator(this, 1),
    }
  }

  validMovesFrom(from: Pos): Pos[] {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece) return [];
    if (position.colorAt(from) != activeColor) return [];
    return this.pieceValidators[piece].validMovesFrom(from);
  }

  isPawnPromotion(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece) return false;
    const color = position.colorAt(from);
    if (color != activeColor) return false;
    const validator = this.pieceValidators[piece];
    if (!(validator instanceof PawnValidator)) return false;
    const r = to[0];
    return [0, 7][color] == r;
  }

  isValidStandardMove(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator.validStandardMovesFrom(from).some(p => equals(p, to));
  }

  isValidCapture(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator.validCapturesFrom(from).some(p => equals(p, to));
  }

  isValidDoubleMove(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator instanceof PawnValidator && validator.validDoubleMovesFrom(from).some(p => equals(p, to));
  }

  isValidEnPassant(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator instanceof PawnValidator && validator.validEnPassantsFrom(from).some(p => equals(p, to));
  }

  isValidCastleKingside(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator instanceof KingValidator && validator.validCastleKingsideFrom(from).some(p => equals(p, to));
  }

  isValidCastleQueenside(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator instanceof KingValidator && validator.validCastleQueensideFrom(from).some(p => equals(p, to));
  }

  isAtomicCheck(color: ChessColor, position: ChessPosition) {
    const enemyColor = [1, 0][color] as ChessColor;
    const kingPos = position.indexOfKing(color);
    const enemyKingPos = position.indexOfKing(enemyColor);
    if (!kingPos || !enemyKingPos) return false;
    if (position.isAdjacent(kingPos, enemyKingPos)) return false;
    const validators = Object.values(this.pieceValidators).filter(validator => validator.color != color);
    for (let { captureDirs, maxMoveSteps, type } of validators) {
      const [r, c] = kingPos;
      for (let [dr, dc] of captureDirs) {
        for (let i = 1; i <= maxMoveSteps; i++) {
          const pos: Pos = [r - i * dr, c - i * dc];
          if (!position.has(pos)) break;
          if (position.emptyAt(pos)) continue;
          if (position.colorAt(pos) != enemyColor || position.typeAt(pos) != type) break;
          return true;
        }
      }
    }
    return false;
  }

  validMovesForPlayer(color: ChessColor) {
    const { position } = this.data;
    return position.state.map((row, r) => row.map(
      (_, c) => [r, c] as Pos
    )).flat()
      .filter(p => position.colorAt(p) == color)
      .map(p => this.validMovesFrom(p))
      .flat();
  }

  isCheckMate(color: ChessColor) {
    return this.isAtomicCheck(color, this.data.position) && !this.validMovesForPlayer(color).length;
  }

  isStaleMate(color: ChessColor) {
    return !this.isAtomicCheck(color, this.data.position) && !this.validMovesForPlayer(color).length;
  }



}