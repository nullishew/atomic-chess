import { PiecesEnum } from "../../enums";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate knight moves
export class KnightValidator extends ChessPieceValidator  {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const dirs: Pos[] = [
      [1, 2],
      [2, 1],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-2, 1],
      [-1, 2],
    ];
    // A knight can capture and move in an L shape (1 tile in any direction and 2 tiles in another direction) once in any given move
    super(validator, PiecesEnum.KNIGHT, color, dirs, dirs, 1);
  }
}