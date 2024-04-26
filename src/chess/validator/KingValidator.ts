import { PiecesEnum } from "../../enums";
import { ChessColor, FENData, Pos, equals } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";
import { isAtomicCheck } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate king moves
export class KingValidator extends ChessPieceValidator {
  constructor(color: ChessColor) {
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
    super(PiecesEnum.KING, color, dirs, [], 1);
  }

  get backRank() { return [7, 0][this.color] } // returns the location of the back rank
  get startingPos() { return [this.backRank, 4] as Pos } // returns the starting position of the king

  // returns an array of all valid kingside castles from a given position
  getValidKingsideCastlesFrom(data: FENData, from: Pos): Pos[] {
    const { position } = data;
    if (!data.canCastle[this.color].kingside || !equals(from, this.startingPos) || isAtomicCheck(position, this.color)) return [];
    const positions: Pos[] = [
      [this.backRank, 5],
      [this.backRank, 6],
    ];
    if (!positions.every(p => position.emptyAt(p))) return [];
    const newPosition = new ChessPosition(position.state);
    newPosition.castleKingside(this.color);
    if (isAtomicCheck(newPosition, this.color)) return [];
    return [[this.backRank, 6]];
  }

  // returns an array of all valid queenside castles from a given position
  getValidQueensideCastleFrom(data: FENData, from: Pos): Pos[] {
    const { position } = data;
    if (!data.canCastle[this.color].queenside || !equals(from, this.startingPos) || isAtomicCheck(position, this.color)) return [];
    const positions: Pos[] = [
      [this.backRank, 1],
      [this.backRank, 2],
      [this.backRank, 3],
    ];
    if (!positions.every(p => position.emptyAt(p))) return [];
    const newPosition = new ChessPosition(position.state);
    newPosition.castleQueenside(this.color);
    if (isAtomicCheck(newPosition, this.color)) return [];
    return [[this.backRank, 2]];
  }

  // returns an array of all valid moves from a given position
  override getValidMovesFrom(data: FENData, from: Pos): Pos[] {
    return [
      ...this.getValidKingsideCastlesFrom(data, from),
      ...this.getValidQueensideCastleFrom(data, from),
      ...this.getValidStandardMovesFrom(data, from),
    ];
  }

}