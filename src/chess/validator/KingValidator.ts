import { PiecesEnum } from "../../enums";
import { equals } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

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
    super(validator, PiecesEnum.KING, color, dirs, [], 1);
  }

  get backRank() { return [7, 0][this.color] }
  get canCastle() { return this.validator.data.canCastle[this.color] }
  get startingPos() { return [this.backRank, 4] as Pos }

  validCastleKingsideFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    if (!this.canCastle.kingside || !equals(from, this.startingPos) || this.validator.isAtomicCheck(this.color, position)) return [];
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

  validCastleQueensideFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    if (!this.canCastle.queenside || !equals(from, this.startingPos) || this.validator.isAtomicCheck(this.color, position)) return [];
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

  override validMovesFrom(from: Pos): Pos[] {
    return [
      ...this.validCastleKingsideFrom(from),
      ...this.validCastleQueensideFrom(from),
      ...this.validStandardMovesFrom(from),
    ];
  }

}