import { PiecesEnum } from "../../enums";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate rook moves
export class RookValidator extends ChessPieceValidator  {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const dirs: Pos[] = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    // a rook can move and capture horizontally or vertically across the whole board
    super(validator, PiecesEnum.ROOK, color, dirs, dirs, 7);
  }
}