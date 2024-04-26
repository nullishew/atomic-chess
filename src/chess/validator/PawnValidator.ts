import { PiecesEnum } from "../../enums";
import { ChessColor, Pos, FENData, equals } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";
import { isAtomicCheck } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to validate pawn moves
export class PawnValidator extends ChessPieceValidator {
  constructor(color: ChessColor) {
    const moveDir = [-1, 1][color];
    const moveDirs: Pos[] = [
      [moveDir, 0]
    ];
    const captureDirs: Pos[] = [
      [moveDir, -1],
      [moveDir, 1],
    ];
    // a pawn can move in one direction and capture diagonally in radius one except if the pawn has not previously moved, in which case the pawn can move two tiles
    super(PiecesEnum.PAWN, color, moveDirs, captureDirs, 1);
  }

  get startingRank() { return [6, 1][this.color] } // get the starting rank of all pawns of a given color
  get moveDir(): number { return this.moveDirs[0][0] } // get the direction the pawn moves in (pawns can only move forward)

  // returns an array of all possible instances where a pawn moves two tiles from a given position, including invalid moves that place the King in Atomic check or blow up the king of the same color
  getPossibleDoubleMovesFrom(data: FENData, from: Pos): Pos[] {
    const { position } = data;
    const [r, c] = from;
    const to: Pos = [r + 2 * this.moveDir, c];
    return this.getPossibleStandardMovesFrom(data, from).length && r == this.startingRank && position.emptyAt(to) ? [to] : [];
  }

  // returns an array of all possible en passants from a given position, including invalid moves that place the King in Atomic check or blow up the king of the same color
  getPossibleEnPassantFrom(data: FENData, from: Pos): Pos[] {
    const [r, c] = from;
    return this.captureDirs.map(([dr, dc]) => [r + dr, c + dc] as Pos)
      .filter(to => data.enPassants.some(p => equals(to, p)));
  }

  // returns an array of all valid instances where a pawn moves two tiles from a given position
  getValidDoubleMovesFrom(data: FENData, from: Pos): Pos[] {
    const { position } = data;
    return this.getPossibleDoubleMovesFrom(data, from).filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.move(from, to);
      return !isAtomicCheck(newPosition, this.color);
    });
  }

  // returns an array of all valid en passants from a given position
  getValidEnPassantsFrom(data: FENData, from: Pos): Pos[] {
    const { position } = data;
    return this.getPossibleEnPassantFrom(data, from).filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.enPassant(from, to);
      return newPosition.indexOfKing(this.color) && !isAtomicCheck(newPosition, this.color);
    });
  }

  // returns an array of all valid moves from a given position
  override getValidMovesFrom(data: FENData, from: Pos): Pos[] {
    return [
      ...this.getValidCapturesFrom(data, from),
      ...this.getValidDoubleMovesFrom(data, from),
      ...this.getValidEnPassantsFrom(data, from),
      ...this.getValidStandardMovesFrom(data, from),
    ];
  }

}