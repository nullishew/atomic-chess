import { PiecesEnum } from "../../enums";
import { equals } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate pawn moves
export class PawnValidator extends ChessPieceValidator {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const moveDir = [-1, 1][color];
    const moveDirs: Pos[] = [
      [moveDir, 0]
    ];
    const captureDirs: Pos[] = [
      [moveDir, -1],
      [moveDir, 1],
    ];
    // a pawn can move in one direction and capture diagonally in radius one except if the pawn has not previously moved, in which case the pawn can move two tiles
    super(validator, PiecesEnum.PAWN, color, moveDirs, captureDirs, 1);
  }

  get startingRank() { return [6, 1][this.color] } // get the starting rank of all pawns of a given color
  get moveDir(): number { return this.moveDirs[0][0] } // get the direction the pawn moves in (pawns can only move forward)

  // returns an array of all possible instances where a pawn moves two tiles from a given position, including invalid moves that place the King in Atomic check or blow up the king of the same color
  possibleDoubleMovesFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    const [r, c] = from;
    const to: Pos = [r + 2 * this.moveDir, c];
    return this.possibleStandardMovesFrom(from).length && r == this.startingRank && position.emptyAt(to) ? [to] : [];
  }

  // returns an array of all possible en passants from a given position, including invalid moves that place the King in Atomic check or blow up the king of the same color
  possibleEnPassantFrom(from: Pos): Pos[] {
    const [r, c] = from;
    return this.captureDirs.map(([dr, dc]) => [r + dr, c + dc] as Pos)
      .filter(to => this.validator.data.enPassants.some(p => equals(to, p)));
  }

  // returns an array of all valid instances where a pawn moves two tiles from a given position
  validDoubleMovesFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    return this.possibleDoubleMovesFrom(from).filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.move(from, to);
      return !this.validator.isAtomicCheck(this.color, newPosition);
    });
  }

  // returns an array of all valid en passants from a given position
  validEnPassantsFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    return this.possibleEnPassantFrom(from).filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.enPassant(from, to);
      return newPosition.indexOfKing(this.color) && !this.validator.isAtomicCheck(this.color, newPosition);
    });
  }

  // returns an array of all valid moves from a given position
  override validMovesFrom(from: Pos): Pos[] {
    return [
      ...this.validCapturesFrom(from),
      ...this.validDoubleMovesFrom(from),
      ...this.validEnPassantsFrom(from),
      ...this.validStandardMovesFrom(from),
    ];
  }

}