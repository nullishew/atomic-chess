import { PiecesEnum } from "../../enums";
import { equals } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate king moves
export class KingValidator extends ChessPieceValidator {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const dirs: Pos[] = [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ];
    // in atomic chess the king can move one tile in any direction but cannot capture
    super(validator, PiecesEnum.KING, color, dirs, [], 1);
  }

  get backRank() { return [7, 0][this.color] } // returns the location of the back rank
  get startingPos() { return [this.backRank, 4] as Pos } // returns the starting position of the king

  // returns an array of all valid kingside castles from a given position
  validCastleKingsideFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    if (!this.validator.data.canCastle[this.color].kingside || !equals(from, this.startingPos) || this.validator.isAtomicCheck(this.color, position)) return [];
    const positions: Pos[] = [
      [this.backRank, 5],
      [this.backRank, 6],
    ];
    if (!positions.every(p => position.emptyAt(p))) return [];
    const newPosition = new ChessPosition(position.state);
    newPosition.castleKingside(this.color);
    if (this.validator.isAtomicCheck(this.color, newPosition)) return [];
    return [[this.backRank, 6]];
  }

  // returns an array of all valid queenside castles from a given position
  validCastleQueensideFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    if (!this.validator.data.canCastle[this.color].queenside || !equals(from, this.startingPos) || this.validator.isAtomicCheck(this.color, position)) return [];
    const positions: Pos[] = [
      [this.backRank, 1],
      [this.backRank, 2],
      [this.backRank, 3],
    ];
    if (!positions.every(p => position.emptyAt(p))) return [];
    const newPosition = new ChessPosition(position.state);
    newPosition.castleQueenside(this.color);
    if (this.validator.isAtomicCheck(this.color, newPosition)) return [];
    return [[this.backRank, 2]];
  }

  // returns an array of all valid moves from a given position
  override validMovesFrom(from: Pos): Pos[] {
    return [
      ...this.validCastleKingsideFrom(from),
      ...this.validCastleQueensideFrom(from),
      ...this.validStandardMovesFrom(from),
    ];
  }

}