import { PiecesEnum } from "../../enums";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate queen moves
export class QueenValidator extends ChessPieceValidator  {
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
    // a queen can move and capture in any direction across the whole board
    super(validator, PiecesEnum.QUEEN, color, dirs, dirs, 7);
  }
}