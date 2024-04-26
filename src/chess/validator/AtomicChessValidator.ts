import { FENData, equals } from "../AtomicChess";
import { BishopValidator } from "./BishopValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";
import { ChessPosition } from "../ChessPosition";
import { KingValidator } from "./KingValidator";
import { KnightValidator } from "./KnightValidator";
import { PawnValidator } from "./PawnValidator";
import { QueenValidator } from "./QueenValidator";
import { RookValidator } from "./RookValidator";

// Validator to validate chess moves
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

  // return a list of all valid moves from a given location on the chessboard
  validMovesFrom(from: Pos): Pos[] {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece) return [];
    if (position.colorAt(from) != activeColor) return [];
    return this.pieceValidators[piece].validMovesFrom(from);
  }

  // validate a given pawn promotion
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

  // validate a given standard move (A move that is not castling, capturing, or moving the pawn two tiles)
  isValidStandardMove(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator.validStandardMovesFrom(from).some(p => equals(p, to));
  }

  // validate a given capture
  isValidCapture(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator.validCapturesFrom(from).some(p => equals(p, to));
  }

  // validate a given pawn moving two tiles
  isValidDoubleMove(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator instanceof PawnValidator && validator.validDoubleMovesFrom(from).some(p => equals(p, to));
  }

  // validate a given en passant
  isValidEnPassant(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator instanceof PawnValidator && validator.validEnPassantsFrom(from).some(p => equals(p, to));
  }

  // validate a given kingside castle
  isValidCastleKingside(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator instanceof KingValidator && validator.validCastleKingsideFrom(from).some(p => equals(p, to));
  }

  // validate a given queenside castle
  isValidCastleQueenside(from: Pos, to: Pos): boolean {
    const { position, activeColor } = this.data;
    const piece = position.at(from);
    if (!piece || position.colorAt(from) != activeColor) return false;
    const validator = this.pieceValidators[piece];
    return validator instanceof KingValidator && validator.validCastleQueensideFrom(from).some(p => equals(p, to));
  }

  // check if a given color is in atomic check in a given position
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

  // return a list of all valid moves for a player of the given color
  validMovesForPlayer(color: ChessColor) {
    const { position } = this.data;
    return position.state.map((row, r) => row.map(
      (_, c) => [r, c] as Pos
    )).flat()
      .filter(p => position.colorAt(p) == color)
      .map(p => this.validMovesFrom(p))
      .flat();
  }

  // check if the given color is in atomic checkmate
  isCheckMate(color: ChessColor) {
    return this.isAtomicCheck(color, this.data.position) && !this.validMovesForPlayer(color).length;
  }

  // check if the given color is in atomic stalemate
  isStaleMate(color: ChessColor) {
    return !this.isAtomicCheck(color, this.data.position) && !this.validMovesForPlayer(color).length;
  }



}